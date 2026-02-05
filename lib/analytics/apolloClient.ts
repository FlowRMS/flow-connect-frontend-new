"use client";

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { isUserNotFoundError, triggerGlobalUnauthorized } from "@/components/lib/unauthorized-handler";

// Token cache for WorkOS tokens
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getWorkOSToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // Use cached token if still valid (with 30 second buffer)
  if (cachedToken && Date.now() < tokenExpiry - 30000) {
    return cachedToken;
  }

  try {
    const response = await fetch("/api/auth/token");
    if (!response.ok) {
      cachedToken = null;
      return null;
    }
    const data = await response.json();
    cachedToken = data.accessToken;
    // Token expires in 5 minutes
    tokenExpiry = Date.now() + 5 * 60 * 1000;
    return cachedToken;
  } catch (error) {
    console.error("[Analytics Apollo] Failed to get token:", error);
    cachedToken = null;
    return null;
  }
}

export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}

// Primary GraphQL endpoint for analytics/reports
// TEMPORARY: Using separate report API endpoint
// TO REVERT: Change back to process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL
const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_REPORT_GRAPHQL_URL_TEMP || process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL || "https://staging.v6.api.flowrms.com/graphql",
  fetchOptions: {
    mode: 'cors',
  },
});

// ============================================================================
// TEMPORARY: CRM Apollo Client for Analytics module
// Used for CRM-specific queries (userSearch, findCustomerByCompanyName, etc.)
// that need to go to the CRM backend, not the Report API
// TO REVERT: Delete this entire crmHttpLink and crmClient section
// ============================================================================
const crmHttpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_FLOWCRM_GRAPHQL_URL || "https://staging.v6.api.flowrms.com/graphql",
  fetchOptions: {
    mode: 'cors',
  },
});

// Error link to handle UserNotFoundError globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorLink = onError(({ graphQLErrors }: any) => {
  if (graphQLErrors && isUserNotFoundError(graphQLErrors)) {
    clearTokenCache();
    if (typeof window !== 'undefined') {
      triggerGlobalUnauthorized();
    }
  }
});

// Auth link that adds WorkOS token to requests
const authLink = new ApolloLink((operation, forward) => {
  // Skip auth on server-side rendering
  if (typeof window === "undefined") {
    return forward(operation);
  }

  return new Observable((observer) => {
    getWorkOSToken()
      .then((token) => {
        if (token) {
          operation.setContext(({ headers = {} }: { headers?: Record<string, string> }) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${token}`,
            },
          }));
        }
        return forward(operation);
      })
      .then((observable) => {
        if (observable) {
          observable.subscribe({
            next: observer.next.bind(observer),
            error: (networkError: Error & { statusCode?: number }) => {
              // Log auth errors but don't redirect - CRM middleware handles auth
              if (networkError?.statusCode === 401 || networkError?.statusCode === 403) {
                console.warn("[Analytics Apollo] Unauthorized access", networkError);
                clearTokenCache();
              }
              observer.error(networkError);
            },
            complete: observer.complete.bind(observer),
          });
        }
      })
      .catch((err) => {
        console.error("[Analytics Apollo] Token error:", err);
        observer.error(err);
      });
  });
});

const link = ApolloLink.from([errorLink, authLink, httpLink]);

const cache = new InMemoryCache({
  typePolicies: {
    Subscription: {
      fields: {
        getReport: {
          merge(_existing: unknown, incoming: unknown) {
            return incoming;
          },
        },
      },
    },
  },
});

const client = new ApolloClient({
  link,
  cache,
});

// ============================================================================
// TEMPORARY: CRM Client for Analytics (for user/entity lookups)
// TO REVERT: Delete this crmClient and its export
// ============================================================================
const crmLink = ApolloLink.from([errorLink, authLink, crmHttpLink]);

const crmClient = new ApolloClient({
  link: crmLink,
  cache: new InMemoryCache(),
});

export default client;
export { client };
export { client as apolloClient };
// TEMPORARY: Export CRM client for user/entity searches in Analytics
// TO REVERT: Delete this export
export { crmClient };

"use client";

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
} from "@apollo/client";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";
import { getValidAccessToken, clearTokens } from "@/lib/analytics/tokenManager";
import { triggerReportCacheClear } from "./reportCacheControl";

// Primary endpoint for most operations (flow-py-report)
const uploadLink = new UploadHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_HTTP,
  fetchOptions: {
    mode: 'cors',
  },
});

// Secondary endpoint for user/customer/factory queries (production2)
// Using Next.js API proxy to avoid CORS issues
const production2Link = new HttpLink({
  uri: "/api/graphql-proxy",
  fetchOptions: {
    mode: 'cors',
  },
});

// Hive endpoint for flow-py-crm queries (factorySearch, etc.)
const hiveLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "https://hive.flowrms.com/graphql",
  fetchOptions: {
    mode: 'cors',
  },
});

// Operations that should route to Hive (flow-py-crm)
const HIVE_OPERATIONS = [
  'FactorySearch',
];

// Operations that should route to production2
const PRODUCTION2_OPERATIONS = [
  'FindAllUser',
  'FindCustomerByCompanyName',
  'FindFactoryByTitle',
];

// Routing link to direct queries to the appropriate endpoint
const routingLink = ApolloLink.split(
  (operation) => {
    return HIVE_OPERATIONS.includes(operation.operationName);
  },
  hiveLink, // If true, use Hive
  ApolloLink.split(
    (operation) => {
      return PRODUCTION2_OPERATIONS.includes(operation.operationName);
    },
    production2Link, // If true, use production2
    uploadLink // Default: use primary endpoint (flow-py-report)
  )
);

const authLink = new ApolloLink((operation, forward) => {
  // Skip auth on server-side rendering
  if (typeof window === "undefined") {
    return forward(operation);
  }

  return new Observable((observer) => {
    getValidAccessToken()
      .then((token) => {
        if (token) {
          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${token}`,
            },
          }));
        }
        return forward(operation);
      })
      .then((observable) => {
        observable.subscribe({
          next: observer.next.bind(observer),
          error: (networkError) => {
            // Log auth errors but don't redirect - CRM middleware handles auth
            if (networkError?.statusCode === 401 || networkError?.statusCode === 403) {
              console.warn("[Apollo Auth] Unauthorized access", networkError);
              clearTokens();
              triggerReportCacheClear();
            }
            observer.error(networkError);
          },
          complete: observer.complete.bind(observer),
        });
      })
      .catch((err) => {
        console.error("[Apollo Auth] Token error:", err);
        // Clear tokens but don't redirect - let error propagate
        clearTokens();
        triggerReportCacheClear();
        observer.error(err);
      });
  });
});

const link = ApolloLink.from([authLink, routingLink]);

const cache = new InMemoryCache({
  typePolicies: {
    Subscription: {
      fields: {
        getReport: {
          merge(_existing, incoming) {
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

export default client;
export { client };
export { client as apolloClient };


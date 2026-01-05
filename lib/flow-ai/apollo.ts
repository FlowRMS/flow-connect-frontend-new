"use client";

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  split,
  Observable,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// Use the GraphQL proxy that handles cookie-based authentication
const GRAPHQL_PROXY = "/api/flow-ai/graphql";
const GRAPHQL_WS_URL = process.env.NEXT_PUBLIC_FLOWRMS_WS_URL || "wss://staging.v6.api.flowrms.com/graphql";

console.log('🔧 Apollo Client configured with:');
console.log('   HTTP:', GRAPHQL_PROXY);
console.log('   WebSocket:', GRAPHQL_WS_URL);

// Track retry attempts to prevent infinite loops
const retryAttempts = new Map<string, number>();
const MAX_RETRIES = 1;
const RETRY_DELAY = 1000; // 1 second

// Error link to handle authentication failures with retry logic
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }: any) => {
  const operationName = operation.operationName || 'unnamed';
  
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // Check for authentication errors
      if (
        err.message?.toLowerCase().includes('unauthorized') ||
        err.message?.toLowerCase().includes('unauthenticated') ||
        err.message?.toLowerCase().includes('no authentication tokens') ||
        err.extensions?.code === 'UNAUTHENTICATED'
      ) {
        // Check if this is the first attempt (might be cookie propagation delay)
        const retries = retryAttempts.get(operationName) || 0;
        
        if (retries < MAX_RETRIES) {
          console.warn(`🔄 Auth error on ${operationName}, retrying in ${RETRY_DELAY}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
          retryAttempts.set(operationName, retries + 1);
          
          // Return Observable that waits and retries
          return new Observable((observer) => {
            setTimeout(() => {
              const subscription = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
              return () => subscription.unsubscribe();
            }, RETRY_DELAY);
          });
        } else {
          console.error('🔒 Authentication error after retries - middleware will handle redirect');
          retryAttempts.delete(operationName);
          // Middleware will catch this and redirect to Keycloak login
          return;
        }
      }
    }
  }

  if (networkError && 'statusCode' in networkError) {
    // Check for 401 Unauthorized
    if (networkError.statusCode === 401 || networkError.statusCode === 403) {
      const retries = retryAttempts.get(operationName) || 0;
      
      if (retries < MAX_RETRIES) {
        console.warn(`🔄 ${networkError.statusCode} error on ${operationName}, retrying in ${RETRY_DELAY}ms (attempt ${retries + 1}/${MAX_RETRIES})`);
        retryAttempts.set(operationName, retries + 1);
        
        return new Observable((observer) => {
          setTimeout(() => {
            const subscription = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
            return () => subscription.unsubscribe();
          }, RETRY_DELAY);
        });
      } else {
        console.error('🔒 Authentication error (401/403) after retries - middleware will handle redirect');
        retryAttempts.delete(operationName);
        return;
      }
    }
  }
  
  // Clear retry count on success or non-auth errors
  retryAttempts.delete(operationName);
});

const authLink = new ApolloLink((operation, forward) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("flowrms_access_token")
      : null;

  const refreshToken =
    typeof window !== "undefined"
      ? localStorage.getItem("flowrms_refresh_token")
      : null;

  console.log('Apollo authLink: Operation:', operation.operationName, 'Token available:', !!token, 'Refresh token available:', !!refreshToken);

  // Only send headers if we have localStorage tokens (legacy support)
  // Otherwise, the /api/graphql proxy will use cookies automatically
  if (token || refreshToken) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(refreshToken ? { 'Refresh-Token': refreshToken } : {}),
      },
    }));
  }

  return forward(operation);
});

const httpLink = new HttpLink({ uri: GRAPHQL_PROXY });

// WebSocket link for subscriptions
const wsLink = typeof window !== "undefined" ? new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: () => {
      const token = localStorage.getItem("flowrms_access_token");
      const refreshToken = localStorage.getItem("flowrms_refresh_token");
      
      console.log('🔌 WebSocket connectionParams:', { 
        hasToken: !!token, 
        hasRefresh: !!refreshToken,
        token: token ? `${token.substring(0, 20)}...` : 'null',
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null'
      });
      
      // ALWAYS send both tokens - backend expects refresh token for all subscriptions
      return {
        Authorization: token ? `Bearer ${token}` : '',
        'Refresh-Token': refreshToken || '',
      };
    },
    on: {
      connected: () => console.log('✅ WebSocket connected'),
      closed: () => console.log('🔌 WebSocket closed'),
      error: (error) => console.error('❌ WebSocket error:', error),
    },
  })
) : null;

// Split between HTTP and WebSocket based on operation type
const splitLink = typeof window !== "undefined" && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      errorLink.concat(authLink).concat(httpLink)
    )
  : errorLink.concat(authLink).concat(httpLink);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});






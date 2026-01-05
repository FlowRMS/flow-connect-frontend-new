'use client';

import { ApolloProvider } from '@apollo/client/react';
import { ReactNode } from 'react';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';

/**
 * Apollo Provider for FlowAI components within the CRM
 * Uses the flowrms-apollo client which connects to the CRM's GraphQL endpoint
 */
export function FlowAIApolloProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={flowrmsApolloClient}>{children}</ApolloProvider>;
}

export default FlowAIApolloProvider;










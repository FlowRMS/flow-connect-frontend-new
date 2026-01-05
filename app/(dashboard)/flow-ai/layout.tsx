'use client';

import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { TooltipProvider } from '@/components/flow-ai/ui/tooltip';

// Import FlowAI-specific styles (scoped to prevent CRM style conflicts)
import '@/components/flow-ai/styles/flow-ai-globals.css';

/**
 * Layout for FlowAI pages within the CRM dashboard
 * Provides Apollo client context for GraphQL operations
 * Uses flow-ai-scope class to apply FlowAI's original styling
 */
export default function FlowAILayout({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={flowrmsApolloClient}>
      <TooltipProvider>
        <div className="flow-ai-scope flex-1 overflow-auto">
          {children}
        </div>
      </TooltipProvider>
    </ApolloProvider>
  );
}









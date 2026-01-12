'use client';

import { ApolloProvider } from '@apollo/client/react';
import { flowrmsApiSubscriptionClient } from '@/lib/flow-ai/flowrms-apollo';
import { FloatingChatButton } from './FloatingChatButton';
import { FlowChatPanel } from './FlowChatPanel';

/**
 * FlowChat - The Global AI Assistant
 *
 * This component provides:
 * 1. A floating button in the bottom-right corner
 * 2. A slide-out chat panel
 * 3. Context-aware features based on current page
 * 4. Keyboard shortcuts (Cmd/Ctrl + K)
 * 5. Quick actions tailored to entity types
 * 6. Context markers for AI suggestions anywhere in the UI
 *
 * Must be wrapped in FlowChatProvider (done in DashboardShell)
 *
 * UNIQUE FEATURES:
 * - Auto-detects current entity (Order, Quote, etc.) from URL
 * - Provides context-aware quick actions
 * - Keyboard shortcut: Cmd/Ctrl + K to toggle
 * - Context markers can be placed anywhere to show AI suggestions
 * - Voice input support
 * - Chat history with persistence
 */
export function FlowChat() {
  return (
    <ApolloProvider client={flowrmsApiSubscriptionClient}>
      <FloatingChatButton />
      <FlowChatPanel />
    </ApolloProvider>
  );
}

export { FloatingChatButton } from './FloatingChatButton';
export { FlowChatPanel } from './FlowChatPanel';
export { ContextMarker, useFlowChatTrigger } from './ContextMarker';

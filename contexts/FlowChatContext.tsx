'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

// Non-null entity types
export type EntityTypeValue =
  | 'order'
  | 'quote'
  | 'invoice'
  | 'commission'
  | 'contact'
  | 'company'
  | 'customer'
  | 'manufacturer'
  | 'product'
  | 'job'
  | 'task'
  | 'note';

// Entity types that FlowChat can understand (includes null for no entity)
export type EntityType = EntityTypeValue | null;

// Current page context information
export interface PageContext {
  entityType: EntityType;
  entityId: string | null;
  entityNumber: string | null; // Human-readable number like "Order #1234"
  entityName?: string;
  isDetailPage: boolean;
  isListPage: boolean;
  isEditPage: boolean;
  pathname: string;
  breadcrumbs: string[];
}

// Quick action suggestion based on context
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: 'analyze' | 'compare' | 'summarize' | 'action' | 'insight' | 'help' | 'create' | 'search' | 'info';
  priority: number;
}

// Context hint that appears as a floating marker
export interface ContextHint {
  id: string;
  type: 'info' | 'suggestion' | 'warning' | 'action';
  title: string;
  description: string;
  prompt?: string;
  dismissable: boolean;
}

interface FlowChatContextType {
  // Panel state
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;

  // Page context
  pageContext: PageContext;

  // Context-aware features
  quickActions: QuickAction[];
  contextHints: ContextHint[];
  dismissHint: (hintId: string) => void;

  // Pre-filled message
  initialMessage: string | null;
  setInitialMessage: (message: string | null) => void;
  sendWithContext: (message: string, includeEntityContext?: boolean) => void;

  // Entity context for the chat
  entityContext: {
    type: EntityType;
    id: string | null;
    number: string | null; // Human-readable entity number
    includeInChat: boolean;
  } | null;
  setEntityContext: (context: { type: EntityType; id: string | null; number: string | null; includeInChat: boolean } | null) => void;
  setEntityNumber: (number: string | null) => void; // To set entity number from external components
  setFullEntityContext: (type: EntityType | null, id: string | null, number: string | null) => void; // To set full context from detail pages

  // Page change tracking - signals when to start new chat
  shouldStartNewChat: boolean;
  acknowledgeChatReset: () => void;

  // Keyboard shortcut state
  isShortcutHintVisible: boolean;
  hideShortcutHint: () => void;
}

const FlowChatContext = createContext<FlowChatContextType | undefined>(undefined);

// Route patterns for entity detection
const ROUTE_PATTERNS: { pattern: RegExp; entityType: EntityType; extractId: (match: RegExpMatchArray) => string | null }[] = [
  { pattern: /^\/orders\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'order', extractId: (m) => m[1] },
  { pattern: /^\/quotes(?:-v2)?\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'quote', extractId: (m) => m[1] },
  { pattern: /^\/invoices\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'invoice', extractId: (m) => m[1] },
  { pattern: /^\/commissions\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'commission', extractId: (m) => m[1] },
  { pattern: /^\/contacts\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'contact', extractId: (m) => m[1] },
  { pattern: /^\/companies\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'company', extractId: (m) => m[1] },
  { pattern: /^\/customers\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'customer', extractId: (m) => m[1] },
  { pattern: /^\/manufacturers\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'manufacturer', extractId: (m) => m[1] },
  { pattern: /^\/products\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'product', extractId: (m) => m[1] },
  { pattern: /^\/jobs\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'job', extractId: (m) => m[1] },
  { pattern: /^\/tasks\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'task', extractId: (m) => m[1] },
  { pattern: /^\/notes\/([a-f0-9-]+)(?:\/|$)/i, entityType: 'note', extractId: (m) => m[1] },
  // List pages (no ID)
  { pattern: /^\/orders\/?$/i, entityType: 'order', extractId: () => null },
  { pattern: /^\/quotes(?:-v2)?\/?$/i, entityType: 'quote', extractId: () => null },
  { pattern: /^\/invoices\/?$/i, entityType: 'invoice', extractId: () => null },
  { pattern: /^\/commissions\/?$/i, entityType: 'commission', extractId: () => null },
  { pattern: /^\/contacts\/?$/i, entityType: 'contact', extractId: () => null },
  { pattern: /^\/companies\/?$/i, entityType: 'company', extractId: () => null },
  { pattern: /^\/customers\/?$/i, entityType: 'customer', extractId: () => null },
  { pattern: /^\/manufacturers\/?$/i, entityType: 'manufacturer', extractId: () => null },
  { pattern: /^\/products\/?$/i, entityType: 'product', extractId: () => null },
  { pattern: /^\/jobs\/?$/i, entityType: 'job', extractId: () => null },
  { pattern: /^\/tasks\/?$/i, entityType: 'task', extractId: () => null },
  { pattern: /^\/notes\/?$/i, entityType: 'note', extractId: () => null },
];

// Quick actions based on entity type
const QUICK_ACTIONS_BY_ENTITY: Record<EntityTypeValue | 'default' | 'none', QuickAction[]> = {
  order: [
    { id: 'order-summary', label: 'Summarize Order', description: 'Get a quick overview of this order', prompt: 'Give me a comprehensive summary of this order including total value, line items, customer info, and status.', icon: 'summarize', priority: 1 },
    { id: 'order-status', label: 'Check Status', description: 'What is the current status?', prompt: 'What is the current status of this order? Are there any pending actions or issues?', icon: 'info', priority: 2 },
    { id: 'order-commission', label: 'Calculate Commission', description: 'Calculate expected commissions', prompt: 'Calculate the expected commission for this order based on the line items and rep splits.', icon: 'analyze', priority: 3 },
    { id: 'order-compare', label: 'Compare to Quote', description: 'Compare this order to its original quote', prompt: 'Compare this order to its original quote. Show me any differences in pricing, quantities, or terms.', icon: 'compare', priority: 4 },
    { id: 'order-history', label: 'Order History', description: 'View related orders from this customer', prompt: 'Show me the order history for this customer. What patterns do you see in their ordering behavior?', icon: 'insight', priority: 5 },
  ],
  quote: [
    { id: 'quote-summary', label: 'Summarize Quote', description: 'Get a quick overview of this quote', prompt: 'Give me a comprehensive summary of this quote including pricing, products, and customer details.', icon: 'summarize', priority: 1 },
    { id: 'quote-convert', label: 'Conversion Tips', description: 'How to convert this to an order', prompt: 'What are the best practices to convert this quote to an order? Any red flags I should address?', icon: 'action', priority: 2 },
    { id: 'quote-pricing', label: 'Analyze Pricing', description: 'Check if pricing is competitive', prompt: 'Analyze the pricing on this quote. Is it competitive? Are the margins healthy?', icon: 'analyze', priority: 3 },
    { id: 'quote-similar', label: 'Similar Quotes', description: 'Find similar quotes won/lost', prompt: 'Find similar quotes we have sent before. Which ones converted to orders and why?', icon: 'search', priority: 4 },
  ],
  invoice: [
    { id: 'invoice-summary', label: 'Invoice Summary', description: 'Get payment and status details', prompt: 'Summarize this invoice including amount due, payment status, and any outstanding issues.', icon: 'summarize', priority: 1 },
    { id: 'invoice-payment', label: 'Payment Status', description: 'Check payment timeline', prompt: 'What is the payment status? When is it due? Has the customer historically paid on time?', icon: 'info', priority: 2 },
    { id: 'invoice-commission', label: 'Commission Impact', description: 'How this affects commissions', prompt: 'How does this invoice affect rep commissions? When will commissions be payable?', icon: 'analyze', priority: 3 },
  ],
  commission: [
    { id: 'commission-breakdown', label: 'Commission Breakdown', description: 'Detailed commission calculation', prompt: 'Break down this commission check in detail. Show me how each amount was calculated.', icon: 'analyze', priority: 1 },
    { id: 'commission-history', label: 'Rep History', description: 'View this rep\'s commission history', prompt: 'Show me the commission history for this sales rep. Any trends or notable changes?', icon: 'insight', priority: 2 },
  ],
  contact: [
    { id: 'contact-summary', label: 'Contact Overview', description: 'Full profile and activity summary', prompt: 'Give me a complete overview of this contact including their role, company, and recent interactions.', icon: 'summarize', priority: 1 },
    { id: 'contact-activity', label: 'Recent Activity', description: 'What has this contact been involved in?', prompt: 'What quotes, orders, and interactions has this contact been involved in recently?', icon: 'insight', priority: 2 },
    { id: 'contact-opportunities', label: 'Find Opportunities', description: 'Identify sales opportunities', prompt: 'Based on this contact\'s history, what sales opportunities should I pursue?', icon: 'action', priority: 3 },
  ],
  company: [
    { id: 'company-summary', label: 'Company Overview', description: 'Full company profile', prompt: 'Give me a complete overview of this company including key contacts, recent orders, and business relationship.', icon: 'summarize', priority: 1 },
    { id: 'company-revenue', label: 'Revenue Analysis', description: 'Analyze revenue from this company', prompt: 'Analyze the revenue we have generated from this company. Show trends and growth opportunities.', icon: 'analyze', priority: 2 },
    { id: 'company-contacts', label: 'Key Contacts', description: 'Who are the key people?', prompt: 'Who are the key contacts at this company? What are their roles and how should I engage with them?', icon: 'search', priority: 3 },
  ],
  customer: [
    { id: 'customer-360', label: 'Customer 360', description: 'Complete customer view', prompt: 'Give me a 360-degree view of this customer - their history, preferences, payment behavior, and relationship health.', icon: 'summarize', priority: 1 },
    { id: 'customer-lifetime', label: 'Lifetime Value', description: 'Calculate customer lifetime value', prompt: 'Calculate the lifetime value of this customer. What products do they buy most?', icon: 'analyze', priority: 2 },
    { id: 'customer-recommend', label: 'Product Recommendations', description: 'What else should they buy?', prompt: 'Based on this customer\'s purchase history, what products should I recommend to them?', icon: 'insight', priority: 3 },
  ],
  manufacturer: [
    { id: 'manufacturer-summary', label: 'Manufacturer Overview', description: 'Full manufacturer profile', prompt: 'Give me a complete overview of this manufacturer including products, commission rates, and performance.', icon: 'summarize', priority: 1 },
    { id: 'manufacturer-performance', label: 'Performance Analysis', description: 'How are they performing?', prompt: 'Analyze this manufacturer\'s performance - lead times, quality, sales volume, and trends.', icon: 'analyze', priority: 2 },
    { id: 'manufacturer-products', label: 'Top Products', description: 'What sells best from them?', prompt: 'What are the top-selling products from this manufacturer? Any new products I should know about?', icon: 'search', priority: 3 },
  ],
  product: [
    { id: 'product-summary', label: 'Product Overview', description: 'Full product details', prompt: 'Give me a complete overview of this product including specs, pricing, and sales history.', icon: 'summarize', priority: 1 },
    { id: 'product-sales', label: 'Sales Analysis', description: 'Who is buying this product?', prompt: 'Analyze the sales of this product. Who are the top buyers? What are the trends?', icon: 'analyze', priority: 2 },
    { id: 'product-alternatives', label: 'Alternatives', description: 'Find similar products', prompt: 'What are similar or alternative products? How do they compare on price and specs?', icon: 'compare', priority: 3 },
  ],
  job: [
    { id: 'job-summary', label: 'Job Overview', description: 'Full job details and status', prompt: 'Give me a complete overview of this job including scope, timeline, and current status.', icon: 'summarize', priority: 1 },
    { id: 'job-progress', label: 'Track Progress', description: 'What is the job progress?', prompt: 'What is the progress on this job? Are there any blockers or delays I should know about?', icon: 'info', priority: 2 },
  ],
  task: [
    { id: 'task-details', label: 'Task Details', description: 'Full task information', prompt: 'Give me all the details about this task including context, deadline, and related items.', icon: 'summarize', priority: 1 },
    { id: 'task-help', label: 'How to Complete', description: 'Help me complete this task', prompt: 'Help me complete this task. What steps should I take?', icon: 'help', priority: 2 },
  ],
  note: [
    { id: 'note-context', label: 'Related Context', description: 'What is this note related to?', prompt: 'What is the context around this note? What entities and activities is it related to?', icon: 'search', priority: 1 },
  ],
  none: [
    { id: 'dashboard-summary', label: 'Daily Summary', description: 'What should I focus on today?', prompt: 'Give me a summary of my day. What needs my attention? Any urgent items?', icon: 'summarize', priority: 1 },
    { id: 'dashboard-performance', label: 'Performance Overview', description: 'How am I doing?', prompt: 'How is my sales performance? Show me key metrics and trends.', icon: 'analyze', priority: 2 },
    { id: 'dashboard-search', label: 'Find Anything', description: 'Search across all data', prompt: 'I want to find...', icon: 'search', priority: 3 },
  ],
  default: [
    { id: 'general-help', label: 'Help', description: 'How can I help?', prompt: 'What can you help me with on this page?', icon: 'help', priority: 1 },
    { id: 'general-search', label: 'Search', description: 'Find something', prompt: 'I want to find...', icon: 'search', priority: 2 },
  ],
};

// Human-readable entity names
const ENTITY_DISPLAY_NAMES: Record<EntityTypeValue, string> = {
  order: 'Order',
  quote: 'Quote',
  invoice: 'Invoice',
  commission: 'Commission',
  contact: 'Contact',
  company: 'Company',
  customer: 'Customer',
  manufacturer: 'Manufacturer',
  product: 'Product',
  job: 'Job',
  task: 'Task',
  note: 'Note',
};

// Helper to get display name safely (handles null)
function getEntityDisplayName(entityType: EntityType): string {
  if (entityType === null) return '';
  return ENTITY_DISPLAY_NAMES[entityType];
}

export function FlowChatProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [entityContext, setEntityContext] = useState<{ type: EntityType; id: string | null; number: string | null; includeInChat: boolean } | null>(null);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [isShortcutHintVisible, setIsShortcutHintVisible] = useState(true);
  const [shouldStartNewChat, setShouldStartNewChat] = useState(false);
  const [previousPathname, setPreviousPathname] = useState<string | null>(null);

  // Detect page context from pathname
  const pageContext = useMemo<PageContext>(() => {
    let entityType: EntityType = null;
    let entityId: string | null = null;

    for (const route of ROUTE_PATTERNS) {
      const match = pathname.match(route.pattern);
      if (match) {
        entityType = route.entityType;
        entityId = route.extractId(match);
        break;
      }
    }

    const isDetailPage = entityId !== null;
    const isListPage = entityType !== null && entityId === null;
    const isEditPage = pathname.includes('/edit');

    // Generate breadcrumbs
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = segments.map((segment, index) => {
      // Capitalize first letter, replace dashes with spaces
      return segment.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());
    });

    return {
      entityType,
      entityId,
      entityNumber: entityContext?.number || null, // Will be set by external components
      isDetailPage,
      isListPage,
      isEditPage,
      pathname,
      breadcrumbs,
    };
  }, [pathname, entityContext?.number]);

  // Auto-update entity context when page changes and signal new chat
  useEffect(() => {
    // Check if we actually navigated to a different page
    if (previousPathname !== null && previousPathname !== pathname) {
      // Signal that a new chat should start
      setShouldStartNewChat(true);
      // Clear context on navigation - detail pages will set their own via setFullEntityContext
      setEntityContext(null);
    }
    setPreviousPathname(pathname);
    // Don't auto-set context here - let detail pages set it via setFullEntityContext
    // This prevents race conditions where this effect overwrites the number
  }, [pathname, previousPathname]);

  // Set entity number from external components (like detail pages)
  // This also ensures the entity context exists based on current page context
  const setEntityNumber = useCallback((number: string | null) => {
    setEntityContext((prev) => {
      // If we have an existing context, update the number
      if (prev) {
        return { ...prev, number };
      }
      // If no context exists but we have page context with an entity, create context
      // This handles cases where URL pattern didn't match but we're on a detail page
      if (number && pageContext.entityType && pageContext.entityId) {
        return {
          type: pageContext.entityType,
          id: pageContext.entityId,
          number,
          includeInChat: true,
        };
      }
      return prev;
    });
  }, [pageContext.entityType, pageContext.entityId]);

  // Set full entity context from external components (for pages that don't use URL params)
  const setFullEntityContext = useCallback((type: EntityType | null, id: string | null, number: string | null) => {
    console.log('[FlowChatContext] setFullEntityContext called with:', { type, id, number });
    if (type && id) {
      const newContext = {
        type,
        id,
        number,
        includeInChat: true,
      };
      console.log('[FlowChatContext] Setting entityContext to:', newContext);
      setEntityContext(newContext);
    } else {
      console.log('[FlowChatContext] Clearing entityContext');
      setEntityContext(null);
    }
  }, []);

  // Acknowledge chat reset (called by FlowChatPanel after starting new chat)
  const acknowledgeChatReset = useCallback(() => {
    setShouldStartNewChat(false);
  }, []);

  // Get quick actions based on current context
  const quickActions = useMemo<QuickAction[]>(() => {
    const entityType = pageContext.entityType;
    const key = entityType === null ? 'none' : entityType;
    const actions = QUICK_ACTIONS_BY_ENTITY[key] || QUICK_ACTIONS_BY_ENTITY.default;
    return [...actions].sort((a, b) => a.priority - b.priority);
  }, [pageContext.entityType]);

  // Generate context hints based on page
  const contextHints = useMemo<ContextHint[]>(() => {
    const hints: ContextHint[] = [];

    if (pageContext.isDetailPage && pageContext.entityType) {
      const entityName = getEntityDisplayName(pageContext.entityType);
      // Show entity number if available, otherwise show truncated ID
      const entityIdentifier = entityContext?.number
        ? `#${entityContext.number}`
        : pageContext.entityId?.slice(0, 8) + '...';
      hints.push({
        id: `context-${pageContext.entityType}-${pageContext.entityId}`,
        type: 'info',
        title: `You're viewing ${entityName} ${entityIdentifier}`,
        description: `I can help you analyze this ${entityName.toLowerCase()}, answer questions about it, or take actions.`,
        prompt: `Tell me about this ${entityName.toLowerCase()}.`,
        dismissable: true,
      });
    }

    return hints.filter(hint => !dismissedHints.has(hint.id));
  }, [pageContext, dismissedHints, entityContext?.number]);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const dismissHint = useCallback((hintId: string) => {
    setDismissedHints(prev => new Set([...prev, hintId]));
  }, []);

  const hideShortcutHint = useCallback(() => {
    setIsShortcutHintVisible(false);
    localStorage.setItem('flowchat-shortcut-hint-dismissed', 'true');
  }, []);

  // Load shortcut hint dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('flowchat-shortcut-hint-dismissed');
    if (dismissed === 'true') {
      setIsShortcutHintVisible(false);
    }
  }, []);

  // Send message with context
  const sendWithContext = useCallback((message: string, includeEntityContext: boolean = true) => {
    let contextualMessage = message;

    if (includeEntityContext && entityContext?.includeInChat && entityContext.type && entityContext.id) {
      const entityName = getEntityDisplayName(entityContext.type);
      // Include both the number (if available) and the ID
      const entityIdentifier = entityContext.number
        ? `${entityName} #${entityContext.number} (ID: ${entityContext.id})`
        : `${entityName} ID: ${entityContext.id}`;
      contextualMessage = `[Context: I'm currently viewing ${entityIdentifier}]\n\n${message}`;
    }

    setInitialMessage(contextualMessage);
    setIsOpen(true);
  }, [entityContext]);

  // Keyboard shortcut: Cmd/Ctrl + K to toggle chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleChat();
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleChat, closeChat, isOpen]);

  const value = useMemo<FlowChatContextType>(() => ({
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    pageContext,
    quickActions,
    contextHints,
    dismissHint,
    initialMessage,
    setInitialMessage,
    sendWithContext,
    entityContext,
    setEntityContext,
    setEntityNumber,
    setFullEntityContext,
    shouldStartNewChat,
    acknowledgeChatReset,
    isShortcutHintVisible,
    hideShortcutHint,
  }), [
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    pageContext,
    quickActions,
    contextHints,
    dismissHint,
    initialMessage,
    setInitialMessage,
    sendWithContext,
    entityContext,
    setEntityContext,
    setEntityNumber,
    setFullEntityContext,
    shouldStartNewChat,
    acknowledgeChatReset,
    isShortcutHintVisible,
    hideShortcutHint,
  ]);

  return (
    <FlowChatContext.Provider value={value}>
      {children}
    </FlowChatContext.Provider>
  );
}

export function useFlowChat() {
  const context = useContext(FlowChatContext);
  if (context === undefined) {
    throw new Error('useFlowChat must be used within a FlowChatProvider');
  }
  return context;
}

// Export entity display names for use in other components
export { ENTITY_DISPLAY_NAMES, getEntityDisplayName };

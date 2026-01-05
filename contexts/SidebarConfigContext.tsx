'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface NavItemConfig {
  id: string;
  name: string;
  href: string;
  enabled: boolean;
}

export interface NavGroupConfig {
  id: string;
  label: string;
  collapsed: boolean;
  items: NavItemConfig[];
}

interface SidebarConfig {
  groups: NavGroupConfig[];
}

interface SidebarConfigContextType {
  config: SidebarConfig;
  updateConfig: (config: SidebarConfig) => void;
  toggleGroup: (groupId: string) => void;
  toggleItem: (groupId: string, itemId: string) => void;
  moveGroup: (fromIndex: number, toIndex: number) => void;
  moveItem: (fromGroupId: string, fromIndex: number, toGroupId: string, toIndex: number) => void;
  resetToDefault: () => void;
}

const defaultConfig: SidebarConfig = {
  groups: [
    {
      id: 'crm',
      label: 'CRM',
      collapsed: false,
      items: [
        { id: 'activity-feed', name: 'Activity Feed', href: '/', enabled: true },
        { id: 'tasks', name: 'Tasks', href: '/tasks', enabled: true },
        { id: 'notes', name: 'Notes', href: '/notes', enabled: true },
        { id: 'jobs', name: 'Jobs', href: '/jobs', enabled: true },
        { id: 'pre-quotes', name: 'Pre Opportunities', href: '/pre-opportunities', enabled: true },
      ]
    },
    {
      id: 'flow-ai',
      label: 'FlowAI',
      collapsed: false,
      items: [
        { id: 'flow-ai-scan', name: 'Document Scan', href: '/flow-ai', enabled: true },
        { id: 'flow-ai-queue', name: 'Queue', href: '/flow-ai/queue', enabled: true },
        { id: 'flow-ai-upload', name: 'Upload', href: '/flow-ai/upload', enabled: true },
        { id: 'flow-ai-templates', name: 'Templates', href: '/flow-ai/templates', enabled: true },
        { id: 'flow-ai-workflows', name: 'Workflows', href: '/flow-ai/workflows', enabled: true },
        { id: 'flow-ai-chat', name: 'AI Chat', href: '/flow-ai/ai-chat', enabled: true },
      ]
    },
    {
      id: 'email',
      label: 'Email',
      collapsed: false,
      items: [
        // { id: 'flowmail', name: 'FlowMail', href: '/flowmail', enabled: true },
        // { id: 'calendar', name: 'Calendar', href: '/flow-calendar', enabled: true },
        { id: 'campaigns-rules', name: 'Campaigns & Rules', href: '/email-helper', enabled: true },
        { id: 'email-ingestion', name: 'Email Ingestion', href: '/email-ingestion', enabled: true },
        // { id: 'email-templates', name: 'Templates', href: '/email-templates', enabled: true },
      ]
    },
    {
      id: 'quotes',
      label: 'Quotes',
      collapsed: false,
      items: [
        // { id: 'take-offs', name: 'Take-Offs', href: '/take-offs', enabled: true },
        // { id: 'product-crosses', name: 'Product Crosses', href: '/product-crosses', enabled: true },
        { id: 'quotes', name: 'Quotes', href: '/quotes-v2', enabled: true },
        // { id: 'quotes-v2', name: 'Quotes V2', href: '/quotes-v2', enabled: true },
      ]
    },
    {
      id: 'financial',
      label: 'Financial',
      collapsed: false,
      items: [
        { id: 'orders', name: 'Orders', href: '/orders', enabled: true },
        { id: 'invoices', name: 'Invoices', href: '/invoices', enabled: true },
        { id: 'commissions', name: 'Commissions', href: '/commissions', enabled: true },
        { id: 'adjustments', name: 'Adjustments', href: '/adjustments', enabled: true },
        { id: 'acknowledgements', name: 'Acknowledgements', href: '/acknowledgements', enabled: true },
        // { id: 'buysell', name: 'Buy/Sell', href: '/buysell', enabled: true },
      ]
    },
    {
      id: 'warehouse',
      label: 'Warehouse',
      collapsed: false,
      items: [
        // { id: 'warehouse-overview', name: 'Overview', href: '/warehouse', enabled: true },
        // { id: 'warehouse-fulfillment', name: 'Fulfillment', href: '/warehouse/fulfillment', enabled: true },
        // { id: 'warehouse-deliveries', name: 'Deliveries', href: '/warehouse/deliveries', enabled: true },
        // { id: 'warehouse-inventory', name: 'Inventory', href: '/warehouse/inventory', enabled: true },
        // { id: 'warehouse-cycle-counts', name: 'Cycle Counts', href: '/warehouse/cycle-counts', enabled: true },
        // { id: 'warehouse-reports', name: 'Reports', href: '/warehouse/reports', enabled: true },
        { id: 'warehouse-settings', name: 'Settings', href: '/warehouse/settings', enabled: true },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      collapsed: false,
      items: [
        { id: 'analytics-order-dashboard', name: 'Order Dashboard', href: '/analytics/order-dashboard', enabled: true },
        { id: 'analytics-product-dashboard', name: 'Product Dashboard', href: '/analytics/product-dashboard', enabled: true },
        { id: 'analytics-commission-gap', name: 'Commission Gap Reports', href: '/analytics/commission-gap-reports', enabled: true },
        { id: 'analytics-orders-report', name: 'Orders Detail', href: '/analytics/orders-report', enabled: true },
        { id: 'analytics-check-detail', name: 'Check Detail', href: '/analytics/check-detail', enabled: true },
        { id: 'analytics-quote-detail', name: 'Quote Detail', href: '/analytics/quote-detail', enabled: true },
        { id: 'analytics-order-split-rate', name: 'Order Split Rate', href: '/analytics/order-split-rate-commission-detail', enabled: true },
        { id: 'analytics-orders-pivot', name: 'Order Pivot', href: '/analytics/orders-pivot', enabled: true },
        { id: 'analytics-check-pivot', name: 'Check Pivot', href: '/analytics/check-pivot', enabled: true },
        { id: 'analytics-quote-pivot', name: 'Quote Pivot', href: '/analytics/quote-pivot', enabled: true },
        { id: 'analytics-commission-state-pivot', name: 'Commission by State', href: '/analytics/commission-by-state-pivot', enabled: true },
      ]
    },
    {
      id: 'foundational',
      label: 'Foundational',
      collapsed: false,
      items: [
        { id: 'contacts', name: 'Contacts', href: '/contacts', enabled: true },
        { id: 'companies', name: 'Companies', href: '/companies', enabled: true },
        { id: 'customers', name: 'Customers', href: '/customers', enabled: true },
        { id: 'products', name: 'Products', href: '/products', enabled: true },
        { id: 'manufacturers', name: 'Manufacturers', href: '/manufacturers', enabled: true },
        // { id: 'spec-sheets', name: 'Spec Sheets', href: '/spec-sheets', enabled: true },
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      collapsed: false,
      items: [
        { id: 'files', name: 'Files', href: '/files', enabled: true },
        { id: 'settings', name: 'Settings', href: '/settings', enabled: true },
        { id: 'email-integrations', name: 'Email Integrations', href: '/integrations', enabled: true },
        // { id: 'data-integrations', name: 'Data Integrations', href: '/data-integrations', enabled: true },
        // { id: 'pdf-templates', name: 'PDF Templates', href: '/pdf-templates', enabled: true },
        // { id: 'report-scheduler', name: 'Report Scheduler', href: '/report-scheduler', enabled: true },
      ]
    },
  ]
};

const STORAGE_KEY = 'sidebar-config';
const CONFIG_VERSION = 24; // Increment this to force a reset of cached sidebar config (added FlowAI)

const SidebarConfigContext = createContext<SidebarConfigContextType | undefined>(undefined);

export function SidebarConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SidebarConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount, merging with defaults for new groups and items
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(STORAGE_KEY + '-version');

      // If version doesn't match, reset to defaults
      if (storedVersion !== String(CONFIG_VERSION)) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(STORAGE_KEY + '-version', String(CONFIG_VERSION));
        setIsLoaded(true);
        return;
      }

      if (stored) {
        const parsed = JSON.parse(stored) as SidebarConfig;
        
        // Merge: add any new groups from defaultConfig that don't exist in stored config
        const storedGroupIds = new Set(parsed.groups.map(g => g.id));
        const newGroups = defaultConfig.groups.filter(g => !storedGroupIds.has(g.id));
        if (newGroups.length > 0) {
          // Insert new groups before 'foundational' if it exists, otherwise before 'admin', otherwise at end
          const foundationalIndex = parsed.groups.findIndex(g => g.id === 'foundational');
          const adminIndex = parsed.groups.findIndex(g => g.id === 'admin');
          const insertIndex = foundationalIndex >= 0 ? foundationalIndex : (adminIndex >= 0 ? adminIndex : parsed.groups.length);
          parsed.groups.splice(insertIndex, 0, ...newGroups);
        }
        
        // Merge: add any new items within existing groups, update names/hrefs, and remove items not in defaults
        parsed.groups = parsed.groups.map(group => {
          const defaultGroup = defaultConfig.groups.find(g => g.id === group.id);
          if (defaultGroup) {
            const defaultItemIds = new Set(defaultGroup.items.map(i => i.id));
            const newItems = defaultGroup.items.filter(i => !group.items.some(gi => gi.id === i.id));

            // Filter out items that no longer exist in defaults, and update names/hrefs for existing ones
            const updatedItems = group.items
              .filter(item => defaultItemIds.has(item.id))
              .map(item => {
                const defaultItem = defaultGroup.items.find(i => i.id === item.id);
                if (defaultItem) {
                  return { ...item, name: defaultItem.name, href: defaultItem.href };
                }
                return item;
              });

            if (newItems.length > 0) {
              return { ...group, items: [...updatedItems, ...newItems] };
            }
            return { ...group, items: updatedItems };
          }
          return group;
        });
        
        setConfig(parsed);
      }
    } catch (e) {
      console.error('Failed to load sidebar config:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (e) {
        console.error('Failed to save sidebar config:', e);
      }
    }
  }, [config, isLoaded]);

  const updateConfig = (newConfig: SidebarConfig) => {
    setConfig(newConfig);
  };

  const toggleGroup = (groupId: string) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
      )
    }));
  };

  const toggleItem = (groupId: string, itemId: string) => {
    setConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              items: group.items.map(item =>
                item.id === itemId ? { ...item, enabled: !item.enabled } : item
              )
            }
          : group
      )
    }));
  };

  const moveGroup = (fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const newGroups = [...prev.groups];
      const [removed] = newGroups.splice(fromIndex, 1);
      newGroups.splice(toIndex, 0, removed);
      return { ...prev, groups: newGroups };
    });
  };

  const moveItem = (fromGroupId: string, fromIndex: number, toGroupId: string, toIndex: number) => {
    setConfig(prev => {
      const newGroups = prev.groups.map(g => ({ ...g, items: [...g.items] }));
      const fromGroup = newGroups.find(g => g.id === fromGroupId);
      const toGroup = newGroups.find(g => g.id === toGroupId);

      if (!fromGroup || !toGroup) return prev;

      const [removed] = fromGroup.items.splice(fromIndex, 1);
      toGroup.items.splice(toIndex, 0, removed);

      return { ...prev, groups: newGroups };
    });
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
  };

  return (
    <SidebarConfigContext.Provider value={{
      config,
      updateConfig,
      toggleGroup,
      toggleItem,
      moveGroup,
      moveItem,
      resetToDefault
    }}>
      {children}
    </SidebarConfigContext.Provider>
  );
}

export function useSidebarConfig() {
  const context = useContext(SidebarConfigContext);
  if (context === undefined) {
    throw new Error('useSidebarConfig must be used within a SidebarConfigProvider');
  }
  return context;
}

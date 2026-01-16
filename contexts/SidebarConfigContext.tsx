'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useSidebarSettings } from './UserSettingsContext';
import type { SidebarSettingsValue } from '@/components/lib/graphql/settings';

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
      label: 'Flow AI',
      collapsed: false,
      items: [
        { id: 'flow-ai-upload', name: 'Upload', href: '/flow-ai/upload', enabled: true },
        { id: 'flow-ai-queue', name: 'Queue', href: '/flow-ai/queue', enabled: true },
        { id: 'flow-ai-templates', name: 'Upload Templates', href: '/flow-ai/templates', enabled: true },
        { id: 'flow-ai-workflows', name: 'Data Workflows', href: '/flow-ai/workflows', enabled: true },
        { id: 'flow-ai-chat', name: 'Flow Chat', href: '/flow-ai/ai-chat', enabled: true },
        { id: 'flow-ai-scan', name: 'Upload Preview', href: '/flow-ai', enabled: true },
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
        { id: 'credits', name: 'Credits', href: '/credits', enabled: true },
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
        { id: 'warehouse-inventory', name: 'Inventory', href: '/warehouse/inventory', enabled: true },
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
    {
      id: 'preview',
      label: 'Preview',
      collapsed: false,
      items: [
        { id: 'flow-agents', name: 'Flow Agents', href: '/preview/ai-agents', enabled: true },
      ]
    },
  ]
};

const STORAGE_KEY = 'sidebar-config';
const CONFIG_VERSION = 32; // Increment this to force a reset of cached sidebar config

const SidebarConfigContext = createContext<SidebarConfigContextType | undefined>(undefined);

/**
 * Merge stored config with default config to handle version updates
 */
function mergeConfigWithDefaults(stored: SidebarConfig): SidebarConfig {
  const parsed = { ...stored, groups: [...stored.groups] };

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
      // Also ensure items that are enabled by default get re-enabled if they were somehow disabled
      const updatedItems = group.items
        .filter(item => defaultItemIds.has(item.id))
        .map(item => {
          const defaultItem = defaultGroup.items.find(i => i.id === item.id);
          if (defaultItem) {
            // If the default has it enabled, ensure it stays enabled (user can disable manually after)
            const enabled = defaultItem.enabled ? true : item.enabled;
            return { ...item, name: defaultItem.name, href: defaultItem.href, enabled };
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

  return parsed;
}

export function SidebarConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SidebarConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User settings hook for API persistence
  const { settings: apiSettings, saveSettings, isInitialized: apiInitialized } = useSidebarSettings();

  // Save config to API with debounce
  const saveToApi = useCallback(async (newConfig: SidebarConfig) => {
    // Update localStorage cache immediately
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save sidebar config to localStorage:', e);
    }

    // Debounce API save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const sidebarSettings: SidebarSettingsValue = {
          groups: newConfig.groups,
        };
        await saveSettings(sidebarSettings, 'my');
      } catch (error) {
        console.error('Failed to save sidebar config to API:', error);
      }
    }, 1000);
  }, [saveSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Load config from API or localStorage on mount
  useEffect(() => {
    if (apiInitialized) {
      // Check if API has settings
      if (apiSettings && apiSettings.groups && apiSettings.groups.length > 0) {
        // Use API settings, merged with defaults
        const merged = mergeConfigWithDefaults({ groups: apiSettings.groups });
        setConfig(merged);
        // Update localStorage cache
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          localStorage.setItem(STORAGE_KEY + '-version', String(CONFIG_VERSION));
        } catch (e) {
          console.error('Failed to update localStorage cache:', e);
        }
        setIsLoaded(true);
        return;
      }
    }

    // Fallback to localStorage while API loads or if API has no settings
    if (!isLoaded) {
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
          const merged = mergeConfigWithDefaults(parsed);
          setConfig(merged);
        }
      } catch (e) {
        console.error('Failed to load sidebar config:', e);
      }
      setIsLoaded(true);
    }
  }, [apiInitialized, apiSettings, isLoaded]);

  const updateConfig = (newConfig: SidebarConfig) => {
    setConfig(newConfig);
    saveToApi(newConfig);
  };

  const toggleGroup = (groupId: string) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        groups: prev.groups.map(group =>
          group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
        )
      };
      saveToApi(newConfig);
      return newConfig;
    });
  };

  const toggleItem = (groupId: string, itemId: string) => {
    setConfig(prev => {
      const newConfig = {
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
      };
      saveToApi(newConfig);
      return newConfig;
    });
  };

  const moveGroup = (fromIndex: number, toIndex: number) => {
    setConfig(prev => {
      const newGroups = [...prev.groups];
      const [removed] = newGroups.splice(fromIndex, 1);
      newGroups.splice(toIndex, 0, removed);
      const newConfig = { ...prev, groups: newGroups };
      saveToApi(newConfig);
      return newConfig;
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

      const newConfig = { ...prev, groups: newGroups };
      saveToApi(newConfig);
      return newConfig;
    });
  };

  const resetToDefault = () => {
    setConfig(defaultConfig);
    saveToApi(defaultConfig);
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

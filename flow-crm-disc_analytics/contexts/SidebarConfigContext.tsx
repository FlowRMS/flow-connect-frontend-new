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
        { id: 'pre-quotes', name: 'Pre Quotes', href: '/pre-opportunities', enabled: true },
      ]
    },
    {
      id: 'email',
      label: 'Email',
      collapsed: false,
      items: [
        { id: 'flowmail', name: 'FlowMail', href: '/flowmail', enabled: true },
        { id: 'calendar', name: 'Calendar', href: '/flow-calendar', enabled: true },
        { id: 'campaigns-rules', name: 'Campaigns & Rules', href: '/email-helper', enabled: true },
        { id: 'email-ingestion', name: 'Email Ingestion', href: '/email-ingestion', enabled: true },
      ]
    },
    {
      id: 'quotes',
      label: 'Quotes',
      collapsed: false,
      items: [
        { id: 'take-offs', name: 'Take-Offs', href: '/take-offs', enabled: true },
        { id: 'product-crosses', name: 'Product Crosses', href: '/product-crosses', enabled: true },
        { id: 'quotes', name: 'Quotes', href: '/quotes', enabled: true },
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
        { id: 'credits-expenses', name: 'Credits & Expenses', href: '/credits', enabled: true },
      ]
    },
    {
      id: 'foundational',
      label: 'Foundational',
      collapsed: false,
      items: [
        { id: 'contacts', name: 'Contacts', href: '/contacts', enabled: true },
        { id: 'companies', name: 'Companies', href: '/companies', enabled: true },
        { id: 'products', name: 'Products', href: '/products', enabled: true },
        { id: 'spec-sheets', name: 'Spec Sheets', href: '/spec-sheets', enabled: true },
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      collapsed: false,
      items: [
        { id: 'settings', name: 'Settings', href: '/settings', enabled: true },
        { id: 'report-scheduler', name: 'Report Scheduler', href: '/report-scheduler', enabled: true },
      ]
    },
  ]
};

const STORAGE_KEY = 'sidebar-config';

const SidebarConfigContext = createContext<SidebarConfigContextType | undefined>(undefined);

export function SidebarConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SidebarConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
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

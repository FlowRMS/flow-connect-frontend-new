'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
};

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, defaultValue = '', children }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;

  const handleTabChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div className={cn('inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1', className)} {...props}>
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, children, className, ...props }: TabsTriggerProps) {
  const { activeTab, onTabChange } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => onTabChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)} {...props}>
      {children}
    </div>
  );
}

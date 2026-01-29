'use client';

import React, { createContext, useContext, useCallback, useRef, ReactNode } from 'react';

interface RegisteredChild {
  id: string;
  save: () => Promise<boolean>;
  getHasChanges: () => boolean;
}

interface SettingsPageContextType {
  registerChild: (id: string, save: () => Promise<boolean>, getHasChanges: () => boolean) => void;
  unregisterChild: (id: string) => void;
  saveRegisteredChildren: () => Promise<boolean>;
  hasAnyChildChanges: () => boolean;
}

const SettingsPageContext = createContext<SettingsPageContextType | null>(null);

export function SettingsPageProvider({ children }: { children: ReactNode }) {
  const registeredChildrenRef = useRef<Map<string, RegisteredChild>>(new Map());

  const registerChild = useCallback(
    (id: string, save: () => Promise<boolean>, getHasChanges: () => boolean) => {
      registeredChildrenRef.current.set(id, { id, save, getHasChanges });
    },
    []
  );

  const unregisterChild = useCallback((id: string) => {
    registeredChildrenRef.current.delete(id);
  }, []);

  const saveRegisteredChildren = useCallback(async (): Promise<boolean> => {
    const children = Array.from(registeredChildrenRef.current.values());
    const results = await Promise.all(
      children.map(async (child) => {
        if (child.getHasChanges()) {
          return child.save();
        }
        return true;
      })
    );
    return results.every((r) => r);
  }, []);

  const hasAnyChildChanges = useCallback((): boolean => {
    const children = Array.from(registeredChildrenRef.current.values());
    return children.some((child) => child.getHasChanges());
  }, []);

  return (
    <SettingsPageContext.Provider
      value={{
        registerChild,
        unregisterChild,
        saveRegisteredChildren,
        hasAnyChildChanges,
      }}
    >
      {children}
    </SettingsPageContext.Provider>
  );
}

export function useSettingsPage(): SettingsPageContextType | null {
  return useContext(SettingsPageContext);
}

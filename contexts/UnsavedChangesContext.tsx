/**
 * UnsavedChangesContext
 * Global context for managing unsaved changes detection and navigation blocking
 * across all detail pages (Jobs, PreOps, Quotes, Orders, Invoices, Checks,
 * Statements, Contacts, Companies, Customers, Products, Manufacturers)
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Types
export interface UnsavedChangesState {
  hasChanges: boolean;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
}

export interface PendingNavigation {
  href: string;
  type: 'sidebar' | 'link' | 'back' | 'programmatic';
}

interface UnsavedChangesContextValue {
  // State
  hasUnsavedChanges: boolean;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  showModal: boolean;
  pendingNavigation: PendingNavigation | null;
  isSaving: boolean;

  // Actions
  registerUnsavedChanges: (
    entityType: string,
    entityId: string | null,
    entityName: string | null,
    hasChanges: boolean
  ) => void;
  clearUnsavedChanges: () => void;
  setHasChanges: (hasChanges: boolean) => void;

  // Navigation blocking
  requestNavigation: (href: string, type: PendingNavigation['type']) => boolean;
  confirmNavigation: () => void;
  cancelNavigation: () => void;

  // Save handling
  setSaveHandler: (handler: (() => Promise<boolean>) | null) => void;
  handleSaveAndNavigate: () => Promise<void>;
  setIsSaving: (saving: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<string | null>(null);
  const [entityName, setEntityName] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const saveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  const lastPathnameRef = useRef(pathname);

  // Register unsaved changes from a detail page
  const registerUnsavedChanges = useCallback(
    (
      type: string,
      id: string | null,
      name: string | null,
      hasChanges: boolean
    ) => {
      setEntityType(type);
      setEntityId(id);
      setEntityName(name);
      setHasUnsavedChanges(hasChanges);
    },
    []
  );

  // Clear unsaved changes (usually after save or when leaving page)
  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    setEntityType(null);
    setEntityId(null);
    setEntityName(null);
    saveHandlerRef.current = null;
  }, []);

  // Just update hasChanges without changing entity info
  const setHasChanges = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Set the save handler from detail page
  const setSaveHandler = useCallback((handler: (() => Promise<boolean>) | null) => {
    saveHandlerRef.current = handler;
  }, []);

  // Request navigation - returns true if navigation is allowed, false if blocked
  const requestNavigation = useCallback(
    (href: string, type: PendingNavigation['type']): boolean => {
      // If no unsaved changes, allow navigation
      if (!hasUnsavedChanges) {
        return true;
      }

      // Block navigation and show modal
      setPendingNavigation({ href, type });
      setShowModal(true);
      return false;
    },
    [hasUnsavedChanges]
  );

  // Confirm navigation (discard changes)
  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      const { href } = pendingNavigation;

      // Clear state before navigating
      setShowModal(false);
      setPendingNavigation(null);
      clearUnsavedChanges();

      // Always use router.push with the stored href
      // This ensures proper navigation for master-detail pages where
      // the pathname stays the same but query params change
      router.push(href);
    }
  }, [pendingNavigation, clearUnsavedChanges, router]);

  // Cancel navigation (stay on page)
  const cancelNavigation = useCallback(() => {
    setShowModal(false);
    setPendingNavigation(null);
  }, []);

  // Handle save and then navigate
  const handleSaveAndNavigate = useCallback(async () => {
    if (!saveHandlerRef.current) {
      // No save handler, just navigate
      confirmNavigation();
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveHandlerRef.current();
      if (success) {
        // Save succeeded, now navigate
        confirmNavigation();
      }
      // If save failed, keep modal open
    } catch (error) {
      console.error('Error saving:', error);
      // Keep modal open on error
    } finally {
      setIsSaving(false);
    }
  }, [confirmNavigation]);

  // Note: We intentionally do NOT use browser beforeunload or popstate handlers
  // because they cause false alerts when navigating after saving (race condition with state updates).
  // Our custom modal (NavigationBlockerModal) handles all unsaved changes warnings for in-app navigation.

  // Clear unsaved changes when pathname changes (successful navigation)
  useEffect(() => {
    if (lastPathnameRef.current !== pathname) {
      // Route actually changed, clear state
      clearUnsavedChanges();
      lastPathnameRef.current = pathname;
    }
  }, [pathname, clearUnsavedChanges]);

  const value: UnsavedChangesContextValue = {
    hasUnsavedChanges,
    entityType,
    entityId,
    entityName,
    showModal,
    pendingNavigation,
    isSaving,
    registerUnsavedChanges,
    clearUnsavedChanges,
    setHasChanges,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
    setSaveHandler,
    handleSaveAndNavigate,
    setIsSaving,
  };

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

// Hook to use the context
export function useUnsavedChangesContext() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      'useUnsavedChangesContext must be used within UnsavedChangesProvider'
    );
  }
  return context;
}

export default UnsavedChangesContext;

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
  onDelete?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  onEnter?: () => void;
  onBackspace?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger when typing in inputs
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Delete/Backspace - Delete selected items
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handlers.onDelete?.();
      return;
    }

    // Enter - Open selected item
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handlers.onEnter?.();
      return;
    }

    // Escape - Clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      handlers.onEscape?.();
      return;
    }

    // Cmd/Ctrl+A - Select all
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      handlers.onSelectAll?.();
      return;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

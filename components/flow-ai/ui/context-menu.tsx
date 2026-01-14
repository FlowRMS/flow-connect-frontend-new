"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/flow-ai/ui/button';
import { cn } from '@/lib/flow-ai/cn';
import { Edit3, Sparkles, Trash2, Unlink } from 'lucide-react';

interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  actions: ContextMenuAction[];
}

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, actions: ContextMenuAction[]) => void;
  hideContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menuState, setMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    actions: []
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const showContextMenu = (x: number, y: number, actions: ContextMenuAction[]) => {
    setMenuState({ isOpen: true, x, y, actions });
  };

  const hideContextMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false }));
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };

    if (menuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuState.isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideContextMenu();
      }
    };

    if (menuState.isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [menuState.isOpen]);

  // Adjust position if menu would go off screen
  const getAdjustedPosition = () => {
    if (!menuRef.current) return { x: menuState.x, y: menuState.y };

    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = menuState.x;
    let y = menuState.y;

    // Adjust horizontal position
    if (x + rect.width > viewportWidth) {
      x = Math.max(0, viewportWidth - rect.width - 10);
    }

    // Adjust vertical position
    if (y + rect.height > viewportHeight) {
      y = Math.max(0, viewportHeight - rect.height - 10);
    }

    return { x, y };
  };

  const position = menuState.isOpen ? getAdjustedPosition() : { x: 0, y: 0 };

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu }}>
      {children}
      {menuState.isOpen && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px]"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {menuState.actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start h-8 px-3 py-1 text-sm font-normal rounded-none hover:bg-accent",
                action.variant === 'destructive' && "text-destructive hover:text-destructive"
              )}
              onClick={() => {
                action.onClick();
                hideContextMenu();
              }}
            >
              <span className="mr-2 flex-shrink-0">{action.icon}</span>
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}

// Preset action creators
export const createDescribeAction = (onClick: () => void): ContextMenuAction => ({
  id: 'describe',
  label: 'Describe',
  icon: <Sparkles className="w-4 h-4 text-primary" />,
  onClick,
});

export const createEditAction = (onClick: () => void): ContextMenuAction => ({
  id: 'edit',
  label: 'Edit',
  icon: <Edit3 className="w-4 h-4" />,
  onClick
});

export const createDeleteAction = (onClick: () => void): ContextMenuAction => ({
  id: 'delete',
  label: 'Delete',
  icon: <Trash2 className="w-4 h-4" />,
  onClick,
  variant: 'destructive'
});

export const createUnmapAction = (onClick: () => void): ContextMenuAction => ({
  id: 'unmap',
  label: 'Unmap',
  icon: <Unlink className="w-4 h-4" />,
  onClick,
  variant: 'destructive'
});










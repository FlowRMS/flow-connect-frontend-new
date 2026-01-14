'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface NavigationTransitionState {
  // The item currently being transitioned
  activeItemId: string | null;
  // Source position (from sidebar item)
  sourceRect: DOMRect | null;
  // Icon SVG content for the morphing element
  iconContent: React.ReactNode;
  // Label text
  label: string;
  // Is animation currently in progress
  isAnimating: boolean;
}

interface NavigationTransitionContextType {
  state: NavigationTransitionState;
  // Called when clicking a sidebar item to start transition
  startTransition: (
    itemId: string,
    sourceElement: HTMLElement,
    icon: React.ReactNode,
    label: string
  ) => void;
  // Called when page header mounts to complete transition
  completeTransition: () => void;
  // Called to cancel/reset transition
  cancelTransition: () => void;
}

const initialState: NavigationTransitionState = {
  activeItemId: null,
  sourceRect: null,
  iconContent: null,
  label: '',
  isAnimating: false,
};

const NavigationTransitionContext = createContext<NavigationTransitionContextType | undefined>(
  undefined
);

export function NavigationTransitionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NavigationTransitionState>(initialState);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback(
    (itemId: string, sourceElement: HTMLElement, icon: React.ReactNode, label: string) => {
      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      const rect = sourceElement.getBoundingClientRect();

      setState({
        activeItemId: itemId,
        sourceRect: rect,
        iconContent: icon,
        label,
        isAnimating: true,
      });

      // Safety timeout - reset after 800ms if transition doesn't complete
      transitionTimeoutRef.current = setTimeout(() => {
        setState(initialState);
      }, 800);
    },
    []
  );

  const completeTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // Keep animation state briefly to allow final frame
    setTimeout(() => {
      setState(initialState);
    }, 50);
  }, []);

  const cancelTransition = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    setState(initialState);
  }, []);

  return (
    <NavigationTransitionContext.Provider
      value={{ state, startTransition, completeTransition, cancelTransition }}
    >
      {children}
    </NavigationTransitionContext.Provider>
  );
}

export function useNavigationTransition() {
  const context = useContext(NavigationTransitionContext);
  if (context === undefined) {
    throw new Error(
      'useNavigationTransition must be used within a NavigationTransitionProvider'
    );
  }
  return context;
}

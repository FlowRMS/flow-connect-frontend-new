'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// Custom easing curves - iOS/macOS native feel
export const morphEase = [0.22, 1, 0.36, 1] as const;
export const snappyEase = [0.34, 1.56, 0.64, 1] as const;

// Items that support morphing animation
export const MORPHABLE_ITEMS = [
  'activity-feed',
  'tasks',
  'notes',
  'jobs',
  'pre-quotes',
  'quotes',
  'orders',
  'invoices',
  'commissions',
  'adjustments',
  'acknowledgements',
  'contacts',
  'customers',
  'companies',
  'products',
  'manufacturers',
  // FlowAI items
  'flow-ai-queue',
  'flow-ai-upload',
  'flow-ai-templates',
  'flow-ai-workflows',
] as const;

export type MorphableItemId = typeof MORPHABLE_ITEMS[number];

export function isMorphableItem(id: string): id is MorphableItemId {
  return MORPHABLE_ITEMS.includes(id as MorphableItemId);
}

interface FloatingIconState {
  isVisible: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  icon: React.ReactNode;
  itemId: string;
}

interface NavigationMorphContextType {
  // Register a sidebar item's ref for position tracking
  registerSidebarItem: (itemId: string, element: HTMLElement | null) => void;
  // Register the header target ref
  registerHeaderTarget: (element: HTMLElement | null) => void;
  // Start the morph animation
  startMorph: (itemId: string, icon: React.ReactNode) => Promise<void>;
  // Check if currently animating
  isAnimating: boolean;
  // The item currently being animated
  activeItemId: string | null;
  // Floating icon state for the flying animation
  floatingIcon: FloatingIconState | null;
  // Animation controls for the floating icon
  floatingControls: ReturnType<typeof useAnimation>;
}

const NavigationMorphContext = createContext<NavigationMorphContextType | undefined>(undefined);

export function NavigationMorphProvider({ children }: { children: React.ReactNode }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [floatingIcon, setFloatingIcon] = useState<FloatingIconState | null>(null);

  const sidebarRefs = useRef<Map<string, HTMLElement>>(new Map());
  const headerTargetRef = useRef<HTMLElement | null>(null);
  const floatingControls = useAnimation();

  const registerSidebarItem = useCallback((itemId: string, element: HTMLElement | null) => {
    if (element) {
      sidebarRefs.current.set(itemId, element);
    } else {
      sidebarRefs.current.delete(itemId);
    }
  }, []);

  const registerHeaderTarget = useCallback((element: HTMLElement | null) => {
    headerTargetRef.current = element;
  }, []);

  const startMorph = useCallback(async (itemId: string, icon: React.ReactNode) => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const sourceEl = sidebarRefs.current.get(itemId);
    const targetEl = headerTargetRef.current;

    if (!sourceEl || !targetEl) {
      return;
    }

    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // Calculate positions (absolute to viewport)
    const startX = sourceRect.left + sourceRect.width / 2 - 24;
    const startY = sourceRect.top + sourceRect.height / 2 - 24;
    const endX = targetRect.left + targetRect.width / 2 - 24;
    const endY = targetRect.top + targetRect.height / 2 - 24;

    setIsAnimating(true);
    setActiveItemId(itemId);

    // Set up floating icon
    setFloatingIcon({
      isVisible: true,
      startX,
      startY,
      endX,
      endY,
      icon,
      itemId,
    });

    // Wait a frame for state to update
    await new Promise(resolve => setTimeout(resolve, 10));

    // Set initial position
    floatingControls.set({
      x: startX,
      y: startY,
      scale: 1,
    });

    // Animate the floating icon
    await floatingControls.start({
      x: endX,
      y: endY,
      scale: 1.5,
      transition: {
        duration: 0.45,
        ease: morphEase,
        scale: {
          duration: 0.45,
          ease: snappyEase,
        }
      }
    });

    // Clean up
    setTimeout(() => {
      setFloatingIcon(null);
      setActiveItemId(null);
      floatingControls.set({ x: 0, y: 0, scale: 1 });
      setIsAnimating(false);
    }, 50);
  }, [floatingControls]);

  return (
    <NavigationMorphContext.Provider
      value={{
        registerSidebarItem,
        registerHeaderTarget,
        startMorph,
        isAnimating,
        activeItemId,
        floatingIcon,
        floatingControls,
      }}
    >
      {children}

      {/* Global Floating Icon Overlay - Uses z-40 to stay below modals (z-50) and dropdowns */}
      <AnimatePresence>
        {floatingIcon && (
          <motion.div
            className="fixed z-40 pointer-events-none"
            initial={{
              x: floatingIcon.startX,
              y: floatingIcon.startY,
              scale: 1,
            }}
            animate={floatingControls}
            style={{
              width: 48,
              height: 48,
            }}
          >
            {/* Glow trail effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.5, 0.2, 0],
                scale: [0.8, 1.2, 1.4, 1.6],
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut',
              }}
              style={{
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />

            {/* Icon container with glass effect */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--primary)]/15"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1] }}
              transition={{ duration: 0.1 }}
              style={{
                backdropFilter: 'blur(4px)',
              }}
            >
              <motion.div
                className="text-[var(--primary)]"
                initial={{ scale: 1, rotate: 0 }}
                animate={{
                  scale: [1, 1.1, 1.25],
                  rotate: [0, -3, 0],
                }}
                transition={{
                  duration: 0.45,
                  ease: morphEase,
                }}
                style={{
                  filter: 'drop-shadow(0 0 8px var(--primary))',
                }}
              >
                <div className="scale-125">
                  {floatingIcon.icon}
                </div>
              </motion.div>
            </motion.div>

            {/* Particle burst */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-[var(--primary)]"
                initial={{
                  x: 24,
                  y: 24,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: 24 + Math.cos((i * 60 * Math.PI) / 180) * 35,
                  y: 24 + Math.sin((i * 60 * Math.PI) / 180) * 35,
                  scale: [0, 1, 0],
                  opacity: [1, 0.6, 0],
                }}
                transition={{
                  duration: 0.35,
                  delay: 0.08,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </NavigationMorphContext.Provider>
  );
}

export function useNavigationMorph() {
  const context = useContext(NavigationMorphContext);
  if (context === undefined) {
    throw new Error('useNavigationMorph must be used within a NavigationMorphProvider');
  }
  return context;
}

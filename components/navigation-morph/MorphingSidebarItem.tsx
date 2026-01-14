'use client';

import React, { useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationTransition } from './NavigationTransitionContext';

interface MorphingSidebarItemProps {
  href: string;
  itemId: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export function MorphingSidebarItem({
  href,
  itemId,
  icon,
  label,
  isActive,
  isCollapsed,
}: MorphingSidebarItemProps) {
  const router = useRouter();
  const itemRef = useRef<HTMLAnchorElement>(null);
  const { state, startTransition } = useNavigationTransition();

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't animate if already on this page
      if (isActive) return;

      // Don't animate if user prefers reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      e.preventDefault();

      if (itemRef.current) {
        startTransition(itemId, itemRef.current, icon, label);

        // Navigate after a brief delay to allow animation to start
        setTimeout(() => {
          router.push(href);
        }, 50);
      }
    },
    [isActive, itemId, icon, label, startTransition, router, href]
  );

  const isThisItemAnimating = state.isAnimating && state.activeItemId === itemId;

  return (
    <Link
      ref={itemRef}
      href={href}
      onClick={handleClick}
      title={isCollapsed ? label : undefined}
      className={`
        relative w-full flex items-center
        ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}
        rounded-lg text-sm font-medium transition-all mb-1
        ${
          isActive
            ? 'bg-[var(--primary)] text-white'
            : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
        }
      `}
    >
      {/* Icon container with layoutId for shared element transition */}
      <AnimatePresence mode="wait">
        {!isThisItemAnimating && (
          <motion.div
            layoutId={`nav-icon-${itemId}`}
            className="flex items-center justify-center"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 30,
            }}
          >
            {icon}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label with layoutId for text morphing */}
      {!isCollapsed && (
        <AnimatePresence mode="wait">
          {!isThisItemAnimating && (
            <motion.span
              layoutId={`nav-label-${itemId}`}
              className="whitespace-nowrap"
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 30,
              }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      )}

      {/* Placeholder to maintain layout during animation */}
      {isThisItemAnimating && (
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
          <div className="w-[18px] h-[18px]" />
          {!isCollapsed && <span className="opacity-0">{label}</span>}
        </div>
      )}
    </Link>
  );
}

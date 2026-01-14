'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationTransition } from './NavigationTransitionContext';

interface MorphingPageHeaderProps {
  itemId: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function MorphingPageHeader({
  itemId,
  icon,
  title,
  subtitle,
  actions,
}: MorphingPageHeaderProps) {
  const { state, completeTransition } = useNavigationTransition();
  const headerRef = useRef<HTMLDivElement>(null);
  const hasCompletedRef = useRef(false);

  const isReceivingAnimation = state.isAnimating && state.activeItemId === itemId;

  // Complete transition when this header mounts with matching itemId
  useEffect(() => {
    if (isReceivingAnimation && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Give animation time to settle
      const timer = setTimeout(() => {
        completeTransition();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isReceivingAnimation, completeTransition]);

  // Reset ref when itemId changes
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [itemId]);

  return (
    <div ref={headerRef} className="flex items-center justify-between">
      <div className="flex items-start gap-4">
        {/* Icon with shared layoutId */}
        <motion.div
          layoutId={`nav-icon-${itemId}`}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"
          initial={false}
          animate={{
            scale: 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 30,
          }}
        >
          <div className="scale-125">{icon}</div>
        </motion.div>

        <div>
          {/* Title with shared layoutId */}
          <motion.h1
            layoutId={`nav-label-${itemId}`}
            className="text-2xl font-semibold text-[var(--foreground)]"
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 30,
            }}
          >
            {title}
          </motion.h1>

          {/* Subtitle fades in after transition */}
          <AnimatePresence>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="text-sm text-[var(--muted-foreground)] mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Actions fade in after transition */}
      <AnimatePresence>
        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.2 }}
          >
            {actions}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

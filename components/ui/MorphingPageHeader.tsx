'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigationMorph, morphEase, MorphableItemId } from '@/contexts/NavigationMorphContext';
import { HeaderIconAnimation } from './HeaderIconAnimations';
import type { RefObject } from 'react';

interface MorphingPageHeaderProps {
  itemId: MorphableItemId;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function MorphingPageHeader({
  itemId,
  icon,
  title,
  subtitle,
  actions,
  children,
}: MorphingPageHeaderProps) {
  const { registerHeaderTarget, floatingIcon } = useNavigationMorph();
  const headerIconRef = useRef<HTMLDivElement>(null);

  // Register header target on mount
  useEffect(() => {
    if (headerIconRef.current) {
      registerHeaderTarget(headerIconRef.current);
    }
    return () => {
      registerHeaderTarget(null);
    };
  }, [registerHeaderTarget]);

  const isReceivingAnimation = floatingIcon?.itemId === itemId;

  return (
    <div className="p-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          {/* Header Icon Container - Pulse Ripple Animation */}
          <HeaderIconAnimation
            isReceivingAnimation={isReceivingAnimation}
            animationStyle="pulse-ripple"
            headerIconRef={headerIconRef as RefObject<HTMLDivElement>}
          >
            {icon}
          </HeaderIconAnimation>

          <div className="overflow-hidden">
            {/* Title */}
            <motion.h1
              className="text-2xl font-semibold text-[var(--foreground)]"
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.35,
                delay: 0.1,
                ease: morphEase,
              }}
            >
              {title}
            </motion.h1>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                className="text-sm text-[var(--muted-foreground)] mt-1"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.3,
                  delay: 0.2,
                  ease: morphEase,
                }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.35,
              delay: 0.25,
              ease: morphEase,
            }}
          >
            {actions}
          </motion.div>
        )}
      </div>

      {/* Additional children content */}
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: 0.3,
            ease: morphEase,
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

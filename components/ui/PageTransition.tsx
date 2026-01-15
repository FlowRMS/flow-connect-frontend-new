'use client';

import { motion } from 'framer-motion';
import React from 'react';

// Custom easing curves - iOS/macOS native feel (matching NavigationMorphContext)
const morphEase = [0.22, 1, 0.36, 1] as const;

/**
 * Smooth page transition component using morph-style animation.
 * Creates a sleek fade/scale transition when navigating between pages.
 * No skeleton lines - just a smooth, elegant transition.
 */
export function PageTransition() {
  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.15,
        ease: morphEase,
      }}
    />
  );
}

/**
 * A minimal loading state that just shows a subtle fade.
 * Used for page transitions to avoid jarring skeleton lines.
 * No visible elements - just a smooth background that fades in.
 */
export function MinimalPageLoading() {
  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.12,
        ease: morphEase,
      }}
    />
  );
}

/**
 * Wraps page content with smooth morph-style entrance animation.
 * Use this to wrap the entire content of a page for smooth transitions.
 */
export function PageContentWrapper({ 
  children,
  className = '',
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`flex-1 flex flex-col overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: morphEase,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Provides staggered entrance animation for child elements.
 * Each child will animate in with a slight delay after the previous.
 */
export function StaggeredContent({ 
  children,
  className = '',
  staggerDelay = 0.05,
}: { 
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.2,
                ease: morphEase,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default PageTransition;

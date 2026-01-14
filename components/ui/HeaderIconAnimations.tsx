'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { snappyEase } from '@/contexts/NavigationMorphContext';

// Unique animation configurations for each CRM page
export type AnimationStyle =
  | 'pulse-ripple'      // Activity Feed - expanding rings
  | 'bounce-check'      // Tasks - bouncy checkmark feel
  | 'paper-flutter'     // Notes - gentle paper movement
  | 'gear-spin'         // Jobs - mechanical rotation
  | 'sparkle-burst';    // Pre-Opportunities - star sparkles

interface HeaderIconAnimationProps {
  isReceivingAnimation: boolean;
  animationStyle: AnimationStyle;
  children: React.ReactNode;
  headerIconRef: React.RefObject<HTMLDivElement>;
  /** If true, plays the animation on initial mount (for page load) */
  playOnMount?: boolean;
}

// Pulse Ripple - Activity Feed (expanding concentric rings)
function PulseRippleAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-xl border-2 border-[var(--primary)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5 + i * 0.3, opacity: [0, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.1 + i * 0.12 }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

// Bounce Check - Tasks (spring bounce with checkmark energy)
function BounceCheckAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Bouncing ring */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[var(--primary)]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: [0.5, 1.4, 0.85, 1.15, 1],
              opacity: [0, 0.9, 0.7, 0.5, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: snappyEase }}
          />
          {/* Success particles shooting up */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-green-500"
              initial={{
                x: 24,
                y: 24,
                scale: 0
              }}
              animate={{
                x: 24 + (i % 2 === 0 ? -18 : 18) * (1 + (i % 3) * 0.3),
                y: -15 - i * 6,
                scale: [0, 1.3, 0],
                opacity: [1, 0.9, 0]
              }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

// Paper Flutter - Notes (gentle floating paper effect)
function PaperFlutterAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Floating paper sheets */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-5 h-6 rounded-sm bg-gradient-to-br from-yellow-200 to-yellow-100 border border-yellow-300 shadow-sm"
              style={{
                left: 18 + i * 3,
                top: 18,
                transformOrigin: 'center'
              }}
              initial={{
                rotate: 0,
                y: 0,
                x: 0,
                opacity: 0,
                scale: 0.4
              }}
              animate={{
                rotate: [-8, 12, -10, 8, -5][i] || 0,
                y: [-8, -28 - i * 6],
                x: [0, (i - 1.5) * 18],
                opacity: [0, 1, 0.8, 0],
                scale: [0.4, 0.9, 0.7]
              }}
              transition={{
                duration: 0.8,
                delay: 0.05 + i * 0.1,
                ease: 'easeOut'
              }}
            />
          ))}
          {/* Soft glow */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ background: 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.8, 1.3, 1.5] }}
            transition={{ duration: 0.7, delay: 0.1 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Gear Spin - Jobs (mechanical rotation with energy)
function GearSpinAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Rotating energy ring */}
          <motion.div
            className="absolute inset-[-4px] rounded-2xl border-2 border-dashed border-[var(--primary)]"
            initial={{ rotate: 0, opacity: 0, scale: 0.8 }}
            animate={{
              rotate: 270,
              opacity: [0, 0.8, 0],
              scale: [0.8, 1.15, 1.4]
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          {/* Inner spinning accent */}
          <motion.div
            className="absolute inset-[4px] rounded-lg border-2 border-[var(--primary)]/60"
            initial={{ rotate: 0, opacity: 0 }}
            animate={{
              rotate: -135,
              opacity: [0, 0.6, 0]
            }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          {/* Energy sparks */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-2.5 rounded-full bg-blue-400"
              style={{ transformOrigin: 'center' }}
              initial={{
                x: 24,
                y: 24,
                rotate: i * 45,
                scale: 0
              }}
              animate={{
                x: 24 + Math.cos((i * 45 * Math.PI) / 180) * 32,
                y: 24 + Math.sin((i * 45 * Math.PI) / 180) * 32,
                rotate: i * 45 + 60,
                scale: [0, 1.2, 0],
                opacity: [1, 0.8, 0]
              }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.03 }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

// Sparkle Burst - Pre-Opportunities (star sparkles with golden glow)
function SparkleBurstAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Golden glow pulse */}
          <motion.div
            className="absolute inset-[-10px] rounded-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.5) 0%, transparent 60%)',
              filter: 'blur(6px)'
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0.5, 0], scale: [0.6, 1.4, 1.6] }}
            transition={{ duration: 0.7 }}
          />
          {/* Sparkle stars */}
          {[...Array(10)].map((_, i) => {
            const angle = (i * 36 * Math.PI) / 180;
            const distance = 28 + (i % 2) * 12;
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: 24,
                  top: 24,
                  width: 0,
                  height: 0
                }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: [0, 1.4, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.05 + i * 0.04,
                  ease: 'easeOut'
                }}
              >
                {/* 4-point star shape */}
                <svg width="10" height="10" viewBox="0 0 8 8" className="text-amber-400">
                  <path
                    d="M4 0L4.5 3.5L8 4L4.5 4.5L4 8L3.5 4.5L0 4L3.5 3.5L4 0Z"
                    fill="currentColor"
                  />
                </svg>
              </motion.div>
            );
          })}
          {/* Diamond accent */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-amber-400/70"
            initial={{ scale: 0.9, opacity: 0, rotate: 0 }}
            animate={{
              scale: [0.9, 1.25, 1.5],
              opacity: [0, 0.7, 0],
              rotate: [0, 20, 40]
            }}
            transition={{ duration: 0.7, delay: 0.1 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Icon animation variants for the icon itself
const iconAnimationVariants = {
  'pulse-ripple': {
    scale: [1, 1.15, 1.05, 1],
    rotate: [0, 6, -2, 0],
  },
  'bounce-check': {
    scale: [1, 0.8, 1.2, 0.92, 1.08, 1],
    rotate: [0, -6, 10, -4, 0],
  },
  'paper-flutter': {
    scale: [1, 1.08, 1.02, 1],
    rotate: [0, -10, 6, -4, 0],
    y: [0, -4, 2, 0],
  },
  'gear-spin': {
    scale: [1, 1.15, 1],
    rotate: [0, 60, 120],
  },
  'sparkle-burst': {
    scale: [1, 1.25, 1.15, 1],
    rotate: [0, 5, -3, 0],
    filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'],
  },
};

export function HeaderIconAnimation({
  isReceivingAnimation,
  animationStyle,
  children,
  headerIconRef,
  playOnMount = true,
}: HeaderIconAnimationProps) {
  // Track if we should play the initial mount animation
  const [hasPlayedInitial, setHasPlayedInitial] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Play animation on mount after a short delay
  useEffect(() => {
    if (playOnMount && !hasPlayedInitial) {
      // Small delay to let page render first
      const timer = setTimeout(() => {
        setShouldAnimate(true);
        setHasPlayedInitial(true);

        // Reset animation state after it completes
        const resetTimer = setTimeout(() => {
          setShouldAnimate(false);
        }, 800); // Animation duration + buffer

        return () => clearTimeout(resetTimer);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [playOnMount, hasPlayedInitial]);

  // Also animate when receiving morph animation from sidebar
  useEffect(() => {
    if (isReceivingAnimation) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isReceivingAnimation]);

  const renderAnimation = () => {
    switch (animationStyle) {
      case 'pulse-ripple':
        return <PulseRippleAnimation isReceiving={shouldAnimate} />;
      case 'bounce-check':
        return <BounceCheckAnimation isReceiving={shouldAnimate} />;
      case 'paper-flutter':
        return <PaperFlutterAnimation isReceiving={shouldAnimate} />;
      case 'gear-spin':
        return <GearSpinAnimation isReceiving={shouldAnimate} />;
      case 'sparkle-burst':
        return <SparkleBurstAnimation isReceiving={shouldAnimate} />;
      default:
        return <PulseRippleAnimation isReceiving={shouldAnimate} />;
    }
  };

  return (
    <motion.div
      ref={headerIconRef}
      className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"
      animate={
        shouldAnimate
          ? iconAnimationVariants[animationStyle]
          : { scale: 1, rotate: 0 }
      }
      transition={{
        duration: animationStyle === 'gear-spin' ? 0.7 : 0.6,
        delay: shouldAnimate ? 0.05 : 0,
        ease: snappyEase,
      }}
    >
      {renderAnimation()}

      <motion.div
        className="scale-[1.4]"
        animate={{ opacity: shouldAnimate ? 0.2 : 1 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// Export individual animations for custom use
export {
  PulseRippleAnimation,
  BounceCheckAnimation,
  PaperFlutterAnimation,
  GearSpinAnimation,
  SparkleBurstAnimation,
};

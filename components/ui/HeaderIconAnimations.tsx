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
  | 'sparkle-burst'     // Pre-Opportunities - star sparkles
  | 'document-stack'    // Quotes - stacking documents
  | 'package-reveal'    // Orders - package unwrapping
  | 'receipt-slide'     // Invoices - receipt printing
  | 'coin-cascade'      // Commissions - falling coins
  | 'scale-balance'     // Adjustments - balance scales
  | 'stamp-press'       // Acknowledgements - stamp/seal
  | 'contact-ripple'    // Contacts - people wave
  | 'crown-shine'       // Customers - VIP crown
  | 'building-rise'     // Companies - buildings growing
  | 'cube-rotate'       // Products - 3D cube rotation
  | 'factory-pulse'     // Manufacturers - factory gears
  // FlowAI animations
  | 'queue-pulse'       // FlowAI Queue - pulsing queue lines
  | 'upload-arrow'      // FlowAI Upload - arrow shooting up
  | 'template-stack'    // FlowAI Templates - layered templates
  | 'workflow-flow';    // FlowAI Workflows - flowing nodes

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

// Document Stack - Quotes (stacking documents with cascade effect)
function DocumentStackAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Stacking documents */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-8 h-10 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 shadow-sm"
              style={{ transformOrigin: 'center bottom' }}
              initial={{
                x: 8,
                y: 60,
                rotate: -10 + i * 5,
                opacity: 0,
                scale: 0.6
              }}
              animate={{
                x: 8 + i * 2,
                y: 1 - i * 3,
                rotate: [-10 + i * 5, -5 + i * 3, -2 + i * 2],
                opacity: [0, 1, 0.9, 0],
                scale: [0.6, 1, 0.95]
              }}
              transition={{
                duration: 0.7,
                delay: i * 0.08,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            />
          ))}
          {/* Shine line across */}
          <motion.div
            className="absolute w-12 h-1 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
            style={{ top: 24 }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 60, opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          {/* Outer glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.3, 1.5] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Package Reveal - Orders (unwrapping package with confetti)
function PackageRevealAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Box opening effect */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-orange-400"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.1, 0.95, 1.05],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{ duration: 0.6, ease: snappyEase }}
          />
          {/* Ribbon pieces flying off */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-1.5 rounded-full"
              style={{
                background: i % 2 === 0 ? '#f97316' : '#fbbf24',
                left: 24,
                top: 24
              }}
              initial={{ x: 0, y: 0, rotate: 0, scale: 0 }}
              animate={{
                x: Math.cos((i * 60 * Math.PI) / 180) * 35,
                y: Math.sin((i * 60 * Math.PI) / 180) * 35 - 10,
                rotate: [0, 180 + i * 30, 360 + i * 60],
                scale: [0, 1.2, 0],
                opacity: [1, 0.8, 0]
              }}
              transition={{ duration: 0.6, delay: 0.05 + i * 0.03 }}
            />
          ))}
          {/* Rising sparkles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`spark-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ left: 12 + i * 8, top: 30 }}
              initial={{ y: 0, opacity: 0, scale: 0 }}
              animate={{
                y: [-5, -35 - i * 5],
                opacity: [0, 1, 0],
                scale: [0, 1.3, 0]
              }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
            />
          ))}
          {/* Warm glow */}
          <motion.div
            className="absolute inset-[-8px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, transparent 65%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Receipt Slide - Invoices (receipt printing with feed effect)
function ReceiptSlideAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Receipt paper sliding out */}
          <motion.div
            className="absolute w-7 h-12 bg-gradient-to-b from-white to-gray-50 rounded-sm border border-gray-200 shadow-sm"
            style={{ left: 10, transformOrigin: 'top center' }}
            initial={{ y: 24, scaleY: 0, opacity: 0 }}
            animate={{
              y: [-8, 2, -2],
              scaleY: [0, 1, 1],
              opacity: [0, 1, 0.9, 0]
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Receipt lines */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-0.5 bg-gray-300/60 rounded-full"
                style={{ top: 8 + i * 8, left: 4, right: 4 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1] }}
                transition={{ duration: 0.2, delay: 0.2 + i * 0.08 }}
              />
            ))}
          </motion.div>
          {/* Green checkmark appearing */}
          <motion.div
            className="absolute w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
            style={{ right: 8, top: 8 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0.9, 0] }}
            transition={{ duration: 0.5, delay: 0.3, ease: snappyEase }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
              <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          {/* Subtle glow */}
          <motion.div
            className="absolute inset-[-4px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Coin Cascade - Commissions (falling coins with golden shimmer)
function CoinCascadeAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Falling coins */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full border-2"
              style={{
                background: `linear-gradient(135deg, #fcd34d ${i % 2 * 20}%, #f59e0b 100%)`,
                borderColor: '#d97706',
                left: 8 + (i % 4) * 10,
                top: -10
              }}
              initial={{ y: 0, x: 0, rotateY: 0, opacity: 0, scale: 0.5 }}
              animate={{
                y: [0, 55 + (i % 3) * 8],
                x: [(i % 2 === 0 ? -5 : 5), (i % 2 === 0 ? 5 : -5)],
                rotateY: [0, 180, 360, 540],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 0.9, 0.7]
              }}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            />
          ))}
          {/* Dollar sign burst */}
          <motion.div
            className="absolute text-amber-500 font-bold text-lg"
            style={{ left: 18, top: 12 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1.2], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            $
          </motion.div>
          {/* Golden shimmer */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.3) 40%, transparent 70%)'
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 1.4] }}
            transition={{ duration: 0.65 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Scale Balance - Adjustments (balance scales tipping and stabilizing)
function ScaleBalanceAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Scale beam */}
          <motion.div
            className="absolute w-10 h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 rounded-full"
            style={{ left: 7, top: 18, transformOrigin: 'center' }}
            initial={{ rotate: 0, scale: 0.8 }}
            animate={{
              rotate: [0, -20, 15, -8, 3, 0],
              scale: [0.8, 1.1, 1]
            }}
            transition={{ duration: 0.8, ease: snappyEase }}
          />
          {/* Left pan */}
          <motion.div
            className="absolute w-4 h-2 bg-purple-300 rounded-b-full border border-purple-400"
            style={{ left: 6, top: 22, transformOrigin: 'top center' }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [0, 8, 3, 6, 4],
              opacity: [0, 1, 1, 0.8, 0]
            }}
            transition={{ duration: 0.8 }}
          />
          {/* Right pan */}
          <motion.div
            className="absolute w-4 h-2 bg-purple-300 rounded-b-full border border-purple-400"
            style={{ right: 6, top: 22, transformOrigin: 'top center' }}
            initial={{ y: 0, opacity: 0 }}
            animate={{
              y: [0, 2, 9, 5, 4],
              opacity: [0, 1, 1, 0.8, 0]
            }}
            transition={{ duration: 0.8 }}
          />
          {/* Center pillar */}
          <motion.div
            className="absolute w-1 h-4 bg-purple-500 rounded-full"
            style={{ left: 23.5, top: 20 }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
          />
          {/* Equilibrium glow */}
          <motion.div
            className="absolute inset-[-4px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.8, 0] }}
            transition={{ duration: 0.8, times: [0, 0.4, 0.7, 1] }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Stamp Press - Acknowledgements (official stamp/seal pressing down)
function StampPressAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Stamp coming down */}
          <motion.div
            className="absolute w-10 h-10 rounded-full border-3 border-teal-500"
            style={{ left: 7, top: 7, borderWidth: 3 }}
            initial={{ y: -30, scale: 1.2, opacity: 0 }}
            animate={{
              y: [-30, 0, -3, 0],
              scale: [1.2, 1, 1.05, 1],
              opacity: [0, 1, 1, 0.8, 0]
            }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          />
          {/* Inner stamp design */}
          <motion.div
            className="absolute w-6 h-6 rounded-full bg-teal-500/20 border-2 border-teal-400"
            style={{ left: 11, top: 11 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.7, 0]
            }}
            transition={{ duration: 0.5, delay: 0.15 }}
          />
          {/* Checkmark appearing */}
          <motion.svg
            className="absolute text-teal-500"
            style={{ left: 15, top: 15 }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <motion.path
              d="M20 6L9 17L4 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1] }}
              transition={{ duration: 0.35, delay: 0.25 }}
            />
          </motion.svg>
          {/* Impact ripples */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-xl border-2 border-teal-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.4 + i * 0.25, opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

// Contact Ripple - Contacts (people silhouettes with connection waves)
function ContactRippleAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Central person icon effect */}
          <motion.div
            className="absolute w-6 h-6 rounded-full bg-indigo-500"
            style={{ left: 15, top: 10 }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, ease: snappyEase }}
          />
          {/* Person body */}
          <motion.div
            className="absolute w-10 h-4 rounded-t-full bg-indigo-400"
            style={{ left: 13, top: 22 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.08 }}
          />
          {/* Connection lines shooting out */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60 - 30) * (Math.PI / 180);
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-4 bg-indigo-400 rounded-full"
                style={{
                  left: 23,
                  top: 20,
                  transformOrigin: 'bottom center',
                  rotate: `${i * 60 - 90}deg`
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1, 0.8],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.04 }}
              />
            );
          })}
          {/* Small people dots appearing around */}
          {[...Array(4)].map((_, i) => {
            const angle = (i * 90 + 45) * (Math.PI / 180);
            const distance = 22;
            return (
              <motion.div
                key={`person-${i}`}
                className="absolute w-3 h-3 rounded-full bg-indigo-300"
                style={{
                  left: 22 + Math.cos(angle) * distance,
                  top: 22 + Math.sin(angle) * distance
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1, 0], opacity: [0, 1, 0.7, 0] }}
                transition={{ duration: 0.5, delay: 0.25 + i * 0.06 }}
              />
            );
          })}
          {/* Network glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.6 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Crown Shine - Customers (VIP crown with royal shine)
function CrownShineAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Crown shape */}
          <motion.div
            className="absolute"
            style={{ left: 10, top: 12 }}
            initial={{ y: -20, scale: 0.5, opacity: 0 }}
            animate={{
              y: [-20, 2, -2, 0],
              scale: [0.5, 1.2, 1],
              opacity: [0, 1, 0.9, 0]
            }}
            transition={{ duration: 0.6, ease: snappyEase }}
          >
            <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
              <motion.path
                d="M2 20L5 8L10 14L14 4L18 14L23 8L26 20H2Z"
                fill="url(#crownGrad)"
                stroke="#ca8a04"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4 }}
              />
              <defs>
                <linearGradient id="crownGrad" x1="14" y1="4" x2="14" y2="20">
                  <stop offset="0%" stopColor="#fcd34d"/>
                  <stop offset="100%" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          {/* Jewels sparkling */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#ef4444', '#3b82f6', '#22c55e'][i],
                left: 14 + i * 6,
                top: 16
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 1],
                opacity: [0, 1, 0.8, 0]
              }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
            />
          ))}
          {/* Royal sparkles */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            return (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute"
                style={{ left: 24, top: 16 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * 28,
                  y: Math.sin(angle) * 28,
                  scale: [0, 1, 0],
                  opacity: [1, 0.8, 0]
                }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.03 }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" className="text-yellow-400">
                  <path d="M4 0L4.5 3.5L8 4L4.5 4.5L4 8L3.5 4.5L0 4L3.5 3.5L4 0Z" fill="currentColor"/>
                </svg>
              </motion.div>
            );
          })}
          {/* Golden aura */}
          <motion.div
            className="absolute inset-[-8px] rounded-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 75%)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 1.4] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Building Rise - Companies (buildings growing up with windows lighting)
function BuildingRiseAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Buildings rising */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-sm"
              style={{
                width: 10 - i * 2,
                left: 8 + i * 12,
                bottom: 10,
                transformOrigin: 'bottom center'
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: [0, 30 - i * 6, 28 - i * 6],
                opacity: [0, 1, 0.9, 0]
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              {/* Windows lighting up */}
              {[...Array(3 - i)].map((_, j) => (
                <motion.div
                  key={j}
                  className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-sm"
                  style={{ left: 2, top: 4 + j * 6 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1, 0.8, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1 + j * 0.05 }}
                />
              ))}
            </motion.div>
          ))}
          {/* Ground line */}
          <motion.div
            className="absolute h-1 bg-slate-400 rounded-full"
            style={{ bottom: 8, left: 6, right: 6 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.4 }}
          />
          {/* City glow */}
          <motion.div
            className="absolute inset-[-4px] rounded-2xl"
            style={{ background: 'radial-gradient(circle at 50% 80%, rgba(100, 116, 139, 0.4) 0%, transparent 60%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Cube Rotate - Products (3D cube rotating with shine)
function CubeRotateAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* 3D cube effect */}
          <motion.div
            className="absolute w-8 h-8 border-2 border-cyan-500"
            style={{
              left: 12,
              top: 8,
              transformStyle: 'preserve-3d',
              perspective: 100
            }}
            initial={{ rotateX: -30, rotateY: -30, scale: 0.5, opacity: 0 }}
            animate={{
              rotateX: [-30, 30, 0],
              rotateY: [-30, 210, 360],
              scale: [0.5, 1.1, 1],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
          {/* Cube side faces */}
          <motion.div
            className="absolute w-6 h-6 bg-cyan-400/30 border border-cyan-400"
            style={{ left: 16, top: 12 }}
            initial={{ rotateY: 90, opacity: 0, scale: 0.8 }}
            animate={{
              rotateY: [90, 0],
              opacity: [0, 0.6, 0],
              scale: [0.8, 1]
            }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          {/* Scan line */}
          <motion.div
            className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{ left: 6 }}
            initial={{ top: 0, opacity: 0 }}
            animate={{ top: [0, 48], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          {/* Corner sparkles */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-cyan-300"
              style={{
                left: 10 + (i % 2) * 28,
                top: 6 + Math.floor(i / 2) * 28
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
            />
          ))}
          {/* Tech glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(34, 211, 238, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Factory Pulse - Manufacturers (factory with spinning gears)
function FactoryPulseAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Main factory body */}
          <motion.div
            className="absolute w-10 h-8 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-sm"
            style={{ left: 11, bottom: 10, transformOrigin: 'bottom center' }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1.1, 1],
              opacity: [0, 1, 0.9, 0]
            }}
            transition={{ duration: 0.5, ease: snappyEase }}
          />
          {/* Chimney */}
          <motion.div
            className="absolute w-3 h-6 bg-rose-600 rounded-t-sm"
            style={{ left: 26, bottom: 18, transformOrigin: 'bottom center' }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1.2, 1], opacity: [0, 1, 0.9, 0] }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          {/* Smoke puffs */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-gray-300/70"
              style={{ left: 25 + (i % 2) * 3, top: 6 }}
              initial={{ y: 0, scale: 0, opacity: 0 }}
              animate={{
                y: [-2, -20 - i * 6],
                scale: [0, 1 + i * 0.2, 0.5],
                opacity: [0, 0.7, 0],
                x: [0, (i % 2 === 0 ? -5 : 5)]
              }}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.08 }}
            />
          ))}
          {/* Spinning gear */}
          <motion.div
            className="absolute w-5 h-5 border-2 border-rose-300 rounded-full"
            style={{ left: 16, top: 18 }}
            initial={{ rotate: 0, scale: 0, opacity: 0 }}
            animate={{
              rotate: [0, 180, 360],
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* Gear teeth */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-rose-300"
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: -3,
                  marginTop: -3,
                  transform: `rotate(${i * 90}deg) translateY(-10px)`
                }}
              />
            ))}
          </motion.div>
          {/* Industrial glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(244, 63, 94, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Queue Pulse - FlowAI Queue (pulsing queue lines with processing effect)
function QueuePulseAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Pulsing queue lines */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1.5 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(59, 130, 246, ${0.8 - i * 0.15}), transparent)`,
                left: 6,
                right: 6,
                top: 10 + i * 8,
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{
                scaleX: [0, 1, 0.8],
                opacity: [0, 1, 0],
                x: [0, 5, 0],
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: snappyEase,
              }}
            />
          ))}
          {/* Processing dot moving along */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-blue-500"
            style={{ top: 22 }}
            initial={{ left: 6, opacity: 0, scale: 0 }}
            animate={{
              left: [6, 40, 6],
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0],
            }}
            transition={{ duration: 0.7, delay: 0.15 }}
          />
          {/* Pulse rings */}
          {[0, 1].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute inset-0 rounded-xl border-2 border-blue-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3 + i * 0.2, opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
            />
          ))}
          {/* Tech glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Upload Arrow - FlowAI Upload (arrow shooting upward with trail)
function UploadArrowAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Main upload arrow */}
          <motion.div
            className="absolute"
            style={{ left: 16, top: 24 }}
            initial={{ y: 20, opacity: 0, scale: 0.5 }}
            animate={{
              y: [20, -5, 0],
              opacity: [0, 1, 0.8, 0],
              scale: [0.5, 1.2, 1],
            }}
            transition={{ duration: 0.6, ease: snappyEase }}
          >
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <motion.path
                d="M8 18V4M8 4L2 10M8 4L14 10"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
            </svg>
          </motion.div>
          {/* Trail particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-green-400"
              style={{ left: 22 + (i % 2 === 0 ? -4 : 4), bottom: 8 }}
              initial={{ y: 0, opacity: 0, scale: 0 }}
              animate={{
                y: [-5, -30 - i * 5],
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
              }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.05 }}
            />
          ))}
          {/* Cloud/destination indicator */}
          <motion.div
            className="absolute w-10 h-4 rounded-full bg-green-200/50 border border-green-300/50"
            style={{ left: 9, top: 4 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          {/* Success sparkles */}
          {[...Array(6)].map((_, i) => {
            const angle = (i * 60) * (Math.PI / 180);
            return (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-green-400"
                style={{ left: 22, top: 8 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * 25,
                  y: Math.sin(angle) * 25,
                  scale: [0, 1.2, 0],
                  opacity: [1, 0.8, 0],
                }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.03 }}
              />
            );
          })}
          {/* Green glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(34, 197, 94, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Template Stack - FlowAI Templates (layered template cards)
function TemplateStackAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Stacking template cards */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-md border-2"
              style={{
                width: 24 - i * 2,
                height: 30 - i * 2,
                left: 12 + i * 3,
                background: `linear-gradient(135deg, rgba(168, 85, 247, ${0.3 - i * 0.08}) 0%, rgba(139, 92, 246, ${0.2 - i * 0.05}) 100%)`,
                borderColor: `rgba(168, 85, 247, ${0.6 - i * 0.15})`,
                transformOrigin: 'bottom center',
              }}
              initial={{
                y: 50,
                rotate: -15 + i * 8,
                opacity: 0,
                scale: 0.5,
              }}
              animate={{
                y: [50, 6 + i * 3, 8 + i * 3],
                rotate: [-15 + i * 8, -5 + i * 5, -3 + i * 4],
                opacity: [0, 1, 0.9, 0],
                scale: [0.5, 1.05, 1],
              }}
              transition={{
                duration: 0.65,
                delay: i * 0.08,
                ease: snappyEase,
              }}
            >
              {/* Template lines */}
              {[...Array(3)].map((_, j) => (
                <motion.div
                  key={j}
                  className="absolute h-0.5 bg-purple-300/50 rounded-full"
                  style={{ left: 3, right: 3, top: 6 + j * 6 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: [0, 1] }}
                  transition={{ duration: 0.2, delay: 0.25 + i * 0.08 + j * 0.03 }}
                />
              ))}
            </motion.div>
          ))}
          {/* Grid pattern overlay */}
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 8px,
                rgba(168, 85, 247, 0.1) 8px,
                rgba(168, 85, 247, 0.1) 9px
              )`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
          {/* Purple glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Workflow Flow - FlowAI Workflows (flowing connected nodes)
function WorkflowFlowAnimation({ isReceiving }: { isReceiving: boolean }) {
  return (
    <AnimatePresence>
      {isReceiving && (
        <>
          {/* Workflow nodes */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-md border-2 border-amber-400"
              style={{
                background: `rgba(251, 191, 36, ${0.3 - i * 0.05})`,
                left: 6 + i * 14,
                top: 20 - (i === 1 ? 6 : 0),
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.3, 1],
                opacity: [0, 1, 0.8, 0],
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.12,
                ease: snappyEase,
              }}
            />
          ))}
          {/* Connecting flow lines */}
          <motion.div
            className="absolute h-0.5 bg-gradient-to-r from-amber-400 to-amber-300"
            style={{ left: 14, top: 22, width: 10 }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.3, delay: 0.15 }}
          />
          <motion.div
            className="absolute h-0.5 bg-gradient-to-r from-amber-300 to-amber-400"
            style={{ left: 28, top: 22, width: 10 }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.3, delay: 0.27 }}
          />
          {/* Flow particles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ left: 12, top: 22 }}
              initial={{ x: 0, opacity: 0, scale: 0 }}
              animate={{
                x: [0, 28],
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
              }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
          {/* Data burst from nodes */}
          {[0, 2].map((nodeIdx) => (
            [...Array(3)].map((_, i) => {
              const angle = ((i - 1) * 45 - 90) * (Math.PI / 180);
              return (
                <motion.div
                  key={`burst-${nodeIdx}-${i}`}
                  className="absolute w-1 h-1 rounded-full bg-amber-300"
                  style={{
                    left: 12 + nodeIdx * 14,
                    top: 18,
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos(angle) * 15,
                    y: Math.sin(angle) * 15,
                    scale: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 0.4,
                    delay: 0.35 + nodeIdx * 0.1 + i * 0.03,
                  }}
                />
              );
            })
          ))}
          {/* Amber glow */}
          <motion.div
            className="absolute inset-[-6px] rounded-2xl"
            style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.5) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.7 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// Icon animation variants for the icon itself
const iconAnimationVariants: Record<AnimationStyle, { scale?: number[]; rotate?: number[]; y?: number[] }> = {
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
  },
  'document-stack': {
    scale: [1, 1.12, 1.05, 1],
    rotate: [0, -4, 2, 0],
    y: [0, -3, 1, 0],
  },
  'package-reveal': {
    scale: [1, 0.9, 1.2, 1.05, 1],
    rotate: [0, -5, 8, -2, 0],
  },
  'receipt-slide': {
    scale: [1, 1.1, 1.02, 1],
    y: [0, -5, 2, 0],
  },
  'coin-cascade': {
    scale: [1, 1.15, 1.08, 1],
    rotate: [0, 8, -4, 0],
  },
  'scale-balance': {
    scale: [1, 1.08, 0.95, 1.02, 1],
    rotate: [0, -10, 8, -3, 0],
  },
  'stamp-press': {
    scale: [1, 0.85, 1.15, 1],
    y: [0, 3, -2, 0],
  },
  'contact-ripple': {
    scale: [1, 1.18, 1.05, 1],
    rotate: [0, 5, -3, 0],
  },
  'crown-shine': {
    scale: [1, 1.2, 1.1, 1],
    rotate: [0, -6, 4, 0],
    y: [0, -4, 1, 0],
  },
  'building-rise': {
    scale: [1, 1.1, 1.05, 1],
    y: [0, -5, 2, 0],
  },
  'cube-rotate': {
    scale: [1, 1.15, 1],
    rotate: [0, 15, 0],
  },
  'factory-pulse': {
    scale: [1, 1.12, 1.05, 1],
    rotate: [0, -3, 2, 0],
  },
  // FlowAI animation variants
  'queue-pulse': {
    scale: [1, 1.1, 1.05, 1],
    rotate: [0, 3, -2, 0],
  },
  'upload-arrow': {
    scale: [1, 1.15, 1.08, 1],
    y: [0, -6, 2, 0],
  },
  'template-stack': {
    scale: [1, 1.12, 1.05, 1],
    rotate: [0, -5, 3, 0],
    y: [0, -3, 1, 0],
  },
  'workflow-flow': {
    scale: [1, 1.1, 1.05, 1],
    rotate: [0, 4, -2, 0],
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
      case 'document-stack':
        return <DocumentStackAnimation isReceiving={shouldAnimate} />;
      case 'package-reveal':
        return <PackageRevealAnimation isReceiving={shouldAnimate} />;
      case 'receipt-slide':
        return <ReceiptSlideAnimation isReceiving={shouldAnimate} />;
      case 'coin-cascade':
        return <CoinCascadeAnimation isReceiving={shouldAnimate} />;
      case 'scale-balance':
        return <ScaleBalanceAnimation isReceiving={shouldAnimate} />;
      case 'stamp-press':
        return <StampPressAnimation isReceiving={shouldAnimate} />;
      case 'contact-ripple':
        return <ContactRippleAnimation isReceiving={shouldAnimate} />;
      case 'crown-shine':
        return <CrownShineAnimation isReceiving={shouldAnimate} />;
      case 'building-rise':
        return <BuildingRiseAnimation isReceiving={shouldAnimate} />;
      case 'cube-rotate':
        return <CubeRotateAnimation isReceiving={shouldAnimate} />;
      case 'factory-pulse':
        return <FactoryPulseAnimation isReceiving={shouldAnimate} />;
      // FlowAI animations
      case 'queue-pulse':
        return <QueuePulseAnimation isReceiving={shouldAnimate} />;
      case 'upload-arrow':
        return <UploadArrowAnimation isReceiving={shouldAnimate} />;
      case 'template-stack':
        return <TemplateStackAnimation isReceiving={shouldAnimate} />;
      case 'workflow-flow':
        return <WorkflowFlowAnimation isReceiving={shouldAnimate} />;
      default:
        return <PulseRippleAnimation isReceiving={shouldAnimate} />;
    }
  };

  return (
    <motion.div
      ref={headerIconRef}
      className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] overflow-visible"
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
  DocumentStackAnimation,
  PackageRevealAnimation,
  ReceiptSlideAnimation,
  CoinCascadeAnimation,
  ScaleBalanceAnimation,
  StampPressAnimation,
  ContactRippleAnimation,
  CrownShineAnimation,
  BuildingRiseAnimation,
  CubeRotateAnimation,
  FactoryPulseAnimation,
  // FlowAI animations
  QueuePulseAnimation,
  UploadArrowAnimation,
  TemplateStackAnimation,
  WorkflowFlowAnimation,
};

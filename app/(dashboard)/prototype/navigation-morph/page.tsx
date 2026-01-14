'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// Demo icons matching your CRM style
const icons = {
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <path d="M3 6h18"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  contacts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  invoices: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M8 12h8M8 16h4"/>
      <circle cx="16" cy="16" r="2"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18"/>
      <path d="M18 17V9"/>
      <path d="M13 17V5"/>
      <path d="M8 17v-3"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
    </svg>
  ),
};

type PageId = 'orders' | 'contacts' | 'invoices' | 'analytics' | 'settings';

const pages: { id: PageId; label: string; subtitle: string }[] = [
  { id: 'orders', label: 'Orders', subtitle: 'Manage and track all orders' },
  { id: 'contacts', label: 'Contacts', subtitle: '2,847 contacts in your database' },
  { id: 'invoices', label: 'Invoices', subtitle: '$1.2M in pending invoices' },
  { id: 'analytics', label: 'Analytics', subtitle: 'Real-time business insights' },
  { id: 'settings', label: 'Settings', subtitle: 'Configure your workspace' },
];

// Custom easing - this is the secret sauce
// Bezier curve that feels like iOS/macOS native animations
const customEase = [0.22, 1, 0.36, 1] as const;
const snappyEase = [0.34, 1.56, 0.64, 1] as const; // Slight overshoot for that premium feel

interface FloatingIconState {
  isVisible: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  icon: React.ReactNode;
  pageId: PageId;
}

export default function NavigationMorphPrototype() {
  const [activePage, setActivePage] = useState<PageId>('orders');
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatingIcon, setFloatingIcon] = useState<FloatingIconState | null>(null);
  const [contentKey, setContentKey] = useState(0);

  const sidebarRefs = useRef<Record<PageId, HTMLButtonElement | null>>({
    orders: null,
    contacts: null,
    invoices: null,
    analytics: null,
    settings: null,
  });
  const headerIconRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const floatingControls = useAnimation();

  const handleNavClick = useCallback(async (pageId: PageId) => {
    if (pageId === activePage || isAnimating) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActivePage(pageId);
      setContentKey(k => k + 1);
      return;
    }

    const sourceEl = sidebarRefs.current[pageId];
    const targetEl = headerIconRef.current;
    const container = containerRef.current;

    if (!sourceEl || !targetEl || !container) {
      setActivePage(pageId);
      setContentKey(k => k + 1);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // Calculate positions relative to container
    const startX = sourceRect.left - containerRect.left + sourceRect.width / 2 - 24;
    const startY = sourceRect.top - containerRect.top + sourceRect.height / 2 - 24;
    const endX = targetRect.left - containerRect.left + targetRect.width / 2 - 24;
    const endY = targetRect.top - containerRect.top + targetRect.height / 2 - 24;

    setIsAnimating(true);

    // Set up floating icon
    setFloatingIcon({
      isVisible: true,
      startX,
      startY,
      endX,
      endY,
      icon: icons[pageId],
      pageId,
    });

    // Animate the floating icon
    await floatingControls.start({
      x: endX,
      y: endY,
      scale: 1.5,
      transition: {
        duration: 0.5,
        ease: customEase,
        scale: {
          duration: 0.5,
          ease: snappyEase,
        }
      }
    });

    // Update state
    setActivePage(pageId);
    setContentKey(k => k + 1);

    // Clean up floating icon
    setTimeout(() => {
      setFloatingIcon(null);
      floatingControls.set({ x: 0, y: 0, scale: 1 });
      setIsAnimating(false);
    }, 50);

  }, [activePage, isAnimating, floatingControls]);

  // Reset floating controls when floatingIcon changes
  useEffect(() => {
    if (floatingIcon) {
      floatingControls.set({
        x: floatingIcon.startX,
        y: floatingIcon.startY,
        scale: 1,
      });
    }
  }, [floatingIcon, floatingControls]);

  const currentPage = pages.find((p) => p.id === activePage)!;

  return (
    <div ref={containerRef} className="relative flex h-full bg-[var(--background)] overflow-hidden">

      {/* FLOATING ICON - The magic element */}
      <AnimatePresence>
        {floatingIcon && (
          <motion.div
            className="fixed z-50 pointer-events-none"
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
                opacity: [0, 0.6, 0.3, 0],
                scale: [0.8, 1.2, 1.4, 1.6],
              }}
              transition={{
                duration: 0.6,
                ease: 'easeOut',
              }}
              style={{
                background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />

            {/* Motion blur effect */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--primary)]/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1] }}
              transition={{ duration: 0.15 }}
              style={{
                backdropFilter: 'blur(4px)',
              }}
            >
              {/* Icon with scaling */}
              <motion.div
                className="text-[var(--primary)]"
                initial={{ scale: 1, rotate: 0 }}
                animate={{
                  scale: [1, 1.1, 1.3],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: customEase,
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

            {/* Particle burst effect */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
                initial={{
                  x: 24,
                  y: 24,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: 24 + Math.cos((i * 60 * Math.PI) / 180) * 40,
                  y: 24 + Math.sin((i * 60 * Math.PI) / 180) * 40,
                  scale: [0, 1, 0],
                  opacity: [1, 0.8, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: 0.1,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo Sidebar */}
      <div className="w-60 bg-[var(--card)] border-r border-[var(--border)] flex flex-col relative z-10">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Navigation Morph</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Version 2.0 - Premium</p>
        </div>

        <nav className="flex-1 p-3">
          <div className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider px-3 py-2">
            Menu
          </div>

          {pages.map((page) => {
            const isActive = activePage === page.id;
            const isThisAnimating = floatingIcon?.pageId === page.id;

            return (
              <motion.button
                key={page.id}
                ref={(el) => { sidebarRefs.current[page.id] = el; }}
                onClick={() => handleNavClick(page.id)}
                className={`
                  relative w-full flex items-center gap-3 px-3 py-2.5
                  rounded-lg text-sm font-medium mb-1 text-left
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }
                `}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {/* Icon */}
                <motion.div
                  className="flex items-center justify-center flex-shrink-0"
                  animate={{
                    opacity: isThisAnimating ? 0 : 1,
                    scale: isThisAnimating ? 0.5 : 1,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {icons[page.id]}
                </motion.div>

                {/* Label */}
                <motion.span
                  className="whitespace-nowrap"
                  animate={{
                    opacity: isThisAnimating ? 0.5 : 1,
                    x: isThisAnimating ? -8 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {page.label}
                </motion.span>

                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--muted-foreground)]">
            Click items to see the effect
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        <motion.div
          className="p-6 pb-4 border-b border-[var(--border)]"
          initial={false}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              {/* Header Icon Container - Target for animation */}
              <motion.div
                ref={headerIconRef}
                className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"
                animate={{
                  scale: floatingIcon ? [1, 1.1, 1] : 1,
                  rotate: floatingIcon ? [0, 5, 0] : 0,
                }}
                transition={{
                  duration: 0.3,
                  delay: 0.35,
                  ease: snappyEase,
                }}
              >
                {/* Ring pulse effect when receiving */}
                <AnimatePresence>
                  {floatingIcon && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-[var(--primary)]"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  className="scale-[1.4]"
                  animate={{
                    opacity: floatingIcon ? 0.3 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {icons[activePage]}
                </motion.div>
              </motion.div>

              <div className="overflow-hidden">
                {/* Title */}
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={activePage}
                    className="text-2xl font-semibold text-[var(--foreground)]"
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{
                      duration: 0.35,
                      delay: 0.1,
                      ease: customEase,
                    }}
                  >
                    {currentPage.label}
                  </motion.h1>
                </AnimatePresence>

                {/* Subtitle */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activePage + '-sub'}
                    className="text-sm text-[var(--muted-foreground)] mt-1"
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{
                      duration: 0.3,
                      delay: 0.2,
                      ease: customEase,
                    }}
                  >
                    {currentPage.subtitle}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Actions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage + '-actions'}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
                transition={{
                  duration: 0.35,
                  delay: 0.25,
                  ease: customEase,
                }}
              >
                <motion.button
                  className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Export
                </motion.button>
                <motion.button
                  className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  + New {currentPage.label.slice(0, -1)}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={contentKey}
              initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, scale: 0.98, filter: 'blur(8px)' }}
              transition={{
                duration: 0.4,
                delay: 0.15,
                ease: customEase,
              }}
            >
              {/* Metric cards with staggered entry */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={`${contentKey}-card-${i}`}
                    className="p-4 bg-[var(--card)] rounded-xl border border-[var(--border)]"
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.2 + i * 0.08,
                      ease: customEase,
                    }}
                  >
                    <div className="text-sm text-[var(--muted-foreground)]">Metric {i}</div>
                    <motion.div
                      className="text-2xl font-semibold text-[var(--foreground)] mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
                    >
                      {Math.floor(Math.random() * 10000).toLocaleString()}
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Table with slide up */}
              <motion.div
                className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.35,
                  ease: customEase,
                }}
              >
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <h3 className="font-medium text-[var(--foreground)]">
                    Recent {currentPage.label}
                  </h3>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={`${contentKey}-row-${i}`}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)]/50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.4 + i * 0.05,
                        ease: customEase,
                      }}
                      whileHover={{ x: 4, backgroundColor: 'var(--muted)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium">
                          {String.fromCharCode(64 + i)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--foreground)]">
                            Sample Item {i}
                          </div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            Created recently
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-[var(--muted-foreground)]">
                        ${(Math.random() * 10000).toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

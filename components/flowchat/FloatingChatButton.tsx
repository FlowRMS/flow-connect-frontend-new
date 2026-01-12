'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles, Command, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFlowChat, getEntityDisplayName } from '@/contexts/FlowChatContext';
import type { EntityTypeValue } from '@/contexts/FlowChatContext';
import { cn } from '@/lib/flow-ai/cn';

export function FloatingChatButton() {
  const {
    isOpen,
    toggleChat,
    pageContext,
    entityContext,
    isShortcutHintVisible,
    hideShortcutHint,
  } = useFlowChat();

  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [isMac, setIsMac] = useState(false);
  const [isContextBadgeDismissed, setIsContextBadgeDismissed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Detect if Mac for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  // Load hidden state from localStorage
  useEffect(() => {
    const hiddenState = localStorage.getItem('flowchat-widget-hidden');
    if (hiddenState === 'true') {
      setIsHidden(true);
    }
  }, []);

  // Stop pulse animation after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Reset context badge dismissed state when entity changes
  useEffect(() => {
    setIsContextBadgeDismissed(false);
  }, [entityContext?.id]);

  const toggleHidden = () => {
    const newHiddenState = !isHidden;
    setIsHidden(newHiddenState);
    localStorage.setItem('flowchat-widget-hidden', String(newHiddenState));
  };

  const entityName = pageContext.entityType ? getEntityDisplayName(pageContext.entityType) : null;
  const showContextBadge = pageContext.isDetailPage && pageContext.entityType;

  // Hide the floating button when panel is open to prevent overlap
  if (isOpen) {
    return null;
  }

  // Show pull-out tab when widget is hidden
  if (isHidden) {
    return (
      <motion.button
        onClick={toggleHidden}
        className={cn(
          'fixed bottom-6 right-0 z-[100]',
          'flex items-center justify-center',
          'w-6 h-14 rounded-l-lg',
          'bg-gradient-to-br from-primary via-primary to-secondary',
          'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background'
        )}
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ x: -4 }}
        title="Show chat assistant"
      >
        <ChevronLeft className="w-4 h-4 text-primary-foreground" />
      </motion.button>
    );
  }

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      >
        {/* Keyboard Shortcut Hint */}
        <AnimatePresence>
          {isShortcutHintVisible && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="bg-background/95 backdrop-blur-md border border-border/50 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2"
            >
              <span className="text-xs text-muted-foreground">Quick open:</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono font-medium text-muted-foreground border border-border/50">
                {isMac ? <Command className="w-2.5 h-2.5" /> : 'Ctrl'}
                <span>+</span>
                <span>K</span>
              </kbd>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hideShortcutHint();
                }}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Badge - Shows when on a detail page */}
        <AnimatePresence>
          {showContextBadge && !isOpen && !isContextBadgeDismissed && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-md border border-primary/20 rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2"
            >
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={toggleChat}
              >
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-xs font-medium text-foreground">
                  Ask about this {entityName?.toLowerCase()}
                  {entityContext?.number && <span className="font-semibold"> #{entityContext.number}</span>}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsContextBadgeDismissed(true);
                }}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button with Hide Control */}
        <div className="flex items-center gap-2">
          {/* Hide Button - always visible, positioned to the left */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              toggleHidden();
            }}
            className={cn(
              'flex items-center justify-center',
              'w-8 h-8 rounded-full',
              'bg-background/95 hover:bg-muted border border-border',
              'shadow-md hover:shadow-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            title="Hide chat assistant"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>

          <motion.button
            onClick={toggleChat}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'relative flex items-center justify-center',
              'w-14 h-14 rounded-2xl',
              'bg-gradient-to-br from-primary via-primary to-secondary',
              'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30',
              'transition-all duration-300 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
              isOpen && 'rotate-0'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse Animation */}
            {showPulse && !isOpen && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-primary/30"
                  animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-primary/20"
                  animate={{ scale: [1, 1.8, 1.8], opacity: [0.3, 0, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                />
              </>
            )}

            {/* Hover Glow Effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />

            {/* Icon */}
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6 text-primary-foreground" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                  {/* Sparkle indicator when on detail page */}
                  {showContextBadge && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-primary"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

      </motion.div>
    </>
  );
}

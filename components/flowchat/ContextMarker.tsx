'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Zap, HelpCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { useFlowChat } from '@/contexts/FlowChatContext';
import { cn } from '@/lib/flow-ai/cn';

export type MarkerType = 'insight' | 'action' | 'help' | 'trend' | 'alert';

interface ContextMarkerProps {
  type: MarkerType;
  title: string;
  description: string;
  prompt: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}

const MARKER_ICONS: Record<MarkerType, React.ComponentType<{ className?: string }>> = {
  insight: Sparkles,
  action: Zap,
  help: HelpCircle,
  trend: TrendingUp,
  alert: AlertCircle,
};

const MARKER_COLORS: Record<MarkerType, { bg: string; border: string; text: string }> = {
  insight: { bg: 'from-purple-500/10 to-pink-500/10', border: 'border-purple-500/30', text: 'text-purple-500' },
  action: { bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/30', text: 'text-blue-500' },
  help: { bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/30', text: 'text-green-500' },
  trend: { bg: 'from-orange-500/10 to-yellow-500/10', border: 'border-orange-500/30', text: 'text-orange-500' },
  alert: { bg: 'from-red-500/10 to-rose-500/10', border: 'border-red-500/30', text: 'text-red-500' },
};

/**
 * ContextMarker - A floating AI suggestion marker
 *
 * Place this component next to any UI element to show
 * a small AI insight/action marker that users can click
 * to open FlowChat with a pre-filled contextual prompt.
 *
 * Example usage:
 * ```tsx
 * <ContextMarker
 *   type="insight"
 *   title="Revenue Analysis"
 *   description="Get AI insights on this customer's revenue trends"
 *   prompt="Analyze the revenue trends for this customer and suggest opportunities."
 * >
 *   <div className="relative">
 *     <CustomerRevenueCard />
 *   </div>
 * </ContextMarker>
 * ```
 */
export function ContextMarker({
  type,
  title,
  description,
  prompt,
  position = 'right',
  className,
  children,
}: ContextMarkerProps) {
  const { sendWithContext } = useFlowChat();
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return <>{children}</>;
  }

  const Icon = MARKER_ICONS[type];
  const colors = MARKER_COLORS[type];

  const handleClick = () => {
    sendWithContext(prompt, true);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const markerPositionClasses = {
    top: '-top-2 left-1/2 -translate-x-1/2',
    bottom: '-bottom-2 left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2 -left-2',
    right: 'top-1/2 -translate-y-1/2 -right-2',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {children}

      {/* Marker Dot */}
      <motion.button
        className={cn(
          'absolute z-10',
          markerPositionClasses[position],
          'w-4 h-4 rounded-full',
          'bg-gradient-to-br',
          colors.bg,
          colors.border,
          'border',
          'flex items-center justify-center',
          'cursor-pointer',
          'hover:scale-125 transition-transform',
          'shadow-sm'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Icon className={cn('w-2.5 h-2.5', colors.text)} />

        {/* Pulse animation */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full',
            colors.border.replace('border-', 'bg-').replace('/30', '/20')
          )}
          animate={{ scale: [1, 1.8, 1.8], opacity: [0.5, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? -5 : 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'absolute z-20',
              positionClasses[position],
              'w-64 p-3 rounded-lg',
              'bg-background/95 backdrop-blur-md',
              'border shadow-lg',
              colors.border
            )}
          >
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex-shrink-0',
                  'bg-gradient-to-br flex items-center justify-center',
                  colors.bg
                )}
              >
                <Icon className={cn('w-4 h-4', colors.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDismissed(true);
                }}
              >
                Dismiss
              </button>
              <button
                className={cn(
                  'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md',
                  'bg-gradient-to-br',
                  colors.bg,
                  colors.text,
                  'hover:opacity-80 transition-opacity'
                )}
                onClick={handleClick}
              >
                <MessageSquare className="w-3 h-3" />
                Ask AI
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * useFlowChatTrigger - Hook to trigger FlowChat from anywhere
 *
 * Returns a function that opens FlowChat with a pre-filled message.
 *
 * Example usage:
 * ```tsx
 * const triggerFlowChat = useFlowChatTrigger();
 *
 * <button onClick={() => triggerFlowChat("Analyze this order's profitability")}>
 *   AI Analysis
 * </button>
 * ```
 */
export function useFlowChatTrigger() {
  const { sendWithContext, openChat } = useFlowChat();

  return {
    trigger: (prompt: string, includeContext = true) => {
      sendWithContext(prompt, includeContext);
    },
    open: openChat,
  };
}

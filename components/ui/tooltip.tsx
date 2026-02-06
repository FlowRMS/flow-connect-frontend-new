'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface TooltipContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

interface TooltipProps {
  children: React.ReactNode;
}

export function Tooltip({ children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block" ref={triggerRef}>{children}</div>
    </TooltipContext.Provider>
  );
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export function TooltipTrigger({ asChild, children, className, onMouseEnter, onMouseLeave, ...props }: TooltipTriggerProps) {
  const context = React.useContext(TooltipContext);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    context?.setIsOpen(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    context?.setIsOpen(false);
    onMouseLeave?.(e);
  };

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      className: cn(children.props.className, className),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className={cn('inline-block', className)} {...props}>
      {children}
    </div>
  );
}

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: React.ReactNode;
}

export function TooltipContent({ side = 'top', children, className, ...props }: TooltipContentProps) {
  const context = React.useContext(TooltipContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset positioning state when tooltip closes
  useEffect(() => {
    if (!context?.isOpen) {
      setIsPositioned(false);
    }
  }, [context?.isOpen]);

  // Calculate position after content is rendered
  useEffect(() => {
    if (!context?.isOpen || !context?.triggerRef?.current || !contentRef.current) {
      return;
    }

    // Use requestAnimationFrame to ensure content is rendered and measured
    const frameId = requestAnimationFrame(() => {
      const triggerRect = context.triggerRef.current?.getBoundingClientRect();
      const contentRect = contentRef.current?.getBoundingClientRect();

      if (!triggerRect || !contentRect) return;

      const contentWidth = contentRect.width;
      const contentHeight = contentRect.height;
      const gap = 8;

      let top = 0;
      let left = 0;

      // Fixed positioning uses viewport coordinates directly (no scroll offset needed)
      switch (side) {
        case 'top':
          top = triggerRect.top - contentHeight - gap;
          left = triggerRect.left + (triggerRect.width / 2) - (contentWidth / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + gap;
          left = triggerRect.left + (triggerRect.width / 2) - (contentWidth / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (contentHeight / 2);
          left = triggerRect.left - contentWidth - gap;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (contentHeight / 2);
          left = triggerRect.right + gap;
          break;
      }

      // Keep tooltip within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 8) left = 8;
      if (left + contentWidth > viewportWidth - 8) left = viewportWidth - contentWidth - 8;
      if (top < 8) top = 8;
      if (top + contentHeight > viewportHeight - 8) top = viewportHeight - contentHeight - 8;

      setPosition({ top, left });
      setIsPositioned(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, [context?.isOpen, side, mounted]);

  if (!mounted || !context?.isOpen) {
    return null;
  }

  const tooltipContent = (
    <div
      ref={contentRef}
      className={cn(
        'fixed z-[9999] rounded-md bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg border max-w-md',
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        visibility: isPositioned ? 'visible' : 'hidden'
      }}
      {...props}
    >
      {children}
    </div>
  );

  return createPortal(tooltipContent, document.body);
}

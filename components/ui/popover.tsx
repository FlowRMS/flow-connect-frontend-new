'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const context = React.useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a Popover');
  }
  return context;
}

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function PopoverTrigger({ children, asChild, className }: PopoverTriggerProps) {
  const { open, setOpen } = usePopoverContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  );
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function PopoverContent({
  children,
  className,
  align = 'center',
  sideOffset = 4
}: PopoverContentProps) {
  const { open, setOpen } = usePopoverContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        // Check if the click is on the trigger button
        const trigger = contentRef.current.parentElement?.querySelector('[data-popover-trigger]');
        if (trigger?.contains(event.target as Node)) return;
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute z-50 mt-1 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
        'animate-in fade-in-0 zoom-in-95',
        align === 'start' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'end' && 'right-0',
        className
      )}
      style={{ marginTop: sideOffset }}
    >
      {children}
    </div>
  );
}

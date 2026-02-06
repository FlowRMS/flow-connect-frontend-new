import React from 'react';

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  className?: string;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function Sheet({ children }: SheetProps) {
  // Minimal implementation: just render children. The consuming layout controls visibility.
  return <>{children}</>;
}

export function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  // If asChild is true we expect a single child element and render it directly so it can receive props.
  if (asChild) return <>{children}</>;
  return <button type="button">{children}</button>;
}

export function SheetContent({ children, className, side }: { children?: React.ReactNode; className?: string; side?: 'left' | 'right' | 'top' | 'bottom' }) {
  // Minimal behavior: side is acknowledged so TypeScript consumers can pass it
  return <div data-side={side} className={className}>{children}</div>;
}

export default Sheet;

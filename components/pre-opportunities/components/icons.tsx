/**
 * Pre-Opportunity Icon Components
 * Reusable SVG icons for the Pre-Opportunities module
 */

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const defaultSize = 16;

/**
 * Board/Kanban view icon
 */
export function BoardIcon({ className = '', size = defaultSize }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <rect x="3" y="3" width="5" height="14" />
      <rect x="12" y="3" width="5" height="14" />
    </svg>
  );
}

/**
 * List view icon
 */
export function ListIcon({ className = '', size = defaultSize }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Plus/Add icon (with circle)
 */
export function PlusCircleIcon({ className = '', size = defaultSize }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="10" cy="10" r="7" />
      <path d="M10 7v6M7 10h6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Plus/Add icon (simple)
 */
export function PlusIcon({ className = '', size = defaultSize }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M10 6v8M6 10h8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Close/Delete icon (X)
 */
export function CloseIcon({ className = '', size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Drag indicator dots
 */
export function DragIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-0.5 ${className}`}>
      <div className="w-1 h-1 bg-gray-300 rounded-full" />
      <div className="w-1 h-1 bg-gray-300 rounded-full" />
      <div className="w-1 h-1 bg-gray-300 rounded-full" />
    </div>
  );
}

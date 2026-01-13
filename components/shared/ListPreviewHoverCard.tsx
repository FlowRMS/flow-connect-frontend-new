/**
 * ListPreviewHoverCard Component
 * A clean, reusable hover card for displaying lists of items in landing pages
 *
 * Features:
 * - Shows "first item + N more" in collapsed state
 * - Smooth hover animation to reveal all items
 * - Configurable colors and styling per list type
 * - Portal-based rendering for proper z-index layering
 * - Smart positioning to avoid viewport overflow
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ============================================================================
// Types
// ============================================================================

export type ListItemType =
  | 'partNumber'
  | 'salesRep'
  | 'factory'
  | 'endUser'
  | 'category'
  | 'custom';

export interface SalesRepItem {
  fullName?: string;
  avgSplitRate?: number;
  total?: number;
}

export interface ListPreviewHoverCardProps {
  /** The list of items to display */
  items: string[] | SalesRepItem[];
  /** The type of list - determines styling */
  type: ListItemType;
  /** Custom label for the hover card header (optional) */
  label?: string;
  /** Custom colors for the badge and hover card (optional) */
  customColors?: {
    badge: string;
    badgeText: string;
    hoverBg: string;
    hoverBorder: string;
    accent: string;
  };
  /** Max width for the collapsed badge */
  maxBadgeWidth?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const TYPE_CONFIG: Record<ListItemType, {
  label: string;
  colors: {
    badge: string;
    badgeText: string;
    countBadge: string;
    countText: string;
    hoverBg: string;
    hoverBorder: string;
    accent: string;
    headerBg: string;
    headerText: string;
    itemBg: string;
    itemText: string;
  };
  icon: React.ReactNode;
}> = {
  partNumber: {
    label: 'Part Numbers',
    colors: {
      badge: 'bg-gray-100',
      badgeText: 'text-gray-700',
      countBadge: 'bg-gray-200',
      countText: 'text-gray-600',
      hoverBg: 'from-gray-50 to-slate-50',
      hoverBorder: 'border-gray-200',
      accent: '#6b7280',
      headerBg: 'bg-gradient-to-r from-gray-500 to-slate-600',
      headerText: 'text-white',
      itemBg: 'bg-gray-50 hover:bg-gray-100',
      itemText: 'text-gray-700',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  salesRep: {
    label: 'Sales Reps',
    colors: {
      badge: 'bg-blue-50',
      badgeText: 'text-blue-700',
      countBadge: 'bg-blue-100',
      countText: 'text-blue-600',
      hoverBg: 'from-blue-50 to-indigo-50',
      hoverBorder: 'border-blue-200',
      accent: '#3b82f6',
      headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      headerText: 'text-white',
      itemBg: 'bg-blue-50/50 hover:bg-blue-50',
      itemText: 'text-blue-700',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  factory: {
    label: 'Factories',
    colors: {
      badge: 'bg-purple-100',
      badgeText: 'text-purple-700',
      countBadge: 'bg-purple-200',
      countText: 'text-purple-600',
      hoverBg: 'from-purple-50 to-violet-50',
      hoverBorder: 'border-purple-200',
      accent: '#8b5cf6',
      headerBg: 'bg-gradient-to-r from-purple-500 to-violet-600',
      headerText: 'text-white',
      itemBg: 'bg-purple-50/50 hover:bg-purple-50',
      itemText: 'text-purple-700',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  endUser: {
    label: 'End Users',
    colors: {
      badge: 'bg-orange-100',
      badgeText: 'text-orange-700',
      countBadge: 'bg-orange-200',
      countText: 'text-orange-600',
      hoverBg: 'from-orange-50 to-amber-50',
      hoverBorder: 'border-orange-200',
      accent: '#f97316',
      headerBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      headerText: 'text-white',
      itemBg: 'bg-orange-50/50 hover:bg-orange-50',
      itemText: 'text-orange-700',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  category: {
    label: 'Categories',
    colors: {
      badge: 'bg-teal-100',
      badgeText: 'text-teal-700',
      countBadge: 'bg-teal-200',
      countText: 'text-teal-600',
      hoverBg: 'from-teal-50 to-emerald-50',
      hoverBorder: 'border-teal-200',
      accent: '#14b8a6',
      headerBg: 'bg-gradient-to-r from-teal-500 to-emerald-500',
      headerText: 'text-white',
      itemBg: 'bg-teal-50/50 hover:bg-teal-50',
      itemText: 'text-teal-700',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  custom: {
    label: 'Items',
    colors: {
      badge: 'bg-gray-100',
      badgeText: 'text-gray-700',
      countBadge: 'bg-gray-200',
      countText: 'text-gray-600',
      hoverBg: 'from-gray-50 to-slate-50',
      hoverBorder: 'border-gray-200',
      accent: '#6b7280',
      headerBg: 'bg-gradient-to-r from-gray-500 to-slate-600',
      headerText: 'text-white',
      itemBg: 'bg-gray-50 hover:bg-gray-100',
      itemText: 'text-gray-700',
    },
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

const isSalesRepItem = (item: string | SalesRepItem): item is SalesRepItem => {
  return typeof item === 'object' && item !== null && 'fullName' in item;
};

const getDisplayName = (item: string | SalesRepItem): string => {
  if (isSalesRepItem(item)) {
    return item.fullName || 'Unknown';
  }
  return item;
};

const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

// ============================================================================
// Main Component
// ============================================================================

export function ListPreviewHoverCard({
  items,
  type,
  label,
  customColors,
  maxBadgeWidth = '120px',
  disabled = false,
}: ListPreviewHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOverTriggerRef = useRef(false);
  const isOverCardRef = useRef(false);

  const config = TYPE_CONFIG[type];
  const displayLabel = label || config.label;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current);
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 280;
    const cardHeight = Math.min(items.length * 40 + 60, 320);
    const offset = 4; // Reduced offset for easier mouse transition

    // Position below the element by default
    let left = rect.left;
    let top = rect.bottom + offset;

    // Check if card would overflow right edge
    if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }

    // Check if card would overflow left edge
    if (left < 16) {
      left = 16;
    }

    // Check if card would overflow bottom - show above instead
    if (top + cardHeight > window.innerHeight - 16) {
      top = rect.top - cardHeight - offset;
    }

    // Ensure top is not negative
    if (top < 16) {
      top = 16;
    }

    setPosition({ top, left });
  }, [items.length]);

  // Check if we should hide the card
  const checkShouldHide = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    leaveTimeoutRef.current = setTimeout(() => {
      // Only hide if mouse is not over trigger AND not over card
      if (!isOverTriggerRef.current && !isOverCardRef.current) {
        setIsHovered(false);
      }
    }, 100); // Small delay to allow mouse to move between elements
  }, []);

  const handleTriggerMouseEnter = useCallback(() => {
    if (disabled || items.length <= 1) return;

    isOverTriggerRef.current = true;

    // Clear any pending hide timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }

    enterTimeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsHovered(true);
    }, 300);
  }, [disabled, items.length, calculatePosition]);

  const handleTriggerMouseLeave = useCallback(() => {
    isOverTriggerRef.current = false;

    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
    }

    checkShouldHide();
  }, [checkShouldHide]);

  const handleCardMouseEnter = useCallback(() => {
    isOverCardRef.current = true;

    // Clear any pending hide timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    isOverCardRef.current = false;
    checkShouldHide();
  }, [checkShouldHide]);

  // If no items, show placeholder
  if (!items || items.length === 0) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  const firstItem = items[0];
  const remainingCount = items.length - 1;
  const firstName = getDisplayName(firstItem);

  // Render the collapsed badge
  const renderCollapsedBadge = () => {
    if (type === 'salesRep' && isSalesRepItem(firstItem)) {
      return (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.colors.badge} ${config.colors.badgeText} truncate`}
            style={{ maxWidth: maxBadgeWidth }}
            title={firstName}
          >
            {firstName}
          </span>
          {firstItem.avgSplitRate !== undefined && (
            <span className="text-xs text-blue-600 font-medium whitespace-nowrap">
              {firstItem.avgSplitRate}%
            </span>
          )}
          {remainingCount > 0 && (
            <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${config.colors.countBadge} ${config.colors.countText}`}>
              +{remainingCount}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <span
          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${config.colors.badge} ${config.colors.badgeText} truncate`}
          style={{ maxWidth: maxBadgeWidth }}
          title={firstName}
        >
          {firstName}
        </span>
        {remainingCount > 0 && (
          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${config.colors.countBadge} ${config.colors.countText}`}>
            +{remainingCount}
          </span>
        )}
      </div>
    );
  };

  // Render items in hover card
  const renderHoverItems = () => {
    return items.map((item, index) => {
      if (type === 'salesRep' && isSalesRepItem(item)) {
        return (
          <div
            key={index}
            className={`flex items-center justify-between gap-2 px-3 py-2 ${config.colors.itemBg} rounded-lg transition-colors`}
          >
            <span className={`text-sm font-medium ${config.colors.itemText} truncate`}>
              {item.fullName || 'Unknown'}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.avgSplitRate !== undefined && (
                <span className="text-xs text-blue-600 font-medium">
                  {item.avgSplitRate}%
                </span>
              )}
              {item.total !== undefined && (
                <span className="text-xs text-green-600 font-medium">
                  {formatCurrency(item.total)}
                </span>
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          key={index}
          className={`px-3 py-2 ${config.colors.itemBg} rounded-lg transition-colors`}
        >
          <span className={`text-sm font-medium ${config.colors.itemText}`}>
            {item as string}
          </span>
        </div>
      );
    });
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleTriggerMouseEnter}
        onMouseLeave={handleTriggerMouseLeave}
        className={`inline-flex items-center ${remainingCount > 0 ? 'cursor-pointer' : ''}`}
      >
        {renderCollapsedBadge()}
      </div>

      {mounted && isHovered && remainingCount > 0 && createPortal(
        <div
          ref={cardRef}
          className="fixed z-[9999] w-[280px] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          style={{
            top: position.top,
            left: position.left,
          }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          {/* Card Container */}
          <div className="relative">
            {/* Subtle glow effect */}
            <div
              className="absolute -inset-0.5 rounded-xl opacity-20 blur-md"
              style={{ background: `linear-gradient(135deg, ${config.colors.accent}, transparent 60%)` }}
            />

            {/* Main card */}
            <div className={`relative bg-gradient-to-br ${config.colors.hoverBg} rounded-xl border ${config.colors.hoverBorder} shadow-xl overflow-hidden`}>
              {/* Header */}
              <div className={`${config.colors.headerBg} px-3 py-2 flex items-center gap-2`}>
                <span className={config.colors.headerText}>
                  {config.icon}
                </span>
                <span className={`text-sm font-semibold ${config.colors.headerText}`}>
                  {displayLabel}
                </span>
                <span className={`ml-auto text-xs ${config.colors.headerText} opacity-80`}>
                  {items.length} items
                </span>
              </div>

              {/* Items list */}
              <div
                className="p-2 space-y-1 max-h-[240px] overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 transparent',
                }}
              >
                {renderHoverItems()}
              </div>

              {/* Bottom accent line */}
              <div
                className="h-0.5 opacity-40"
                style={{ backgroundColor: config.colors.accent }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default ListPreviewHoverCard;

'use client';

import { useState } from 'react';
import type { LineItem, RepSplit } from '../types';
import { availableOutsideReps, availableInsideReps } from '../data';

/**
 * Hook for managing commission splits state for both quote-level and line-item level rep splits.
 *
 * This includes:
 * - Commission splits visibility toggles
 * - Commission splits modal state
 * - Quote-level outside rep commission splits
 * - Quote-level inside rep commission splits
 * - Line item outside rep splits
 * - Line item inside rep splits
 * - Rep split modal state
 * - Available reps lists
 */
export function useCommissionSplitsState() {
  // ============================================
  // 1. Commission splits visibility
  // ============================================
  const [showCommissionSplits, setShowCommissionSplits] = useState(false);
  const [showInsideRepSplits, setShowInsideRepSplits] = useState(false);

  // ============================================
  // 2. Commission splits modal
  // ============================================
  const [showCommissionSplitsModal, setShowCommissionSplitsModal] = useState(false);
  const [commissionSplitsModalItem, setCommissionSplitsModalItem] = useState<LineItem | null>(null);
  const [applyToAllLines, setApplyToAllLines] = useState(false);

  // ============================================
  // 3. Quote-level outside rep commission splits
  // ============================================
  const [quoteOutsideRep, setQuoteOutsideRep] = useState<string>('');
  const [splitCommission, setSplitCommission] = useState(false);
  const [showRepSplitsModal, setShowRepSplitsModal] = useState(false);
  const [repCommissionSplits, setRepCommissionSplits] = useState<RepSplit[]>([]);

  // ============================================
  // 4. Quote-level inside rep commission splits
  // ============================================
  const [quoteInsideRep, setQuoteInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepCommissionSplits, setInsideRepCommissionSplits] = useState<RepSplit[]>([]);

  // ============================================
  // 5. Line item outside rep splits
  // ============================================
  const [lineItemRepDropdown, setLineItemRepDropdown] = useState<string | null>(null);
  const [lineItemRepSearch, setLineItemRepSearch] = useState('');
  const [showLineItemRepSplitsModal, setShowLineItemRepSplitsModal] = useState(false);
  const [lineItemRepSplitsTarget, setLineItemRepSplitsTarget] = useState<string | null>(null);
  const [lineItemRepSplits, setLineItemRepSplits] = useState<RepSplit[]>([]);

  // ============================================
  // 6. Line item inside rep splits
  // ============================================
  const [lineItemInsideRepDropdown, setLineItemInsideRepDropdown] = useState<string | null>(null);
  const [lineItemInsideRepSearch, setLineItemInsideRepSearch] = useState('');
  const [showLineItemInsideRepSplitsModal, setShowLineItemInsideRepSplitsModal] = useState(false);
  const [lineItemInsideRepSplitsTarget, setLineItemInsideRepSplitsTarget] = useState<string | null>(null);
  const [lineItemInsideRepSplits, setLineItemInsideRepSplits] = useState<RepSplit[]>([]);

  // ============================================
  // 7. Rep split modal state
  // ============================================
  const [repSplitModalItem, setRepSplitModalItem] = useState<LineItem | null>(null);

  // ============================================
  // Return all state and setters
  // ============================================
  return {
    // 1. Commission splits visibility
    showCommissionSplits,
    setShowCommissionSplits,
    showInsideRepSplits,
    setShowInsideRepSplits,

    // 2. Commission splits modal
    showCommissionSplitsModal,
    setShowCommissionSplitsModal,
    commissionSplitsModalItem,
    setCommissionSplitsModalItem,
    applyToAllLines,
    setApplyToAllLines,

    // 3. Quote-level outside rep commission splits
    quoteOutsideRep,
    setQuoteOutsideRep,
    splitCommission,
    setSplitCommission,
    showRepSplitsModal,
    setShowRepSplitsModal,
    repCommissionSplits,
    setRepCommissionSplits,

    // 4. Quote-level inside rep commission splits
    quoteInsideRep,
    setQuoteInsideRep,
    splitInsideCommission,
    setSplitInsideCommission,
    showInsideRepSplitsModal,
    setShowInsideRepSplitsModal,
    insideRepCommissionSplits,
    setInsideRepCommissionSplits,

    // 5. Line item outside rep splits
    lineItemRepDropdown,
    setLineItemRepDropdown,
    lineItemRepSearch,
    setLineItemRepSearch,
    showLineItemRepSplitsModal,
    setShowLineItemRepSplitsModal,
    lineItemRepSplitsTarget,
    setLineItemRepSplitsTarget,
    lineItemRepSplits,
    setLineItemRepSplits,

    // 6. Line item inside rep splits
    lineItemInsideRepDropdown,
    setLineItemInsideRepDropdown,
    lineItemInsideRepSearch,
    setLineItemInsideRepSearch,
    showLineItemInsideRepSplitsModal,
    setShowLineItemInsideRepSplitsModal,
    lineItemInsideRepSplitsTarget,
    setLineItemInsideRepSplitsTarget,
    lineItemInsideRepSplits,
    setLineItemInsideRepSplits,

    // 7. Rep split modal state
    repSplitModalItem,
    setRepSplitModalItem,

    // 8. Available reps (from data)
    availableOutsideReps,
    availableInsideReps,
  };
}

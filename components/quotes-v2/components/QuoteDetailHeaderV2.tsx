'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { QuoteV2, QuotePipelineStage, LineItemV2 } from '../types';
import { SearchableDropdownV2 } from './SearchableDropdownV2';
import { useCustomerSearch, useUserSearch } from '../../quotes/api/useQuotesApi';
import { searchUsers } from '../../quotes/api/quotesApi';

interface QuoteDetailHeaderV2Props {
  quote: QuoteV2;
  onQuoteChange: (updates: Partial<QuoteV2>) => void;
  onBack: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  isNew?: boolean;
  lineItems?: LineItemV2[];
}

// Pipeline stage options using API enum values
const pipelineStageOptions: QuotePipelineStage[] = [
  'DISCOVERY',
  'PROSPECT',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

// Format pipeline stage for display (e.g., CLOSED_WON -> Closed Won)
function formatPipelineStage(stage: QuotePipelineStage): string {
  return stage
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function getPipelineStageBadgeClass(stage?: QuotePipelineStage): string {
  switch (stage) {
    case 'DISCOVERY':
      return 'bg-gray-500';
    case 'PROSPECT':
      return 'bg-slate-500';
    case 'QUALIFICATION':
      return 'bg-blue-500';
    case 'PROPOSAL':
      return 'bg-purple-500';
    case 'NEGOTIATION':
      return 'bg-yellow-500';
    case 'CLOSED_WON':
      return 'bg-green-500';
    case 'CLOSED_LOST':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

// Commission split rep interface
interface CommissionSplitRep {
  id: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

// Coming Soon Badge Component
function ComingSoonBadge({ inline = false }: { inline?: boolean }) {
  return (
    <span className={`text-[10px] bg-gray-200 text-gray-500 px-1 py-0.5 rounded uppercase ${inline ? 'ml-1' : ''}`}>
      Soon
    </span>
  );
}

export function QuoteDetailHeaderV2({
  quote,
  onQuoteChange,
  onBack,
  onSave,
  onDelete,
  onDuplicate,
  isSaving = false,
  hasChanges = false,
  isNew = false,
  lineItems = [],
}: QuoteDetailHeaderV2Props) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'overage'>('simple');

  // Customer search state
  const [soldToSearchTerm, setSoldToSearchTerm] = useState('');
  const [billToSearchTerm, setBillToSearchTerm] = useState('');
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [soldToSearchEnabled, setSoldToSearchEnabled] = useState(false);
  const [billToSearchEnabled, setBillToSearchEnabled] = useState(false);
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);

  // End user same as sold to
  const [endUserSameAsSoldTo, setEndUserSameAsSoldTo] = useState(false);

  // User search state
  const [insideRepSearchTerm, setInsideRepSearchTerm] = useState('');
  const [outsideRepSearchTerm, setOutsideRepSearchTerm] = useState('');
  const [insideRepSearchEnabled, setInsideRepSearchEnabled] = useState(false);
  const [outsideRepSearchEnabled, setOutsideRepSearchEnabled] = useState(false);

  // Split commission state
  const [showInsideSplitCommission, setShowInsideSplitCommission] = useState(
    (quote.insideReps?.length || 0) > 1
  );
  const [showOutsideSplitCommission, setShowOutsideSplitCommission] = useState(
    (quote.outsideReps?.length || 0) > 1
  );
  const [showInsideSplitModal, setShowInsideSplitModal] = useState(false);
  const [showOutsideSplitModal, setShowOutsideSplitModal] = useState(false);
  const [insideSplitReps, setInsideSplitReps] = useState<CommissionSplitRep[]>(() => {
    // Initialize from quote's insideReps if available
    if (quote.insideReps && quote.insideReps.length > 0) {
      return quote.insideReps.map((rep, idx) => ({
        id: rep.id || crypto.randomUUID(),
        userId: rep.userId || '',
        userName: '', // Will be populated when modal opens
        splitRate: rep.splitRate || '100',
        position: rep.position || idx + 1,
      }));
    }
    return [];
  });
  const [outsideSplitReps, setOutsideSplitReps] = useState<CommissionSplitRep[]>(() => {
    // Initialize from quote's outsideReps if available
    if (quote.outsideReps && quote.outsideReps.length > 0) {
      return quote.outsideReps.map((rep, idx) => ({
        id: rep.id || crypto.randomUUID(),
        userId: rep.userId || '',
        userName: '', // Will be populated when modal opens
        splitRate: rep.splitRate || '100',
        position: rep.position || idx + 1,
      }));
    }
    return [];
  });
  const [splitRepSearchTerm, setSplitRepSearchTerm] = useState('');
  const [splitRepSearchEnabled, setSplitRepSearchEnabled] = useState(false);

  // Sync split commission state when quote.insideReps changes
  useEffect(() => {
    const hasMultipleInsideReps = (quote.insideReps?.length || 0) > 1;
    setShowInsideSplitCommission(hasMultipleInsideReps);

    // Initialize insideSplitReps from quote data
    if (quote.insideReps && quote.insideReps.length > 0) {
      // Fetch user names for all reps
      searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
        .then((users) => {
          const repsWithNames = quote.insideReps!.map((rep, idx) => {
            const matchingUser = users.find((u) => u.id === rep.userId);
            return {
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: matchingUser?.fullName || '',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            };
          });
          setInsideSplitReps(repsWithNames);
        })
        .catch((err) => {
          console.error('Failed to fetch inside rep names:', err);
          // Still set reps without names
          setInsideSplitReps(
            quote.insideReps!.map((rep, idx) => ({
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: '',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            }))
          );
        });
    } else {
      setInsideSplitReps([]);
    }
  }, [quote.insideReps]);

  // Sync outside reps state when quote.outsideReps changes
  useEffect(() => {
    const hasMultipleOutsideReps = (quote.outsideReps?.length || 0) > 1;
    setShowOutsideSplitCommission(hasMultipleOutsideReps);

    // Initialize outsideSplitReps from quote data
    if (quote.outsideReps && quote.outsideReps.length > 0) {
      // Fetch user names for all outside reps
      searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 })
        .then((users) => {
          const repsWithNames = quote.outsideReps!.map((rep, idx) => {
            const matchingUser = users.find((u) => u.id === rep.userId);
            return {
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: matchingUser?.fullName || '',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            };
          });
          setOutsideSplitReps(repsWithNames);
        })
        .catch((err) => {
          console.error('Failed to fetch outside rep names:', err);
          setOutsideSplitReps(
            quote.outsideReps!.map((rep, idx) => ({
              id: rep.id || crypto.randomUUID(),
              userId: rep.userId || '',
              userName: '',
              splitRate: rep.splitRate || '100',
              position: rep.position || idx + 1,
            }))
          );
        });
    } else {
      setOutsideSplitReps([]);
    }
  }, [quote.outsideReps]);

  // Calculate totals from line items
  const calculatedTotals = useMemo(() => {
    if (lineItems.length === 0) {
      return {
        basePrice: Number(quote.basePrice) || 0,
        sellPrice: Number(quote.sellPrice) || 0,
        commission: Number(quote.commission) || 0,
      };
    }

    const basePrice = lineItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const div = Number(item.divisor) || 1;
      return sum + (qty * price / div);
    }, 0);

    const sellPrice = lineItems.reduce((sum, item) => {
      return sum + (Number(item.sellTotal) || 0);
    }, 0);

    const commission = lineItems.reduce((sum, item) => {
      return sum + (Number(item.commissionTotal) || 0);
    }, 0);

    return { basePrice, sellPrice, commission };
  }, [lineItems, quote.basePrice, quote.sellPrice, quote.commission]);

  // API hooks for search
  const { data: soldToCustomers, isLoading: isSoldToLoading } = useCustomerSearch(soldToSearchTerm, soldToSearchEnabled);
  const { data: billToCustomers, isLoading: isBillToLoading } = useCustomerSearch(billToSearchTerm, billToSearchEnabled);
  const { data: endUserCustomers, isLoading: isEndUserLoading } = useCustomerSearch(endUserSearchTerm, endUserSearchEnabled);
  const { data: insideReps, isLoading: isInsideRepLoading } = useUserSearch(insideRepSearchTerm, true, insideRepSearchEnabled);
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(outsideRepSearchTerm, true, outsideRepSearchEnabled, true); // isOutside = true
  const { data: splitRepResults, isLoading: isSplitRepLoading } = useUserSearch(splitRepSearchTerm, true, splitRepSearchEnabled);

  const formatDateForInput = useCallback((dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }, []);

  const handleDateChange = useCallback((field: 'quoteDate' | 'expirationDate' | 'revisedDate' | 'acceptDate', value: string) => {
    onQuoteChange({ [field]: value });
  }, [onQuoteChange]);

  // Customer search handlers
  const handleSoldToSearch = useCallback((term: string) => {
    setSoldToSearchTerm(term);
    setSoldToSearchEnabled(true);
  }, []);

  const handleBillToSearch = useCallback((term: string) => {
    setBillToSearchTerm(term);
    setBillToSearchEnabled(true);
  }, []);

  const handleEndUserSearch = useCallback((term: string) => {
    setEndUserSearchTerm(term);
    setEndUserSearchEnabled(true);
  }, []);

  const handleInsideRepSearch = useCallback((term: string) => {
    setInsideRepSearchTerm(term);
    setInsideRepSearchEnabled(true);
  }, []);

  const handleOutsideRepSearch = useCallback((term: string) => {
    setOutsideRepSearchTerm(term);
    setOutsideRepSearchEnabled(true);
  }, []);

  const handleSplitRepSearch = useCallback((term: string) => {
    setSplitRepSearchTerm(term);
    setSplitRepSearchEnabled(true);
  }, []);

  // Handle end user same as sold to checkbox
  const handleEndUserSameAsSoldTo = useCallback((checked: boolean) => {
    setEndUserSameAsSoldTo(checked);
    if (checked && quote.soldToCustomerId) {
      onQuoteChange({
        endUserId: quote.soldToCustomerId,
        endUserName: quote.soldToCustomerName,
      });
    }
  }, [quote.soldToCustomerId, quote.soldToCustomerName, onQuoteChange]);

  // Add rep to split commission
  const addRepToSplit = useCallback((rep: { id: string; fullName?: string; firstName?: string; lastName?: string }, isInside: boolean) => {
    const repName = rep.fullName || `${rep.firstName} ${rep.lastName}`;
    const newRep: CommissionSplitRep = {
      id: crypto.randomUUID(),
      userId: rep.id,
      userName: repName,
      splitRate: '0',
      position: isInside ? insideSplitReps.length + 1 : outsideSplitReps.length + 1,
    };

    if (isInside) {
      const newReps = [...insideSplitReps, newRep];
      // Auto-distribute percentages
      const splitRate = Math.floor(100 / newReps.length).toString();
      const updatedReps = newReps.map((r, idx) => ({
        ...r,
        splitRate: idx === newReps.length - 1 ? (100 - (parseInt(splitRate) * (newReps.length - 1))).toString() : splitRate,
      }));
      setInsideSplitReps(updatedReps);
    } else {
      const newReps = [...outsideSplitReps, newRep];
      // Auto-distribute percentages
      const splitRate = Math.floor(100 / newReps.length).toString();
      const updatedReps = newReps.map((r, idx) => ({
        ...r,
        splitRate: idx === newReps.length - 1 ? (100 - (parseInt(splitRate) * (newReps.length - 1))).toString() : splitRate,
      }));
      setOutsideSplitReps(updatedReps);
    }
  }, [insideSplitReps, outsideSplitReps]);

  // Remove rep from split commission
  const removeRepFromSplit = useCallback((repId: string, isInside: boolean) => {
    if (isInside) {
      const newReps = insideSplitReps.filter(r => r.id !== repId);
      if (newReps.length > 0) {
        // Re-distribute percentages
        const splitRate = Math.floor(100 / newReps.length).toString();
        const updatedReps = newReps.map((r, idx) => ({
          ...r,
          splitRate: idx === newReps.length - 1 ? (100 - (parseInt(splitRate) * (newReps.length - 1))).toString() : splitRate,
          position: idx + 1,
        }));
        setInsideSplitReps(updatedReps);
      } else {
        setInsideSplitReps([]);
        setShowInsideSplitCommission(false);
      }
    } else {
      const newReps = outsideSplitReps.filter(r => r.id !== repId);
      if (newReps.length > 0) {
        // Re-distribute percentages
        const splitRate = Math.floor(100 / newReps.length).toString();
        const updatedReps = newReps.map((r, idx) => ({
          ...r,
          splitRate: idx === newReps.length - 1 ? (100 - (parseInt(splitRate) * (newReps.length - 1))).toString() : splitRate,
          position: idx + 1,
        }));
        setOutsideSplitReps(updatedReps);
      } else {
        setOutsideSplitReps([]);
        setShowOutsideSplitCommission(false);
      }
    }
  }, [insideSplitReps, outsideSplitReps]);

  // Update split rate for a rep
  const updateSplitRate = useCallback((repId: string, rate: string, isInside: boolean) => {
    if (isInside) {
      setInsideSplitReps(reps => reps.map(r => r.id === repId ? { ...r, splitRate: rate } : r));
    } else {
      setOutsideSplitReps(reps => reps.map(r => r.id === repId ? { ...r, splitRate: rate } : r));
    }
  }, []);

  // Transform search results to dropdown options
  const soldToOptions = (soldToCustomers || []).map((c) => ({
    id: c.id,
    label: c.companyName,
    sublabel: c.isParent ? 'Parent Company' : undefined,
  }));

  const billToOptions = (billToCustomers || []).map((c) => ({
    id: c.id,
    label: c.companyName,
    sublabel: c.isParent ? 'Parent Company' : undefined,
  }));

  const endUserOptions = (endUserCustomers || []).map((c) => ({
    id: c.id,
    label: c.companyName,
    sublabel: c.isParent ? 'Parent Company' : undefined,
  }));

  const insideRepOptions = (insideReps || []).map((u) => ({
    id: u.id,
    label: u.fullName || `${u.firstName} ${u.lastName}`,
    sublabel: u.email,
  }));

  const outsideRepOptions = (outsideReps || []).map((u) => ({
    id: u.id,
    label: u.fullName || `${u.firstName} ${u.lastName}`,
    sublabel: u.email,
  }));

  const splitRepOptions = (splitRepResults || []).map((u) => ({
    id: u.id,
    label: u.fullName || `${u.firstName} ${u.lastName}`,
    sublabel: u.email,
    fullName: u.fullName,
    firstName: u.firstName,
    lastName: u.lastName,
  }));

  return (
    <div className="flex-shrink-0">
      {/* Top Header Row */}
      <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M10 15l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Quote Number */}
          <h1 className="text-xl font-semibold text-gray-900">
            {isNew ? 'New Quote' : quote.quoteNumber || 'Quote'}
          </h1>

          {/* Unsaved Changes Indicator */}
          {hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Actions
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showActionsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {/* Create Order - Coming Soon */}
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5h14M3 10h14M3 15h7" strokeLinecap="round" />
                    </svg>
                    Create Order
                    <ComingSoonBadge inline />
                  </button>

                  {/* Duplicate Quote */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      onDuplicate?.();
                    }}
                    disabled={isNew || !quote.id}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      isNew || !quote.id ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="14" height="14" rx="2" />
                      <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
                    </svg>
                    Duplicate Quote
                  </button>

                  {/* Delete Quote */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      onDelete?.();
                    }}
                    disabled={isNew || !quote.id}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      isNew || !quote.id ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 5h10M8 5V3h4v2M6 8v8a1 1 0 001 1h6a1 1 0 001-1V8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete Quote
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Pipeline Stage Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStageMenu(!showStageMenu)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${getPipelineStageBadgeClass(quote.pipelineStage)}`}
            >
              {formatPipelineStage(quote.pipelineStage || 'DISCOVERY')}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showStageMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStageMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {pipelineStageOptions.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => {
                        onQuoteChange({ pipelineStage: stage });
                        setShowStageMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${quote.pipelineStage === stage ? 'bg-gray-50' : ''}`}
                    >
                      <span>{formatPipelineStage(stage)}</span>
                      {quote.pipelineStage === stage && (
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-indigo-600">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Version Dropdown - Coming Soon */}
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
            >
              v{quote.version}
              <ComingSoonBadge inline />
            </button>
          </div>

          {/* View Mode Dropdown - Coming Soon */}
          <div className="relative">
            <button
              disabled
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
              </svg>
              Simple View
              <ComingSoonBadge inline />
            </button>
          </div>

          {/* PDF Button - Coming Soon */}
          <button
            disabled
            className="flex items-center gap-1 px-4 py-1.5 text-sm text-gray-400 bg-gray-100 cursor-not-allowed rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="14" rx="2" />
              <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
            </svg>
            PDF
            <ComingSoonBadge inline />
          </button>

          {/* Save Button with Dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`px-4 py-1.5 text-sm text-white rounded-l-lg transition-colors ${
                  isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isSaving ? 'Saving...' : isNew ? 'Create' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                disabled={isSaving}
                className={`px-2 py-1.5 text-sm text-white rounded-r-lg border-l border-green-400 transition-colors ${
                  isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {showSaveMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSaveMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      setShowSaveMenu(false);
                      onSave?.();
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {isNew ? 'Create Quote' : 'Save'}
                  </button>
                  {/* Save as New Version - Coming Soon */}
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                    </svg>
                    Save as New Version
                    <ComingSoonBadge inline />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Summary Bar */}
      <div className="flex items-center justify-end gap-6 px-6 py-2 text-sm border-b border-gray-200 bg-gray-50">
        <div>
          <span className="text-gray-500">Base Price:</span>
          <span className="ml-2 font-semibold">${Number(calculatedTotals.basePrice.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="border-l border-gray-300 h-4" />
        <div>
          <span className="text-gray-500">Sell Price:</span>
          <span className="ml-2 font-semibold">${Number(calculatedTotals.sellPrice.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="border-l border-gray-300 h-4" />
        <div>
          <span className="text-gray-500">Commission:</span>
          <span className="ml-2 font-semibold text-green-600">${Number(calculatedTotals.commission.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Quote Details Section */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quote Details</h2>

        {/* Row 1 */}
        <div className="grid grid-cols-8 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Number*</label>
            <input
              type="text"
              value={quote.quoteNumber}
              onChange={(e) => onQuoteChange({ quoteNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter quote number"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              Quote Type
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded uppercase">Soon</span>
            </label>
            <select
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
            >
              <option>Standard</option>
              <option>Blanket</option>
              <option>RFQ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sold To Customer*</label>
            <SearchableDropdownV2
              value={quote.soldToCustomerId}
              displayValue={quote.soldToCustomerName}
              onChange={(id, label) => {
                onQuoteChange({ soldToCustomerId: id, soldToCustomerName: label });
                // If "Same as sold to" is checked, update end user too
                if (endUserSameAsSoldTo) {
                  onQuoteChange({ endUserId: id, endUserName: label });
                }
              }}
              options={soldToOptions}
              onSearch={handleSoldToSearch}
              isLoading={isSoldToLoading}
              placeholder="Search customers..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bill To Customer</label>
            <SearchableDropdownV2
              value={quote.billToCustomerId}
              displayValue={quote.billToCustomerName}
              onChange={(id, label) => onQuoteChange({ billToCustomerId: id, billToCustomerName: label })}
              options={billToOptions}
              onSearch={handleBillToSearch}
              isLoading={isBillToLoading}
              placeholder="Search customers..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End User</label>
            <SearchableDropdownV2
              value={quote.endUserId || ''}
              displayValue={quote.endUserName || ''}
              onChange={(id, label) => onQuoteChange({ endUserId: id, endUserName: label })}
              options={endUserOptions}
              onSearch={handleEndUserSearch}
              isLoading={isEndUserLoading}
              placeholder="Search customers..."
              disabled={endUserSameAsSoldTo}
            />
            <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={endUserSameAsSoldTo}
                onChange={(e) => handleEndUserSameAsSoldTo(e.target.checked)}
                className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-500">Same as sold to</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs text-gray-400 mb-1">
              Job
              <ComingSoonBadge />
            </label>
            <input
              type="text"
              value={quote.jobName}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
              placeholder="Coming soon"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Payment Terms</label>
            <input
              type="text"
              value={quote.paymentTerms}
              onChange={(e) => onQuoteChange({ paymentTerms: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Freight Terms</label>
            <input
              type="text"
              value={quote.freightTerms}
              onChange={(e) => onQuoteChange({ freightTerms: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Date*</label>
            <input
              type="date"
              value={formatDateForInput(quote.quoteDate)}
              onChange={(e) => handleDateChange('quoteDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expiration Date</label>
            <input
              type="date"
              value={formatDateForInput(quote.expirationDate)}
              onChange={(e) => handleDateChange('expirationDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Revised Date</label>
            <input
              type="date"
              value={formatDateForInput(quote.revisedDate || '')}
              onChange={(e) => handleDateChange('revisedDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Accept Date</label>
            <input
              type="date"
              value={formatDateForInput(quote.acceptDate || '')}
              onChange={(e) => handleDateChange('acceptDate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Outside Rep</label>
            {/* Show clickable field with split count when multiple reps */}
            {showOutsideSplitCommission && outsideSplitReps.length > 0 ? (
              <button
                onClick={() => setShowOutsideSplitModal(true)}
                className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
              >
                <span className="truncate">
                  {outsideSplitReps[0]?.userName || quote.outsideRepName || 'Multiple Reps'}
                  {outsideSplitReps.length > 1 && (
                    <span className="ml-1 text-indigo-600 font-medium">+{outsideSplitReps.length - 1}</span>
                  )}
                </span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                  Split
                </span>
              </button>
            ) : (
              <SearchableDropdownV2
                value={quote.outsideRepId || ''}
                displayValue={quote.outsideRepName || ''}
                onChange={(id, label) => {
                  onQuoteChange({
                    outsideRepId: id,
                    outsideRepName: label,
                  });
                  // Reset split commission when changing rep
                  if (id) {
                    setShowOutsideSplitCommission(false);
                    setOutsideSplitReps([]);
                  }
                }}
                options={outsideRepOptions}
                onSearch={handleOutsideRepSearch}
                isLoading={isOutsideRepLoading}
                placeholder="Search outside reps..."
              />
            )}
            {quote.outsideRepId && (
              <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOutsideSplitCommission}
                  onChange={(e) => {
                    setShowOutsideSplitCommission(e.target.checked);
                    if (e.target.checked) {
                      setShowOutsideSplitModal(true);
                      // Initialize with current rep if no split reps exist
                      if (outsideSplitReps.length === 0) {
                        setOutsideSplitReps([{
                          id: crypto.randomUUID(),
                          userId: quote.outsideRepId || '',
                          userName: quote.outsideRepName || '',
                          splitRate: '100',
                          position: 1,
                        }]);
                      }
                    } else {
                      setOutsideSplitReps([]);
                    }
                  }}
                  className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-500">Split Commission</span>
              </label>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inside Rep</label>
            {/* Show clickable field with split count when multiple reps */}
            {showInsideSplitCommission && insideSplitReps.length > 0 ? (
              <button
                onClick={() => setShowInsideSplitModal(true)}
                className="w-full px-3 py-2 text-sm text-left border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
              >
                <span className="truncate">
                  {insideSplitReps[0]?.userName || quote.insideRepName || 'Multiple Reps'}
                  {insideSplitReps.length > 1 && (
                    <span className="ml-1 text-indigo-600 font-medium">+{insideSplitReps.length - 1}</span>
                  )}
                </span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                  Split
                </span>
              </button>
            ) : (
              <SearchableDropdownV2
                value={quote.insideRepId || ''}
                displayValue={quote.insideRepName || ''}
                onChange={(id, label) => {
                  onQuoteChange({
                    insideRepId: id,
                    insideRepName: label,
                    insideReps: [{ id: '', userId: id, splitRate: '100', position: 1 }],
                  });
                  // Reset split commission when changing rep
                  if (id) {
                    setShowInsideSplitCommission(false);
                    setInsideSplitReps([]);
                  }
                }}
                options={insideRepOptions}
                onSearch={handleInsideRepSearch}
                isLoading={isInsideRepLoading}
                placeholder="Search reps..."
              />
            )}
            {quote.insideRepId && (
              <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInsideSplitCommission}
                  onChange={(e) => {
                    setShowInsideSplitCommission(e.target.checked);
                    if (e.target.checked) {
                      setShowInsideSplitModal(true);
                      // Initialize with current rep if no split reps exist
                      if (insideSplitReps.length === 0) {
                        setInsideSplitReps([{
                          id: crypto.randomUUID(),
                          userId: quote.insideRepId || '',
                          userName: quote.insideRepName || '',
                          splitRate: '100',
                          position: 1,
                        }]);
                      }
                    } else {
                      setInsideSplitReps([]);
                    }
                  }}
                  className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-xs text-gray-500">Split Commission</span>
              </label>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Customer Ref</label>
            <input
              type="text"
              value={quote.customerRef || ''}
              onChange={(e) => onQuoteChange({ customerRef: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Row 3 - Published and Blanket Checkboxes */}
        <div className="flex items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quote.published || false}
              onChange={(e) => onQuoteChange({ published: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quote.blanket || false}
              onChange={(e) => onQuoteChange({ blanket: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Blanket</span>
          </label>
        </div>
      </div>

      {/* Inside Rep Split Commission Modal */}
      {showInsideSplitModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowInsideSplitModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Split Inside Rep Commission</h3>
                <button
                  onClick={() => setShowInsideSplitModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                {/* Rep list */}
                <div className="space-y-3 mb-4">
                  {insideSplitReps.map((rep) => (
                    <div key={rep.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{rep.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rep.splitRate}
                          onChange={(e) => updateSplitRate(rep.id, e.target.value, true)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      {insideSplitReps.length > 1 && (
                        <button
                          onClick={() => removeRepFromSplit(rep.id, true)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add rep search */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Add Rep</label>
                  <SearchableDropdownV2
                    value=""
                    displayValue=""
                    onChange={(id) => {
                      const rep = splitRepResults?.find(r => r.id === id);
                      if (rep) {
                        addRepToSplit(rep, true);
                      }
                    }}
                    options={splitRepOptions.filter(opt => !insideSplitReps.some(r => r.userId === opt.id))}
                    onSearch={handleSplitRepSearch}
                    isLoading={isSplitRepLoading}
                    placeholder="Search reps to add..."
                  />
                </div>

                {/* Total validation */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500">Total:</span>
                  <span className={`font-semibold ${
                    insideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0) === 100
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {insideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0)}%
                  </span>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowInsideSplitModal(false);
                      setShowInsideSplitCommission(false);
                      setInsideSplitReps([]);
                    }}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save split rates to quote
                      onQuoteChange({
                        insideReps: insideSplitReps.map((r, idx) => ({
                          id: '',
                          userId: r.userId,
                          splitRate: r.splitRate,
                          position: idx + 1,
                        })),
                      });
                      setShowInsideSplitModal(false);
                    }}
                    disabled={insideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0) !== 100}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Outside Rep Split Commission Modal */}
      {showOutsideSplitModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOutsideSplitModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Split Outside Rep Commission</h3>
                <button
                  onClick={() => setShowOutsideSplitModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                {/* Rep list */}
                <div className="space-y-3 mb-4">
                  {outsideSplitReps.map((rep) => (
                    <div key={rep.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{rep.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={rep.splitRate}
                          onChange={(e) => updateSplitRate(rep.id, e.target.value, false)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      {outsideSplitReps.length > 1 && (
                        <button
                          onClick={() => removeRepFromSplit(rep.id, false)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add rep search */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1">Add Rep</label>
                  <SearchableDropdownV2
                    value=""
                    displayValue=""
                    onChange={(id) => {
                      const rep = splitRepResults?.find(r => r.id === id);
                      if (rep) {
                        addRepToSplit(rep, false);
                      }
                    }}
                    options={splitRepOptions.filter(opt => !outsideSplitReps.some(r => r.userId === opt.id))}
                    onSearch={handleSplitRepSearch}
                    isLoading={isSplitRepLoading}
                    placeholder="Search reps to add..."
                  />
                </div>

                {/* Total validation */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500">Total:</span>
                  <span className={`font-semibold ${
                    outsideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0) === 100
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {outsideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0)}%
                  </span>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowOutsideSplitModal(false);
                      setShowOutsideSplitCommission(false);
                      setOutsideSplitReps([]);
                    }}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save split rates to quote (outsideReps would need to be added to QuoteV2 type)
                      onQuoteChange({
                        outsideReps: outsideSplitReps.map((r, idx) => ({
                          id: '',
                          userId: r.userId,
                          splitRate: r.splitRate,
                          position: idx + 1,
                        })),
                      });
                      setShowOutsideSplitModal(false);
                    }}
                    disabled={outsideSplitReps.reduce((sum, r) => sum + parseInt(r.splitRate || '0'), 0) !== 100}
                    className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default QuoteDetailHeaderV2;

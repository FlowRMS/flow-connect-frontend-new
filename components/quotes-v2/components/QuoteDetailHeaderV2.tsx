'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { QuoteV2, QuotePipelineStage, LineItemV2, QuoteSettingsV2, QuoteV2Status } from '../types';
import { SearchableDropdownV2 } from './SearchableDropdownV2';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';
import { useCustomerSearch, useUserSearch, useJobSearch, useFactorySearch } from '../../quotes/api/useQuotesApi';
import { useCreateCRMJob, useCRMJobStatuses } from '../../hooks/useCRMApi';
import type { JobInput } from '../../lib/crm-graphql';
import { searchUsers } from '../../quotes/api/quotesApi';
import { useAutoPopulateReps, RepSplitRate } from '@/components/shared/hooks/useAutoPopulateReps';
import { CreateOrderFromQuoteModal } from '../modals/CreateOrderFromQuoteModal';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';
import { PDFBuilder } from '@/components/shared/pdf-builder';
import { ExcelBuilder } from '@/components/shared/excel-builder';
import { ManufacturerExcelModal } from '@/components/shared/manufacturer-excel';
import { UnsavedChangesModal } from '@/components/shared/modals/UnsavedChangesModal';

// Quote status options using API enum values
const quoteStatusOptions: QuoteV2Status[] = [
  'OPEN',
  'ORDERED',
  'EXPIRED',
  'LOST',
];

// Format quote status for display
function formatQuoteStatus(status: QuoteV2Status): string {
  switch (status) {
    case 'OPEN':
      return 'Open';
    case 'ORDERED':
      return 'Ordered';
    case 'EXPIRED':
      return 'Expired';
    case 'LOST':
      return 'Lost';
    default:
      return status;
  }
}

function getQuoteStatusBadgeClass(status?: QuoteV2Status): string {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-500';
    case 'ORDERED':
      return 'bg-green-500';
    case 'EXPIRED':
      return 'bg-gray-500';
    case 'LOST':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
}

interface QuoteDetailHeaderV2Props {
  quote: QuoteV2;
  onQuoteChange: (updates: Partial<QuoteV2>) => void;
  onBack: () => void;
  onSave?: () => Promise<boolean> | boolean;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  isNew?: boolean;
  lineItems?: LineItemV2[];
  selectedLineItemIds?: Set<string>;
  settings?: QuoteSettingsV2;
  onClearLineItemProducts?: () => void;
  // Callbacks for auto-populating reps at line item level
  onAutoPopulateOutsideRepsToLineItems?: (reps: RepSplitRate[]) => void;
  onAutoPopulateInsideRepsToLineItems?: (reps: RepSplitRate[]) => void;
  // Callback for auto-populating inside reps per line item using each line's manufacturer
  onAutoPopulateInsideRepsPerLineItemFactory?: () => void;
}

// Pipeline stage options - kept for potential future use
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
  selectedLineItemIds,
  settings,
  onClearLineItemProducts,
  onAutoPopulateOutsideRepsToLineItems,
  onAutoPopulateInsideRepsToLineItems,
  onAutoPopulateInsideRepsPerLineItemFactory,
}: QuoteDetailHeaderV2Props) {
  // Auto-populate reps hook
  const {
    fetchOutsideRepsFromCustomer,
    fetchInsideRepsFromFactory,
  } = useAutoPopulateReps();

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPipelineStageMenu, setShowPipelineStageMenu] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'overage'>('simple');
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(true);
  const [showPDFBuilder, setShowPDFBuilder] = useState(false);
  const [showExcelBuilder, setShowExcelBuilder] = useState(false);
  const [showManufacturerExcel, setShowManufacturerExcel] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Customer search state
  const [soldToSearchTerm, setSoldToSearchTerm] = useState('');
  const [billToSearchTerm, setBillToSearchTerm] = useState('');
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [soldToSearchEnabled, setSoldToSearchEnabled] = useState(false);
  const [billToSearchEnabled, setBillToSearchEnabled] = useState(false);
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);

  // End user same as sold to
  const [endUserSameAsSoldTo, setEndUserSameAsSoldTo] = useState(false);

  // Bill to same as sold to
  const [billToSameAsSoldTo, setBillToSameAsSoldTo] = useState(false);

  // User search state
  const [insideRepSearchTerm, setInsideRepSearchTerm] = useState('');
  const [outsideRepSearchTerm, setOutsideRepSearchTerm] = useState('');
  const [insideRepSearchEnabled, setInsideRepSearchEnabled] = useState(false);
  const [outsideRepSearchEnabled, setOutsideRepSearchEnabled] = useState(false);

  // Job search state
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobSearchEnabled, setJobSearchEnabled] = useState(false);

  // Factory/Manufacturer search state (for header-level when factoryPerLineItem is false)
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [factorySearchEnabled, setFactorySearchEnabled] = useState(false);

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
  const [insideSplitRepSearchTerm, setInsideSplitRepSearchTerm] = useState('');
  const [insideSplitRepSearchEnabled, setInsideSplitRepSearchEnabled] = useState(false);
  const [outsideSplitRepSearchTerm, setOutsideSplitRepSearchTerm] = useState('');
  const [outsideSplitRepSearchEnabled, setOutsideSplitRepSearchEnabled] = useState(false);

  // Ref to skip useEffect when auto-populating reps (prevents race condition)
  const skipOutsideRepsEffectRef = useRef(false);
  const skipInsideRepsEffectRef = useRef(false);

  // Sync split commission state when quote.insideReps changes
  useEffect(() => {
    const hasMultipleInsideReps = (quote.insideReps?.length || 0) > 1;
    setShowInsideSplitCommission(hasMultipleInsideReps);

    // Initialize insideSplitReps from quote data
    if (quote.insideReps && quote.insideReps.length > 0) {
      // Check if we already have the reps with names in our state (from auto-populate)
      // by comparing userIds - if they match, keep existing names
      setInsideSplitReps((currentReps) => {
        const currentUserIds = new Set(currentReps.map(r => r.userId));
        const newUserIds = new Set(quote.insideReps!.map(r => r.userId || ''));
        const allMatch = quote.insideReps!.every(r => currentUserIds.has(r.userId || '')) &&
                         currentReps.every(r => newUserIds.has(r.userId)) &&
                         currentReps.length === quote.insideReps!.length;

        // If userIds match, preserve existing names (already populated from auto-populate)
        if (allMatch && currentReps.some(r => r.userName)) {
          return currentReps.map((rep, idx) => ({
            ...rep,
            splitRate: quote.insideReps![idx]?.splitRate || rep.splitRate,
            position: quote.insideReps![idx]?.position || rep.position || idx + 1,
          }));
        }

        // Otherwise, need to fetch names - return placeholder and trigger async fetch
        return quote.insideReps!.map((rep, idx) => ({
          id: rep.id || crypto.randomUUID(),
          userId: rep.userId || '',
          userName: '', // Will be populated by async fetch below
          splitRate: rep.splitRate || '100',
          position: rep.position || idx + 1,
        }));
      });

      // Fetch user names for all inside reps (only if we don't have names)
      searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
        .then((users) => {
          setInsideSplitReps((currentReps) => {
            // Only update if we still don't have names
            if (currentReps.some(r => r.userName)) {
              return currentReps;
            }
            return currentReps.map((rep, idx) => {
              const matchingUser = users.find((u) => u.id === rep.userId);
              return {
                ...rep,
                userName: matchingUser?.fullName || '',
              };
            });
          });
        })
        .catch((err) => {
          console.error('Failed to fetch inside rep names:', err);
        });
    } else {
      setInsideSplitReps([]);
    }
  }, [quote.insideReps]);

  // Sync outside reps state when quote.outsideReps changes
  useEffect(() => {
    // Skip this effect if we just auto-populated (prevents race condition)
    if (skipOutsideRepsEffectRef.current) {
      skipOutsideRepsEffectRef.current = false;
      return;
    }

    const hasMultipleOutsideReps = (quote.outsideReps?.length || 0) > 1;
    setShowOutsideSplitCommission(hasMultipleOutsideReps);

    // Initialize outsideSplitReps from quote data
    if (quote.outsideReps && quote.outsideReps.length > 0) {
      // Check if we already have the reps with names in our state (from auto-populate)
      // by comparing userIds - if they match, keep existing names
      setOutsideSplitReps((currentReps) => {
        const currentUserIds = new Set(currentReps.map(r => r.userId));
        const newUserIds = new Set(quote.outsideReps!.map(r => r.userId || ''));
        const allMatch = quote.outsideReps!.every(r => currentUserIds.has(r.userId || '')) &&
                         currentReps.every(r => newUserIds.has(r.userId)) &&
                         currentReps.length === quote.outsideReps!.length;

        // If userIds match, preserve existing names (already populated from auto-populate)
        if (allMatch && currentReps.some(r => r.userName)) {
          return currentReps.map((rep, idx) => ({
            ...rep,
            splitRate: quote.outsideReps![idx]?.splitRate || rep.splitRate,
            position: quote.outsideReps![idx]?.position || rep.position || idx + 1,
          }));
        }

        // Otherwise, need to fetch names - return placeholder and trigger async fetch
        return quote.outsideReps!.map((rep, idx) => ({
          id: rep.id || crypto.randomUUID(),
          userId: rep.userId || '',
          userName: '', // Will be populated by async fetch below
          splitRate: rep.splitRate || '100',
          position: rep.position || idx + 1,
        }));
      });

      // Fetch user names for all outside reps (only if we don't have names)
      searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 })
        .then((users) => {
          setOutsideSplitReps((currentReps) => {
            // Only update if we still don't have names
            if (currentReps.some(r => r.userName)) {
              return currentReps;
            }
            return currentReps.map((rep, idx) => {
              const matchingUser = users.find((u) => u.id === rep.userId);
              return {
                ...rep,
                userName: matchingUser?.fullName || '',
              };
            });
          });
        })
        .catch((err) => {
          console.error('Failed to fetch outside rep names:', err);
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
  const { data: insideReps, isLoading: isInsideRepLoading } = useUserSearch(insideRepSearchTerm, true, insideRepSearchEnabled, false); // isInside=true, isOutside=false
  const { data: jobs, isLoading: isJobsLoading } = useJobSearch(jobSearchTerm, jobSearchEnabled);
  
  // Job creation mutation and statuses
  const createJobMutation = useCreateCRMJob();
  const { data: jobStatuses } = useCRMJobStatuses();
  const { data: factories, isLoading: isFactoriesLoading } = useFactorySearch(factorySearchTerm, factorySearchEnabled);
  const { data: outsideReps, isLoading: isOutsideRepLoading } = useUserSearch(outsideRepSearchTerm, false, outsideRepSearchEnabled, true); // isInside=false, isOutside=true
  const { data: insideSplitRepResults, isLoading: isInsideSplitRepLoading } = useUserSearch(insideSplitRepSearchTerm, true, insideSplitRepSearchEnabled, false); // isInside=true, isOutside=false
  const { data: outsideSplitRepResults, isLoading: isOutsideSplitRepLoading } = useUserSearch(outsideSplitRepSearchTerm, false, outsideSplitRepSearchEnabled, true); // isInside=false, isOutside=true

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

  const handleInsideSplitRepSearch = useCallback((term: string) => {
    setInsideSplitRepSearchTerm(term);
    setInsideSplitRepSearchEnabled(true);
  }, []);

  const handleOutsideSplitRepSearch = useCallback((term: string) => {
    setOutsideSplitRepSearchTerm(term);
    setOutsideSplitRepSearchEnabled(true);
  }, []);

  // Handle end user same as sold to checkbox
  const handleEndUserSameAsSoldTo = useCallback(async (checked: boolean) => {
    setEndUserSameAsSoldTo(checked);
    if (checked && quote.soldToCustomerId) {
      onQuoteChange({
        endUserId: quote.soldToCustomerId,
        endUserName: quote.soldToCustomerName,
      });
      // Auto-populate outside reps from end user (which is same as sold to)
      const reps = await fetchOutsideRepsFromCustomer(quote.soldToCustomerId);
      if (reps.length > 0) {
        if (settings?.outsideRepAtLineLevel) {
          // Per line item mode - populate all line items
          onAutoPopulateOutsideRepsToLineItems?.(reps);
        } else {
          // Header level mode - populate header fields
          const primaryRep = reps[0];
          if (reps.length > 1) {
            // Multiple reps - set up split commission
            setShowOutsideSplitCommission(true);
            setOutsideSplitReps(reps.map((r, idx) => ({
              id: r.id,
              userId: r.userId,
              userName: r.userName,
              splitRate: r.splitRate,
              position: idx + 1,
            })));
            skipOutsideRepsEffectRef.current = true;
            onQuoteChange({
              outsideRepId: primaryRep.userId,
              outsideRepName: primaryRep.userName,
              outsideReps: reps.map((r, idx) => ({
                id: '',
                userId: r.userId,
                splitRate: r.splitRate,
                position: idx + 1,
              })),
            });
          } else {
            // Single rep
            setShowOutsideSplitCommission(false);
            setOutsideSplitReps([]);
            onQuoteChange({
              outsideRepId: primaryRep.userId,
              outsideRepName: primaryRep.userName,
              outsideReps: [{ id: '', userId: primaryRep.userId, splitRate: '100', position: 1 }],
            });
          }
        }
      }
    }
  }, [quote.soldToCustomerId, quote.soldToCustomerName, onQuoteChange, fetchOutsideRepsFromCustomer, settings?.outsideRepAtLineLevel, onAutoPopulateOutsideRepsToLineItems]);

  // Handle bill to same as sold to checkbox
  const handleBillToSameAsSoldTo = useCallback((checked: boolean) => {
    setBillToSameAsSoldTo(checked);
    if (checked && quote.soldToCustomerId) {
      onQuoteChange({
        billToCustomerId: quote.soldToCustomerId,
        billToCustomerName: quote.soldToCustomerName,
      });
    }
  }, [quote.soldToCustomerId, quote.soldToCustomerName, onQuoteChange]);

  // Add rep to split commission
  const addRepToSplit = useCallback((rep: { id: string; fullName?: string; firstName?: string; lastName?: string }, isInside: boolean) => {
    const repName = rep.fullName || `${rep.firstName} ${rep.lastName}`;
    const newRep: CommissionSplitRep = {
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
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

  const insideSplitRepOptions = (insideSplitRepResults || []).map((u) => ({
    id: u.id,
    label: u.fullName || `${u.firstName} ${u.lastName}`,
    sublabel: u.email,
    fullName: u.fullName,
    firstName: u.firstName,
    lastName: u.lastName,
  }));

  const outsideSplitRepOptions = (outsideSplitRepResults || []).map((u) => ({
    id: u.id,
    label: u.fullName || `${u.firstName} ${u.lastName}`,
    sublabel: u.email,
    fullName: u.fullName,
    firstName: u.firstName,
    lastName: u.lastName,
  }));

  // Factory/Manufacturer options for header-level selection
  const factoryOptions = (factories || []).map((f) => ({
    id: f.id,
    label: f.title,
  }));

  // Factory search handler
  const handleFactorySearch = useCallback((term: string) => {
    setFactorySearchTerm(term);
    setFactorySearchEnabled(true);
  }, []);

  return (
    <div className="sticky top-0 z-30 flex-shrink-0 bg-white">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pt-6 pb-4 px-6 border-b border-gray-200">
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

          {/* Created By Badge */}
          {!isNew && (
            <CreatedByBadge
              createdBy={quote.createdByName}
              createdAt={quote.entryDate}
              size="sm"
            />
          )}

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
                  {/* Create Order */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      // Check for unsaved changes before opening the modal
                      if (hasChanges) {
                        setShowUnsavedChangesModal(true);
                      } else {
                        setShowCreateOrderModal(true);
                      }
                    }}
                    disabled={isNew || !quote.id}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      isNew || !quote.id ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 5h14M3 10h14M3 15h7" strokeLinecap="round" />
                    </svg>
                    Create Order
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

          {/* Status Dropdown */}
          <div className="relative">
            <span className="absolute -top-5 left-0 text-[10px] text-gray-500 uppercase tracking-wide">Status</span>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${getQuoteStatusBadgeClass(quote.status)}`}
            >
              {formatQuoteStatus(quote.status || 'OPEN')}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showStatusMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {quoteStatusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onQuoteChange({ status: status });
                        setShowStatusMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${quote.status === status ? 'bg-gray-50' : ''}`}
                    >
                      <span>{formatQuoteStatus(status)}</span>
                      {quote.status === status && (
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

          {/* Pipeline Stage Dropdown */}
          <div className="relative">
            <span className="absolute -top-5 left-0 text-[10px] text-gray-500 uppercase tracking-wide whitespace-nowrap">Pipeline Stage</span>
            <button
              onClick={() => setShowPipelineStageMenu(!showPipelineStageMenu)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${getPipelineStageBadgeClass(quote.pipelineStage)}`}
            >
              {formatPipelineStage(quote.pipelineStage || 'DISCOVERY')}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showPipelineStageMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPipelineStageMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {pipelineStageOptions.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => {
                        onQuoteChange({ pipelineStage: stage });
                        setShowPipelineStageMenu(false);
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

          {/* Excel Button with Manufacturer Dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                onClick={() => {
                  setShowDownloadMenu(false);
                  setShowExcelBuilder(true);
                }}
                disabled={isNew || !quote.id}
                className={`flex items-center gap-1 px-4 py-1.5 text-sm rounded-l-lg transition-colors ${
                  isNew || !quote.id
                    ? 'text-white bg-emerald-600 opacity-50 cursor-not-allowed'
                    : 'text-white bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Excel
              </button>
              <button
                onClick={() => setShowDownloadMenu((prev) => !prev)}
                disabled={isNew || !quote.id}
                className={`px-2 py-1.5 text-sm text-white rounded-r-lg border-l border-emerald-500 transition-colors ${
                  isNew || !quote.id
                    ? 'bg-emerald-600 opacity-50 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
                aria-label="Manufacturer options"
              >
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {showDownloadMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDownloadMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      setShowManufacturerExcel(true);
                      setShowDownloadMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                    Manufacturer Excel
                  </button>
                </div>
              </>
            )}
          </div>
          {/* PDF Button */}
          <button
            onClick={() => {
              setShowDownloadMenu(false);
              setShowPDFBuilder(true);
            }}
            disabled={isNew || !quote.id}
            className={`flex items-center gap-1 px-4 py-1.5 text-sm rounded-lg transition-colors ${
              isNew || !quote.id
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-white bg-red-600 hover:bg-red-700'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2h8l4 4v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 2v4h4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12h4M8 16h4M8 8h1" strokeLinecap="round"/>
            </svg>
            PDF
          </button>

          {/* Save Button with Dropdown */}
          <div className="relative">
            {/* Unsaved changes indicator */}
            {hasChanges && !isNew && (
              <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" title="You have unsaved changes" />
            )}
            <div className="flex">
              <button
                onClick={onSave}
                disabled={isSaving || (!isNew && !hasChanges)}
                className={`px-4 py-1.5 text-sm text-white rounded-l-lg transition-colors ${
                  isSaving || (!isNew && !hasChanges) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                }`}
                title={!isNew && !hasChanges ? 'No changes to save' : undefined}
              >
                {isSaving ? 'Saving...' : isNew ? 'Create' : 'Save'}
              </button>
              <button
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                disabled={isSaving || (!isNew && !hasChanges)}
                className={`px-2 py-1.5 text-sm text-white rounded-r-lg border-l border-green-400 transition-colors ${
                  isSaving || (!isNew && !hasChanges) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
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

      {/* Quote Details Section - Collapsible */}
      <div className="border-b border-gray-200 bg-blue-50/30">
        <button
          onClick={() => setShowQuoteDetails(!showQuoteDetails)}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-blue-100/50 transition-colors group"
        >
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {showQuoteDetails ? 'Quote Details' : 'Show Quote Details'}
          </span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${showQuoteDetails ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>
            <span className="text-xs font-medium">{showQuoteDetails ? 'Collapse' : 'Expand'}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform ${showQuoteDetails ? '' : 'rotate-180'}`}
            >
              <path d="M6 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
        {showQuoteDetails && (
        <div className="px-6 pb-4">

        {/* Row 1: Quote Number, Manufacturer, Quote Date, Expiration Date, Sold To Customer, End User, Outside Rep */}
        <div className="grid grid-cols-7 gap-4 mb-4">
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
            <label className="block text-xs text-gray-500 mb-1">Manufacturer</label>
            {settings?.factoryPerLineItem ? (
              <div className="relative">
                <input
                  type="text"
                  value="Per line item"
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                />
              </div>
            ) : (
              <SearchableDropdownV2
                value={quote.factoryId || ''}
                displayValue={quote.factoryName || ''}
                placeholder="Select manufacturer..."
                isLoading={isFactoriesLoading}
                options={factoryOptions}
                onSearch={handleFactorySearch}
                onChange={async (id, label) => {
                  // If manufacturer changed and there are line items with products, clear them
                  const manufacturerChanged = id !== quote.factoryId;
                  if (manufacturerChanged && onClearLineItemProducts) {
                    onClearLineItemProducts();
                  }
                  onQuoteChange({ factoryId: id || undefined, factoryName: label });
                  setFactorySearchEnabled(false);

                  // Auto-populate inside reps from factory
                  if (id) {
                    const reps = await fetchInsideRepsFromFactory(id);
                    if (reps.length > 0) {
                      if (settings?.insideRepAtLineLevel) {
                        // Per line item mode - populate all line items with same reps
                        onAutoPopulateInsideRepsToLineItems?.(reps);
                      } else {
                        // Header level mode - populate header fields
                        const primaryRep = reps[0];
                        if (reps.length > 1) {
                          // Multiple reps - set up split commission
                          setShowInsideSplitCommission(true);
                          setInsideSplitReps(reps.map((r, idx) => ({
                            id: r.id,
                            userId: r.userId,
                            userName: r.userName,
                            splitRate: r.splitRate,
                            position: idx + 1,
                          })));
                          onQuoteChange({
                            insideRepId: primaryRep.userId,
                            insideRepName: primaryRep.userName,
                            insideReps: reps.map((r, idx) => ({
                              id: '',
                              userId: r.userId,
                              splitRate: r.splitRate,
                              position: idx + 1,
                            })),
                          });
                        } else {
                          // Single rep
                          setShowInsideSplitCommission(false);
                          setInsideSplitReps([]);
                          onQuoteChange({
                            insideRepId: primaryRep.userId,
                            insideRepName: primaryRep.userName,
                            insideReps: [{ id: '', userId: primaryRep.userId, splitRate: '100', position: 1 }],
                          });
                        }
                      }
                    }
                  }
                }}
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Quote Date*</label>
            <StyledDatePicker
              selected={parseDateString(quote.quoteDate)}
              onChange={(date) => handleDateChange('quoteDate', formatDateToString(date))}
              placeholder="Select date..."
              className="!py-2 !px-3 !rounded-md !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Expiration Date</label>
            <StyledDatePicker
              selected={parseDateString(quote.expirationDate)}
              onChange={(date) => handleDateChange('expirationDate', formatDateToString(date))}
              placeholder="Select date..."
              className="!py-2 !px-3 !rounded-md !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sold To Customer*</label>
            <SearchableDropdownV2
              value={quote.soldToCustomerId}
              displayValue={quote.soldToCustomerName}
              onChange={async (id, label) => {
                onQuoteChange({ soldToCustomerId: id, soldToCustomerName: label });
                // If "Same as sold to" is checked, update end user too and auto-populate outside reps
                if (endUserSameAsSoldTo) {
                  onQuoteChange({ endUserId: id, endUserName: label });
                  // Auto-populate outside reps from end user (which is same as sold to in this case)
                  if (id) {
                    const reps = await fetchOutsideRepsFromCustomer(id);
                    if (reps.length > 0) {
                      if (settings?.outsideRepAtLineLevel) {
                        // Per line item mode - populate all line items
                        onAutoPopulateOutsideRepsToLineItems?.(reps);
                      } else {
                        // Header level mode - populate header fields
                        const primaryRep = reps[0];
                        if (reps.length > 1) {
                          // Multiple reps - set up split commission
                          setShowOutsideSplitCommission(true);
                          setOutsideSplitReps(reps.map((r, idx) => ({
                            id: r.id,
                            userId: r.userId,
                            userName: r.userName,
                            splitRate: r.splitRate,
                            position: idx + 1,
                          })));
                          // Skip the useEffect to prevent it from overwriting our reps with names
                          skipOutsideRepsEffectRef.current = true;
                          onQuoteChange({
                            outsideRepId: primaryRep.userId,
                            outsideRepName: primaryRep.userName,
                            outsideReps: reps.map((r, idx) => ({
                              id: '',
                              userId: r.userId,
                              splitRate: r.splitRate,
                              position: idx + 1,
                            })),
                          });
                        } else {
                          // Single rep
                          setShowOutsideSplitCommission(false);
                          setOutsideSplitReps([]);
                          onQuoteChange({
                            outsideRepId: primaryRep.userId,
                            outsideRepName: primaryRep.userName,
                            outsideReps: [{ id: '', userId: primaryRep.userId, splitRate: '100', position: 1 }],
                          });
                        }
                      }
                    }
                  }
                }
                // If "Same as sold to" is checked for bill to, update bill to too
                if (billToSameAsSoldTo) {
                  onQuoteChange({ billToCustomerId: id, billToCustomerName: label });
                }
              }}
              options={soldToOptions}
              onSearch={handleSoldToSearch}
              isLoading={isSoldToLoading}
              placeholder="Search customers..."
            />
          </div>
          {/* End User - grey out and show "per line item" when settings enabled */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">End User</label>
            {settings?.specifyEndUserPerLine ? (
              <div className="relative">
                <input
                  type="text"
                  value="Per line item"
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                />
              </div>
            ) : (
              <>
                <SearchableDropdownV2
                  value={quote.endUserId || ''}
                  displayValue={quote.endUserName || ''}
                  onChange={async (id, label) => {
                    onQuoteChange({ endUserId: id, endUserName: label });
                    // Auto-populate outside reps from end user
                    if (id) {
                      const reps = await fetchOutsideRepsFromCustomer(id);
                      if (reps.length > 0) {
                        if (settings?.outsideRepAtLineLevel) {
                          // Per line item mode - populate all line items
                          onAutoPopulateOutsideRepsToLineItems?.(reps);
                        } else {
                          // Header level mode - populate header fields
                          const primaryRep = reps[0];
                          if (reps.length > 1) {
                            // Multiple reps - set up split commission
                            setShowOutsideSplitCommission(true);
                            setOutsideSplitReps(reps.map((r, idx) => ({
                              id: r.id,
                              userId: r.userId,
                              userName: r.userName,
                              splitRate: r.splitRate,
                              position: idx + 1,
                            })));
                            // Skip the useEffect to prevent it from overwriting our reps with names
                            skipOutsideRepsEffectRef.current = true;
                            onQuoteChange({
                              outsideRepId: primaryRep.userId,
                              outsideRepName: primaryRep.userName,
                              outsideReps: reps.map((r, idx) => ({
                                id: '',
                                userId: r.userId,
                                splitRate: r.splitRate,
                                position: idx + 1,
                              })),
                            });
                          } else {
                            // Single rep
                            setShowOutsideSplitCommission(false);
                            setOutsideSplitReps([]);
                            onQuoteChange({
                              outsideRepId: primaryRep.userId,
                              outsideRepName: primaryRep.userName,
                              outsideReps: [{ id: '', userId: primaryRep.userId, splitRate: '100', position: 1 }],
                            });
                          }
                        }
                      }
                    }
                  }}
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
              </>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Outside Rep</label>
            {/* Grey out and show "per line item" when settings enabled */}
            {settings?.outsideRepAtLineLevel ? (
              <div className="relative">
                <input
                  type="text"
                  value="Per line item"
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                />
              </div>
            ) : (
              <>
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
                        // Set outsideReps array so it gets sent in splitRates on line items
                        outsideReps: id ? [{ id: '', userId: id, splitRate: '100', position: 0 }] : [],
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
                              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
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
              </>
            )}
          </div>
        </div>

        {/* Row 2: Quote Type, Bill To, Job, Payment Terms, Freight Terms, Revised Date, Accept Date, Inside Rep */}
        <div className="grid grid-cols-8 gap-4 mb-4">
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
            <label className="block text-xs text-gray-500 mb-1">Bill To Customer</label>
            <SearchableDropdownV2
              value={quote.billToCustomerId}
              displayValue={quote.billToCustomerName}
              onChange={(id, label) => onQuoteChange({ billToCustomerId: id, billToCustomerName: label })}
              options={billToOptions}
              onSearch={handleBillToSearch}
              isLoading={isBillToLoading}
              placeholder="Search customers..."
              disabled={billToSameAsSoldTo}
            />
            <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={billToSameAsSoldTo}
                onChange={(e) => handleBillToSameAsSoldTo(e.target.checked)}
                className="w-3 h-3 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-500">Same as sold to</span>
            </label>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Job</label>
            <SearchableDropdownV2
              value={quote.jobId || ''}
              displayValue={quote.jobName || ''}
              placeholder="Search jobs..."
              isLoading={isJobsLoading}
              options={(jobs || []).map((job) => ({
                id: job.id,
                label: job.jobName,
                sublabel: job.jobType ? `${job.jobType}${job.status?.name ? ` • ${job.status.name}` : ''}` : job.status?.name,
              }))}
              onSearch={(term) => {
                setJobSearchTerm(term);
                setJobSearchEnabled(true);
              }}
              onChange={(id, label) => {
                onQuoteChange({ jobId: id || undefined, jobName: label });
                setJobSearchEnabled(false);
              }}
              onCreateNew={async (jobName) => {
                // Get default status (use first status if available)
                const defaultStatus = jobStatuses?.[0];
                if (!defaultStatus) {
                  console.error('No job statuses available');
                  return;
                }

                const jobInput: JobInput = {
                  jobName,
                  statusId: defaultStatus.id,
                };

                try {
                  const newJob = await createJobMutation.mutateAsync(jobInput);
                  return {
                    id: newJob.id,
                    label: newJob.jobName,
                  };
                } catch (error) {
                  console.error('Failed to create job:', error);
                  throw error;
                }
              }}
              createLabel="job"
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Revised Date</label>
            <StyledDatePicker
              selected={parseDateString(quote.revisedDate || '')}
              onChange={(date) => handleDateChange('revisedDate', formatDateToString(date))}
              placeholder="Select date..."
              className="!py-2 !px-3 !rounded-md !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Accept Date</label>
            <StyledDatePicker
              selected={parseDateString(quote.acceptDate || '')}
              onChange={(date) => handleDateChange('acceptDate', formatDateToString(date))}
              placeholder="Select date..."
              className="!py-2 !px-3 !rounded-md !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Inside Rep</label>
            {/* Grey out and show "per line item" when settings enabled */}
            {settings?.insideRepAtLineLevel ? (
              <div className="relative">
                <input
                  type="text"
                  value="Per line item"
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
                />
              </div>
            ) : (
              <>
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
                              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
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
                    <span className="text-xs text-gray-500">Select Multiple Reps</span>
                  </label>
                )}
              </>
            )}
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
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  // Move focus to the first line item cell instead of other elements
                  const firstLineItemCell = document.querySelector('tbody tr[data-item-id] td button:not([title="Remove line item"]):not([title="More options"])');
                  if (firstLineItemCell) {
                    e.preventDefault();
                    (firstLineItemCell as HTMLElement).focus();
                  }
                }
              }}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Blanket</span>
          </label>
        </div>
        </div>
        )}
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
                      {/* Percentage is auto-calculated, hidden from UI */}
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
                      const rep = insideSplitRepResults?.find(r => r.id === id);
                      if (rep) {
                        addRepToSplit(rep, true);
                      }
                    }}
                    options={insideSplitRepOptions.filter(opt => !insideSplitReps.some(r => r.userId === opt.id))}
                    onSearch={handleInsideSplitRepSearch}
                    isLoading={isInsideSplitRepLoading}
                    placeholder="Search reps to add..."
                  />
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
                    disabled={insideSplitReps.length === 0}
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
                      const rep = outsideSplitRepResults?.find(r => r.id === id);
                      if (rep) {
                        addRepToSplit(rep, false);
                      }
                    }}
                    options={outsideSplitRepOptions.filter(opt => !outsideSplitReps.some(r => r.userId === opt.id))}
                    onSearch={handleOutsideSplitRepSearch}
                    isLoading={isOutsideSplitRepLoading}
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

      {/* Create Order from Quote Modal */}
      <CreateOrderFromQuoteModal
        isOpen={showCreateOrderModal}
        quoteId={quote.id}
        quoteNumber={quote.quoteNumber}
        factoryId={lineItems[0]?.manufacturerId}
        factoryName={lineItems[0]?.manufacturerName}
        lineItems={lineItems}
        initialSelectedItemIds={selectedLineItemIds}
        onClose={() => setShowCreateOrderModal(false)}
      />

      {/* PDF Builder */}
      <PDFBuilder
        entityId={quote.id}
        entityType="QUOTES"
        isOpen={showPDFBuilder}
        onClose={() => setShowPDFBuilder(false)}
      />

      {/* Excel Builder */}
      <ExcelBuilder
        entityId={quote.id}
        entityType="QUOTES"
        isOpen={showExcelBuilder}
        onClose={() => setShowExcelBuilder(false)}
      />

      <ManufacturerExcelModal
        entityId={quote.id}
        entityType="QUOTES"
        isOpen={showManufacturerExcel}
        onClose={() => setShowManufacturerExcel(false)}
      />

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedChangesModal}
        title="Unsaved Changes"
        message="You have unsaved changes to this quote. Please save before creating an order."
        actionLabel="Save Quote"
        isSaving={isSaving}
        onClose={() => setShowUnsavedChangesModal(false)}
        onSave={async () => {
          if (onSave) {
            const success = await onSave();
            if (success) {
              setShowUnsavedChangesModal(false);
              // After saving successfully, open the create order modal
              setShowCreateOrderModal(true);
            }
            // If save failed, keep the modal open so user can cancel or try again after fixing issues
          }
        }}
      />
    </div>
  );
}

export default QuoteDetailHeaderV2;

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
import { useQuoteSettings } from '@/contexts/UserSettingsContext';
import type { OutsideRepSource } from '@/components/lib/graphql/settings';
import { CreateOrderFromQuoteModal } from '../modals/CreateOrderFromQuoteModal';
import { FactoryOverageSettingsModal } from '../modals/FactoryOverageSettingsModal';
import { useFactory } from '@/components/warehouse/api/useFactoriesApi';
import { CreatedByBadge } from '@/components/ui/CreatedByBadge';
import { PDFBuilder } from '@/components/shared/pdf-builder';
import CreateSubmittalModal from '@/components/submittals/CreateSubmittalModal';
import type { QuoteLineItem } from '@/components/submittals/CreateSubmittalModal';
import type { Submittal } from '@/lib/types/submittals';
import {
  useCreateSubmittal,
  useAddSubmittalItem,
  useAddSubmittalStakeholder,
  type SubmittalItemInput,
  type SubmittalStakeholderInput,
  type SubmittalStakeholderRoleGQL,
} from '@/components/submittals/api/useSubmittalsApi';
import { submittalToasts } from '@/components/lib/toast';
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

// View mode type
export type ViewMode = 'simple' | 'overage';

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
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
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
  viewMode: controlledViewMode,
  onViewModeChange,
  onAutoPopulateOutsideRepsToLineItems,
  onAutoPopulateInsideRepsToLineItems,
  onAutoPopulateInsideRepsPerLineItemFactory,
}: QuoteDetailHeaderV2Props) {
  // Auto-populate reps hook
  const {
    fetchOutsideRepsFromCustomer,
    fetchInsideRepsFromFactory,
  } = useAutoPopulateReps();

  // Submittal creation hooks
  const createSubmittalMutation = useCreateSubmittal();
  const addSubmittalItemMutation = useAddSubmittalItem();
  const addSubmittalStakeholderMutation = useAddSubmittalStakeholder();

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPipelineStageMenu, setShowPipelineStageMenu] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [localViewMode, setLocalViewMode] = useState<ViewMode>('simple');

  // Use controlled viewMode if provided, otherwise use local state
  const viewMode = controlledViewMode ?? localViewMode;
  const handleViewModeChange = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setLocalViewMode(mode);
    }
  };
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showCreateSubmittalModal, setShowCreateSubmittalModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [unsavedChangesAction, setUnsavedChangesAction] = useState<'createOrder' | 'pdfBuilder'>('createOrder');
  const [showQuoteDetails, setShowQuoteDetails] = useState(true);
  const [showPDFBuilder, setShowPDFBuilder] = useState(false);
  const [showOverageSettingsModal, setShowOverageSettingsModal] = useState(false);
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

  // Outside rep auto-populate loading state
  const [isPopulatingOutsideReps, setIsPopulatingOutsideReps] = useState(false);
  const [outsideRepPopulateSource, setOutsideRepPopulateSource] = useState<string | null>(null);

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

  // Quote tenant settings - read directly since personal settings mask these
  const { tenantSettings: quoteTenantSettings } = useQuoteSettings();
  const outsideRepSource: OutsideRepSource = quoteTenantSettings?.outsideRepSource || settings?.outsideRepSource || 'end_user';
  const hideQuoteNameField = quoteTenantSettings?.hideQuoteNameField ?? settings?.hideQuoteNameField ?? false;

  // Source labels for the loading indicator
  const outsideRepSourceLabel: Record<string, string> = {
    'sold_to': 'Sold To',
    'bill_to': 'Bill To',
    'end_user': 'End User',
  };

  // Reusable helper to auto-populate outside reps from a given customer ID
  const autoPopulateOutsideRepsFromCustomer = useCallback(async (customerId: string, sourceOverride?: string) => {
    if (!customerId) return;
    const sourceLabel = outsideRepSourceLabel[sourceOverride || outsideRepSource] || 'Customer';
    setIsPopulatingOutsideReps(true);
    setOutsideRepPopulateSource(sourceLabel);
    try {
      const reps = await fetchOutsideRepsFromCustomer(customerId);
      if (reps.length > 0) {
        if (settings?.outsideRepAtLineLevel) {
          onAutoPopulateOutsideRepsToLineItems?.(reps);
        } else {
          const primaryRep = reps[0];
          if (reps.length > 1) {
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
    } catch (error) {
      console.error('Failed to auto-populate outside reps:', error);
    } finally {
      setIsPopulatingOutsideReps(false);
      setOutsideRepPopulateSource(null);
    }
  }, [fetchOutsideRepsFromCustomer, settings?.outsideRepAtLineLevel, onAutoPopulateOutsideRepsToLineItems, onQuoteChange, outsideRepSource]);

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
  // Includes line discounts and commission discounts from AdditionalDetailsModal
  const calculatedTotals = useMemo(() => {
    if (lineItems.length === 0) {
      return {
        basePrice: Number(quote.basePrice) || 0,
        sellPrice: Number(quote.sellPrice) || 0,
        commission: Number(quote.commission) || 0,
        originalSellPrice: Number(quote.sellPrice) || 0,
        originalCommission: Number(quote.commission) || 0,
        totalLineDiscount: 0,
        totalCommissionDiscount: 0,
      };
    }

    const basePrice = lineItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const div = Number(item.divisor) || 1;
      return sum + (qty * price / div);
    }, 0);

    // Calculate original values (before discounts) and total discounts
    const originalSellPrice = lineItems.reduce((sum, item) => {
      return sum + (Number(item.sellTotal) || 0);
    }, 0);

    // originalCommission is commission BEFORE commission discount
    // Use item.commission which is the total commission calculated on (discounted) sell total
    // item.commissionTotal is commission AFTER commission discount (from API's totalLineCommission)
    const originalCommission = lineItems.reduce((sum, item) => {
      // If commission is set, use it (this is total commission before comm discount)
      // Otherwise fall back to commissionTotal + commissionDiscountAmount to reconstruct it
      const commBeforeDiscount = (Number(item.commission) || 0) > 0
        ? Number(item.commission)
        : (Number(item.commissionTotal) || 0) + (Number(item.commissionDiscountAmount) || 0);
      return sum + commBeforeDiscount;
    }, 0);

    const totalLineDiscount = lineItems.reduce((sum, item) => {
      return sum + (Number(item.lineDiscountAmount) || 0);
    }, 0);

    const totalCommissionDiscount = lineItems.reduce((sum, item) => {
      return sum + (Number(item.commissionDiscountAmount) || 0);
    }, 0);

    // sellPrice accounts for line discounts
    const sellPrice = originalSellPrice - totalLineDiscount;

    // commission accounts for commission discounts
    const commission = originalCommission - totalCommissionDiscount;

    return { basePrice, sellPrice, commission, originalSellPrice, originalCommission, totalLineDiscount, totalCommissionDiscount };
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
  // Fetch factory details to check overage settings
  const { data: selectedFactory } = useFactory(quote.factoryId || '');
  const isOverageAllowed = selectedFactory?.overageAllowed ?? false;

  // Auto-switch to Simple View if overage is not allowed for the factory
  useEffect(() => {
    if (!isOverageAllowed && viewMode === 'overage') {
      handleViewModeChange('simple');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOverageAllowed, viewMode]);

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
      if (outsideRepSource === 'end_user') {
        await autoPopulateOutsideRepsFromCustomer(quote.soldToCustomerId, 'end_user');
      }
    }
  }, [quote.soldToCustomerId, quote.soldToCustomerName, onQuoteChange, outsideRepSource, autoPopulateOutsideRepsFromCustomer]);

  // Handle bill to same as sold to checkbox
  const handleBillToSameAsSoldTo = useCallback(async (checked: boolean) => {
    setBillToSameAsSoldTo(checked);
    if (checked && quote.soldToCustomerId) {
      onQuoteChange({
        billToCustomerId: quote.soldToCustomerId,
        billToCustomerName: quote.soldToCustomerName,
      });
      if (outsideRepSource === 'bill_to') {
        await autoPopulateOutsideRepsFromCustomer(quote.soldToCustomerId, 'bill_to');
      }
    }
  }, [quote.soldToCustomerId, quote.soldToCustomerName, onQuoteChange, outsideRepSource, autoPopulateOutsideRepsFromCustomer]);

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

  // Handle create submittal - calls the API to persist to backend
  const handleCreateSubmittal = useCallback(async (newSubmittal: Partial<Submittal>) => {
    try {
      // 1. Create the submittal
      const createdSubmittal = await createSubmittalMutation.mutateAsync({
        submittalNumber: `SUB-${Date.now()}`,
        description: newSubmittal.jobName || 'New Submittal',
        status: 'DRAFT',
        quoteId: newSubmittal.quoteIds?.[0],
      });

      const submittalId = createdSubmittal.id;

      // 2. Add items
      if (newSubmittal.items && newSubmittal.items.length > 0) {
        for (let i = 0; i < newSubmittal.items.length; i++) {
          const item = newSubmittal.items[i];
          const itemInput: SubmittalItemInput = {
            itemNumber: i + 1,
            partNumber: item.catalogNumber || item.fixtureType,
            description: item.description,
            quantity: item.quantity,
            matchStatus: 'NO_MATCH',
          };
          await addSubmittalItemMutation.mutateAsync({ submittalId, input: itemInput });
        }
      }

      // 3. Add stakeholders (customers, engineers, architects)
      const mapRoleToGQL = (role: string): SubmittalStakeholderRoleGQL => {
        switch (role) {
          case 'customer': return 'CUSTOMER';
          case 'engineer': return 'ENGINEER';
          case 'architect': return 'ARCHITECT';
          case 'gc': return 'GENERAL_CONTRACTOR';
          default: return 'OTHER';
        }
      };

      const allStakeholders = [
        ...(newSubmittal.customers || []),
        ...(newSubmittal.engineers || []),
        ...(newSubmittal.architects || []),
      ];

      for (const stakeholder of allStakeholders) {
        const stakeholderInput: SubmittalStakeholderInput = {
          role: mapRoleToGQL(stakeholder.role),
          contactName: stakeholder.contactName,
          contactEmail: stakeholder.email,
          companyName: stakeholder.companyName,
        };
        await addSubmittalStakeholderMutation.mutateAsync({ submittalId, input: stakeholderInput });
      }

      setShowCreateSubmittalModal(false);
      submittalToasts.createSuccess(createdSubmittal.submittalNumber);
    } catch (err) {
      console.error('Error creating submittal:', err);
      submittalToasts.createError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [createSubmittalMutation, addSubmittalItemMutation, addSubmittalStakeholderMutation]);

  return (
    <div className="flex-shrink-0 bg-white">
      {/* Sticky section: Top Header Row + Pricing Summary */}
      <div className="sticky top-0 z-30 bg-white">
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
                        setUnsavedChangesAction('createOrder');
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

                  {/* Create Submittal */}
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowCreateSubmittalModal(true);
                    }}
                    disabled={isNew || !quote.id}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                      isNew || !quote.id ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Create Submittal
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

          {/* View Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowViewModeMenu(!showViewModeMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
              </svg>
              {viewMode === 'simple' ? 'Simple View' : 'Overage View'}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showViewModeMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowViewModeMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      handleViewModeChange('simple');
                      setShowViewModeMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${viewMode === 'simple' ? 'bg-gray-50' : ''}`}
                  >
                    <span>Simple View</span>
                    {viewMode === 'simple' && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-indigo-600">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (isOverageAllowed) {
                        handleViewModeChange('overage');
                        setShowViewModeMenu(false);
                      }
                    }}
                    disabled={!isOverageAllowed}
                    title={!isOverageAllowed ? 'Overage is not enabled for this manufacturer. Click the gear icon to enable.' : ''}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                      !isOverageAllowed
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'hover:bg-gray-50'
                    } ${viewMode === 'overage' ? 'bg-gray-50' : ''}`}
                  >
                    <span>Overage View {!isOverageAllowed && '(Disabled)'}</span>
                    {viewMode === 'overage' && (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-indigo-600">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}
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
              if (hasChanges) {
                setUnsavedChangesAction('pdfBuilder');
                setShowUnsavedChangesModal(true);
              } else {
                setShowPDFBuilder(true);
              }
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
      <div className="flex items-center justify-end gap-6 px-6 py-3 text-sm border-b border-gray-200 bg-gradient-to-r from-slate-50 to-indigo-50/50">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Base Price</span>
          <span className="font-semibold text-gray-700">${Number(calculatedTotals.basePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">Sell Price</span>
          <span className="font-bold text-lg text-gray-900">${Number(calculatedTotals.sellPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          {calculatedTotals.totalLineDiscount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 line-through">${Number(calculatedTotals.originalSellPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-xs text-orange-600 bg-orange-50 px-1 rounded">-${Number(calculatedTotals.totalLineDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            </div>
          )}
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-purple-500">Commission</span>
          <span className="font-bold text-lg text-purple-600">${Number(calculatedTotals.commission).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
          {calculatedTotals.totalCommissionDiscount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 line-through">${Number(calculatedTotals.originalCommission).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-xs text-purple-600 bg-purple-50 px-1 rounded">-${Number(calculatedTotals.totalCommissionDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Quote Details Section - Collapsible (not sticky) */}
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

        {/* Row 1: Quote Number, Name (optional), Manufacturer, Quote Date, Expiration Date, Sold To Customer, End User, Outside Rep */}
        <div className={`grid gap-4 mb-4 ${hideQuoteNameField ? 'grid-cols-7' : 'grid-cols-8'}`}>
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
          {!hideQuoteNameField && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={quote.name || ''}
              onChange={(e) => onQuoteChange({ name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter quote name (optional)"
            />
          </div>
          )}
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
              <div className="flex gap-1">
              <div className="flex-1">
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
              </div>
              {/* Overage Settings Button */}
              {quote.factoryId && (
                <button
                  type="button"
                  onClick={() => setShowOverageSettingsModal(true)}
                  className="flex items-center justify-center p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-300 rounded-md transition-colors"
                  title="Overage Settings"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              )}
              </div>
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
                // If "Same as sold to" is checked, update end user too
                if (endUserSameAsSoldTo) {
                  onQuoteChange({ endUserId: id, endUserName: label });
                }
                // If "Same as sold to" is checked for bill to, update bill to too
                if (billToSameAsSoldTo) {
                  onQuoteChange({ billToCustomerId: id, billToCustomerName: label });
                }
                // Auto-populate outside reps based on source setting
                if (id) {
                  if (outsideRepSource === 'sold_to') {
                    await autoPopulateOutsideRepsFromCustomer(id, 'sold_to');
                  } else if (outsideRepSource === 'end_user' && endUserSameAsSoldTo) {
                    await autoPopulateOutsideRepsFromCustomer(id, 'end_user');
                  } else if (outsideRepSource === 'bill_to' && billToSameAsSoldTo) {
                    await autoPopulateOutsideRepsFromCustomer(id, 'bill_to');
                  }
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
                    if (id && outsideRepSource === 'end_user') {
                      await autoPopulateOutsideRepsFromCustomer(id, 'end_user');
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
            <label className="block text-xs text-gray-500 mb-1">
              Outside Rep
              {isPopulatingOutsideReps && (
                <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-normal text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded animate-pulse">
                  <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  from {outsideRepPopulateSource}
                </span>
              )}
            </label>
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
              onChange={async (id, label) => {
                onQuoteChange({ billToCustomerId: id, billToCustomerName: label });
                if (id && outsideRepSource === 'bill_to') {
                  await autoPopulateOutsideRepsFromCustomer(id, 'bill_to');
                }
              }}
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

      {/* Create Submittal Modal */}
      {showCreateSubmittalModal && (
        <CreateSubmittalModal
          onClose={() => setShowCreateSubmittalModal(false)}
          onCreate={handleCreateSubmittal}
          preselectedQuoteId={quote.id}
          preselectedQuoteName={quote.quoteNumber}
          quoteLineItems={lineItems.map((item): QuoteLineItem => ({
            id: item.id,
            catalogNumber: item.partNumber,
            manufacturer: item.manufacturerName,
            description: item.description,
            quantity: item.quantity,
          }))}
        />
      )}

      {/* PDF Builder */}
      <PDFBuilder
        entityId={quote.id}
        entityType="QUOTES"
        isOpen={showPDFBuilder}
        onClose={() => setShowPDFBuilder(false)}
      />

{/* Factory Overage Settings Modal */}
      <FactoryOverageSettingsModal
        isOpen={showOverageSettingsModal}
        onClose={() => setShowOverageSettingsModal(false)}
        factoryId={quote.factoryId || null}
        factoryName={quote.factoryName}
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
        message={
          unsavedChangesAction === 'pdfBuilder'
            ? 'You have unsaved changes to this quote. Please save before opening the PDF builder.'
            : 'You have unsaved changes to this quote. Please save before creating an order.'
        }
        actionLabel="Save Quote"
        isSaving={isSaving}
        onClose={() => setShowUnsavedChangesModal(false)}
        onSave={async () => {
          if (onSave) {
            const success = await onSave();
            if (success) {
              setShowUnsavedChangesModal(false);
              // After saving successfully, open the appropriate modal
              if (unsavedChangesAction === 'pdfBuilder') {
                setShowPDFBuilder(true);
              } else {
                setShowCreateOrderModal(true);
              }
            }
            // If save failed, keep the modal open so user can cancel or try again after fixing issues
          }
        }}
      />
    </div>
  );
}

export default QuoteDetailHeaderV2;

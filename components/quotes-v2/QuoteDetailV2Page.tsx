'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { QuoteV2, LineItemV2, QuoteSettingsV2, ColumnConfig, Quote } from './types';
import {
  transformQuoteToQuoteV2,
  transformQuoteDetailToLineItemV2,
  createEmptyQuoteV2,
  transformLineItemV2ToDetailInput,
} from './types';
import { QuoteDetailHeaderV2, type ViewMode } from './components/QuoteDetailHeaderV2';
import { LineItemsTabV2 } from './tabs/LineItemsTabV2';
import { getColumnsForView, COLUMN_LABELS } from './config/viewsConfig';
import { NotesTabV2 } from './tabs/NotesTabV2';
import { TasksTabV2 } from './tabs/TasksTabV2';
import { ActivityTabV2 } from './tabs/ActivityTabV2';
import { LinkedObjectsTabV2 } from './tabs/LinkedObjectsTabV2';
import { VersionsTabV2 } from './tabs/VersionsTabV2';
import { SettingsTabV2 } from './tabs/SettingsTabV2';
import { FilesTab } from '@/components/shared/FilesTab';
import { ColumnsConfigModalV2 } from './modals/ColumnsConfigModalV2';
import { AdditionalDetailsModalV2 } from './modals/AdditionalDetailsModalV2';
import { DuplicateQuoteModal } from './modals/DuplicateQuoteModal';
import { ConnectedEntitiesSection } from '@/components/shared/ConnectedEntitiesSection';
import {
  defaultQuoteSettingsV2,
  defaultColumnConfigV2,
  mockActivitiesV2,
  mockVersionsV2,
} from './data/mockData';
import {
  useQuoteV2,
  useCreateQuoteV2,
  useUpdateQuoteV2,
  useDeleteQuoteV2,
  useDuplicateQuoteV2,
} from './api/quotesV2Api';
import { searchUsers, searchFactories, searchCustomers, getProductCpnByCustomer } from '../quotes/api/quotesApi';
import { quoteToasts } from '../lib/toast';
import { createLink, deleteLinkByEntities } from '../lib/graphql/entity-links';

// Helper function to fetch CPNs for line items with products
async function fetchCpnsForLineItems(
  items: LineItemV2[],
  customerId: string,
  setLineItems: React.Dispatch<React.SetStateAction<LineItemV2[]>>
) {
  if (!customerId || items.length === 0) return;

  // Get line items that have a productId
  const itemsWithProducts = items.filter(li => li.productId);
  if (itemsWithProducts.length === 0) return;

  // Fetch CPNs for each product in parallel
  const cpnPromises = itemsWithProducts.map(async (li) => {
    try {
      const cpnResult = await getProductCpnByCustomer(li.productId!, customerId);
      return { itemId: li.id, cpn: cpnResult?.customerPartNumber || '' };
    } catch (err) {
      console.log('No CPN found for product:', li.productId);
      return { itemId: li.id, cpn: '' };
    }
  });

  const cpnResults = await Promise.all(cpnPromises);

  // Update line items with fetched CPNs
  const cpnMap = new Map(cpnResults.map(r => [r.itemId, r.cpn]));
  setLineItems((prev) =>
    prev.map((li) => ({
      ...li,
      customerPartNumber: cpnMap.has(li.id) ? cpnMap.get(li.id)! : li.customerPartNumber,
    }))
  );
}

type TabType = 'lineItems' | 'notes' | 'tasks' | 'activity' | 'linkedObjects' | 'versions' | 'settings' | 'files';

interface QuoteDetailV2PageProps {
  quoteId: string | null;
  onBack: () => void;
  isNew?: boolean;
}

export function QuoteDetailV2Page({ quoteId, onBack, isNew = false }: QuoteDetailV2PageProps) {
  // API hooks
  const { data: apiQuote, isLoading, error } = useQuoteV2(quoteId);
  const createQuoteMutation = useCreateQuoteV2();
  const updateQuoteMutation = useUpdateQuoteV2();
  const deleteQuoteMutation = useDeleteQuoteV2();
  const duplicateQuoteMutation = useDuplicateQuoteV2();

  // Quote state
  const [quote, setQuote] = useState<QuoteV2>(createEmptyQuoteV2());
  const [hasChanges, setHasChanges] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('lineItems');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemV2[]>([]);

  // Settings state
  const [settings, setSettings] = useState<QuoteSettingsV2>(defaultQuoteSettingsV2);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('simple');

  // Column configuration - derived from viewMode
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(defaultColumnConfigV2);

  // Update column config when view mode changes
  const effectiveColumnConfig = useMemo(() => {
    const viewColumns = getColumnsForView(viewMode);
    return viewColumns.map((key) => ({
      key,
      label: COLUMN_LABELS[key],
      group: key.startsWith('ovg') || key.startsWith('earn') || key === 'percentOver' ? 'Commission' as const :
             ['quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal'].includes(key) ? 'Pricing' as const : 'Basic' as const,
      visible: true,
    }));
  }, [viewMode]);

  // Modal states
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showAdditionalDetailsModal, setShowAdditionalDetailsModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<LineItemV2 | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Counter to trigger linked entities refresh after save
  const [linkedEntitiesRefreshKey, setLinkedEntitiesRefreshKey] = useState(0);

  // Transform API data to UI format when it loads
  useEffect(() => {
    if (apiQuote && !isNew) {
      const transformedQuote = transformQuoteToQuoteV2(apiQuote);
      setQuote(transformedQuote);

      // Store the original job ID for link management
      originalJobIdRef.current = transformedQuote.jobId;
      prevJobIdRef.current = transformedQuote.jobId;

      // Transform line items
      if (apiQuote.details) {
        const transformedLineItems = apiQuote.details.map((detail) =>
          transformQuoteDetailToLineItemV2(detail, apiQuote.id)
        );
        setLineItems(transformedLineItems);

        // Collect unique factory and end user IDs to fetch their names
        const factoryIds = new Set<string>();
        const endUserIds = new Set<string>();
        transformedLineItems.forEach((li) => {
          if (li.manufacturerId) factoryIds.add(li.manufacturerId);
          if (li.endUserId) endUserIds.add(li.endUserId);
        });

        // Fetch factory names
        if (factoryIds.size > 0) {
          searchFactories('', true)
            .then((factories) => {
              const factoryMap = new Map(factories.map((f) => [f.id, f.title]));
              setLineItems((prev) =>
                prev.map((li) => ({
                  ...li,
                  manufacturerName: li.manufacturerId ? factoryMap.get(li.manufacturerId) || '' : '',
                }))
              );

              // When factoryPerLineItem is false, populate header-level factory from first line item
              // (all line items should have the same factory when this setting is off)
              if (apiQuote.factoryPerLineItem === false && transformedLineItems.length > 0) {
                const firstLineItemWithFactory = transformedLineItems.find(li => li.manufacturerId);
                if (firstLineItemWithFactory?.manufacturerId) {
                  const factoryName = factoryMap.get(firstLineItemWithFactory.manufacturerId) || '';
                  setQuote(prev => ({
                    ...prev,
                    factoryId: firstLineItemWithFactory.manufacturerId,
                    factoryName: factoryName,
                  }));
                }
              }
            })
            .catch((err) => console.error('Failed to fetch factory names:', err));
        }

        // Fetch end user names
        if (endUserIds.size > 0) {
          searchCustomers('', true)
            .then((customers) => {
              const customerMap = new Map(customers.map((c) => [c.id, c.companyName]));
              setLineItems((prev) =>
                prev.map((li) => ({
                  ...li,
                  endUserName: li.endUserId ? customerMap.get(li.endUserId) || '' : '',
                }))
              );
            })
            .catch((err) => console.error('Failed to fetch end user names:', err));
        }

        // Fetch CPNs for line items that have products
        if (apiQuote.soldToCustomerId && transformedLineItems.some(li => li.productId)) {
          fetchCpnsForLineItems(transformedLineItems, apiQuote.soldToCustomerId, setLineItems);
        }
      }
      setHasChanges(false);

      // Use settings from API response
      setSettings(prev => ({
        ...prev,
        specifyEndUserPerLine: apiQuote.endUserPerLineItem ?? false,
        insideRepAtLineLevel: apiQuote.insidePerLineItem ?? false,
        outsideRepAtLineLevel: apiQuote.outsidePerLineItem ?? false,
        factoryPerLineItem: apiQuote.factoryPerLineItem ?? false,
      }));

      // Extract inside and outside reps from line item split rates
      // The backend now stores both insideSplitRates and outsideSplitRates at detail level
      if (apiQuote.details && apiQuote.details.length > 0) {
        // Get split rates from the first line item (used for header display when not in per-line mode)
        const firstDetailWithInsideReps = apiQuote.details.find(d => d.insideSplitRates && d.insideSplitRates.length > 0);
        const firstDetailWithOutsideReps = apiQuote.details.find(d => d.outsideSplitRates && d.outsideSplitRates.length > 0);

        // Extract inside reps
        if (firstDetailWithInsideReps?.insideSplitRates && firstDetailWithInsideReps.insideSplitRates.length > 0) {
          const insideSplitRates = firstDetailWithInsideReps.insideSplitRates;

          // Fetch inside users to get their names
          searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
            .then((insideUsers) => {
              const insideRepsFromSplitRates: { id: string; userId?: string; splitRate?: string; position?: number }[] = [];

              insideSplitRates.forEach(sr => {
                if (sr.userId) {
                  insideRepsFromSplitRates.push({
                    id: sr.id,
                    userId: sr.userId,
                    splitRate: sr.splitRate,
                    position: sr.position,
                  });
                }
              });

              if (insideRepsFromSplitRates.length > 0) {
                const firstInsideRep = insideRepsFromSplitRates[0];
                const matchingUser = insideUsers.find(u => u.id === firstInsideRep.userId);
                setQuote((prev) => ({
                  ...prev,
                  insideReps: insideRepsFromSplitRates,
                  insideRepId: firstInsideRep.userId,
                  insideRepName: matchingUser?.fullName || '',
                }));
              }
            })
            .catch((err) => {
              console.error('Failed to fetch inside reps:', err);
            });
        }

        // Extract outside reps
        if (firstDetailWithOutsideReps?.outsideSplitRates && firstDetailWithOutsideReps.outsideSplitRates.length > 0) {
          const outsideSplitRates = firstDetailWithOutsideReps.outsideSplitRates;

          // Fetch outside users to get their names
          searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 })
            .then((outsideUsers) => {
              const outsideRepsFromSplitRates: { id: string; userId?: string; splitRate?: string; position?: number }[] = [];

              outsideSplitRates.forEach(sr => {
                if (sr.userId) {
                  outsideRepsFromSplitRates.push({
                    id: sr.id,
                    userId: sr.userId,
                    splitRate: sr.splitRate,
                    position: sr.position,
                  });
                }
              });

              if (outsideRepsFromSplitRates.length > 0) {
                const firstOutsideRep = outsideRepsFromSplitRates[0];
                const matchingUser = outsideUsers.find(u => u.id === firstOutsideRep.userId);
                setQuote((prev) => ({
                  ...prev,
                  outsideReps: outsideRepsFromSplitRates,
                  outsideRepId: firstOutsideRep.userId,
                  outsideRepName: matchingUser?.fullName || '',
                }));
              }
            })
            .catch((err) => {
              console.error('Failed to fetch outside reps:', err);
            });
        }
      }
    }
  }, [apiQuote, isNew]);

  // Track previous soldToCustomerId to detect changes
  const prevSoldToCustomerIdRef = React.useRef<string | undefined>(undefined);

  // Track previous jobId to manage quote-job links
  const prevJobIdRef = React.useRef<string | undefined>(undefined);
  // Track if job link is being managed to prevent duplicate operations
  const isManagingJobLinkRef = React.useRef<boolean>(false);
  // Track the original job ID from API for editing scenarios
  const originalJobIdRef = React.useRef<string | undefined>(undefined);

  // Re-fetch CPNs when sold-to customer changes
  useEffect(() => {
    // Only re-fetch if customer actually changed (not on initial load)
    if (
      prevSoldToCustomerIdRef.current !== undefined &&
      quote.soldToCustomerId !== prevSoldToCustomerIdRef.current &&
      quote.soldToCustomerId &&
      lineItems.some(li => li.productId)
    ) {
      fetchCpnsForLineItems(lineItems, quote.soldToCustomerId, setLineItems);
    }
    prevSoldToCustomerIdRef.current = quote.soldToCustomerId;
  }, [quote.soldToCustomerId, lineItems]);

  const handleQuoteChange = useCallback((updates: Partial<QuoteV2>) => {
    setQuote((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const handleLineItemsChange = useCallback((items: LineItemV2[]) => {
    setLineItems(items);
    setHasChanges(true);
  }, []);

  const handleOpenAdditionalDetails = useCallback((item: LineItemV2) => {
    setSelectedLineItem(item);
    setShowAdditionalDetailsModal(true);
  }, []);

  const handleSaveAdditionalDetails = useCallback((updates: Partial<LineItemV2>) => {
    if (selectedLineItem) {
      setLineItems((prev) =>
        prev.map((li) => (li.id === selectedLineItem.id ? { ...li, ...updates } : li))
      );
      setHasChanges(true);
    }
  }, [selectedLineItem]);

  const handleRevertToVersion = useCallback((versionNumber: number) => {
    // Coming soon - no API endpoint for version revert
    console.log('Reverting to version:', versionNumber);
  }, []);

  // Helper to check if string is a valid UUID
  const isValidUUID = (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Build API input from current state
  const buildQuoteInput = useCallback(() => {
    // Use direct status and pipelineStage values from quote state
    // These are set directly via the dropdowns in the header

    return {
      id: quote.id || undefined,
      quoteNumber: quote.quoteNumber,
      entityDate: quote.quoteDate,
      soldToCustomerId: quote.soldToCustomerId,
      billToCustomerId: quote.billToCustomerId || undefined,
      status: quote.status || 'OPEN' as const,
      pipelineStage: quote.pipelineStage || 'DISCOVERY' as const,
      published: quote.published ?? false,
      creationType: quote.creationType || 'MANUAL' as const,
      blanket: quote.blanket ?? false,
      acceptDate: quote.acceptDate || undefined,
      customerRef: quote.customerRef || undefined,
      expDate: quote.expirationDate || undefined,
      freightTerms: quote.freightTerms || undefined,
      jobId: quote.jobId || undefined,
      paymentTerms: quote.paymentTerms || undefined,
      reviseDate: quote.revisedDate || undefined,
      // Settings for per-line-item configuration
      endUserPerLineItem: settings.specifyEndUserPerLine,
      insidePerLineItem: settings.insideRepAtLineLevel,
      outsidePerLineItem: settings.outsideRepAtLineLevel,
      factoryPerLineItem: settings.factoryPerLineItem,
      // Split rates are now at detail level (insideSplitRates and outsideSplitRates per line item)
      // Pass settings so each line item uses its own split rates when per-line-item is enabled
      details: lineItems.map((li, index) => ({
        ...transformLineItemV2ToDetailInput(
          li,
          quote.insideReps,
          quote.outsideReps,
          {
            insideRepAtLineLevel: settings.insideRepAtLineLevel,
            outsideRepAtLineLevel: settings.outsideRepAtLineLevel,
            factoryPerLineItem: settings.factoryPerLineItem,
          },
          quote.factoryId // Pass header-level factory for when factoryPerLineItem is false
        ),
        itemNumber: li.itemNumber ?? index + 1,
      })),
    };
  }, [quote, lineItems, settings]);

  // Manage quote-job links when job selection changes
  const manageJobLink = useCallback(async (quoteId: string, oldJobId: string | undefined, newJobId: string | undefined) => {
    // Skip if already managing or if there's no change
    if (isManagingJobLinkRef.current) return;
    if (oldJobId === newJobId) return;

    isManagingJobLinkRef.current = true;

    try {
      // Delete old link if there was a previous job
      if (oldJobId) {
        try {
          await deleteLinkByEntities({
            sourceEntityType: 'QUOTE',
            sourceEntityId: quoteId,
            targetEntityType: 'JOB',
            targetEntityId: oldJobId,
          });
          console.log('Deleted quote-job link:', quoteId, '->', oldJobId);
        } catch (err) {
          // Link might not exist, which is fine
          console.log('No existing link to delete or error:', err);
        }
      }

      // Create new link if there's a new job
      if (newJobId) {
        try {
          await createLink({
            sourceEntityType: 'QUOTE',
            sourceEntityId: quoteId,
            targetEntityType: 'JOB',
            targetEntityId: newJobId,
          });
          console.log('Created quote-job link:', quoteId, '->', newJobId);
        } catch (err) {
          console.error('Failed to create quote-job link:', err);
        }
      }
    } finally {
      isManagingJobLinkRef.current = false;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!quote.quoteNumber || !quote.soldToCustomerId) {
      setSaveError('Quote Number and Sold To Customer are required');
      quoteToasts.updateError('Quote Number and Sold To Customer are required');
      return;
    }

    // Validate End User based on settings (REQUIRED field)
    console.log('🔍 END USER VALIDATION CHECK:', {
      specifyEndUserPerLine: settings.specifyEndUserPerLine,
      quoteEndUserId: quote.endUserId,
      lineItemsCount: lineItems?.length,
      lineItems: lineItems?.map(li => ({
        id: li.id,
        itemNumber: li.itemNumber,
        partNumber: li.partNumber,
        endUserId: li.endUserId,
        endUserName: li.endUserName,
      }))
    });

    if (!settings.specifyEndUserPerLine) {
      // When toggle is OFF, header End User is REQUIRED
      if (!quote.endUserId || quote.endUserId.trim() === '') {
        console.error('❌ VALIDATION FAILED: Header End User is missing');
        setSaveError('End User is required. Please select an End User at the header level.');
        quoteToasts.updateError('End User is required. Please select an End User at the header level.');
        return;
      }
    } else {
      // When toggle is ON, EACH line item MUST have End User
      if (!lineItems || lineItems.length === 0) {
        console.error('❌ VALIDATION FAILED: No line items');
        setSaveError('Please add at least one line item.');
        quoteToasts.updateError('Please add at least one line item.');
        return;
      }

      const lineItemsWithoutEndUser = lineItems.filter(li => !li.endUserId || li.endUserId.trim() === '');

      console.log('🔍 Line items without end user:', lineItemsWithoutEndUser.length, lineItemsWithoutEndUser.map(li => ({
        id: li.id,
        itemNumber: li.itemNumber,
        partNumber: li.partNumber,
      })));

      if (lineItemsWithoutEndUser.length > 0) {
        console.error('❌ VALIDATION FAILED: Line items missing End User');
        setSaveError(`End User is required for all line items. ${lineItemsWithoutEndUser.length} line item(s) are missing End User. Please set End User in Additional Details for each line item.`);
        quoteToasts.updateError(`End User is required for all line items. ${lineItemsWithoutEndUser.length} line item(s) are missing End User. Please set End User in Additional Details for each line item.`);
        return;
      }
    }

    console.log('✅ END USER VALIDATION PASSED');

    setIsSaving(true);
    setSaveError(null);

    try {
      const input = buildQuoteInput();

      if (isNew || !quote.id) {
        const result = await createQuoteMutation.mutateAsync(input);
        quoteToasts.createSuccess(quote.quoteNumber);

        // Create job link if a job was selected for the new quote
        if (quote.jobId && result.id) {
          await manageJobLink(result.id, undefined, quote.jobId);
        }

        // Navigate to the new quote
        window.location.href = `/quotes-v2/${result.id}`;
      } else {
        await updateQuoteMutation.mutateAsync(input);

        // Manage job link if job selection changed during edit
        const currentJobId = quote.jobId;
        const previousJobId = originalJobIdRef.current;
        if (currentJobId !== previousJobId) {
          await manageJobLink(quote.id, previousJobId, currentJobId);
          // Update the original job ID ref to the new value
          originalJobIdRef.current = currentJobId;
        }

        setHasChanges(false);
        // Trigger refresh of linked entities section
        setLinkedEntitiesRefreshKey(prev => prev + 1);
        quoteToasts.updateSuccess(quote.quoteNumber);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save quote';
      setSaveError(errorMessage);
      if (isNew || !quote.id) {
        quoteToasts.createError(errorMessage);
      } else {
        quoteToasts.updateError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  }, [quote, isNew, buildQuoteInput, createQuoteMutation, updateQuoteMutation, manageJobLink]);

  const handleDelete = useCallback(async () => {
    if (!quote.id) return;

    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      await deleteQuoteMutation.mutateAsync(quote.id);
      quoteToasts.deleteSuccess(quote.quoteNumber);
      onBack();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quote';
      setSaveError(errorMessage);
      quoteToasts.deleteError(errorMessage);
    }
  }, [quote.id, quote.quoteNumber, deleteQuoteMutation, onBack]);

  const handleDuplicate = useCallback(() => {
    if (!quote.id) return;
    setShowDuplicateModal(true);
  }, [quote.id]);

  // Clear line item products when header manufacturer changes (for factoryPerLineItem === false mode)
  const handleClearLineItemProducts = useCallback(() => {
    // Clear product-related fields from all line items
    setLineItems(prev => prev.map(item => ({
      ...item,
      productId: undefined,
      partNumber: '',
      description: '',
      customerPartNumber: '',
      manufacturerId: undefined,
      manufacturerName: '',
      unitPrice: 0,
      commissionRate: '',
      commissionTotal: 0,
      sellPrice: 0,
      basePrice: 0,
    })));
    setHasChanges(true);
  }, []);

  const handleDuplicateConfirm = useCallback(async (newQuoteNumber: string) => {
    if (!quote.id) return;

    try {
      const result = await duplicateQuoteMutation.mutateAsync({
        sourceQuoteId: quote.id,
        newQuoteNumber,
      });
      setShowDuplicateModal(false);
      quoteToasts.duplicateSuccess(newQuoteNumber);
      window.location.href = `/quotes-v2/${result.id}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate quote';
      setSaveError(errorMessage);
      quoteToasts.duplicateError(errorMessage);
    }
  }, [quote.id, duplicateQuoteMutation]);

  const tabs: { key: TabType; label: string; count?: number; comingSoon?: boolean; disabled?: boolean; disabledReason?: string }[] = useMemo(() => [
    { key: 'lineItems', label: 'Line Items', count: lineItems.length },
    { key: 'files', label: 'Files', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'notes', label: 'Notes', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'tasks', label: 'Tasks', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'activity', label: 'Activity', comingSoon: true, disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'linkedObjects', label: 'Linked Objects', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'versions', label: 'Versions', comingSoon: true, disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'settings', label: 'Settings' },
  ], [lineItems.length, isNew]);

  // Loading state
  if (isLoading && !isNew) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading quote...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isNew) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load quote: {error.message}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Save Error Banner */}
      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-600">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <QuoteDetailHeaderV2
        quote={quote}
        onQuoteChange={handleQuoteChange}
        onBack={onBack}
        onSave={handleSave}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        isSaving={isSaving}
        hasChanges={hasChanges}
        isNew={isNew}
        lineItems={lineItems}
        settings={settings}
        onClearLineItemProducts={handleClearLineItemProducts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && !tab.comingSoon && setActiveTab(tab.key)}
            disabled={tab.disabled || tab.comingSoon}
            title={tab.disabled ? tab.disabledReason : tab.comingSoon ? 'Coming soon' : undefined}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab.disabled || tab.comingSoon
                ? 'border-transparent text-gray-300 cursor-not-allowed'
                : activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded text-xs ${tab.disabled ? 'bg-gray-50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
            {tab.comingSoon && (
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                SOON
              </span>
            )}
          </button>
        ))}
        {isNew && (
          <span className="ml-auto text-xs text-gray-400 italic pr-2">
            Some tabs will unlock after saving
          </span>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'lineItems' && (
          <LineItemsTabV2
            lineItems={lineItems}
            onLineItemsChange={handleLineItemsChange}
            onOpenColumnsModal={() => setShowColumnsModal(true)}
            onOpenAdditionalDetails={handleOpenAdditionalDetails}
            columnConfig={effectiveColumnConfig}
            quoteId={quote.id}
            settings={settings}
            soldToCustomerId={quote.soldToCustomerId}
            headerFactoryId={quote.factoryId}
            headerFactoryName={quote.factoryName}
          />
        )}

        {activeTab === 'files' && (
          <FilesTab
            entityId={quote.id}
            entityType="QUOTE"
          />
        )}

        {activeTab === 'notes' && (
          <NotesTabV2 quoteId={quote.id} />
        )}

        {activeTab === 'tasks' && (
          <TasksTabV2 quoteId={quote.id} />
        )}

        {activeTab === 'activity' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Activity feed is not yet available via API.
              </p>
            </div>
            <ActivityTabV2 activities={mockActivitiesV2} />
          </div>
        )}

        {activeTab === 'linkedObjects' && (
          <div className="h-full overflow-auto">
            <div className="px-6 py-4 pb-32">
              {quote.id ? (
                <ConnectedEntitiesSection
                  entityId={quote.id}
                  sourceEntityType="QUOTE"
                  title="Linked Objects"
                  showAddLinkButton={true}
                  refreshKey={linkedEntitiesRefreshKey}
                />
              ) : (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                  Save the quote first to view linked objects.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-700 text-sm">
                <span className="font-medium">Coming Soon:</span> Version history is not yet available via API.
              </p>
            </div>
            <VersionsTabV2
              versions={mockVersionsV2}
              currentVersion={quote.version}
              onRevertToVersion={handleRevertToVersion}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full overflow-auto p-6">
            <SettingsTabV2 settings={settings} onSettingsChange={setSettings} />
          </div>
        )}
      </div>

      {/* Modals */}
      <ColumnsConfigModalV2
        isOpen={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        columnConfig={columnConfig}
        onColumnConfigChange={setColumnConfig}
      />

      <AdditionalDetailsModalV2
        isOpen={showAdditionalDetailsModal}
        onClose={() => setShowAdditionalDetailsModal(false)}
        lineItem={selectedLineItem}
        onSave={handleSaveAdditionalDetails}
        settings={settings}
      />

      <DuplicateQuoteModal
        isOpen={showDuplicateModal}
        quoteNumber={quote.quoteNumber}
        isPending={duplicateQuoteMutation.isPending}
        onClose={() => setShowDuplicateModal(false)}
        onDuplicate={handleDuplicateConfirm}
      />
    </div>
  );
}

export default QuoteDetailV2Page;

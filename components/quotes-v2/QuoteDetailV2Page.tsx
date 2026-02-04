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
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
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
import { searchUsers, searchCustomers } from '../quotes/api/quotesApi';
import { useAutoPopulateReps, RepSplitRate } from '@/components/shared/hooks/useAutoPopulateReps';
import { quoteToasts } from '../lib/toast';
import { useFlowChat } from '@/contexts/FlowChatContext';
import { createLink, deleteLinkByEntities } from '../lib/graphql/entity-links';
import { useQuoteSettings } from '@/contexts/UserSettingsContext';
import { useUnsavedChangesGuard } from '@/components/shared/hooks/useUnsavedChangesGuard';
import { useEntityFilesCount } from '@/components/shared/hooks/useEntityFilesCount';

type TabType = 'lineItems' | 'notes' | 'tasks' | 'activity' | 'linkedObjects' | 'versions' | 'settings' | 'files';

interface QuoteDetailV2PageProps {
  quoteId: string | null;
  onBack: () => void;
  isNew?: boolean;
}

export function QuoteDetailV2Page({ quoteId, onBack, isNew = false }: QuoteDetailV2PageProps) {
  // API hooks
  const { data: apiQuote, isLoading, error, refetch } = useQuoteV2(quoteId);
  const { setFullEntityContext } = useFlowChat();
  const createQuoteMutation = useCreateQuoteV2();
  const updateQuoteMutation = useUpdateQuoteV2();
  const deleteQuoteMutation = useDeleteQuoteV2();
  const duplicateQuoteMutation = useDuplicateQuoteV2();

  // User settings hook for applying saved defaults on new quotes
  const { settings: savedQuoteSettings, isInitialized: settingsInitialized, saveSettings } = useQuoteSettings();

  // Quote state
  const [quote, setQuote] = useState<QuoteV2>(createEmptyQuoteV2());
  const [hasChanges, setHasChanges] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('lineItems');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemV2[]>([]);

  // Line item selection state (lifted from LineItemsTabV2 for sharing with header modal)
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<Set<string>>(new Set());

  // Current reps with names (for passing to line items when adding new ones)
  const [currentOutsideReps, setCurrentOutsideReps] = useState<RepSplitRate[]>([]);
  const [currentInsideReps, setCurrentInsideReps] = useState<RepSplitRate[]>([]);

  // Settings state - initialize with defaults, will be updated from API or user settings
  const [settings, setSettings] = useState<QuoteSettingsV2>(defaultQuoteSettingsV2);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('simple');

  // Column configuration - stores user preferences for column visibility
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(defaultColumnConfigV2);

  // Track if we've applied column settings to avoid re-applying
  const hasAppliedColumnSettings = React.useRef(false);

  // Debounce timer for saving column config to settings
  const saveColumnConfigTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Apply saved column configuration from settings (runs once when settings are initialized)
  useEffect(() => {
    if (settingsInitialized && !hasAppliedColumnSettings.current && savedQuoteSettings?.columnConfig) {
      setColumnConfig(savedQuoteSettings.columnConfig);
      hasAppliedColumnSettings.current = true;
    }
  }, [settingsInitialized, savedQuoteSettings]);

  // Compute effective column config: combines viewMode columns with user visibility preferences
  const effectiveColumnConfig = useMemo(() => {
    const viewColumns = getColumnsForView(viewMode);

    // Create a map of user's visibility preferences from columnConfig
    const visibilityMap = new Map<string, boolean>();
    columnConfig.forEach(col => {
      visibilityMap.set(col.key, col.visible);
    });

    // Build effective config: columns from viewMode with user's visibility preferences
    return viewColumns.map((key) => {
      // Use saved visibility if available, otherwise default to visible
      const savedVisible = visibilityMap.get(key);
      return {
        key,
        label: COLUMN_LABELS[key],
        group: key.startsWith('ovg') || key.startsWith('earn') || key === 'percentOver' ? 'Commission' as const :
               ['quantity', 'uom', 'divisor', 'unitPrice', 'sellTotal'].includes(key) ? 'Pricing' as const : 'Basic' as const,
        visible: savedVisible !== undefined ? savedVisible : true,
      };
    });
  }, [viewMode, columnConfig]);

  // Handle column config changes from the modal - update state and persist to settings
  const handleColumnConfigChange = useCallback((newConfig: ColumnConfig[]) => {
    setColumnConfig(newConfig);

    // Clear existing timeout
    if (saveColumnConfigTimeoutRef.current) {
      clearTimeout(saveColumnConfigTimeoutRef.current);
    }

    // Save to settings with debounce (500ms)
    saveColumnConfigTimeoutRef.current = setTimeout(async () => {
      try {
        const currentSettings = savedQuoteSettings || {
          columnConfig: defaultColumnConfigV2,
          specifyEndUserPerLine: false,
          outsideRepAtLineLevel: false,
          insideRepAtLineLevel: false,
          factoryPerLineItem: false,
          customerPartNumberSource: 'sold_to' as const,
        };
        await saveSettings({ ...currentSettings, columnConfig: newConfig }, 'my');
      } catch (error) {
        console.error('Failed to save column config to settings:', error);
      }
    }, 500);
  }, [savedQuoteSettings, saveSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveColumnConfigTimeoutRef.current) {
        clearTimeout(saveColumnConfigTimeoutRef.current);
      }
    };
  }, []);

  // Apply saved user settings when creating a new quote (for behavioral settings like specifyEndUserPerLine)
  useEffect(() => {
    if (isNew && settingsInitialized && savedQuoteSettings) {
      // Apply saved settings from user preferences
      setSettings(prev => ({
        ...prev,
        specifyEndUserPerLine: savedQuoteSettings.specifyEndUserPerLine ?? prev.specifyEndUserPerLine,
        outsideRepAtLineLevel: savedQuoteSettings.outsideRepAtLineLevel ?? prev.outsideRepAtLineLevel,
        insideRepAtLineLevel: savedQuoteSettings.insideRepAtLineLevel ?? prev.insideRepAtLineLevel,
        factoryPerLineItem: savedQuoteSettings.factoryPerLineItem ?? prev.factoryPerLineItem,
        customerPartNumberSource: savedQuoteSettings.customerPartNumberSource ?? prev.customerPartNumberSource,
      }));
    }
  }, [isNew, settingsInitialized, savedQuoteSettings]);


  // Modal states
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showAdditionalDetailsModal, setShowAdditionalDetailsModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<LineItemV2 | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Counter to trigger linked entities refresh after save
  const [linkedEntitiesRefreshKey, setLinkedEntitiesRefreshKey] = useState(0);

  // Files count for tab badge
  const { filesCount } = useEntityFilesCount({
    entityId: quote.id || null,
    entityType: 'QUOTE',
    enabled: !!quote.id && !isNew, // Only fetch when quote has an ID and not in create mode
  });

  // Transform API data to UI format when it loads
  useEffect(() => {
    if (apiQuote && !isNew) {
      const transformedQuote = transformQuoteToQuoteV2(apiQuote);
      setQuote(transformedQuote);

      // Store the original job ID for link management
      originalJobIdRef.current = transformedQuote.jobId;
      prevJobIdRef.current = transformedQuote.jobId;

      // Transform line items - factory names now come directly from detail.factory object
      if (apiQuote.details) {
        const transformedLineItems = apiQuote.details.map((detail) =>
          transformQuoteDetailToLineItemV2(detail, apiQuote.id)
        );
        setLineItems(transformedLineItems);

        // When factoryPerLineItem is false, populate header-level factory from first detail's factory
        // (all details should have the same factory when this setting is off)
        if (apiQuote.factoryPerLineItem === false && apiQuote.details.length > 0) {
          const firstDetailWithFactory = apiQuote.details.find(d => d.factory);
          if (firstDetailWithFactory?.factory) {
            setQuote(prev => ({
              ...prev,
              factoryId: firstDetailWithFactory.factory!.id,
              factoryName: firstDetailWithFactory.factory!.title || '',
            }));
          }
        }

        // When endUserPerLineItem is false, populate header-level end user from first line item
        // The endUserName is already extracted from the embedded endUser object in transformQuoteDetailToLineItemV2
        // (all line items should have the same end user when this setting is off)
        if (apiQuote.endUserPerLineItem === false && transformedLineItems.length > 0) {
          const firstLineItemWithEndUser = transformedLineItems.find(li => li.endUserId);
          if (firstLineItemWithEndUser?.endUserId) {
            setQuote(prev => ({
              ...prev,
              endUserId: firstLineItemWithEndUser.endUserId,
              endUserName: firstLineItemWithEndUser.endUserName || '',
            }));
          }
        }

        // DO NOT fetch CPN/tier pricing on initial load
        // The API already sends the correct prices - just use them as-is
        // The child component will determine pricing source tags for display only
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

  // Set full entity context for global chatbot (type, id, and quote number)
  useEffect(() => {
    if (quote?.quoteNumber && quoteId) {
      setFullEntityContext('quote', quoteId, quote.quoteNumber);
    }
    return () => {
      setFullEntityContext(null, null, null);
    };
  }, [quote?.quoteNumber, quoteId, setFullEntityContext]);

  // Initialize with one empty line item for new quotes
  useEffect(() => {
    if (isNew && lineItems.length === 0) {
      const defaultLineItem: LineItemV2 = {
        id: `li-${Date.now()}`,
        quoteId: '',
        partNumber: '',
        description: '',
        manufacturerName: '',
        manufacturerId: undefined,
        quantity: 1,
        uom: null,
        divisor: 1,
        unitPrice: 0,
        sellTotal: 0,
        total: 0,
        commissionPercent: 8, // Stored as whole percentage (8 for 8%)
        commission: 0,
        commissionTotal: 0,
        commissionDiscountPercent: 0,
        commissionDiscountAmount: 0,
        lineDiscountPercent: 0,
        lineDiscountAmount: 0,
      };
      setLineItems([defaultLineItem]);
    }
  }, [isNew]);

  // Track previous jobId to manage quote-job links
  const prevJobIdRef = React.useRef<string | undefined>(undefined);
  // Track if job link is being managed to prevent duplicate operations
  const isManagingJobLinkRef = React.useRef<boolean>(false);
  // Track the original job ID from API for editing scenarios
  const originalJobIdRef = React.useRef<string | undefined>(undefined);

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

  // Live update handler - updates both lineItems AND selectedLineItem without closing modal
  // When line discount changes, commission is recalculated based on discounted sell total
  // The modal sends the calculated commission value - use it directly
  // Field naming:
  //   - commission: total commission on (discounted) sell total, BEFORE commission discount
  //   - commissionTotal: commission AFTER commission discount (= commission - commissionDiscountAmount)
  const handleLiveUpdateAdditionalDetails = useCallback((updates: Partial<LineItemV2>) => {
    if (selectedLineItem) {
      // Update the selected line item so the modal stays in sync
      setSelectedLineItem((prev) => {
        if (!prev) return prev;
        const updatedItem = { ...prev, ...updates };

        // If commission was sent from modal (which calculates it on discounted total), use it
        // The modal sends total commission before commission discount as 'commission'
        if ('commission' in updates && updates.commission !== undefined) {
          // commission field = total commission before commission discount
          updatedItem.commission = updates.commission;
          // commissionTotal = commission after commission discount
          const commDiscountAmt = updatedItem.commissionDiscountAmount || 0;
          updatedItem.commissionTotal = updates.commission - commDiscountAmt;
        }

        return updatedItem;
      });
      // Update the line items array
      setLineItems((prev) =>
        prev.map((li) => {
          if (li.id !== selectedLineItem.id) return li;
          const updatedItem = { ...li, ...updates };

          // If commission was sent from modal (which calculates it on discounted total), use it
          // The modal sends total commission before commission discount as 'commission'
          if ('commission' in updates && updates.commission !== undefined) {
            // commission field = total commission before commission discount
            updatedItem.commission = updates.commission;
            // commissionTotal = commission after commission discount
            const commDiscountAmt = updatedItem.commissionDiscountAmount || 0;
            updatedItem.commissionTotal = updates.commission - commDiscountAmt;
          }

          return updatedItem;
        })
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
      // Pass header-level endUserId for when specifyEndUserPerLine is false
      details: lineItems.map((li, index) => ({
        ...transformLineItemV2ToDetailInput(
          li,
          quote.insideReps,
          quote.outsideReps,
          {
            insideRepAtLineLevel: settings.insideRepAtLineLevel,
            outsideRepAtLineLevel: settings.outsideRepAtLineLevel,
            factoryPerLineItem: settings.factoryPerLineItem,
            specifyEndUserPerLine: settings.specifyEndUserPerLine,
          },
          quote.factoryId, // Pass header-level factory for when factoryPerLineItem is false
          quote.endUserId // Pass header-level endUserId for when specifyEndUserPerLine is false
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

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!quote.quoteNumber || !quote.soldToCustomerId) {
      setSaveError('Quote Number and Sold To Customer are required');
      quoteToasts.updateError('Quote Number and Sold To Customer are required');
      return false;
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
        return false;
      }
    } else {
      // When toggle is ON, EACH line item MUST have End User
      if (!lineItems || lineItems.length === 0) {
        console.error('❌ VALIDATION FAILED: No line items');
        setSaveError('Please add at least one line item.');
        quoteToasts.updateError('Please add at least one line item.');
        return false;
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
        return false;
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
        // Refetch quote data to get fresh UUIDs for any newly created line items
        await refetch();
        // Trigger refresh of linked entities section
        setLinkedEntitiesRefreshKey(prev => prev + 1);
        quoteToasts.updateSuccess(quote.quoteNumber);
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save quote';
      setSaveError(errorMessage);
      if (isNew || !quote.id) {
        quoteToasts.createError(errorMessage);
      } else {
        quoteToasts.updateError(errorMessage);
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [quote, isNew, buildQuoteInput, createQuoteMutation, updateQuoteMutation, manageJobLink, refetch, lineItems, settings.specifyEndUserPerLine]);

  // Store save handler in ref for unsaved changes guard
  const saveHandlerRef = React.useRef<(() => Promise<boolean>) | null>(null);
  saveHandlerRef.current = handleSave;

  // Unsaved changes guard - tracks quote changes and blocks navigation
  useUnsavedChangesGuard({
    entityType: 'Quote',
    entityId: isNew ? null : quote.id || null,
    entityName: quote.quoteNumber || null,
    hasChanges,
    onSave: handleSave,
  });

  const handleDelete = useCallback(() => {
    if (!quote.id) return;
    setShowDeleteModal(true);
  }, [quote.id]);

  const handleConfirmDelete = useCallback(async () => {
    if (!quote.id) return;

    setIsDeleting(true);
    try {
      await deleteQuoteMutation.mutateAsync(quote.id);
      quoteToasts.deleteSuccess(quote.quoteNumber);
      onBack();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quote';
      setSaveError(errorMessage);
      quoteToasts.deleteError(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
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

  // Get the hook for fetching factory reps (used for per-line-item factory mode)
  const { fetchInsideRepsFromFactory } = useAutoPopulateReps();

  // Handler to auto-populate outside reps for all line items
  const handleAutoPopulateOutsideRepsToLineItems = useCallback((reps: RepSplitRate[]) => {
    // Always store the current reps for new line items to inherit
    setCurrentOutsideReps(reps);

    if (lineItems.length === 0) return;

    // Convert RepSplitRate[] to the format expected by line items
    // Include userName so the modal can display the name without looking it up
    const outsideSplitRates = reps.map((rep, idx) => ({
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
      userId: rep.userId,
      userName: rep.userName,
      splitRate: rep.splitRate,
      position: idx + 1,
    }));

    // Update all line items with the same outside reps
    setLineItems(prev => prev.map(item => ({
      ...item,
      outsideSplitRates,
    })));
    setHasChanges(true);
  }, [lineItems.length]);

  // Handler to auto-populate inside reps for all line items (when factory is at header level)
  const handleAutoPopulateInsideRepsToLineItems = useCallback((reps: RepSplitRate[]) => {
    // Always store the current reps for new line items to inherit
    setCurrentInsideReps(reps);

    if (lineItems.length === 0) return;

    // Convert RepSplitRate[] to the format expected by line items
    // Include userName so the modal can display the name without looking it up
    const insideSplitRates = reps.map((rep, idx) => ({
      id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
      userId: rep.userId,
      userName: rep.userName,
      splitRate: rep.splitRate,
      position: idx + 1,
    }));

    // Update all line items with the same inside reps
    setLineItems(prev => prev.map(item => ({
      ...item,
      insideSplitRates,
    })));
    setHasChanges(true);
  }, [lineItems.length]);

  // Handler to auto-populate inside reps per line item based on each line's manufacturer
  // This is for when factoryPerLineItem is enabled - each line item gets reps from its own manufacturer
  const handleAutoPopulateInsideRepsPerLineItemFactory = useCallback(async () => {
    if (lineItems.length === 0) return;

    // Process each line item that has a manufacturer
    const updatedLineItems = await Promise.all(
      lineItems.map(async (item) => {
        if (!item.manufacturerId) {
          return item; // No manufacturer, keep as is
        }

        try {
          const reps = await fetchInsideRepsFromFactory(item.manufacturerId);
          if (reps.length === 0) {
            return item; // No reps found, keep as is
          }

          // Convert to line item format - include userName
          const insideSplitRates = reps.map((rep, idx) => ({
            id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
            userId: rep.userId,
            userName: rep.userName,
            splitRate: rep.splitRate,
            position: idx + 1,
          }));

          return {
            ...item,
            insideSplitRates,
          };
        } catch (error) {
          console.error(`Failed to fetch reps for manufacturer ${item.manufacturerId}:`, error);
          return item; // On error, keep as is
        }
      })
    );

    setLineItems(updatedLineItems);
    setHasChanges(true);
  }, [lineItems, fetchInsideRepsFromFactory]);

  // Get the hook for fetching customer reps (for settings toggle)
  const { fetchOutsideRepsFromCustomer } = useAutoPopulateReps();

  // Handler for settings changes with rep redistribution
  const handleSettingsChange = useCallback(async (newSettings: QuoteSettingsV2) => {
    const oldSettings = settings;
    setSettings(newSettings);
    setHasChanges(true);

    // Handle outsideRepAtLineLevel toggle
    if (oldSettings.outsideRepAtLineLevel !== newSettings.outsideRepAtLineLevel) {
      if (newSettings.outsideRepAtLineLevel) {
        // Switching to per-line-item mode: ALWAYS fetch from END USER to get proper names
        if (quote.endUserId) {
          const reps = await fetchOutsideRepsFromCustomer(quote.endUserId);
          if (reps.length > 0) {
            // Store for new line items to inherit
            setCurrentOutsideReps(reps);
            const outsideSplitRates = reps.map((rep, idx) => ({
              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
              userId: rep.userId,
              userName: rep.userName,
              splitRate: rep.splitRate,
              position: idx + 1,
            }));
            setLineItems(prev => prev.map(item => ({ ...item, outsideSplitRates })));
          }
        }
      } else {
        // Switching to header mode: clear line item reps (header will be populated from end user when selected)
        setLineItems(prev => prev.map(item => ({ ...item, outsideSplitRates: [] })));
      }
    }

    // Handle insideRepAtLineLevel toggle
    if (oldSettings.insideRepAtLineLevel !== newSettings.insideRepAtLineLevel) {
      if (newSettings.insideRepAtLineLevel) {
        // Switching to per-line-item mode
        if (newSettings.factoryPerLineItem) {
          // Factory is per line item - each line item gets its own manufacturer's reps
          const updatedLineItems = await Promise.all(
            lineItems.map(async (item) => {
              if (!item.manufacturerId) return item;
              try {
                const reps = await fetchInsideRepsFromFactory(item.manufacturerId);
                if (reps.length === 0) return item;
                const insideSplitRates = reps.map((rep, idx) => ({
                  id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
                  userId: rep.userId,
                  userName: rep.userName,
                  splitRate: rep.splitRate,
                  position: idx + 1,
                }));
                return { ...item, insideSplitRates };
              } catch {
                return item;
              }
            })
          );
          setLineItems(updatedLineItems);
        } else if (quote.factoryId) {
          // Factory is at header level - ALWAYS fetch from factory to get proper names
          const reps = await fetchInsideRepsFromFactory(quote.factoryId);
          if (reps.length > 0) {
            // Store for new line items to inherit
            setCurrentInsideReps(reps);
            const insideSplitRates = reps.map((rep, idx) => ({
              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
              userId: rep.userId,
              userName: rep.userName,
              splitRate: rep.splitRate,
              position: idx + 1,
            }));
            setLineItems(prev => prev.map(item => ({ ...item, insideSplitRates })));
          }
        }
      } else {
        // Switching to header mode: clear line item reps
        setLineItems(prev => prev.map(item => ({ ...item, insideSplitRates: [] })));
      }
    }

    // Handle factoryPerLineItem toggle when insideRepAtLineLevel is already on
    if (oldSettings.factoryPerLineItem !== newSettings.factoryPerLineItem && newSettings.insideRepAtLineLevel) {
      if (newSettings.factoryPerLineItem) {
        // Switching to per-line-item factory mode - repopulate each line item from its manufacturer
        const updatedLineItems = await Promise.all(
          lineItems.map(async (item) => {
            if (!item.manufacturerId) return item;
            try {
              const reps = await fetchInsideRepsFromFactory(item.manufacturerId);
              if (reps.length === 0) return item;
              const insideSplitRates = reps.map((rep, idx) => ({
                id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
                userId: rep.userId,
                userName: rep.userName,
                splitRate: rep.splitRate,
                position: idx + 1,
              }));
              return { ...item, insideSplitRates };
            } catch {
              return item;
            }
          })
        );
        setLineItems(updatedLineItems);
      } else if (quote.factoryId) {
        // Switching to header-level factory - populate all line items with header factory's reps
        const reps = await fetchInsideRepsFromFactory(quote.factoryId);
        if (reps.length > 0) {
          // Store for new line items to inherit
          setCurrentInsideReps(reps);
          const insideSplitRates = reps.map((rep, idx) => ({
            id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
            userId: rep.userId,
            userName: rep.userName,
            splitRate: rep.splitRate,
            position: idx + 1,
          }));
          setLineItems(prev => prev.map(item => ({ ...item, insideSplitRates })));
        }
      }
    }
  }, [settings, quote.endUserId, quote.factoryId, lineItems, fetchOutsideRepsFromCustomer, fetchInsideRepsFromFactory]);

  const tabs: { key: TabType; label: string; count?: number; comingSoon?: boolean; disabled?: boolean; disabledReason?: string }[] = useMemo(() => [
    { key: 'lineItems', label: 'Line Items', count: lineItems.length },
    { key: 'files', label: 'Files', disabled: isNew, disabledReason: 'Save quote first', count: filesCount },
    { key: 'notes', label: 'Notes', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'tasks', label: 'Tasks', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'activity', label: 'Activity', comingSoon: true, disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'linkedObjects', label: 'Linked Objects', disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'versions', label: 'Versions', comingSoon: true, disabled: isNew, disabledReason: 'Save quote first' },
    { key: 'settings', label: 'Settings' },
  ], [lineItems.length, isNew, filesCount]);

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
    <div className="h-full overflow-auto bg-white">
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
        selectedLineItemIds={selectedLineItemIds}
        settings={settings}
        onClearLineItemProducts={handleClearLineItemProducts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAutoPopulateOutsideRepsToLineItems={handleAutoPopulateOutsideRepsToLineItems}
        onAutoPopulateInsideRepsToLineItems={handleAutoPopulateInsideRepsToLineItems}
        onAutoPopulateInsideRepsPerLineItemFactory={handleAutoPopulateInsideRepsPerLineItemFactory}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-gray-200">
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
      <div>
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
            currentOutsideReps={currentOutsideReps}
            currentInsideReps={currentInsideReps}
            viewMode={viewMode}
            selectedItems={selectedLineItemIds}
            onSelectedItemsChange={setSelectedLineItemIds}
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
            <SettingsTabV2 settings={settings} onSettingsChange={handleSettingsChange} />
          </div>
        )}
      </div>

      {/* Modals */}
      <ColumnsConfigModalV2
        isOpen={showColumnsModal}
        onClose={() => setShowColumnsModal(false)}
        columnConfig={effectiveColumnConfig}
        onColumnConfigChange={handleColumnConfigChange}
      />

      <AdditionalDetailsModalV2
        isOpen={showAdditionalDetailsModal}
        onClose={() => setShowAdditionalDetailsModal(false)}
        lineItem={selectedLineItem}
        onSave={handleSaveAdditionalDetails}
        onLiveUpdate={handleLiveUpdateAdditionalDetails}
        settings={settings}
      />

      <DuplicateQuoteModal
        isOpen={showDuplicateModal}
        quoteNumber={quote.quoteNumber}
        isPending={duplicateQuoteMutation.isPending}
        onClose={() => setShowDuplicateModal(false)}
        onDuplicate={handleDuplicateConfirm}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Quote?"
        message="Are you sure you want to delete quote"
        itemName={quote.quoteNumber}
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

export default QuoteDetailV2Page;

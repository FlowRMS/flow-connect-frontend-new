/**
 * useStatementDetailState Hook
 * Main state management hook for statement detail/create/edit
 * Following the pattern from orders/quotes
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStatementById,
  createStatement,
  updateStatement,
  type Statement,
  type StatementDetail,
  type StatementInput,
  type StatementDetailInput,
} from '../../api/statementsApi';

// Column keys for visibility
export type ColumnKey =
  | 'lineNumber'
  | 'partNumber'
  | 'custPartNumber'
  | 'description'
  | 'soldTo'
  | 'endUser'
  | 'quantity'
  | 'uom'
  | 'divisor'
  | 'unitPrice'
  | 'extendedPrice'
  | 'commissionRate'
  | 'commission'
  | 'outsideRep'
  | 'order'
  | 'invoice'
  | 'note';

export type ViewMode = 'simple' | 'detailed';
export type TabType = 'line-items' | 'notes' | 'tasks' | 'activity' | 'files' | 'settings';

// Commission split rep interface
export interface CommissionSplitRep {
  id?: string;
  tempId: string;
  userId: string;
  userName: string;
  splitRate: number;
  position: number;
}

// Local line item type for editing - includes all fields from StatementDetail
export interface LocalLineItem {
  id: string;
  tempId: string;
  itemNumber: number;
  // Product fields
  productId?: string;
  partNumber: string;
  custPartNumber?: string; // CPN - Customer Part Number
  description: string;
  productNameAdhoc?: string;
  productDescriptionAdhoc?: string;
  // Customer fields
  soldToCustomerId?: string;
  soldToCustomerName?: string;
  endUserId?: string;
  endUserName?: string;
  // Quantity and pricing
  quantity: number;
  uom: string;
  uomId?: string;
  divisor: number;
  unitPrice: number;
  extendedPrice: number;
  // Commission fields
  commissionRate: number;
  commission: number;
  commissionDiscountRate?: number;
  commissionDiscountAmount?: number;
  // Line discount fields
  discountRate?: number;
  discountAmount?: number;
  // Linked entities
  orderId?: string;
  orderNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  // Additional details
  note?: string;
  leadTime?: string;
  // Split rates
  outsideSplitRates?: CommissionSplitRep[];
  insideSplitRates?: CommissionSplitRep[];
  // Pricing source tracking
  pricingSource?: 'product' | 'cpn' | 'manual' | string;
}

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = [
  'lineNumber',
  'partNumber',
  'custPartNumber',
  'description',
  'soldTo',
  'endUser',
  'quantity',
  'uom',
  'unitPrice',
  'extendedPrice',
  'commissionRate',
  'commission',
  'outsideRep',
  'order',
  'invoice',
];

interface UseStatementDetailStateProps {
  statementId: string;
}

// Generate unique temp ID
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Create empty line item
const createEmptyLineItem = (itemNumber: number): LocalLineItem => ({
  id: '',
  tempId: generateTempId(),
  itemNumber,
  partNumber: '',
  custPartNumber: '',
  description: '',
  quantity: 1,
  uom: '',
  divisor: 1,
  unitPrice: 0,
  extendedPrice: 0,
  commissionRate: 0,
  commission: 0,
  outsideSplitRates: [],
  insideSplitRates: [],
  pricingSource: 'product',
});

// Convert API statement detail to local line item
// existingTempId can be passed to preserve the tempId when updating from API response
const convertToLocalLineItem = (detail: StatementDetail, index: number, existingTempId?: string): LocalLineItem => {
  const quantity = parseFloat(detail.quantity || '0') || 0;
  const unitPrice = parseFloat(detail.unitPrice || '0') || 0;
  const divisor = parseFloat(detail.divisionFactor || '1') || 1;
  const commissionRate = parseFloat(detail.commissionRate || '0') || 0;
  const commissionDiscountRate = parseFloat(detail.commissionDiscountRate || '0') || 0;
  const discountRate = parseFloat(detail.discountRate || '0') || 0;

  // Calculate gross extended price
  const grossExtendedPrice = (quantity * unitPrice) / divisor;

  // Apply line discount to get net extended price
  const discountAmount = grossExtendedPrice * (discountRate / 100);
  const extendedPrice = grossExtendedPrice - discountAmount;

  // Calculate gross commission (based on discounted extended price)
  const grossCommission = extendedPrice * (commissionRate / 100);

  // Apply commission discount to get net commission
  const commissionDiscountAmount = grossCommission * (commissionDiscountRate / 100);
  const commission = grossCommission - commissionDiscountAmount;

  return {
    id: detail.id,
    tempId: existingTempId || generateTempId(),
    itemNumber: detail.itemNumber || index + 1,
    // Product fields
    productId: detail.productId,
    partNumber: detail.product?.factoryPartNumber || detail.productNameAdhoc || '',
    custPartNumber: '', // Will be populated from CPN lookup
    description: detail.product?.description || detail.productDescriptionAdhoc || '',
    productNameAdhoc: detail.productNameAdhoc,
    productDescriptionAdhoc: detail.productDescriptionAdhoc,
    // Customer fields
    soldToCustomerId: detail.soldToCustomerId,
    soldToCustomerName: detail.soldToCustomer?.companyName,
    endUserId: detail.endUserId,
    endUserName: detail.endUser?.companyName,
    // Quantity and pricing
    quantity,
    uom: detail.uom?.title || '',
    uomId: detail.uomId,
    divisor,
    unitPrice,
    extendedPrice, // Net extended price (after line discount)
    // Commission fields
    commissionRate,
    commission, // Net commission (after commission discount)
    commissionDiscountRate,
    commissionDiscountAmount,
    // Line discount fields
    discountRate,
    discountAmount,
    // Linked entities
    orderId: detail.orderId,
    orderNumber: detail.order?.orderNumber,
    invoiceId: detail.invoiceId,
    invoiceNumber: detail.invoice?.invoiceNumber,
    // Additional details
    note: detail.note,
    leadTime: detail.leadTime,
    // Split rates
    outsideSplitRates: (detail.outsideSplitRates || []).map((sr) => ({
      id: sr.id,
      tempId: generateTempId(),
      userId: sr.userId,
      userName: sr.user?.fullName || sr.user?.firstName || '',
      splitRate: parseFloat(sr.splitRate) || 0,
      position: sr.position,
    })),
    insideSplitRates: [],
    pricingSource: 'product',
  };
};

export function useStatementDetailState({ statementId }: UseStatementDetailStateProps) {
  const queryClient = useQueryClient();
  const isCreateMode = statementId === 'new';

  // Core data
  const [statementNumber, setStatementNumber] = useState('');
  const [entityDate, setEntityDate] = useState(new Date().toISOString().split('T')[0]);
  const [factoryId, setFactoryId] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [lineItems, setLineItems] = useState<LocalLineItem[]>([createEmptyLineItem(1)]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('line-items');
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [showHeaderFields, setShowHeaderFields] = useState(true);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(DEFAULT_VISIBLE_COLUMNS));
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Dropdown states
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showColumnsModal, setShowColumnsModal] = useState(false);

  // Track if we've done the initial population from the fetched statement
  const [isInitialized, setIsInitialized] = useState(false);

  // On mount, invalidate the cache for this statement to ensure fresh data
  // This runs only once per component mount (page load/navigation)
  useEffect(() => {
    if (!isCreateMode && statementId) {
      queryClient.invalidateQueries({ queryKey: ['statement', statementId] });
    }
  }, [queryClient, isCreateMode, statementId]);

  // Fetch statement for edit mode
  const {
    data: statement,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['statement', statementId],
    queryFn: () => fetchStatementById(statementId),
    enabled: !isCreateMode && !!statementId,
    // After initial load, these prevent automatic refetching so local state stays as source of truth
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Populate form from fetched statement - ONLY ONCE on initial load
  useEffect(() => {
    if (statement && !isCreateMode && !isInitialized) {
      setStatementNumber(statement.statementNumber || '');
      setEntityDate(statement.entityDate || new Date().toISOString().split('T')[0]);
      setFactoryId(statement.factoryId || '');
      setFactoryName(statement.factory?.title || '');

      if (statement.details && statement.details.length > 0) {
        setLineItems(statement.details.map((d, i) => convertToLocalLineItem(d, i)));
      } else {
        setLineItems([createEmptyLineItem(1)]);
      }

      setHasChanges(false);
      setIsInitialized(true);
    }
  }, [statement, isCreateMode, isInitialized]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: StatementInput) => createStatement(input),
    onSuccess: (data) => {
      // After create, we need to update local items with their new database IDs
      // BUT keep all local state (don't overwrite with API response values)
      if (data.details && data.details.length > 0) {
        setLineItems((prevItems) => {
          return prevItems.map((localItem, i) => {
            // Find matching API item by itemNumber
            const apiItem = data.details!.find(d => d.itemNumber === localItem.itemNumber) || data.details![i];
            if (apiItem) {
              // Only update the database ID - keep all local state intact
              return {
                ...localItem,
                id: apiItem.id,
                // Update split rate IDs from API response
                outsideSplitRates: localItem.outsideSplitRates?.map((sr, idx) => {
                  const apiSr = apiItem.outsideSplitRates?.[idx];
                  return apiSr ? { ...sr, id: apiSr.id } : sr;
                }),
                insideSplitRates: localItem.insideSplitRates?.map((sr, idx) => {
                  const apiSr = apiItem.outsideSplitRates?.[idx]; // Note: API doesn't have insideSplitRates yet
                  return apiSr ? { ...sr, id: apiSr.id } : sr;
                }),
              };
            }
            return localItem;
          });
        });
      }
      // Update statement-level fields that may be auto-generated
      if (data.statementNumber && !statementNumber) setStatementNumber(data.statementNumber);

      queryClient.invalidateQueries({ queryKey: ['statements'] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: StatementInput) => updateStatement(input),
    onSuccess: (data) => {
      // After update, sync database IDs for any new items
      // BUT keep all local state (don't overwrite with API response values)
      if (data.details && data.details.length > 0) {
        setLineItems((prevItems) => {
          return prevItems.map((localItem, i) => {
            // Find matching API item by ID or itemNumber
            const apiItem = data.details!.find(d => d.id === localItem.id || d.itemNumber === localItem.itemNumber) || data.details![i];
            if (apiItem) {
              // Only update the database ID for new items - keep all local state intact
              return {
                ...localItem,
                id: apiItem.id || localItem.id,
                // Update split rate IDs from API response
                outsideSplitRates: localItem.outsideSplitRates?.map((sr, idx) => {
                  const apiSr = apiItem.outsideSplitRates?.find(a => a.userId === sr.userId) || apiItem.outsideSplitRates?.[idx];
                  return apiSr ? { ...sr, id: apiSr.id } : sr;
                }),
                insideSplitRates: localItem.insideSplitRates?.map((sr, idx) => {
                  // API doesn't have insideSplitRates yet, keep local
                  return sr;
                }),
              };
            }
            return localItem;
          });
        });
      }

      // DO NOT update the query cache with API response data - this would overwrite local state
      // The local state is the source of truth during editing
      // Only invalidate the list query so it refreshes on next visit
      queryClient.invalidateQueries({ queryKey: ['statements'] });
    },
  });

  // Toggle header fields visibility
  const toggleHeaderFields = useCallback(() => {
    setShowHeaderFields((prev) => !prev);
  }, []);

  // Line item operations
  const addLineItem = useCallback(() => {
    setLineItems((prev) => {
      const newItem = createEmptyLineItem(prev.length + 1);
      return [...prev, newItem];
    });
    setHasChanges(true);
  }, []);

  // Internal function to update a line item with optional hasChanges flag
  const updateLineItemInternal = useCallback((tempId: string, updates: Partial<LocalLineItem>, markAsChanged: boolean = true) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.tempId === tempId) {
          const updated = { ...item, ...updates };
          // Recalculate derived fields
          const quantity = updated.quantity || 0;
          const unitPrice = updated.unitPrice || 0;
          const divisor = updated.divisor || 1;

          // Calculate gross extended price
          const grossExtendedPrice = (quantity * unitPrice) / divisor;

          // Apply line discount if any
          const discountRate = updated.discountRate || 0;
          const discountAmount = grossExtendedPrice * (discountRate / 100);
          updated.discountAmount = discountAmount;
          updated.extendedPrice = grossExtendedPrice - discountAmount;

          // Calculate gross commission (based on discounted extended price)
          const grossCommission = updated.extendedPrice * ((updated.commissionRate || 0) / 100);

          // Apply commission discount if any
          const commissionDiscountRate = updated.commissionDiscountRate || 0;
          const commissionDiscountAmount = grossCommission * (commissionDiscountRate / 100);
          updated.commissionDiscountAmount = commissionDiscountAmount;
          updated.commission = grossCommission - commissionDiscountAmount;

          return updated;
        }
        return item;
      })
    );
    if (markAsChanged) {
      setHasChanges(true);
    }
  }, []);

  // Public function - always marks changes
  const updateLineItem = useCallback((tempId: string, updates: Partial<LocalLineItem>) => {
    updateLineItemInternal(tempId, updates, true);
  }, [updateLineItemInternal]);

  // Silent update - for populating derived data (like CPN) without marking as changed
  const updateLineItemSilent = useCallback((tempId: string, updates: Partial<LocalLineItem>) => {
    updateLineItemInternal(tempId, updates, false);
  }, [updateLineItemInternal]);

  const removeLineItem = useCallback((tempId: string) => {
    setLineItems((prev) => {
      const filtered = prev.filter((item) => item.tempId !== tempId);
      // Renumber items
      return filtered.map((item, index) => ({
        ...item,
        itemNumber: index + 1,
      }));
    });
    setSelectedLineItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(tempId);
      return newSet;
    });
    setHasChanges(true);
  }, []);

  const updateAllLineItems = useCallback((items: LocalLineItem[]) => {
    setLineItems(items);
    setHasChanges(true);
  }, []);

  // Selection operations
  const toggleLineItemSelection = useCallback((tempId: string) => {
    setSelectedLineItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tempId)) {
        newSet.delete(tempId);
      } else {
        newSet.add(tempId);
      }
      return newSet;
    });
  }, []);

  const selectAllLineItems = useCallback(() => {
    if (selectedLineItems.size === lineItems.length) {
      setSelectedLineItems(new Set());
    } else {
      setSelectedLineItems(new Set(lineItems.map((item) => item.tempId)));
    }
  }, [lineItems, selectedLineItems.size]);

  const clearLineItemSelection = useCallback(() => {
    setSelectedLineItems(new Set());
  }, []);

  // Column operations
  const toggleColumn = useCallback((column: ColumnKey) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(column)) {
        newSet.delete(column);
      } else {
        newSet.add(column);
      }
      return newSet;
    });
  }, []);

  const openColumnsModal = useCallback(() => {
    setShowColumnsModal(true);
  }, []);

  const closeColumnsModal = useCallback(() => {
    setShowColumnsModal(false);
  }, []);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.extendedPrice || 0), 0);
    const commission = lineItems.reduce((sum, item) => sum + (item.commission || 0), 0);
    return { subtotal, total: subtotal, commission };
  }, [lineItems]);

  // Build save input
  const buildSaveInput = useCallback((): StatementInput => {
    const isValidUUID = (id: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const details: StatementDetailInput[] = lineItems
      .filter((item) => item.partNumber || item.productId) // Only include items with data
      .map((item) => {
        const detail: StatementDetailInput = {
          itemNumber: item.itemNumber,
          quantity: String(item.quantity || 0),
          unitPrice: String(item.unitPrice || 0),
          uomId: item.uomId || undefined,
          soldToCustomerId: item.soldToCustomerId || undefined,
          endUserId: item.endUserId || undefined,
          productId: item.productId || undefined,
          productNameAdhoc: !item.productId ? item.partNumber : undefined,
          productDescriptionAdhoc: !item.productId ? item.description : undefined,
          orderId: item.orderId || undefined,
          invoiceId: item.invoiceId || undefined,
          note: item.note || undefined,
          leadTime: item.leadTime || undefined,
          divisionFactor: String(item.divisor || 1),
          commissionRate: String(item.commissionRate || 0),
          commissionDiscountRate: item.commissionDiscountRate ? String(item.commissionDiscountRate) : undefined,
          discountRate: item.discountRate ? String(item.discountRate) : undefined,
          outsideSplitRates: (item.outsideSplitRates || []).map((sr, idx) => ({
            ...(sr.id && isValidUUID(sr.id) ? { id: sr.id } : {}),
            userId: sr.userId,
            splitRate: String(sr.splitRate),
            position: sr.position ?? idx,
          })),
        };

        // Include ID for existing items
        if (item.id && isValidUUID(item.id)) {
          detail.id = item.id;
        }

        return detail;
      });

    return {
      ...(statementId !== 'new' && isValidUUID(statementId) ? { id: statementId } : {}),
      statementNumber: statementNumber || `STM-${Date.now()}`,
      entityDate,
      factoryId,
      creationType: 'MANUAL',
      details,
    };
  }, [statementId, statementNumber, entityDate, factoryId, lineItems]);

  // Update header fields
  const updateStatementHeader = useCallback(
    (updates: {
      statementNumber?: string;
      entityDate?: string;
      factoryId?: string;
      factoryName?: string;
    }) => {
      if (updates.statementNumber !== undefined) setStatementNumber(updates.statementNumber);
      if (updates.entityDate !== undefined) setEntityDate(updates.entityDate);
      if (updates.factoryId !== undefined) setFactoryId(updates.factoryId);
      if (updates.factoryName !== undefined) setFactoryName(updates.factoryName);
      setHasChanges(true);
    },
    []
  );

  // Reset changes after save
  const resetChanges = useCallback(() => {
    setHasChanges(false);
  }, []);

  return {
    // Mode
    isCreateMode,
    isLoading,
    error,
    refetch,

    // Statement data
    statement,
    statementNumber,
    entityDate,
    factoryId,
    factoryName,
    lineItems,
    totals,

    // Update functions
    updateStatementHeader,
    addLineItem,
    updateLineItem,
    updateLineItemSilent,
    removeLineItem,
    updateAllLineItems,

    // UI state
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    showHeaderFields,
    toggleHeaderFields,
    visibleColumns,
    setVisibleColumns,
    toggleColumn,

    // Selection
    selectedLineItems,
    toggleLineItemSelection,
    selectAllLineItems,
    clearLineItemSelection,

    // Dropdowns/Modals
    showActionsDropdown,
    setShowActionsDropdown,
    showColumnsModal,
    openColumnsModal,
    closeColumnsModal,

    // Changes & Save
    hasChanges,
    resetChanges,
    buildSaveInput,
    createMutation,
    updateMutation,
  };
}

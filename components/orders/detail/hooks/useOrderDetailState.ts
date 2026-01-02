/**
 * useOrderDetailState Hook
 * Main state management hook for order detail
 * Integrates all sub-hooks and manages overall state
 * Supports both create mode (orderId="new") and edit mode
 */

import React, { useState, useMemo, useEffect } from 'react';
import type { Order, OrderLineItem } from '@/lib/types/rms';
import type { FulfillmentOrder } from '@/lib/types/warehouse';
import type { TabType, LineItemAcknowledgement, LineItemCredit, ColumnKey } from '../types';
import { mockFulfillmentOrders } from '@/lib/data/warehouse-mock';
import { useOrder, useUpdateOrder, useCreateOrder, searchUsers, searchFactories, searchCustomers, getProductCpnByCustomer, type Order as ApiOrder, type OrderDetail } from '../../api';
import { DEFAULT_ACTIVE_TAB } from '../config/tabsConfig';
import { useOrderHeader } from './useOrderHeader';
import { useLineItemsTable } from './useLineItemsTable';
import { useLineItemBulkActions } from './useLineItemBulkActions';
import { toggleAllLineItems } from '../utils';

interface UseOrderDetailStateProps {
  orderId: string;
}

/**
 * Create an empty order for create mode
 */
function createEmptyOrder(): Order {
  return {
    id: '',
    orderNumber: '',
    factorySoNumber: '',
    manufacturerId: '',
    manufacturerName: '',
    customerId: '',
    customerName: '',
    jobId: undefined,
    jobName: undefined,
    status: 'draft',
    fulfillmentStatus: 'not_started',
    billingStatus: 'not_invoiced',
    commissionStatus: 'pending',
    orderDate: new Date().toISOString().split('T')[0],
    entryDate: new Date().toISOString().split('T')[0],
    shipDate: undefined,
    dueDate: undefined,
    requestedShipDate: undefined,
    actualShipDate: undefined,
    quoteId: undefined,
    lineItems: [],
    subtotal: 0,
    freight: 0,
    total: 0,
    totalCommission: 0,
    insideRepId: undefined,
    insideRepName: '',
    splitRates: [],
    createdAt: new Date().toISOString(),
    createdBy: '',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Transform API Order detail to UI Order format
 */
function transformApiOrderToUiOrder(apiOrder: ApiOrder): Order {
  // Map line items from API format to UI format
  const lineItems: OrderLineItem[] = (apiOrder.details || []).map((detail: OrderDetail, index: number) => ({
    id: detail.id,
    lineNumber: detail.itemNumber || index + 1,
    productId: detail.productId || '',
    partNumber: detail.product?.factoryPartNumber || detail.productNameAdhoc || '',
    custPartNumber: '',
    description: detail.product?.description || detail.productDescriptionAdhoc || '',
    uom: detail.uom?.title || '',
    uomId: detail.uom?.id || '',
    divisor: detail.uom?.divisionFactor || parseFloat(detail.divisionFactor || '1'),
    quantity: parseFloat(detail.quantity || '0'),
    unitPrice: parseFloat(detail.unitPrice || '0'),
    extendedPrice: detail.subtotal || 0,
    commissionRate: parseFloat(detail.commissionRate || '0') / 100, // API returns as percent, convert to decimal
    commissionAmount: detail.commission || 0,
    quantityShipped: detail.shippingBalance || 0,
    quantityInvoiced: 0, // API doesn't provide this directly
    quantityCredited: detail.cancelledBalance || 0,
    isCancelled: detail.status === 'CANCELLED',
    isConsignment: false,
    status: detail.status === 'CANCELLED' ? 'cancelled' : detail.status === 'SHIPPED' ? 'shipped' : 'open',
    // Store additional fields for line item
    endUserId: detail.endUserId,
    endUserName: '', // Will be fetched separately
    insideSplitRates: detail.insideSplitRates, // Store inside rep split rates from line item
    outsideSplitRates: detail.outsideSplitRates, // Store outside rep split rates from line item
    // Additional details fields (from AdditionalDetailsModal)
    commissionDiscountPercent: parseFloat(detail.commissionDiscountRate || '0'),
    commissionDiscountAmount: detail.commissionDiscount || 0,
    lineDiscountPercent: parseFloat(detail.discountRate || '0'),
    lineDiscountAmount: detail.discount || 0,
    leadTime: detail.leadTime || '',
    note: detail.note || '',
  }));

  // Extract inside rep from the first line item's insideSplitRates
  const firstDetailWithInsideReps = apiOrder.details?.find(d => d.insideSplitRates && d.insideSplitRates.length > 0);
  const insideRepSplitRate = firstDetailWithInsideReps?.insideSplitRates?.[0];

  // Extract outside rep from the first line item's outsideSplitRates
  const firstDetailWithOutsideReps = apiOrder.details?.find(d => d.outsideSplitRates && d.outsideSplitRates.length > 0);
  const outsideRepSplitRate = firstDetailWithOutsideReps?.outsideSplitRates?.[0];

  // Build the order object with all API fields
  const order: Order = {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    factorySoNumber: apiOrder.factSoNumber,
    manufacturerId: apiOrder.factoryId || '',
    manufacturerName: '', // Will be fetched separately
    customerId: apiOrder.soldToCustomerId || '',
    customerName: apiOrder.soldToCustomer?.companyName || '',
    jobId: apiOrder.job?.id,
    jobName: apiOrder.job?.jobName,
    status: mapApiStatusToUiStatus(apiOrder.headerStatus),
    fulfillmentStatus: 'not_started', // API doesn't provide this directly
    billingStatus: 'not_invoiced', // API doesn't provide this directly
    commissionStatus: 'pending', // API doesn't provide this directly
    orderDate: apiOrder.entityDate || '',
    entryDate: apiOrder.entityDate,
    shipDate: apiOrder.shipDate,
    dueDate: apiOrder.dueDate,
    requestedShipDate: apiOrder.projectedShipDate,
    actualShipDate: apiOrder.shipDate,
    quoteId: apiOrder.quoteId,
    lineItems,
    subtotal: apiOrder.balance?.subtotal || 0,
    freight: apiOrder.balance?.freightChargeBalance || 0,
    total: apiOrder.balance?.total || 0,
    totalCommission: apiOrder.balance?.commission || 0,
    insideRepId: insideRepSplitRate?.userId,
    insideRepName: '', // Will be fetched separately
    splitRates: (firstDetailWithInsideReps?.insideSplitRates || []).map(rep => ({
      salesRepId: rep.userId || '',
      salesRepName: '', // Will be fetched separately
      splitPercentage: parseFloat(rep.splitRate || '0'),
      commissionAmount: 0, // Calculate from total commission
    })),
    createdAt: apiOrder.createdAt || '',
    createdBy: apiOrder.createdBy?.fullName || apiOrder.createdBy?.username || '',
    updatedAt: apiOrder.createdAt || '',
  };

  // Add extra fields from API that aren't in the base Order type
  (order as any).billToCustomerId = apiOrder.billToCustomerId;
  (order as any).billToCustomerName = apiOrder.billToCustomer?.companyName;
  (order as any).shippingTerms = apiOrder.shippingTerms;
  (order as any).freightTerms = apiOrder.freightTerms;
  (order as any).markNumber = apiOrder.markNumber;
  (order as any).orderType = apiOrder.orderType;

  // Store all inside reps from line item for split commission support
  const allInsideReps = firstDetailWithInsideReps?.insideSplitRates?.map((sr, idx) => ({
    id: sr.id || '',
    userId: sr.userId || '',
    splitRate: sr.splitRate || '100',
    position: sr.position ?? idx,
  })) || [];

  (order as any).insideReps = allInsideReps;

  // Store all outside reps from line item for split commission support
  const allOutsideReps = firstDetailWithOutsideReps?.outsideSplitRates?.map((sr, idx) => ({
    id: sr.id || '',
    userId: sr.userId || '',
    splitRate: sr.splitRate || '100',
    position: sr.position ?? idx,
  })) || [];

  (order as any).outsideRepId = outsideRepSplitRate?.userId;
  (order as any).outsideRepName = ''; // Will be fetched separately
  (order as any).outsideReps = allOutsideReps; // Store all outside reps
  (order as any).outsideRepSplitRates = allOutsideReps; // Alias for compatibility

  // Extract order-level endUser from line items
  // If all line items have the same endUserId, set it at order level
  const lineItemEndUserIds = lineItems
    .map(li => (li as any).endUserId)
    .filter((id): id is string => !!id);
  const uniqueEndUserIds = [...new Set(lineItemEndUserIds)];
  if (uniqueEndUserIds.length === 1) {
    // All line items have the same endUserId
    (order as any).endUserId = uniqueEndUserIds[0];
    (order as any).endUserName = ''; // Will be fetched separately
  } else if (uniqueEndUserIds.length === 0) {
    // No end users set on line items
    (order as any).endUserId = '';
    (order as any).endUserName = '';
  }

  return order;
}

/**
 * Map API status/headerStatus to UI status
 */
function mapApiStatusToUiStatus(headerStatus?: string): 'draft' | 'open' | 'partial_shipped' | 'shipped' | 'cancelled' | 'dormant' {
  const hs = headerStatus?.toUpperCase();
  switch (hs) {
    case 'DRAFT':
      return 'draft';
    case 'OPEN':
      return 'open';
    case 'PARTIAL_SHIPPED':
      return 'partial_shipped';
    case 'SHIPPED':
      return 'shipped';
    case 'CANCELLED':
      return 'cancelled';
    case 'DORMANT':
      return 'dormant';
    default:
      return 'open';
  }
}

export function useOrderDetailState({ orderId }: UseOrderDetailStateProps) {
  // Determine if we're in create mode
  const isCreateMode = orderId === 'new';

  // Fetch order from API (skip if create mode)
  const { data: apiOrder, isLoading, error, refetch } = useOrder(isCreateMode ? null : orderId);
  const updateOrderMutation = useUpdateOrder();
  const createOrderMutation = useCreateOrder();

  // Local order state for create mode or local edits
  const [localOrder, setLocalOrder] = useState<Order>(() => createEmptyOrder());
  // Track if we've made local edits in edit mode
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  // Track if we've initialized localOrder from API (includes name fetches)
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset initialization state when orderId changes (navigating to different order)
  useEffect(() => {
    setHasInitialized(false);
    setHasLocalEdits(false);
  }, [orderId]);

  // Transform API order to UI format, or use local order in create/edit mode
  const order = useMemo(() => {
    if (isCreateMode) {
      return localOrder;
    }
    if (!apiOrder) return undefined;
    // If we have local edits OR we've initialized (names fetched), use localOrder
    if (hasLocalEdits || hasInitialized) {
      return localOrder;
    }
    return transformApiOrderToUiOrder(apiOrder);
  }, [isCreateMode, localOrder, apiOrder, hasLocalEdits, hasInitialized]);

  // Initialize localOrder when API data loads (for edit mode)
  useEffect(() => {
    if (!isCreateMode && apiOrder && !hasLocalEdits && !hasInitialized) {
      const transformedOrder = transformApiOrderToUiOrder(apiOrder);
      setLocalOrder(transformedOrder);

      // Collect all fetch promises
      const fetchPromises: Promise<void>[] = [];

      // Fetch factory name if we have a factoryId
      if (transformedOrder.manufacturerId) {
        const factoryPromise = searchFactories('', true)
          .then((factories) => {
            const factory = factories.find(f => f.id === transformedOrder.manufacturerId);
            if (factory) {
              setLocalOrder(prev => ({ ...prev, manufacturerName: factory.title }));
            }
          })
          .catch((err) => console.error('Failed to fetch factory name:', err));
        fetchPromises.push(factoryPromise);
      }

      // Fetch inside rep name
      if (transformedOrder.insideRepId) {
        const insideRepPromise = searchUsers({ searchTerm: '', isInside: true, enabled: true, limit: 100 })
          .then((users) => {
            const user = users.find(u => u.id === transformedOrder.insideRepId);
            if (user) {
              setLocalOrder(prev => ({
                ...prev,
                insideRepName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '',
              }));
            }
          })
          .catch((err) => console.error('Failed to fetch inside rep name:', err));
        fetchPromises.push(insideRepPromise);
      }

      // Fetch outside rep name from splitRates stored on order
      const outsideRepId = (transformedOrder as any).outsideRepId;
      if (outsideRepId) {
        const outsideRepPromise = searchUsers({ searchTerm: '', isOutside: true, enabled: true, limit: 100 })
          .then((users) => {
            const user = users.find(u => u.id === outsideRepId);
            if (user) {
              setLocalOrder(prev => ({
                ...prev,
                outsideRepName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '',
              } as any));
            }
          })
          .catch((err) => console.error('Failed to fetch outside rep name:', err));
        fetchPromises.push(outsideRepPromise);
      }

      // Fetch end user names for line items AND order-level end user
      const endUserIds = new Set<string>();
      transformedOrder.lineItems.forEach(li => {
        if ((li as any).endUserId) endUserIds.add((li as any).endUserId);
      });
      // Also include order-level endUserId
      const orderEndUserId = (transformedOrder as any).endUserId;
      if (orderEndUserId) endUserIds.add(orderEndUserId);

      if (endUserIds.size > 0) {
        const endUserPromise = searchCustomers('', true)
          .then((customers) => {
            const customerMap = new Map(customers.map(c => [c.id, c.companyName]));
            setLocalOrder(prev => {
              const updated = {
                ...prev,
                lineItems: (prev.lineItems || []).map(li => ({
                  ...li,
                  endUserName: (li as any).endUserId ? customerMap.get((li as any).endUserId) || '' : '',
                })),
              };
              // Also set order-level end user name
              const prevOrderEndUserId = (prev as any).endUserId;
              if (prevOrderEndUserId && customerMap.has(prevOrderEndUserId)) {
                (updated as any).endUserName = customerMap.get(prevOrderEndUserId);
              }
              return updated;
            });
          })
          .catch((err) => console.error('Failed to fetch end user names:', err));
        fetchPromises.push(endUserPromise);
      }

      // Fetch CPNs for line items that have products
      const soldToCustomerId = apiOrder.soldToCustomerId;
      const lineItemsWithProducts = transformedOrder.lineItems.filter(li => li.productId);
      if (soldToCustomerId && lineItemsWithProducts.length > 0) {
        const cpnPromise = (async () => {
          // Fetch CPNs for each product in parallel
          const cpnPromises = lineItemsWithProducts.map(async (li) => {
            try {
              const cpnResult = await getProductCpnByCustomer(li.productId!, soldToCustomerId);
              return { itemId: li.id, cpn: cpnResult?.customerPartNumber || '' };
            } catch (err) {
              console.log('No CPN found for product:', li.productId);
              return { itemId: li.id, cpn: '' };
            }
          });

          const cpnResults = await Promise.all(cpnPromises);
          const cpnMap = new Map(cpnResults.map(r => [r.itemId, r.cpn]));

          setLocalOrder(prev => ({
            ...prev,
            lineItems: (prev.lineItems || []).map(li => ({
              ...li,
              custPartNumber: cpnMap.has(li.id) ? cpnMap.get(li.id)! : li.custPartNumber,
            })),
          }));
        })();
        fetchPromises.push(cpnPromise);
      }

      // Use settings from API response
      setShowEndUserPerLine(apiOrder.endUserPerLineItem ?? false);
      setShowInsideRepPerLine(apiOrder.insidePerLineItem ?? false);
      setShowOutsideRepPerLine(apiOrder.outsidePerLineItem ?? false);

      // After all fetches complete (or if no fetches needed), mark as initialized so useMemo uses localOrder
      if (fetchPromises.length > 0) {
        Promise.all(fetchPromises).finally(() => {
          setHasInitialized(true);
        });
      } else {
        // No fetches needed, mark as initialized immediately
        setHasInitialized(true);
      }
    }
  }, [isCreateMode, apiOrder, hasLocalEdits, hasInitialized]);

  // Track previous customerId to detect changes
  const prevCustomerIdRef = React.useRef<string | undefined>(undefined);

  // Re-fetch CPNs when sold-to customer changes
  useEffect(() => {
    // Only re-fetch if customer actually changed (not on initial load) and we have an order with line items
    if (
      prevCustomerIdRef.current !== undefined &&
      localOrder.customerId !== prevCustomerIdRef.current &&
      localOrder.customerId &&
      localOrder.lineItems?.some(li => li.productId)
    ) {
      const lineItemsWithProducts = localOrder.lineItems.filter(li => li.productId);

      // Fetch CPNs for each product in parallel
      (async () => {
        const cpnPromises = lineItemsWithProducts.map(async (li) => {
          try {
            const cpnResult = await getProductCpnByCustomer(li.productId!, localOrder.customerId);
            return { itemId: li.id, cpn: cpnResult?.customerPartNumber || '' };
          } catch (err) {
            // CPN not found is not an error
            return { itemId: li.id, cpn: '' };
          }
        });

        const cpnResults = await Promise.all(cpnPromises);
        const cpnMap = new Map(cpnResults.map(r => [r.itemId, r.cpn]));

        setLocalOrder(prev => ({
          ...prev,
          lineItems: (prev.lineItems || []).map(li => ({
            ...li,
            custPartNumber: cpnMap.has(li.id) ? cpnMap.get(li.id)! : li.custPartNumber,
          })),
        }));
      })();
    }
    prevCustomerIdRef.current = localOrder.customerId;
  }, [localOrder.customerId, localOrder.lineItems]);

  // Keep orders array for compatibility with existing code
  const orders = useMemo(() => order ? [order] : [], [order]);

  // Setter function that triggers API update or updates local state in create mode
  const setOrders = (updater: Order[] | ((prev: Order[]) => Order[])) => {
    if (isCreateMode) {
      // In create mode, update local state
      const newOrders = typeof updater === 'function' ? updater(orders) : updater;
      if (newOrders.length > 0) {
        setLocalOrder(newOrders[0]);
      }
    } else {
      // For now, local state updates are optimistic
      // In a full implementation, this would trigger updateOrderMutation
    }
  };

  // Update local order directly (for field changes)
  const updateLocalOrder = (updates: Partial<Order>) => {
    if (!isCreateMode) setHasLocalEdits(true);
    setLocalOrder(prev => ({ ...prev, ...updates }));
  };

  // Update line items (for both create and edit mode)
  // Automatically recalculates totals when line items change
  const updateLineItems = (items: OrderLineItem[]) => {
    if (!isCreateMode) setHasLocalEdits(true);

    // Recalculate each line item's extended price and commission
    const updatedItems = items.map(item => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const commissionRate = item.commissionRate || 0;
      const extendedPrice = quantity * unitPrice;
      const commissionAmount = extendedPrice * commissionRate;
      return {
        ...item,
        extendedPrice,
        commissionAmount,
      };
    });

    // Calculate order totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.extendedPrice || 0), 0);
    const totalCommission = updatedItems.reduce((sum, item) => sum + (item.commissionAmount || 0), 0);

    setLocalOrder(prev => ({
      ...prev,
      lineItems: updatedItems,
      subtotal,
      total: subtotal + (prev.freight || 0),
      totalCommission,
    }));
  };

  // Fulfillment orders - keep mock for now (coming soon)
  const [fulfillmentOrders, setFulfillmentOrders] = useState<FulfillmentOrder[]>(
    mockFulfillmentOrders
  );

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_ACTIVE_TAB);

  // Line items selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set()
  );

  // Settings state
  const [showEndUserPerLine, setShowEndUserPerLine] = useState(false);
  const [showOutsideRepPerLine, setShowOutsideRepPerLine] = useState(false);
  const [showInsideRepPerLine, setShowInsideRepPerLine] = useState(false);
  const [customerPartNumberSource, setCustomerPartNumberSource] = useState<
    'soldTo' | 'endUser'
  >('soldTo');

  // Sections state
  const [showSections, setShowSections] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [sectionDisplayMode, setSectionDisplayMode] = useState<
    'column' | 'lineShelf'
  >('column');

  // Quote lookup modal state
  const [showQuoteLookupModal, setShowQuoteLookupModal] = useState(false);
  const [quoteLookupPartNumber, setQuoteLookupPartNumber] = useState('');
  const [quoteLookupQuoteNumber, setQuoteLookupQuoteNumber] = useState('');
  const [quoteLookupStartDate, setQuoteLookupStartDate] = useState('12/2024');
  const [quoteLookupEndDate, setQuoteLookupEndDate] = useState('12/2025');
  const [quoteLookupOpenOnly, setQuoteLookupOpenOnly] = useState(false);
  const [quoteLookupBlanketOnly, setQuoteLookupBlanketOnly] = useState(false);

  // Save dropdown (header)
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Additional details modal state (3-dots menu)
  const [showAdditionalDetailsModal, setShowAdditionalDetailsModal] = useState(false);
  const [additionalDetailsLineItem, setAdditionalDetailsLineItem] = useState<OrderLineItem | null>(null);

  // Open additional details modal for a line item
  const openAdditionalDetails = (lineItem: OrderLineItem) => {
    setAdditionalDetailsLineItem(lineItem);
    setShowAdditionalDetailsModal(true);
  };

  // Close additional details modal
  const closeAdditionalDetails = () => {
    setShowAdditionalDetailsModal(false);
    setAdditionalDetailsLineItem(null);
  };

  // Save additional details for a line item
  const saveAdditionalDetails = (updates: Partial<OrderLineItem>) => {
    if (!additionalDetailsLineItem || !order) return;
    const updatedItems = (order.lineItems || []).map((li) =>
      li.id === additionalDetailsLineItem.id ? { ...li, ...updates } : li
    );
    updateLineItems(updatedItems);
    closeAdditionalDetails();
  };

  // Mock data for line item acknowledgements
  const [lineItemAcknowledgements] = useState<
    Record<string, LineItemAcknowledgement>
  >({
    // Order 001
    'OLI-001-1': {
      ackNumber: 'ACK-2024-010',
      shipDate: '2024-12-15',
      acknowledgedQty: 50,
    },
    // Order 002
    'OLI-002-1': {
      ackNumber: 'ACK-2024-011',
      shipDate: '2024-12-18',
      acknowledgedQty: 75,
    },
    'OLI-002-2': {
      ackNumber: 'ACK-2024-011',
      shipDate: '2024-12-18',
      acknowledgedQty: 30,
    },
    // Order 003
    'OLI-003-1': {
      ackNumber: 'ACK-2024-012',
      shipDate: '2024-12-20',
      acknowledgedQty: 100,
    },
    // Order 004
    'OLI-004-1': {
      ackNumber: 'ACK-2024-013',
      shipDate: '2024-12-22',
      acknowledgedQty: 200,
    },
    // Order 005
    'OLI-005-1': {
      ackNumber: 'ACK-2024-001',
      shipDate: '2024-12-20',
      acknowledgedQty: 100,
    },
    'OLI-005-2': {
      ackNumber: 'ACK-2024-004',
      shipDate: '2024-12-28',
      acknowledgedQty: 30,  // Partial: 30 of 45 acknowledged
    },
    'OLI-005-3': {
      ackNumber: 'ACK-2024-002',
      shipDate: '2024-12-22',
      acknowledgedQty: 200,
    },
    'OLI-005-4': {
      ackNumber: 'ACK-2024-003',
      shipDate: '2024-12-18',
      acknowledgedQty: 30,
    },
    // Order 006
    'OLI-006-1': {
      ackNumber: 'ACK-2024-014',
      shipDate: '2024-12-25',
      acknowledgedQty: 150,
    },
  });

  // Mock data for line item credits
  const [lineItemCredits] = useState<Record<string, LineItemCredit>>({
    // Order 001
    'OLI-001-2': {
      creditName: 'CR-2024-010',
      creditType: 'Short Ship',
      creditQty: 3,
      originalQty: 25,
      originalTotal: 4125,
    },
    // Order 003
    'OLI-003-2': {
      creditName: 'CR-2024-011',
      creditType: 'Cancel',
      creditQty: 10,
      originalQty: 40,
      originalTotal: 8800,
    },
    // Order 005 - quantities reflect post-credit values (original - credit)
    'OLI-005-2': {
      creditName: 'CR-2024-001',
      creditType: 'Return',
      creditQty: 5,
      originalQty: 50,
      originalTotal: 7250,  // Now shows 45 qty, $6,525
    },
    'OLI-005-5': {
      creditName: 'CR-2024-002',
      creditType: 'Damage',
      creditQty: 2,
      originalQty: 15,
      originalTotal: 6750,  // Now shows 13 qty, $5,850
    },
    // Order 006
    'OLI-006-2': {
      creditName: 'CR-2024-012',
      creditType: 'Return',
      creditQty: 25,
      originalQty: 80,
      originalTotal: 11200,
    },
  });

  // Check if order has freight line
  const hasFreightLine = useMemo(() => {
    return (
      (order?.lineItems || []).some((item) => item.partNumber === 'FREIGHT')
    );
  }, [order]);

  // Toggle line item selection
  const toggleLineItemSelection = (lineItemId: string) => {
    setSelectedLineItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lineItemId)) {
        newSet.delete(lineItemId);
      } else {
        newSet.add(lineItemId);
      }
      return newSet;
    });
  };

  // Select all line items
  const selectAllLineItems = () => {
    if (!order) return;
    setSelectedLineItems(toggleAllLineItems(order.lineItems || [], selectedLineItems));
  };

  // Clear selection
  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };

  // Integrate header hook
  const headerState = useOrderHeader({
    order,
    setOrders,
  });

  // Integrate table hook
  const tableState = useLineItemsTable();

  // Integrate bulk actions hook
  const bulkActionsState = useLineItemBulkActions({
    selectedLineItems,
    clearSelection: clearLineItemSelection,
  });

  // Return loading/error state if order not available (skip for create mode - we have a local order)
  if (!isCreateMode && (isLoading || error || !order)) {
    // Stub function for all callbacks
    const noop = () => {};
    const noopWithArg = (_: any) => {};

    return {
      // Loading/Error state
      isLoading,
      error,
      refetch,
      isCreateMode: false,
      order: null,
      orders: [],
      setOrders: noop,
      updateLocalOrder: noop,
      updateLineItems: noopWithArg,
      fulfillmentOrders: [],
      setFulfillmentOrders: noop,
      activeTab: DEFAULT_ACTIVE_TAB,
      setActiveTab: noop,
      selectedLineItems: new Set<string>(),
      toggleLineItemSelection: noop,
      selectAllLineItems: noop,
      clearLineItemSelection: noop,
      showEndUserPerLine: false,
      setShowEndUserPerLine: noop,
      showOutsideRepPerLine: false,
      setShowOutsideRepPerLine: noop,
      showInsideRepPerLine: false,
      setShowInsideRepPerLine: noop,
      customerPartNumberSource: 'soldTo' as const,
      setCustomerPartNumberSource: noop,
      showSections: false,
      setShowSections: noop,
      showSectionsModal: false,
      setShowSectionsModal: noop,
      sectionDisplayMode: 'column' as const,
      setSectionDisplayMode: noop,
      showQuoteLookupModal: false,
      setShowQuoteLookupModal: noop,
      quoteLookupPartNumber: '',
      setQuoteLookupPartNumber: noop,
      quoteLookupQuoteNumber: '',
      setQuoteLookupQuoteNumber: noop,
      quoteLookupStartDate: '',
      setQuoteLookupStartDate: noop,
      quoteLookupEndDate: '',
      setQuoteLookupEndDate: noop,
      quoteLookupOpenOnly: false,
      setQuoteLookupOpenOnly: noop,
      quoteLookupBlanketOnly: false,
      setQuoteLookupBlanketOnly: noop,
      showSaveDropdown: false,
      setShowSaveDropdown: noop,
      showAdditionalDetailsModal: false,
      additionalDetailsLineItem: null,
      openAdditionalDetails: noopWithArg,
      closeAdditionalDetails: noop,
      saveAdditionalDetails: noopWithArg,
      lineItemAcknowledgements: {},
      lineItemCredits: {},
      hasFreightLine: false,
      createOrderMutation: null,
      updateOrderMutation: null,

      // Header state stubs
      showHeaderFields: false,
      setShowHeaderFields: noop,
      toggleHeaderFields: noop,
      viewMode: 'simple' as const,
      setViewMode: noop,
      showViewModeDropdown: false,
      setShowViewModeDropdown: noop,
      currentVersion: 1,
      setCurrentVersion: noop,
      showVersionDropdown: false,
      setShowVersionDropdown: noop,
      availableVersions: [],
      setAvailableVersions: noop,
      showStatusDropdown: false,
      setShowStatusDropdown: noop,
      updateOrderStatus: noop,
      orderOutsideRep: '',
      setOrderOutsideRep: noop,
      splitOutsideCommission: false,
      setSplitOutsideCommission: noop,
      showOutsideRepSplitsModal: false,
      openOutsideRepModal: noop,
      closeOutsideRepModal: noop,
      outsideRepSplits: [],
      setOutsideRepSplits: noop,
      orderInsideRep: '',
      setOrderInsideRep: noop,
      splitInsideCommission: false,
      setSplitInsideCommission: noop,
      showInsideRepSplitsModal: false,
      openInsideRepModal: noop,
      closeInsideRepModal: noop,
      insideRepSplits: [],
      setInsideRepSplits: noop,
      editingSplits: false,
      editedSplits: [],
      startEditingSplits: noop,
      cancelEditingSplits: noop,
      saveSplits: noop,
      updateSplitPercentage: noop,
      splitPercentageTotal: 0,

      // Table state stubs
      visibleColumns: new Set<ColumnKey>(),
      setVisibleColumns: noop,
      visibleColumnsArray: [],
      toggleColumn: noop,
      pinnedColumns: new Set<ColumnKey>(),
      setPinnedColumns: noop,
      pinnedColumnsArray: [],
      togglePinColumn: noop,
      savedViews: [],
      showViewsMenu: false,
      setShowViewsMenu: noop,
      activeView: '',
      setActiveView: noop,
      applyView: noop,
      resetToDefaultView: noop,
      showColumnsModal: false,
      openColumnsModal: noop,
      closeColumnsModal: noop,
      invoiceTooltip: { visible: false, x: 0, y: 0, invoices: [] },
      showInvoiceTooltip: noop,
      hideInvoiceTooltip: noop,
      setInvoiceTooltip: noop,
      showActionsDropdown: false,
      setShowActionsDropdown: noop,
      isPinned: () => false,
      getPinnedColumnStyle: () => ({}),

      // Bulk actions stubs
      showLineItemsBulkActionsMenu: false,
      setShowLineItemsBulkActionsMenu: noop,
      showLineAcknowledgementModal: false,
      openAcknowledgementModal: noop,
      closeAcknowledgementModal: noop,
      saveAcknowledgement: noop,
      ackNumber: '',
      setAckNumber: noop,
      ackDate: '',
      setAckDate: noop,
      ackLineItems: [],
      setAckLineItems: noop,
      showSetOverageModal: false,
      openOverageModal: noop,
      closeOverageModal: noop,
      saveOverage: noop,
      bulkOveragePercent: '',
      setBulkOveragePercent: noop,
      showSetEndUserModal: false,
      openEndUserModal: noop,
      closeEndUserModal: noop,
      saveEndUser: noop,
      bulkEndUser: '',
      setBulkEndUser: noop,
      showSetOutsideRepSplitsModal: false,
      openOutsideRepSplitsModal: noop,
      closeOutsideRepSplitsModal: noop,
      saveOutsideRepSplits: noop,
      showWarehouseConversionModal: false,
      openWarehouseConversionModal: noop,
      closeWarehouseConversionModal: noop,
      saveWarehouseConversion: noop,
      warehouseConversionMode: 'all' as const,
      setWarehouseConversionMode: noop,
      productsToConvert: [],
      setProductsToConvert: noop,
      showFulfillmentRequestModal: false,
      openFulfillmentRequestModal: noop,
      closeFulfillmentRequestModal: noop,
      saveFulfillmentRequest: noop,
      fulfillmentRequestMode: 'all' as const,
      setFulfillmentRequestMode: noop,
      lineItemsForFulfillment: [],
      setLineItemsForFulfillment: noop,
    };
  }

  return {
    // Loading/Error state
    isLoading,
    error,
    refetch,
    // Create mode flag
    isCreateMode,
    // Order data
    order,
    orders,
    setOrders,
    updateLocalOrder,
    updateLineItems,
    // Mutations
    createOrderMutation,
    updateOrderMutation,
    fulfillmentOrders,
    setFulfillmentOrders,

    // Tab state
    activeTab,
    setActiveTab,

    // Line items selection
    selectedLineItems,
    toggleLineItemSelection,
    selectAllLineItems,
    clearLineItemSelection,

    // Settings
    showEndUserPerLine,
    setShowEndUserPerLine,
    showOutsideRepPerLine,
    setShowOutsideRepPerLine,
    showInsideRepPerLine,
    setShowInsideRepPerLine,
    customerPartNumberSource,
    setCustomerPartNumberSource,

    // Sections
    showSections,
    setShowSections,
    showSectionsModal,
    setShowSectionsModal,
    sectionDisplayMode,
    setSectionDisplayMode,

    // Quote lookup
    showQuoteLookupModal,
    setShowQuoteLookupModal,
    quoteLookupPartNumber,
    setQuoteLookupPartNumber,
    quoteLookupQuoteNumber,
    setQuoteLookupQuoteNumber,
    quoteLookupStartDate,
    setQuoteLookupStartDate,
    quoteLookupEndDate,
    setQuoteLookupEndDate,
    quoteLookupOpenOnly,
    setQuoteLookupOpenOnly,
    quoteLookupBlanketOnly,
    setQuoteLookupBlanketOnly,

    // Save dropdown
    showSaveDropdown,
    setShowSaveDropdown,

    // Additional details modal (3-dots menu)
    showAdditionalDetailsModal,
    additionalDetailsLineItem,
    openAdditionalDetails,
    closeAdditionalDetails,
    saveAdditionalDetails,

    // Mock data
    lineItemAcknowledgements,
    lineItemCredits,
    hasFreightLine,

    // Integrated hooks
    ...headerState,
    ...tableState,
    ...bulkActionsState,
  };
}

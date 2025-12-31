/**
 * useInvoiceDetailState Hook
 * Main state management hook for invoice detail
 * Manages overall state and integrates sub-hooks
 * Uses real API data and supports order population
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Invoice, OrderSplitRate, InvoiceStatus, InvoiceLineItem as RmsInvoiceLineItem } from '@/lib/types/rms';
import type { TabType, ViewMode, LineItemCredit, OrderTooltipState, VersionInfo, RepSplit, ProductToConvert, ColumnKey, InvoiceLineItem, EditableInvoice } from '../types';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { DEFAULT_ACTIVE_TAB } from '../config/tabsConfig';
import { DEFAULT_VISIBLE_COLUMNS } from '../constants';
import { calculateInvoiceTotals } from '../utils';
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  type Invoice as ApiInvoice,
  type InvoiceDetail,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from '../../api';
import { useOrder } from '@/components/orders/api';
import { useFactory } from '@/components/warehouse/api/useFactoriesApi';
import { fetchInvoiceById } from '../../api/invoicesApi';

/**
 * Map API status to RMS InvoiceStatus type
 * RMS uses: 'open' | 'paid' | 'partial_paid' | 'void' | 'dormant'
 */
function mapApiStatusToInvoiceStatus(status?: string): InvoiceStatus {
  const s = status?.toLowerCase();
  switch (s) {
    case 'open':
      return 'open';
    case 'paid':
      return 'paid';
    case 'partial_paid':
    case 'partial':
      return 'partial_paid';
    case 'void':
      return 'void';
    case 'dormant':
      return 'dormant';
    default:
      return 'open';
  }
}

interface UseInvoiceDetailStateProps {
  invoiceId: string;
  initialOrderId?: string;
}

/**
 * Transform API invoice to EditableInvoice format for local editing
 */
function transformApiInvoiceToUi(apiInvoice: ApiInvoice): EditableInvoice {
  // Transform details to extended line items for editing
  const extendedLineItems: InvoiceLineItem[] = (apiInvoice.details || []).map((detail, index) => ({
    id: detail.id,
    orderLineItemId: detail.orderDetailId || '',
    lineNumber: detail.itemNumber || index + 1,
    productId: detail.productId || '',
    partNumber: detail.product?.factoryPartNumber || detail.productNameAdhoc || '',
    custPartNumber: '',
    description: detail.product?.description || detail.productDescriptionAdhoc || '',
    quantity: parseFloat(detail.quantity || '0'),
    unitPrice: parseFloat(detail.unitPrice || '0'),
    uom: detail.uom?.title || 'EA',
    uomId: detail.uomId || '',
    divisor: parseFloat(detail.divisionFactor || '1'),
    total: detail.total || 0,
    amount: detail.total || 0,
    commissionPercent: parseFloat(detail.commissionRate || '0'),
    commissionRate: parseFloat(detail.commissionRate || '0'),
    commission: detail.commission || 0,
    commissionAmount: detail.commission || 0,
    discountPercent: parseFloat(detail.discountRate || '0'),
    discount: detail.discount || 0,
    commissionDiscountPercent: parseFloat(detail.commissionDiscountRate || '0'),
    commissionDiscount: detail.commissionDiscount || 0,
    status: detail.status || 'open',
    leadTime: detail.leadTime || '',
    note: detail.note || '',
    endUserId: detail.endUserId || '',
    orderDetailId: detail.orderDetailId || '',
    invoicedBalance: detail.invoicedBalance || 0,
    outsideSplitRates: (detail.outsideSplitRates || []).map(s => ({
      userId: s.userId || '',
      userName: s.user?.fullName || '',
      splitRate: parseFloat(s.splitRate || '0'),
      position: s.position || 0,
    })),
  }));

  return {
    id: apiInvoice.id,
    invoiceNumber: apiInvoice.invoiceNumber || '',
    orderId: apiInvoice.orderId || '',
    orderNumber: apiInvoice.order?.orderNumber || '',
    customerId: apiInvoice.order?.soldToCustomerId || '',
    customerName: '', // Will be populated from order if connected
    manufacturerId: apiInvoice.factory?.id || apiInvoice.factoryId || '',
    manufacturerName: apiInvoice.factory?.title || '',
    status: mapApiStatusToInvoiceStatus(apiInvoice.status),
    isLocked: apiInvoice.locked || false,
    invoiceDate: apiInvoice.entityDate || '',
    entryDate: apiInvoice.createdAt || '',
    dueDate: apiInvoice.dueDate || '',
    createdAt: apiInvoice.createdAt || '',
    createdBy: apiInvoice.createdBy?.fullName || '',
    updatedAt: apiInvoice.createdAt || '',
    lineItems: extendedLineItems,
    subtotal: apiInvoice.balance?.subtotal || 0,
    freight: 0, // Not in API
    total: apiInvoice.balance?.total || 0,
    amountPaid: apiInvoice.balance?.paidBalance || 0,
    amountCredited: 0, // Not in API
    balance: (apiInvoice.balance?.total || 0) - (apiInvoice.balance?.paidBalance || 0),
    totalCommission: apiInvoice.balance?.commission || 0,
    splitRates: [], // Will be populated from details
  };
}

/**
 * Transform API invoice detail to extended UI line item
 * This returns the extended InvoiceLineItem type from local types
 */
function transformDetailToExtendedLineItem(detail: InvoiceDetail): InvoiceLineItem {
  const quantity = parseFloat(detail.quantity || '0');
  const unitPrice = parseFloat(detail.unitPrice || '0');
  const divisor = parseFloat(detail.divisionFactor || '1');
  const total = detail.total || (quantity * unitPrice / divisor);
  const commissionRate = parseFloat(detail.commissionRate || '0');
  const commissionAmount = detail.commission || 0;

  return {
    id: detail.id,
    // Required from base type
    orderLineItemId: detail.orderDetailId || '',
    lineNumber: detail.itemNumber || 1,
    partNumber: detail.product?.factoryPartNumber || detail.productNameAdhoc || '',
    description: detail.product?.description || detail.productDescriptionAdhoc || '',
    quantity,
    unitPrice,
    amount: total,
    commissionRate,
    commissionAmount,
    // Extended fields
    productId: detail.productId || '',
    custPartNumber: '', // Not directly in API
    uom: detail.uom?.title || 'EA',
    uomId: detail.uomId || '',
    divisor,
    total,
    commissionPercent: commissionRate,
    commission: commissionAmount,
    discountPercent: parseFloat(detail.discountRate || '0'),
    discount: detail.discount || 0,
    commissionDiscountPercent: parseFloat(detail.commissionDiscountRate || '0'),
    commissionDiscount: detail.commissionDiscount || 0,
    status: detail.status || 'open',
    leadTime: detail.leadTime || '',
    note: detail.note || '',
    endUserId: detail.endUserId || '',
    orderDetailId: detail.orderDetailId || '',
    invoicedBalance: detail.invoicedBalance || 0,
    outsideSplitRates: (detail.outsideSplitRates || []).map(s => ({
      userId: s.userId || '',
      userName: s.user?.fullName || '',
      splitRate: parseFloat(s.splitRate || '0'),
      position: s.position || 0,
    })),
  };
}

/**
 * Create empty editable invoice for new invoice creation
 */
function createEmptyInvoice(): EditableInvoice {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: '',
    invoiceNumber: '',
    orderId: '',
    orderNumber: '',
    customerId: '',
    customerName: '',
    manufacturerId: '',
    manufacturerName: '',
    status: 'open',
    isLocked: false,
    invoiceDate: today,
    entryDate: today,
    dueDate: '',
    createdAt: today,
    createdBy: '',
    updatedAt: today,
    lineItems: [],
    subtotal: 0,
    freight: 0,
    total: 0,
    amountPaid: 0,
    amountCredited: 0,
    balance: 0,
    totalCommission: 0,
    splitRates: [],
  };
}

export function useInvoiceDetailState({ invoiceId, initialOrderId }: UseInvoiceDetailStateProps) {
  const isCreateMode = invoiceId === 'new';

  // Fetch invoice from API
  const {
    data: apiInvoice,
    isLoading,
    error,
    refetch
  } = useInvoice(isCreateMode ? null : invoiceId);

  // Mutations
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  // Local invoice state (for edits before saving)
  // Uses EditableInvoice which has extended InvoiceLineItem type
  const [localInvoice, setLocalInvoice] = useState<EditableInvoice | null>(null);

  // Order population state - for manual order selection in create mode
  // Initialize with initialOrderId from query params if provided
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || '');

  // Get the order ID to fetch - either from invoice (existing) or from selection (new)
  const orderIdToFetch = apiInvoice?.orderId || selectedOrderId || null;
  const { data: linkedOrder, isLoading: isOrderLoading } = useOrder(orderIdToFetch);

  // Fetch factory details when order has a factoryId
  const factoryIdToFetch = linkedOrder?.factoryId || null;
  const { data: linkedFactory } = useFactory(factoryIdToFetch || '');

  // Initialize local invoice from API data or empty for create mode
  useEffect(() => {
    if (isCreateMode) {
      setLocalInvoice(createEmptyInvoice());
    } else if (apiInvoice) {
      setLocalInvoice(transformApiInvoiceToUi(apiInvoice));
    }
  }, [apiInvoice, isCreateMode]);

  // Handle order selection - populate invoice from order
  const handleOrderSelect = useCallback(async (orderId: string, orderNumber: string) => {
    if (!orderId) return;

    setSelectedOrderId(orderId);

    // Update local invoice with order data
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        orderId,
        orderNumber,
      };
    });
  }, []);

  // When order data is loaded, populate the invoice with order fields
  // This works for both:
  // 1. Existing invoice with orderId - auto-populates order fields
  // 2. New invoice with selected order - populates when user selects an order
  useEffect(() => {
    if (linkedOrder && localInvoice) {
      setLocalInvoice(prev => {
        if (!prev) return prev;

        // Cast to any to access all API-specific fields
        const order = linkedOrder as any;

        // For existing invoices with orderId, don't overwrite line items
        // Only overwrite line items if this is a new invoice being created from an order
        const isNewInvoiceFromOrder = isCreateMode && selectedOrderId;

        // Transform order line items to extended InvoiceLineItem format for editing
        // Only do this for new invoices being created from an order
        let extendedLineItems = prev.lineItems;
        if (isNewInvoiceFromOrder) {
          extendedLineItems = (order.lineItems || order.details || []).map((item: any, index: number) => ({
            id: `new-${index}-${Date.now()}`,
            orderLineItemId: item.id || '',
            lineNumber: item.lineNumber || item.itemNumber || index + 1,
            productId: item.productId || '',
            partNumber: item.partNumber || item.product?.factoryPartNumber || item.productNameAdhoc || '',
            custPartNumber: item.custPartNumber || '',
            description: item.description || item.product?.description || item.productDescriptionAdhoc || '',
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity || 0),
            unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : (item.unitPrice || 0),
            uom: item.uom?.title || item.uom || 'EA',
            uomId: item.uomId || '',
            divisor: typeof item.divisionFactor === 'string' ? parseFloat(item.divisionFactor) : (item.divisor || 1),
            total: item.total || item.extendedPrice || item.amount || 0,
            amount: item.total || item.extendedPrice || item.amount || 0,
            commissionPercent: typeof item.commissionRate === 'string' ? parseFloat(item.commissionRate) * 100 : ((item.commissionRate || 0.08) * 100),
            commissionRate: typeof item.commissionRate === 'string' ? parseFloat(item.commissionRate) : (item.commissionRate || 0.08),
            commission: item.commission || item.commissionAmount || 0,
            commissionAmount: item.commission || item.commissionAmount || 0,
            discountPercent: parseFloat(item.discountRate || '0'),
            discount: item.discount || 0,
            commissionDiscountPercent: parseFloat(item.commissionDiscountRate || '0'),
            commissionDiscount: item.commissionDiscount || 0,
            status: item.status || 'open',
            leadTime: item.leadTime || '',
            note: item.note || '',
            endUserId: item.endUserId || '',
            orderDetailId: item.id || '',
            invoicedBalance: 0,
            outsideSplitRates: [],
          }));
        }

        // Always populate order-related fields (Sold To, Bill To, PO#, Job, Terms, Reps)
        // Factory: Only use from order if not already set from invoice (invoice.factory takes precedence)
        return {
          ...prev,
          // Order reference
          orderId: linkedOrder.id,
          orderNumber: linkedOrder.orderNumber || '',

          // Factory (Manufacturer) - only override if not already set from invoice
          // Factory name will be populated by separate effect when linkedFactory loads
          manufacturerId: prev.manufacturerId || order.factoryId || order.manufacturerId || '',
          manufacturerName: prev.manufacturerName || '',

          // Customers
          customerId: order.soldToCustomerId || order.customerId || prev.customerId || '',
          customerName: order.soldToCustomer?.companyName || order.customerName || prev.customerName || '',
          soldToCustomerId: order.soldToCustomerId || '',
          soldToCustomerName: order.soldToCustomer?.companyName || '',
          billToCustomerId: order.billToCustomerId || order.soldToCustomerId || '',
          billToCustomerName: order.billToCustomer?.companyName || order.soldToCustomer?.companyName || '',
          endUserId: order.endUserPerLineItem ? '' : (order.endUserId || ''),
          endUserName: order.endUserPerLineItem ? '' : (order.endUser?.companyName || ''),

          // Order reference fields
          poNumber: order.customerPo || order.poNumber || '',
          jobId: order.jobId || '',
          jobName: order.job?.title || order.jobName || '',

          // Terms (from order)
          paymentTerms: order.paymentTerm?.title || order.paymentTerms || '',
          paymentTermsId: order.paymentTermId || '',
          freightTerms: order.freightTerm?.title || order.freightTerms || '',
          freightTermsId: order.freightTermId || '',
          shippingTerms: order.shippingTerm?.title || order.shippingTerms || '',
          shippingTermsId: order.shippingTermId || '',

          // Reps - only populate header if NOT per line item
          outsideRepId: order.outsidePerLineItem ? '' : (order.outsideRepId || order.outsideSalesRepId || ''),
          outsideRepName: order.outsidePerLineItem ? '' : (order.outsideRep?.fullName || order.outsideSalesRep?.fullName || ''),
          insideRepId: order.insidePerLineItem ? '' : (order.insideRepId || order.insideSalesRepId || ''),
          insideRepName: order.insidePerLineItem ? '' : (order.insideRep?.fullName || order.insideSalesRep?.fullName || ''),

          // Per-line-item flags from order
          outsidePerLineItem: order.outsidePerLineItem || false,
          insidePerLineItem: order.insidePerLineItem || false,
          endUserPerLineItem: order.endUserPerLineItem || false,

          // Dates
          invoiceDate: prev.invoiceDate || order.entityDate || order.orderDate || '',
          dueDate: prev.dueDate || order.dueDate || '',

          // Line items (only for new invoice from order)
          lineItems: extendedLineItems,

          // Totals (only for new invoice from order)
          ...(isNewInvoiceFromOrder ? {
            subtotal: order.balance?.subtotal || order.subtotal || 0,
            total: order.balance?.total || order.total || 0,
          } : {}),

          // Flag that these fields came from order (for UI to make them read-only)
          isPopulatedFromOrder: true,
        };
      });
    }
  }, [linkedOrder, isCreateMode, selectedOrderId]);

  // When factory data is loaded, populate the factory name
  useEffect(() => {
    if (linkedFactory && localInvoice && !localInvoice.manufacturerName) {
      setLocalInvoice(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          manufacturerName: linkedFactory.title || '',
        };
      });
    }
  }, [linkedFactory, localInvoice?.manufacturerName]);

  // Handle invoice selection - copy from existing invoice
  const handleInvoiceSelect = useCallback(async (invoiceId: string, invoiceNumber: string) => {
    if (!invoiceId) return;

    try {
      const existingInvoice = await fetchInvoiceById(invoiceId);
      if (existingInvoice) {
        const transformed = transformApiInvoiceToUi(existingInvoice);
        setLocalInvoice(prev => ({
          ...transformed,
          id: prev?.id || '',
          invoiceNumber: '', // Clear invoice number for new invoice
        }));
      }
    } catch (error) {
      console.error('Failed to fetch invoice for copy:', error);
    }
  }, []);

  // Update local invoice field
  const updateInvoice = useCallback((updates: Partial<EditableInvoice>) => {
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  // Update line items
  const updateLineItems = useCallback((lineItems: InvoiceLineItem[]) => {
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return { ...prev, lineItems };
    });
  }, []);

  // Add new line item
  const addLineItem = useCallback(() => {
    setLocalInvoice(prev => {
      if (!prev) return prev;
      const newLineNumber = prev.lineItems.length > 0
        ? Math.max(...prev.lineItems.map(l => l.lineNumber)) + 1
        : 1;
      const newItem: InvoiceLineItem = {
        id: `new-${Date.now()}`,
        // Required from base type
        orderLineItemId: '',
        lineNumber: newLineNumber,
        partNumber: '',
        description: '',
        quantity: 0,
        unitPrice: 0,
        amount: 0,
        commissionRate: 0,
        commissionAmount: 0,
        // Extended fields
        productId: '',
        custPartNumber: '',
        uom: 'EA',
        uomId: '',
        divisor: 1,
        total: 0,
        commissionPercent: 0,
        commission: 0,
        discountPercent: 0,
        discount: 0,
        commissionDiscountPercent: 0,
        commissionDiscount: 0,
        status: 'open',
        leadTime: '',
        note: '',
        endUserId: '',
        orderDetailId: '',
        invoicedBalance: 0,
        outsideSplitRates: [],
      };
      return { ...prev, lineItems: [...prev.lineItems, newItem] };
    });
  }, []);

  // Delete line item
  const deleteLineItem = useCallback((lineItemId: string) => {
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.filter(l => l.id !== lineItemId)
      };
    });
  }, []);

  // Update single line item
  const updateLineItem = useCallback((lineItemId: string, updates: Partial<InvoiceLineItem>) => {
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map(l =>
          l.id === lineItemId ? { ...l, ...updates } : l
        ),
      };
    });
  }, []);

  // Save invoice to API
  const saveInvoice = useCallback(async () => {
    if (!localInvoice) return;

    const input: CreateInvoiceInput | UpdateInvoiceInput = {
      id: isCreateMode ? undefined : localInvoice.id,
      invoiceNumber: localInvoice.invoiceNumber,
      entityDate: localInvoice.invoiceDate,
      dueDate: localInvoice.dueDate || undefined,
      orderId: localInvoice.orderId || undefined,
      factoryId: localInvoice.manufacturerId || undefined,
      creationType: 'MANUAL',
      details: localInvoice.lineItems.map((item, index) => ({
        id: item.id.startsWith('new-') ? undefined : item.id,
        itemNumber: index + 1,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        productId: item.productId || undefined,
        productNameAdhoc: item.partNumber || undefined,
        productDescriptionAdhoc: item.description || undefined,
        commissionRate: item.commissionPercent?.toString(),
        commissionDiscountRate: item.commissionDiscountPercent?.toString(),
        discountRate: item.discountPercent?.toString(),
        divisionFactor: item.divisor?.toString(),
        endUserId: item.endUserId || undefined,
        leadTime: item.leadTime || undefined,
        note: item.note || undefined,
        orderDetailId: item.orderDetailId || undefined,
        uomId: item.uomId || undefined,
        outsideSplitRates: item.outsideSplitRates?.map(s => ({
          userId: s.userId,
          splitRate: s.splitRate.toString(),
          position: s.position,
        })),
      })),
    };

    try {
      if (isCreateMode) {
        await createInvoiceMutation.mutateAsync(input as CreateInvoiceInput);
      } else {
        await updateInvoiceMutation.mutateAsync(input as UpdateInvoiceInput);
      }
      return true;
    } catch (error) {
      console.error('Failed to save invoice:', error);
      return false;
    }
  }, [localInvoice, isCreateMode, createInvoiceMutation, updateInvoiceMutation]);

  // Use local invoice for display
  const invoice = localInvoice;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>(DEFAULT_ACTIVE_TAB);

  // Header fields state
  const [showHeaderFields, setShowHeaderFields] = useState(true);

  // Line items selection
  const [selectedLineItems, setSelectedLineItems] = useState<Set<string>>(
    new Set()
  );

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // Header dropdowns
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Order tooltip state
  const [orderTooltip, setOrderTooltip] = useState<OrderTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    orders: [],
  });
  const [portalMounted, setPortalMounted] = useState(false);

  // Ensure portal is only rendered on client side
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Version state
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<VersionInfo[]>([
    { version: 1, date: '12/14/2024', isLatest: true },
  ]);

  // View mode state (header dropdown)
  const [viewMode, setViewMode] = useState<ViewMode>('simple');
  const [showViewModeDropdown, setShowViewModeDropdown] = useState(false);

  // PO Number state
  const [poNumber, setPoNumber] = useState<string>('');

  // Outside rep state
  const [invoiceOutsideRep, setInvoiceOutsideRep] = useState<string>('');
  const [splitOutsideCommission, setSplitOutsideCommission] = useState(false);
  const [showOutsideRepSplitsModal, setShowOutsideRepSplitsModal] = useState(false);
  const [outsideRepSplits, setOutsideRepSplits] = useState<RepSplit[]>([]);

  // Inside rep state
  const [invoiceInsideRep, setInvoiceInsideRep] = useState<string>('');
  const [splitInsideCommission, setSplitInsideCommission] = useState(false);
  const [showInsideRepSplitsModal, setShowInsideRepSplitsModal] = useState(false);
  const [insideRepSplits, setInsideRepSplits] = useState<RepSplit[]>([]);

  // Warehouse conversion state
  const [showWarehouseConversionModal, setShowWarehouseConversionModal] = useState(false);
  const [warehouseConversionMode, setWarehouseConversionMode] = useState<'all' | 'selected'>('all');
  const [productsToConvert, setProductsToConvert] = useState<ProductToConvert[]>([]);

  // Commission splits editing state
  const [editingSplits, setEditingSplits] = useState(false);
  const [editedSplits, setEditedSplits] = useState<OrderSplitRate[]>([]);

  // Additional details modal state
  const [showAdditionalDetailsModal, setShowAdditionalDetailsModal] = useState(false);
  const [selectedLineItemForDetails, setSelectedLineItemForDetails] = useState<InvoiceLineItem | null>(null);

  // Check if invoice is connected to an order
  const isConnectedToOrder = useMemo(() => !!invoice?.orderId, [invoice]);

  // Line item credits - maps invoice line item ID to credit info inherited from linked order
  const lineItemCredits = useMemo<Record<string, LineItemCredit>>(() => {
    const credits: Record<string, LineItemCredit> = {};
    // TODO: Implement credits from API data when available
    return credits;
  }, [invoice]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!invoice) {
      return {
        subtotal: 0,
        freight: 0,
        total: 0,
        commission: 0,
        amountPaid: 0,
        balance: 0,
        totalOvg: 0,
        totalEarn: 0,
      };
    }
    return calculateInvoiceTotals(invoice);
  }, [invoice]);

  // Commission split percentage total
  const splitPercentageTotal = useMemo(() => {
    return editedSplits.reduce((sum, s) => sum + s.splitPercentage, 0);
  }, [editedSplits]);

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
    if (!invoice) return;
    const allIds = new Set(invoice.lineItems.map((item) => item.id));
    if (selectedLineItems.size === invoice.lineItems.length) {
      setSelectedLineItems(new Set());
    } else {
      setSelectedLineItems(allIds);
    }
  };

  // Clear selection
  const clearLineItemSelection = () => {
    setSelectedLineItems(new Set());
  };

  // Commission split editing functions
  const startEditingSplits = () => {
    if (invoice) {
      setEditedSplits([...invoice.splitRates]);
      setEditingSplits(true);
    }
  };

  const cancelEditingSplits = () => {
    setEditingSplits(false);
    setEditedSplits([]);
  };

  const updateSplitPercentage = (index: number, newPercentage: number) => {
    const updated = [...editedSplits];
    updated[index] = { ...updated[index], splitPercentage: newPercentage };
    if (invoice) {
      updated[index].commissionAmount =
        (invoice.totalCommission * newPercentage) / 100;
    }
    setEditedSplits(updated);
  };

  const addNewSplit = () => {
    const newSplit: OrderSplitRate = {
      salesRepId: '',
      salesRepName: '',
      splitPercentage: 0,
      commissionAmount: 0,
    };
    setEditedSplits([...editedSplits, newSplit]);
  };

  const removeSplit = (index: number) => {
    setEditedSplits(editedSplits.filter((_, i) => i !== index));
  };

  const updateSplitRep = (index: number, repId: string) => {
    const rep = mockSalesReps.find((r) => r.id === repId);
    if (rep) {
      const updated = [...editedSplits];
      updated[index] = {
        ...updated[index],
        salesRepId: repId,
        salesRepName: rep.name,
      };
      setEditedSplits(updated);
    }
  };

  const saveSplits = () => {
    if (invoice) {
      const totalPercentage = editedSplits.reduce(
        (sum, s) => sum + s.splitPercentage,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Split percentages must total 100%');
        return;
      }

      updateInvoice({ splitRates: editedSplits });
      setEditingSplits(false);
      setEditedSplits([]);
    }
  };

  // Update invoice status
  const updateInvoiceStatus = (status: InvoiceStatus) => {
    updateInvoice({ status });
  };

  // Open additional details modal for a line item
  const openAdditionalDetails = (lineItem: InvoiceLineItem) => {
    setSelectedLineItemForDetails(lineItem);
    setShowAdditionalDetailsModal(true);
  };

  // Save additional details for a line item
  const saveAdditionalDetails = (updates: Partial<InvoiceLineItem>) => {
    if (selectedLineItemForDetails) {
      updateLineItem(selectedLineItemForDetails.id, updates);
    }
    setShowAdditionalDetailsModal(false);
    setSelectedLineItemForDetails(null);
  };

  if (!invoice && !isLoading) {
    return null;
  }

  return {
    // Invoice data
    invoice,
    isLoading,
    error,
    refetch,
    isCreateMode,

    // Invoice mutations
    updateInvoice,
    saveInvoice,
    isSaving: createInvoiceMutation.isPending || updateInvoiceMutation.isPending,

    // Order/Invoice selection
    handleOrderSelect,
    handleInvoiceSelect,
    isOrderLoading,

    // Line items
    updateLineItems,
    addLineItem,
    deleteLineItem,
    updateLineItem,

    // Tab state
    activeTab,
    setActiveTab,

    // Header fields
    showHeaderFields,
    setShowHeaderFields,
    toggleHeaderFields: () => setShowHeaderFields(!showHeaderFields),

    // Line items selection
    selectedLineItems,
    toggleLineItemSelection,
    selectAllLineItems,
    clearLineItemSelection,

    // Column visibility
    visibleColumns,
    setVisibleColumns,
    showColumnsMenu,
    setShowColumnsMenu,

    // Header dropdowns
    showActionsDropdown,
    setShowActionsDropdown,
    showStatusDropdown,
    setShowStatusDropdown,
    showSaveDropdown,
    setShowSaveDropdown,

    // Order tooltip
    orderTooltip,
    setOrderTooltip,
    portalMounted,

    // Version state
    currentVersion,
    setCurrentVersion,
    showVersionDropdown,
    setShowVersionDropdown,
    availableVersions,
    setAvailableVersions,

    // View mode
    viewMode,
    setViewMode,
    showViewModeDropdown,
    setShowViewModeDropdown,

    // PO Number
    poNumber,
    setPoNumber,

    // Outside rep
    invoiceOutsideRep,
    setInvoiceOutsideRep,
    splitOutsideCommission,
    setSplitOutsideCommission,
    showOutsideRepSplitsModal,
    setShowOutsideRepSplitsModal,
    outsideRepSplits,
    setOutsideRepSplits,

    // Inside rep
    invoiceInsideRep,
    setInvoiceInsideRep,
    splitInsideCommission,
    setSplitInsideCommission,
    showInsideRepSplitsModal,
    setShowInsideRepSplitsModal,
    insideRepSplits,
    setInsideRepSplits,

    // Warehouse conversion
    showWarehouseConversionModal,
    setShowWarehouseConversionModal,
    warehouseConversionMode,
    setWarehouseConversionMode,
    productsToConvert,
    setProductsToConvert,

    // Commission splits
    editingSplits,
    setEditingSplits,
    editedSplits,
    setEditedSplits,
    startEditingSplits,
    cancelEditingSplits,
    updateSplitPercentage,
    addNewSplit,
    removeSplit,
    updateSplitRep,
    saveSplits,
    splitPercentageTotal,

    // Additional details modal
    showAdditionalDetailsModal,
    setShowAdditionalDetailsModal,
    selectedLineItemForDetails,
    setSelectedLineItemForDetails,
    openAdditionalDetails,
    saveAdditionalDetails,

    // Computed values
    isConnectedToOrder,
    lineItemCredits,
    totals,

    // Actions
    updateInvoiceStatus,
  };
}

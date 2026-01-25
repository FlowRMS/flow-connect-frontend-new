/**
 * useInvoiceDetailState Hook
 * Main state management hook for invoice detail
 * Manages overall state and integrates sub-hooks
 * Uses real API data and supports order population
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Invoice, OrderSplitRate, InvoiceStatus, InvoiceLineItem as RmsInvoiceLineItem } from '@/lib/types/rms';
import type { TabType, ViewMode, LineItemCredit, OrderTooltipState, VersionInfo, RepSplit, ProductToConvert, ColumnKey, InvoiceLineItem, EditableInvoice } from '../types';
import { mockSalesReps } from '@/lib/data/rms-mock';
import { DEFAULT_ACTIVE_TAB } from '../config/tabsConfig';
import { DEFAULT_VISIBLE_COLUMNS } from '../constants';
import { calculateInvoiceTotals } from '../utils';
import { useInvoiceSettings } from '@/contexts/UserSettingsContext';
import { useLineItemsColumnConfig } from '@/components/shared/hooks/useLineItemsColumnConfig';
import { defaultInvoiceColumnConfig, defaultInvoiceSettings } from '../config/defaultColumnConfig';
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
import { useCustomer } from '@/components/customers/api/useCustomersApi';
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
 * Now uses nested data from the invoice query directly (soldToCustomer, billToCustomer, factory)
 * instead of requiring separate search API calls
 */
function transformApiInvoiceToUi(apiInvoice: ApiInvoice): EditableInvoice {
  // Cast to any to access order per-line-item flags and nested customer data
  const order = apiInvoice.order as any;

  // Transform details to extended line items for editing
  const extendedLineItems: InvoiceLineItem[] = (apiInvoice.details || []).map((detail, index) => {
    // Parse base values first
    const quantity = parseFloat(detail.quantity || '0');
    const unitPrice = parseFloat(detail.unitPrice || '0');
    const divisor = detail.uom?.divisionFactor || parseFloat(detail.divisionFactor || '1');
    const commissionRate = parseFloat(detail.commissionRate || '0');

    // Always calculate derived values from base fields (like quotes does)
    // Don't rely on API total/commission as they may not be populated
    const sellTotal = quantity * unitPrice / divisor;
    const commissionAmount = sellTotal * (commissionRate / 100);

    return {
    id: detail.id,
    orderLineItemId: detail.orderDetailId || '',
    lineNumber: detail.itemNumber || index + 1,
    productId: detail.productId || '',
    partNumber: detail.product?.factoryPartNumber || detail.productNameAdhoc || '',
    custPartNumber: '',
    description: detail.product?.description || detail.productDescriptionAdhoc || '',
    quantity,
    unitPrice,
    uom: detail.uom?.title || null,
    uomId: detail.uom?.id || detail.uomId || null,
    divisor,
    total: sellTotal,
    amount: sellTotal,
    commissionPercent: commissionRate,
    commissionRate: commissionRate,
    commission: commissionAmount,
    commissionAmount: commissionAmount,
    discountPercent: parseFloat(detail.discountRate || '0'),
    discount: detail.discount || 0,
    commissionDiscountPercent: parseFloat(detail.commissionDiscountRate || '0'),
    commissionDiscount: detail.commissionDiscount || 0,
    status: detail.status || 'open',
    leadTime: detail.leadTime || '',
    note: detail.note || '',
    endUserId: detail.endUserId || '',
    endUserName: detail.endUser?.companyName || '', // Use embedded endUser from API response
    orderDetailId: detail.orderDetailId || '',
    invoicedBalance: detail.invoicedBalance || 0,
    outsideSplitRates: (detail.outsideSplitRates || []).map(s => ({
      userId: s.userId || '',
      userName: s.user?.fullName || '',
      splitRate: parseFloat(s.splitRate || '0'),
      position: s.position || 0,
    })),
    insideSplitRates: ((detail as any).insideSplitRates || []).map((s: any) => ({
      userId: s.userId || '',
      userName: s.user?.fullName || '',
      splitRate: parseFloat(s.splitRate || '0'),
      position: s.position || 0,
    })),
  };
  });

  // Get per-line-item flags from order
  const endUserPerLineItem = order?.endUserPerLineItem || false;
  const outsidePerLineItem = order?.outsidePerLineItem || false;
  const insidePerLineItem = order?.insidePerLineItem || false;

  // If NOT per-line-item, grab from first line item for header display
  const firstDetail = apiInvoice.details?.[0];
  const headerEndUserId = !endUserPerLineItem ? (firstDetail?.endUserId || '') : '';
  const headerEndUserName = !endUserPerLineItem ? (firstDetail?.endUser?.companyName || '') : '';

  // Get header-level outside split rates (when NOT per-line-item)
  const headerOutsideSplitRates = !outsidePerLineItem && firstDetail?.outsideSplitRates
    ? firstDetail.outsideSplitRates.map(s => ({
        userId: s.userId || '',
        userName: s.user?.fullName || '',
        splitRate: parseFloat(s.splitRate || '0'),
        position: s.position || 0,
      }))
    : [];

  // Get header-level inside split rates (when NOT per-line-item)
  const headerInsideSplitRates = !insidePerLineItem && (firstDetail as any)?.insideSplitRates
    ? ((firstDetail as any).insideSplitRates || []).map((s: any) => ({
        userId: s.userId || '',
        userName: s.user?.fullName || '',
        splitRate: parseFloat(s.splitRate || '0'),
        position: s.position || 0,
      }))
    : [];

  // Get primary rep (first in split rates or from order)
  const headerOutsideRepId = headerOutsideSplitRates.length > 0 ? headerOutsideSplitRates[0].userId : '';
  const headerOutsideRepName = headerOutsideSplitRates.length > 0 ? headerOutsideSplitRates[0].userName : '';
  const headerInsideRepId = headerInsideSplitRates.length > 0 ? headerInsideSplitRates[0].userId : '';
  const headerInsideRepName = headerInsideSplitRates.length > 0 ? headerInsideSplitRates[0].userName : '';

  // Get customer names directly from nested order data (no need for separate API calls)
  const soldToCustomerName = order?.soldToCustomer?.companyName || '';
  // Bill to customer - we only have the ID from the order, name will be fetched separately
  // If billToCustomerId equals soldToCustomerId, use soldToCustomer name as fallback
  const billToCustomerId = order?.billToCustomerId || '';
  const billToCustomerName = billToCustomerId === order?.soldToCustomerId ? soldToCustomerName : '';

  return {
    id: apiInvoice.id,
    invoiceNumber: apiInvoice.invoiceNumber || '',
    orderId: apiInvoice.orderId || '',
    orderNumber: apiInvoice.order?.orderNumber || '',
    // Use nested soldToCustomer data directly from invoice query
    customerId: apiInvoice.order?.soldToCustomerId || '',
    customerName: soldToCustomerName,
    // Bill To customer - use soldToCustomer name if same customer, otherwise empty (will need separate lookup)
    soldToCustomerId: apiInvoice.order?.soldToCustomerId || '',
    soldToCustomerName: soldToCustomerName,
    billToCustomerId: billToCustomerId,
    billToCustomerName: billToCustomerName,
    // Factory/manufacturer directly from invoice query
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
    // Per-line-item flags from order
    endUserPerLineItem,
    outsidePerLineItem,
    insidePerLineItem,
    // Header-level end user (when not per-line-item) - use embedded endUser from API
    endUserId: headerEndUserId,
    endUserName: headerEndUserName, // Use embedded endUser from API response
    // Header-level reps (when not per-line-item, grabbed from first line item)
    outsideRepId: headerOutsideRepId,
    outsideRepName: headerOutsideRepName,
    outsideSplitRates: headerOutsideSplitRates,
    insideRepId: headerInsideRepId,
    insideRepName: headerInsideRepName,
    insideSplitRates: headerInsideSplitRates,
    // Order-related fields from nested order data
    // Use orderNumber as PO number (customerPo not available on OrderSemiLiteResponse)
    poNumber: apiInvoice.order?.orderNumber || '',
    freightTerms: order?.freightTerms || '',
    shippingTerms: order?.shippingTerms || '',
    // Flag that we've populated from order data in invoice query
    isPopulatedFromOrder: !!apiInvoice.orderId,
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
  const commissionRate = parseFloat(detail.commissionRate || '0');

  // Always calculate derived values from base fields (like quotes does)
  // Don't rely on API total/commission as they may not be populated
  const total = quantity * unitPrice / divisor;
  const commissionAmount = total * (commissionRate / 100);

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
    uom: detail.uom?.title || null,
    uomId: detail.uom?.id || detail.uomId || null,
    divisor: detail.uom?.divisionFactor || divisor,
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
    endUserName: detail.endUser?.companyName || '', // Use embedded endUser from API response
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

  // Get saved invoice settings from context (already cached, no extra API calls)
  const { settings: savedInvoiceSettings, isInitialized: settingsInitialized, saveSettings } = useInvoiceSettings();

  // Track if we've applied column settings to avoid re-applying on every render
  const hasAppliedColumnSettings = useRef(false);

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

  // Track if we've made local edits (for unsaved changes indicator)
  const [hasLocalEdits, setHasLocalEdits] = useState(false);

  // Order population state - for manual order selection in create mode
  // Initialize with initialOrderId from query params if provided
  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || '');

  // For EXISTING invoices: The order data is already nested in the invoice query response
  // (including soldToCustomer, billToCustomer, factory, etc.)
  // We only need to fetch the full order separately for:
  // 1. CREATE mode when user selects an order to populate from
  // 2. When we need more order details than what's in the invoice.order nested object

  // Only fetch order separately if:
  // - It's create mode AND user selected an order, OR
  // - We have an initialOrderId (creating invoice from order page)
  const needsSeparateOrderFetch = isCreateMode && (selectedOrderId || initialOrderId);
  const orderIdToFetch = needsSeparateOrderFetch ? (selectedOrderId || initialOrderId || null) : null;
  const { data: linkedOrder, isLoading: isOrderLoading } = useOrder(orderIdToFetch);

  // Factory details are now included in the invoice query (factory { id title ... })
  // No separate fetch needed for existing invoices
  // Only fetch factory separately for create mode when populating from order
  const factoryIdToFetch = needsSeparateOrderFetch ? linkedOrder?.factoryId : null;
  const { data: linkedFactory } = useFactory(factoryIdToFetch || '');

  // Fetch end user customer details when we have an endUserId but no endUserName
  // With embedded endUser in the API response, this should rarely be needed
  const endUserIdToFetch = (localInvoice?.endUserId && !localInvoice?.endUserName) ? localInvoice.endUserId : null;
  const { data: endUserCustomer } = useCustomer(endUserIdToFetch || undefined);

  // Fetch bill to customer details when we have a billToCustomerId that differs from soldToCustomerId
  // (if they're the same, we already have the name from soldToCustomer)
  const billToCustomerIdToFetch = localInvoice?.billToCustomerId &&
    localInvoice.billToCustomerId !== localInvoice.soldToCustomerId
    ? localInvoice.billToCustomerId
    : null;
  const { data: billToCustomer } = useCustomer(billToCustomerIdToFetch || undefined);

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

  // Track if we've populated from the current order to avoid re-running unnecessarily
  const [populatedFromOrderId, setPopulatedFromOrderId] = useState<string | null>(null);

  // When order data is loaded (in CREATE mode), populate the invoice with order fields
  // For EXISTING invoices, order data is already nested in the invoice query response
  // and populated in transformApiInvoiceToUi, so this useEffect only runs for CREATE mode
  useEffect(() => {
    // Skip if not in create mode (existing invoices get order data from invoice query)
    if (!isCreateMode) return;
    // Skip if no order data, no local invoice, or already populated from this order
    if (!linkedOrder || !localInvoice) return;
    if (populatedFromOrderId === linkedOrder.id) return;

    // Cast to any to access all API-specific fields
    const order = linkedOrder as any;

    // For existing invoices with orderId, don't overwrite line items
    // Only overwrite line items if this is a new invoice being created from an order
    const isNewInvoiceFromOrder = isCreateMode && selectedOrderId;

    // Transform order line items to extended InvoiceLineItem format for editing
    // Only do this for new invoices being created from an order
    let extendedLineItems = localInvoice.lineItems;
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
        uom: item.uom?.title || item.uom || null,
        uomId: item.uom?.id || item.uomId || null,
        divisor: item.uom?.divisionFactor || (typeof item.divisionFactor === 'string' ? parseFloat(item.divisionFactor) : (item.divisor || 1)),
        total: item.total || item.extendedPrice || item.amount || 0,
        amount: item.total || item.extendedPrice || item.amount || 0,
        commissionPercent: typeof item.commissionRate === 'string' ? parseFloat(item.commissionRate) * 100 : ((item.commissionRate ?? 0.08) * 100),
        commissionRate: typeof item.commissionRate === 'string' ? parseFloat(item.commissionRate) : (item.commissionRate ?? 0.08),
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
        outsideSplitRates: (item.outsideSplitRates || []).map((s: any) => ({
          userId: s.userId || '',
          userName: s.user?.fullName || '',
          splitRate: parseFloat(s.splitRate || '0'),
          position: s.position || 0,
        })),
        insideSplitRates: (item.insideSplitRates || []).map((s: any) => ({
          userId: s.userId || '',
          userName: s.user?.fullName || '',
          splitRate: parseFloat(s.splitRate || '0'),
          position: s.position || 0,
        })),
      }));
    }

    // Always populate order-related fields (Sold To, Bill To, PO#, Job, Terms, Reps)
    // Factory is now fetched directly from order query with factory { id title }

    // When endUserPerLineItem is false, get end user from first line item since all line items share the same end user
    // First check order details for the end user ID
    const firstOrderDetail = (order.details || order.lineItems)?.[0];
    const endUserIdFromOrderLineItem = firstOrderDetail?.endUserId || '';

    setLocalInvoice(prev => {
      if (!prev) return prev;

      // Also check the current invoice's line items for end user ID
      const firstInvoiceDetail = prev.lineItems?.[0];
      const endUserIdFromLineItem = firstInvoiceDetail?.endUserId || endUserIdFromOrderLineItem || '';

      return {
        ...prev,
        // Order reference
        orderId: linkedOrder.id,
        orderNumber: linkedOrder.orderNumber || '',

        // Factory (Manufacturer) - use from order.factory if available
        manufacturerId: prev.manufacturerId || order.factoryId || '',
        manufacturerName: prev.manufacturerName || order.factory?.title || '',

        // Customers
        customerId: order.soldToCustomerId || prev.customerId || '',
        customerName: order.soldToCustomer?.companyName || prev.customerName || '',
        soldToCustomerId: order.soldToCustomerId || '',
        soldToCustomerName: order.soldToCustomer?.companyName || '',
        billToCustomerId: order.billToCustomerId || order.soldToCustomerId || '',
        billToCustomerName: order.billToCustomer?.companyName || order.soldToCustomer?.companyName || '',
        // When endUserPerLineItem is false, get end user from first line item (all line items share the same end user)
        endUserId: order.endUserPerLineItem ? '' : (order.endUserId || endUserIdFromLineItem || prev.endUserId || ''),
        endUserName: order.endUserPerLineItem ? '' : (order.endUser?.companyName || prev.endUserName || ''),

        // Order reference fields - use orderNumber as PO number
        poNumber: linkedOrder.orderNumber || '',
        jobId: order.job?.id || '',
        jobName: order.job?.jobName || '',

        // Terms (from order) - freightTerms/shippingTerms are strings on Order
        paymentTerms: order.paymentTerm?.title || order.paymentTerms || '',
        paymentTermsId: order.paymentTermId || '',
        freightTerms: order.freightTerms || '',
        freightTermsId: order.freightTermId || '',
        shippingTerms: order.shippingTerms || '',
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

    // Mark that we've populated from this order
    setPopulatedFromOrderId(linkedOrder.id);
  }, [linkedOrder, localInvoice, isCreateMode, selectedOrderId, populatedFromOrderId]);

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

  // When end user customer data is loaded, populate the end user name
  useEffect(() => {
    if (endUserCustomer && localInvoice && localInvoice.endUserId && !localInvoice.endUserName) {
      setLocalInvoice(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          endUserName: endUserCustomer.companyName || '',
        };
      });
    }
  }, [endUserCustomer, localInvoice?.endUserId, localInvoice?.endUserName]);

  // When bill to customer data is loaded, populate the bill to customer name
  useEffect(() => {
    if (billToCustomer && localInvoice && localInvoice.billToCustomerId && !localInvoice.billToCustomerName) {
      setLocalInvoice(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          billToCustomerName: billToCustomer.companyName || '',
        };
      });
    }
  }, [billToCustomer, localInvoice?.billToCustomerId, localInvoice?.billToCustomerName]);

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
    if (!isCreateMode) setHasLocalEdits(true);
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, [isCreateMode]);

  // Update line items
  const updateLineItems = useCallback((lineItems: InvoiceLineItem[]) => {
    if (!isCreateMode) setHasLocalEdits(true);
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return { ...prev, lineItems };
    });
  }, [isCreateMode]);

  // Add new line item
  const addLineItem = useCallback(() => {
    if (!isCreateMode) setHasLocalEdits(true);
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
        uom: null,
        uomId: null,
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
  }, [isCreateMode]);

  // Delete line item
  const deleteLineItem = useCallback((lineItemId: string) => {
    if (!isCreateMode) setHasLocalEdits(true);
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.filter(l => l.id !== lineItemId)
      };
    });
  }, [isCreateMode]);

  // Update single line item
  const updateLineItem = useCallback((lineItemId: string, updates: Partial<InvoiceLineItem>) => {
    if (!isCreateMode) setHasLocalEdits(true);
    setLocalInvoice(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map(l =>
          l.id === lineItemId ? { ...l, ...updates } : l
        ),
      };
    });
  }, [isCreateMode]);

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
          splitRate: Number(s.splitRate),
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
      // Clear the unsaved changes state after successful save
      setHasLocalEdits(false);
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

  // Column configuration - managed by generic hook with Settings API persistence
  const { columnConfig, setColumnConfig } = useLineItemsColumnConfig({
    settings: savedInvoiceSettings,
    isInitialized: settingsInitialized,
    saveSettings,
    defaultColumnConfig: defaultInvoiceColumnConfig,
    defaultSettings: defaultInvoiceSettings,
    getColumnConfig: (s) => s.columnConfig,
    setColumnConfig: (s, config) => ({ ...s, columnConfig: config }),
  });

  // Derive visibleColumns and pinnedColumns from columnConfig
  const visibleColumns = useMemo(() => {
    return new Set<ColumnKey>(
      columnConfig.filter(col => col.visible).map(col => col.key as ColumnKey)
    );
  }, [columnConfig]);

  const pinnedColumns = useMemo(() => {
    return new Set<ColumnKey>(
      columnConfig.filter(col => col.visible && col.pinned).map(col => col.key as ColumnKey)
    );
  }, [columnConfig]);

  // Columns modal state
  const [showColumnsModal, setShowColumnsModal] = useState(false);

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

  // Live update additional details for a line item (without closing modal)
  const liveUpdateAdditionalDetails = (updates: Partial<InvoiceLineItem>) => {
    // Update the selected line item so the modal stays in sync
    setSelectedLineItemForDetails((prev) => prev ? { ...prev, ...updates } : prev);

    // Use functional update pattern to avoid stale closure issues
    // This reads from prev instead of the closure-captured selectedLineItemForDetails
    setLocalInvoice((prevInvoice) => {
      if (!prevInvoice) return prevInvoice;

      // Get the line item ID from the current selectedLineItemForDetails state
      const lineItemIdToUpdate = selectedLineItemForDetails?.id;
      if (!lineItemIdToUpdate) return prevInvoice;

      return {
        ...prevInvoice,
        lineItems: prevInvoice.lineItems.map((li) =>
          li.id === lineItemIdToUpdate ? { ...li, ...updates } : li
        ),
      };
    });

    if (!isCreateMode) setHasLocalEdits(true);
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

    // Unsaved changes tracking
    hasChanges: isCreateMode || hasLocalEdits,
    resetChanges: () => setHasLocalEdits(false),

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

    // Column configuration
    columnConfig,
    setColumnConfig,
    visibleColumns,
    pinnedColumns,
    showColumnsModal,
    setShowColumnsModal,
    openColumnsModal: () => setShowColumnsModal(true),
    closeColumnsModal: () => setShowColumnsModal(false),
    isPinned: (colKey: ColumnKey) => pinnedColumns.has(colKey),
    getPinnedColumnStyle: (colKey: ColumnKey, isHeader: boolean = false): React.CSSProperties => {
      if (!pinnedColumns.has(colKey)) return {};

      const fixedLeftOffset = 40; // checkbox width

      const allColumns: ColumnKey[] = [
        'partNumber', 'custPartNumber', 'description', 'uom', 'divisor', 'unitPrice',
        'quantity', 'sellTotal', 'commissionPercent', 'commission', 'commissionTotal',
        'linkedOrder', 'linkedCheck', 'percentOver', 'commissionAmount',
        'ovgPercent', 'ovgAmount', 'earnPercent', 'earnAmount',
      ];

      const visiblePinnedColumns = allColumns.filter(
        (key) => {
          const col = columnConfig.find((c) => c.key === key);
          return col?.visible && col?.pinned;
        }
      );

      const indexInPinned = visiblePinnedColumns.indexOf(colKey);
      if (indexInPinned === -1) return {};

      const columnWidths: Record<ColumnKey, number> = {
        partNumber: 150,
        custPartNumber: 150,
        description: 300,
        uom: 80,
        divisor: 80,
        unitPrice: 120,
        quantity: 100,
        sellTotal: 120,
        commissionPercent: 130,
        commission: 120,
        commissionTotal: 150,
        linkedOrder: 120,
        linkedCheck: 120,
        percentOver: 100,
        commissionAmount: 120,
        ovgPercent: 100,
        ovgAmount: 120,
        earnPercent: 110,
        earnAmount: 120,
      };

      let leftOffset = 0 //fixedLeftOffset;
      for (let i = 0; i < indexInPinned; i++) {
        const prevCol = visiblePinnedColumns[i];
        const colWidth = columnWidths[prevCol] || 120;
        leftOffset += colWidth - 12;
      }

      return {
        position: 'sticky',
        left: `${leftOffset}px`,
        zIndex: 10,
        backgroundColor: isHeader ? '#f9fafb' : 'white',
      };
    },

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
    liveUpdateAdditionalDetails,

    // Computed values
    isConnectedToOrder,
    lineItemCredits,
    totals,

    // Actions
    updateInvoiceStatus,
  };
}

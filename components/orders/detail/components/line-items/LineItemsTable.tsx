/**
 * LineItemsTable Component
 * Main line items table with all columns, rows, and bulk actions
 * Supports editable cells and adding new line items like quotes-v2
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Order, OrderLineItem } from '@/lib/types/rms';
import type { ColumnKey, ViewMode } from '../../types';
import { BulkActionsBar } from './BulkActionsBar';
import { LineItemsTableHeader } from './LineItemsTableHeader';
import { useProductSearch, useFactorySearch, useCustomerSearch, useProductCpns, useProductUoms, getProductCpnByCustomer, listProductPricingTiers } from '../../../api';
import type { ProductPricingTierResult } from '@/components/quotes/api/quotesApi';
import { fetchProductById } from '@/components/products/api/productsApi';
import { formatCurrency } from '../../utils';

// Type for available pricing options for a product
interface PricingOptions {
  productPrice: number | null; // Default product price
  cpnPrice: number | null; // Customer-specific price (CPN)
  cpnCommissionRate: number | null; // Commission rate from CPN
  tiers: ProductPricingTierResult[]; // Volume pricing tiers
}

type EditableColumnKey = 'partNumber' | 'custPartNumber' | 'description' | 'uom' | 'divisor' | 'quantity' | 'unitPrice' | 'commissionPercent' | 'manufacturer' | 'endUser';

// Type for rep split rates passed from parent
interface RepSplitRateInfo {
  id: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

interface LineItemsTableProps {
  order: Order;
  selectedLineItems: Set<string>;
  onToggleLineItemSelection: (id: string) => void;
  onToggleAllLineItems: () => void;
  onClearSelection: () => void;
  visibleColumns: Set<ColumnKey>;
  viewMode: ViewMode;
  isPinned: (column: ColumnKey) => boolean;
  getPinnedColumnStyle: (column: ColumnKey) => React.CSSProperties;
  lineItemAcknowledgements: Record<string, any>;
  lineItemCredits: Record<string, any>;
  getLinkedInvoicesForLineItem: (item: any, orderId: string, invoices: any[]) => any[];
  getLinkedChecksForInvoice: (invoiceId: string, checks: any[]) => any[];
  getLineShipStatus: (item: any, invoices: any[]) => { label: string; color: string };
  mockInvoices: any[];
  mockChecks: any[];
  setInvoiceTooltip: React.Dispatch<React.SetStateAction<any>>;
  onSetOverage: () => void;
  onLockOverage: () => void;
  onUnlockOverage: () => void;
  onSetEndUser: () => void;
  onSetOutsideRepSplits: () => void;
  onConvertToWarehouse: () => void;
  onAddCredit: () => void;
  onAddAcknowledgement: () => void;
  onDeleteLines: () => void;
  onUpdateLineItems?: (items: OrderLineItem[]) => void;
  showEndUserPerLine?: boolean;
  showOutsideRepPerLine?: boolean;
  showInsideRepPerLine?: boolean;
  onOpenAdditionalDetails?: (item: OrderLineItem) => void;
  // Current reps for inheriting to new line items
  currentOutsideReps?: RepSplitRateInfo[];
  currentInsideReps?: RepSplitRateInfo[];
}

export function LineItemsTable({
  order,
  selectedLineItems,
  onToggleLineItemSelection,
  onToggleAllLineItems,
  onClearSelection,
  visibleColumns,
  viewMode,
  isPinned,
  getPinnedColumnStyle,
  lineItemAcknowledgements,
  lineItemCredits,
  getLinkedInvoicesForLineItem,
  getLinkedChecksForInvoice,
  getLineShipStatus,
  mockInvoices,
  mockChecks,
  setInvoiceTooltip,
  onSetOverage,
  onLockOverage,
  onUnlockOverage,
  onSetEndUser,
  onSetOutsideRepSplits,
  onConvertToWarehouse,
  onAddCredit,
  onAddAcknowledgement,
  onDeleteLines,
  onUpdateLineItems,
  showEndUserPerLine = false,
  showOutsideRepPerLine = false,
  showInsideRepPerLine = false,
  onOpenAdditionalDetails,
  currentOutsideReps,
  currentInsideReps,
}: LineItemsTableProps) {
  // Editable state
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: EditableColumnKey } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{ itemId: string; column: EditableColumnKey; position: { top: number; left: number } } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Store available pricing options per product ID (keyed by productId)
  const [productPricingOptions, setProductPricingOptions] = useState<Record<string, PricingOptions>>({});
  // Track which line items have been fetched for pricing options
  const fetchedPricingOptionsRef = React.useRef<Set<string>>(new Set());
  // Pricing dropdown state
  const [pricingDropdownOpen, setPricingDropdownOpen] = useState<{ itemId: string; position: { top: number; left: number } } | null>(null);
  // Track pricing source for each line item: 'product' | 'cpn' | 'manual' | 'tier:X-Y'
  const [lineItemPricingSource, setLineItemPricingSource] = useState<Record<string, string>>({});

  // Track previous customerId to detect changes and update pricing sources
  const prevCustomerIdRef = React.useRef<string | undefined>(order.customerId);

  // When customer changes, clear the cache so CPNs are refetched
  useEffect(() => {
    if (prevCustomerIdRef.current !== order.customerId) {
      // Customer changed - clear the cache to force refetch of CPN data
      fetchedPricingOptionsRef.current.clear();
      setProductPricingOptions({});
      prevCustomerIdRef.current = order.customerId;
    }
  }, [order.customerId]);

  // Fetch pricing options for a product (CPN, tiers, product price) - NEVER changes unit price
  const fetchPricingOptionsForProduct = React.useCallback(async (productId: string, lineItemId: string, currentUnitPrice: number) => {
    // Skip if already fetched
    if (fetchedPricingOptionsRef.current.has(lineItemId)) return;
    fetchedPricingOptionsRef.current.add(lineItemId);

    try {
      const [cpnResult, tiersResult, productResult] = await Promise.all([
        order.customerId ? getProductCpnByCustomer(productId, order.customerId).catch(() => null) : Promise.resolve(null),
        listProductPricingTiers(productId).catch(() => []),
        fetchProductById(productId).catch(() => null)
      ]);

      const options: PricingOptions = {
        productPrice: productResult?.unitPrice ? parseFloat(String(productResult.unitPrice)) : null,
        cpnPrice: cpnResult?.unitPrice ? parseFloat(cpnResult.unitPrice) : null,
        cpnCommissionRate: cpnResult?.commissionRate ? parseFloat(cpnResult.commissionRate) : null,
        tiers: tiersResult || []
      };

      setProductPricingOptions(prev => ({ ...prev, [productId]: options }));

      // Determine which pricing source matches the current unit price (for dropdown display)
      let determinedSource = 'product';

      if (options.cpnPrice !== null && Math.abs(currentUnitPrice - options.cpnPrice) < 0.01) {
        determinedSource = 'cpn';
      } else if (options.tiers.length > 0) {
        const lineItem = (order.lineItems || []).find(li => li.id === lineItemId);
        const qty = lineItem?.quantity || 1;
        const matchingTier = options.tiers.find(tier => qty >= tier.quantityLow && qty <= tier.quantityHigh);
        const matchingTierPrice = matchingTier ? (typeof matchingTier.unitPrice === 'string' ? parseFloat(matchingTier.unitPrice) : matchingTier.unitPrice) : null;
        if (matchingTier && matchingTierPrice !== null && Math.abs(currentUnitPrice - matchingTierPrice) < 0.01) {
          determinedSource = `tier:${matchingTier.quantityLow}-${matchingTier.quantityHigh}`;
        } else if (options.cpnPrice !== null || options.tiers.length > 0) {
          // Has CPN or tiers but price doesn't match any = manual
          if (options.productPrice !== null && Math.abs(currentUnitPrice - options.productPrice) < 0.01) {
            determinedSource = 'product';
          } else {
            determinedSource = 'manual';
          }
        }
      } else if (options.productPrice !== null && Math.abs(currentUnitPrice - options.productPrice) < 0.01) {
        determinedSource = 'product';
      } else if (options.cpnPrice !== null || options.productPrice !== null) {
        // Has pricing options but doesn't match = manual
        determinedSource = 'manual';
      }

      setLineItemPricingSource(prev => ({ ...prev, [lineItemId]: determinedSource }));
    } catch (err) {
      console.error('Error fetching pricing options:', err);
    }
  }, [order.customerId, order.lineItems]);

  // Fetch pricing options for all line items with products on initial load
  useEffect(() => {
    (order.lineItems || []).forEach(li => {
      if (li.productId && !fetchedPricingOptionsRef.current.has(li.id)) {
        fetchPricingOptionsForProduct(li.productId, li.id, li.unitPrice);
      }
    });
  }, [order.lineItems, fetchPricingOptionsForProduct]);

  // Handle pricing source selection from dropdown
  const handlePricingSourceSelect = React.useCallback((itemId: string, source: string, price: number, commissionRate?: number) => {
    const item = (order.lineItems || []).find(li => li.id === itemId);
    if (!item) return;

    const qty = item.quantity || 1;
    const divisor = item.divisor || 1;
    const newCommissionRate = commissionRate ?? item.commissionRate ?? 8;
    const extendedPrice = qty * price / divisor;
    const commissionAmount = extendedPrice * (newCommissionRate / 100);

    if (onUpdateLineItems) {
      const updatedItems = (order.lineItems || []).map(li => li.id === itemId ? {
        ...li,
        unitPrice: price,
        commissionRate: newCommissionRate,
        extendedPrice,
        commissionAmount,
      } : li);
      onUpdateLineItems(updatedItems);
    }

    setLineItemPricingSource(prev => ({ ...prev, [itemId]: source }));
    setPricingDropdownOpen(null);
  }, [order.lineItems, onUpdateLineItems]);

  // Close pricing dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (pricingDropdownOpen) {
        setPricingDropdownOpen(null);
      }
    };
    if (pricingDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [pricingDropdownOpen]);

  // Debounce search - trigger immediately on empty (dropdown open)
  useEffect(() => {
    if (searchQuery === '') {
      setDebouncedSearch('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine dropdown type
  const isProductDropdown = dropdownOpen && ['partNumber', 'description'].includes(dropdownOpen.column);
  const isFactoryDropdown = dropdownOpen?.column === 'manufacturer';
  const isCpnDropdown = dropdownOpen?.column === 'custPartNumber';
  const isUomDropdown = dropdownOpen?.column === 'uom';
  const isEndUserDropdown = dropdownOpen?.column === 'endUser' && showEndUserPerLine;

  // Get current line item's productId for CPN search
  const currentLineItem = dropdownOpen ? (order.lineItems || []).find(li => li.id === dropdownOpen.itemId) : null;
  const currentProductId = currentLineItem?.productId;

  // Product search
  const { data: productResults = [], isLoading: productsLoading } = useProductSearch(
    debouncedSearch,
    order.manufacturerId,
    isProductDropdown ?? false
  );

  // Factory/Manufacturer search
  const { data: factoryResults = [], isLoading: factoriesLoading } = useFactorySearch(
    debouncedSearch,
    isFactoryDropdown ?? false
  );

  // CPN (Customer Part Number) search - requires a product to be selected first
  const { data: cpnResults = [], isLoading: cpnsLoading } = useProductCpns(
    currentProductId || '',
    isCpnDropdown && !!currentProductId
  );

  // End user (customer) search
  const { data: endUserResults = [], isLoading: endUsersLoading } = useCustomerSearch(
    debouncedSearch,
    isEndUserDropdown ?? false
  );

  // UOM (Unit of Measure) - fetch all when UOM dropdown is open
  const { data: uomResults = [], isLoading: uomsLoading } = useProductUoms(
    undefined,
    isUomDropdown ?? false
  );

  // Update line item
  const updateLineItem = (id: string, updates: Partial<OrderLineItem>) => {
    if (onUpdateLineItems) {
      const updatedItems = (order.lineItems || []).map((li) =>
        li.id === id ? { ...li, ...updates } : li
      );
      onUpdateLineItems(updatedItems);
    }
  };

  // Add new line item
  const addLineItem = () => {
    if (onUpdateLineItems) {
      const lineItems = order.lineItems || [];
      const newItem: OrderLineItem = {
        id: `li-${Date.now()}`,
        lineNumber: lineItems.length + 1,
        partNumber: '',
        description: '',
        uom: null,
        uomId: null,
        divisor: 1,
        quantity: 1,
        quantityShipped: 0,
        quantityInvoiced: 0,
        quantityCredited: 0,
        unitPrice: 0,
        extendedPrice: 0,
        commissionRate: 8, // Stored as whole percentage (8 for 8%)
        commissionAmount: 0,
        productId: '',
        isCancelled: false,
        isConsignment: false,
        status: 'open',
        // Inherit outside reps if per-line-item setting is enabled
        outsideSplitRates: showOutsideRepPerLine && currentOutsideReps && currentOutsideReps.length > 0
          ? currentOutsideReps.map((rep, idx) => ({
              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
              userId: rep.userId,
              userName: rep.userName,
              splitRate: rep.splitRate,
              position: idx + 1,
            }))
          : undefined,
        // Inherit inside reps if per-line-item setting is enabled
        insideSplitRates: showInsideRepPerLine && currentInsideReps && currentInsideReps.length > 0
          ? currentInsideReps.map((rep, idx) => ({
              id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
              userId: rep.userId,
              userName: rep.userName,
              splitRate: rep.splitRate,
              position: idx + 1,
            }))
          : undefined,
      };
      onUpdateLineItems([...lineItems, newItem]);
    }
  };

  // Remove a single line item
  const removeLineItem = (id: string) => {
    if (onUpdateLineItems) {
      const updatedItems = (order.lineItems || []).filter((li) => li.id !== id);
      onUpdateLineItems(updatedItems);
      // Also remove from selection if selected
      if (selectedLineItems.has(id)) {
        onToggleLineItemSelection(id);
      }
    }
  };

  // Handle cell click - open dropdown or start inline edit
  const handleCellClick = (itemId: string, column: EditableColumnKey, e: React.MouseEvent) => {
    // custPartNumber and description are read-only (populated when product is selected)
    // partNumber, manufacturer, and uom are dropdown columns
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'manufacturer', 'uom'];
    if (showEndUserPerLine) {
      dropdownColumns.push('endUser');
    }
    // Read-only columns - no interaction
    const readOnlyColumns: EditableColumnKey[] = ['custPartNumber', 'description'];
    if (readOnlyColumns.includes(column)) {
      return; // Do nothing for read-only columns
    }
    if (dropdownColumns.includes(column)) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownOpen({
        itemId,
        column,
        position: { top: rect.bottom + 4, left: rect.left },
      });
      setSearchQuery('');
    } else {
      setEditingCell({ itemId, column });
    }
  };

  // Handle dropdown selection for products
  // When selecting a product, use PRODUCT price by default (user can select CPN/Tier via dropdown)
  const handleProductSelect = async (itemId: string, product: any) => {
    const item = (order.lineItems || []).find(li => li.id === itemId);
    if (!item) return;

    const quantity = item.quantity || 1;
    let divisor = product.defaultDivisor || item.divisor || 1;

    // Default values from product - this is what we use for new product selection
    let unitPrice = product.unitPrice || 0;
    let commissionRate = product.defaultCommissionRate || 8;

    // Close dropdown first
    setDropdownOpen(null);
    setSearchQuery('');

    // Fetch CPN, pricing tiers, and full product details in parallel
    let custPartNumber = '';
    let uomId: string | undefined;
    let uomTitle: string | undefined;
    let manufacturerId: string | undefined;
    let manufacturerName: string | undefined;
    const soldToCustomerId = order.customerId;

    // Track pricing source for UI - default to 'product'
    let pricingSource = 'product';

    if (product.id) {
      const [cpnResult, tiersResult, fullProduct] = await Promise.all([
        soldToCustomerId
          ? getProductCpnByCustomer(product.id, soldToCustomerId).catch(() => null)
          : Promise.resolve(null),
        listProductPricingTiers(product.id).catch(() => []),
        fetchProductById(product.id).catch(() => null)
      ]);

      // Extract factory and UOM from full product details
      if (fullProduct) {
        manufacturerId = fullProduct.factory?.id;
        manufacturerName = fullProduct.factory?.title;
        uomId = fullProduct.uom?.id;
        uomTitle = fullProduct.uom?.title;
        if (fullProduct.uom?.divisionFactor) {
          divisor = fullProduct.uom.divisionFactor;
        }
      }

      // Store pricing options for this product (for dropdown)
      const options: PricingOptions = {
        productPrice: product.unitPrice || null,
        cpnPrice: cpnResult?.unitPrice ? parseFloat(cpnResult.unitPrice) : null,
        cpnCommissionRate: cpnResult?.commissionRate ? parseFloat(cpnResult.commissionRate) : null,
        tiers: tiersResult || []
      };
      setProductPricingOptions(prev => ({ ...prev, [product.id]: options }));
      fetchedPricingOptionsRef.current.add(itemId);

      // Get CPN customer part number (but NOT the price - user can select via dropdown)
      if (cpnResult) {
        custPartNumber = cpnResult.customerPartNumber || '';
        // Use CPN commission rate if available
        if (cpnResult.commissionRate) {
          commissionRate = parseFloat(cpnResult.commissionRate);
        }
      }

      // For NEW product selection, use product price as default
      // User can change to CPN/Tier via dropdown
      // pricingSource stays 'product'

      setLineItemPricingSource(prev => ({
        ...prev,
        [itemId]: pricingSource
      }));
    }

    // Calculate derived values with product pricing
    const extendedPrice = quantity * unitPrice / divisor;
    const commissionAmount = extendedPrice * (commissionRate / 100);

    // Single atomic update with product data
    if (onUpdateLineItems) {
      const updatedItems = (order.lineItems || []).map((li) =>
        li.id === itemId ? {
          ...li,
          productId: product.id,
          partNumber: product.factoryPartNumber || '',
          description: product.description || '',
          custPartNumber: custPartNumber,
          unitPrice: unitPrice,
          divisor: divisor,
          commissionRate: commissionRate,
          extendedPrice: extendedPrice,
          commissionAmount: commissionAmount,
          manufacturerId: manufacturerId || li.manufacturerId,
          manufacturerName: manufacturerName || li.manufacturerName,
          uomId: uomId || li.uomId,
          uom: uomTitle || li.uom,
        } : li
      );
      onUpdateLineItems(updatedItems);
    }
  };

  // Handle dropdown selection for CPN
  const handleCpnSelect = (itemId: string, cpn: any) => {
    updateLineItem(itemId, {
      custPartNumber: cpn.customerPartNumber,
    });
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle dropdown selection for factories
  const handleFactorySelect = (itemId: string, factory: any) => {
    updateLineItem(itemId, {
      manufacturerId: factory.id,
      manufacturerName: factory.title,
    } as any);
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle dropdown selection for end users
  const handleEndUserSelect = (itemId: string, customer: any) => {
    updateLineItem(itemId, {
      endUserId: customer.id,
      endUserName: customer.companyName,
    } as any);
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle dropdown selection for UOM
  const handleUomSelect = (itemId: string, uom: any) => {
    const item = (order.lineItems || []).find(li => li.id === itemId);
    if (!item) return;

    const divisor = uom.divisionFactor || 1;
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice || 0;
    const extendedPrice = quantity * unitPrice / divisor;
    const commissionRate = item.commissionRate ?? 8; // Stored as whole percentage

    updateLineItem(itemId, {
      uomId: uom.id,
      uom: uom.title,
      divisor: divisor,
      extendedPrice: extendedPrice,
      // Commission rate is stored as whole percentage (e.g., 8 for 8%), convert to decimal for calculation
      commissionAmount: extendedPrice * (commissionRate / 100),
    } as any);
    setDropdownOpen(null);
    setSearchQuery('');
  };

  // Handle cell value change
  const handleCellChange = (itemId: string, column: EditableColumnKey, value: string) => {
    const item = (order.lineItems || []).find((li) => li.id === itemId);
    if (!item) return;

    const updates: Partial<OrderLineItem> = {};

    switch (column) {
      case 'quantity': {
        const qty = parseInt(value) || 1;
        // When quantity changes, recalculate with current unit price
        // User can change pricing source via dropdown if they want tier pricing
        const unitPrice = item.unitPrice ?? 0;
        const divisor = item.divisor || 1;
        const extendedPrice = qty * unitPrice / divisor;
        const commissionRate = item.commissionRate ?? 8;
        updates.quantity = qty;
        updates.extendedPrice = extendedPrice;
        updates.commissionAmount = extendedPrice * (commissionRate / 100);
        break;
      }
      case 'unitPrice': {
        const price = parseFloat(value.replace(/[$,]/g, '')) || 0;
        const divisor = item.divisor || 1;
        const extendedPrice = item.quantity * price / divisor;
        updates.unitPrice = price;
        updates.extendedPrice = extendedPrice;
        updates.commissionAmount = extendedPrice * ((item.commissionRate ?? 8) / 100);
        // Mark as manual override - user typed their own price
        setLineItemPricingSource(prev => ({
          ...prev,
          [itemId]: 'manual'
        }));
        break;
      }
      case 'commissionPercent': {
        const pct = parseFloat(value) || 0;
        updates.commissionRate = pct;
        // Commission rate is stored as whole percentage (e.g., 8 for 8%), convert to decimal for calculation
        updates.commissionAmount = item.extendedPrice * (pct / 100);
        break;
      }
      case 'divisor':
        updates.divisor = parseFloat(value) || 1;
        break;
      case 'custPartNumber':
        updates.custPartNumber = value;
        break;
    }

    updateLineItem(itemId, updates);
    setEditingCell(null);
  };

  // Render editable cell
  const renderEditableCell = (item: OrderLineItem, column: EditableColumnKey, align: 'left' | 'center' | 'right' = 'left') => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.column === column;
    // partNumber, manufacturer, and uom are dropdown columns
    // custPartNumber and description are read-only (populated when product is selected)
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'manufacturer', 'uom'];
    if (showEndUserPerLine) {
      dropdownColumns.push('endUser');
    }
    const isDropdownColumn = dropdownColumns.includes(column);
    // custPartNumber and description are read-only display columns
    const isReadOnlyDisplayColumn = ['custPartNumber', 'description'].includes(column);

    let displayValue = '';
    let editValue = '';

    switch (column) {
      case 'partNumber':
        displayValue = item.partNumber || 'Select...';
        break;
      case 'custPartNumber':
        // Read-only - populated when product is selected
        displayValue = item.custPartNumber || '—';
        break;
      case 'description':
        // Read-only - populated when product is selected
        displayValue = item.description || '—';
        break;
      case 'manufacturer':
        displayValue = (item as any).manufacturerName || 'Select...';
        break;
      case 'endUser':
        displayValue = (item as any).endUserName || (showEndUserPerLine ? 'Select...' : '—');
        break;
      case 'uom':
        displayValue = item.uom || 'Select...';
        break;
      case 'divisor':
        displayValue = String(item.divisor || 1);
        editValue = String(item.divisor || 1);
        break;
      case 'quantity':
        displayValue = String(item.quantity || 0);
        editValue = String(item.quantity || 0);
        break;
      case 'unitPrice':
        displayValue = formatCurrency(item.unitPrice || 0);
        editValue = String(item.unitPrice || 0);
        break;
      case 'commissionPercent':
        displayValue = `${Number(item.commissionRate || 0).toFixed(1)}%`;
        editValue = Number(item.commissionRate || 0).toFixed(1);
        break;
    }

    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    // Read-only display columns (custPartNumber and description)
    // These show the value but can't be edited - they're populated when product is selected
    if (isReadOnlyDisplayColumn) {
      return (
        <span className={`px-2 py-1 ${alignClass} ${!displayValue || displayValue === '—' ? 'text-gray-400' : ''}`}>
          {displayValue || '—'}
        </span>
      );
    }

    // Dropdown cells
    if (isDropdownColumn) {
      const isEmpty = column === 'manufacturer' ? !(item as any).manufacturerName :
                      column === 'endUser' ? !(item as any).endUserName :
                      !item[column as keyof OrderLineItem];
      return (
        <button
          onClick={(e) => handleCellClick(item.id, column, e)}
          className={`w-full ${alignClass} px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-between gap-1`}
        >
          <span className={`truncate ${isEmpty ? 'text-gray-400' : ''}`}>
            {displayValue}
          </span>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400 flex-shrink-0">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      );
    }

    // Editing state
    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={editValue}
          autoFocus
          onBlur={(e) => handleCellChange(item.id, column, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellChange(item.id, column, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className={`w-full px-2 py-1 ${alignClass} border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
      );
    }

    // Special rendering for unitPrice with pricing source dropdown
    if (column === 'unitPrice') {
      const pricingSource = lineItemPricingSource[item.id] || 'product';
      const options = item.productId ? productPricingOptions[item.productId] : null;

      // Determine tag label and color based on current pricing source
      let tagLabel = '';
      let tagColor = '';

      if (pricingSource === 'cpn') {
        tagLabel = 'CPN';
        tagColor = 'bg-blue-100 text-blue-700';
      } else if (pricingSource === 'manual') {
        tagLabel = 'Manual';
        tagColor = 'bg-gray-100 text-gray-600';
      } else if (pricingSource.startsWith('tier:')) {
        const range = pricingSource.replace('tier:', '');
        const [low, high] = range.split('-').map(n => Math.round(parseFloat(n)));
        tagLabel = `Qty ${low}-${high}`;
        tagColor = 'bg-green-100 text-green-700';
      } else {
        tagLabel = 'Product';
        tagColor = 'bg-purple-100 text-purple-700';
      }

      // Check if this item's pricing dropdown is open
      const isDropdownOpen = pricingDropdownOpen?.itemId === item.id;

      return (
        <div className="relative">
          <div className="flex items-center justify-end gap-1.5">
            {/* Price value - clickable to edit */}
            <button
              onClick={(e) => handleCellClick(item.id, column, e)}
              className="px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              {displayValue}
            </button>
            {/* Pricing source dropdown trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setPricingDropdownOpen(isDropdownOpen ? null : {
                  itemId: item.id,
                  position: { top: rect.bottom + 4, left: rect.left }
                });
              }}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-0.5 whitespace-nowrap ${tagColor}`}
            >
              {tagLabel}
              <svg width="8" height="8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {/* Pricing dropdown portal */}
          {isDropdownOpen && createPortal(
            <div
              className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ top: pricingDropdownOpen.position.top, left: pricingDropdownOpen.position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Product Price option - always show if available */}
              {options && options.productPrice !== null && (() => {
                const productPrice = typeof options.productPrice === 'string' ? parseFloat(options.productPrice) : options.productPrice;
                return (
                  <button
                    onClick={() => handlePricingSourceSelect(item.id, 'product', productPrice, item.commissionRate)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'product' ? 'bg-purple-50' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Product
                    </span>
                    <span className="text-gray-500">${productPrice.toFixed(2)}</span>
                  </button>
                );
              })()}
              {/* CPN Price option - only show if CPN exists for this customer */}
              {options && options.cpnPrice !== null && (() => {
                const cpnPrice = typeof options.cpnPrice === 'string' ? parseFloat(options.cpnPrice) : options.cpnPrice;
                return (
                  <button
                    onClick={() => handlePricingSourceSelect(item.id, 'cpn', cpnPrice, options.cpnCommissionRate ?? item.commissionRate)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'cpn' ? 'bg-blue-50' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      CPN
                    </span>
                    <span className="text-gray-500">${cpnPrice.toFixed(2)}</span>
                  </button>
                );
              })()}
              {/* Tier options - show all available tiers */}
              {options?.tiers && options.tiers.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-1 text-xs text-gray-400 font-medium">Volume Pricing</div>
                  {options.tiers.map((tier) => {
                    const tierSource = `tier:${tier.quantityLow}-${tier.quantityHigh}`;
                    const isCurrentTier = pricingSource === tierSource;
                    const tierPrice = typeof tier.unitPrice === 'string' ? parseFloat(tier.unitPrice) : tier.unitPrice;
                    return (
                      <button
                        key={`${tier.quantityLow}-${tier.quantityHigh}`}
                        onClick={() => handlePricingSourceSelect(item.id, tierSource, tierPrice, item.commissionRate)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${isCurrentTier ? 'bg-green-50' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Qty {tier.quantityLow}-{tier.quantityHigh}
                        </span>
                        <span className="text-gray-500">${tierPrice.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </>
              )}
              {/* Manual option - show current price as manual */}
              <div className="border-t border-gray-100 my-1"></div>
              <div
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${pricingSource === 'manual' ? 'bg-gray-50' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Manual
                </span>
                <span className="text-xs text-gray-400">Edit price above</span>
              </div>
            </div>,
            document.body
          )}
        </div>
      );
    }

    // Display state (clickable to edit)
    return (
      <button
        onClick={(e) => handleCellClick(item.id, column, e)}
        className={`w-full px-2 py-1 ${alignClass} rounded hover:bg-gray-100 transition-colors ${
          column === 'commissionPercent' ? 'text-purple-600' : ''
        }`}
      >
        {displayValue}
      </button>
    );
  };

  // Check if indicator columns are visible
  const hasIndicatorColumns = visibleColumns.has('iconAcknowledgement') ||
    visibleColumns.has('iconDocumentSpecific') ||
    visibleColumns.has('iconWarehouse') ||
    visibleColumns.has('iconCredit');

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedLineItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLineItems.size}
          onClearSelection={onClearSelection}
          onSetOverage={onSetOverage}
          onLockOverage={onLockOverage}
          onUnlockOverage={onUnlockOverage}
          onSetEndUser={onSetEndUser}
          onSetOutsideRepSplits={onSetOutsideRepSplits}
          onConvertToWarehouse={onConvertToWarehouse}
          onAddCredit={onAddCredit}
          onAddAcknowledgement={onAddAcknowledgement}
          onDeleteLines={onDeleteLines}
        />
      )}

      {/* Line Items Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <LineItemsTableHeader
            lineItems={order.lineItems || []}
            selectedLineItems={selectedLineItems}
            onToggleAllLineItems={onToggleAllLineItems}
            visibleColumns={visibleColumns}
            viewMode={viewMode}
            isPinned={isPinned}
            getPinnedColumnStyle={getPinnedColumnStyle}
          />
          <tbody>
            {(order.lineItems || []).map((item) => {
              const linkedInvoices = getLinkedInvoicesForLineItem(item, order.id, mockInvoices);
              const lineStatus = getLineShipStatus(item, linkedInvoices);
              const hasAcknowledgement = lineItemAcknowledgements[item.id];
              const hasCredit = lineItemCredits[item.id];

              return (
                <tr
                  key={item.id}
                  className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                    selectedLineItems.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                  } ${item.isCredit ? 'bg-red-50' : ''}`}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedLineItems.has(item.id)}
                      onChange={() => onToggleLineItemSelection(item.id)}
                      className="accent-[var(--primary)]"
                    />
                  </td>

                  {/* Indicator Icons */}
                  {hasIndicatorColumns && (
                    <td className="px-1 py-2">
                      <div className="flex items-center gap-1">
                        {visibleColumns.has('iconAcknowledgement') && (
                          <div className="w-7 flex justify-center">
                            {hasAcknowledgement && (
                              <span className="text-green-600" title="Acknowledged">✓</span>
                            )}
                          </div>
                        )}
                        {visibleColumns.has('iconDocumentSpecific') && (
                          <div className="w-7 flex justify-center">
                            {item.isDocumentSpecific && (
                              <span className="text-blue-600" title="Document Specific">📄</span>
                            )}
                          </div>
                        )}
                        {visibleColumns.has('iconWarehouse') && (
                          <div className="w-7 flex justify-center">
                            {item.isWarehouseConsignment && (
                              <span className="text-orange-600" title="Warehouse">🏭</span>
                            )}
                          </div>
                        )}
                        {visibleColumns.has('iconCredit') && (
                          <div className="w-7 flex justify-center">
                            {hasCredit && (
                              <span className="text-red-600" title="Credit">💳</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Part Number */}
                  {visibleColumns.has('partNumber') && (
                    <td
                      className={`px-3 py-2 text-sm ${isPinned('partNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={getPinnedColumnStyle('partNumber')}
                    >
                      {renderEditableCell(item, 'partNumber', 'left')}
                    </td>
                  )}

                  {/* Customer Part Number */}
                  {visibleColumns.has('custPartNumber') && (
                    <td
                      className={`px-3 py-2 text-sm ${isPinned('custPartNumber') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={getPinnedColumnStyle('custPartNumber')}
                    >
                      {renderEditableCell(item, 'custPartNumber', 'left')}
                    </td>
                  )}

                  {/* Description */}
                  {visibleColumns.has('description') && (
                    <td
                      className={`px-3 py-2 text-sm min-w-[250px] max-w-[400px] ${isPinned('description') ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                      style={getPinnedColumnStyle('description')}
                    >
                      {renderEditableCell(item, 'description', 'left')}
                    </td>
                  )}

                  {/* UOM */}
                  {visibleColumns.has('uom') && (
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(item, 'uom', 'center')}
                    </td>
                  )}

                  {/* Divisor */}
                  {visibleColumns.has('divisor') && (
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(item, 'divisor', 'center')}
                    </td>
                  )}

                  {/* Unit Price */}
                  {visibleColumns.has('unitPrice') && (
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(item, 'unitPrice', 'right')}
                    </td>
                  )}

                  {/* Quantity */}
                  {visibleColumns.has('quantity') && (
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(item, 'quantity', 'center')}
                    </td>
                  )}

                  {/* Shipped Qty */}
                  {visibleColumns.has('shippedQty') && (
                    <td className="px-3 py-2 text-sm text-center">
                      {item.quantityShipped}
                    </td>
                  )}

                  {/* Status */}
                  {visibleColumns.has('lineStatus') && (
                    <td className="px-3 py-2 text-sm text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${lineStatus.color}`}>
                        {lineStatus.label}
                      </span>
                    </td>
                  )}

                  {/* Sell Total */}
                  {visibleColumns.has('sellTotal') && (
                    <td className={`px-3 py-2 text-sm text-right font-medium ${item.isCredit ? 'text-red-600' : ''}`}>
                      {formatCurrency(item.extendedPrice)}
                    </td>
                  )}

                  {/* Commission % (simple view) */}
                  {visibleColumns.has('commissionPercent') && viewMode === 'simple' && (
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(item, 'commissionPercent', 'right')}
                    </td>
                  )}

                  {/* Commission */}
                  {visibleColumns.has('commission') && (
                    <td className="px-3 py-2 text-sm text-right font-medium text-purple-600">
                      {formatCurrency(item.commissionAmount || item.extendedPrice * ((item.commissionRate ?? 8) / 100))}
                    </td>
                  )}

                  {/* Commission Total */}
                  {visibleColumns.has('commissionTotal') && (
                    <td className="px-3 py-2 text-sm text-right font-medium text-purple-600">
                      {formatCurrency(item.commissionAmount || item.extendedPrice * ((item.commissionRate ?? 8) / 100))}
                    </td>
                  )}

                  {/* Quote # */}
                  {visibleColumns.has('linkedQuote') && (
                    <td className="px-3 py-2 text-sm min-w-[120px]">
                      <span className="text-gray-400">-</span>
                    </td>
                  )}

                  {/* Invoice # */}
                  {visibleColumns.has('linkedInvoice') && (
                    <td className="px-3 py-2 text-sm min-w-[120px]">
                      {linkedInvoices.length > 0 ? (
                        <button
                          className="text-blue-600 hover:underline"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setInvoiceTooltip({
                              visible: true,
                              x: rect.left,
                              y: rect.bottom + 4,
                              invoices: linkedInvoices,
                            });
                          }}
                          onMouseLeave={() => setInvoiceTooltip({ visible: false, x: 0, y: 0, invoices: [] })}
                        >
                          {linkedInvoices[0]?.invoiceNumber || '-'}
                          {linkedInvoices.length > 1 && ` +${linkedInvoices.length - 1}`}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}

                  {/* Check # */}
                  {visibleColumns.has('linkedCheck') && (
                    <td className="px-3 py-2 text-sm min-w-[120px]">
                      {linkedInvoices.length > 0 ? (
                        (() => {
                          const checks = linkedInvoices.flatMap(inv => getLinkedChecksForInvoice(inv.id, mockChecks));
                          return checks.length > 0 ? (
                            <span className="text-green-600">{checks[0]?.checkNumber}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          );
                        })()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}

                  {/* Fulfillment # */}
                  {visibleColumns.has('linkedFulfillment') && (
                    <td className="px-3 py-2 text-sm min-w-[120px]">
                      {item.fulfillmentRequestNumber ? (
                        <span className="text-blue-600">{item.fulfillmentRequestNumber}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}

                  {/* Invoiced */}
                  {visibleColumns.has('invoiced') && (
                    <td className="px-3 py-2 text-sm text-center">
                      {item.quantityInvoiced}
                    </td>
                  )}

                  {/* % Over */}
                  {visibleColumns.has('percentOver') && (
                    <td className="px-3 py-2 text-sm text-right">
                      15%
                    </td>
                  )}

                  {/* Com % (overage view) */}
                  {visibleColumns.has('commissionPercent') && viewMode === 'overage' && (
                    <td className="px-3 py-2 text-sm">
                      {renderEditableCell(item, 'commissionPercent', 'right')}
                    </td>
                  )}

                  {/* Com $ */}
                  {visibleColumns.has('commissionAmount') && (
                    <td className="px-3 py-2 text-sm text-right text-purple-600">
                      {formatCurrency(item.commissionAmount || item.extendedPrice * ((item.commissionRate ?? 8) / 100))}
                    </td>
                  )}

                  {/* Ovg % */}
                  {visibleColumns.has('ovgPercent') && (
                    <td className="px-3 py-2 text-sm text-right">
                      15%
                    </td>
                  )}

                  {/* Ovg $ */}
                  {visibleColumns.has('ovgAmount') && (
                    <td className="px-3 py-2 text-sm text-right">
                      {formatCurrency(item.unitPrice * 0.15 * item.quantity * 0.85)}
                    </td>
                  )}

                  {/* Earn % */}
                  {visibleColumns.has('earnPercent') && (
                    <td className="px-3 py-2 text-sm text-right">
                      {(((item.commissionRate ?? 8) / 100 + 0.15 * 0.85) * 100).toFixed(1)}%
                    </td>
                  )}

                  {/* Earn $ */}
                  {visibleColumns.has('earnAmount') && (
                    <td className="px-3 py-2 text-sm text-right font-medium text-green-600">
                      {formatCurrency(
                        (item.commissionAmount || item.extendedPrice * ((item.commissionRate ?? 8) / 100)) +
                        (item.unitPrice * 0.15 * item.quantity * 0.85)
                      )}
                    </td>
                  )}

                  {/* Actions column - remove and 3 dots menu */}
                  <td className="px-2 py-2 w-20">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors group"
                        title="Remove line item"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 group-hover:text-red-500">
                          <path d="M6 6l8 8M6 14l8-8" strokeLinecap="round" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onOpenAdditionalDetails?.(item)}
                        className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                        title="More options"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(order.lineItems || []).length === 0 && (
              <tr>
                <td colSpan={30} className="px-4 py-8 text-center text-gray-500">
                  No line items. Click &quot;Add Line&quot; to add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add Line Button */}
        <div className="border-t border-[var(--border)]">
          <button
            onClick={addLineItem}
            className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Line
          </button>
        </div>
      </div>

      {/* Dropdown Portal for Search */}
      {dropdownOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(null); setSearchQuery(''); }} />
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80"
              style={{
                // Check if dropdown would overflow bottom of screen, if so flip it above
                top: dropdownOpen.position.top + 250 > window.innerHeight
                  ? dropdownOpen.position.top - 258
                  : dropdownOpen.position.top,
                left: Math.min(dropdownOpen.position.left, window.innerWidth - 330),
              }}
            >
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isProductDropdown ? "Type to search..." :
                    isFactoryDropdown ? "Search manufacturers..." :
                    isCpnDropdown ? "Customer part numbers..." :
                    isUomDropdown ? "Search UOMs..." :
                    isEndUserDropdown ? "Search customers..." : "Search..."
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {isProductDropdown && (
                  <div className="mt-1 text-xs text-gray-400">
                    Searches: Part #, Customer Part #, Description
                  </div>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {/* Product results */}
                {isProductDropdown && productsLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isProductDropdown && !productsLoading && productResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(dropdownOpen.itemId, product)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-mono text-sm font-medium">{product.factoryPartNumber}</div>
                    <div className="text-xs text-gray-500 truncate">{product.description}</div>
                  </button>
                ))}
                {isProductDropdown && !productsLoading && productResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                )}

                {/* Factory/Manufacturer results */}
                {isFactoryDropdown && factoriesLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isFactoryDropdown && !factoriesLoading && factoryResults.map((factory) => (
                  <button
                    key={factory.id}
                    onClick={() => handleFactorySelect(dropdownOpen.itemId, factory)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium">{factory.title}</div>
                    {factory.accountNumber && (
                      <div className="text-xs text-gray-500">{factory.accountNumber}</div>
                    )}
                  </button>
                ))}
                {isFactoryDropdown && !factoriesLoading && factoryResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No manufacturers found</div>
                )}

                {/* CPN (Customer Part Number) results */}
                {isCpnDropdown && cpnsLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isCpnDropdown && !cpnsLoading && !currentProductId && (
                  <div className="px-3 py-2 text-sm text-amber-600">Select a product first to view CPNs</div>
                )}
                {isCpnDropdown && !cpnsLoading && currentProductId && cpnResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No CPNs found for this product</div>
                )}
                {isCpnDropdown && !cpnsLoading && cpnResults.map((cpn) => (
                  <button
                    key={cpn.id}
                    onClick={() => handleCpnSelect(dropdownOpen.itemId, cpn)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    {cpn.customerPartNumber}
                  </button>
                ))}

                {/* End User (Customer) results */}
                {isEndUserDropdown && endUsersLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isEndUserDropdown && !endUsersLoading && endUserResults.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleEndUserSelect(dropdownOpen.itemId, customer)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium">{customer.companyName}</div>
                    {customer.isParent && (
                      <div className="text-xs text-gray-500">Parent Company</div>
                    )}
                  </button>
                ))}
                {isEndUserDropdown && !endUsersLoading && endUserResults.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                )}

                {/* UOM (Unit of Measure) results */}
                {isUomDropdown && uomsLoading && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}
                {isUomDropdown && !uomsLoading && (
                  <>
                    {uomResults
                      .filter(uom =>
                        !searchQuery.trim() ||
                        (uom.title && uom.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (uom.description && uom.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((uom) => (
                        <button
                          key={uom.id}
                          onClick={() => handleUomSelect(dropdownOpen.itemId, uom)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-sm font-medium">{uom.title}</div>
                          {uom.description && (
                            <div className="text-xs text-gray-500">{uom.description}</div>
                          )}
                          {uom.divisionFactor && uom.divisionFactor !== 1 && (
                            <div className="text-xs text-gray-400">Divisor: {uom.divisionFactor}</div>
                          )}
                        </button>
                      ))}
                    {uomResults.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No UOMs found</div>
                    )}
                  </>
                )}
              </div>
              {/* Adhoc option for product columns */}
              {isProductDropdown && searchQuery.trim() && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (dropdownOpen.column === 'partNumber') {
                        updateLineItem(dropdownOpen.itemId, {
                          productId: undefined,
                          partNumber: searchQuery.trim(),
                        });
                      } else if (dropdownOpen.column === 'description') {
                        updateLineItem(dropdownOpen.itemId, {
                          description: searchQuery.trim(),
                        });
                      }
                      setDropdownOpen(null);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                      <path d="M10 5v10M5 10h10" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-indigo-600">Use &quot;{searchQuery.trim()}&quot;</span>
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

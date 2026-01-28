'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { LineItemV2, ColumnConfig, LineItemColumnKey, QuoteSettingsV2 } from '../types';
import { useProductSearch, useFactorySearch, useProductCpns, useCustomerSearch, useProductUoms, getProductCpnByCustomer, listProductPricingTiers } from '../../quotes/api/useQuotesApi';
import type { ProductPricingTierResult } from '../../quotes/api/quotesApi';
import { fetchProductById } from '../../products/api/productsApi';
import { useAutoPopulateReps } from '@/components/shared/hooks/useAutoPopulateReps';

// Type for rep split rates passed from parent
interface RepSplitRateInfo {
  id: string;
  userId: string;
  userName: string;
  splitRate: string;
  position: number;
}

// Type for available pricing options for a product
interface PricingOptions {
  productPrice: number | null; // Default product price
  cpnPrice: number | null; // Customer-specific price (CPN)
  cpnCommissionRate: number | null; // Commission rate from CPN
  tiers: ProductPricingTierResult[]; // Volume pricing tiers
}

interface LineItemsTabV2Props {
  lineItems: LineItemV2[];
  onLineItemsChange: (items: LineItemV2[]) => void;
  onOpenColumnsModal: () => void;
  onOpenAdditionalDetails: (item: LineItemV2) => void;
  columnConfig: ColumnConfig[];
  quoteId?: string;
  settings?: QuoteSettingsV2;
  soldToCustomerId?: string;
  headerFactoryId?: string;
  headerFactoryName?: string;
  // Current reps for inheriting to new line items
  currentOutsideReps?: RepSplitRateInfo[];
  currentInsideReps?: RepSplitRateInfo[];
  // Selection state lifted to parent for sharing with header modal
  selectedItems?: Set<string>;
  onSelectedItemsChange?: (items: Set<string>) => void;
}

export function LineItemsTabV2({
  lineItems,
  onLineItemsChange,
  onOpenColumnsModal,
  onOpenAdditionalDetails,
  columnConfig,
  quoteId,
  settings,
  soldToCustomerId,
  headerFactoryId,
  headerFactoryName,
  currentOutsideReps,
  currentInsideReps,
  selectedItems: externalSelectedItems,
  onSelectedItemsChange,
}: LineItemsTabV2Props) {
  // Use external selection state if provided, otherwise use local state
  const [localSelectedItems, setLocalSelectedItems] = useState<Set<string>>(new Set());
  const selectedItems = externalSelectedItems ?? localSelectedItems;
  const setSelectedItems = onSelectedItemsChange ?? setLocalSelectedItems;
  const [showSectionsMenu, setShowSectionsMenu] = useState(false);
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: LineItemColumnKey } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{ itemId: string; column: LineItemColumnKey; position: { top: number; left: number } } | null>(null);
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

  // Hook for fetching inside reps from factory when manufacturer changes
  const { fetchInsideRepsFromFactory } = useAutoPopulateReps();

  // Fetch pricing options for a product (CPN, tiers, product price) - NEVER changes unit price
  const fetchPricingOptionsForProduct = useCallback(async (productId: string, lineItemId: string, currentUnitPrice: number) => {
    // Skip if already fetched
    if (fetchedPricingOptionsRef.current.has(lineItemId)) return;
    fetchedPricingOptionsRef.current.add(lineItemId);

    try {
      const [cpnResult, tiersResult, productResult] = await Promise.all([
        soldToCustomerId ? getProductCpnByCustomer(productId, soldToCustomerId).catch(() => null) : Promise.resolve(null),
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
        const lineItem = lineItems.find(li => li.id === lineItemId);
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
  }, [soldToCustomerId, lineItems]);

  // Track previous customer ID to detect changes
  const prevCustomerIdRef = React.useRef<string | undefined>(soldToCustomerId);

  // When customer changes, clear the cache so CPNs are refetched
  useEffect(() => {
    if (prevCustomerIdRef.current !== soldToCustomerId) {
      // Customer changed - clear the cache to force refetch of CPN data
      fetchedPricingOptionsRef.current.clear();
      setProductPricingOptions({});
      prevCustomerIdRef.current = soldToCustomerId;
    }
  }, [soldToCustomerId]);

  // Fetch pricing options for all line items with products on initial load
  useEffect(() => {
    lineItems.forEach(li => {
      if (li.productId && !fetchedPricingOptionsRef.current.has(li.id)) {
        fetchPricingOptionsForProduct(li.productId, li.id, li.unitPrice);
      }
    });
  }, [lineItems, fetchPricingOptionsForProduct]);

  // Handle pricing source selection from dropdown
  const handlePricingSourceSelect = useCallback((itemId: string, source: string, price: number, commissionRate?: number) => {
    const item = lineItems.find(li => li.id === itemId);
    if (!item) return;

    const qty = item.quantity || 1;
    const divisor = item.divisor || 1;
    const newCommissionPercent = commissionRate ?? item.commissionPercent;
    const sellTotal = qty * price / divisor;
    // Commission is calculated on DISCOUNTED sell total (after line discount)
    const lineDiscountPct = item.lineDiscountPercent || 0;
    const lineDiscountAmount = sellTotal * (lineDiscountPct / 100);
    const discountedSellTotal = sellTotal - lineDiscountAmount;
    const commissionBeforeDiscount = discountedSellTotal * (newCommissionPercent / 100);
    const commissionDiscountAmt = commissionBeforeDiscount * ((item.commissionDiscountPercent || 0) / 100);

    onLineItemsChange(
      lineItems.map(li => li.id === itemId ? {
        ...li,
        unitPrice: price,
        commissionPercent: newCommissionPercent,
        sellTotal,
        lineDiscountAmount,
        commission: commissionBeforeDiscount,
        commissionTotal: commissionBeforeDiscount - commissionDiscountAmt,
        commissionDiscountAmount: commissionDiscountAmt,
        isManualPrice: source === 'manual',
        pricingSource: source,
      } : li)
    );

    setLineItemPricingSource(prev => ({ ...prev, [itemId]: source }));
    setPricingDropdownOpen(null);
  }, [lineItems, onLineItemsChange]);

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

  // Debounce search query - immediately trigger on dropdown open (when searchQuery is empty)
  useEffect(() => {
    // If searchQuery is empty (dropdown just opened), update immediately
    if (searchQuery === '') {
      setDebouncedSearch('');
      return;
    }
    // Otherwise debounce to avoid too many API calls while typing
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine if we need product, factory, CPN, UOM, or end user search based on open dropdown
  const isProductDropdown = dropdownOpen && ['partNumber', 'description'].includes(dropdownOpen.column);
  const isFactoryDropdown = dropdownOpen?.column === 'manufacturer';
  const isCpnDropdown = dropdownOpen?.column === 'customerPartNumber';
  const isUomDropdown = dropdownOpen?.column === 'uom';
  const isEndUserDropdown = dropdownOpen?.column === 'endUser' && settings?.specifyEndUserPerLine;

  // Get current line item's productId and manufacturerId for searches
  const currentLineItem = dropdownOpen ? lineItems.find(li => li.id === dropdownOpen.itemId) : null;
  const currentProductId = currentLineItem?.productId;
  const currentManufacturerId = currentLineItem?.manufacturerId;

  // Determine which factoryId to use for product search:
  // - If factoryPerLineItem is true (or undefined for backwards compatibility), use line item's manufacturerId
  // - If factoryPerLineItem is false, use header-level factoryId
  const factoryIdForProductSearch = settings?.factoryPerLineItem !== false
    ? currentManufacturerId
    : headerFactoryId;

  // API hooks for search - trigger on dropdown open with empty string or debounced search
  // Pass manufacturerId to filter products by manufacturer if one is selected
  const { data: productResults = [], isLoading: productsLoading } = useProductSearch(
    debouncedSearch,
    factoryIdForProductSearch, // Use header factoryId when factoryPerLineItem is false
    isProductDropdown ?? false
  );
  const { data: factoryResults = [], isLoading: factoriesLoading } = useFactorySearch(
    debouncedSearch,
    isFactoryDropdown ?? false
  );
  const { data: cpnResults = [], isLoading: cpnsLoading } = useProductCpns(
    currentProductId || '',
    isCpnDropdown && !!currentProductId
  );
  // End user search (customers)
  const { data: endUserResults = [], isLoading: endUsersLoading } = useCustomerSearch(
    debouncedSearch,
    isEndUserDropdown ?? false
  );

  // Fetch UOMs when UOM dropdown is open (empty string to get all)
  const { data: uomResults = [], isLoading: uomsLoading } = useProductUoms(
    undefined,
    isUomDropdown ?? false
  );
  // The product's defaultDivisor is used directly when a product is selected

  const visibleColumns = useMemo(
    () => columnConfig.filter((c) => {
      // End User is now handled in Additional Details modal when specifyEndUserPerLine is enabled
      // Don't auto-show the column - user can enable it via column config if needed
      return c.visible;
    }),
    [columnConfig]
  );

  const toggleSelectAll = () => {
    if (selectedItems.size === lineItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(lineItems.map((li) => li.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const updateLineItem = (id: string, updates: Partial<LineItemV2>) => {
    onLineItemsChange(
      lineItems.map((li) => (li.id === id ? { ...li, ...updates } : li))
    );
  };

  const handleCellClick = (itemId: string, column: LineItemColumnKey, e: React.MouseEvent) => {
    // customerPartNumber and description are read-only (populated when product is selected)
    // partNumber, manufacturer, and uom are dropdown columns
    const dropdownColumns: LineItemColumnKey[] = ['partNumber', 'manufacturer', 'uom'];
    if (settings?.specifyEndUserPerLine) {
      dropdownColumns.push('endUser');
    }
    // Read-only columns - no interaction
    const readOnlyColumns: LineItemColumnKey[] = ['customerPartNumber', 'description'];
    // When factoryPerLineItem is false, manufacturer column is also read-only (set at header level)
    if (settings?.factoryPerLineItem === false && column === 'manufacturer') {
      return; // Manufacturer is set at header level, not editable per line
    }
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

  const handleDropdownSelect = (itemId: string, column: LineItemColumnKey, value: string, extra?: Record<string, string>) => {
    const updates: Partial<LineItemV2> = {};
    if (column === 'partNumber') {
      updates.partNumber = value;
      if (extra) {
        updates.description = extra.description || '';
        updates.manufacturerName = extra.manufacturer || '';
      }
    } else if (column === 'customerPartNumber') {
      updates.customerPartNumber = value;
    } else if (column === 'description') {
      updates.description = value;
    } else if (column === 'manufacturer') {
      updates.manufacturerName = value;
    }
    updateLineItem(itemId, updates);
    setDropdownOpen(null);
    setSearchQuery('');
  };

  const handleCellChange = async (itemId: string, column: LineItemColumnKey, value: string) => {
    const updates: Partial<LineItemV2> = {};
    const item = lineItems.find((li) => li.id === itemId);
    if (!item) return;

    if (column === 'quantity') {
      const qty = parseInt(value) || 1;
      // Skip if value hasn't changed
      if (qty === item.quantity) {
        setEditingCell(null);
        return;
      }
      // When quantity changes, recalculate with current unit price
      // User can change pricing source via dropdown if they want tier pricing
      const unitPrice = item.unitPrice;
      const sellTotal = qty * unitPrice / item.divisor;
      // Commission is calculated on DISCOUNTED sell total (after line discount)
      const lineDiscountPct = item.lineDiscountPercent || 0;
      const lineDiscountAmount = sellTotal * (lineDiscountPct / 100);
      const discountedSellTotal = sellTotal - lineDiscountAmount;
      const commissionBeforeDiscount = discountedSellTotal * (item.commissionPercent / 100);
      const commissionDiscountAmt = commissionBeforeDiscount * ((item.commissionDiscountPercent || 0) / 100);
      updates.quantity = qty;
      updates.sellTotal = sellTotal;
      updates.lineDiscountAmount = lineDiscountAmount;
      updates.commission = commissionBeforeDiscount; // commission before commission discount
      updates.commissionTotal = commissionBeforeDiscount - commissionDiscountAmt; // commission after commission discount
      updates.commissionDiscountAmount = commissionDiscountAmt;
    } else if (column === 'divisor') {
      const divisor = parseFloat(value) || 1;
      // Skip if value hasn't changed
      if (divisor === item.divisor) {
        setEditingCell(null);
        return;
      }
      const sellTotal = item.quantity * item.unitPrice / divisor;
      // Commission is calculated on DISCOUNTED sell total (after line discount)
      const lineDiscountPct = item.lineDiscountPercent || 0;
      const lineDiscountAmount = sellTotal * (lineDiscountPct / 100);
      const discountedSellTotal = sellTotal - lineDiscountAmount;
      const commissionBeforeDiscount = discountedSellTotal * (item.commissionPercent / 100);
      const commissionDiscountAmt = commissionBeforeDiscount * ((item.commissionDiscountPercent || 0) / 100);
      updates.divisor = divisor;
      updates.sellTotal = sellTotal;
      updates.lineDiscountAmount = lineDiscountAmount;
      updates.commission = commissionBeforeDiscount;
      updates.commissionTotal = commissionBeforeDiscount - commissionDiscountAmt;
      updates.commissionDiscountAmount = commissionDiscountAmt;
    } else if (column === 'unitPrice') {
      const price = parseFloat(value.replace(/[$,]/g, '')) || 0;
      // Skip if value hasn't changed
      if (price === item.unitPrice) {
        setEditingCell(null);
        return;
      }
      const sellTotal = item.quantity * price / item.divisor;
      // Commission is calculated on DISCOUNTED sell total (after line discount)
      const lineDiscountPct = item.lineDiscountPercent || 0;
      const lineDiscountAmount = sellTotal * (lineDiscountPct / 100);
      const discountedSellTotal = sellTotal - lineDiscountAmount;
      const commissionBeforeDiscount = discountedSellTotal * (item.commissionPercent / 100);
      const commissionDiscountAmt = commissionBeforeDiscount * ((item.commissionDiscountPercent || 0) / 100);
      updates.unitPrice = price;
      updates.sellTotal = sellTotal;
      updates.lineDiscountAmount = lineDiscountAmount;
      updates.commission = commissionBeforeDiscount;
      updates.commissionTotal = commissionBeforeDiscount - commissionDiscountAmt;
      updates.commissionDiscountAmount = commissionDiscountAmt;
      // Mark as manual override - user typed their own price
      updates.isManualPrice = true;
      updates.pricingSource = 'manual';
      setLineItemPricingSource(prev => ({
        ...prev,
        [itemId]: 'manual'
      }));
    } else if (column === 'commissionPercent') {
      const pct = parseFloat(value) || 0;
      // Skip if value hasn't changed
      if (pct === item.commissionPercent) {
        setEditingCell(null);
        return;
      }
      // Recalculate sellTotal to ensure consistency
      const sellTotal = item.quantity * item.unitPrice / item.divisor;
      // Commission is calculated on DISCOUNTED sell total (after line discount)
      const lineDiscountPct = item.lineDiscountPercent || 0;
      const lineDiscountAmount = sellTotal * (lineDiscountPct / 100);
      const discountedSellTotal = sellTotal - lineDiscountAmount;
      const commissionBeforeDiscount = discountedSellTotal * (pct / 100);
      const commissionDiscountAmt = commissionBeforeDiscount * ((item.commissionDiscountPercent || 0) / 100);
      updates.commissionPercent = pct;
      updates.sellTotal = sellTotal; // Ensure sellTotal is up to date
      updates.lineDiscountAmount = lineDiscountAmount;
      updates.commission = commissionBeforeDiscount;
      updates.commissionTotal = commissionBeforeDiscount - commissionDiscountAmt;
      updates.commissionDiscountAmount = commissionDiscountAmt;
    }
    updateLineItem(itemId, updates);
    setEditingCell(null);
  };

  const addLineItem = () => {
    const newItem: LineItemV2 = {
      id: `li-${Date.now()}`,
      quoteId: quoteId || lineItems[0]?.quoteId || '',
      partNumber: '',
      description: '',
      manufacturerName: settings?.factoryPerLineItem === false ? headerFactoryName || '' : '',
      manufacturerId: settings?.factoryPerLineItem === false ? headerFactoryId : undefined,
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
      // Inherit outside reps if per-line-item setting is enabled
      outsideSplitRates: settings?.outsideRepAtLineLevel && currentOutsideReps && currentOutsideReps.length > 0
        ? currentOutsideReps.map((rep, idx) => ({
            id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
            userId: rep.userId,
            userName: rep.userName,
            splitRate: rep.splitRate,
            position: idx + 1,
          }))
        : undefined,
      // Inherit inside reps if per-line-item setting is enabled AND factory is at header level
      insideSplitRates: settings?.insideRepAtLineLevel && !settings?.factoryPerLineItem && currentInsideReps && currentInsideReps.length > 0
        ? currentInsideReps.map((rep, idx) => ({
            id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
            userId: rep.userId,
            userName: rep.userName,
            splitRate: rep.splitRate,
            position: idx + 1,
          }))
        : undefined,
    };
    onLineItemsChange([...lineItems, newItem]);
  };

  const removeLineItem = (id: string) => {
    onLineItemsChange(lineItems.filter((li) => li.id !== id));
    // Also remove from selection if selected
    if (selectedItems.has(id)) {
      const newSet = new Set(selectedItems);
      newSet.delete(id);
      setSelectedItems(newSet);
    }
  };

  const renderCell = (item: LineItemV2, column: ColumnConfig) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.column === column.key;
    const isDropdown = dropdownOpen?.itemId === item.id && dropdownOpen?.column === column.key;
    // partNumber, manufacturer, and uom are dropdown columns
    // customerPartNumber and description are read-only (populated when product is selected)
    const dropdownColumns: LineItemColumnKey[] = ['partNumber', 'manufacturer', 'uom'];
    if (settings?.specifyEndUserPerLine) {
      dropdownColumns.push('endUser');
    }
    const isDropdownColumn = dropdownColumns.includes(column.key);
    // customerPartNumber and description are read-only columns that show values but can't be edited
    const isReadOnlyDisplayColumn = ['customerPartNumber', 'description'].includes(column.key);

    let displayValue = '';
    let editValue = '';

    switch (column.key) {
      case 'partNumber':
        displayValue = item.partNumber || 'Select...';
        break;
      case 'customerPartNumber':
        // Read-only - populated when product is selected
        displayValue = item.customerPartNumber || '—';
        break;
      case 'description':
        // Read-only - populated when product is selected
        displayValue = item.description || '—';
        break;
      case 'manufacturer':
        // When factoryPerLineItem is false, show header-level manufacturer name
        displayValue = settings?.factoryPerLineItem === false
          ? (headerFactoryName || '—')
          : (item.manufacturerName || 'Select...');
        break;
      case 'quantity':
        displayValue = (item.quantity || 0).toString();
        editValue = (item.quantity || 0).toString();
        break;
      case 'uom':
        displayValue = item.uom || 'Select...';
        break;
      case 'divisor':
        displayValue = (item.divisor || 1).toString();
        editValue = (item.divisor || 1).toString();
        break;
      case 'unitPrice':
        displayValue = `$${Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
        editValue = String(item.unitPrice || 0);
        break;
      case 'sellTotal':
        // Subtract line discount from sell total
        displayValue = `$${Number((item.sellTotal || 0) - (item.lineDiscountAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
        break;
      case 'commissionPercent':
        displayValue = String(Number(item.commissionPercent || 0));
        editValue = String(Number(item.commissionPercent || 0));
        break;
      case 'commission':
        // Show base commission before commission discount (per unit)
        displayValue = `$${Number(item.commission || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
        break;
      case 'commissionTotal':
        // Display commission after commission discount
        // item.commission = commission BEFORE discount, item.commissionTotal = commission AFTER discount
        // If commissionTotal is available from API, use it. Otherwise calculate from commission - discount.
        displayValue = `$${Number((item.commission || 0) - (item.commissionDiscountAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
        break;
      case 'linkedOrder':
        displayValue = item.linkedOrderNumber || '—';
        break;
      case 'endUser':
        displayValue = item.endUserName || (settings?.specifyEndUserPerLine ? 'Select...' : '—');
        break;
      default:
        displayValue = '—';
    }

    // Read-only cells - endUser is editable when specifyEndUserPerLine is true
    const readOnlyCells = ['sellTotal', 'commission', 'commissionTotal', 'linkedOrder'];
    if (!settings?.specifyEndUserPerLine) {
      readOnlyCells.push('endUser');
    }
    if (readOnlyCells.includes(column.key)) {
      // Handle sellTotal with line discount display
      if (column.key === 'sellTotal' && (item.lineDiscountAmount || 0) > 0) {
        const originalSellTotal = item.sellTotal || 0;
        const lineDiscount = item.lineDiscountAmount || 0;
        const discountedSellTotal = originalSellTotal - lineDiscount;
        return (
          <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm text-center">
            <div className="flex flex-col items-center">
              <span>${Number(discountedSellTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-xs text-gray-400 line-through">${Number(originalSellTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-xs text-orange-600 bg-orange-50 px-1 rounded mt-0.5">-${Number(lineDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>
        );
      }
      // Commission column shows base commission without discount
      // (discount breakdown is shown in commissionTotal column only)
      // Handle commissionTotal with commission discount display
      // item.commission = commission BEFORE commission discount (calculated on discounted sell total)
      // item.commissionTotal = commission AFTER commission discount (from API's totalLineCommission)
      if (column.key === 'commissionTotal' && (item.commissionDiscountAmount || 0) > 0) {
        // Use item.commission (before discount) as the original, NOT item.commissionTotal
        const originalCommissionTotal = item.commission || 0;
        const commissionDiscount = item.commissionDiscountAmount || 0;
        const discountedCommissionTotal = originalCommissionTotal - commissionDiscount;
        return (
          <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm text-center">
            <div className="flex flex-col items-center">
              <span className="font-medium text-purple-600">${Number(discountedCommissionTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-xs text-gray-400 line-through">${Number(originalCommissionTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
              <span className="text-xs text-purple-600 bg-purple-50 px-1 rounded mt-0.5">-${Number(commissionDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </td>
        );
      }
      return (
        <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm text-center">
          <span className={column.key === 'commissionTotal' ? 'font-medium text-purple-600' : ''}>
            {displayValue}
          </span>
        </td>
      );
    }

    // Read-only display columns (customerPartNumber and description)
    // These show the value but can't be edited - they're populated when product is selected
    // Text is now selectable for copying
    if (isReadOnlyDisplayColumn) {
      return (
        <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm">
          <span 
            className={`truncate select-text ${!displayValue || displayValue === '—' ? 'text-gray-400' : ''}`}
            style={{ userSelect: 'text' }}
          >
            {displayValue || '—'}
          </span>
        </td>
      );
    }

    // Dropdown cells
    if (isDropdownColumn) {
      // Check if manufacturer column should be disabled (when factoryPerLineItem is false)
      const isManufacturerDisabled = column.key === 'manufacturer' && settings?.factoryPerLineItem === false;

      // Check if field has a value - for manufacturer check manufacturerName or headerFactoryName, for partNumber check partNumber
      const hasValue = column.key === 'manufacturer'
        ? (settings?.factoryPerLineItem === false ? !!headerFactoryName : !!item.manufacturerName)
        : column.key === 'partNumber'
        ? !!item.partNumber
        : !!item[column.key as keyof LineItemV2];

      // Render disabled state for manufacturer when factoryPerLineItem is false
      if (isManufacturerDisabled) {
        return (
          <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm relative">
            <div className="w-full text-left px-2 py-1 rounded bg-gray-100 text-gray-400 cursor-not-allowed">
              <span className="truncate">
                {displayValue}
              </span>
            </div>
          </td>
        );
      }

      // All dropdown columns use selectable text + chevron button pattern
      return (
        <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm relative">
          <div className="w-full flex items-center gap-1">
            <span
              className="flex-1 py-1 select-text truncate cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
              style={{ userSelect: 'text' }}
              onClick={(e) => {
                // Only open dropdown if no text is selected (user clicked, not dragged to select)
                const selection = window.getSelection();
                if (!selection || selection.toString().length === 0) {
                  handleCellClick(item.id, column.key, e);
                }
              }}
            >
              {displayValue}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCellClick(item.id, column.key, e);
              }}
              onFocus={(e) => {
                // Auto-open dropdown when tabbed to
                const rect = e.currentTarget.getBoundingClientRect();
                setDropdownOpen({
                  itemId: item.id,
                  column: column.key,
                  position: { top: rect.bottom + 4, left: rect.left },
                });
                setSearchQuery('');
              }}
              className="flex-shrink-0 p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Open dropdown"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </td>
      );
    }

    // Editable cells
    if (isEditing) {
      return (
        <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm">
          <input
            type="text"
            defaultValue={editValue}
            autoFocus
            onFocus={(e) => e.target.select()}
            onBlur={(e) => handleCellChange(item.id, column.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellChange(item.id, column.key, e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              } else if (e.key === 'Tab') {
                // Save and move to next cell
                e.preventDefault();
                handleCellChange(item.id, column.key, e.currentTarget.value);
                // Find and focus next cell
                setTimeout(() => {
                  const currentRow = document.querySelector(`tr[data-item-id="${item.id}"]`);
                  if (!currentRow) return;
                  const rowCells = Array.from(currentRow.querySelectorAll<HTMLButtonElement>(
                    'td button:not([title="Remove line item"]):not([title="More options"])'
                  ));
                  let currentCellIndex = -1;
                  for (let i = 0; i < rowCells.length; i++) {
                    const td = rowCells[i].closest('td');
                    if (td && td.getAttribute('data-column') === column.key) {
                      currentCellIndex = i;
                      break;
                    }
                  }
                  if (currentCellIndex >= 0 && currentCellIndex < rowCells.length - 1) {
                    rowCells[currentCellIndex + 1]?.focus();
                  } else {
                    const allRows = document.querySelectorAll('tbody tr[data-item-id]');
                    const currentRowIndex = Array.from(allRows).findIndex(r => r.getAttribute('data-item-id') === item.id);
                    if (currentRowIndex >= 0 && currentRowIndex < allRows.length - 1) {
                      const nextRow = allRows[currentRowIndex + 1];
                      const nextRowCells = nextRow.querySelectorAll<HTMLButtonElement>(
                        'td button:not([title="Remove line item"]):not([title="More options"])'
                      );
                      if (nextRowCells.length > 0) {
                        nextRowCells[0]?.focus();
                      }
                    }
                  }
                }, 50);
              }
            }}
            className="w-full px-2 py-1 text-center border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </td>
      );
    }

    // Special rendering for unitPrice with pricing source dropdown
    if (column.key === 'unitPrice') {
      const pricingSource = lineItemPricingSource[item.id] || item.pricingSource || 'product';
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

      if (isEditing) {
        return (
          <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm">
            <input
              type="text"
              defaultValue={editValue}
              autoFocus
              onFocus={(e) => e.target.select()}
              onBlur={(e) => handleCellChange(item.id, column.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellChange(item.id, column.key, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setEditingCell(null);
                } else if (e.key === 'Tab') {
                  // Save and move to next cell
                  e.preventDefault();
                  handleCellChange(item.id, column.key, e.currentTarget.value);
                  setTimeout(() => {
                    const currentRow = document.querySelector(`tr[data-item-id="${item.id}"]`);
                    if (!currentRow) return;
                    const rowCells = Array.from(currentRow.querySelectorAll<HTMLButtonElement>(
                      'td button:not([title="Remove line item"]):not([title="More options"])'
                    ));
                    let currentCellIndex = -1;
                    for (let i = 0; i < rowCells.length; i++) {
                      const td = rowCells[i].closest('td');
                      if (td && td.getAttribute('data-column') === column.key) {
                        currentCellIndex = i;
                        break;
                      }
                    }
                    if (currentCellIndex >= 0 && currentCellIndex < rowCells.length - 1) {
                      rowCells[currentCellIndex + 1]?.focus();
                    } else {
                      const allRows = document.querySelectorAll('tbody tr[data-item-id]');
                      const currentRowIndex = Array.from(allRows).findIndex(r => r.getAttribute('data-item-id') === item.id);
                      if (currentRowIndex >= 0 && currentRowIndex < allRows.length - 1) {
                        const nextRow = allRows[currentRowIndex + 1];
                        const nextRowCells = nextRow.querySelectorAll<HTMLButtonElement>(
                          'td button:not([title="Remove line item"]):not([title="More options"])'
                        );
                        if (nextRowCells.length > 0) {
                          nextRowCells[0]?.focus();
                        }
                      }
                    }
                  }, 50);
                }
              }}
              className="w-full px-2 py-1 text-center border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </td>
        );
      }

      return (
        <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm text-center relative">
          <div className="flex items-center justify-center gap-1.5">
            {/* Price value - clickable to edit */}
            <button
              onClick={(e) => handleCellClick(item.id, column.key, e)}
              onFocus={() => {
                // Auto-switch to edit mode when tabbed to
                setEditingCell({ itemId: item.id, column: column.key });
              }}
              className="px-2 py-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    onClick={() => handlePricingSourceSelect(item.id, 'product', productPrice, item.commissionPercent)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'product' ? 'bg-purple-50' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Product
                    </span>
                    <span className="text-gray-500">${productPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </button>
                );
              })()}
              {/* CPN Price option - only show if CPN exists for this customer */}
              {options && options.cpnPrice !== null && (() => {
                const cpnPrice = typeof options.cpnPrice === 'string' ? parseFloat(options.cpnPrice) : options.cpnPrice;
                return (
                  <button
                    onClick={() => handlePricingSourceSelect(item.id, 'cpn', cpnPrice, options.cpnCommissionRate ?? item.commissionPercent)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'cpn' ? 'bg-blue-50' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      CPN
                    </span>
                    <span className="text-gray-500">${cpnPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
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
                        onClick={() => handlePricingSourceSelect(item.id, tierSource, tierPrice, item.commissionPercent)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${isCurrentTier ? 'bg-green-50' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Qty {tier.quantityLow}-{tier.quantityHigh}
                        </span>
                        <span className="text-gray-500">${tierPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
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
        </td>
      );
    }

    return (
      <td key={column.key} data-column={column.key} className="px-3 py-2 text-sm text-center">
        <button
          onClick={(e) => handleCellClick(item.id, column.key, e)}
          onFocus={() => {
            // Auto-switch to edit mode when tabbed to
            setEditingCell({ itemId: item.id, column: column.key });
          }}
          className={`w-full px-2 py-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            column.key === 'commissionPercent' ? 'text-purple-600' : ''
          }`}
        >
          {displayValue}
        </button>
      </td>
    );
  };


  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Line Items</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
            {lineItems.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact Button */}
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="14" height="6" rx="1" />
              <rect x="3" y="11" width="14" height="6" rx="1" />
            </svg>
            Compact
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Sections Button */}
          <div className="relative">
            <button
              onClick={() => setShowSectionsMenu(!showSectionsMenu)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h12M4 10h12M4 14h12" strokeLinecap="round" />
              </svg>
              Sections
            </button>
          </div>

          {/* Columns Button */}
          <button
            onClick={onOpenColumnsModal}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="4" height="14" rx="1" />
              <rect x="8" y="3" width="4" height="14" rx="1" />
              <rect x="13" y="3" width="4" height="14" rx="1" />
            </svg>
            Columns
            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              {visibleColumns.length}
            </span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4 pb-32">
        {/* Add Line Button - at top */}
        <button
          onClick={addLineItem}
          className="flex items-center gap-2 mb-3 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
          </svg>
          Add Line
        </button>

        {/* Tip indicator - different message based on factoryPerLineItem setting */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-blue-500 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            {settings?.factoryPerLineItem === false ? (
              <>
                <strong>Tip:</strong> {headerFactoryName ? `Products are filtered by ${headerFactoryName} (set in header).` : 'Select a manufacturer in the header to filter products when searching for part numbers.'}
              </>
            ) : (
              <>
                <strong>Tip:</strong> Select a manufacturer first to filter products by that manufacturer when searching for part numbers.
              </>
            )}
          </span>
        </div>
        <div className="border border-gray-200 rounded-lg flex flex-col h-full">
          {/* Scrollable table container - both horizontal and vertical scroll */}
          <div className="flex-1 overflow-auto min-h-0 max-h-[60vh] scrollbar-always-visible">
            <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="w-10 px-3 py-2 bg-gray-50">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 accent-indigo-600"
                    checked={selectedItems.size === lineItems.length && lineItems.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap bg-gray-50"
                  >
                    {col.label}
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1 text-gray-400">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round" />
                    </svg>
                  </th>
                ))}
                <th className="w-10 px-3 py-2 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr key={item.id} data-item-id={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 accent-indigo-600"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  {visibleColumns.map((col) => renderCell(item, col))}
                  <td className="px-3 py-2">
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
                        onClick={() => onOpenAdditionalDetails(item)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="More options"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lineItems.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="px-4 py-8 text-center text-gray-500">
                    No line items. Click "Add Line" to add your first item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Dropdown Portal */}
      {dropdownOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(null); setSearchQuery(''); setDebouncedSearch(''); }} />
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72"
              style={{
                // Check if dropdown would overflow bottom of screen, if so flip it above
                top: dropdownOpen.position.top + 250 > window.innerHeight
                  ? dropdownOpen.position.top - 258
                  : dropdownOpen.position.top,
                left: Math.min(dropdownOpen.position.left, window.innerWidth - 300),
              }}
            >
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      // Close dropdown and move to next editable cell
                      e.preventDefault();
                      const currentItemId = dropdownOpen?.itemId;
                      const currentColumn = dropdownOpen?.column;
                      setDropdownOpen(null);
                      setSearchQuery('');
                      setDebouncedSearch('');

                      // Find next editable cell after the current one
                      setTimeout(() => {
                        if (!currentItemId || !currentColumn) return;

                        // Find the current row using data attribute
                        const currentRow = document.querySelector(`tr[data-item-id="${currentItemId}"]`);
                        if (!currentRow) return;

                        // Get all editable cells in the current row (excluding action buttons)
                        const rowCells = Array.from(currentRow.querySelectorAll<HTMLButtonElement>(
                          'td button:not([title="Remove line item"]):not([title="More options"])'
                        ));

                        // Find the current cell index by matching the column
                        let currentCellIndex = -1;
                        for (let i = 0; i < rowCells.length; i++) {
                          const cell = rowCells[i];
                          const td = cell.closest('td');
                          if (td && td.getAttribute('data-column') === currentColumn) {
                            currentCellIndex = i;
                            break;
                          }
                        }

                        // Focus the next cell in the row
                        if (currentCellIndex >= 0 && currentCellIndex < rowCells.length - 1) {
                          rowCells[currentCellIndex + 1]?.focus();
                        } else {
                          // Move to first cell of next row
                          const allRows = document.querySelectorAll('tbody tr[data-item-id]');
                          const currentRowIndex = Array.from(allRows).findIndex(r => r.getAttribute('data-item-id') === currentItemId);
                          if (currentRowIndex >= 0 && currentRowIndex < allRows.length - 1) {
                            const nextRow = allRows[currentRowIndex + 1];
                            const nextRowCells = nextRow.querySelectorAll<HTMLButtonElement>(
                              'td button:not([title="Remove line item"]):not([title="More options"])'
                            );
                            if (nextRowCells.length > 0) {
                              nextRowCells[0]?.focus();
                            }
                          }
                        }
                      }, 50);
                    } else if (e.key === 'Escape') {
                      setDropdownOpen(null);
                      setSearchQuery('');
                      setDebouncedSearch('');
                    }
                  }}
                  placeholder={
                    dropdownOpen.column === 'manufacturer' ? 'Search manufacturers...' :
                    dropdownOpen.column === 'uom' ? 'Search UOMs...' :
                    'Type to search...'
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
                {/* Loading state */}
                {(productsLoading || factoriesLoading || cpnsLoading || uomsLoading) && (
                  <div className="px-3 py-4 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                  </div>
                )}

                {/* Factory/Manufacturer results */}
                {dropdownOpen.column === 'manufacturer' && !factoriesLoading && (
                  <>
                    {/* No selection option */}
                    {!searchQuery.trim() && (
                      <button
                        onClick={() => {
                          // Clear manufacturer and all product-related fields
                          updateLineItem(dropdownOpen.itemId, {
                            manufacturerId: undefined,
                            manufacturerName: '',
                            productId: undefined,
                            partNumber: '',
                            description: '',
                            customerPartNumber: '',
                          });
                          setDropdownOpen(null);
                          setSearchQuery('');
                          setDebouncedSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-500 italic border-b border-gray-100"
                      >
                        No selection
                      </button>
                    )}
                    {factoryResults.map((factory) => {
                      const currentItem = lineItems.find(li => li.id === dropdownOpen.itemId);
                      const isChangingManufacturer = currentItem?.manufacturerId && currentItem.manufacturerId !== factory.id;
                      return (
                        <button
                          key={factory.id}
                          onClick={async () => {
                            // If changing manufacturer, clear product-related fields to maintain consistency
                            const updates: Partial<LineItemV2> = {
                              manufacturerId: factory.id,
                              manufacturerName: factory.title,
                            };
                            if (isChangingManufacturer) {
                              updates.productId = undefined;
                              updates.partNumber = '';
                              updates.description = '';
                              updates.customerPartNumber = '';
                            }

                            // Auto-populate inside reps if insideRepAtLineLevel is enabled
                            if (settings?.insideRepAtLineLevel) {
                              try {
                                const reps = await fetchInsideRepsFromFactory(factory.id);
                                if (reps.length > 0) {
                                  updates.insideSplitRates = reps.map((rep, idx) => ({
                                    id: `new-${crypto.randomUUID()}`,  // Use new- prefix so it's not mistaken for a database ID
                                    userId: rep.userId,
                                    userName: rep.userName,
                                    splitRate: rep.splitRate,
                                    position: idx + 1,
                                  }));
                                }
                              } catch (error) {
                                console.error('Failed to fetch inside reps for factory:', error);
                              }
                            }

                            updateLineItem(dropdownOpen.itemId, updates);
                            setDropdownOpen(null);
                            setSearchQuery('');
                            setDebouncedSearch('');
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {factory.title}
                        </button>
                      );
                    })}
                    {factoryResults.length === 0 && searchQuery.trim() && (
                      <div className="px-3 py-2 text-sm text-gray-500">No manufacturers found</div>
                    )}
                  </>
                )}

                {/* Product results */}
                {isProductDropdown && !productsLoading && (
                  <>
                    {/* No selection option */}
                    {!searchQuery.trim() && (
                      <button
                        onClick={() => {
                          // Clear part number and all related fields
                          updateLineItem(dropdownOpen.itemId, {
                            productId: undefined,
                            partNumber: '',
                            description: '',
                            customerPartNumber: '',
                            manufacturerId: undefined,
                            manufacturerName: '',
                          });
                          setDropdownOpen(null);
                          setSearchQuery('');
                          setDebouncedSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-500 italic border-b border-gray-100"
                      >
                        No selection
                      </button>
                    )}
                    {productResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={async () => {
                          // Get current line item to calculate derived values
                          const item = lineItems.find(li => li.id === dropdownOpen.itemId);
                          const itemId = dropdownOpen.itemId;
                          const quantity = item?.quantity || 1;

                          // Default values from product - this is what we use for new product selection
                          let unitPrice = product.unitPrice || 0;
                          let commissionRate = product.defaultCommissionRate || 0;

                          // Close dropdown first
                          setDropdownOpen(null);
                          setSearchQuery('');
                          setDebouncedSearch('');

                          // Fetch CPN, pricing tiers, and full product details in parallel
                          let customerPartNumber = '';
                          let factoryId: string | undefined;
                          let factoryTitle: string | undefined;
                          let uomId: string | undefined;
                          let uomTitle: string | undefined;
                          let divisor = product.defaultDivisor || item?.divisor || 1;

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
                              factoryId = fullProduct.factory?.id;
                              factoryTitle = fullProduct.factory?.title;
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

                            // Get CPN data
                            if (cpnResult) {
                              customerPartNumber = cpnResult.customerPartNumber || '';
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
                          const sellTotal = quantity * unitPrice / divisor;
                          const commission = quantity > 0 ? sellTotal * (commissionRate / 100) / quantity : 0;
                          const commissionTotal = sellTotal * (commissionRate / 100);

                          // Single atomic update with product data
                          onLineItemsChange(
                            lineItems.map((li) => li.id === itemId ? {
                              ...li,
                              productId: product.id,
                              partNumber: product.factoryPartNumber || '',
                              description: product.description || '',
                              unitPrice: unitPrice,
                              commissionPercent: commissionRate,
                              divisor: divisor,
                              customerPartNumber: customerPartNumber,
                              sellTotal: sellTotal,
                              commission: commission,
                              commissionTotal: commissionTotal,
                              manufacturerId: factoryId || li.manufacturerId,
                              manufacturerName: factoryTitle || li.manufacturerName,
                              uomId: uomId || li.uomId,
                              uom: uomTitle || li.uom,
                              isManualPrice: false,
                              pricingSource: pricingSource,
                            } : li)
                          );
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-mono text-sm font-medium">{product.factoryPartNumber}</div>
                        <div className="text-xs text-gray-500 truncate">{product.description}</div>
                        {product.leadTime && (
                          <div className="text-xs text-gray-400">Lead: {product.leadTime}</div>
                        )}
                      </button>
                    ))}
                    {productResults.length === 0 && searchQuery.trim() && (
                      <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
                    )}
                  </>
                )}

                {/* CPN (Customer Part Number) results */}
                {isCpnDropdown && !cpnsLoading && (
                  <>
                    {!currentProductId && (
                      <div className="px-3 py-2 text-sm text-amber-600">Select a product first to view CPNs</div>
                    )}
                    {currentProductId && cpnResults.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No CPNs found for this product</div>
                    )}
                    {cpnResults.map((cpn) => (
                      <button
                        key={cpn.id}
                        onClick={() => {
                          updateLineItem(dropdownOpen.itemId, {
                            customerPartNumber: cpn.customerPartNumber,
                          });
                          setDropdownOpen(null);
                          setSearchQuery('');
                          setDebouncedSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        {cpn.customerPartNumber}
                      </button>
                    ))}
                  </>
                )}

                {/* End User results (when specifyEndUserPerLine is enabled) */}
                {isEndUserDropdown && !endUsersLoading && (
                  <>
                    {endUserResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          updateLineItem(dropdownOpen.itemId, {
                            endUserId: customer.id,
                            endUserName: customer.companyName,
                          });
                          setDropdownOpen(null);
                          setSearchQuery('');
                          setDebouncedSearch('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium">{customer.companyName}</div>
                        {customer.isParent && (
                          <div className="text-xs text-gray-400">Parent Company</div>
                        )}
                      </button>
                    ))}
                    {endUserResults.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                    )}
                  </>
                )}

                {/* UOM (Unit of Measure) results */}
                {isUomDropdown && !uomsLoading && (
                  <>
                    {uomResults
                      .filter(uom =>
                        !searchQuery.trim() ||
                        (uom.title && uom.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (uom.description && uom.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((uom) => {
                        // Get current item to recalculate sellTotal when divisor changes
                        const item = lineItems.find(li => li.id === dropdownOpen.itemId);
                        return (
                          <button
                            key={uom.id}
                            onClick={() => {
                              const divisor = uom.divisionFactor || 1;
                              const quantity = item?.quantity || 1;
                              const unitPrice = item?.unitPrice || 0;
                              const commissionPercent = item?.commissionPercent || 0;
                              const sellTotal = quantity * unitPrice / divisor;
                              // Commission is calculated on DISCOUNTED sell total (after line discount)
                              const lineDiscountPct = item?.lineDiscountPercent || 0;
                              const lineDiscountAmount = sellTotal * (lineDiscountPct / 100);
                              const discountedSellTotal = sellTotal - lineDiscountAmount;
                              const commissionBeforeDiscount = discountedSellTotal * (commissionPercent / 100);
                              const commissionDiscountAmt = commissionBeforeDiscount * ((item?.commissionDiscountPercent || 0) / 100);

                              updateLineItem(dropdownOpen.itemId, {
                                uomId: uom.id,
                                uom: uom.title,
                                divisor: divisor,
                                sellTotal: sellTotal,
                                lineDiscountAmount: lineDiscountAmount,
                                commission: commissionBeforeDiscount,
                                commissionTotal: commissionBeforeDiscount - commissionDiscountAmt,
                                commissionDiscountAmount: commissionDiscountAmt,
                              });
                              setDropdownOpen(null);
                              setSearchQuery('');
                              setDebouncedSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-sm font-medium">{uom.title}</div>
                            {uom.description && (
                              <div className="text-xs text-gray-400">{uom.description}</div>
                            )}
                            {uom.divisionFactor && uom.divisionFactor !== 1 && (
                              <div className="text-xs text-gray-400">Divisor: {uom.divisionFactor}</div>
                            )}
                          </button>
                        );
                      })}
                    {uomResults.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No UOMs found</div>
                    )}
                  </>
                )}
              </div>
              {/* Adhoc option - allows entering custom values */}
              {searchQuery.trim() && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (dropdownOpen.column === 'manufacturer') {
                        // Adhoc manufacturer clears product-related fields to maintain consistency
                        updateLineItem(dropdownOpen.itemId, {
                          manufacturerId: undefined,
                          manufacturerName: searchQuery.trim(),
                          productId: undefined,
                          partNumber: '',
                          description: '',
                          customerPartNumber: '',
                        });
                      } else if (dropdownOpen.column === 'partNumber') {
                        // Adhoc part number clears productId, CPN, and manufacturer
                        updateLineItem(dropdownOpen.itemId, {
                          productId: undefined,
                          partNumber: searchQuery.trim(),
                          description: '',
                          customerPartNumber: '',
                          manufacturerId: undefined,
                          manufacturerName: '',
                        });
                      } else if (dropdownOpen.column === 'description') {
                        updateLineItem(dropdownOpen.itemId, {
                          description: searchQuery.trim(),
                        });
                      } else if (dropdownOpen.column === 'customerPartNumber') {
                        updateLineItem(dropdownOpen.itemId, {
                          customerPartNumber: searchQuery.trim(),
                        });
                      }
                      setDropdownOpen(null);
                      setSearchQuery('');
                      setDebouncedSearch('');
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

export default LineItemsTabV2;

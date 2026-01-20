/**
 * LineItemsTable Component
 * Main line items table with inline editing for statements
 * Following the Orders pattern with CPN, 3-dot menu, and proper search
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { LocalLineItem, ColumnKey, CommissionSplitRep } from '../../hooks/useStatementDetailState';
import {
  useProductSearch,
  useCustomerSearch,
  useProductUoms,
  getProductCpnByCustomer,
  listProductPricingTiers,
} from '../../../api/useStatementsApi';
import { fetchProductById } from '@/components/products/api/productsApi';
import { BulkActionsBar } from './BulkActionsBar';

// Types
// Note: custPartNumber is NOT editable - it auto-populates when product is selected
type EditableColumnKey = 'partNumber' | 'description' | 'soldTo' | 'endUser' | 'uom' | 'divisor' | 'quantity' | 'unitPrice' | 'commissionRate';

interface PricingOptions {
  productPrice: number | null;
  cpnPrice: number | null;
  cpnCommissionRate: number | null;
  tiers: Array<{ quantityLow: number; quantityHigh: number; unitPrice: number | string }>;
}

interface LineItemsTableProps {
  lineItems: LocalLineItem[];
  selectedLineItems: Set<string>;
  visibleColumns: Set<ColumnKey>;
  factoryId?: string;
  soldToCustomerId?: string;
  onToggleSelection: (tempId: string) => void;
  onToggleAllSelection: () => void;
  onClearSelection: () => void;
  onUpdateLineItem: (tempId: string, updates: Partial<LocalLineItem>) => void;
  onRemoveLineItem: (tempId: string) => void;
  onAddLineItem: () => void;
  onOpenAdditionalDetails?: (item: LocalLineItem) => void;
}

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

export function LineItemsTable({
  lineItems,
  selectedLineItems,
  visibleColumns,
  factoryId,
  soldToCustomerId,
  onToggleSelection,
  onToggleAllSelection,
  onClearSelection,
  onUpdateLineItem,
  onRemoveLineItem,
  onAddLineItem,
  onOpenAdditionalDetails,
}: LineItemsTableProps) {
  // Editing state
  const [editingCell, setEditingCell] = useState<{ tempId: string; column: EditableColumnKey } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{ tempId: string; column: EditableColumnKey; position: { top: number; left: number } } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pricing options cache
  const [productPricingOptions, setProductPricingOptions] = useState<Record<string, PricingOptions>>({});
  const fetchedPricingOptionsRef = useRef<Set<string>>(new Set());
  const [pricingDropdownOpen, setPricingDropdownOpen] = useState<{ tempId: string; position: { top: number; left: number } } | null>(null);

  // Track pricing source per line item (for UI state before save)
  const [lineItemPricingSource, setLineItemPricingSource] = useState<Record<string, string>>({});

  // Track previous customer ID to detect changes and refetch CPN data
  const prevCustomerIdRef = useRef<string | undefined>(soldToCustomerId);

  // Clear pricing cache when Sold To customer changes at header level
  useEffect(() => {
    if (prevCustomerIdRef.current !== soldToCustomerId) {
      // Customer changed - clear all cached pricing options to refetch CPN data
      fetchedPricingOptionsRef.current.clear();
      setProductPricingOptions({});
      setLineItemPricingSource({});
      prevCustomerIdRef.current = soldToCustomerId;
    }
  }, [soldToCustomerId]);

  // Debounce search - trigger immediately on empty (dropdown open), otherwise wait 300ms
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
  const isUomDropdown = dropdownOpen?.column === 'uom';
  const isSoldToDropdown = dropdownOpen?.column === 'soldTo';
  const isEndUserDropdown = dropdownOpen?.column === 'endUser';

  // Product search - enabled when dropdown is open
  const { data: productResults = [], isLoading: productsLoading } = useProductSearch(
    debouncedSearch,
    factoryId,
    isProductDropdown ?? false
  );

  // UOM list
  const { data: uomResults = [], isLoading: uomsLoading } = useProductUoms(
    undefined,
    isUomDropdown ?? false
  );

  // Customer search for Sold To
  const { data: soldToResults = [], isLoading: soldToLoading } = useCustomerSearch(
    debouncedSearch,
    isSoldToDropdown ?? false
  );

  // Customer search for End User
  const { data: endUserResults = [], isLoading: endUserLoading } = useCustomerSearch(
    debouncedSearch,
    isEndUserDropdown ?? false
  );

  // Fetch pricing options for a product and determine pricing source
  // Also populates the CPN field on the line item when found
  const fetchPricingOptionsForProduct = useCallback(async (
    productId: string,
    tempId: string,
    currentUnitPrice: number,
    customerId?: string, // Use line item's customer, not header-level
    shouldUpdateCpnField: boolean = true // Whether to update the custPartNumber field
  ) => {
    if (fetchedPricingOptionsRef.current.has(tempId)) return;
    fetchedPricingOptionsRef.current.add(tempId);

    try {
      const [cpnResult, tiersResult, productResult] = await Promise.all([
        customerId ? getProductCpnByCustomer(productId, customerId).catch(() => null) : Promise.resolve(null),
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

      // Update the CPN field on the line item if we found one
      if (shouldUpdateCpnField && cpnResult?.customerPartNumber) {
        onUpdateLineItem(tempId, { custPartNumber: cpnResult.customerPartNumber });
      }

      // Determine pricing source from current unit price (like quotes does)
      // This runs ONCE when options are first fetched
      let determinedSource = 'product';
      const tolerance = 0.01;

      if (options.cpnPrice !== null && Math.abs(currentUnitPrice - options.cpnPrice) < tolerance) {
        determinedSource = 'cpn';
      } else if (options.tiers && options.tiers.length > 0) {
        // Find the line item to get quantity for tier matching
        const lineItem = lineItems.find(li => li.tempId === tempId);
        const qty = lineItem?.quantity || 1;
        const matchingTier = options.tiers.find(tier => qty >= tier.quantityLow && qty <= tier.quantityHigh);
        const matchingTierPrice = matchingTier ? (typeof matchingTier.unitPrice === 'string' ? parseFloat(matchingTier.unitPrice) : matchingTier.unitPrice) : null;

        if (matchingTier && matchingTierPrice !== null && Math.abs(currentUnitPrice - matchingTierPrice) < tolerance) {
          determinedSource = `tier:${matchingTier.quantityLow}-${matchingTier.quantityHigh}`;
        } else if (options.productPrice !== null && Math.abs(currentUnitPrice - options.productPrice) < tolerance) {
          determinedSource = 'product';
        } else if (options.cpnPrice !== null || options.tiers.length > 0 || options.productPrice !== null) {
          // Has pricing options but doesn't match = manual
          determinedSource = 'manual';
        }
      } else if (options.productPrice !== null && Math.abs(currentUnitPrice - options.productPrice) < tolerance) {
        determinedSource = 'product';
      } else if (options.cpnPrice !== null || options.productPrice !== null) {
        // Has pricing options but doesn't match = manual
        determinedSource = 'manual';
      }

      // Set the determined pricing source
      setLineItemPricingSource(prev => ({ ...prev, [tempId]: determinedSource }));
    } catch (err) {
      console.error('Error fetching pricing options:', err);
    }
  }, [lineItems, onUpdateLineItem]);

  // Fetch pricing options for existing line items on load
  // Uses each line item's own soldToCustomerId for CPN lookup
  useEffect(() => {
    lineItems.forEach(li => {
      if (li.productId && !fetchedPricingOptionsRef.current.has(li.tempId)) {
        // Use line item's customer, fall back to header-level customer
        const customerForCpn = li.soldToCustomerId || soldToCustomerId;
        fetchPricingOptionsForProduct(li.productId, li.tempId, li.unitPrice, customerForCpn, true);
      }
    });
  }, [lineItems, soldToCustomerId, fetchPricingOptionsForProduct]);

  // Handle cell click
  const handleCellClick = useCallback((tempId: string, column: EditableColumnKey, e: React.MouseEvent) => {
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'soldTo', 'endUser', 'uom'];
    const readOnlyColumns: EditableColumnKey[] = ['description']; // Description populated from product

    if (readOnlyColumns.includes(column)) {
      return;
    }

    if (dropdownColumns.includes(column)) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownOpen({
        tempId,
        column,
        position: { top: rect.bottom + 4, left: rect.left },
      });
      setEditingCell({ tempId, column });
      setSearchQuery('');
    } else {
      setEditingCell({ tempId, column });
    }
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback(async (tempId: string, product: any) => {
    const item = lineItems.find(li => li.tempId === tempId);
    if (!item) return;

    let unitPrice = parseFloat(product.unitPrice) || 0;
    let commissionRate = parseFloat(product.defaultCommissionRate) || 0;
    let divisor = parseFloat(product.defaultDivisor) || 1;
    let custPartNumber = '';
    let uomId: string | undefined;
    let uomTitle: string | undefined;

    // Close dropdown first
    setDropdownOpen(null);
    setEditingCell(null);
    setSearchQuery('');

    // Use line item's sold-to customer if available, fall back to header-level customer
    const customerIdForCpn = item.soldToCustomerId || soldToCustomerId;

    // Always fetch full product details for UOM
    try {
      const fullProduct = await fetchProductById(product.id).catch(() => null);

      // Populate UOM from product (always do this regardless of customer)
      if (fullProduct) {
        uomId = fullProduct.uom?.id;
        uomTitle = fullProduct.uom?.title;
        if (fullProduct.uom?.divisionFactor) {
          divisor = fullProduct.uom.divisionFactor;
        }
      }

      // Fetch CPN if we have a customer
      if (product.id && customerIdForCpn) {
        const cpnResult = await getProductCpnByCustomer(product.id, customerIdForCpn).catch(() => null);

        if (cpnResult) {
          custPartNumber = cpnResult.customerPartNumber || '';
          if (cpnResult.commissionRate) {
            commissionRate = parseFloat(cpnResult.commissionRate);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
    }

    const quantity = item.quantity || 1;
    const extendedPrice = (quantity * unitPrice) / divisor;
    const commission = extendedPrice * (commissionRate / 100);

    onUpdateLineItem(tempId, {
      productId: product.id,
      partNumber: product.factoryPartNumber || '',
      custPartNumber,
      description: product.description || '',
      unitPrice,
      commissionRate,
      divisor,
      extendedPrice,
      commission,
      uomId,
      uom: uomTitle || '',
      pricingSource: 'product',
    });

    // Track pricing source in local UI state
    setLineItemPricingSource(prev => ({ ...prev, [tempId]: 'product' }));

    // Cache pricing options (uses customer ID for CPN lookup)
    // Pass false for shouldUpdateCpnField since we already set custPartNumber above
    if (customerIdForCpn) {
      fetchPricingOptionsForProduct(product.id, tempId, unitPrice, customerIdForCpn, false);
    }
  }, [lineItems, soldToCustomerId, onUpdateLineItem, fetchPricingOptionsForProduct]);

  // Handle customer selection (Sold To / End User)
  const handleCustomerSelect = useCallback(async (tempId: string, customer: any, field: 'soldTo' | 'endUser') => {
    const item = lineItems.find(li => li.tempId === tempId);

    if (field === 'soldTo') {
      // Update Sold To customer
      const updates: Partial<LocalLineItem> = {
        soldToCustomerId: customer.id,
        soldToCustomerName: customer.companyName,
      };

      // If this line item has a product, re-fetch CPN for the new customer
      if (item?.productId && customer.id) {
        try {
          const cpnResult = await getProductCpnByCustomer(item.productId, customer.id).catch(() => null);

          if (cpnResult) {
            updates.custPartNumber = cpnResult.customerPartNumber || '';
            // Optionally update commission rate from CPN
            if (cpnResult.commissionRate) {
              const newCommissionRate = parseFloat(cpnResult.commissionRate);
              updates.commissionRate = newCommissionRate;
              // Recalculate commission with new rate
              const extendedPrice = item.extendedPrice || 0;
              updates.commission = extendedPrice * (newCommissionRate / 100);
            }
          } else {
            // No CPN for this customer, clear it
            updates.custPartNumber = '';
          }

          // Clear pricing options cache for this item so it gets refetched
          fetchedPricingOptionsRef.current.delete(tempId);
          if (item.productId) {
            setProductPricingOptions(prev => {
              const newOptions = { ...prev };
              delete newOptions[item.productId!];
              return newOptions;
            });
          }

          // Re-fetch pricing options for the new customer
          // Pass false for shouldUpdateCpnField since we already set custPartNumber above
          if (item.productId) {
            fetchPricingOptionsForProduct(item.productId, tempId, item.unitPrice, customer.id, false);
          }
        } catch (err) {
          console.error('Error fetching CPN for new customer:', err);
          updates.custPartNumber = '';
        }
      }

      onUpdateLineItem(tempId, updates);
    } else {
      onUpdateLineItem(tempId, {
        endUserId: customer.id,
        endUserName: customer.companyName,
      });
    }
    setDropdownOpen(null);
    setEditingCell(null);
    setSearchQuery('');
  }, [lineItems, onUpdateLineItem, soldToCustomerId, fetchPricingOptionsForProduct]);

  // Handle UOM selection
  const handleUomSelect = useCallback((tempId: string, uom: any) => {
    const item = lineItems.find(li => li.tempId === tempId);
    if (!item) return;

    const divisor = uom.divisionFactor || 1;
    const quantity = item.quantity || 1;
    const unitPrice = item.unitPrice || 0;
    const extendedPrice = (quantity * unitPrice) / divisor;
    const commissionRate = item.commissionRate || 0;
    const commission = extendedPrice * (commissionRate / 100);

    onUpdateLineItem(tempId, {
      uomId: uom.id,
      uom: uom.title,
      divisor,
      extendedPrice,
      commission,
    });
    setDropdownOpen(null);
    setEditingCell(null);
    setSearchQuery('');
  }, [lineItems, onUpdateLineItem]);

  // Handle pricing source selection
  const handlePricingSourceSelect = useCallback((tempId: string, source: string, price: number, commissionRate?: number) => {
    const item = lineItems.find(li => li.tempId === tempId);
    if (!item) return;

    const qty = item.quantity || 1;
    const divisor = item.divisor || 1;
    const newCommissionRate = commissionRate ?? item.commissionRate ?? 0;
    const extendedPrice = (qty * price) / divisor;
    const commission = extendedPrice * (newCommissionRate / 100);

    onUpdateLineItem(tempId, {
      unitPrice: price,
      commissionRate: newCommissionRate,
      extendedPrice,
      commission,
      pricingSource: source,
    });

    // Track pricing source in local UI state
    setLineItemPricingSource(prev => ({ ...prev, [tempId]: source }));
    setPricingDropdownOpen(null);
  }, [lineItems, onUpdateLineItem]);

  // Handle cell value change (inline editing)
  const handleCellChange = useCallback((tempId: string, column: EditableColumnKey, value: string) => {
    const item = lineItems.find(li => li.tempId === tempId);
    if (!item) return;

    const updates: Partial<LocalLineItem> = {};

    switch (column) {
      case 'quantity': {
        const qty = parseInt(value) || 1;
        const divisor = item.divisor || 1;
        const unitPrice = item.unitPrice || 0;
        const extendedPrice = (qty * unitPrice) / divisor;
        const commissionRate = item.commissionRate || 0;
        updates.quantity = qty;
        updates.extendedPrice = extendedPrice;
        updates.commission = extendedPrice * (commissionRate / 100);
        break;
      }
      case 'unitPrice': {
        const price = parseFloat(value.replace(/[$,]/g, '')) || 0;
        const qty = item.quantity || 1;
        const divisor = item.divisor || 1;
        const extendedPrice = (qty * price) / divisor;
        const commissionRate = item.commissionRate || 0;
        updates.unitPrice = price;
        updates.extendedPrice = extendedPrice;
        updates.commission = extendedPrice * (commissionRate / 100);
        updates.pricingSource = 'manual';
        // Track manual pricing in local UI state
        setLineItemPricingSource(prev => ({ ...prev, [tempId]: 'manual' }));
        break;
      }
      case 'commissionRate': {
        const rate = parseFloat(value) || 0;
        updates.commissionRate = rate;
        updates.commission = (item.extendedPrice || 0) * (rate / 100);
        break;
      }
      case 'divisor': {
        const divisor = parseFloat(value) || 1;
        const qty = item.quantity || 1;
        const unitPrice = item.unitPrice || 0;
        const extendedPrice = (qty * unitPrice) / divisor;
        updates.divisor = divisor;
        updates.extendedPrice = extendedPrice;
        updates.commission = extendedPrice * ((item.commissionRate || 0) / 100);
        break;
      }
    }

    onUpdateLineItem(tempId, updates);
    setEditingCell(null);
  }, [lineItems, onUpdateLineItem]);

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

  // Render editable cell
  const renderEditableCell = (item: LocalLineItem, column: EditableColumnKey, align: 'left' | 'center' | 'right' = 'left') => {
    const isEditing = editingCell?.tempId === item.tempId && editingCell?.column === column;
    const dropdownColumns: EditableColumnKey[] = ['partNumber', 'soldTo', 'endUser', 'uom'];
    const isDropdownColumn = dropdownColumns.includes(column);
    const isReadOnlyDisplay = column === 'description';

    let displayValue = '';
    let editValue = '';

    switch (column) {
      case 'partNumber':
        displayValue = item.partNumber || 'Select...';
        break;
      case 'description':
        displayValue = item.description || '-';
        break;
      case 'soldTo':
        displayValue = item.soldToCustomerName || 'Select...';
        break;
      case 'endUser':
        displayValue = item.endUserName || 'Select...';
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
      case 'commissionRate':
        displayValue = `${(item.commissionRate || 0).toFixed(1)}%`;
        editValue = String(item.commissionRate || 0);
        break;
    }

    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

    // Read-only display (description)
    if (isReadOnlyDisplay) {
      return (
        <span className={`px-2 py-1 ${alignClass} ${!displayValue || displayValue === '-' ? 'text-gray-400' : ''} truncate block`}>
          {displayValue}
        </span>
      );
    }

    // Dropdown cells
    if (isDropdownColumn) {
      const isEmpty = column === 'partNumber' ? !item.partNumber :
                      column === 'soldTo' ? !item.soldToCustomerName :
                      column === 'endUser' ? !item.endUserName :
                      !item.uom;
      return (
        <button
          onClick={(e) => handleCellClick(item.tempId, column, e)}
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
          onBlur={(e) => handleCellChange(item.tempId, column, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellChange(item.tempId, column, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className={`w-full px-2 py-1 ${alignClass} border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
      );
    }

    // Unit price with pricing source indicator
    if (column === 'unitPrice') {
      const options = item.productId ? productPricingOptions[item.productId] : null;

      // Get pricing source - prioritize local UI state, then item's stored source
      // Local state is set by fetchPricingOptionsForProduct or when user selects a source
      let pricingSource = lineItemPricingSource[item.tempId] || item.pricingSource || 'product';

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
        tagLabel = `Qty ${range}`;
        tagColor = 'bg-green-100 text-green-700';
      } else {
        tagLabel = 'Product';
        tagColor = 'bg-purple-100 text-purple-700';
      }

      const isDropdownOpenForThis = pricingDropdownOpen?.tempId === item.tempId;

      return (
        <div className="relative">
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={(e) => handleCellClick(item.tempId, column, e)}
              className="px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              {displayValue}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setPricingDropdownOpen(isDropdownOpenForThis ? null : {
                  tempId: item.tempId,
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
          {/* Pricing dropdown */}
          {isDropdownOpenForThis && createPortal(
            <div
              className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
              style={{ top: pricingDropdownOpen.position.top, left: pricingDropdownOpen.position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              {options?.productPrice !== null && (
                <button
                  onClick={() => handlePricingSourceSelect(item.tempId, 'product', options!.productPrice!, item.commissionRate)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'product' ? 'bg-purple-50' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Product
                  </span>
                  <span className="text-gray-500">${options!.productPrice!.toFixed(2)}</span>
                </button>
              )}
              {options?.cpnPrice !== null && (
                <button
                  onClick={() => handlePricingSourceSelect(item.tempId, 'cpn', options!.cpnPrice!, options?.cpnCommissionRate ?? item.commissionRate)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === 'cpn' ? 'bg-blue-50' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    CPN
                  </span>
                  <span className="text-gray-500">${options!.cpnPrice!.toFixed(2)}</span>
                </button>
              )}
              {options?.tiers && options.tiers.length > 0 && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-3 py-1 text-xs text-gray-400 font-medium">Volume Pricing</div>
                  {options.tiers.map((tier) => {
                    const tierSource = `tier:${tier.quantityLow}-${tier.quantityHigh}`;
                    const tierPrice = typeof tier.unitPrice === 'string' ? parseFloat(tier.unitPrice) : tier.unitPrice;
                    return (
                      <button
                        key={tierSource}
                        onClick={() => handlePricingSourceSelect(item.tempId, tierSource, tierPrice, item.commissionRate)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${pricingSource === tierSource ? 'bg-green-50' : ''}`}
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
              <div className="border-t border-gray-100 my-1"></div>
              <div className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between ${pricingSource === 'manual' ? 'bg-gray-50' : ''}`}>
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
        onClick={(e) => handleCellClick(item.tempId, column, e)}
        className={`w-full px-2 py-1 ${alignClass} rounded hover:bg-gray-100 transition-colors ${
          column === 'commissionRate' ? 'text-purple-600' : ''
        }`}
      >
        {displayValue}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedLineItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLineItems.size}
          onClearSelection={onClearSelection}
          onDeleteSelected={() => {
            selectedLineItems.forEach(tempId => onRemoveLineItem(tempId));
            onClearSelection();
          }}
        />
      )}

      {/* Table */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
        {/* Add Line Button */}
        <div className="border-b border-[var(--border)]">
          <button
            onClick={onAddLineItem}
            className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
            </svg>
            Add Line
          </button>
        </div>

        <table className="w-full min-w-[1400px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
              {/* Checkbox */}
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={selectedLineItems.size === lineItems.length && lineItems.length > 0}
                  onChange={onToggleAllSelection}
                  className="accent-[var(--primary)]"
                />
              </th>

              {visibleColumns.has('lineNumber') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-16">#</th>
              )}
              {visibleColumns.has('partNumber') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[150px]">Part #</th>
              )}
              {visibleColumns.has('custPartNumber') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[120px]">CPN</th>
              )}
              {visibleColumns.has('description') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[200px]">Description</th>
              )}
              {visibleColumns.has('soldTo') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[150px]">Sold To</th>
              )}
              {visibleColumns.has('endUser') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[150px]">End User</th>
              )}
              {visibleColumns.has('quantity') && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-20">Qty</th>
              )}
              {visibleColumns.has('uom') && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-20">UOM</th>
              )}
              {visibleColumns.has('divisor') && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-20">Divisor</th>
              )}
              {visibleColumns.has('unitPrice') && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[130px]">Unit Price</th>
              )}
              {visibleColumns.has('extendedPrice') && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[100px]">Ext. Price</th>
              )}
              {visibleColumns.has('commissionRate') && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-20">Comm %</th>
              )}
              {visibleColumns.has('commission') && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[100px]">Commission</th>
              )}
              {visibleColumns.has('outsideRep') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[120px]">Outside Rep</th>
              )}
              {visibleColumns.has('order') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[100px]">Order</th>
              )}
              {visibleColumns.has('invoice') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[100px]">Invoice</th>
              )}
              {visibleColumns.has('note') && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[120px]">Note</th>
              )}

              {/* Actions */}
              <th className="px-2 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr
                key={item.tempId}
                className={`border-b border-[var(--border)] hover:bg-[var(--muted)]/20 transition-colors ${
                  selectedLineItems.has(item.tempId) ? 'bg-[var(--primary)]/5' : ''
                }`}
              >
                {/* Checkbox */}
                <td className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLineItems.has(item.tempId)}
                    onChange={() => onToggleSelection(item.tempId)}
                    className="accent-[var(--primary)]"
                  />
                </td>

                {visibleColumns.has('lineNumber') && (
                  <td className="px-3 py-2 text-sm text-[var(--muted-foreground)]">{item.itemNumber}</td>
                )}
                {visibleColumns.has('partNumber') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'partNumber', 'left')}</td>
                )}
                {visibleColumns.has('custPartNumber') && (
                  <td className="px-3 py-2 text-sm">
                    <span className={`px-2 py-1 ${!item.custPartNumber ? 'text-gray-400' : ''}`}>
                      {item.custPartNumber || '—'}
                    </span>
                  </td>
                )}
                {visibleColumns.has('description') && (
                  <td className="px-3 py-2 text-sm max-w-[300px]">{renderEditableCell(item, 'description', 'left')}</td>
                )}
                {visibleColumns.has('soldTo') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'soldTo', 'left')}</td>
                )}
                {visibleColumns.has('endUser') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'endUser', 'left')}</td>
                )}
                {visibleColumns.has('quantity') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'quantity', 'center')}</td>
                )}
                {visibleColumns.has('uom') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'uom', 'center')}</td>
                )}
                {visibleColumns.has('divisor') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'divisor', 'center')}</td>
                )}
                {visibleColumns.has('unitPrice') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'unitPrice', 'right')}</td>
                )}
                {visibleColumns.has('extendedPrice') && (
                  <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(item.extendedPrice || 0)}</td>
                )}
                {visibleColumns.has('commissionRate') && (
                  <td className="px-3 py-2 text-sm">{renderEditableCell(item, 'commissionRate', 'right')}</td>
                )}
                {visibleColumns.has('commission') && (
                  <td className="px-3 py-2 text-sm text-right font-medium text-purple-600">{formatCurrency(item.commission || 0)}</td>
                )}
                {visibleColumns.has('outsideRep') && (
                  <td className="px-3 py-2 text-sm">
                    {item.outsideSplitRates && item.outsideSplitRates.length > 0 ? (
                      <span className="text-gray-700">
                        {item.outsideSplitRates.map(r => r.userName).join(', ')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.has('order') && (
                  <td className="px-3 py-2 text-sm">
                    {item.orderId ? (
                      <Link
                        href={`/orders/${item.orderId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.orderNumber || item.orderId.substring(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.has('invoice') && (
                  <td className="px-3 py-2 text-sm">
                    {item.invoiceId ? (
                      <Link
                        href={`/invoices/${item.invoiceId}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.invoiceNumber || item.invoiceId.substring(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                )}
                {visibleColumns.has('note') && (
                  <td className="px-3 py-2 text-sm">
                    {item.note ? (
                      <span className="truncate block max-w-[150px]" title={item.note}>{item.note}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                )}

                {/* Actions - Remove and 3-dots menu */}
                <td className="px-2 py-2 w-20">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemoveLineItem(item.tempId)}
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
            ))}
            {lineItems.length === 0 && (
              <tr>
                <td colSpan={20} className="px-4 py-8 text-center text-gray-500">
                  No line items. Click &quot;Add Line&quot; to add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Search Dropdown Portal */}
      {dropdownOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(null); setSearchQuery(''); setEditingCell(null); }} />
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80"
            style={{
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
                  isProductDropdown ? "Type to search products..." :
                  isUomDropdown ? "Search UOMs..." :
                  isSoldToDropdown ? "Search customers..." :
                  isEndUserDropdown ? "Search end users..." : "Search..."
                }
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
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
                  onClick={() => handleProductSelect(dropdownOpen.tempId, product)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-mono text-sm font-medium">{product.factoryPartNumber}</div>
                  <div className="text-xs text-gray-500 truncate">{product.description}</div>
                </button>
              ))}
              {isProductDropdown && !productsLoading && productResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No products found</div>
              )}

              {/* UOM results */}
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
                      (uom.title && uom.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((uom) => (
                      <button
                        key={uom.id}
                        onClick={() => handleUomSelect(dropdownOpen.tempId, uom)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium">{uom.title}</div>
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

              {/* Sold To results */}
              {isSoldToDropdown && soldToLoading && (
                <div className="px-3 py-4 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                </div>
              )}
              {isSoldToDropdown && !soldToLoading && soldToResults.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(dropdownOpen.tempId, customer, 'soldTo')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium">{customer.companyName}</div>
                </button>
              ))}
              {isSoldToDropdown && !soldToLoading && soldToResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
              )}

              {/* End User results */}
              {isEndUserDropdown && endUserLoading && (
                <div className="px-3 py-4 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" />
                </div>
              )}
              {isEndUserDropdown && !endUserLoading && endUserResults.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerSelect(dropdownOpen.tempId, customer, 'endUser')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium">{customer.companyName}</div>
                </button>
              ))}
              {isEndUserDropdown && !endUserLoading && endUserResults.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
              )}
            </div>
            {/* Adhoc option for product columns */}
            {isProductDropdown && searchQuery.trim() && (
              <div className="border-t border-gray-100">
                <button
                  onClick={() => {
                    onUpdateLineItem(dropdownOpen.tempId, {
                      productId: undefined,
                      partNumber: searchQuery.trim(),
                      productNameAdhoc: searchQuery.trim(),
                    });
                    setDropdownOpen(null);
                    setEditingCell(null);
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

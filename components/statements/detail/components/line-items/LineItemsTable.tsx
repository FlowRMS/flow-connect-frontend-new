/**
 * LineItemsTable Component
 * Main line items table with inline editing for statements
 * Virtualized for performance with 3k+ line items using react-window
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { List } from 'react-window';
import type { LocalLineItem, ColumnKey } from '../../hooks/useStatementDetailState';
import {
  useProductSearch,
  useCustomerSearch,
  useProductUoms,
  getProductCpnByCustomer,
  listProductPricingTiers,
} from '../../../api/useStatementsApi';
import { fetchProductById } from '@/components/products/api/productsApi';
import { BulkActionsBar } from './BulkActionsBar';
import {
  type EditableColumnKey,
  type PricingOptions,
  type RowDataProps,
  ROW_HEIGHT,
  VIRTUALIZATION_THRESHOLD,
  PRICING_FETCH_BATCH_SIZE,
  PRICING_FETCH_DELAY,
  StatementRowInner,
  VirtualizedRowComponent,
  TableHeader,
} from './StatementRow';

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
  onUpdateLineItemSilent?: (tempId: string, updates: Partial<LocalLineItem>) => void;
  onRemoveLineItem: (tempId: string) => void;
  onAddLineItem: () => void;
  onOpenAdditionalDetails?: (item: LocalLineItem) => void;
}

export function LineItemsTable({
  lineItems, selectedLineItems, visibleColumns, factoryId, soldToCustomerId,
  onToggleSelection, onToggleAllSelection, onClearSelection,
  onUpdateLineItem, onUpdateLineItemSilent, onRemoveLineItem, onAddLineItem, onOpenAdditionalDetails,
}: LineItemsTableProps) {
  const [editingCell, setEditingCell] = useState<{ tempId: string; column: EditableColumnKey } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{ tempId: string; column: EditableColumnKey; position: { top: number; left: number } } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [productPricingOptions, setProductPricingOptions] = useState<Record<string, PricingOptions>>({});
  const fetchedPricingOptionsRef = useRef<Set<string>>(new Set());
  const [pricingDropdownOpen, setPricingDropdownOpen] = useState<{ tempId: string; position: { top: number; left: number } } | null>(null);
  const [lineItemPricingSource, setLineItemPricingSource] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const prevCustomerIdRef = useRef<string | undefined>(soldToCustomerId);

  // O(1) lookup map
  const lineItemMap = useMemo(() => {
    const map = new Map<string, LocalLineItem>();
    for (const li of lineItems) map.set(li.tempId, li);
    return map;
  }, [lineItems]);

  const useVirt = lineItems.length > VIRTUALIZATION_THRESHOLD;

  // Observe container height for virtualized list
  useEffect(() => {
    if (!useVirt || !containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? 600;
      setContainerHeight(Math.max(400, h));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [useVirt]);

  // Clear pricing cache on customer change
  useEffect(() => {
    if (prevCustomerIdRef.current !== soldToCustomerId) {
      fetchedPricingOptionsRef.current.clear();
      setProductPricingOptions({});
      setLineItemPricingSource({});
      prevCustomerIdRef.current = soldToCustomerId;
    }
  }, [soldToCustomerId]);

  // Debounce search
  useEffect(() => {
    if (searchQuery === '') { setDebouncedSearch(''); return; }
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isProductDropdown = dropdownOpen && ['partNumber', 'description'].includes(dropdownOpen.column);
  const isUomDropdown = dropdownOpen?.column === 'uom';
  const isSoldToDropdown = dropdownOpen?.column === 'soldTo';
  const isEndUserDropdown = dropdownOpen?.column === 'endUser';

  const { data: productResults = [], isLoading: productsLoading } = useProductSearch(debouncedSearch, factoryId, isProductDropdown ?? false);
  const { data: uomResults = [], isLoading: uomsLoading } = useProductUoms(undefined, isUomDropdown ?? false);
  const { data: soldToResults = [], isLoading: soldToLoading } = useCustomerSearch(debouncedSearch, isSoldToDropdown ?? false);
  const { data: endUserResults = [], isLoading: endUserLoading } = useCustomerSearch(debouncedSearch, isEndUserDropdown ?? false);

  const fetchPricingOptionsForProduct = useCallback(async (
    productId: string, tempId: string, currentUnitPrice: number,
    customerId?: string, shouldUpdateCpnField: boolean = true,
  ) => {
    if (fetchedPricingOptionsRef.current.has(tempId)) return;
    fetchedPricingOptionsRef.current.add(tempId);
    try {
      const [cpnResult, tiersResult, productResult] = await Promise.all([
        customerId ? getProductCpnByCustomer(productId, customerId).catch(() => null) : Promise.resolve(null),
        listProductPricingTiers(productId).catch(() => []),
        fetchProductById(productId).catch(() => null),
      ]);
      const options: PricingOptions = {
        productPrice: productResult?.unitPrice ? parseFloat(String(productResult.unitPrice)) : null,
        cpnPrice: cpnResult?.unitPrice ? parseFloat(cpnResult.unitPrice) : null,
        cpnCommissionRate: cpnResult?.commissionRate ? parseFloat(cpnResult.commissionRate) : null,
        tiers: tiersResult || [],
      };
      setProductPricingOptions(prev => ({ ...prev, [productId]: options }));
      if (shouldUpdateCpnField && cpnResult?.customerPartNumber) {
        (onUpdateLineItemSilent || onUpdateLineItem)(tempId, { custPartNumber: cpnResult.customerPartNumber });
      }
      let determinedSource = 'product';
      const tolerance = 0.01;
      const item = lineItemMap.get(tempId);
      if (options.cpnPrice !== null && Math.abs(currentUnitPrice - options.cpnPrice) < tolerance) {
        determinedSource = 'cpn';
      } else if (options.tiers && options.tiers.length > 0) {
        const qty = item?.quantity || 1;
        const matchingTier = options.tiers.find(t => qty >= t.quantityLow && qty <= t.quantityHigh);
        const mtp = matchingTier ? (typeof matchingTier.unitPrice === 'string' ? parseFloat(matchingTier.unitPrice) : matchingTier.unitPrice) : null;
        if (matchingTier && mtp !== null && Math.abs(currentUnitPrice - mtp) < tolerance) determinedSource = `tier:${matchingTier.quantityLow}-${matchingTier.quantityHigh}`;
        else if (options.productPrice !== null && Math.abs(currentUnitPrice - options.productPrice) < tolerance) determinedSource = 'product';
        else if (options.cpnPrice !== null || options.tiers.length > 0 || options.productPrice !== null) determinedSource = 'manual';
      } else if (options.productPrice !== null && Math.abs(currentUnitPrice - options.productPrice) < tolerance) {
        determinedSource = 'product';
      } else if (options.cpnPrice !== null || options.productPrice !== null) determinedSource = 'manual';
      setLineItemPricingSource(prev => ({ ...prev, [tempId]: determinedSource }));
    } catch (err) { console.error('Error fetching pricing options:', err); }
  }, [lineItemMap, onUpdateLineItem, onUpdateLineItemSilent]);

  // Batch fetch pricing options
  useEffect(() => {
    const toFetch = lineItems.filter(li => li.productId && !fetchedPricingOptionsRef.current.has(li.tempId));
    if (toFetch.length === 0) return;
    let bi = 0;
    const processBatch = () => {
      const start = bi * PRICING_FETCH_BATCH_SIZE;
      const batch = toFetch.slice(start, start + PRICING_FETCH_BATCH_SIZE);
      if (batch.length === 0) return;
      batch.forEach(li => fetchPricingOptionsForProduct(li.productId!, li.tempId, li.unitPrice, li.soldToCustomerId || soldToCustomerId, true));
      bi++;
      if (start + PRICING_FETCH_BATCH_SIZE < toFetch.length) setTimeout(processBatch, PRICING_FETCH_DELAY);
    };
    processBatch();
  }, [lineItems, soldToCustomerId, fetchPricingOptionsForProduct]);

  const handleCellClick = useCallback((tempId: string, column: EditableColumnKey, e: React.MouseEvent) => {
    if (column === 'description') return;
    if (['partNumber', 'soldTo', 'endUser', 'uom'].includes(column)) {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownOpen({ tempId, column, position: { top: rect.bottom + 4, left: rect.left } });
      setEditingCell({ tempId, column });
      setSearchQuery('');
    } else {
      setEditingCell({ tempId, column });
    }
  }, []);

  const handleProductSelect = useCallback(async (tempId: string, product: any) => {
    const item = lineItemMap.get(tempId);
    if (!item) return;
    let unitPrice = parseFloat(product.unitPrice) || 0;
    let commissionRate = parseFloat(product.defaultCommissionRate) || 0;
    let divisor = parseFloat(product.defaultDivisor) || 1;
    let custPartNumber = '';
    let uomId: string | undefined;
    let uomTitle: string | undefined;
    setDropdownOpen(null); setEditingCell(null); setSearchQuery('');
    const customerIdForCpn = item.soldToCustomerId || soldToCustomerId;
    try {
      const fullProduct = await fetchProductById(product.id).catch(() => null);
      if (fullProduct) { uomId = fullProduct.uom?.id; uomTitle = fullProduct.uom?.title; if (fullProduct.uom?.divisionFactor) divisor = fullProduct.uom.divisionFactor; }
      if (product.id && customerIdForCpn) {
        const cpnResult = await getProductCpnByCustomer(product.id, customerIdForCpn).catch(() => null);
        if (cpnResult) { custPartNumber = cpnResult.customerPartNumber || ''; if (cpnResult.commissionRate) commissionRate = parseFloat(cpnResult.commissionRate); }
      }
    } catch (err) { console.error('Error fetching product details:', err); }
    const quantity = item.quantity || 1;
    const extendedPrice = (quantity * unitPrice) / divisor;
    const commission = extendedPrice * (commissionRate / 100);
    onUpdateLineItem(tempId, { productId: product.id, partNumber: product.factoryPartNumber || '', custPartNumber, description: product.description || '', unitPrice, commissionRate, divisor, extendedPrice, commission, uomId, uom: uomTitle || '', pricingSource: 'product' });
    setLineItemPricingSource(prev => ({ ...prev, [tempId]: 'product' }));
    if (customerIdForCpn) fetchPricingOptionsForProduct(product.id, tempId, unitPrice, customerIdForCpn, false);
  }, [lineItemMap, soldToCustomerId, onUpdateLineItem, fetchPricingOptionsForProduct]);

  const handleCustomerSelect = useCallback(async (tempId: string, customer: any, field: 'soldTo' | 'endUser') => {
    const item = lineItemMap.get(tempId);
    if (field === 'soldTo') {
      const updates: Partial<LocalLineItem> = { soldToCustomerId: customer.id, soldToCustomerName: customer.companyName };
      if (item?.productId && customer.id) {
        try {
          const cpnResult = await getProductCpnByCustomer(item.productId, customer.id).catch(() => null);
          if (cpnResult) { updates.custPartNumber = cpnResult.customerPartNumber || ''; if (cpnResult.commissionRate) { const nr = parseFloat(cpnResult.commissionRate); updates.commissionRate = nr; updates.commission = (item.extendedPrice || 0) * (nr / 100); } }
          else updates.custPartNumber = '';
          fetchedPricingOptionsRef.current.delete(tempId);
          if (item.productId) { setProductPricingOptions(prev => { const n = { ...prev }; delete n[item.productId!]; return n; }); fetchPricingOptionsForProduct(item.productId, tempId, item.unitPrice, customer.id, false); }
        } catch (err) { console.error('Error fetching CPN:', err); updates.custPartNumber = ''; }
      }
      onUpdateLineItem(tempId, updates);
    } else {
      onUpdateLineItem(tempId, { endUserId: customer.id, endUserName: customer.companyName });
    }
    setDropdownOpen(null); setEditingCell(null); setSearchQuery('');
  }, [lineItemMap, onUpdateLineItem, fetchPricingOptionsForProduct]);

  const handleUomSelect = useCallback((tempId: string, uom: any) => {
    const item = lineItemMap.get(tempId);
    if (!item) return;
    const divisor = uom.divisionFactor || 1;
    const extendedPrice = ((item.quantity || 1) * (item.unitPrice || 0)) / divisor;
    const commission = extendedPrice * ((item.commissionRate || 0) / 100);
    onUpdateLineItem(tempId, { uomId: uom.id, uom: uom.title, divisor, extendedPrice, commission });
    setDropdownOpen(null); setEditingCell(null); setSearchQuery('');
  }, [lineItemMap, onUpdateLineItem]);

  const handlePricingSourceSelect = useCallback((tempId: string, source: string, price: number, commissionRate?: number) => {
    const item = lineItemMap.get(tempId);
    if (!item) return;
    const nr = commissionRate ?? item.commissionRate ?? 0;
    const extendedPrice = ((item.quantity || 1) * price) / (item.divisor || 1);
    const commission = extendedPrice * (nr / 100);
    onUpdateLineItem(tempId, { unitPrice: price, commissionRate: nr, extendedPrice, commission, pricingSource: source });
    setLineItemPricingSource(prev => ({ ...prev, [tempId]: source }));
    setPricingDropdownOpen(null);
  }, [lineItemMap, onUpdateLineItem]);

  const handleCellChange = useCallback((tempId: string, column: EditableColumnKey, value: string) => {
    const item = lineItemMap.get(tempId);
    if (!item) return;
    const updates: Partial<LocalLineItem> = {};
    switch (column) {
      case 'quantity': { const qty = parseInt(value) || 1; const ep = (qty * (item.unitPrice || 0)) / (item.divisor || 1); updates.quantity = qty; updates.extendedPrice = ep; updates.commission = ep * ((item.commissionRate || 0) / 100); break; }
      case 'unitPrice': { const p = parseFloat(value.replace(/[$,]/g, '')) || 0; const ep = ((item.quantity || 1) * p) / (item.divisor || 1); updates.unitPrice = p; updates.extendedPrice = ep; updates.commission = ep * ((item.commissionRate || 0) / 100); updates.pricingSource = 'manual'; setLineItemPricingSource(prev => ({ ...prev, [tempId]: 'manual' })); break; }
      case 'commissionRate': { const r = parseFloat(value) || 0; updates.commissionRate = r; updates.commission = (item.extendedPrice || 0) * (r / 100); break; }
      case 'divisor': { const d = parseFloat(value) || 1; const ep = ((item.quantity || 1) * (item.unitPrice || 0)) / d; updates.divisor = d; updates.extendedPrice = ep; updates.commission = ep * ((item.commissionRate || 0) / 100); break; }
    }
    onUpdateLineItem(tempId, updates);
    setEditingCell(null);
  }, [lineItemMap, onUpdateLineItem]);

  const handlePricingDropdownToggle = useCallback((tempId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPricingDropdownOpen(prev => prev?.tempId === tempId ? null : { tempId, position: { top: rect.bottom + 4, left: rect.left } });
  }, []);

  useEffect(() => {
    if (!pricingDropdownOpen) return;
    const close = () => setPricingDropdownOpen(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [pricingDropdownOpen]);

  // Row props for react-window v2
  const rowProps = useMemo<RowDataProps>(() => ({
    lineItems, selectedLineItems, visibleColumns, editingCell,
    pricingDropdownOpen, productPricingOptions, lineItemPricingSource,
    onToggleSelection, onCellClick: handleCellClick, onCellChange: handleCellChange,
    onSetEditingCell: setEditingCell, onPricingDropdownToggle: handlePricingDropdownToggle,
    onPricingSourceSelect: handlePricingSourceSelect, onRemoveLineItem, onOpenAdditionalDetails,
  }), [
    lineItems, selectedLineItems, visibleColumns, editingCell,
    pricingDropdownOpen, productPricingOptions, lineItemPricingSource,
    onToggleSelection, handleCellClick, handleCellChange,
    handlePricingDropdownToggle, handlePricingSourceSelect,
    onRemoveLineItem, onOpenAdditionalDetails,
  ]);

  const virtualizedListHeight = useMemo(() => {
    const maxH = Math.min(lineItems.length * ROW_HEIGHT, typeof window !== 'undefined' ? window.innerHeight - 300 : 600);
    return Math.max(maxH, 400);
  }, [lineItems.length]);

  return (
    <div className="space-y-4">
      {selectedLineItems.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedLineItems.size}
          onClearSelection={onClearSelection}
          onDeleteSelected={() => { selectedLineItems.forEach(tempId => onRemoveLineItem(tempId)); onClearSelection(); }}
        />
      )}

      <div ref={containerRef} className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-x-auto">
        <div className="border-b border-[var(--border)]">
          <button onClick={onAddLineItem} className="w-full px-4 py-3 text-sm text-[var(--primary)] hover:bg-[var(--muted)] transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6v8M6 10h8" strokeLinecap="round"/></svg>
            Add Line
          </button>
        </div>

        {useVirt ? (
          <div style={{ minWidth: '1400px' }}>
            <TableHeader visibleColumns={visibleColumns} selectedLineItems={selectedLineItems} lineItemCount={lineItems.length} onToggleAllSelection={onToggleAllSelection} />
            <List<RowDataProps>
              style={{ height: virtualizedListHeight }}
              rowCount={lineItems.length}
              rowHeight={ROW_HEIGHT}
              rowComponent={VirtualizedRowComponent}
              rowProps={rowProps}
            />
          </div>
        ) : (
          <div style={{ minWidth: '1400px' }}>
            <TableHeader visibleColumns={visibleColumns} selectedLineItems={selectedLineItems} lineItemCount={lineItems.length} onToggleAllSelection={onToggleAllSelection} />
            {lineItems.map((item) => (
              <StatementRowInner
                key={item.tempId}
                item={item}
                isSelected={selectedLineItems.has(item.tempId)}
                visibleColumns={visibleColumns}
                editingCell={editingCell}
                pricingDropdownOpen={pricingDropdownOpen}
                productPricingOptions={productPricingOptions}
                lineItemPricingSource={lineItemPricingSource}
                onToggleSelection={onToggleSelection}
                onCellClick={handleCellClick}
                onCellChange={handleCellChange}
                onSetEditingCell={setEditingCell}
                onPricingDropdownToggle={handlePricingDropdownToggle}
                onPricingSourceSelect={handlePricingSourceSelect}
                onRemoveLineItem={onRemoveLineItem}
                onOpenAdditionalDetails={onOpenAdditionalDetails}
              />
            ))}
            {lineItems.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No line items. Click &quot;Add Line&quot; to add your first item.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Dropdown Portal */}
      {dropdownOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(null); setSearchQuery(''); setEditingCell(null); }} />
          <div className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80" style={{ top: dropdownOpen.position.top + 250 > window.innerHeight ? dropdownOpen.position.top - 258 : dropdownOpen.position.top, left: Math.min(dropdownOpen.position.left, window.innerWidth - 330) }}>
            <div className="p-2 border-b border-gray-100">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={isProductDropdown ? "Type to search products..." : isUomDropdown ? "Search UOMs..." : isSoldToDropdown ? "Search customers..." : isEndUserDropdown ? "Search end users..." : "Search..."} className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500" autoFocus />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {isProductDropdown && productsLoading && <div className="px-3 py-4 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>}
              {isProductDropdown && !productsLoading && productResults.map((product) => (
                <button key={product.id} onClick={() => handleProductSelect(dropdownOpen.tempId, product)} className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="font-mono text-sm font-medium">{product.factoryPartNumber}</div>
                  <div className="text-xs text-gray-500 truncate">{product.description}</div>
                </button>
              ))}
              {isProductDropdown && !productsLoading && productResults.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No products found</div>}

              {isUomDropdown && uomsLoading && <div className="px-3 py-4 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>}
              {isUomDropdown && !uomsLoading && (
                <>
                  {uomResults.filter(uom => !searchQuery.trim() || (uom.title && uom.title.toLowerCase().includes(searchQuery.toLowerCase()))).map((uom) => (
                    <button key={uom.id} onClick={() => handleUomSelect(dropdownOpen.tempId, uom)} className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-medium">{uom.title}</div>
                      {uom.divisionFactor && uom.divisionFactor !== 1 && <div className="text-xs text-gray-400">Divisor: {uom.divisionFactor}</div>}
                    </button>
                  ))}
                  {uomResults.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No UOMs found</div>}
                </>
              )}

              {isSoldToDropdown && soldToLoading && <div className="px-3 py-4 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>}
              {isSoldToDropdown && !soldToLoading && soldToResults.map((customer) => (
                <button key={customer.id} onClick={() => handleCustomerSelect(dropdownOpen.tempId, customer, 'soldTo')} className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium">{customer.companyName}</div>
                </button>
              ))}
              {isSoldToDropdown && !soldToLoading && soldToResults.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>}

              {isEndUserDropdown && endUserLoading && <div className="px-3 py-4 text-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto" /></div>}
              {isEndUserDropdown && !endUserLoading && endUserResults.map((customer) => (
                <button key={customer.id} onClick={() => handleCustomerSelect(dropdownOpen.tempId, customer, 'endUser')} className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium">{customer.companyName}</div>
                </button>
              ))}
              {isEndUserDropdown && !endUserLoading && endUserResults.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>}
            </div>
            {isProductDropdown && searchQuery.trim() && (
              <div className="border-t border-gray-100">
                <button onClick={() => { onUpdateLineItem(dropdownOpen.tempId, { productId: undefined, partNumber: searchQuery.trim(), productNameAdhoc: searchQuery.trim() }); setDropdownOpen(null); setEditingCell(null); setSearchQuery(''); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600"><path d="M10 5v10M5 10h10" strokeLinecap="round" /></svg>
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

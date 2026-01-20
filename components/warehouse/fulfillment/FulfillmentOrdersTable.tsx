'use client';

import React, { useState } from 'react';
import type { FulfillmentOrder, FulfillmentOrderStatus } from '../api/fulfillmentApi';
import { fulfillmentOrderStatusColors, fulfillmentOrderStatusLabels } from '@/lib/types/warehouse';
import type { FulfillmentSortField, SortDirection, FulfillmentColumnFilters } from '../WarehouseFulfillmentContent';

interface FulfillmentOrdersTableProps {
  orders: FulfillmentOrder[];
  onRowClick: (order: FulfillmentOrder) => void;
  // Sorting
  sortField: FulfillmentSortField;
  sortDirection: SortDirection;
  onSort: (field: FulfillmentSortField) => void;
  // Filtering
  columnFilters: FulfillmentColumnFilters;
  setColumnFilters: (filters: FulfillmentColumnFilters | ((prev: FulfillmentColumnFilters) => FulfillmentColumnFilters)) => void;
  openFilter: string | null;
  setOpenFilter: (filterId: string | null) => void;
  uniqueCustomers: string[];
  uniqueStatuses: FulfillmentOrderStatus[];
  // Bulk selection
  selectedOrderIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

// Sort Icon Component
function SortIcon({
  field,
  currentSortField,
  currentSortDirection,
}: {
  field: FulfillmentSortField;
  currentSortField: FulfillmentSortField;
  currentSortDirection: SortDirection;
}) {
  const isActive = currentSortField === field;

  return (
    <span className="ml-1 inline-flex flex-col">
      <svg
        className={`w-2 h-2 ${
          isActive && currentSortDirection === 'asc'
            ? 'text-[var(--primary)]'
            : 'text-[var(--muted-foreground)]/50'
        }`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 0L8 4H0L4 0Z" />
      </svg>
      <svg
        className={`w-2 h-2 -mt-0.5 ${
          isActive && currentSortDirection === 'desc'
            ? 'text-[var(--primary)]'
            : 'text-[var(--muted-foreground)]/50'
        }`}
        viewBox="0 0 8 4"
        fill="currentColor"
      >
        <path d="M4 4L0 0H8L4 4Z" />
      </svg>
    </span>
  );
}

// Text Filter Dropdown
function TextFilterDropdown({
  value,
  onChange,
  placeholder,
  isOpen,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasValue = value !== '';

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${
          hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'
        }`}
        title="Filter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] p-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
            {hasValue && (
              <button
                onClick={() => onChange('')}
                className="w-full mt-1 px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// MultiSelect Filter Dropdown
function MultiSelectFilterDropdown({
  options,
  value,
  onChange,
  placeholder,
  isOpen,
  onToggle,
  renderLabel,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  renderLabel?: (opt: string) => string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const hasValue = value.length > 0;

  const filteredOptions = options.filter((opt) =>
    (renderLabel ? renderLabel(opt) : opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${
          hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'
        }`}
        title="Filter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {hasValue && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[10px] rounded-full flex items-center justify-center">
            {value.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] flex flex-col">
            <div className="p-2 border-b border-[var(--border)]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto flex-1 py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No results</div>
              ) : (
                filteredOptions.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[var(--muted)] transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={value.includes(opt)}
                      onChange={() => toggleOption(opt)}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
                    />
                    <span className={value.includes(opt) ? 'text-[var(--primary)] font-medium' : 'text-[var(--foreground)]'}>
                      {renderLabel ? renderLabel(opt) : opt}
                    </span>
                  </label>
                ))
              )}
            </div>
            {hasValue && (
              <div className="p-2 border-t border-[var(--border)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                  className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Date Range Filter Dropdown
function DateRangeFilterDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
}: {
  value: { start: string; end: string };
  onChange: (value: { start: string; end: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasValue = value.start !== '' || value.end !== '';

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`ml-1.5 p-1 rounded hover:bg-[var(--muted)] transition-colors ${
          hasValue ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]/50'
        }`}
        title="Filter"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 p-3 min-w-[200px]">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">From</label>
                <input
                  type="date"
                  value={value.start}
                  onChange={(e) => onChange({ ...value, start: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">To</label>
                <input
                  type="date"
                  value={value.end}
                  onChange={(e) => onChange({ ...value, end: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              {hasValue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ start: '', end: '' });
                  }}
                  className="w-full px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FulfillmentOrdersTable({
  orders,
  onRowClick,
  sortField,
  sortDirection,
  onSort,
  columnFilters,
  setColumnFilters,
  openFilter,
  setOpenFilter,
  uniqueCustomers,
  uniqueStatuses,
  selectedOrderIds,
  onSelectionChange,
}: FulfillmentOrdersTableProps) {
  // State for products popover
  const [productsPopover, setProductsPopover] = useState<{ orderId: string; x: number; y: number } | null>(null);

  const getTotalQty = (fo: FulfillmentOrder) => {
    const total = fo.lineItems.reduce((sum, li) => sum + Number(li.orderedQty), 0);
    // Format to remove unnecessary decimals
    return Number.isInteger(total) ? total : total.toFixed(2);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(orders.map(o => o.id));
    }
  };

  const handleSelectOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedOrderIds.includes(orderId)) {
      onSelectionChange(selectedOrderIds.filter(id => id !== orderId));
    } else {
      onSelectionChange([...selectedOrderIds, orderId]);
    }
  };

  // Check if order has any backorder items (ordered > allocated)
  const hasBackorderItems = (fo: FulfillmentOrder) => {
    return fo.lineItems.some(li => Number(li.backorderQty) > 0 || Number(li.orderedQty) > Number(li.allocatedQty));
  };

  // Get total backorder quantity
  const getTotalBackorderQty = (fo: FulfillmentOrder) => {
    const total = fo.lineItems.reduce((sum, li) => {
      const backorder = Number(li.backorderQty) > 0 ? Number(li.backorderQty) : Math.max(0, Number(li.orderedQty) - Number(li.allocatedQty));
      return sum + backorder;
    }, 0);
    return Number.isInteger(total) ? total : total.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <h3 className="font-semibold text-[var(--foreground)]">Orders Awaiting Fulfillment</h3>
        <p className="text-sm text-[var(--muted-foreground)]">A list of orders with items marked as &quot;Released to Warehouse&quot;.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
              {/* Checkbox */}
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedOrderIds.length === orders.length && orders.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
                />
              </th>
              {/* Order # - Sortable & Filterable */}
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <button
                    onClick={() => onSort('orderNumber')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Order #
                    <SortIcon field="orderNumber" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                  <TextFilterDropdown
                    value={columnFilters.orderNumber}
                    onChange={(value) => setColumnFilters((prev) => ({ ...prev, orderNumber: value }))}
                    placeholder="Search orders..."
                    isOpen={openFilter === 'orderNumber'}
                    onToggle={() => setOpenFilter(openFilter === 'orderNumber' ? null : 'orderNumber')}
                  />
                </div>
              </th>

              {/* Customer - Sortable & Filterable */}
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <button
                    onClick={() => onSort('customerName')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Customer
                    <SortIcon field="customerName" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                  <MultiSelectFilterDropdown
                    options={uniqueCustomers}
                    value={columnFilters.customerName}
                    onChange={(value) => setColumnFilters((prev) => ({ ...prev, customerName: value }))}
                    placeholder="All Customers"
                    isOpen={openFilter === 'customerName'}
                    onToggle={() => setOpenFilter(openFilter === 'customerName' ? null : 'customerName')}
                  />
                </div>
              </th>

              {/* Product - Sortable & Filterable */}
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <button
                    onClick={() => onSort('productName')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Product
                    <SortIcon field="productName" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                  <TextFilterDropdown
                    value={columnFilters.productName}
                    onChange={(value) => setColumnFilters((prev) => ({ ...prev, productName: value }))}
                    placeholder="Search products..."
                    isOpen={openFilter === 'productName'}
                    onToggle={() => setOpenFilter(openFilter === 'productName' ? null : 'productName')}
                  />
                </div>
              </th>

              {/* Qty - Sortable */}
              <th className="px-6 py-3 text-center">
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => onSort('qty')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Qty
                    <SortIcon field="qty" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                </div>
              </th>

              {/* Status - Sortable & Filterable */}
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <button
                    onClick={() => onSort('status')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Status
                    <SortIcon field="status" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                  <MultiSelectFilterDropdown
                    options={uniqueStatuses}
                    value={columnFilters.status}
                    onChange={(value) => setColumnFilters((prev) => ({ ...prev, status: value }))}
                    placeholder="All Statuses"
                    isOpen={openFilter === 'status'}
                    onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                    renderLabel={(opt) => fulfillmentOrderStatusLabels[opt as FulfillmentOrderStatus]}
                  />
                </div>
              </th>

              {/* Manager */}
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Manager
              </th>

              {/* Worker */}
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Worker
              </th>

              {/* Date - Sortable & Filterable */}
              <th className="px-6 py-3 text-left">
                <div className="flex items-center">
                  <button
                    onClick={() => onSort('createdAt')}
                    className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center hover:text-[var(--foreground)] transition-colors"
                  >
                    Date
                    <SortIcon field="createdAt" currentSortField={sortField} currentSortDirection={sortDirection} />
                  </button>
                  <DateRangeFilterDropdown
                    value={columnFilters.dateRange}
                    onChange={(value) => setColumnFilters((prev) => ({ ...prev, dateRange: value }))}
                    isOpen={openFilter === 'dateRange'}
                    onToggle={() => setOpenFilter(openFilter === 'dateRange' ? null : 'dateRange')}
                  />
                </div>
              </th>

              {/* Actions */}
              <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                  No fulfillment orders found
                </td>
              </tr>
            ) : (
              orders.map((fo) => {
                const isSelected = selectedOrderIds.includes(fo.id);
                return (
                <tr
                  key={fo.id}
                  className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${isSelected ? 'bg-[var(--primary)]/5' : ''}`}
                  onClick={() => onRowClick(fo)}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOrder(fo.id, e as unknown as React.MouseEvent)}
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/50"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">
                    <div className="flex items-center gap-2">
                      {fo.order?.orderNumber || '-'}
                      {hasBackorderItems(fo) && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200"
                          title={`${getTotalBackorderQty(fo)} units on backorder`}
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Backorder
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{fo.customer?.companyName || '-'}</td>
                  <td className="px-6 py-4 relative">
                    {fo.lineItems.length === 1 ? (
                      <>
                        <div className="text-sm text-[var(--foreground)]">{fo.lineItems[0].product?.description || fo.lineItems[0].product?.factoryPartNumber || '-'}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{fo.lineItems[0].product?.factoryPartNumber || '-'}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-[var(--foreground)]">{fo.lineItems.length} products</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setProductsPopover(
                              productsPopover?.orderId === fo.id
                                ? null
                                : { orderId: fo.id, x: rect.left, y: rect.bottom + 4 }
                            );
                          }}
                          className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
                        >
                          {fo.lineItems[0].product?.factoryPartNumber || '-'} + {fo.lineItems.length - 1} more
                        </button>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{getTotalQty(fo)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${fulfillmentOrderStatusColors[fo.status]}`}>
                      {fulfillmentOrderStatusLabels[fo.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const managers = fo.assignments?.filter(a => a.role === 'MANAGER') || [];
                      const managerName = managers[0]?.user?.fullName;
                      return managers.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-amber-700">
                              {managerName?.split(' ').map(n => n[0]).join('') || '?'}
                            </span>
                          </div>
                          <span className="text-sm text-[var(--foreground)] truncate max-w-[100px]">
                            {managerName || 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const workers = fo.assignments?.filter(a => a.role === 'WORKER') || [];
                      const workerName = workers[0]?.user?.fullName;
                      return workers.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-700">
                              {workerName?.split(' ').map(n => n[0]).join('') || '?'}
                            </span>
                          </div>
                          <span className="text-sm text-[var(--foreground)] truncate max-w-[100px]">
                            {workerName || 'Unknown'}
                          </span>
                          {workers.length > 1 && (
                            <span className="text-xs text-[var(--muted-foreground)]">+{workers.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--muted-foreground)]">—</span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">{formatDate(fo.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRowClick(fo);
                      }}
                      className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                    >
                      {fo.status === 'PENDING' && 'Release'}
                      {fo.status === 'RELEASED' && 'Start Picking'}
                      {fo.status === 'PICKING' && 'Continue Picking'}
                      {fo.status === 'PACKING' && 'Continue Packing'}
                      {fo.status === 'SHIPPING' && 'Complete Shipping'}
                      {fo.status === 'BACKORDER_REVIEW' && 'Review'}
                      {(fo.status === 'SHIPPED' || fo.status === 'PARTIAL_SHIPPED') && 'Send Confirmation'}
                      {(fo.status === 'COMMUNICATED' || fo.status === 'DELIVERED' || fo.status === 'CANCELLED') && 'View'}
                    </button>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Products Popover */}
      {productsPopover && (() => {
        const order = orders.find(o => o.id === productsPopover.orderId);
        if (!order) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProductsPopover(null)} />
            <div
              className="fixed z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl min-w-[300px] max-w-[400px]"
              style={{ left: productsPopover.x, top: productsPopover.y }}
            >
              <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">Products ({order.lineItems.length})</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">{order.order?.orderNumber || '-'}</p>
                </div>
                <button
                  onClick={() => setProductsPopover(null)}
                  className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {order.lineItems.map((li, idx) => (
                  <div
                    key={li.id}
                    className={`px-4 py-3 flex items-center justify-between ${idx !== order.lineItems.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--foreground)] truncate">{li.product?.description || li.product?.factoryPartNumber || '-'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{li.product?.factoryPartNumber || '-'}</div>
                    </div>
                    <div className="ml-4 text-right flex-shrink-0">
                      <div className="text-sm font-medium text-[var(--foreground)]">
                        {Number.isInteger(Number(li.orderedQty)) ? Number(li.orderedQty) : Number(li.orderedQty).toFixed(2)}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">{li.product?.uom?.title || 'EA'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--muted)]/30">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[var(--muted-foreground)]">Total Qty:</span>
                  <span className="font-semibold text-[var(--foreground)]">{getTotalQty(order)}</span>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

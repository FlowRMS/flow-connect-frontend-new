'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { LineItemV2, ColumnConfig, LineItemColumnKey } from '../types';
import { defaultColumnConfigV2, manufacturerOptions, productOptions } from '../data/mockData';

interface LineItemsTabV2Props {
  lineItems: LineItemV2[];
  onLineItemsChange: (items: LineItemV2[]) => void;
  onOpenColumnsModal: () => void;
  onOpenAdditionalDetails: (item: LineItemV2) => void;
  columnConfig: ColumnConfig[];
}

export function LineItemsTabV2({
  lineItems,
  onLineItemsChange,
  onOpenColumnsModal,
  onOpenAdditionalDetails,
  columnConfig,
}: LineItemsTabV2Props) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showSectionsMenu, setShowSectionsMenu] = useState(false);
  const [editingCell, setEditingCell] = useState<{ itemId: string; column: LineItemColumnKey } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<{ itemId: string; column: LineItemColumnKey; position: { top: number; left: number } } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const visibleColumns = useMemo(
    () => columnConfig.filter((c) => c.visible),
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
    const dropdownColumns: LineItemColumnKey[] = ['partNumber', 'customerPartNumber', 'description', 'manufacturer'];
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

  const handleCellChange = (itemId: string, column: LineItemColumnKey, value: string) => {
    const updates: Partial<LineItemV2> = {};
    if (column === 'quantity') {
      const qty = parseInt(value) || 1;
      const item = lineItems.find((li) => li.id === itemId);
      if (item) {
        updates.quantity = qty;
        updates.sellTotal = qty * item.unitPrice / item.divisor;
        updates.commissionTotal = updates.sellTotal * item.commissionPercent;
      }
    } else if (column === 'uom') {
      updates.uom = value;
    } else if (column === 'divisor') {
      const divisor = parseFloat(value) || 1;
      const item = lineItems.find((li) => li.id === itemId);
      if (item) {
        updates.divisor = divisor;
        updates.sellTotal = item.quantity * item.unitPrice / divisor;
        updates.commissionTotal = updates.sellTotal * item.commissionPercent;
      }
    } else if (column === 'unitPrice') {
      const price = parseFloat(value.replace(/[$,]/g, '')) || 0;
      const item = lineItems.find((li) => li.id === itemId);
      if (item) {
        updates.unitPrice = price;
        updates.sellTotal = item.quantity * price / item.divisor;
        updates.commissionTotal = updates.sellTotal * item.commissionPercent;
      }
    } else if (column === 'commissionPercent') {
      const pct = parseFloat(value) / 100 || 0;
      const item = lineItems.find((li) => li.id === itemId);
      if (item) {
        updates.commissionPercent = pct;
        updates.commission = item.sellTotal * pct / item.quantity;
        updates.commissionTotal = item.sellTotal * pct;
      }
    }
    updateLineItem(itemId, updates);
    setEditingCell(null);
  };

  const addLineItem = () => {
    const newItem: LineItemV2 = {
      id: `li-${Date.now()}`,
      quoteId: lineItems[0]?.quoteId || '',
      partNumber: '',
      description: '',
      manufacturerName: '',
      quantity: 1,
      uom: 'EA',
      divisor: 1,
      unitPrice: 0,
      sellTotal: 0,
      commissionPercent: 0.08,
      commission: 0,
      commissionTotal: 0,
      commissionDiscountPercent: 0,
      commissionDiscountAmount: 0,
      lineDiscountPercent: 0,
      lineDiscountAmount: 0,
    };
    onLineItemsChange([...lineItems, newItem]);
  };

  const renderCell = (item: LineItemV2, column: ColumnConfig) => {
    const isEditing = editingCell?.itemId === item.id && editingCell?.column === column.key;
    const isDropdown = dropdownOpen?.itemId === item.id && dropdownOpen?.column === column.key;
    const dropdownColumns: LineItemColumnKey[] = ['partNumber', 'customerPartNumber', 'description', 'manufacturer'];
    const isDropdownColumn = dropdownColumns.includes(column.key);

    let displayValue = '';
    let editValue = '';

    switch (column.key) {
      case 'partNumber':
        displayValue = item.partNumber || 'Select...';
        break;
      case 'customerPartNumber':
        displayValue = item.customerPartNumber || 'Select...';
        break;
      case 'description':
        displayValue = item.description || 'Select...';
        break;
      case 'manufacturer':
        displayValue = item.manufacturerName || 'Select...';
        break;
      case 'quantity':
        displayValue = item.quantity.toString();
        editValue = item.quantity.toString();
        break;
      case 'uom':
        displayValue = item.uom;
        editValue = item.uom;
        break;
      case 'divisor':
        displayValue = item.divisor.toString();
        editValue = item.divisor.toString();
        break;
      case 'unitPrice':
        displayValue = `$${item.unitPrice.toLocaleString()}`;
        editValue = item.unitPrice.toString();
        break;
      case 'sellTotal':
        displayValue = `$${item.sellTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        break;
      case 'commissionPercent':
        displayValue = (item.commissionPercent * 100).toFixed(2);
        editValue = (item.commissionPercent * 100).toFixed(2);
        break;
      case 'commission':
        displayValue = `$${item.commission.toFixed(2)}`;
        break;
      case 'commissionTotal':
        displayValue = `$${item.commissionTotal.toFixed(2)}`;
        break;
      case 'linkedOrder':
        displayValue = item.linkedOrderNumber || '—';
        break;
      case 'endUser':
        displayValue = item.endUserName || '—';
        break;
      default:
        displayValue = '—';
    }

    // Read-only cells
    if (['sellTotal', 'commission', 'commissionTotal', 'linkedOrder', 'endUser'].includes(column.key)) {
      return (
        <td key={column.key} className="px-3 py-2 text-sm text-center">
          <span className={column.key === 'commissionTotal' ? 'font-medium text-purple-600' : ''}>
            {displayValue}
          </span>
        </td>
      );
    }

    // Dropdown cells
    if (isDropdownColumn) {
      return (
        <td key={column.key} className="px-3 py-2 text-sm relative">
          <button
            onClick={(e) => handleCellClick(item.id, column.key, e)}
            className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 transition-colors flex items-center justify-between gap-1"
          >
            <span className={`truncate ${!item[column.key as keyof LineItemV2] ? 'text-gray-400' : ''}`}>
              {displayValue}
            </span>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400 flex-shrink-0">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </td>
      );
    }

    // Editable cells
    if (isEditing) {
      return (
        <td key={column.key} className="px-3 py-2 text-sm">
          <input
            type="text"
            defaultValue={editValue}
            autoFocus
            onBlur={(e) => handleCellChange(item.id, column.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellChange(item.id, column.key, e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            className="w-full px-2 py-1 text-center border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </td>
      );
    }

    return (
      <td key={column.key} className="px-3 py-2 text-sm text-center">
        <button
          onClick={(e) => handleCellClick(item.id, column.key, e)}
          className={`w-full px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
            column.key === 'commissionPercent' ? 'text-purple-600' : ''
          }`}
        >
          {displayValue}
        </button>
      </td>
    );
  };

  const getDropdownOptions = (column: LineItemColumnKey) => {
    if (column === 'partNumber' || column === 'customerPartNumber' || column === 'description') {
      return productOptions.filter(
        (p) =>
          p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (column === 'manufacturer') {
      return manufacturerOptions.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return [];
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
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-2">
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
                    className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap"
                  >
                    {col.label}
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1 text-gray-400">
                      <path d="M3 4h14M5 8h10M7 12h6M9 16h2" strokeLinecap="round" />
                    </svg>
                  </th>
                ))}
                <th className="w-10 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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
                    <button
                      onClick={() => onOpenAdditionalDetails(item)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
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

        {/* Add Line Button */}
        <button
          onClick={addLineItem}
          className="flex items-center gap-2 mt-3 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round" />
          </svg>
          Add Line
        </button>
      </div>

      {/* Dropdown Portal */}
      {dropdownOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(null); setSearchQuery(''); }} />
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-72"
              style={{ top: dropdownOpen.position.top, left: dropdownOpen.position.left }}
            >
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dropdownOpen.column === 'manufacturer' ? 'Search manufacturers...' : 'Search products...'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {dropdownOpen.column === 'manufacturer'
                  ? manufacturerOptions
                      .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => handleDropdownSelect(dropdownOpen.itemId, 'manufacturer', opt.name)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {opt.name}
                        </button>
                      ))
                  : productOptions
                      .filter(
                        (p) =>
                          p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() =>
                            handleDropdownSelect(dropdownOpen.itemId, dropdownOpen.column, dropdownOpen.column === 'partNumber' ? opt.partNumber : dropdownOpen.column === 'description' ? opt.description : opt.partNumber, {
                              description: opt.description,
                              manufacturer: opt.manufacturer,
                            })
                          }
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-mono text-sm font-medium">{opt.partNumber}</div>
                          <div className="text-xs text-gray-500 truncate">{opt.description}</div>
                        </button>
                      ))}
                {((dropdownOpen.column === 'manufacturer' &&
                  manufacturerOptions.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0) ||
                  (dropdownOpen.column !== 'manufacturer' &&
                    productOptions.filter(
                      (p) =>
                        p.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0)) && (
                  <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                )}
              </div>
              {/* Adhoc option */}
              {searchQuery.trim() && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      if (dropdownOpen.column === 'manufacturer') {
                        handleDropdownSelect(dropdownOpen.itemId, 'manufacturer', searchQuery.trim());
                      } else {
                        handleDropdownSelect(dropdownOpen.itemId, dropdownOpen.column, searchQuery.trim());
                      }
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

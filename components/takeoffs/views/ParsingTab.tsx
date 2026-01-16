/**
 * Parsing Tab Component
 * Schedule Parsing view matching FlowCRM design
 */

import React, { useCallback, useState, useMemo } from 'react';
import type { ParsedItem } from '../types';
import { getSelectableItems } from '../utils';
import { showInfoToast } from '../../lib/toast';

// Sort field types
type SortField = 'manufacturer' | 'partNumber' | 'description' | 'quantity' | 'crossedManufacturer' | 'crossedPartNumber';
type SortDirection = 'asc' | 'desc';

// Per-item crossing state
interface ItemCrossingState {
  isProcessing: boolean;
  error?: string;
}

interface ParsingTabProps {
  items: ParsedItem[];
  selectedItems: Set<string>;
  message?: string | null;
  itemCrossingState?: Record<string, ItemCrossingState>;
  isProductCrossProcessing?: boolean;
  onCrossItem: (itemId: string) => void;
  onCrossSelected: () => void;
  onCrossAll: () => void;
  onToggleSelect: (itemId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onCreateQuote: () => void;
}

export function ParsingTab({
  items,
  selectedItems,
  message,
  itemCrossingState = {},
  isProductCrossProcessing = false,
  onCrossItem,
  onCrossSelected,
  onCrossAll,
  onToggleSelect,
  onSelectAll,
  onCreateQuote,
}: ParsingTabProps) {
  const selectableItems = getSelectableItems(items);
  const allSelected = selectableItems.length > 0 && selectedItems.size === selectableItems.length;

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted items
  const sortedItems = useMemo(() => {
    if (!sortField) return items;

    return [...items].sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'manufacturer':
          aValue = a.manufacturer?.toLowerCase() || '';
          bValue = b.manufacturer?.toLowerCase() || '';
          break;
        case 'partNumber':
          aValue = a.partNumber?.toLowerCase() || '';
          bValue = b.partNumber?.toLowerCase() || '';
          break;
        case 'description':
          aValue = a.description?.toLowerCase() || '';
          bValue = b.description?.toLowerCase() || '';
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'crossedManufacturer':
          aValue = a.crossedManufacturer?.toLowerCase() || '';
          bValue = b.crossedManufacturer?.toLowerCase() || '';
          break;
        case 'crossedPartNumber':
          aValue = a.crossedPartNumber?.toLowerCase() || '';
          bValue = b.crossedPartNumber?.toLowerCase() || '';
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection]);

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => (
    <span className="ml-1 inline-flex">
      {sortField === field ? (
        sortDirection === 'asc' ? '↑' : '↓'
      ) : (
        <span className="text-gray-300">↕</span>
      )}
    </span>
  );

  // Handle "Cross All" button click with toast validation
  const handleCrossAllClick = useCallback(() => {
    // Check if there are items to cross (only our manufacturers are excluded)
    if (selectableItems.length === 0) {
      showInfoToast('No items to cross', { description: 'All items are from our manufacturers.' });
      return;
    }
    // Start crossing
    onCrossAll();
  }, [items, selectableItems, onCrossAll]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Parsed Schedule Items</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review and cross competitor products with your products
          </p>
        </div>
        <button
          onClick={handleCrossAllClick}
          disabled={Object.values(itemCrossingState).some(s => s.isProcessing)}
          className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cross All
        </button>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </th>
              <th
                onClick={() => handleSort('manufacturer')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Manufacturer <SortIndicator field="manufacturer" />
              </th>
              <th
                onClick={() => handleSort('partNumber')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Part Number <SortIndicator field="partNumber" />
              </th>
              <th
                onClick={() => handleSort('description')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Description <SortIndicator field="description" />
              </th>
              <th
                onClick={() => handleSort('quantity')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Quantity <SortIndicator field="quantity" />
              </th>
              <th
                onClick={() => handleSort('crossedManufacturer')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Crossed Manufacturer <SortIndicator field="crossedManufacturer" />
              </th>
              <th
                onClick={() => handleSort('crossedPartNumber')}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Crossed Part Number <SortIndicator field="crossedPartNumber" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Crossed Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <p className="text-sm text-gray-500">
                    {message || 'No parsed items yet'}
                  </p>
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    {!item.isOurManufacturer && !item.isCrossed && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{item.manufacturer}</span>
                      {item.isOurManufacturer ? (
                        <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-medium">
                          Our Mfr
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs font-medium">
                          Competitor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{item.partNumber}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-4">
                    {item.isCrossed && item.crossedManufacturer ? (
                      <span className="text-sm text-teal-600 font-medium">{item.crossedManufacturer}</span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {item.isCrossed && item.crossedPartNumber ? (
                      <span className="text-sm text-teal-600">{item.crossedPartNumber}</span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {item.isCrossed && item.crossedDescription ? (
                      <span className="text-sm text-teal-600 max-w-[180px] truncate block" title={item.crossedDescription}>
                        {item.crossedDescription}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {(() => {
                      const crossState = itemCrossingState[item.id];
                      const isProcessing = crossState?.isProcessing;

                      // Processing state - show spinner
                      if (isProcessing) {
                        return (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            <span>Crossing...</span>
                          </div>
                        );
                      }

                      // Not our manufacturer and not crossed - show Cross button
                      if (!item.isOurManufacturer && !item.isCrossed) {
                        return (
                          <button
                            onClick={() => onCrossItem(item.id)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cross
                          </button>
                        );
                      }

                      // Already crossed - show Re-Cross button
                      if (item.isCrossed) {
                        return (
                          <button
                            onClick={() => onCrossItem(item.id)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Re-Cross
                          </button>
                        );
                      }

                      return null;
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={onCreateQuote}
          className="px-6 py-2 bg-green-600 text-white rounded-full font-medium text-sm hover:bg-green-700 transition-colors"
        >
          Create Quote
        </button>
      </div>
    </div>
  );
}

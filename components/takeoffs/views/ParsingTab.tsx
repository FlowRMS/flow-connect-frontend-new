/**
 * Parsing Tab Component
 * Schedule Parsing view matching FlowCRM design
 */

import React from 'react';
import type { ParsedItem } from '../types';
import { getSelectableItems } from '../utils';

interface ParsingTabProps {
  items: ParsedItem[];
  selectedItems: Set<string>;
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
  onCrossItem,
  onCrossSelected,
  onCrossAll,
  onToggleSelect,
  onSelectAll,
  onCreateQuote,
}: ParsingTabProps) {
  const selectableItems = getSelectableItems(items);
  const allSelected = selectableItems.length > 0 && selectedItems.size === selectableItems.length;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Parsed Items</h3>
          <p className="text-sm text-gray-500">
            Run schedule parsing on your documents to extract product items.
          </p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={onCrossSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Cross Selected ({selectedItems.size})
            </button>
          )}
          <button
            onClick={onCrossAll}
            className="px-4 py-2 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition-colors"
          >
            Cross All
          </button>
        </div>
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Manufacturer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Part Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Crossed Manufacturer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Crossed Part Number
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
            {items.map((item) => (
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
                    <span className="text-sm text-purple-600 font-medium">{item.crossedManufacturer}</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {item.isCrossed && item.crossedPartNumber ? (
                    <span className="text-sm text-gray-600">{item.crossedPartNumber}</span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {item.isCrossed && item.crossedDescription ? (
                    <span className="text-sm text-purple-600 max-w-[180px] truncate block" title={item.crossedDescription}>
                      {item.crossedDescription}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {!item.isOurManufacturer && !item.isCrossed && (
                    <button
                      onClick={() => onCrossItem(item.id)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cross
                    </button>
                  )}
                  {item.isCrossed && (
                    <button
                      onClick={() => onCrossItem(item.id)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Re-Cross
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={onCreateQuote}
          className="px-6 py-2 bg-teal-500 text-white rounded-full font-medium text-sm hover:bg-teal-600 transition-colors"
        >
          Create Quote
        </button>
      </div>
    </div>
  );
}

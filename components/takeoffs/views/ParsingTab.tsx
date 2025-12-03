/**
 * Parsing Tab Component
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

  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Parsed Schedule Items</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Review and cross competitor products with your products
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={onCrossSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Cross Selected ({selectedItems.size})
            </button>
          )}
          <button
            onClick={onCrossAll}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            Cross All
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="accent-[var(--primary)]"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Manufacturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Part Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Crossed Manufacturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Crossed Part Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Crossed Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--muted)]/20">
                <td className="px-6 py-4">
                  {!item.isOurManufacturer && !item.isCrossed && (
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => onToggleSelect(item.id)}
                      className="accent-[var(--primary)]"
                    />
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--foreground)]">{item.manufacturer}</span>
                    {item.isOurManufacturer ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Our Mfr
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                        Competitor
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">{item.partNumber}</td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">{item.description}</td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">{item.quantity}</td>
                <td className="px-6 py-4">
                  {item.isCrossed && item.crossedManufacturer ? (
                    <span className="text-sm text-green-600 font-medium">{item.crossedManufacturer}</span>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.isCrossed && item.crossedPartNumber ? (
                    <span className="text-sm text-green-600">{item.crossedPartNumber}</span>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.isCrossed && item.crossedDescription ? (
                    <span className="text-sm text-green-600">{item.crossedDescription}</span>
                  ) : (
                    <span className="text-sm text-[var(--muted-foreground)]">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {!item.isOurManufacturer && !item.isCrossed && (
                    <button
                      onClick={() => onCrossItem(item.id)}
                      className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      Cross
                    </button>
                  )}
                  {item.isCrossed && (
                    <button
                      onClick={() => onCrossItem(item.id)}
                      className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
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
      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end">
        <button
          onClick={onCreateQuote}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors"
        >
          Create Quote
        </button>
      </div>
    </div>
  );
}

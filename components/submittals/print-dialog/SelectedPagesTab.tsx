'use client';

import React from 'react';
import type { SubmittalItem } from '../../../lib/types/submittals';

interface SelectedPagesTabProps {
  items: SubmittalItem[];
  selectedItemIds: Set<string>;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  selectNoneItems: () => void;
}

export function SelectedPagesTab({
  items,
  selectedItemIds,
  toggleItemSelection,
  selectAllItems,
  selectNoneItems,
}: SelectedPagesTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--foreground)]">Only print these pages</p>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]/50 border-b border-[var(--border)]">
                <th className="w-10 px-3 py-2 text-left font-medium text-[var(--foreground)]">Sel</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Type</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Manufacturer</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--foreground)]">Part</th>
                <th className="px-3 py-2 text-center font-medium text-[var(--foreground)]">Page</th>
                <th className="px-3 py-2 text-center font-medium text-[var(--foreground)]">Page</th>
                <th className="px-3 py-2 text-center font-medium text-[var(--foreground)]">Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-[var(--muted)]/30 transition-colors cursor-pointer ${
                    selectedItemIds.has(item.id) ? 'bg-[var(--primary)]/5' : ''
                  }`}
                  onClick={() => toggleItemSelection(item.id)}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-[var(--primary)] rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-[var(--foreground)] font-medium italic">{item.fixtureType}</td>
                  <td className="px-3 py-2 text-[var(--foreground)] italic">{item.manufacturer}</td>
                  <td className="px-3 py-2 text-[var(--foreground)] italic">{item.catalogNumber}</td>
                  <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">-</td>
                  <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">-</td>
                  <td className="px-3 py-2 text-center text-[var(--muted-foreground)]">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-[var(--foreground)]">
          Types {selectedItemIds.size} of {items.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAllItems}
            className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
          >
            Select All
          </button>
          <button
            onClick={selectNoneItems}
            className="px-4 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--muted)] transition-colors"
          >
            Select None
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Wave, waveStatusColors, waveStatusLabels } from '@/lib/types/warehouse';

interface PickingWavesTableProps {
  waves: Wave[];
}

export default function PickingWavesTable({ waves }: PickingWavesTableProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <h3 className="font-semibold text-[var(--foreground)]">Picking Waves</h3>
        <p className="text-sm text-[var(--muted-foreground)]">Batch picking waves for efficient order fulfillment.</p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Wave #</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Orders</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">Items</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Progress</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Picker</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {waves.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-[var(--muted-foreground)]">
                No waves found
              </td>
            </tr>
          ) : (
            waves.map((wave) => {
              const progress = wave.totalItems > 0 ? Math.round((wave.pickedItems / wave.totalItems) * 100) : 0;
              return (
                <tr key={wave.id} className="hover:bg-[var(--muted)]/20 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--foreground)]">{wave.waveNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${waveStatusColors[wave.status]}`}>
                      {waveStatusLabels[wave.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{wave.fulfillmentCount}</td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)] text-center">{wave.totalItems}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-[var(--primary)]'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)] w-10">{progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">{wave.pickerName || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-3 py-1.5 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded-lg transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}


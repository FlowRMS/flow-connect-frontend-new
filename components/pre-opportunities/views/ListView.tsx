/**
 * List View for Pre-Opportunities
 */

import React from 'react';
import type { PreOpp } from '../types';

interface ListViewProps {
  preOpps: PreOpp[];
}

export function ListView({ preOpps }: ListViewProps) {
  return (
    <div className="bg-white rounded-lg border border-[var(--border)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                <input type="checkbox" className="accent-[var(--primary)]" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Job</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Value</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Sold To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Owner</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {preOpps.map((preOpp) => (
              <tr key={preOpp.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                <td className="px-4 py-3">
                  <input type="checkbox" className="accent-[var(--primary)]" />
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-500">{preOpp.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">{preOpp.name}</td>
                <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{preOpp.job}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded bg-[var(--muted)] text-[var(--foreground)] text-xs">
                    {preOpp.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--foreground)]">{preOpp.value}</td>
                <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{preOpp.soldTo}</td>
                <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{preOpp.owner}</td>
                <td className="px-4 py-3 text-sm">
                  <button className="text-[var(--primary)] hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

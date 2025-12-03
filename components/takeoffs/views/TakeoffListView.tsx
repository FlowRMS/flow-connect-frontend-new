/**
 * Take-Off List View Component
 */

import React from 'react';
import type { Takeoff } from '../types';
import { getStatusColor } from '../utils';

interface TakeoffListViewProps {
  takeoffs: Takeoff[];
  onTakeoffClick: (takeoff: Takeoff) => void;
  onViewQuote?: (quoteId: string) => void;
}

export function TakeoffListView({ 
  takeoffs, 
  onTakeoffClick,
  onViewQuote 
}: TakeoffListViewProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Takeoff Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {takeoffs.map((takeoff) => (
              <tr
                key={takeoff.id}
                className="hover:bg-[var(--muted)]/20 cursor-pointer"
                onClick={() => onTakeoffClick(takeoff)}
              >
                <td className="px-6 py-4">
                  <div>
                    <h3 className="font-medium text-[var(--foreground)]">{takeoff.title}</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{takeoff.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                  {takeoff.source}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                  {takeoff.createdBy}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                  {takeoff.createdDate}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(takeoff.status)}`}>
                    {takeoff.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTakeoffClick(takeoff);
                      }}
                      className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      View
                    </button>
                    {takeoff.quoteId && onViewQuote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewQuote(takeoff.quoteId!);
                        }}
                        className="px-3 py-1.5 border border-[var(--border)] text-[var(--foreground)] rounded-md text-sm hover:bg-[var(--muted)] transition-colors"
                      >
                        View Quote
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

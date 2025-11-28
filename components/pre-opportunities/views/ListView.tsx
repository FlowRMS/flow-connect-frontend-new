/**
 * List View for Pre-Opportunities
 */

import React from 'react';
import Link from 'next/link';
import type { PreOpportunityLandingPage } from '../types';
import { formatCurrency, formatDate, getStatusLabel, getStageColor } from '../utils';
import { useDeleteCRMPreOpportunity } from '../../hooks/useCRMApi';

interface ListViewProps {
  preOpps: PreOpportunityLandingPage[];
  onRefresh: () => void;
}

export function ListView({ preOpps, onRefresh }: ListViewProps) {
  const deleteMutation = useDeleteCRMPreOpportunity();

  const handleDelete = async (id: string, entityNumber: string) => {
    if (!confirm(`Are you sure you want to delete pre-opportunity ${entityNumber}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete pre-opportunity');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[var(--border)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--muted)] border-b border-[var(--border)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Entity Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Entity Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Expiration Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Created By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {preOpps.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No pre-opportunities found
                </td>
              </tr>
            ) : (
              preOpps.map((preOpp) => (
                <tr key={preOpp.id} className="hover:bg-[var(--muted)]/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                    <Link href={`/pre-opportunities/${preOpp.id}`} className="hover:text-[var(--primary)] hover:underline">
                      {preOpp.entityNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStageColor(preOpp.status)}`}>
                      {getStatusLabel(preOpp.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[var(--foreground)]">
                    {formatCurrency(preOpp.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    {formatDate(preOpp.entityDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    {preOpp.expDate ? formatDate(preOpp.expDate) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    {preOpp.createdBy}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pre-opportunities/${preOpp.id}`}
                        className="text-[var(--primary)] hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(preOpp.id, preOpp.entityNumber)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


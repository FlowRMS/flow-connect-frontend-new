/**
 * List View for Pre-Opportunities
 * Enhanced with Jobs-style styling, hover states, and visual feedback
 */

import React from 'react';
import Link from 'next/link';
import type { PreOpportunityLandingPage, PreOpportunityStatus } from '../types';
import { formatCurrency, formatDate, getStatusLabel } from '../utils';
import { useDeleteCRMPreOpportunity } from '../../hooks/useCRMApi';
import { preOpportunityToasts } from '../../lib/toast';

// Status color mapping - Jobs style
const STATUS_COLORS: Record<PreOpportunityStatus, { bg: string; text: string; dot: string }> = {
  'QUALIFIED': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'NEGOTIATION': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'FOLLOW_UP': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'WAITING_ON_FACTORY': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'LOST': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'WON': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
};

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
      preOpportunityToasts.deleteSuccess(entityNumber);
      onRefresh();
    } catch (error) {
      console.error('Failed to delete:', error);
      preOpportunityToasts.deleteError(error instanceof Error ? error.message : undefined);
    }
  };

  const getStatusColor = (status: PreOpportunityStatus) => {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.QUALIFIED;
    return `${colors.bg} ${colors.text}`;
  };

  const getStatusDotColor = (status: PreOpportunityStatus) => {
    return STATUS_COLORS[status]?.dot || 'bg-blue-500';
  };

  // Get owner initials and color
  const getOwnerInitials = (owner: string) => {
    if (!owner) return '?';
    const parts = owner.split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return owner.substring(0, 2).toUpperCase();
  };

  const getOwnerColor = (id: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)] bg-gray-50/80">
            <div className="col-span-3 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Entity Number
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Total Value
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Dates
            </div>
            <div className="col-span-2 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Created By
            </div>
            <div className="col-span-1 text-[10px] md:text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[var(--border)]">
            {preOpps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm">No pre-opportunities found</span>
              </div>
            ) : (
              preOpps.map((preOpp) => {
                const isConverted = preOpp.status === 'WON';
                const ownerInitials = getOwnerInitials(preOpp.createdBy);
                const ownerColor = getOwnerColor(preOpp.id);

                return (
                  <Link
                    key={preOpp.id}
                    href={`/pre-opportunities/${preOpp.id}`}
                    className={`
                      grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4
                      hover:bg-blue-50/50 transition-colors cursor-pointer
                      group
                      ${isConverted ? 'bg-gray-50/50' : ''}
                    `}
                  >
                    {/* Entity Number */}
                    <div className={`col-span-3 min-w-0 ${isConverted ? 'opacity-60' : ''}`}>
                      <h3 className={`font-semibold text-sm md:text-base text-[var(--foreground)] mb-0.5 md:mb-1 group-hover:text-blue-600 transition-colors truncate
                        ${isConverted ? 'line-through text-gray-500' : ''}
                      `}>
                        {preOpp.entityNumber}
                      </h3>
                      <p className={`text-[10px] md:text-xs text-[var(--muted-foreground)]
                        ${isConverted ? 'line-through' : ''}
                      `}>
                        {formatDate(preOpp.entityDate)}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 flex items-center">
                      <span className={`inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${getStatusColor(preOpp.status)}`}>
                        <span className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full flex-shrink-0 ${getStatusDotColor(preOpp.status)}`}></span>
                        <span className="truncate">{getStatusLabel(preOpp.status)}</span>
                      </span>
                    </div>

                    {/* Total Value */}
                    <div className={`col-span-2 flex items-center ${isConverted ? 'opacity-60' : ''}`}>
                      <span className={`font-semibold text-sm md:text-base text-blue-600 ${isConverted ? 'line-through' : ''}`}>
                        {formatCurrency(preOpp.total)}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className={`col-span-2 flex flex-col justify-center text-xs md:text-sm ${isConverted ? 'opacity-60' : ''}`}>
                      <div className={`flex items-center gap-1 text-[var(--muted-foreground)]
                        ${isConverted ? 'line-through' : ''}
                      `}>
                        <span className="text-[10px] md:text-xs text-gray-400">Created:</span>
                        <span className="text-[10px] md:text-xs">{formatDate(preOpp.createdAt)}</span>
                      </div>
                      {preOpp.expDate && (
                        <div className={`flex items-center gap-1 text-[var(--muted-foreground)]
                          ${isConverted ? 'line-through' : ''}
                        `}>
                          <span className="text-[10px] md:text-xs text-gray-400">Exp:</span>
                          <span className="text-[10px] md:text-xs">{formatDate(preOpp.expDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Created By */}
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 md:w-7 md:h-7 rounded-full ${ownerColor} flex items-center justify-center
                                     text-white text-[10px] md:text-xs font-semibold shadow-sm flex-shrink-0`}
                          title={preOpp.createdBy}
                        >
                          {ownerInitials}
                        </div>
                        <span className={`text-xs md:text-sm text-[var(--muted-foreground)] truncate
                          ${isConverted ? 'line-through opacity-60' : ''}
                        `}>
                          {preOpp.createdBy}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(preOpp.id, preOpp.entityNumber);
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="md:w-4 md:h-4">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

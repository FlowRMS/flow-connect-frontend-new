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
  'DRAFT': { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  'PENDING': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'APPROVED': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'REJECTED': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'CONVERTED': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
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
    const colors = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;
    return `${colors.bg} ${colors.text}`;
  };

  const getStatusDotColor = (status: PreOpportunityStatus) => {
    return STATUS_COLORS[status]?.dot || 'bg-gray-400';
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
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] bg-gray-50/80">
        <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Entity Number
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Status
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Total Value
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Dates
        </div>
        <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
          Created By
        </div>
        <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
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
            const isConverted = preOpp.status === 'CONVERTED';
            const ownerInitials = getOwnerInitials(preOpp.createdBy);
            const ownerColor = getOwnerColor(preOpp.id);
            
            return (
              <Link
                key={preOpp.id}
                href={`/pre-opportunities/${preOpp.id}`}
                className={`
                  grid grid-cols-12 gap-4 px-6 py-4 
                  hover:bg-blue-50/50 transition-colors cursor-pointer
                  group
                  ${isConverted ? 'bg-gray-50/50' : ''}
                `}
              >
                {/* Entity Number */}
                <div className={`col-span-3 ${isConverted ? 'opacity-60' : ''}`}>
                  <h3 className={`font-semibold text-[var(--foreground)] mb-1 group-hover:text-blue-600 transition-colors
                    ${isConverted ? 'line-through text-gray-500' : ''}
                  `}>
                    {preOpp.entityNumber}
                  </h3>
                  <p className={`text-xs text-[var(--muted-foreground)]
                    ${isConverted ? 'line-through' : ''}
                  `}>
                    {formatDate(preOpp.entityDate)}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(preOpp.status)}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(preOpp.status)}`}></span>
                    {getStatusLabel(preOpp.status)}
                  </span>
                </div>

                {/* Total Value */}
                <div className={`col-span-2 flex items-center ${isConverted ? 'opacity-60' : ''}`}>
                  <span className={`font-semibold text-blue-600 ${isConverted ? 'line-through' : ''}`}>
                    {formatCurrency(preOpp.total)}
                  </span>
                </div>

                {/* Dates */}
                <div className={`col-span-2 flex flex-col justify-center text-sm ${isConverted ? 'opacity-60' : ''}`}>
                  <div className={`flex items-center gap-1 text-[var(--muted-foreground)]
                    ${isConverted ? 'line-through' : ''}
                  `}>
                    <span className="text-xs text-gray-400">Created:</span>
                    <span className="text-xs">{formatDate(preOpp.createdAt)}</span>
                  </div>
                  {preOpp.expDate && (
                    <div className={`flex items-center gap-1 text-[var(--muted-foreground)]
                      ${isConverted ? 'line-through' : ''}
                    `}>
                      <span className="text-xs text-gray-400">Exp:</span>
                      <span className="text-xs">{formatDate(preOpp.expDate)}</span>
                    </div>
                  )}
                </div>

                {/* Created By */}
                <div className="col-span-2 flex items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-7 h-7 rounded-full ${ownerColor} flex items-center justify-center 
                                 text-white text-xs font-semibold shadow-sm`}
                      title={preOpp.createdBy}
                    >
                      {ownerInitials}
                    </div>
                    <span className={`text-sm text-[var(--muted-foreground)] truncate max-w-[100px]
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
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
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
  );
}

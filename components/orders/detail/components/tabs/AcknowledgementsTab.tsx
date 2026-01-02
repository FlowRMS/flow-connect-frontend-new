/**
 * AcknowledgementsTab Component
 * Displays acknowledgements for the order with full functionality
 */

'use client';

import React, { useState } from 'react';
import type { AcknowledgementLandingPage, AcknowledgementCreationType } from '../../../api/acknowledgementsApi';

// Creation Type Configuration with colors
const CREATION_TYPE_CONFIG: Record<AcknowledgementCreationType, { label: string; color: string; bgColor: string }> = {
  MANUAL: { label: 'Manual', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IMPORT: { label: 'Import', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  API: { label: 'API', color: 'text-green-700', bgColor: 'bg-green-100' },
  DUPLICATION: { label: 'Duplicated', color: 'text-amber-700', bgColor: 'bg-amber-100' },
};

interface AcknowledgementsTabProps {
  acknowledgements?: AcknowledgementLandingPage[];
  isLoading?: boolean;
  error?: Error | null;
  onAddAcknowledgement: () => void;
  onViewAcknowledgement?: (acknowledgement: AcknowledgementLandingPage) => void;
  onEditAcknowledgement?: (acknowledgement: AcknowledgementLandingPage) => void;
  onDeleteAcknowledgement?: (acknowledgement: AcknowledgementLandingPage) => void;
}

export function AcknowledgementsTab({
  acknowledgements = [],
  isLoading = false,
  error = null,
  onAddAcknowledgement,
  onViewAcknowledgement,
  onEditAcknowledgement,
  onDeleteAcknowledgement,
}: AcknowledgementsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'quantity' | 'number' | 'shipDate'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort acknowledgements
  const filteredAcknowledgements = acknowledgements
    .filter(ack => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !ack.orderAcknowledgementNumber?.toLowerCase().includes(search) &&
          !ack.productName?.toLowerCase().includes(search) &&
          !ack.factoryName?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.entityDate || '').getTime() - new Date(b.entityDate || '').getTime();
          break;
        case 'shipDate':
          comparison = new Date(a.shipDate || '').getTime() - new Date(b.shipDate || '').getTime();
          break;
        case 'quantity':
          comparison = parseInt(a.quantity || '0') - parseInt(b.quantity || '0');
          break;
        case 'number':
          comparison = (a.orderAcknowledgementNumber || '').localeCompare(b.orderAcknowledgementNumber || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Calculate totals
  const totals = {
    totalQty: filteredAcknowledgements.reduce((sum, a) => sum + parseInt(a.quantity || '0'), 0),
    count: filteredAcknowledgements.length,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading acknowledgements...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16v.01"/>
            </svg>
          </div>
          <p className="text-sm text-red-600 mb-2">Failed to load acknowledgements</p>
          <p className="text-xs text-[var(--muted-foreground)]">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Acknowledgements</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
              {totals.count} acknowledgement{totals.count !== 1 ? 's' : ''}
            </span>
            {totals.totalQty > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {totals.totalQty} total qty
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onAddAcknowledgement}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
          </svg>
          Add Acknowledgement
        </button>
      </div>

      {/* Filters */}
      {acknowledgements.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="9" cy="9" r="6"/>
              <path d="M13 13l4 4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search acknowledgements..."
              className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>
        </div>
      )}

      {/* Acknowledgements Table */}
      {filteredAcknowledgements.length === 0 ? (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--muted)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--muted-foreground)]">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h4 className="text-lg font-medium text-[var(--foreground)] mb-2">
              {acknowledgements.length === 0 ? 'No Acknowledgements Yet' : 'No Matching Acknowledgements'}
            </h4>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 max-w-sm mx-auto">
              {acknowledgements.length === 0
                ? 'Acknowledgements track factory confirmations of order quantities and expected ship dates.'
                : 'Try adjusting your search criteria.'}
            </p>
            {acknowledgements.length === 0 && (
              <button
                onClick={onAddAcknowledgement}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                </svg>
                Create First Acknowledgement
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
                <th
                  className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('number')}
                >
                  <div className="flex items-center gap-1">
                    Ack #
                    {sortField === 'number' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Ack Date
                    {sortField === 'date' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Product</th>
                <th className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Factory</th>
                <th
                  className="text-right px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Qty
                    {sortField === 'quantity' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs cursor-pointer hover:text-[var(--foreground)] transition-colors"
                  onClick={() => toggleSort('shipDate')}
                >
                  <div className="flex items-center gap-1">
                    Ship Date
                    {sortField === 'shipDate' && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className={sortDirection === 'asc' ? 'rotate-180' : ''}>
                        <path d="M5 8l5 5 5-5"/>
                      </svg>
                    )}
                  </div>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Type</th>
                <th className="text-center px-4 py-3 font-semibold text-[var(--muted-foreground)] uppercase text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredAcknowledgements.map((ack) => {
                const typeConfig = ack.creationType ? CREATION_TYPE_CONFIG[ack.creationType] : null;

                return (
                  <tr
                    key={ack.id}
                    className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                    onClick={() => onViewAcknowledgement?.(ack)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--primary)]">
                        {ack.orderAcknowledgementNumber || `ACK-${ack.id.substring(0, 8)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {formatDate(ack.entityDate)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[200px] truncate" title={ack.productName || ''}>
                      {ack.productName || '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)] max-w-[150px] truncate" title={ack.factoryName || ''}>
                      {ack.factoryName || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">
                      {ack.quantity || '-'}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {formatDate(ack.shipDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {typeConfig && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onViewAcknowledgement?.(ack)}
                          className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                          title="View details"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="10" cy="10" r="3"/>
                            <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/>
                          </svg>
                        </button>
                        {onEditAcknowledgement && (
                          <button
                            onClick={() => onEditAcknowledgement(ack)}
                            className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors"
                            title="Edit acknowledgement"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-9 9-3.5 1 1-3.5 9-9z"/>
                            </svg>
                          </button>
                        )}
                        {onDeleteAcknowledgement && (
                          <button
                            onClick={() => onDeleteAcknowledgement(ack)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors text-[var(--muted-foreground)] hover:text-red-600"
                            title="Delete acknowledgement"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 6h12M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 10v5M12 10v5M5 6l1 11a2 2 0 002 2h4a2 2 0 002-2l1-11"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredAcknowledgements.length > 0 && (
              <tfoot className="bg-[var(--muted)]/20 border-t border-[var(--border)]">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-[var(--foreground)]">{totals.totalQty}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * OrderSelectModal Component
 * Modal for selecting an order to create an acknowledgement for
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useOrderSearch, type OrderSearchResult } from '@/components/orders/api/useOrdersApi';

interface OrderSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (orderId: string) => void;
  isLoading?: boolean;
}

export function OrderSelectModal({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
}: OrderSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: orders, isLoading: isSearching } = useOrderSearch(searchTerm, 50, true);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (order: OrderSearchResult) => {
    onSelect(order.id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4 bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              Select Order
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Choose an order to create an acknowledgement for
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="9" cy="9" r="6"/>
              <path d="M13.5 13.5L17 17" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by order number, customer, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-teal-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm text-[var(--muted-foreground)]">Loading order details...</span>
              </div>
            </div>
          )}

          {!isLoading && orders && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
              </div>
              <h4 className="text-lg font-medium text-[var(--foreground)] mb-1">No Orders Found</h4>
              <p className="text-sm text-[var(--muted-foreground)]">
                Try adjusting your search criteria
              </p>
            </div>
          )}

          {!isLoading && orders && orders.length > 0 && (
            <div className="space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className="w-full p-4 text-left bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-teal-500 hover:bg-teal-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                          <rect x="9" y="3" width="6" height="4" rx="1"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)] group-hover:text-teal-700">
                          Order #{order.orderNumber}
                        </div>
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {order.jobName || 'No job'}
                          {order.entityDate && (
                            <span className="ml-2">
                              • {new Date(order.entityDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] group-hover:text-teal-600 transition-colors">
                      <path d="M7 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

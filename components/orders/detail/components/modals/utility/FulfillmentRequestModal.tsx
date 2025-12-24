/**
 * FulfillmentRequestModal Component
 * Modal for generating fulfillment requests for warehouse products
 */

'use client';

import React from 'react';

interface LineItemForFulfillment {
  id: string;
  partNumber: string;
  quantity: number;
  hasExistingRequest: boolean;
}

interface FulfillmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'all' | 'selected';
  lineItems: LineItemForFulfillment[];
  onConfirm: () => void;
}

export function FulfillmentRequestModal({
  isOpen,
  onClose,
  mode,
  lineItems,
  onConfirm,
}: FulfillmentRequestModalProps) {
  if (!isOpen) return null;

  const canGenerateRequest = lineItems.filter(p => !p.hasExistingRequest).length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600">
                <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12h8M8 16h5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Generate Fulfillment Request
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {mode === 'all'
                  ? 'Create fulfillment request for all warehouse products'
                  : `Create fulfillment request for ${lineItems.filter(p => !p.hasExistingRequest).length} selected product(s)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {lineItems.filter(p => !p.hasExistingRequest).length}
              </div>
              <div className="text-sm text-orange-600">Items to Include</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {lineItems.filter(p => p.hasExistingRequest).length}
              </div>
              <div className="text-sm text-gray-600">Already Have Requests</div>
            </div>
          </div>

          {/* Products list */}
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Warehouse Products</span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-2 flex items-center justify-between border-b border-[var(--border)] last:border-0 ${
                    item.hasExistingRequest ? 'bg-gray-50' : ''
                  }`}
                >
                  <div>
                    <span className="text-sm font-medium">{item.partNumber}</span>
                    <span className="text-xs text-[var(--muted-foreground)] ml-2">Qty: {item.quantity}</span>
                  </div>
                  {item.hasExistingRequest ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Has Request
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                      Will Include
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info message */}
          {canGenerateRequest && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 flex-shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 7v3M10 13h.01" strokeLinecap="round"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  A fulfillment request will be generated
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  The request will be sent to the warehouse for processing. You can track the status in the Fulfillment # column.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canGenerateRequest}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Generate Request
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * WarehouseConversionModal Component
 * Modal for converting products to warehouse consignment for invoices
 */

'use client';

import React from 'react';

interface ProductToConvert {
  id: string;
  partNumber: string;
  isAlreadyWarehouse: boolean;
}

interface WarehouseConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'all' | 'selected';
  productsToConvert: ProductToConvert[];
  onConfirm: () => void;
}

export function WarehouseConversionModal({
  isOpen,
  onClose,
  mode,
  productsToConvert,
  onConfirm,
}: WarehouseConversionModalProps) {
  if (!isOpen) return null;

  const canConvert = productsToConvert.filter((p) => !p.isAlreadyWarehouse).length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-teal-600"
              >
                <path
                  d="M3 7h14l-1.5 9H4.5L3 7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 7V5a2 2 0 012-2v0a2 2 0 012 2v2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {mode === 'all'
                  ? 'Make Warehouse Order'
                  : 'Convert to Warehouse Products'}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {mode === 'all'
                  ? 'Mark all products for warehouse fulfillment'
                  : `Convert ${productsToConvert.filter((p) => !p.isAlreadyWarehouse).length} selected product(s)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
            }}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="text-2xl font-bold text-teal-700">
                {productsToConvert.filter((p) => !p.isAlreadyWarehouse).length}
              </div>
              <div className="text-sm text-teal-600">Products to Convert</div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {productsToConvert.filter((p) => p.isAlreadyWarehouse).length}
              </div>
              <div className="text-sm text-gray-600">Already Warehouse</div>
            </div>
          </div>

          {/* Products list */}
          <div className="border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">
                Products
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {productsToConvert.map((product) => (
                <div
                  key={product.id}
                  className={`px-4 py-2 flex items-center justify-between border-b border-[var(--border)] last:border-0 ${
                    product.isAlreadyWarehouse ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className="text-sm font-medium">{product.partNumber}</span>
                  {product.isAlreadyWarehouse ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-700 flex items-center gap-1">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path
                          d="M5 12l5 5L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Already Warehouse
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-700">
                      Will Convert
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warning message */}
          {productsToConvert.filter((p) => !p.isAlreadyWarehouse).length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-amber-600 flex-shrink-0 mt-0.5"
              >
                <path d="M10 6v4M10 14h.01" strokeLinecap="round" />
                <path
                  d="M3 17h14l-7-12-7 12z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  These products will be marked as warehouse consignment
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  This will enable inventory tracking and warehouse fulfillment for
                  these products.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
            }}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConvert}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M5 10l3 3 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Convert to Warehouse
          </button>
        </div>
      </div>
    </div>
  );
}


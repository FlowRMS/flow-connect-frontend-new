/**
 * SettingsTab Component
 * Displays invoice settings - these are inherited from the linked order and read-only
 */

'use client';

import React from 'react';
import type { EditableInvoice } from '../../types';

interface SettingsTabProps {
  invoice?: EditableInvoice | null;
}

export function SettingsTab({ invoice }: SettingsTabProps) {
  // Get per-line-item settings from invoice (inherited from order)
  const endUserPerLineItem = invoice?.endUserPerLineItem ?? false;
  const outsidePerLineItem = invoice?.outsidePerLineItem ?? false;
  const insidePerLineItem = invoice?.insidePerLineItem ?? false;
  const isConnectedToOrder = !!(invoice?.orderId);

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4 pb-32">
        {/* Info banner for order-connected invoices */}
        {isConnectedToOrder && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-blue-500 mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div>
                <p className="text-sm text-blue-800 font-medium">Settings inherited from order</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  These settings were set on the linked order and cannot be changed on the invoice.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Settings */}
        <div className="space-y-4">
          {/* Specify End User Per Line */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  endUserPerLineItem ? 'bg-indigo-600' : 'bg-gray-200'
                } ${isConnectedToOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    endUserPerLineItem ? 'left-5' : 'left-1'
                  }`}
                />
              </div>
              <div>
                <span className="text-sm text-gray-900">Specify end user per line item</span>
                <p className="text-xs text-gray-500">
                  {endUserPerLineItem
                    ? 'End user is set on each line item in Additional Details'
                    : 'End user is set in header for all lines'}
                </p>
              </div>
            </div>
            {isConnectedToOrder && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">From Order</span>
            )}
          </div>

          {/* Outside Rep at Line Level */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  outsidePerLineItem ? 'bg-indigo-600' : 'bg-gray-200'
                } ${isConnectedToOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    outsidePerLineItem ? 'left-5' : 'left-1'
                  }`}
                />
              </div>
              <div>
                <span className="text-sm text-gray-900">Outside rep at line item level</span>
                <p className="text-xs text-gray-500">
                  {outsidePerLineItem
                    ? 'Outside rep commission split is set per line item'
                    : 'Outside rep is set in header for all lines'}
                </p>
              </div>
            </div>
            {isConnectedToOrder && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">From Order</span>
            )}
          </div>

          {/* Inside Rep at Line Level */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  insidePerLineItem ? 'bg-indigo-600' : 'bg-gray-200'
                } ${isConnectedToOrder ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    insidePerLineItem ? 'left-5' : 'left-1'
                  }`}
                />
              </div>
              <div>
                <span className="text-sm text-gray-900">Inside rep at line item level</span>
                <p className="text-xs text-gray-500">
                  {insidePerLineItem
                    ? 'Inside rep commission split is set per line item'
                    : 'Inside rep is set in header for all lines'}
                </p>
              </div>
            </div>
            {isConnectedToOrder && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">From Order</span>
            )}
          </div>
        </div>

        {/* No order connected message */}
        {!isConnectedToOrder && (
          <div className="mt-8 text-center py-8 border border-dashed border-gray-200 rounded-lg">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto text-gray-300 mb-3"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <p className="text-sm text-gray-500">No order linked</p>
            <p className="text-xs text-gray-400 mt-1">
              Settings will be inherited when this invoice is linked to an order
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsTab;

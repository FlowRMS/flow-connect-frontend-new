'use client';

import React from 'react';
import type { LinkedObjectV2 } from '../types';

interface LinkedObjectsTabV2Props {
  linkedObjects: LinkedObjectV2[];
}

function getStatusBadge(status: string): { class: string; label: string } {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'processing') {
    return { class: 'bg-blue-100 text-blue-700', label: status };
  }
  if (s === 'pending') {
    return { class: 'bg-yellow-100 text-yellow-700', label: status };
  }
  if (s === 'shipped' || s === 'paid' || s === 'completed') {
    return { class: 'bg-green-100 text-green-700', label: status };
  }
  return { class: 'bg-gray-100 text-gray-700', label: status };
}

function getTypeIcon(type: LinkedObjectV2['type']) {
  switch (type) {
    case 'pre-opportunity':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
          <path d="M13 7l-3 5-3-2-3 4M3 3v14h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'order':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
          <rect x="3" y="3" width="14" height="14" rx="2" />
          <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
        </svg>
      );
    case 'invoice':
      return (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
          <rect x="4" y="3" width="12" height="14" rx="2" />
          <path d="M8 7h4M8 10h4M8 13h2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function LinkedObjectsTabV2({ linkedObjects }: LinkedObjectsTabV2Props) {
  const preOpportunities = linkedObjects.filter((o) => o.type === 'pre-opportunity');
  const orders = linkedObjects.filter((o) => o.type === 'order');
  const invoices = linkedObjects.filter((o) => o.type === 'invoice');

  const renderSection = (
    title: string,
    items: LinkedObjectV2[],
    linkLabel: string
  ) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{title}</span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
            {items.length}
          </span>
        </div>
        <button className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors">
          + {linkLabel}
        </button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const statusBadge = getStatusBadge(item.status);

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-gray-500">{item.number}</span>
                      <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900">
                    ${item.amount.toLocaleString()}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No {title.toLowerCase()} linked
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900">Linked Objects</h3>
          <p className="text-sm text-gray-500">Related entities connected to this quote</p>
        </div>

        {/* Sections */}
        {renderSection('Pre-Opportunities', preOpportunities, 'Link Pre-Opp')}
        {renderSection('Orders', orders, 'Link Order')}
        {renderSection('Invoices', invoices, 'Link Invoice')}
      </div>
    </div>
  );
}

export default LinkedObjectsTabV2;

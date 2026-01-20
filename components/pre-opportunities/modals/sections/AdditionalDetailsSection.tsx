/**
 * Additional Details Section for Create Pre-Opportunity Modal
 */

'use client';

import React from 'react';

interface AdditionalDetailsSectionProps {
  customerRef: string;
  setCustomerRef: (value: string) => void;
}

export function AdditionalDetailsSection({
  customerRef,
  setCustomerRef,
}: AdditionalDetailsSectionProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Additional Details
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Customer Reference
        </label>
        <input
          type="text"
          value={customerRef}
          onChange={(e) => setCustomerRef(e.target.value)}
          className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          placeholder="Optional reference"
        />
      </div>
    </div>
  );
}

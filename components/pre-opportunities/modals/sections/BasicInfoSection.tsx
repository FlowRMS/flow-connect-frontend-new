/**
 * Basic Information Section for Create Pre-Opportunity Modal
 */

'use client';

import React from 'react';
import type { PreOpportunityStatus } from '../../types';

interface BasicInfoSectionProps {
  entityNumber: string;
  setEntityNumber: (value: string) => void;
  entityDate: string;
  setEntityDate: (value: string) => void;
  status: PreOpportunityStatus;
  setStatus: (value: PreOpportunityStatus) => void;
  expDate: string;
  setExpDate: (value: string) => void;
  reviseDate: string;
  setReviseDate: (value: string) => void;
  acceptDate: string;
  setAcceptDate: (value: string) => void;
}

export function BasicInfoSection({
  entityNumber,
  setEntityNumber,
  entityDate,
  setEntityDate,
  status,
  setStatus,
  expDate,
  setExpDate,
  reviseDate,
  setReviseDate,
  acceptDate,
  setAcceptDate,
}: BasicInfoSectionProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Basic Information
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={entityNumber}
            onChange={(e) => setEntityNumber(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            placeholder="PO-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entity Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={entityDate}
            onChange={(e) => setEntityDate(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PreOpportunityStatus)}
            required
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CONVERTED">Converted</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date
          </label>
          <input
            type="date"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Revise Date
          </label>
          <input
            type="date"
            value={reviseDate}
            onChange={(e) => setReviseDate(e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Accept Date
          </label>
          <input
            type="date"
            value={acceptDate}
            onChange={(e) => setAcceptDate(e.target.value)}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

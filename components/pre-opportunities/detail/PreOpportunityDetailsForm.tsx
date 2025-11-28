/**
 * Pre-Opportunity Details Form Component
 */

import React from 'react';
import type { PreOpportunity, PreOpportunityStatus } from '../types';
import { formatDate, formatCurrency } from '../utils';

interface PreOpportunityDetailsFormProps {
  preOpp: PreOpportunity;
  isEditing: boolean;
  editFormData: EditFormData;
  onChange: (field: keyof EditFormData, value: string) => void;
}

export interface EditFormData {
  status: PreOpportunityStatus;
  expDate: string;
  customerRef: string;
  paymentTerms: string;
  freightTerms: string;
}

export function PreOpportunityDetailsForm({
  preOpp,
  isEditing,
  editFormData,
  onChange,
}: PreOpportunityDetailsFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Entity Number</label>
            <div className="text-sm text-gray-900 font-medium">{preOpp.entityNumber}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Entity Date</label>
            <div className="text-sm text-gray-900">{formatDate(preOpp.entityDate)}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
            {isEditing ? (
              <select
                value={editFormData.status}
                onChange={(e) => onChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CONVERTED">Converted</option>
              </select>
            ) : (
              <div className="text-sm text-gray-900">{editFormData.status}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Expiration Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editFormData.expDate}
                onChange={(e) => onChange('expDate', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-sm text-gray-900">
                {preOpp.expDate ? formatDate(preOpp.expDate) : '-'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Customer Reference</label>
            {isEditing ? (
              <input
                type="text"
                value={editFormData.customerRef}
                onChange={(e) => onChange('customerRef', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter customer reference"
              />
            ) : (
              <div className="text-sm text-gray-900">{preOpp.customerRef || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
            {isEditing ? (
              <input
                type="text"
                value={editFormData.paymentTerms}
                onChange={(e) => onChange('paymentTerms', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Net 30"
              />
            ) : (
              <div className="text-sm text-gray-900">{preOpp.paymentTerms || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Freight Terms</label>
            {isEditing ? (
              <input
                type="text"
                value={editFormData.freightTerms}
                onChange={(e) => onChange('freightTerms', e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., FOB"
              />
            ) : (
              <div className="text-sm text-gray-900">{preOpp.freightTerms || '-'}</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Accept Date</label>
            <div className="text-sm text-gray-900">
              {preOpp.acceptDate ? formatDate(preOpp.acceptDate) : '-'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Revise Date</label>
            <div className="text-sm text-gray-900">
              {preOpp.reviseDate ? formatDate(preOpp.reviseDate) : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

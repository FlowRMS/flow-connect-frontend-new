/**
 * Pre-Opportunity Summary Sidebar Component
 */

'use client';

import React from 'react';
import type { PreOpportunity } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { useCRMCustomerSearch, useCRMJobSearch } from '../../hooks/useCRMApi';

interface PreOpportunitySummaryProps {
  preOpp: PreOpportunity;
}

export function PreOpportunitySummary({ preOpp }: PreOpportunitySummaryProps) {
  const totalSubtotal = preOpp.details.reduce((sum, detail) => sum + (Number(detail.subtotal) || 0), 0);
  const totalDiscount = preOpp.details.reduce((sum, detail) => sum + (Number(detail.discount) || 0), 0);
  const grandTotal = preOpp.balance?.total || totalSubtotal - totalDiscount;
  const totalQuantity = preOpp.details.reduce((sum, detail) => sum + (Number(detail.quantity) || 0), 0);

  // Fetch customers to look up names
  const { data: customers = [] } = useCRMCustomerSearch('', undefined, true);
  
  // Fetch jobs to look up names (in case job object is not populated)
  const { data: jobs = [] } = useCRMJobSearch('');

  // Helper to get customer name by ID
  const getCustomerName = (customerId: string | undefined): string => {
    if (!customerId) return '-';
    const customer = customers.find(c => c.id === customerId);
    return customer?.companyName || customerId;
  };

  // Helper to get job name by ID
  const getJobName = (jobId: string | undefined): string => {
    if (!jobId) return '-';
    // First check if we have job data embedded
    if (preOpp.job?.jobName) return preOpp.job.jobName;
    // Otherwise look it up
    const job = jobs.find(j => j.id === jobId);
    return job?.jobName || jobId;
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500">Total Value</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(grandTotal)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Line Items</div>
              <div className="text-lg font-semibold text-gray-900">{preOpp.details.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Qty</div>
              <div className="text-lg font-semibold text-gray-900">{isNaN(totalQuantity) ? 0 : Math.round(totalQuantity)}</div>
            </div>
          </div>
          {totalDiscount > 0 && (
            <div>
              <div className="text-sm text-gray-500">Total Discount</div>
              <div className="text-lg font-semibold text-red-600">-{formatCurrency(totalDiscount)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Associated Job Card */}
      {preOpp.job && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Associated Job</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-500">Job Name</div>
              <div className="text-sm font-medium text-gray-900">{preOpp.job.jobName}</div>
            </div>
            {preOpp.job.jobType && (
              <div>
                <div className="text-sm text-gray-500">Job Type</div>
                <div className="text-sm text-gray-900">{preOpp.job.jobType}</div>
              </div>
            )}
            {preOpp.job.status?.name && (
              <div>
                <div className="text-sm text-gray-500">Job Status</div>
                <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {preOpp.job.status.name}
                </div>
              </div>
            )}
            {preOpp.job.description && (
              <div>
                <div className="text-sm text-gray-500">Description</div>
                <div className="text-sm text-gray-900">{preOpp.job.description}</div>
              </div>
            )}
            <div className="pt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {preOpp.job.startDate && (
                  <div>
                    <span className="text-gray-400">Start:</span>
                    <span className="ml-1 text-gray-600">{formatDate(preOpp.job.startDate)}</span>
                  </div>
                )}
                {preOpp.job.endDate && (
                  <div>
                    <span className="text-gray-400">End:</span>
                    <span className="ml-1 text-gray-600">{formatDate(preOpp.job.endDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* References Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500">Pre-Opportunity</div>
            <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded mt-1">
              {preOpp.entityNumber}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Sold To Customer</div>
            <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded mt-1">
              {getCustomerName(preOpp.soldToCustomerId)}
            </div>
          </div>
          {preOpp.billToCustomerId && (
            <div>
              <div className="text-sm text-gray-500">Bill To Customer</div>
              <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded mt-1">
                {getCustomerName(preOpp.billToCustomerId)}
              </div>
            </div>
          )}
          {preOpp.jobId && (
            <div>
              <div className="text-sm text-gray-500">Job</div>
              <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded mt-1">
                {getJobName(preOpp.jobId)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dates Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#3B82F6" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 6v4l2 2"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">Created</div>
              <div className="text-sm text-gray-900">{formatDate(preOpp.createdAt)}</div>
            </div>
          </div>
          {preOpp.acceptDate && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#10B981" strokeWidth="2">
                  <path d="M6 10l3 3 5-6"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">Accepted</div>
                <div className="text-sm text-gray-900">{formatDate(preOpp.acceptDate)}</div>
              </div>
            </div>
          )}
          {preOpp.reviseDate && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <path d="M11 5l4 4M4 16l1-4 9-9 4 4-9 9-4 1z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">Revised</div>
                <div className="text-sm text-gray-900">{formatDate(preOpp.reviseDate)}</div>
              </div>
            </div>
          )}
          {preOpp.expDate && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2">
                  <circle cx="10" cy="10" r="7"/>
                  <path d="M10 6v5M10 13v1"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">Expires</div>
                <div className="text-sm text-gray-900">{formatDate(preOpp.expDate)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

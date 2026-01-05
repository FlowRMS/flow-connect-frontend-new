/**
 * Pre-Opportunity Summary Sidebar Component
 */

'use client';

import React from 'react';
import type { PreOpportunity } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { useCRMCustomerSearch, useCRMJobSearch } from '../../hooks/useCRMApi';
import type { EditFormData } from './PreOpportunityDetailsForm';

interface PreOpportunitySummaryProps {
  preOpp: PreOpportunity;
  isEditing?: boolean;
  editFormData?: EditFormData;
  onChange?: (field: keyof EditFormData, value: string) => void;
}

export function PreOpportunitySummary({ 
  preOpp, 
  isEditing = false, 
  editFormData, 
  onChange 
}: PreOpportunitySummaryProps) {
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
          <div>
            <div className="text-sm text-gray-500">Customer Reference</div>
            {isEditing && editFormData && onChange ? (
              <input
                type="text"
                value={editFormData.customerRef || ''}
                onChange={(e) => onChange('customerRef', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                placeholder="Enter customer reference"
              />
            ) : (
              <div className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded mt-1">
                {preOpp.customerRef || '-'}
              </div>
            )}
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

      {/* Linked Quotes Card */}
      {preOpp.details.some(d => d.quote) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Linked Quotes</h3>
          <div className="space-y-3">
            {(() => {
              // Get unique quotes from details
              const uniqueQuotes = new Map<string, NonNullable<typeof preOpp.details[0]['quote']>>();
              preOpp.details.forEach(d => {
                if (d.quote && !uniqueQuotes.has(d.quote.id)) {
                  uniqueQuotes.set(d.quote.id, d.quote);
                }
              });
              return Array.from(uniqueQuotes.values()).map(quote => (
                <div key={quote.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">{quote.quoteNumber}</span>
                    {quote.status && (
                      <span className="px-2 py-0.5 bg-purple-200 text-purple-700 rounded text-xs uppercase">
                        {quote.status}
                      </span>
                    )}
                  </div>
                  {quote.pipelineStage && (
                    <div className="text-xs text-purple-600 mb-1">
                      Stage: {quote.pipelineStage}
                    </div>
                  )}
                  {quote.entityDate && (
                    <div className="text-xs text-gray-500">
                      Date: {formatDate(quote.entityDate)}
                    </div>
                  )}
                  {quote.expDate && (
                    <div className="text-xs text-gray-500">
                      Expires: {formatDate(quote.expDate)}
                    </div>
                  )}
                  {quote.customerRef && (
                    <div className="text-xs text-gray-500 mt-1">
                      Customer Ref: {quote.customerRef}
                    </div>
                  )}
                  {quote.url && (
                    <a
                      href={quote.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 mt-2"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Quote
                    </a>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

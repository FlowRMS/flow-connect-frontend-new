/**
 * Create Pre-Opportunity Modal (Refactored)
 * Modular modal for creating new pre-opportunities with improved UX
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useCreateCRMPreOpportunity, useCRMCustomerSearch, useCRMProductSearch, useCRMFactorySearch, useCRMJobSearch } from '../../hooks/useCRMApi';
import type { CreatePreOpportunityInput, PreOpportunityDetailInput, PreOpportunityStatus, ProductSearchResult, FactorySearchResult, CustomerSearchResult, JobSearchResult } from '../types';
import { preOpportunityToasts, showWarningToast } from '../../lib/toast';
import { useDebounce } from '../hooks/useDebounce';
import { formatLocalDate } from '../../lib/date-utils';

// Import modular sections
import { BasicInfoSection } from './sections/BasicInfoSection';
import { CustomerSelectionSection } from './sections/CustomerSelectionSection';
import { JobSelectionSection } from './sections/JobSelectionSection';
import { AdditionalDetailsSection } from './sections/AdditionalDetailsSection';
import { FactorySelectionSection } from './sections/FactorySelectionSection';
import { LineItemEditor } from '../components/LineItemEditor';

interface CreatePreOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialStatus?: PreOpportunityStatus;
}

interface LineItem {
  id: string;
  itemNumber: number;
  productId: string;
  factoryPartNumber?: string;
  factoryName?: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  leadTime?: string;
  endUserId?: string;
  endUserName?: string;
}

export function CreatePreOpportunityModal({ isOpen, onClose, onSuccess, initialStatus }: CreatePreOpportunityModalProps) {
  const createMutation = useCreateCRMPreOpportunity();

  // Basic Info State
  const [entityNumber, setEntityNumber] = useState('');
  const [entityDate, setEntityDate] = useState(formatLocalDate(new Date()));
  const [status, setStatus] = useState<PreOpportunityStatus>(initialStatus || 'DRAFT');
  const [expDate, setExpDate] = useState('');
  const [reviseDate, setReviseDate] = useState('');
  const [acceptDate, setAcceptDate] = useState('');

  // Customer State
  const [soldToCustomerId, setSoldToCustomerId] = useState('');
  const [soldToCustomerName, setSoldToCustomerName] = useState('');
  const [billToCustomerId, setBillToCustomerId] = useState('');
  const [billToCustomerName, setBillToCustomerName] = useState('');
  const [soldToCustomerError, setSoldToCustomerError] = useState('');

  // Job State
  const [jobId, setJobId] = useState('');
  const [jobName, setJobName] = useState('');

  // Factory State
  const [factoryId, setFactoryId] = useState('');
  const [factoryName, setFactoryName] = useState('');

  // Additional Details State
  const [customerRef, setCustomerRef] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [freightTerms, setFreightTerms] = useState('');

  // Line Items State
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Search States (with allowEmpty support)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchEnabled, setCustomerSearchEnabled] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobSearchEnabled, setJobSearchEnabled] = useState(false);
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [factorySearchEnabled, setFactorySearchEnabled] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchEnabled, setProductSearchEnabled] = useState(false);
  const [endUserSearchTerm, setEndUserSearchTerm] = useState('');
  const [endUserSearchEnabled, setEndUserSearchEnabled] = useState(false);

  // Debounced search terms
  const debouncedCustomerSearch = useDebounce(customerSearchTerm, 300);
  const debouncedJobSearch = useDebounce(jobSearchTerm, 300);
  const debouncedFactorySearch = useDebounce(factorySearchTerm, 300);
  const debouncedProductSearch = useDebounce(productSearchTerm, 300);
  const debouncedEndUserSearch = useDebounce(endUserSearchTerm, 300);

  // API Queries with allowEmpty support
  const { data: customers = [], isLoading: isLoadingCustomers } = useCRMCustomerSearch(
    debouncedCustomerSearch,
    undefined,
    customerSearchEnabled
  );
  const { data: jobs = [], isLoading: isLoadingJobs } = useCRMJobSearch(
    debouncedJobSearch,
    jobSearchEnabled
  );
  const { data: factories = [], isLoading: isLoadingFactories } = useCRMFactorySearch(
    debouncedFactorySearch,
    undefined,
    factorySearchEnabled
  );
  const { data: products = [], isLoading: isLoadingProducts } = useCRMProductSearch(
    debouncedProductSearch,
    factoryId || undefined,
    productSearchEnabled
  );
  const { data: endUsers = [], isLoading: isLoadingEndUsers } = useCRMCustomerSearch(
    debouncedEndUserSearch,
    undefined,
    endUserSearchEnabled
  );

  // Customer handlers
  const handleCustomerSearch = useCallback((term: string, allowEmpty: boolean) => {
    setCustomerSearchTerm(term);
    setCustomerSearchEnabled(allowEmpty || term.length > 0);
  }, []);

  const handleSoldToCustomerSelect = useCallback((customer: CustomerSearchResult) => {
    setSoldToCustomerId(customer.id);
    setSoldToCustomerName(customer.companyName);
    setSoldToCustomerError('');
  }, []);

  const handleSoldToCustomerClear = useCallback(() => {
    setSoldToCustomerId('');
    setSoldToCustomerName('');
  }, []);

  const handleBillToCustomerSelect = useCallback((customer: CustomerSearchResult) => {
    setBillToCustomerId(customer.id);
    setBillToCustomerName(customer.companyName);
  }, []);

  const handleBillToCustomerClear = useCallback(() => {
    setBillToCustomerId('');
    setBillToCustomerName('');
  }, []);

  // Job handlers
  const handleJobSearch = useCallback((term: string, allowEmpty: boolean) => {
    setJobSearchTerm(term);
    setJobSearchEnabled(allowEmpty || term.length > 0);
  }, []);

  const handleJobSelect = useCallback((job: JobSearchResult) => {
    setJobId(job.id);
    setJobName(job.jobName);
  }, []);

  const handleJobClear = useCallback(() => {
    setJobId('');
    setJobName('');
  }, []);

  // Factory handlers
  const handleFactorySearch = useCallback((term: string, allowEmpty: boolean) => {
    setFactorySearchTerm(term);
    setFactorySearchEnabled(allowEmpty || term.length > 0);
  }, []);

  const handleFactorySelect = useCallback((factory: FactorySearchResult) => {
    setFactoryId(factory.id);
    setFactoryName(factory.title);
  }, []);

  const handleFactoryClear = useCallback(() => {
    setFactoryId('');
    setFactoryName('');
  }, []);

  // Product handlers for LineItemEditor
  const handleProductSearch = useCallback((term: string) => {
    setProductSearchTerm(term);
    setProductSearchEnabled(true);
  }, []);

  const handleProductFocus = useCallback(() => {
    setProductSearchTerm('');
    setProductSearchEnabled(true);
  }, []);

  // End user handlers for LineItemEditor
  const handleEndUserSearch = useCallback((term: string) => {
    setEndUserSearchTerm(term);
    setEndUserSearchEnabled(true);
  }, []);

  const handleEndUserFocus = useCallback(() => {
    setEndUserSearchTerm('');
    setEndUserSearchEnabled(true);
  }, []);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!soldToCustomerId) {
      setSoldToCustomerError('Please search and select a valid Sold To customer');
      return;
    }

    // Map line items to API format (optional)
    const details: PreOpportunityDetailInput[] = lineItems.map(item => ({
      itemNumber: item.itemNumber,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
      leadTime: item.leadTime,
      endUserId: item.endUserId || soldToCustomerId,
    }));

    const input: CreatePreOpportunityInput = {
      entityNumber,
      entityDate,
      status,
      soldToCustomerId,
      billToCustomerId: billToCustomerId || undefined,
      jobId: jobId || undefined,
      expDate: expDate || undefined,
      reviseDate: reviseDate || undefined,
      acceptDate: acceptDate || undefined,
      customerRef: customerRef || undefined,
      paymentTerms: paymentTerms || undefined,
      freightTerms: freightTerms || undefined,
      details,
    };

    try {
      await createMutation.mutateAsync(input);
      preOpportunityToasts.createSuccess(entityNumber);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error('Failed to create pre-opportunity:', error);
      preOpportunityToasts.createError(error instanceof Error ? error.message : undefined);
    }
  };

  const resetForm = () => {
    setEntityNumber('');
    setEntityDate(formatLocalDate(new Date()));
    setStatus(initialStatus || 'DRAFT');
    setExpDate('');
    setReviseDate('');
    setAcceptDate('');
    setSoldToCustomerId('');
    setSoldToCustomerName('');
    setBillToCustomerId('');
    setBillToCustomerName('');
    setJobId('');
    setJobName('');
    setFactoryId('');
    setFactoryName('');
    setCustomerRef('');
    setPaymentTerms('');
    setFreightTerms('');
    setLineItems([]);
    setSoldToCustomerError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const isValid = !!soldToCustomerId && !!entityNumber;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - Jobs Style */}
        <div className="bg-gray-50 px-6 py-5 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Create Pre-Opportunity</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Fill in the details to create a new pre-opportunity</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <BasicInfoSection
              entityNumber={entityNumber}
              setEntityNumber={setEntityNumber}
              entityDate={entityDate}
              setEntityDate={setEntityDate}
              status={status}
              setStatus={setStatus}
              expDate={expDate}
              setExpDate={setExpDate}
              reviseDate={reviseDate}
              setReviseDate={setReviseDate}
              acceptDate={acceptDate}
              setAcceptDate={setAcceptDate}
            />

            {/* Customer Selection */}
            <CustomerSelectionSection
              soldToCustomerId={soldToCustomerId}
              soldToCustomerName={soldToCustomerName}
              onSoldToCustomerSelect={handleSoldToCustomerSelect}
              onSoldToCustomerClear={handleSoldToCustomerClear}
              soldToCustomerError={soldToCustomerError}
              billToCustomerId={billToCustomerId}
              billToCustomerName={billToCustomerName}
              onBillToCustomerSelect={handleBillToCustomerSelect}
              onBillToCustomerClear={handleBillToCustomerClear}
              customers={customers}
              isLoadingCustomers={isLoadingCustomers}
              onCustomerSearch={handleCustomerSearch}
            />

            {/* Job Selection */}
            <JobSelectionSection
              jobId={jobId}
              jobName={jobName}
              onJobSelect={handleJobSelect}
              onJobClear={handleJobClear}
              jobs={jobs}
              isLoadingJobs={isLoadingJobs}
              onJobSearch={handleJobSearch}
            />

            {/* Additional Details */}
            <AdditionalDetailsSection
              customerRef={customerRef}
              setCustomerRef={setCustomerRef}
              paymentTerms={paymentTerms}
              setPaymentTerms={setPaymentTerms}
              freightTerms={freightTerms}
              setFreightTerms={setFreightTerms}
            />

            {/* Factory Filter & Line Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Products & Line Items <span className="text-gray-400 text-xs font-normal">(optional)</span>
              </h3>
              
              <FactorySelectionSection
                factoryId={factoryId}
                factoryName={factoryName}
                onFactorySelect={handleFactorySelect}
                onFactoryClear={handleFactoryClear}
                factories={factories}
                isLoadingFactories={isLoadingFactories}
                onFactorySearch={handleFactorySearch}
              />

              <LineItemEditor
                items={lineItems}
                onItemsChange={setLineItems}
                products={products}
                isLoadingProducts={isLoadingProducts}
                onProductSearch={handleProductSearch}
                onProductFocus={handleProductFocus}
                customers={endUsers}
                isLoadingCustomers={isLoadingEndUsers}
                onCustomerSearch={handleEndUserSearch}
                onCustomerFocus={handleEndUserFocus}
                defaultEndUserId={soldToCustomerId}
                defaultEndUserName={soldToCustomerName}
                factoryName={factoryName}
              />
            </div>
          </div>
        </form>

        {/* Footer - Jobs Style */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-500">
            {lineItems.length === 0 ? (
              <span className="text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No line items (optional)
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} added
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-5 py-2.5 border border-[var(--border)] text-[var(--foreground)] rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !isValid}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Pre-Opportunity
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

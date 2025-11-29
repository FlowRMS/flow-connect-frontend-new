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
  const [entityDate, setEntityDate] = useState(new Date().toISOString().split('T')[0]);
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

    if (lineItems.length === 0) {
      showWarningToast('Please add at least one line item', { description: 'At least one product is required to create a pre-opportunity' });
      return;
    }

    // Map line items to API format
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
    setEntityDate(new Date().toISOString().split('T')[0]);
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

  const isValid = !!soldToCustomerId && !!entityNumber && lineItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Pre-Opportunity</h2>
            <p className="text-blue-100 text-sm mt-1">Fill in the details to create a new pre-opportunity</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                Products & Line Items <span className="text-red-500">*</span>
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

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-500">
            {lineItems.length === 0 ? (
              <span className="text-amber-600">⚠ Add at least one line item</span>
            ) : (
              <span className="text-green-600">✓ {lineItems.length} line item{lineItems.length !== 1 ? 's' : ''} added</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !isValid}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Pre-Opportunity'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

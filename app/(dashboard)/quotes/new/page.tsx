'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StyledDatePicker, parseDateString, formatDateToString } from '../../../../components/shared/StyledDatePicker';
import {
  useCreateQuote,
  useCustomerSearch,
  useProductSearch,
  useUserSearch,
  type CreateQuoteInput,
  type QuoteDetailInput,
  type CustomerSearchResult,
  type ProductSearchResult,
  type UserSearchResult,
  type QuoteStatus,
  type QuotePipelineStage,
} from '../../../../components/quotes/api';

// ============================================================================
// Types
// ============================================================================

interface LineItem {
  id: string;
  productId?: string;
  productName: string;
  factoryId?: string;
  factoryName: string;
  quantity: number;
  unitPrice: string;
  commissionRate: string;
  discountRate: string;
  note: string;
}

interface InsideRep {
  id: string;
  tempId: string;
  userId: string;
  userName: string;
  splitRate: string;
}

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS: { value: QuoteStatus; label: string; color: string }[] = [
  { value: 'OPEN', label: 'Open', color: 'bg-blue-100 text-blue-700' },
  { value: 'ORDERED', label: 'Ordered', color: 'bg-green-100 text-green-700' },
  { value: 'EXPIRED', label: 'Expired', color: 'bg-gray-100 text-gray-700' },
  { value: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

const PIPELINE_STAGES: { value: QuotePipelineStage; label: string }[] = [
  { value: 'DISCOVERY', label: 'Discovery' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'QUALIFICATION', label: 'Qualification' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
];

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// Component
// ============================================================================

export default function CreateQuotePage() {
  const router = useRouter();
  const createQuote = useCreateQuote();

  // Portal mount state
  const [isMounted, setIsMounted] = useState(false);

  // Form state
  const [quoteNumber, setQuoteNumber] = useState('');
  const [entityDate, setEntityDate] = useState<Date | null>(new Date());
  const [expDate, setExpDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<QuoteStatus>('OPEN');
  const [pipelineStage, setPipelineStage] = useState<QuotePipelineStage>('DISCOVERY');
  const [customerRef, setCustomerRef] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [freightTerms, setFreightTerms] = useState('');
  const [published, setPublished] = useState(true);
  const [blanket, setBlanket] = useState(false);

  // Customer state
  const [soldToCustomerId, setSoldToCustomerId] = useState('');
  const [soldToCustomerName, setSoldToCustomerName] = useState('');
  const [billToCustomerId, setBillToCustomerId] = useState('');
  const [billToCustomerName, setBillToCustomerName] = useState('');

  // Customer search dropdowns
  const [soldToSearchTerm, setSoldToSearchTerm] = useState('');
  const [isSoldToDropdownOpen, setIsSoldToDropdownOpen] = useState(false);
  const soldToInputRef = useRef<HTMLInputElement>(null);
  const soldToDropdownRef = useRef<HTMLDivElement>(null);

  const [billToSearchTerm, setBillToSearchTerm] = useState('');
  const [isBillToDropdownOpen, setIsBillToDropdownOpen] = useState(false);
  const billToInputRef = useRef<HTMLInputElement>(null);
  const billToDropdownRef = useRef<HTMLDivElement>(null);

  // Status and Pipeline dropdowns
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPipelineDropdownOpen, setIsPipelineDropdownOpen] = useState(false);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const pipelineButtonRef = useRef<HTMLButtonElement>(null);
  const pipelineDropdownRef = useRef<HTMLDivElement>(null);

  // Customer search hooks
  const { data: soldToCustomers = [], isLoading: isLoadingSoldTo } = useCustomerSearch(
    soldToSearchTerm,
    isSoldToDropdownOpen
  );
  const { data: billToCustomers = [], isLoading: isLoadingBillTo } = useCustomerSearch(
    billToSearchTerm,
    isBillToDropdownOpen
  );

  // Inside reps state - supports multiple reps
  const [insideRepsList, setInsideRepsList] = useState<InsideRep[]>([]);
  const [activeRepIndex, setActiveRepIndex] = useState<number | null>(null);
  const [repSearchTerm, setRepSearchTerm] = useState('');
  const [isRepDropdownOpen, setIsRepDropdownOpen] = useState(false);
  const repInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const repDropdownRef = useRef<HTMLDivElement>(null);
  const { data: userSearchResults = [], isLoading: isLoadingUsers } = useUserSearch(
    repSearchTerm,
    true,
    isRepDropdownOpen
  );

  // Line items state
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Effects
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        soldToInputRef.current && !soldToInputRef.current.contains(target) &&
        soldToDropdownRef.current && !soldToDropdownRef.current.contains(target)
      ) {
        setIsSoldToDropdownOpen(false);
      }
      if (
        billToInputRef.current && !billToInputRef.current.contains(target) &&
        billToDropdownRef.current && !billToDropdownRef.current.contains(target)
      ) {
        setIsBillToDropdownOpen(false);
      }
      // Status dropdown
      if (
        statusButtonRef.current && !statusButtonRef.current.contains(target) &&
        statusDropdownRef.current && !statusDropdownRef.current.contains(target)
      ) {
        setIsStatusDropdownOpen(false);
      }
      // Pipeline dropdown
      if (
        pipelineButtonRef.current && !pipelineButtonRef.current.contains(target) &&
        pipelineDropdownRef.current && !pipelineDropdownRef.current.contains(target)
      ) {
        setIsPipelineDropdownOpen(false);
      }
      // Check if clicked outside any rep dropdown
      if (repDropdownRef.current && !repDropdownRef.current.contains(target)) {
        const clickedInsideAnyInput = repInputRefs.current.some(ref => ref?.contains(target));
        if (!clickedInsideAnyInput) {
          setIsRepDropdownOpen(false);
          setActiveRepIndex(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleSoldToSelect = (customer: CustomerSearchResult) => {
    setSoldToCustomerId(customer.id);
    setSoldToCustomerName(customer.companyName);
    setSoldToSearchTerm(customer.companyName);
    setIsSoldToDropdownOpen(false);
    if (errors.soldToCustomerId) {
      setErrors((prev) => ({ ...prev, soldToCustomerId: '' }));
    }
  };

  const handleBillToSelect = (customer: CustomerSearchResult) => {
    setBillToCustomerId(customer.id);
    setBillToCustomerName(customer.companyName);
    setBillToSearchTerm(customer.companyName);
    setIsBillToDropdownOpen(false);
  };

  // Inside Rep handlers
  const handleInsideRepSelect = (user: UserSearchResult, index: number) => {
    const userName = user.fullName || `${user.firstName} ${user.lastName}`;
    setInsideRepsList(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        userId: user.id,
        userName: userName,
      };
      return updated;
    });
    setRepSearchTerm('');
    setIsRepDropdownOpen(false);
    setActiveRepIndex(null);
  };

  const addInsideRep = () => {
    const newRep: InsideRep = {
      id: generateId(),
      tempId: generateId(),
      userId: '',
      userName: '',
      splitRate: '0',
    };
    setInsideRepsList(prev => {
      const updated = [...prev, newRep];
      // Auto-split evenly
      return redistributeSplitRates(updated);
    });
  };

  const removeInsideRep = (index: number) => {
    setInsideRepsList(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) return [];
      // Auto-split evenly among remaining
      return redistributeSplitRates(updated);
    });
  };

  const updateRepSplitRate = (index: number, value: string) => {
    setInsideRepsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], splitRate: value };
      return updated;
    });
  };

  // Redistribute split rates evenly
  const redistributeSplitRates = (reps: InsideRep[]): InsideRep[] => {
    if (reps.length === 0) return [];
    const baseRate = Math.floor(10000 / reps.length) / 100; // Two decimal precision
    const remainder = 100 - (baseRate * reps.length);

    return reps.map((rep, i) => ({
      ...rep,
      splitRate: i === reps.length - 1
        ? (baseRate + remainder).toFixed(2)
        : baseRate.toFixed(2),
    }));
  };

  // Calculate total split rate for validation
  const totalSplitRate = useMemo(() => {
    return insideRepsList.reduce((sum, rep) => sum + (parseFloat(rep.splitRate) || 0), 0);
  }, [insideRepsList]);

  const isSplitRateValid = Math.abs(totalSplitRate - 100) < 0.01 || insideRepsList.length === 0;

  // Line item handlers
  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: generateId(),
        productId: '',
        productName: '',
        factoryId: '',
        factoryName: '',
        quantity: 1,
        unitPrice: '',
        commissionRate: '',
        discountRate: '',
        note: '',
      },
    ]);
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;

    lineItems.forEach((item) => {
      const price = parseFloat(item.unitPrice) || 0;
      const qty = item.quantity || 0;
      const lineTotal = price * qty;
      subtotal += lineTotal;

      const discountRate = parseFloat(item.discountRate) || 0;
      totalDiscount += lineTotal * (discountRate / 100);
    });

    return {
      subtotal,
      discount: totalDiscount,
      total: subtotal - totalDiscount,
    };
  }, [lineItems]);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!quoteNumber.trim()) {
      newErrors.quoteNumber = 'Quote number is required';
    }
    if (!entityDate) {
      newErrors.entityDate = 'Quote date is required';
    }
    if (!soldToCustomerId) {
      newErrors.soldToCustomerId = 'Sold To customer is required';
    }
    if (insideRepsList.length > 0 && !isSplitRateValid) {
      newErrors.splitRate = 'Inside rep split rates must total exactly 100%';
      toast.error('Inside rep split rates must total exactly 100%');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Build details array
    const details: QuoteDetailInput[] = lineItems.map((item, index) => ({
      itemNumber: index + 1,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      commissionRate: item.commissionRate || undefined,
      discountRate: item.discountRate || undefined,
      productId: item.productId || undefined,
      productNameAdhoc: item.productId ? undefined : item.productName,
      factoryId: item.factoryId || undefined,
      note: item.note || undefined,
      status: 'OPEN' as const,
    }));

    // Build input
    const input: CreateQuoteInput = {
      quoteNumber: quoteNumber.trim(),
      entityDate: formatDateToString(entityDate),
      soldToCustomerId,
      status,
      pipelineStage,
      published,
      blanket,
      creationType: 'MANUAL',
      details: details.length > 0 ? details : undefined,
      billToCustomerId: billToCustomerId || undefined,
      customerRef: customerRef || undefined,
      expDate: expDate ? formatDateToString(expDate) : undefined,
      paymentTerms: paymentTerms || undefined,
      freightTerms: freightTerms || undefined,
      insideReps: insideRepsList.length > 0
        ? insideRepsList.filter(rep => rep.userId).map((rep, index) => ({
            userId: rep.userId,
            splitRate: rep.splitRate,
            position: index + 1,
          }))
        : undefined,
    };

    try {
      const newQuote = await createQuote.mutateAsync(input);
      toast.success('Quote created successfully');
      router.push(`/quotes/${newQuote.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create quote');
      console.error('Create error:', err);
    }
  };

  // Styles
  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create New Quote</h1>
                <p className="text-sm text-gray-500">Fill in the details to create a new quote</p>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createQuote.isPending || (insideRepsList.length > 0 && !isSplitRateValid)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center gap-2"
            >
              {createQuote.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Quote
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 pb-32">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quote Information Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Quote Information
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>
                      Quote Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={quoteNumber}
                      onChange={(e) => {
                        setQuoteNumber(e.target.value);
                        if (errors.quoteNumber) setErrors((prev) => ({ ...prev, quoteNumber: '' }));
                      }}
                      className={`${inputClass} ${errors.quoteNumber ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                      placeholder="e.g., Q-2024-001"
                    />
                    {errors.quoteNumber && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.quoteNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Quote Date <span className="text-red-500">*</span>
                    </label>
                    <StyledDatePicker
                      selected={entityDate}
                      onChange={(date) => {
                        setEntityDate(date);
                        if (errors.entityDate) setErrors((prev) => ({ ...prev, entityDate: '' }));
                      }}
                      placeholderText="Select quote date..."
                    />
                    {errors.entityDate && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.entityDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Expiration Date</label>
                    <StyledDatePicker
                      selected={expDate}
                      onChange={setExpDate}
                      placeholderText="Select expiration date..."
                    />
                  </div>

                  {/* Status - Custom Dropdown */}
                  <div className="relative">
                    <label className={labelClass}>Status</label>
                    <button
                      ref={statusButtonRef}
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700'
                        }`}>
                          {STATUS_OPTIONS.find(s => s.value === status)?.label || status}
                        </span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Status Dropdown Portal */}
                    {isStatusDropdownOpen && isMounted && createPortal(
                      <div
                        ref={statusDropdownRef}
                        style={{
                          position: 'fixed',
                          top: (statusButtonRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                          left: statusButtonRef.current?.getBoundingClientRect().left ?? 0,
                          width: statusButtonRef.current?.getBoundingClientRect().width ?? 200,
                          zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setStatus(opt.value);
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              status === opt.value ? 'bg-blue-50' : ''
                            }`}
                          >
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${opt.color}`}>
                              {opt.label}
                            </span>
                            {status === opt.value && (
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </div>

                  {/* Pipeline Stage - Custom Dropdown */}
                  <div className="relative">
                    <label className={labelClass}>Pipeline Stage</label>
                    <button
                      ref={pipelineButtonRef}
                      type="button"
                      onClick={() => setIsPipelineDropdownOpen(!isPipelineDropdownOpen)}
                      className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                          {PIPELINE_STAGES.find(s => s.value === pipelineStage)?.label || pipelineStage}
                        </span>
                      </div>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isPipelineDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Pipeline Dropdown Portal */}
                    {isPipelineDropdownOpen && isMounted && createPortal(
                      <div
                        ref={pipelineDropdownRef}
                        style={{
                          position: 'fixed',
                          top: (pipelineButtonRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                          left: pipelineButtonRef.current?.getBoundingClientRect().left ?? 0,
                          width: pipelineButtonRef.current?.getBoundingClientRect().width ?? 200,
                          zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                      >
                        {PIPELINE_STAGES.map((stage) => (
                          <button
                            key={stage.value}
                            type="button"
                            onClick={() => {
                              setPipelineStage(stage.value);
                              setIsPipelineDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                              pipelineStage === stage.value ? 'bg-blue-50' : ''
                            }`}
                          >
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                              {stage.label}
                            </span>
                            {pipelineStage === stage.value && (
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Customer Reference</label>
                    <input
                      type="text"
                      value={customerRef}
                      onChange={(e) => setCustomerRef(e.target.value)}
                      className={inputClass}
                      placeholder="Customer PO or reference"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Customer Information
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sold To Customer */}
                  <div className="relative">
                    <label className={labelClass}>
                      Sold To Customer <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={soldToInputRef}
                        type="text"
                        value={soldToSearchTerm}
                        onChange={(e) => {
                          setSoldToSearchTerm(e.target.value);
                          setIsSoldToDropdownOpen(true);
                          if (!e.target.value) {
                            setSoldToCustomerId('');
                            setSoldToCustomerName('');
                          }
                        }}
                        onFocus={() => setIsSoldToDropdownOpen(true)}
                        className={`${inputClass} pr-10 ${errors.soldToCustomerId ? 'border-red-300 ring-2 ring-red-100' : ''}`}
                        placeholder="Click to search customers..."
                      />
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    {errors.soldToCustomerId && (
                      <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.soldToCustomerId}
                      </p>
                    )}

                    {/* Sold To Dropdown */}
                    {isSoldToDropdownOpen && isMounted && createPortal(
                      <div
                        ref={soldToDropdownRef}
                        style={{
                          position: 'fixed',
                          top: (soldToInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                          left: soldToInputRef.current?.getBoundingClientRect().left ?? 0,
                          width: soldToInputRef.current?.getBoundingClientRect().width ?? 300,
                          zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
                      >
                        {isLoadingSoldTo ? (
                          <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Searching...
                          </div>
                        ) : soldToCustomers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {soldToSearchTerm ? 'No customers found' : 'Start typing to search...'}
                          </div>
                        ) : (
                          soldToCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleSoldToSelect(customer)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                                soldToCustomerId === customer.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{customer.companyName}</div>
                                {customer.isParent && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                                    Parent Customer
                                  </span>
                                )}
                              </div>
                              {soldToCustomerId === customer.id && (
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>,
                      document.body
                    )}
                  </div>

                  {/* Bill To Customer */}
                  <div className="relative">
                    <label className={labelClass}>Bill To Customer</label>
                    <div className="relative">
                      <input
                        ref={billToInputRef}
                        type="text"
                        value={billToSearchTerm}
                        onChange={(e) => {
                          setBillToSearchTerm(e.target.value);
                          setIsBillToDropdownOpen(true);
                          if (!e.target.value) {
                            setBillToCustomerId('');
                            setBillToCustomerName('');
                          }
                        }}
                        onFocus={() => setIsBillToDropdownOpen(true)}
                        className={`${inputClass} pr-10`}
                        placeholder="Same as Sold To if empty"
                      />
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Bill To Dropdown */}
                    {isBillToDropdownOpen && isMounted && createPortal(
                      <div
                        ref={billToDropdownRef}
                        style={{
                          position: 'fixed',
                          top: (billToInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                          left: billToInputRef.current?.getBoundingClientRect().left ?? 0,
                          width: billToInputRef.current?.getBoundingClientRect().width ?? 300,
                          zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
                      >
                        {isLoadingBillTo ? (
                          <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Searching...
                          </div>
                        ) : billToCustomers.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {billToSearchTerm ? 'No customers found' : 'Start typing to search...'}
                          </div>
                        ) : (
                          billToCustomers.map((customer) => (
                            <button
                              key={customer.id}
                              type="button"
                              onClick={() => handleBillToSelect(customer)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                                billToCustomerId === customer.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{customer.companyName}</div>
                                {customer.isParent && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                                    Parent Customer
                                  </span>
                                )}
                              </div>
                              {billToCustomerId === customer.id && (
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Inside Representatives Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  Inside Representatives
                  {insideRepsList.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                      {insideRepsList.length} rep{insideRepsList.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={addInsideRep}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/25"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 7v6M7 10h6" strokeLinecap="round" />
                  </svg>
                  Add Rep
                </button>
              </div>

              <div className="p-6">
                {insideRepsList.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No representatives assigned</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Add Rep" to assign inside representatives</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Split Rate Validation Warning */}
                    {!isSplitRateValid && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Split rates must total exactly 100%. Current total: <strong>{totalSplitRate.toFixed(2)}%</strong></span>
                      </div>
                    )}

                    {insideRepsList.map((rep, index) => (
                      <div
                        key={rep.tempId}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 text-violet-700 font-semibold text-sm flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Rep Search Input */}
                        <div className="flex-1 relative">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Representative</label>
                          <div className="relative">
                            <input
                              ref={(el) => { repInputRefs.current[index] = el; }}
                              type="text"
                              value={activeRepIndex === index ? repSearchTerm : rep.userName}
                              onChange={(e) => {
                                setRepSearchTerm(e.target.value);
                                setActiveRepIndex(index);
                                setIsRepDropdownOpen(true);
                              }}
                              onFocus={() => {
                                setActiveRepIndex(index);
                                setRepSearchTerm(rep.userName);
                                setIsRepDropdownOpen(true);
                              }}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:text-gray-400 pr-10"
                              placeholder="Search representative..."
                            />
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>

                          {/* Dropdown for this rep */}
                          {isRepDropdownOpen && activeRepIndex === index && isMounted && createPortal(
                            <div
                              ref={repDropdownRef}
                              style={{
                                position: 'fixed',
                                top: (repInputRefs.current[index]?.getBoundingClientRect().bottom ?? 0) + 4,
                                left: repInputRefs.current[index]?.getBoundingClientRect().left ?? 0,
                                width: repInputRefs.current[index]?.getBoundingClientRect().width ?? 300,
                                zIndex: 9999,
                              }}
                              className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
                            >
                              {isLoadingUsers ? (
                                <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                  Searching...
                                </div>
                              ) : userSearchResults.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  {repSearchTerm ? 'No representatives found' : 'Start typing to search...'}
                                </div>
                              ) : (
                                userSearchResults.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => handleInsideRepSelect(user, index)}
                                    className={`w-full text-left px-4 py-3 hover:bg-violet-50 transition-colors flex items-center gap-3 ${
                                      rep.userId === user.id ? 'bg-violet-50' : ''
                                    }`}
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center flex-shrink-0 text-white font-medium text-sm">
                                      {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">
                                        {user.fullName || `${user.firstName} ${user.lastName}`}
                                      </div>
                                      {user.email && (
                                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                      )}
                                    </div>
                                    {rep.userId === user.id && (
                                      <svg className="w-5 h-5 text-violet-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>,
                            document.body
                          )}
                        </div>

                        {/* Split Rate Input */}
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-500 mb-1.5">Split %</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={rep.splitRate}
                              onChange={(e) => updateRepSplitRate(index, e.target.value)}
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all pr-8"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeInsideRep(index)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-5"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Total Split Rate Display */}
                    {insideRepsList.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                          isSplitRateValid
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          Total: {totalSplitRate.toFixed(2)}%
                          {isSplitRateValid && (
                            <svg className="inline-block w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  Terms & Conditions
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>Payment Terms</label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., Net 30"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Freight Terms</label>
                    <input
                      type="text"
                      value={freightTerms}
                      onChange={(e) => setFreightTerms(e.target.value)}
                      className={inputClass}
                      placeholder="e.g., FOB Origin"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  Line Items
                  {lineItems.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full">
                      {lineItems.length} item{lineItems.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl hover:from-cyan-600 hover:to-cyan-700 transition-all shadow-lg shadow-cyan-500/25"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="10" cy="10" r="7" />
                    <path d="M10 7v6M7 10h6" strokeLinecap="round" />
                  </svg>
                  Add Item
                </button>
              </div>

              <div className="p-6">
                {lineItems.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-gray-500 font-medium">No line items yet</p>
                    <p className="text-gray-400 text-sm mt-1">Click "Add Item" to add products to this quote</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lineItems.map((item, index) => (
                      <LineItemRow
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={(updates) => updateLineItem(item.id, updates)}
                        onRemove={() => removeLineItem(item.id)}
                        isMounted={isMounted}
                      />
                    ))}

                    {/* Totals */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <div className="flex justify-end">
                        <div className="w-80 bg-gray-50 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-gray-900">${totals.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium text-red-600">-${totals.discount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-3">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-gray-900">${totals.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  Settings
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Published Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${published ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <svg className={`w-5 h-5 ${published ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900">Published</label>
                        <p className="text-xs text-gray-500">Make quote visible in the system</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublished(!published)}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        published ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                          published ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Blanket Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${blanket ? 'bg-purple-100' : 'bg-gray-200'}`}>
                        <svg className={`w-5 h-5 ${blanket ? 'text-purple-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900">Blanket Quote</label>
                        <p className="text-xs text-gray-500">Mark as recurring quote</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBlanket(!blanket)}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        blanket ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                          blanket ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Line Item Row Component
// ============================================================================

interface LineItemRowProps {
  item: LineItem;
  index: number;
  onUpdate: (updates: Partial<LineItem>) => void;
  onRemove: () => void;
  isMounted: boolean;
}

function LineItemRow({ item, index, onUpdate, onRemove, isMounted }: LineItemRowProps) {
  // Product search state
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const { data: products = [], isLoading: isLoadingProducts } = useProductSearch(
    productSearchTerm,
    undefined,
    isProductDropdownOpen
  );

  // Click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        productInputRef.current && !productInputRef.current.contains(target) &&
        productDropdownRef.current && !productDropdownRef.current.contains(target)
      ) {
        setIsProductDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductSelect = (product: ProductSearchResult) => {
    onUpdate({
      productId: product.id,
      productName: product.factoryPartNumber,
      factoryId: product.factory?.id,
      factoryName: product.factory?.title || '',
      unitPrice: product.unitPrice?.toString() || '',
      commissionRate: product.defaultCommissionRate?.toString() || '',
    });
    setProductSearchTerm(product.factoryPartNumber);
    setIsProductDropdownOpen(false);
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400";

  return (
    <div className="flex items-start gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 font-semibold text-sm flex-shrink-0 mt-6">
        {index + 1}
      </div>

      <div className="flex-1 grid grid-cols-6 gap-4">
        {/* Product */}
        <div className="col-span-2 relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Product</label>
          <div className="relative">
            <input
              ref={productInputRef}
              type="text"
              value={productSearchTerm || item.productName}
              onChange={(e) => {
                setProductSearchTerm(e.target.value);
                setIsProductDropdownOpen(true);
                if (!e.target.value) {
                  onUpdate({ productId: '', productName: '', factoryId: '', factoryName: '' });
                }
              }}
              onFocus={() => setIsProductDropdownOpen(true)}
              className={`${inputClass} pr-10`}
              placeholder="Search product..."
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Product Dropdown */}
          {isProductDropdownOpen && isMounted && createPortal(
            <div
              ref={productDropdownRef}
              style={{
                position: 'fixed',
                top: (productInputRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                left: productInputRef.current?.getBoundingClientRect().left ?? 0,
                width: Math.max(productInputRef.current?.getBoundingClientRect().width ?? 300, 400),
                zIndex: 9999,
              }}
              className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto"
            >
              {isLoadingProducts ? (
                <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Searching...
                </div>
              ) : products.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {productSearchTerm ? 'No products found' : 'Start typing to search...'}
                </div>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{product.factoryPartNumber}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                        {product.factory?.title && <span>{product.factory.title}</span>}
                        {product.unitPrice && <span className="text-green-600 font-medium">${product.unitPrice}</span>}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>,
            document.body
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
            className={inputClass}
            min="1"
          />
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Unit Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              value={item.unitPrice}
              onChange={(e) => onUpdate({ unitPrice: e.target.value })}
              className={`${inputClass} pl-7`}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Commission Rate */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Comm %</label>
          <input
            type="text"
            value={item.commissionRate}
            onChange={(e) => onUpdate({ commissionRate: e.target.value })}
            className={inputClass}
            placeholder="0"
          />
        </div>

        {/* Line Total */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Line Total</label>
          <div className="px-3 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-900">
            ${((parseFloat(item.unitPrice) || 0) * (item.quantity || 0)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}

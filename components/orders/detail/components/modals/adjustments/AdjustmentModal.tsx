/**
 * AdjustmentModal Component
 * Full-featured modal for creating and editing adjustments with beautiful UX
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Order } from '@/lib/types/rms';
import type { Adjustment, AllocationMethod, CreateAdjustmentInput, AdjustmentSplitRateInput } from '../../../../api/adjustmentsApi';
import { formatCurrency } from '../../../utils';
import { SearchableDropdownV2 } from '@/components/quotes-v2/components/SearchableDropdownV2';
import { useUserSearch, useFactorySearch, useCustomerSearch } from '../../../../api';
import { StyledDatePicker, parseDateString, formatDateToString } from '@/components/shared/StyledDatePicker';

// Allocation Method Configuration with colors and labels
const ALLOCATION_METHOD_CONFIG: Record<AllocationMethod, { label: string; color: string; bgColor: string; description: string; icon: React.ReactNode }> = {
  REP_SPLIT: {
    label: 'Rep Split',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Split between sales representatives',
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 4v12M4 10h12" strokeLinecap="round"/>
      </svg>
    ),
  },
  CUSTOMER: {
    label: 'Customer',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    description: 'Applied to customer account',
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="6" r="3"/>
        <path d="M4 18v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      </svg>
    ),
  },
  CHECK: {
    label: 'Check',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Payment via check',
    icon: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="16" height="10" rx="1"/>
        <path d="M5 12h6"/>
        <path d="M5 9h10"/>
      </svg>
    ),
  },
};

// Status Configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  POSTED: { label: 'Posted', color: 'text-green-700', bgColor: 'bg-green-100' },
  VOID: { label: 'Void', color: 'text-red-700', bgColor: 'bg-red-100' },
};

interface SplitRateState {
  id: string;
  userId: string;
  userName: string;
  splitRate: number;
  position: number;
}

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  adjustment?: Adjustment | null;
  onSubmit: (input: CreateAdjustmentInput) => Promise<void>;
  isLoading?: boolean;
  isLoadingAdjustmentDetails?: boolean;
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  colorScheme = 'blue',
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  colorScheme?: 'blue' | 'orange' | 'purple' | 'green';
  badge?: React.ReactNode;
}) {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100/50',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100',
      hoverBg: 'hover:bg-blue-100/50',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      headerBg: 'bg-gradient-to-r from-orange-50 to-orange-100/50',
      text: 'text-orange-700',
      iconBg: 'bg-orange-100',
      hoverBg: 'hover:bg-orange-100/50',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      headerBg: 'bg-gradient-to-r from-purple-50 to-purple-100/50',
      text: 'text-purple-700',
      iconBg: 'bg-purple-100',
      hoverBg: 'hover:bg-purple-100/50',
    },
    green: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      hoverBg: 'hover:bg-emerald-100/50',
    },
  };

  const scheme = colors[colorScheme];

  return (
    <div className={`rounded-xl border ${scheme.border} overflow-hidden transition-all duration-200`}>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-4 py-2.5 ${scheme.headerBg} flex items-center gap-3 ${scheme.hoverBg} transition-colors`}
      >
        <div className={`w-7 h-7 rounded-lg ${scheme.iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className={`text-sm font-semibold ${scheme.text} flex-1 text-left`}>{title}</span>
        {badge}
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${scheme.text} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`p-4 ${scheme.bg}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdjustmentModal({
  isOpen,
  onClose,
  order,
  adjustment,
  onSubmit,
  isLoading = false,
  isLoadingAdjustmentDetails = false,
}: AdjustmentModalProps) {
  const isEditMode = !!adjustment;

  // Form state
  const [adjustmentNumber, setAdjustmentNumber] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState<Date | null>(new Date());
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod | ''>('');
  const [factoryId, setFactoryId] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [splitRates, setSplitRates] = useState<SplitRateState[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Section visibility
  const [showSplitRates, setShowSplitRates] = useState(true);

  // Search states
  const [repSearchTerm, setRepSearchTerm] = useState('');
  const [repSearchEnabled, setRepSearchEnabled] = useState(false);
  const [factorySearchTerm, setFactorySearchTerm] = useState('');
  const [factorySearchEnabled, setFactorySearchEnabled] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchEnabled, setCustomerSearchEnabled] = useState(false);

  // Search hooks
  const { data: repResults, isLoading: isRepLoading } = useUserSearch(
    repSearchTerm,
    {},
    repSearchEnabled
  );

  const { data: factoryResults, isLoading: isFactoryLoading } = useFactorySearch(
    factorySearchTerm,
    factorySearchEnabled
  );

  const { data: customerResults, isLoading: isCustomerLoading } = useCustomerSearch(
    customerSearchTerm,
    customerSearchEnabled
  );

  // Map search results to dropdown options
  const repOptions = useMemo(() => {
    return (repResults || []).map(u => ({
      id: u.id,
      label: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '',
      sublabel: u.email,
    }));
  }, [repResults]);

  const factoryOptions = useMemo(() => {
    return (factoryResults || []).map((f: { id: string; title: string; accountNumber?: string }) => ({
      id: f.id,
      label: f.title || '',
      sublabel: f.accountNumber || '',
    }));
  }, [factoryResults]);

  const customerOptions = useMemo(() => {
    return (customerResults || []).map((c: { id: string; companyName: string; isParent?: boolean }) => ({
      id: c.id,
      label: c.companyName || '',
      sublabel: c.isParent ? 'Parent Company' : '',
    }));
  }, [customerResults]);

  // Search handlers - enable search immediately when dropdown is opened
  const handleRepSearch = useCallback((term: string) => {
    setRepSearchTerm(term);
    setRepSearchEnabled(true);
  }, []);

  const handleFactorySearch = useCallback((term: string) => {
    setFactorySearchTerm(term);
    setFactorySearchEnabled(true);
  }, []);

  const handleCustomerSearch = useCallback((term: string) => {
    setCustomerSearchTerm(term);
    setCustomerSearchEnabled(true);
  }, []);

  // Initialize form when modal opens or adjustment changes
  useEffect(() => {
    if (isOpen) {
      if (adjustment) {
        // Edit mode - populate from existing adjustment
        setAdjustmentNumber(adjustment.adjustmentNumber || '');
        setAdjustmentDate(parseDateString(adjustment.entityDate) || new Date());
        setAmount(adjustment.amount || '');
        setReason(adjustment.reason || '');
        // Infer allocation method from data
        if (adjustment.splitRates && adjustment.splitRates.length > 0) {
          setAllocationMethod('REP_SPLIT');
        } else if (adjustment.customer) {
          setAllocationMethod('CUSTOMER');
        } else {
          setAllocationMethod('CHECK');
        }
        setFactoryId(adjustment.factoryId || '');
        setFactoryName(adjustment.factory?.title || '');
        setCustomerId(adjustment.customer?.id || '');
        setCustomerName(adjustment.customer?.companyName || '');

        // Populate split rates
        if (adjustment.splitRates && adjustment.splitRates.length > 0) {
          const populatedSplitRates: SplitRateState[] = adjustment.splitRates.map((split, index) => ({
            id: split.id || `split-${Date.now()}-${index}`,
            userId: split.userId || '',
            userName: split.user?.fullName || split.user?.firstName || '',
            splitRate: parseFloat(split.splitRate || '0'),
            position: split.position || index,
          }));
          setSplitRates(populatedSplitRates);
          setShowSplitRates(true);
        } else {
          setSplitRates([]);
        }
      } else {
        // Create mode - reset form
        setAdjustmentNumber('');
        setAdjustmentDate(new Date());
        setAmount('');
        setReason('');
        setAllocationMethod('');
        setFactoryId('');
        setFactoryName('');
        setCustomerId('');
        setCustomerName('');
        setSplitRates([]);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, adjustment]);

  // Add rep to split rates
  const addRep = useCallback((repId: string, repName: string) => {
    if (!splitRates.some(r => r.userId === repId)) {
      const newRep: SplitRateState = {
        id: crypto.randomUUID(),
        userId: repId,
        userName: repName,
        splitRate: 0,
        position: splitRates.length,
      };
      const newRates = [...splitRates, newRep];
      // Auto-distribute
      const perRep = Math.floor(100 / newRates.length);
      const remainder = 100 - (perRep * newRates.length);
      setSplitRates(newRates.map((r, idx) => ({
        ...r,
        splitRate: idx === newRates.length - 1 ? perRep + remainder : perRep,
      })));
    }
  }, [splitRates]);

  // Remove rep from split rates
  const removeRep = useCallback((repId: string) => {
    const newRates = splitRates.filter(r => r.id !== repId);
    if (newRates.length > 0) {
      const perRep = Math.floor(100 / newRates.length);
      const remainder = 100 - (perRep * newRates.length);
      setSplitRates(newRates.map((r, idx) => ({
        ...r,
        splitRate: idx === newRates.length - 1 ? perRep + remainder : perRep,
      })));
    } else {
      setSplitRates([]);
    }
  }, [splitRates]);

  // Update split rate
  const updateSplitRate = useCallback((repId: string, rate: number) => {
    setSplitRates(prev => prev.map(r =>
      r.id === repId ? { ...r, splitRate: rate } : r
    ));
  }, []);

  // Auto-distribute split rates
  const autoDistributeSplits = useCallback(() => {
    const count = splitRates.length;
    if (count > 0) {
      const perRep = Math.floor(100 / count);
      const remainder = 100 - (perRep * count);
      setSplitRates(prev => prev.map((r, idx) => ({
        ...r,
        splitRate: idx === count - 1 ? perRep + remainder : perRep,
      })));
    }
  }, [splitRates.length]);

  // Calculate total split
  const totalSplit = useMemo(() => {
    return splitRates.reduce((sum, r) => sum + r.splitRate, 0);
  }, [splitRates]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!adjustmentDate) {
      newErrors.adjustmentDate = 'Adjustment date is required';
    }

    if (!amount || parseFloat(amount) === 0) {
      newErrors.amount = 'Amount is required';
    }

    if (!allocationMethod) {
      newErrors.allocationMethod = 'Allocation method is required';
    }

    if (allocationMethod === 'REP_SPLIT' && splitRates.length === 0) {
      newErrors.splitRates = 'At least one rep is required for Rep Split';
    }

    if (allocationMethod === 'REP_SPLIT' && totalSplit !== 100) {
      newErrors.splitRates = 'Split rates must total 100%';
    }

    if (allocationMethod === 'CUSTOMER' && !customerId) {
      newErrors.customerId = 'Customer is required for Customer allocation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    setTouched({
      adjustmentDate: true,
      amount: true,
      allocationMethod: true,
      splitRates: true,
      customerId: true,
    });

    if (!validate()) {
      return;
    }

    // splitRates is required by the schema - send empty array for non-REP_SPLIT
    const input: CreateAdjustmentInput = {
      adjustmentNumber: adjustmentNumber || undefined,
      entityDate: formatDateToString(adjustmentDate!) || new Date().toISOString().split('T')[0],
      amount,
      allocationMethod: allocationMethod as AllocationMethod,
      factoryId: factoryId || undefined,
      customerId: allocationMethod === 'CUSTOMER' ? customerId : undefined,
      reason: reason || undefined,
      creationType: 'MANUAL',
      splitRates: allocationMethod === 'REP_SPLIT'
        ? splitRates.map((r): AdjustmentSplitRateInput => ({
            id: r.id.startsWith('split-') ? undefined : r.id,
            userId: r.userId,
            splitRate: r.splitRate.toString(),
            position: r.position,
          }))
        : [], // Required field - send empty array for non-REP_SPLIT
    };

    if (isEditMode && adjustment) {
      (input as any).id = adjustment.id;
    }

    await onSubmit(input);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[var(--foreground)] flex items-center gap-3">
              {isEditMode ? 'Edit Adjustment' : 'Create Adjustment'}
              {amount && (
                <span className="text-indigo-600 text-lg font-bold">
                  {formatCurrency(parseFloat(amount) || 0)}
                </span>
              )}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Order #{order.orderNumber} - Commission adjustments
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading state when fetching adjustment details for edit */}
          {isLoadingAdjustmentDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <svg className="animate-spin h-8 w-8 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm text-[var(--muted-foreground)]">Loading adjustment details...</span>
              </div>
            </div>
          )}

          {!isLoadingAdjustmentDetails && (
            <>
              {/* Basic Info Section */}
              <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="14" height="14" rx="2"/>
                    <path d="M3 8h14"/>
                    <path d="M7 2v4"/>
                    <path d="M13 2v4"/>
                  </svg>
                  Adjustment Information
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Adjustment Number */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Adjustment #
                      <span className="text-[var(--muted-foreground)] font-normal ml-1">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={adjustmentNumber}
                      onChange={(e) => setAdjustmentNumber(e.target.value)}
                      placeholder="Auto-generated"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <StyledDatePicker
                      selected={adjustmentDate}
                      onChange={(date) => {
                        setAdjustmentDate(date);
                        setTouched(prev => ({ ...prev, adjustmentDate: true }));
                      }}
                      placeholder="Select date..."
                    />
                    {touched.adjustmentDate && errors.adjustmentDate && (
                      <p className="text-xs text-red-500 mt-1">{errors.adjustmentDate}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setTouched(prev => ({ ...prev, amount: true }));
                        }}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>
                    {touched.amount && errors.amount && (
                      <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>

                {/* Allocation Method */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Allocation Method <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(ALLOCATION_METHOD_CONFIG) as AllocationMethod[]).map((method) => {
                      const config = ALLOCATION_METHOD_CONFIG[method];
                      const isSelected = allocationMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setAllocationMethod(method);
                            setTouched(prev => ({ ...prev, allocationMethod: true }));
                          }}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? `${config.bgColor} border-current ${config.color} shadow-md`
                              : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/50 hover:bg-[var(--muted)]/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`${isSelected ? config.color : 'text-[var(--muted-foreground)]'}`}>
                              {config.icon}
                            </div>
                            <span className={`font-semibold text-sm ${isSelected ? config.color : ''}`}>
                              {config.label}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--muted-foreground)]">{config.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  {touched.allocationMethod && errors.allocationMethod && (
                    <p className="text-xs text-red-500 mt-1">{errors.allocationMethod}</p>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    Reason / Notes
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this adjustment..."
                    rows={2}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
                  />
                </div>
              </div>

              {/* Factory Selection */}
              <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 18V8l4-4 4 4v10"/>
                    <path d="M11 18V4l6 6v8"/>
                    <path d="M7 14h0"/>
                    <path d="M7 10h0"/>
                  </svg>
                  Factory
                </h3>
                <SearchableDropdownV2
                  value={factoryId}
                  displayValue={factoryName}
                  onChange={(id, label) => {
                    setFactoryId(id);
                    setFactoryName(label);
                  }}
                  options={factoryOptions}
                  onSearch={handleFactorySearch}
                  isLoading={isFactoryLoading}
                  placeholder="Search for factory..."
                />
              </div>

              {/* Customer Selection (shown for CUSTOMER allocation) */}
              {allocationMethod === 'CUSTOMER' && (
                <div className="bg-[var(--muted)]/20 rounded-lg p-4 space-y-4">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="10" cy="6" r="3"/>
                      <path d="M4 18v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
                    </svg>
                    Customer <span className="text-red-500">*</span>
                  </h3>
                  <SearchableDropdownV2
                    value={customerId}
                    displayValue={customerName}
                    onChange={(id, label) => {
                      setCustomerId(id);
                      setCustomerName(label);
                      setTouched(prev => ({ ...prev, customerId: true }));
                    }}
                    options={customerOptions}
                    onSearch={handleCustomerSearch}
                    isLoading={isCustomerLoading}
                    placeholder="Search for customer..."
                  />
                  {touched.customerId && errors.customerId && (
                    <p className="text-xs text-red-500 mt-1">{errors.customerId}</p>
                  )}
                </div>
              )}

              {/* Rep Split Section (shown for REP_SPLIT allocation) */}
              {allocationMethod === 'REP_SPLIT' && (
                <CollapsibleSection
                  title="Rep Split Rates"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                      <circle cx="10" cy="6" r="3"/>
                      <path d="M4 18v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
                    </svg>
                  }
                  isOpen={showSplitRates}
                  onToggle={() => setShowSplitRates(!showSplitRates)}
                  colorScheme="purple"
                  badge={
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      totalSplit === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {totalSplit}%
                    </span>
                  }
                >
                  <div className="space-y-3">
                    {/* Current splits */}
                    {splitRates.length > 0 ? (
                      <div className="space-y-2">
                        {splitRates.map((split) => (
                          <div key={split.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-purple-100">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-purple-700 text-sm font-semibold">
                                {split.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{split.userName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={split.splitRate}
                                onChange={(e) => updateSplitRate(split.id, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-center border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              />
                              <span className="text-purple-600 text-sm">%</span>
                              <button
                                type="button"
                                onClick={() => removeRep(split.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Auto-distribute button */}
                        {splitRates.length > 1 && (
                          <button
                            type="button"
                            onClick={autoDistributeSplits}
                            className="w-full py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 10h12M10 4v12"/>
                            </svg>
                            Auto-distribute evenly
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--muted-foreground)] text-center py-2">
                        No reps added yet. Search below to add reps.
                      </p>
                    )}

                    {/* Add Rep */}
                    <div className="pt-2 border-t border-purple-100">
                      <label className="block text-xs font-medium text-purple-700 mb-2">
                        Add Rep
                      </label>
                      <SearchableDropdownV2
                        value=""
                        displayValue=""
                        onChange={(id, label) => {
                          if (id && !splitRates.some(r => r.userId === id)) {
                            addRep(id, label);
                          }
                        }}
                        options={repOptions.filter(opt => !splitRates.some(r => r.userId === opt.id))}
                        onSearch={handleRepSearch}
                        isLoading={isRepLoading}
                        placeholder="Search for rep..."
                      />
                    </div>

                    {touched.splitRates && errors.splitRates && (
                      <p className="text-xs text-red-500">{errors.splitRates}</p>
                    )}
                  </div>
                </CollapsibleSection>
              )}

              {/* Summary Card */}
              {amount && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600/70 mb-1">Adjustment Amount</p>
                      <p className="text-3xl font-bold text-indigo-600">{formatCurrency(parseFloat(amount) || 0)}</p>
                    </div>
                    {allocationMethod && (
                      <div className={`px-4 py-2 rounded-xl ${ALLOCATION_METHOD_CONFIG[allocationMethod as AllocationMethod].bgColor}`}>
                        <span className={`text-sm font-semibold ${ALLOCATION_METHOD_CONFIG[allocationMethod as AllocationMethod].color}`}>
                          {ALLOCATION_METHOD_CONFIG[allocationMethod as AllocationMethod].label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isLoadingAdjustmentDetails}
              className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {isEditMode ? 'Update Adjustment' : 'Create Adjustment'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

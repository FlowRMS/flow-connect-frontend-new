'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCustomerFactorySalesReps,
  createCustomerFactorySalesReps,
  updateCustomerFactorySalesRep,
  deleteCustomerFactorySalesRep,
  type CustomerFactorySalesRep,
  type CreateCustomerFactorySalesRepsInput,
  type SplitInput,
} from '../lib/graphql/customer-factory-sales-reps';
import {
  searchCustomers,
  searchFactories,
  searchUsers,
  type CustomerSearchResult,
  type FactorySearchResult,
  type UserSearchResult,
} from '../lib/api/search';

// ============================================================================
// Searchable Dropdown Component
// ============================================================================

interface SearchableDropdownProps<T> {
  label: string;
  placeholder: string;
  value: T | null;
  onSelect: (item: T | null) => void;
  searchFn: (term: string) => Promise<T[]>;
  getDisplayValue: (item: T) => string;
  getSecondaryValue?: (item: T) => string;
  getId: (item: T) => string;
  disabled?: boolean;
  error?: string;
}

function SearchableDropdown<T>({
  label,
  placeholder,
  value,
  onSelect,
  searchFn,
  getDisplayValue,
  getSecondaryValue,
  getId,
  disabled = false,
  error,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial options when dropdown opens
  const loadOptions = useCallback(async (term: string) => {
    setIsLoading(true);
    try {
      const results = await searchFn(term);
      setOptions(results);
    } catch (err) {
      console.error('Search error:', err);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchFn]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      loadOptions(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, loadOptions]);

  // Load initial options when opening
  useEffect(() => {
    if (isOpen && options.length === 0) {
      loadOptions('');
    }
  }, [isOpen, loadOptions, options.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div
        className={`relative flex items-center border rounded-lg transition-all cursor-pointer ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : error
            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200'
            : isOpen
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {value ? (
          <div className="flex-1 flex items-center justify-between px-3 py-2.5">
            <div>
              <div className="text-sm font-medium text-gray-900">{getDisplayValue(value)}</div>
              {getSecondaryValue && (
                <div className="text-xs text-gray-500">{getSecondaryValue(value)}</div>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 px-3 py-2.5 text-sm text-gray-500">{placeholder}</div>
        )}
        <div className="pr-3">
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin"></div>
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No results found
              </div>
            ) : (
              options.map((item) => (
                <div
                  key={getId(item)}
                  onClick={() => handleSelect(item)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    value && getId(value) === getId(item) ? 'bg-[var(--primary)]/5' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{getDisplayValue(item)}</div>
                  {getSecondaryValue && (
                    <div className="text-xs text-gray-500 mt-0.5">{getSecondaryValue(item)}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Rep Split Item Interface
// ============================================================================

interface RepSplitItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rate: string;
  position: number;
}

// ============================================================================
// Add/Edit Modal Component with Rep Splits
// ============================================================================

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateCustomerFactorySalesRepsInput) => Promise<void>;
  editData?: CustomerFactorySalesRep | null;
  existingAssignments?: CustomerFactorySalesRep[];
  isSaving: boolean;
}

function AssignmentModal({ isOpen, onClose, onSave, editData, existingAssignments = [], isSaving }: AssignmentModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [selectedFactory, setSelectedFactory] = useState<FactorySearchResult | null>(null);
  const [repSplits, setRepSplits] = useState<RepSplitItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // For adding new reps
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [newRate, setNewRate] = useState('');

  // Initialize form with edit data or existing assignments for customer-factory pair
  useEffect(() => {
    if (!isOpen) return;

    if (editData) {
      // Single edit mode - populate customer/factory and load all existing splits for this pair
      if (editData.customer) {
        setSelectedCustomer({
          id: editData.customer.id,
          companyName: editData.customer.companyName,
          isParent: editData.customer.isParent,
          parentId: editData.customer.parentId,
          published: editData.customer.published,
        });
      }
      if (editData.factory) {
        setSelectedFactory({
          id: editData.factory.id,
          title: editData.factory.title,
          accountNumber: editData.factory.accountNumber,
          published: editData.factory.published,
        });
      }

      // Load all existing splits for this customer-factory pair
      const pairSplits = existingAssignments
        .filter(a => a.customerId === editData.customerId && a.factoryId === editData.factoryId)
        .map((a, idx) => ({
          id: a.id,
          userId: a.userId,
          userName: a.user?.fullName || `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim() || 'Unknown',
          userEmail: a.user?.email || '',
          rate: a.rate || '',
          position: a.position || idx + 1,
        }));

      setRepSplits(pairSplits.length > 0 ? pairSplits : [{
        id: editData.id,
        userId: editData.userId,
        userName: editData.user?.fullName || `${editData.user?.firstName || ''} ${editData.user?.lastName || ''}`.trim() || 'Unknown',
        userEmail: editData.user?.email || '',
        rate: editData.rate || '',
        position: editData.position || 1,
      }]);
    } else {
      // Reset form for new assignment
      setSelectedCustomer(null);
      setSelectedFactory(null);
      setRepSplits([]);
    }
    setSelectedUser(null);
    setNewRate('');
    setErrors({});
  }, [editData, existingAssignments, isOpen]);

  // Helper function to distribute rates evenly to total 100%
  const distributeRatesEvenly = useCallback((splits: RepSplitItem[]): RepSplitItem[] => {
    if (splits.length === 0) return splits;

    const count = splits.length;
    const baseRate = Math.floor(100 / count);
    const remainder = 100 - (baseRate * count);

    // Distribute base rate to all, give remainder to the last rep
    return splits.map((s, idx) => ({
      ...s,
      rate: String(idx === count - 1 ? baseRate + remainder : baseRate),
      position: idx + 1,
    }));
  }, []);

  const addRepToSplits = useCallback(() => {
    if (!selectedUser) return;

    // Check if rep already exists in splits
    if (repSplits.some(s => s.userId === selectedUser.id)) {
      setErrors(prev => ({ ...prev, user: 'This rep is already added' }));
      return;
    }

    const newSplit: RepSplitItem = {
      id: `new-${crypto.randomUUID()}`,
      userId: selectedUser.id,
      userName: selectedUser.fullName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'Unknown',
      userEmail: selectedUser.email || '',
      rate: '0', // Will be set by distributeRatesEvenly
      position: repSplits.length + 1,
    };

    // Add new rep and auto-distribute rates evenly
    const updatedSplits = distributeRatesEvenly([...repSplits, newSplit]);
    setRepSplits(updatedSplits);
    setSelectedUser(null);
    setNewRate('');
    setErrors(prev => {
      const { user, ...rest } = prev;
      return rest;
    });
  }, [selectedUser, repSplits, distributeRatesEvenly]);

  const removeRepFromSplits = useCallback((id: string) => {
    setRepSplits(prev => {
      const filtered = prev.filter(s => s.id !== id);
      // Re-distribute rates evenly after removal
      return distributeRatesEvenly(filtered);
    });
  }, [distributeRatesEvenly]);

  const updateSplitRate = useCallback((id: string, rate: string) => {
    setRepSplits(prev => prev.map(s => s.id === id ? { ...s, rate } : s));
  }, []);

  const updateSplitPosition = useCallback((id: string, position: number) => {
    setRepSplits(prev => prev.map(s => s.id === id ? { ...s, position } : s));
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedCustomer) newErrors.customer = 'Please select a customer';
    if (!selectedFactory) newErrors.factory = 'Please select a factory';
    if (repSplits.length === 0) newErrors.splits = 'Please add at least one sales rep';

    // Validate each split has a rate
    repSplits.forEach((split, idx) => {
      if (!split.rate.trim()) {
        newErrors[`rate_${idx}`] = 'Rate is required';
      }
    });

    // Validate total rate equals 100%
    if (repSplits.length > 0 && totalRate !== 100) {
      newErrors.totalRate = `Total commission must equal 100% (currently ${totalRate}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const splits: SplitInput[] = repSplits.map(s => ({
      userId: s.userId,
      rate: s.rate.trim(),
      position: s.position,
    }));

    await onSave({
      customerId: selectedCustomer!.id,
      factoryId: selectedFactory!.id,
      splits,
    });
  };

  // Calculate total rate percentage
  const totalRate = repSplits.reduce((sum, s) => {
    const rate = parseFloat(s.rate.replace('%', '')) || 0;
    return sum + rate;
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-visible flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editData ? 'Edit Rep Splits' : 'Add Rep Splits Assignment'}
              </h2>
              <p className="text-sm text-gray-500">
                Assign multiple outside reps with commission splits to a customer-factory pair
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Customer Selection */}
            <SearchableDropdown
              label="Customer"
              placeholder="Select a customer..."
              value={selectedCustomer}
              onSelect={setSelectedCustomer}
              searchFn={(term) => searchCustomers(term, true, 20)}
              getDisplayValue={(c) => c.companyName}
              getSecondaryValue={(c) => c.isParent ? 'Parent Company' : ''}
              getId={(c) => c.id}
              disabled={!!editData}
              error={errors.customer}
            />

            {/* Factory Selection */}
            <SearchableDropdown
              label="Factory / Manufacturer"
              placeholder="Select a factory..."
              value={selectedFactory}
              onSelect={setSelectedFactory}
              searchFn={(term) => searchFactories(term, true, 20)}
              getDisplayValue={(f) => f.title}
              getSecondaryValue={(f) => f.accountNumber ? `Account: ${f.accountNumber}` : ''}
              getId={(f) => f.id}
              disabled={!!editData}
              error={errors.factory}
            />

            {/* Rep Splits Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Outside Rep Splits
                </label>
              </div>

              {/* Total Rate Progress Bar */}
              {repSplits.length > 0 && (
                <div className="mb-4 p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Commission Split</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        totalRate === 100 ? 'text-green-600' : totalRate > 100 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {totalRate}%
                      </span>
                      {totalRate === 100 ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                        totalRate === 100 ? 'bg-green-500' : totalRate > 100 ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(totalRate, 100)}%` }}
                    />
                    {/* 100% marker */}
                    <div className="absolute right-0 top-0 h-full w-0.5 bg-gray-400" />
                  </div>
                  {/* Status Message */}
                  <p className={`mt-2 text-xs ${
                    totalRate === 100 ? 'text-green-600' : totalRate > 100 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {totalRate === 100
                      ? 'Commission splits total 100% - ready to save'
                      : totalRate > 100
                        ? `Over by ${totalRate - 100}% - reduce rates to equal 100%`
                        : `${100 - totalRate}% remaining - add more or adjust rates to equal 100%`
                    }
                  </p>
                </div>
              )}

              {/* Existing Splits */}
              {repSplits.length > 0 && (
                <div className="space-y-2 mb-4">
                  {repSplits.map((split, idx) => {
                    const splitRate = parseFloat(split.rate.replace('%', '')) || 0;
                    return (
                      <div key={split.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-green-700">
                            {split.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{split.userName}</div>
                          <div className="text-xs text-gray-500 truncate">{split.userEmail}</div>
                          {/* Mini progress bar for individual rep */}
                          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden w-24">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${Math.min(splitRate, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={split.rate}
                              onChange={(e) => updateSplitRate(split.id, e.target.value)}
                              placeholder="Rate"
                              className={`w-20 px-2 py-1.5 text-sm border rounded-md text-right ${
                                errors[`rate_${idx}`] ? 'border-red-300' : 'border-gray-300'
                              }`}
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={split.position}
                            onChange={(e) => updateSplitPosition(split.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md text-center"
                            title="Position"
                          />
                          <button
                            onClick={() => removeRepFromSplits(split.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Remove rep"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {errors.splits && <p className="mb-2 text-xs text-red-500">{errors.splits}</p>}
              {errors.totalRate && <p className="mb-2 text-xs text-red-500">{errors.totalRate}</p>}

              {/* Add New Rep */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Add Rep</div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <SearchableDropdown
                      label=""
                      placeholder="Search outside reps..."
                      value={selectedUser}
                      onSelect={setSelectedUser}
                      searchFn={(term) => searchUsers({ searchTerm: term, isInside: false, isOutside: true, enabled: true, limit: 20 })}
                      getDisplayValue={(u) => u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown'}
                      getSecondaryValue={(u) => u.email || ''}
                      getId={(u) => u.id}
                      error={errors.user}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="text"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="Rate %"
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={addRepToSplits}
                    disabled={!selectedUser}
                    className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50 rounded-b-xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || repSplits.length === 0 || totalRate !== 100}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {editData ? 'Save Changes' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assignment: CustomerFactorySalesRep | null;
  isDeleting: boolean;
}

function DeleteModal({ isOpen, onClose, onConfirm, assignment, isDeleting }: DeleteModalProps) {
  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Delete Assignment?
          </h3>
          <p className="text-sm text-gray-500 text-center">
            Are you sure you want to delete the assignment for{' '}
            <span className="font-medium text-gray-900">{assignment.user?.fullName || 'this rep'}</span>
            {' '}to{' '}
            <span className="font-medium text-gray-900">{assignment.customer?.companyName}</span>
            {' / '}
            <span className="font-medium text-gray-900">{assignment.factory?.title}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Bulk Upload Modal Component
// ============================================================================

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: CreateCustomerFactorySalesRepsInput[]) => Promise<void>;
  isUploading: boolean;
}

function BulkUploadModal({ isOpen, onClose, onUpload, isUploading }: BulkUploadModalProps) {
  const [csvData, setCsvData] = useState('');
  const [parsedData, setParsedData] = useState<CreateCustomerFactorySalesRepsInput[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setParseError('CSV must have a header row and at least one data row');
        setParsedData([]);
        return;
      }

      const header = lines[0].toLowerCase().split(',').map(h => h.trim());
      const customerIdIdx = header.indexOf('customerid');
      const factoryIdIdx = header.indexOf('factoryid');
      const userIdIdx = header.indexOf('userid');
      const rateIdx = header.indexOf('rate');
      const positionIdx = header.indexOf('position');

      if (customerIdIdx === -1 || factoryIdIdx === -1 || userIdIdx === -1 || rateIdx === -1) {
        setParseError('CSV must have columns: customerId, factoryId, userId, rate (position is optional)');
        setParsedData([]);
        return;
      }

      // Group by customer-factory pair
      const grouped: Record<string, { customerId: string; factoryId: string; splits: SplitInput[] }> = {};

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const customerId = values[customerIdIdx];
        const factoryId = values[factoryIdIdx];
        const userId = values[userIdIdx];
        const rate = values[rateIdx];
        const position = positionIdx !== -1 ? parseInt(values[positionIdx]) || i : i;

        if (!customerId || !factoryId || !userId || !rate) continue;

        const key = `${customerId}-${factoryId}`;
        if (!grouped[key]) {
          grouped[key] = { customerId, factoryId, splits: [] };
        }
        grouped[key].splits.push({ userId, rate, position });
      }

      const result = Object.values(grouped);
      if (result.length === 0) {
        setParseError('No valid data rows found');
        setParsedData([]);
        return;
      }

      setParseError(null);
      setParsedData(result);
    } catch (err) {
      setParseError('Failed to parse CSV file');
      setParsedData([]);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    await onUpload(parsedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Bulk Upload Assignments</h2>
              <p className="text-sm text-gray-500">Upload a CSV file with rep assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* CSV Format Help */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Required:</h4>
            <code className="text-xs text-blue-700 block bg-blue-100 p-2 rounded">
              customerId,factoryId,userId,rate,position<br/>
              abc123,def456,user1,50,1<br/>
              abc123,def456,user2,50,2
            </code>
            <p className="text-xs text-blue-600 mt-2">
              Rows with the same customerId + factoryId will be grouped as splits.
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors flex flex-col items-center gap-2"
            >
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Click to select a CSV file</span>
            </button>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview ({parsedData.length} customer-factory pairs)</h4>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Customer ID</th>
                      <th className="px-3 py-2 text-left">Factory ID</th>
                      <th className="px-3 py-2 text-center">Reps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 10).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-mono">{item.customerId.slice(0, 8)}...</td>
                        <td className="px-3 py-2 font-mono">{item.factoryId.slice(0, 8)}...</td>
                        <td className="px-3 py-2 text-center">{item.splits.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="px-3 py-2 text-center text-gray-500 text-xs bg-gray-50">
                    ... and {parsedData.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || parsedData.length === 0}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            Upload {parsedData.length > 0 && `(${parsedData.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function CustomerFactorySalesRepSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CustomerFactorySalesRep | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<CustomerFactorySalesRep | null>(null);
  const [filterCustomer, setFilterCustomer] = useState<CustomerSearchResult | null>(null);
  const [filterFactory, setFilterFactory] = useState<FactorySearchResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Query
  const { data: assignments = [], isLoading, error } = useQuery({
    queryKey: ['customer-factory-sales-reps', filterCustomer?.id, filterFactory?.id],
    queryFn: () => listCustomerFactorySalesReps(filterCustomer?.id, filterFactory?.id),
  });

  // Mutations - using the new createCustomerFactorySalesReps with splits
  const createMutation = useMutation({
    mutationFn: createCustomerFactorySalesReps,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-factory-sales-reps'] });
      setIsModalOpen(false);
      setEditingAssignment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerFactorySalesRep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-factory-sales-reps'] });
      setDeletingAssignment(null);
    },
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: CreateCustomerFactorySalesRepsInput[]) => {
      // Process each customer-factory pair sequentially
      const results = [];
      for (const input of data) {
        const result = await createCustomerFactorySalesReps(input);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-factory-sales-reps'] });
      setIsBulkUploadOpen(false);
    },
  });

  // Filter assignments by search term
  const filteredAssignments = assignments.filter((assignment) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      assignment.customer?.companyName?.toLowerCase().includes(term) ||
      assignment.factory?.title?.toLowerCase().includes(term) ||
      assignment.user?.fullName?.toLowerCase().includes(term) ||
      assignment.user?.email?.toLowerCase().includes(term) ||
      assignment.rate?.toLowerCase().includes(term)
    );
  });

  // Group assignments by customer-factory pair for display
  const groupedAssignments = filteredAssignments.reduce((acc, assignment) => {
    const key = `${assignment.customerId}-${assignment.factoryId}`;
    if (!acc[key]) {
      acc[key] = {
        customerId: assignment.customerId,
        factoryId: assignment.factoryId,
        customer: assignment.customer,
        factory: assignment.factory,
        splits: [],
      };
    }
    acc[key].splits.push(assignment);
    return acc;
  }, {} as Record<string, { customerId: string; factoryId: string; customer?: CustomerFactorySalesRep['customer']; factory?: CustomerFactorySalesRep['factory']; splits: CustomerFactorySalesRep[] }>);

  const groupedList = Object.values(groupedAssignments);

  // Handlers
  const handleAddNew = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (assignment: CustomerFactorySalesRep) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateCustomerFactorySalesRepsInput) => {
    // For edit mode, we need to delete existing assignments for this pair first, then create new ones
    if (editingAssignment) {
      // Delete all existing assignments for this customer-factory pair
      const existingForPair = assignments.filter(
        a => a.customerId === data.customerId && a.factoryId === data.factoryId
      );
      for (const existing of existingForPair) {
        await deleteMutation.mutateAsync(existing.id);
      }
    }
    // Create new assignments with splits
    await createMutation.mutateAsync(data);
  };

  const handleDelete = async () => {
    if (deletingAssignment) {
      await deleteMutation.mutateAsync(deletingAssignment.id);
    }
  };

  const handleBulkUpload = async (data: CreateCustomerFactorySalesRepsInput[]) => {
    await bulkUploadMutation.mutateAsync(data);
  };

  const handleClearFilters = () => {
    setFilterCustomer(null);
    setFilterFactory(null);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer-Factory Sales Rep Assignments</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage sales rep assignments for specific customer-factory pairs with custom commission rates
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{assignments.length}</div>
                <div className="text-xs text-gray-500">Total Assignments</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search assignments..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            </div>

            {/* Customer Filter */}
            <div className="w-64">
              <SearchableDropdown
                label="Filter by Customer"
                placeholder="All customers"
                value={filterCustomer}
                onSelect={setFilterCustomer}
                searchFn={(term) => searchCustomers(term, true, 20)}
                getDisplayValue={(c) => c.companyName}
                getId={(c) => c.id}
              />
            </div>

            {/* Factory Filter */}
            <div className="w-64">
              <SearchableDropdown
                label="Filter by Factory"
                placeholder="All factories"
                value={filterFactory}
                onSelect={setFilterFactory}
                searchFn={(term) => searchFactories(term, true, 20)}
                getDisplayValue={(f) => f.title}
                getId={(f) => f.id}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {(filterCustomer || filterFactory || searchTerm) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                disabled
                className="px-4 py-2.5 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed flex items-center gap-2"
                title="Coming Soon"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Bulk Upload
                <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">Coming Soon</span>
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Assignment
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">
                Failed to load assignments. Please try again.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-[var(--primary)] rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-500">Loading assignments...</p>
            </div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl border border-gray-200 p-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Assignments Found</h3>
              <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
                {searchTerm || filterCustomer || filterFactory
                  ? 'No assignments match your filters. Try adjusting your search criteria.'
                  : 'Get started by adding your first customer-factory sales rep assignment.'}
              </p>
              {!searchTerm && !filterCustomer && !filterFactory && (
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Assignment
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Assignments Table */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Factory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sales Rep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Commission Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.customer?.companyName || 'Unknown'}
                            </div>
                            {assignment.customer?.isParent && (
                              <div className="text-xs text-gray-500">Parent Company</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.factory?.title || 'Unknown'}
                            </div>
                            {assignment.factory?.accountNumber && (
                              <div className="text-xs text-gray-500">
                                Account: {assignment.factory.accountNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-green-700">
                              {(assignment.user?.firstName?.[0] || '') + (assignment.user?.lastName?.[0] || '')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.user?.fullName || `${assignment.user?.firstName || ''} ${assignment.user?.lastName || ''}`.trim() || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {[
                                assignment.user?.inside && 'Inside',
                                assignment.user?.outside && 'Outside',
                              ].filter(Boolean).join(' / ') || assignment.user?.role || assignment.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
                          {assignment.rate}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-700">
                          {assignment.position}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingAssignment(assignment)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                Showing {filteredAssignments.length} of {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAssignment(null);
        }}
        onSave={handleSave}
        editData={editingAssignment}
        existingAssignments={assignments}
        isSaving={createMutation.isPending || deleteMutation.isPending}
      />

      <DeleteModal
        isOpen={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDelete}
        assignment={deletingAssignment}
        isDeleting={deleteMutation.isPending}
      />

      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUpload={handleBulkUpload}
        isUploading={bulkUploadMutation.isPending}
      />
    </div>
  );
}

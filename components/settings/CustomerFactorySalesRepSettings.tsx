'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listCustomerFactorySalesReps,
  createCustomerFactorySalesRep,
  updateCustomerFactorySalesRep,
  deleteCustomerFactorySalesRep,
  type CustomerFactorySalesRep,
  type CustomerFactorySalesRepInput,
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
// Add/Edit Modal Component
// ============================================================================

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomerFactorySalesRepInput) => Promise<void>;
  editData?: CustomerFactorySalesRep | null;
  isSaving: boolean;
}

function AssignmentModal({ isOpen, onClose, onSave, editData, isSaving }: AssignmentModalProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [selectedFactory, setSelectedFactory] = useState<FactorySearchResult | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [rate, setRate] = useState('');
  const [position, setPosition] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with edit data
  useEffect(() => {
    if (editData) {
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
      if (editData.user) {
        setSelectedUser({
          id: editData.user.id,
          email: editData.user.email,
          firstName: editData.user.firstName,
          lastName: editData.user.lastName,
          fullName: editData.user.fullName,
          inside: editData.user.inside,
          outside: editData.user.outside,
          role: editData.user.role,
        });
      }
      setRate(editData.rate || '');
      setPosition(String(editData.position || 1));
    } else {
      // Reset form for new assignment
      setSelectedCustomer(null);
      setSelectedFactory(null);
      setSelectedUser(null);
      setRate('');
      setPosition('1');
    }
    setErrors({});
  }, [editData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedCustomer) newErrors.customer = 'Please select a customer';
    if (!selectedFactory) newErrors.factory = 'Please select a factory';
    if (!selectedUser) newErrors.user = 'Please select a sales rep';
    if (!rate.trim()) newErrors.rate = 'Please enter a commission rate';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await onSave({
      customerId: selectedCustomer!.id,
      factoryId: selectedFactory!.id,
      userId: selectedUser!.id,
      rate: rate.trim(),
      position: parseInt(position, 10) || 1,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-visible">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editData ? 'Edit Sales Rep Assignment' : 'Add Sales Rep Assignment'}
              </h2>
              <p className="text-sm text-gray-500">
                Assign a sales rep to a customer-factory pair
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
        <div className="p-6">
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
              error={errors.factory}
            />

            {/* Sales Rep Selection */}
            <SearchableDropdown
              label="Sales Rep"
              placeholder="Select a sales rep..."
              value={selectedUser}
              onSelect={setSelectedUser}
              searchFn={(term) => searchUsers({ searchTerm: term, isInside: true, isOutside: true, enabled: true, limit: 20 })}
              getDisplayValue={(u) => u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Unknown'}
              getSecondaryValue={(u) => {
                const roles: string[] = [];
                if (u.inside) roles.push('Inside');
                if (u.outside) roles.push('Outside');
                return roles.length > 0 ? roles.join(' / ') + ' Rep' : (u.role || '');
              }}
              getId={(u) => u.id}
              error={errors.user}
            />

            {/* Rate and Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Commission Rate
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="e.g., 10%"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.rate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20'
                    }`}
                  />
                </div>
                {errors.rate && <p className="mt-1 text-xs text-red-500">{errors.rate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Position / Priority
                </label>
                <input
                  type="number"
                  min="1"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            {editData ? 'Save Changes' : 'Add Assignment'}
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
// Main Component
// ============================================================================

export default function CustomerFactorySalesRepSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCustomerFactorySalesRep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-factory-sales-reps'] });
      setIsModalOpen(false);
      setEditingAssignment(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: CustomerFactorySalesRepInput & { id: string }) => updateCustomerFactorySalesRep(input),
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

  // Handlers
  const handleAddNew = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (assignment: CustomerFactorySalesRep) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CustomerFactorySalesRepInput) => {
    if (editingAssignment) {
      await updateMutation.mutateAsync({ ...data, id: editingAssignment.id });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async () => {
    if (deletingAssignment) {
      await deleteMutation.mutateAsync(deletingAssignment.id);
    }
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
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteModal
        isOpen={!!deletingAssignment}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDelete}
        assignment={deletingAssignment}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

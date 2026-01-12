/**
 * Company Detail View Component
 * Scroll-based navigation with sticky tabs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Company, CompanyAddress, AddressType, ManufacturerInfo, SalesRepAssignment, CompanyHierarchyRole, ChildCompanyRef } from '../types';
import type { CompanySourceType, Contact as APIContact, Job as APIJob } from '../../lib/crm-graphql';
import { COMPANY_SOURCE_TYPE_OPTIONS, COMPANY_SOURCE_TYPE_LABELS } from '../../lib/crm-graphql';
import CompanyRelatedEntities from './CompanyRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import { AddTaskNoteLinkModal } from '../modals/AddTaskNoteLinkModal';
import { AddAddressModal, type Address } from '../../shared/AddAddressModal';
import AliasesModal, { CompanyAlias } from '../../AliasesModal';
import { SelectChildCompaniesModal } from '../modals/SelectChildCompaniesModal';

type TabId = 'overview' | 'factory-info' | 'sales-reps' | 'addresses' | 'contacts' | 'jobs' | 'quotes' | 'orders' | 'invoices' | 'commission-statements' | 'pre-quotes' | 'emails' | 'meetings' | 'tasks' | 'notes';

// US States list
const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

interface CompanyDetailViewProps {
  company: Company;
  isEditing: boolean;
  editFormData: Partial<Company>;
  deleteConfirmId: string | null;
  updatePending: boolean;
  deletePending: boolean;
  onBack: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onFieldChange: (field: string, value: string | number | boolean | string[] | CompanySourceType | CompanyAddress[] | ManufacturerInfo | SalesRepAssignment[] | CompanyHierarchyRole | ChildCompanyRef[]) => void;
  onContactClick?: (contact: APIContact) => void;
  onJobClick?: (job: APIJob) => void;
}


// Company Type Single-Select Dropdown using proper enum values
function CompanyTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value: CompanySourceType | string;
  onChange: (value: CompanySourceType) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = COMPANY_SOURCE_TYPE_OPTIONS.filter(option =>
    COMPANY_SOURCE_TYPE_LABELS[option].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = value && COMPANY_SOURCE_TYPE_LABELS[value as CompanySourceType]
    ? COMPANY_SOURCE_TYPE_LABELS[value as CompanySourceType]
    : 'Select Company Type';

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setPosition({
          top: rect.top + window.scrollY - dropdownHeight - 4,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 280),
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: Math.max(rect.width, 280),
        });
      }
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideTrigger = triggerRef.current?.contains(target);
      const isInsideDropdown = dropdownRef.current?.contains(target);

      if (!isInsideTrigger && !isInsideDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        <span className="text-gray-900">{selectedLabel}</span>
      </div>
    );
  }

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      {/* Search input */}
      <div className="p-2 border-b border-gray-100">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search company types..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {/* Options list */}
      <div className="max-h-60 overflow-y-auto py-1">
        {filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">No matching types found</div>
        ) : (
          filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
                transition-colors hover:bg-gray-50
                ${value === option ? 'bg-blue-50' : ''}
              `}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className={`flex-1 ${value === option ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                {COMPANY_SOURCE_TYPE_LABELS[option]}
              </span>
              {value === option && (
                <svg className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>
    </div>,
    portalTarget
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          hover:border-blue-300 hover:shadow-sm cursor-pointer
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>{selectedLabel}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownContent}
    </div>
  );
}

// Address Card Component
function AddressCard({
  address,
  isEditing,
  onUpdate,
  onDelete,
}: {
  address: CompanyAddress;
  isEditing: boolean;
  onUpdate: (updated: CompanyAddress) => void;
  onDelete: () => void;
}) {
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
  const readOnlyClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600";

  const toggleAddressType = (type: AddressType) => {
    const newTypes = address.types.includes(type)
      ? address.types.filter(t => t !== type)
      : [...address.types, type];
    onUpdate({ ...address, types: newTypes });
  };

  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
      {/* Address Type Checkboxes */}
      <div className="flex items-center gap-6 mb-4">
        {(['shipping', 'billing', 'mailing'] as AddressType[]).map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={address.types.includes(type)}
              onChange={() => isEditing && toggleAddressType(type)}
              disabled={!isEditing}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 capitalize">{type}</span>
          </label>
        ))}
        {isEditing && (
          <button
            onClick={onDelete}
            className="ml-auto text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      {/* Country */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
        {isEditing ? (
          <select
            value={address.country}
            onChange={(e) => onUpdate({ ...address, country: e.target.value })}
            className={inputClass}
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="Mexico">Mexico</option>
          </select>
        ) : (
          <div className={readOnlyClass}>{address.country || '-'}</div>
        )}
      </div>

      {/* Address Line 1 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1*</label>
        <input
          type="text"
          value={address.addressLine1}
          onChange={(e) => onUpdate({ ...address, addressLine1: e.target.value })}
          className={isEditing ? inputClass : readOnlyClass}
          readOnly={!isEditing}
          placeholder="Street address"
        />
      </div>

      {/* Address Line 2 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
        <input
          type="text"
          value={address.addressLine2 || ''}
          onChange={(e) => onUpdate({ ...address, addressLine2: e.target.value })}
          className={isEditing ? inputClass : readOnlyClass}
          readOnly={!isEditing}
          placeholder="Apt, suite, unit, etc."
        />
      </div>

      {/* City */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
        <input
          type="text"
          value={address.city}
          onChange={(e) => onUpdate({ ...address, city: e.target.value })}
          className={isEditing ? inputClass : readOnlyClass}
          readOnly={!isEditing}
          placeholder="City"
        />
      </div>

      {/* State & ZIP */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State*</label>
          {isEditing ? (
            <select
              value={address.state}
              onChange={(e) => onUpdate({ ...address, state: e.target.value })}
              className={inputClass}
            >
              <option value="">Select a state</option>
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>{state.label}</option>
              ))}
            </select>
          ) : (
            <div className={readOnlyClass}>{address.state || '-'}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code*</label>
          <input
            type="text"
            value={address.zipCode}
            onChange={(e) => onUpdate({ ...address, zipCode: e.target.value })}
            className={isEditing ? inputClass : readOnlyClass}
            readOnly={!isEditing}
            placeholder="ZIP code"
          />
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailView({
  company,
  isEditing,
  editFormData,
  deleteConfirmId,
  updatePending,
  deletePending,
  onBack,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onFieldChange,
  onContactClick,
  onJobClick,
}: CompanyDetailViewProps) {
  // Modal states for linking tasks/notes
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<'TASK' | 'NOTE'>('TASK');
  const [tasksSectionKey, setTasksSectionKey] = useState(0);
  const [notesSectionKey, setNotesSectionKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAliasesModal, setShowAliasesModal] = useState(false);
  const [showChildCompaniesModal, setShowChildCompaniesModal] = useState(false);
  const [pendingHierarchyRole, setPendingHierarchyRole] = useState<CompanyHierarchyRole | null>(null);
  const [companyAliases, setCompanyAliases] = useState<CompanyAlias[]>([
    // Mock aliases for demonstration
    {
      id: 'alias-1',
      type: 'name',
      name: company.name?.toUpperCase() || '',
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'System Import',
    },
  ]);

  // Company alias handlers
  const addCompanyAlias = (alias: Omit<import('../../../components/AliasesModal').ProductAlias, 'id' | 'createdAt'> | Omit<CompanyAlias, 'id' | 'createdAt'>) => {
    // Only handle CompanyAlias since this is a company page
    if ('name' in alias) {
      const newAlias: CompanyAlias = {
        ...(alias as Omit<CompanyAlias, 'id' | 'createdAt'>),
        id: `alias-${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User',
      };
      setCompanyAliases(prev => [...prev, newAlias]);
    }
  };

  const deleteCompanyAlias = (aliasId: string) => {
    setCompanyAliases(prev => prev.filter(a => a.id !== aliasId));
  };

  // Get current company type
  const currentCompanyType = isEditing ? (editFormData.companySourceType || company.companySourceType) : company.companySourceType;
  const isManufacturer = currentCompanyType === 'MANUFACTURER';

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'factory-info': null,
    'sales-reps': null,
    'addresses': null,
    'contacts': null,
    'jobs': null,
    'quotes': null,
    'orders': null,
    'invoices': null,
    'commission-statements': null,
    'pre-quotes': null,
    'emails': null,
    'meetings': null,
    'tasks': null,
    'notes': null,
  });

  // Reference to the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      const headerOffset = 20;
      const sectionTop = section.offsetTop - headerOffset;

      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });
    }
    setActiveTab(tabId);
  }, []);

  // Scroll spy - update active tab based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      let currentSection: TabId = 'overview';

      const tabIds: TabId[] = isManufacturer
        ? ['overview', 'factory-info', 'addresses', 'contacts', 'pre-quotes', 'emails', 'meetings', 'tasks', 'notes']
        : ['overview', 'addresses', 'contacts', 'pre-quotes', 'emails', 'meetings', 'tasks', 'notes'];

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          const sectionTop = section.offsetTop;
          if (scrollTop >= sectionTop - 100) {
            currentSection = tabId;
          }
        }
      }

      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isManufacturer]);

  // Handle link success - trigger refetch via key change
  const handleLinkSuccess = () => {
    if (addLinkEntityType === 'TASK') {
      setTasksSectionKey(prev => prev + 1);
    } else {
      setNotesSectionKey(prev => prev + 1);
    }
  };

  // Open add link modal for specific entity type
  const openAddLinkModal = (entityType: 'TASK' | 'NOTE') => {
    setAddLinkEntityType(entityType);
    setShowAddLinkModal(true);
  };

  // Get addresses
  const addresses = isEditing ? (editFormData.addresses || company.addresses || []) : (company.addresses || []);

  // Get manufacturer info
  const manufacturerInfo = isEditing
    ? (editFormData.manufacturerInfo || company.manufacturerInfo || {})
    : (company.manufacturerInfo || {});

  // Address handlers
  const handleAddAddress = (address: Address) => {
    const newAddress: CompanyAddress = {
      id: address.id,
      types: address.types,
      country: address.country,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    };
    onFieldChange('addresses', [...addresses, newAddress]);
  };

  const updateAddress = (index: number, updated: CompanyAddress) => {
    const newAddresses = [...addresses];
    newAddresses[index] = updated;
    onFieldChange('addresses', newAddresses);
  };

  const deleteAddress = (index: number) => {
    onFieldChange('addresses', addresses.filter((_, i) => i !== index));
  };

  // Manufacturer info handler
  const updateManufacturerInfo = (field: keyof ManufacturerInfo, value: string | number) => {
    onFieldChange('manufacturerInfo', { ...manufacturerInfo, [field]: value });
  };

  // Get sales reps
  const salesReps = isEditing ? (editFormData.salesReps || company.salesReps || []) : (company.salesReps || []);

  // Mock available reps for dropdown (in production, this would come from API)
  const availableReps = [
    { id: 'rep1', name: 'John Smith' },
    { id: 'rep2', name: 'Jane Doe' },
    { id: 'rep3', name: 'Bob Johnson' },
    { id: 'rep4', name: 'Alice Williams' },
    { id: 'rep5', name: 'Charlie Brown' },
  ];

  // Sales rep handlers
  const handleAddSalesRep = (repType: 'inside' | 'outside') => {
    const newRep: SalesRepAssignment = {
      id: `rep-${Date.now()}`,
      repId: '',
      repName: '',
      repType,
      commissionSplit: salesReps.length === 0 ? 1 : 0, // First rep gets 100%, others start at 0
    };
    onFieldChange('salesReps', [...salesReps, newRep]);
  };

  const updateSalesRep = (index: number, updates: Partial<SalesRepAssignment>) => {
    const newReps = [...salesReps];
    newReps[index] = { ...newReps[index], ...updates };

    // If repId changed, update repName
    if (updates.repId) {
      const rep = availableReps.find(r => r.id === updates.repId);
      if (rep) {
        newReps[index].repName = rep.name;
      }
    }

    onFieldChange('salesReps', newReps);
  };

  const deleteSalesRep = (index: number) => {
    const newReps = salesReps.filter((_, i) => i !== index);
    // Redistribute commission if needed
    if (newReps.length === 1) {
      newReps[0].commissionSplit = 1; // Give remaining rep 100%
    }
    onFieldChange('salesReps', newReps);
  };

  // Calculate total commission split
  const totalCommissionSplit = salesReps.reduce((sum, rep) => sum + (rep.commissionSplit || 0), 0);
  const isCommissionValid = Math.abs(totalCommissionSplit - 1) < 0.001; // Allow small floating point errors

  // Build tabs based on company type
  const tabs: { id: TabId; label: string }[] = [
    ...(isManufacturer
      ? [{ id: 'factory-info' as TabId, label: 'Overview' }]
      : [{ id: 'overview' as TabId, label: 'Overview' }]
    ),
    { id: 'sales-reps', label: 'Sales Reps' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'emails', label: 'Emails' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'notes', label: 'Notes' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'pre-quotes', label: 'Pre-Quotes' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'orders', label: 'Orders' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'commission-statements', label: 'Commissions' },
  ];

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const readOnlyClass = "w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const textareaClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y min-h-[80px]";
  const selectClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer";

  const getTypeColor = (type: CompanySourceType) => {
    return type === 'MANUFACTURER'
      ? { bg: 'bg-purple-100', text: 'text-purple-700' }
      : { bg: 'bg-green-100', text: 'text-green-700' };
  };

  const typeColors = getTypeColor(company.companySourceType);

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              {/* Company Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${
                isManufacturer ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {company.name}
                  </h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeColors.bg} ${typeColors.text}`}>
                    {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{company.phone || company.website || 'No contact info'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDeleteClick}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h12M6 6v10a2 2 0 002 2h4a2 2 0 002-2V6M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
            <button
              onClick={onSaveEdit}
              disabled={updatePending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {updatePending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0 sticky top-0 z-10">
        <div className="flex gap-1 overflow-x-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-8 relative">
        {/* Document-Specific Company Banner */}
        {company.isDocumentSpecific && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-purple-800">Document-Specific Company</span>
                    <div className="relative group">
                      <svg className="w-4 h-4 text-purple-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        Document-specific companies are excluded from searches and<br />matching when creating quotes, orders, and invoices.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-purple-700 mt-0.5">
                    This company will not appear in company searches or data matching
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onFieldChange('isDocumentSpecific', false)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Convert to Full Company
              </button>
            </div>
          </div>
        )}

        {/* ============ OVERVIEW SECTION (Non-manufacturers only) ============ */}
        {!isManufacturer && (
          <div ref={el => { sectionRefs.current['overview'] = el; }} id="section-overview">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Overview</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Fields */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Company Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">Company Name*</label>
                      <button
                        type="button"
                        onClick={() => setShowAliasesModal(true)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Aliases ({companyAliases.length})
                      </button>
                    </div>
                    <input
                      type="text"
                      value={isEditing ? (editFormData.name ?? company.name) : company.name}
                      onChange={(e) => onFieldChange('name', e.target.value)}
                      className={isEditing ? inputClass : readOnlyClass}
                      readOnly={!isEditing}
                    />
                  </div>
                  {/* Website */}
                  <div>
                    <label className={labelClass}>Website</label>
                    <input
                      type="text"
                      value={isEditing ? (editFormData.website ?? company.website ?? '') : (company.website || '')}
                      onChange={(e) => onFieldChange('website', e.target.value)}
                      className={isEditing ? inputClass : readOnlyClass}
                      readOnly={!isEditing}
                      placeholder="https://example.com"
                    />
                  </div>
                  {/* Company Type */}
                  <div>
                    <label className={labelClass}>Company Type</label>
                    <CompanyTypeSelect
                      value={isEditing ? (editFormData.companySourceType ?? company.companySourceType ?? 'CUSTOMER') : (company.companySourceType ?? 'CUSTOMER')}
                      onChange={(value) => onFieldChange('companySourceType', value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className={labelClass}>Tags</label>
                  <div className="flex flex-wrap gap-2 min-h-[42px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {(() => {
                      const currentTags = isEditing ? (editFormData.tags ?? company.tags) : company.tags;
                      return currentTags.length > 0 ? (
                        <>
                          {currentTags.map((tag, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {tag}
                              <button
                                onClick={() => {
                                  onFieldChange('tags', currentTags.filter((_, i) => i !== idx));
                                }}
                                className="ml-1 text-blue-500 hover:text-blue-700"
                              >
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">No tags</span>
                      );
                    })()}
                    <button
                      onClick={() => setShowAddTagModal(true)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Add tag
                    </button>
                  </div>
                </div>

                {/* Lists */}
                <div>
                  <label className={labelClass}>Lists</label>
                  <div className="flex flex-wrap gap-2 min-h-[42px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {(() => {
                      const currentLists = isEditing ? (editFormData.lists ?? company.lists) : company.lists;
                      return currentLists && currentLists.length > 0 ? (
                        <>
                          {currentLists.map((list, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              {list}
                              <button
                                onClick={() => {
                                  onFieldChange('lists', currentLists.filter((_, i) => i !== idx));
                                }}
                                className="ml-1 text-purple-500 hover:text-purple-700"
                              >
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </span>
                          ))}
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">No lists</span>
                      );
                    })()}
                    <button
                      onClick={() => setShowAddListModal(true)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                      </svg>
                      Add to list
                    </button>
                  </div>
                </div>

                {/* Company Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Settings</h3>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Document-Specific Company</span>
                        <div className="relative group">
                          <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                            When enabled, this company will be excluded from searches and matching when creating quotes, orders, and invoices. Use this for one-off companies that should not appear in general company lookups.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onFieldChange('isDocumentSpecific', !company.isDocumentSpecific)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        company.isDocumentSpecific ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          company.isDocumentSpecific ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Company Hierarchy */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Hierarchy</h3>
                  <div className="space-y-4">
                    {/* Hierarchy Role Selection */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>Hierarchy Role</label>
                        <div className="relative">
                          <select
                            value={isEditing ? (editFormData.hierarchyRole ?? company.hierarchyRole ?? 'none') : (company.hierarchyRole ?? 'none')}
                            onChange={(e) => {
                              const newRole = e.target.value as CompanyHierarchyRole;
                              if (newRole === 'parent' || newRole === 'grandparent') {
                                // Store the pending role and open modal
                                setPendingHierarchyRole(newRole);
                                setShowChildCompaniesModal(true);
                              } else {
                                // For 'none', just update directly and clear children
                                onFieldChange('hierarchyRole', newRole);
                                onFieldChange('childCompanies', []);
                                onFieldChange('childParentCompanies', []);
                              }
                            }}
                            className={isEditing ? selectClass : readOnlyClass}
                            disabled={!isEditing}
                          >
                            <option value="none">None (Standard Company)</option>
                            <option value="parent">Parent Company</option>
                            <option value="grandparent">Grandparent Company</option>
                          </select>
                          {isEditing && (
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(isEditing ? editFormData.hierarchyRole : company.hierarchyRole) === 'parent'
                            ? 'As a parent company, child customers can be assigned to this company.'
                            : (isEditing ? editFormData.hierarchyRole : company.hierarchyRole) === 'grandparent'
                            ? 'As a grandparent company, child parent companies can be assigned to this company.'
                            : 'Standard company with no parent/child relationships.'}
                        </p>
                      </div>
                      {/* Parent Company Selection - shown if this company can have a parent */}
                      {(company.hierarchyRole !== 'grandparent') && (
                        <div>
                          <label className={labelClass}>Parent Company</label>
                          <input
                            type="text"
                            value={isEditing ? (editFormData.parentCompanyName ?? company.parentCompanyName ?? '') : (company.parentCompanyName ?? '')}
                            onChange={(e) => onFieldChange('parentCompanyName', e.target.value)}
                            className={isEditing ? inputClass : readOnlyClass}
                            readOnly={!isEditing}
                            placeholder="Enter parent company name"
                          />
                        </div>
                      )}
                      {/* Grandparent Company Selection - shown if this company has a parent */}
                      {(company.hierarchyRole !== 'grandparent' && company.hierarchyRole !== 'parent') && (
                        <div>
                          <label className={labelClass}>Grandparent Company</label>
                          <input
                            type="text"
                            value={isEditing ? (editFormData.grandparentCompanyName ?? company.grandparentCompanyName ?? '') : (company.grandparentCompanyName ?? '')}
                            onChange={(e) => onFieldChange('grandparentCompanyName', e.target.value)}
                            className={isEditing ? inputClass : readOnlyClass}
                            readOnly={!isEditing}
                            placeholder="Enter grandparent company name"
                          />
                        </div>
                      )}
                    </div>

                    {/* Child Companies Card - shown if this is a parent company */}
                    {company.hierarchyRole === 'parent' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Child Customers ({company.childCompanies?.length ?? 0})
                          </h4>
                          <button
                            onClick={() => {
                              setPendingHierarchyRole('parent');
                              setShowChildCompaniesModal(true);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Add Child
                          </button>
                        </div>
                        {company.childCompanies && company.childCompanies.length > 0 ? (
                          <div className="space-y-2">
                            {company.childCompanies.map((child) => (
                              <div key={child.id} className="flex items-center justify-between bg-white border border-blue-100 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                    {child.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{child.name}</span>
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">
                                    Customer
                                  </span>
                                </div>
                                <button className="text-gray-400 hover:text-red-500">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-blue-700">No child customers assigned yet.</p>
                        )}
                      </div>
                    )}

                    {/* Child Parent Companies Card - shown if this is a grandparent company */}
                    {company.hierarchyRole === 'grandparent' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Child Parent Companies ({company.childParentCompanies?.length ?? 0})
                          </h4>
                          <button
                            onClick={() => {
                              setPendingHierarchyRole('grandparent');
                              setShowChildCompaniesModal(true);
                            }}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            + Add Child Parent
                          </button>
                        </div>
                        {company.childParentCompanies && company.childParentCompanies.length > 0 ? (
                          <div className="space-y-2">
                            {company.childParentCompanies.map((child) => (
                              <div key={child.id} className="flex items-center justify-between bg-white border border-purple-100 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                    {child.name.charAt(0)}
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">{child.name}</span>
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                    Parent
                                  </span>
                                </div>
                                <button className="text-gray-400 hover:text-red-500">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-purple-700">No child parent companies assigned yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ FACTORY INFO SECTION (Manufacturers only) ============ */}
        {isManufacturer && (
          <div ref={el => { sectionRefs.current['factory-info'] = el; }} id="section-factory-info">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Overview</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className={labelClass}>Manufacturer Name*</label>
                      <input
                        type="text"
                        value={isEditing ? (editFormData.name ?? company.name) : company.name}
                        onChange={(e) => onFieldChange('name', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Account Number</label>
                      <input
                        type="text"
                        value={isEditing ? manufacturerInfo.factoryAccountNumber || '' : (manufacturerInfo.factoryAccountNumber || '')}
                        onChange={(e) => updateManufacturerInfo('factoryAccountNumber', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        type="text"
                        value={isEditing ? editFormData.phone || '' : (company.phone || '')}
                        onChange={(e) => onFieldChange('phone', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        value={isEditing ? manufacturerInfo.factoryEmail || '' : (manufacturerInfo.factoryEmail || '')}
                        onChange={(e) => updateManufacturerInfo('factoryEmail', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Logo URL</label>
                      <input
                        type="text"
                        value={isEditing ? manufacturerInfo.logoUrl || '' : (manufacturerInfo.logoUrl || '')}
                        onChange={(e) => updateManufacturerInfo('logoUrl', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Commission & Discounts */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Commission & Discounts</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className={labelClass}>Base Commission Rate*</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={isEditing
                            ? (manufacturerInfo.baseCommissionRate != null ? (manufacturerInfo.baseCommissionRate * 100).toFixed(1) : '')
                            : (manufacturerInfo.baseCommissionRate != null ? (manufacturerInfo.baseCommissionRate * 100).toFixed(1) : '')}
                          onChange={(e) => updateManufacturerInfo('baseCommissionRate', parseFloat(e.target.value) / 100)}
                          className={`${isEditing ? inputClass : readOnlyClass} pr-8`}
                          readOnly={!isEditing}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Commission Discount Rate</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={isEditing
                            ? (manufacturerInfo.commissionDiscountRate != null ? (manufacturerInfo.commissionDiscountRate * 100).toFixed(1) : '0')
                            : (manufacturerInfo.commissionDiscountRate != null ? (manufacturerInfo.commissionDiscountRate * 100).toFixed(1) : '0')}
                          onChange={(e) => updateManufacturerInfo('commissionDiscountRate', parseFloat(e.target.value) / 100)}
                          className={`${isEditing ? inputClass : readOnlyClass} pr-8`}
                          readOnly={!isEditing}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Overall Discount Rate</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={isEditing
                            ? (manufacturerInfo.overallDiscountRate != null ? (manufacturerInfo.overallDiscountRate * 100).toFixed(1) : '0')
                            : (manufacturerInfo.overallDiscountRate != null ? (manufacturerInfo.overallDiscountRate * 100).toFixed(1) : '0')}
                          onChange={(e) => updateManufacturerInfo('overallDiscountRate', parseFloat(e.target.value) / 100)}
                          className={`${isEditing ? inputClass : readOnlyClass} pr-8`}
                          readOnly={!isEditing}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Freight Discount Type*</label>
                      {isEditing ? (
                        <select
                          value={manufacturerInfo.freightDiscountType || 'ADD'}
                          onChange={(e) => updateManufacturerInfo('freightDiscountType', e.target.value)}
                          className={inputClass}
                        >
                          <option value="ADD">ADD</option>
                          <option value="SUBTRACT">SUBTRACT</option>
                          <option value="NONE">NONE</option>
                        </select>
                      ) : (
                        <div className={readOnlyClass}>{manufacturerInfo.freightDiscountType || 'ADD'}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Operations</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Lead Time</label>
                      <input
                        type="text"
                        value={isEditing ? manufacturerInfo.leadTime || '' : (manufacturerInfo.leadTime || '')}
                        onChange={(e) => updateManufacturerInfo('leadTime', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Payment Terms</label>
                      <input
                        type="text"
                        value={isEditing ? manufacturerInfo.paymentTerms || '' : (manufacturerInfo.paymentTerms || '')}
                        onChange={(e) => updateManufacturerInfo('paymentTerms', e.target.value)}
                        className={isEditing ? inputClass : readOnlyClass}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Terms & Notes */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Terms & Notes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>External Terms</label>
                      <textarea
                        value={isEditing ? manufacturerInfo.externalTerms || '' : (manufacturerInfo.externalTerms || '')}
                        onChange={(e) => updateManufacturerInfo('externalTerms', e.target.value)}
                        className={isEditing ? textareaClass : `${readOnlyClass} min-h-[80px]`}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>External Payment Terms</label>
                      <textarea
                        value={isEditing ? manufacturerInfo.externalPaymentTerms || '' : (manufacturerInfo.externalPaymentTerms || '')}
                        onChange={(e) => updateManufacturerInfo('externalPaymentTerms', e.target.value)}
                        className={isEditing ? textareaClass : `${readOnlyClass} min-h-[80px]`}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Freight Terms</label>
                      <textarea
                        value={isEditing ? manufacturerInfo.freightTerms || '' : (manufacturerInfo.freightTerms || '')}
                        onChange={(e) => updateManufacturerInfo('freightTerms', e.target.value)}
                        className={isEditing ? textareaClass : `${readOnlyClass} min-h-[80px]`}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Additional Information</label>
                      <textarea
                        value={isEditing ? manufacturerInfo.additionalInformation || '' : (manufacturerInfo.additionalInformation || '')}
                        onChange={(e) => updateManufacturerInfo('additionalInformation', e.target.value)}
                        className={isEditing ? textareaClass : `${readOnlyClass} min-h-[80px]`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Classification */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Classification</h3>
                  <div className="space-y-4">
                    {/* Company Type */}
                    <div>
                      <label className={labelClass}>Company Type</label>
                      <CompanyTypeSelect
                        value={isEditing ? (editFormData.companySourceType ?? company.companySourceType ?? 'MANUFACTURER') : (company.companySourceType ?? 'MANUFACTURER')}
                        onChange={(value) => onFieldChange('companySourceType', value)}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className={labelClass}>Tags</label>
                      <div className="flex flex-wrap gap-2 min-h-[42px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {(() => {
                          const currentTags = isEditing ? (editFormData.tags ?? company.tags) : company.tags;
                          return currentTags.length > 0 ? (
                            <>
                              {currentTags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  {tag}
                                  <button
                                    onClick={() => {
                                      onFieldChange('tags', currentTags.filter((_, i) => i !== idx));
                                    }}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                    </svg>
                                  </button>
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">No tags</span>
                          );
                        })()}
                        <button
                          onClick={() => setShowAddTagModal(true)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                          </svg>
                          Add tag
                        </button>
                      </div>
                    </div>

                    {/* Lists */}
                    <div>
                      <label className={labelClass}>Lists</label>
                      <div className="flex flex-wrap gap-2 min-h-[42px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                        {(() => {
                          const currentLists = isEditing ? (editFormData.lists ?? company.lists) : company.lists;
                          return currentLists && currentLists.length > 0 ? (
                            <>
                              {currentLists.map((list, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  {list}
                                  <button
                                    onClick={() => {
                                      onFieldChange('lists', currentLists.filter((_, i) => i !== idx));
                                    }}
                                    className="ml-1 text-purple-500 hover:text-purple-700"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                    </svg>
                                  </button>
                                </span>
                              ))}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">No lists</span>
                          );
                        })()}
                        <button
                          onClick={() => setShowAddListModal(true)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                          </svg>
                          Add to list
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Settings */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Settings</h3>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-8">
                      {/* Warehouse Manufacturer Toggle */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Warehouse Manufacturer</span>
                          <div className="relative group">
                            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                              When enabled, this manufacturer will be available in the warehouse module for inventory management and fulfillment operations.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onFieldChange('isWarehouseManufacturer', !company.isWarehouseManufacturer)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            company.isWarehouseManufacturer ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              company.isWarehouseManufacturer ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {/* Document-Specific Company Toggle */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Document-Specific Company</span>
                          <div className="relative group">
                            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
                              When enabled, this company will be excluded from searches and matching when creating quotes, orders, and invoices. Use this for one-off companies that should not appear in general company lookups.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onFieldChange('isDocumentSpecific', !company.isDocumentSpecific)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            company.isDocumentSpecific ? 'bg-purple-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              company.isDocumentSpecific ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ SALES REPS SECTION ============ */}
        <div ref={el => { sectionRefs.current['sales-reps'] = el; }} id="section-sales-reps">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Sales Reps</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  {salesReps.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddSalesRep('inside')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Inside Rep
                </button>
                <button
                  onClick={() => handleAddSalesRep('outside')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Outside Rep
                </button>
              </div>
            </div>
            <div className="p-6">
              {salesReps.length > 0 ? (
                <div className="space-y-4">
                  {/* Commission Split Warning */}
                  {salesReps.length > 1 && !isCommissionValid && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Commission splits must total 100%. Current total: {(totalCommissionSplit * 100).toFixed(0)}%</span>
                    </div>
                  )}

                  {/* Inside Reps */}
                  {salesReps.filter(r => r.repType === 'inside').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Inside Reps</h3>
                      <div className="space-y-3">
                        {salesReps.map((rep, index) => rep.repType === 'inside' && (
                          <div key={rep.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Rep Name</label>
                                {isEditing ? (
                                  <select
                                    value={rep.repId}
                                    onChange={(e) => updateSalesRep(index, { repId: e.target.value })}
                                    className={inputClass}
                                  >
                                    <option value="">Select a rep</option>
                                    {availableReps.map(r => (
                                      <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className={readOnlyClass}>{rep.repName || '-'}</div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Commission Split</label>
                                {isEditing ? (
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={(rep.commissionSplit * 100).toFixed(0)}
                                      onChange={(e) => updateSalesRep(index, { commissionSplit: parseFloat(e.target.value) / 100 })}
                                      className={`${inputClass} pr-8`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                  </div>
                                ) : (
                                  <div className={readOnlyClass}>{(rep.commissionSplit * 100).toFixed(0)}%</div>
                                )}
                              </div>
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => deleteSalesRep(index)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove rep"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outside Reps */}
                  {salesReps.filter(r => r.repType === 'outside').length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Outside Reps</h3>
                      <div className="space-y-3">
                        {salesReps.map((rep, index) => rep.repType === 'outside' && (
                          <div key={rep.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Rep Name</label>
                                {isEditing ? (
                                  <select
                                    value={rep.repId}
                                    onChange={(e) => updateSalesRep(index, { repId: e.target.value })}
                                    className={inputClass}
                                  >
                                    <option value="">Select a rep</option>
                                    {availableReps.map(r => (
                                      <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className={readOnlyClass}>{rep.repName || '-'}</div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Commission Split</label>
                                {isEditing ? (
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      value={(rep.commissionSplit * 100).toFixed(0)}
                                      onChange={(e) => updateSalesRep(index, { commissionSplit: parseFloat(e.target.value) / 100 })}
                                      className={`${inputClass} pr-8`}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                                  </div>
                                ) : (
                                  <div className={readOnlyClass}>{(rep.commissionSplit * 100).toFixed(0)}%</div>
                                )}
                              </div>
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => deleteSalesRep(index)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Remove rep"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Commission Split Summary */}
                  {salesReps.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Total Commission Split:</span>
                        <span className={`font-semibold ${isCommissionValid ? 'text-green-600' : 'text-red-600'}`}>
                          {(totalCommissionSplit * 100).toFixed(0)}%
                          {isCommissionValid && (
                            <svg className="inline-block w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-[var(--muted-foreground)]">
                  <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm">No sales reps assigned</p>
                  <button
                    onClick={() => handleAddSalesRep('inside')}
                    className="mt-2 text-sm text-[var(--primary)] hover:underline"
                  >
                    + Add a sales rep
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ ADDRESSES SECTION ============ */}
        <div ref={el => { sectionRefs.current['addresses'] = el; }} id="section-addresses">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Addresses</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  {addresses.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link address modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Address
                </button>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Address
                </button>
              </div>
            </div>
            <div className="p-6">
              {addresses.length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  {addresses.map((address, index) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isEditing={isEditing}
                      onUpdate={(updated) => updateAddress(index, updated)}
                      onDelete={() => deleteAddress(index)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[var(--muted-foreground)]">
                  <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">No addresses linked</p>
                  <button
                    onClick={() => setShowAddAddressModal(true)}
                    className="mt-2 text-sm text-[var(--primary)] hover:underline"
                  >
                    + Add an address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ CONTACTS SECTION ============ */}
        <div ref={el => { sectionRefs.current['contacts'] = el; }} id="section-contacts">
          <CompanyRelatedEntities
            company={company}
            onContactClick={onContactClick}
            onJobClick={onJobClick}
            onNewContactClick={() => {/* TODO: New contact modal */}}
            onNewJobClick={() => {/* TODO: New job modal */}}
          />
        </div>

        {/* ============ JOBS SECTION ============ */}
        <div ref={el => { sectionRefs.current['jobs'] = el; }} id="section-jobs">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Jobs</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link job modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Job
                </button>
                <button
                  onClick={() => {/* TODO: New job modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Job
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No jobs linked</p>
                <button
                  onClick={() => {/* TODO: New job modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Add a job
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ QUOTES SECTION ============ */}
        <div ref={el => { sectionRefs.current['quotes'] = el; }} id="section-quotes">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Quotes</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link quote modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Quote
                </button>
                <button
                  onClick={() => {/* TODO: New quote modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Quote
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No quotes linked</p>
                <button
                  onClick={() => {/* TODO: New quote modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Add a quote
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ ORDERS SECTION ============ */}
        <div ref={el => { sectionRefs.current['orders'] = el; }} id="section-orders">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Orders</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link order modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Order
                </button>
                <button
                  onClick={() => {/* TODO: New order modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Order
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-sm">No orders linked</p>
                <button
                  onClick={() => {/* TODO: New order modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Add an order
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ INVOICES SECTION ============ */}
        <div ref={el => { sectionRefs.current['invoices'] = el; }} id="section-invoices">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Invoices</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link invoice modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Invoice
                </button>
                <button
                  onClick={() => {/* TODO: New invoice modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Invoice
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                <p className="text-sm">No invoices linked</p>
                <button
                  onClick={() => {/* TODO: New invoice modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Add an invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ COMMISSION STATEMENTS SECTION ============ */}
        <div ref={el => { sectionRefs.current['commission-statements'] = el; }} id="section-commission-statements">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Commissions</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link commission statement modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Statement
                </button>
                <button
                  onClick={() => {/* TODO: New commission statement modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Statement
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No commission statements linked</p>
                <button
                  onClick={() => {/* TODO: New commission statement modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Add a statement
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ PRE-QUOTES SECTION ============ */}
        <div ref={el => { sectionRefs.current['pre-quotes'] = el; }} id="section-pre-quotes">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Pre-Quotes</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link pre-quote modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Pre-Quote
                </button>
                <button
                  onClick={() => {/* TODO: New pre-quote modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  New Pre-Quote
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No pre-quotes linked</p>
                <button
                  onClick={() => {/* TODO: New pre-quote modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Add a pre-quote
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ EMAILS SECTION ============ */}
        <div ref={el => { sectionRefs.current['emails'] = el; }} id="section-emails">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Emails</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link email modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Email
                </button>
                <button
                  onClick={() => {/* TODO: Compose email modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Compose Email
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No emails linked</p>
                <button
                  onClick={() => {/* TODO: Compose email modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Compose an email
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ MEETINGS SECTION ============ */}
        <div ref={el => { sectionRefs.current['meetings'] = el; }} id="section-meetings">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Meetings</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Link meeting modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Meeting
                </button>
                <button
                  onClick={() => {/* TODO: Schedule meeting modal */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Schedule Meeting
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4 text-[var(--muted-foreground)]">
                <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No meetings linked</p>
                <button
                  onClick={() => {/* TODO: Schedule meeting modal */}}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline"
                >
                  + Schedule a meeting
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ TASKS SECTION ============ */}
        <div ref={el => { sectionRefs.current['tasks'] = el; }} id="section-tasks">
          <ConnectedTasksSection
            key={`tasks-${tasksSectionKey}`}
            entityId={company.id}
            entityType="COMPANY"
            title="Tasks"
            onAddClick={() => { openAddLinkModal('TASK'); }}
            onNewClick={() => {/* TODO: New task modal */}}
            onUnlinkSuccess={() => setTasksSectionKey(prev => prev + 1)}
          />
        </div>

        {/* ============ NOTES SECTION ============ */}
        <div ref={el => { sectionRefs.current['notes'] = el; }} id="section-notes">
          <ConnectedNotesSection
            key={`notes-${notesSectionKey}`}
            entityId={company.id}
            entityType="COMPANY"
            title="Notes"
            onAddClick={() => { openAddLinkModal('NOTE'); }}
            onNewClick={() => {/* TODO: New note modal */}}
            onUnlinkSuccess={() => setNotesSectionKey(prev => prev + 1)}
          />
        </div>

      </div>

      {/* Add Link Modal for Tasks/Notes */}
      <AddTaskNoteLinkModal
        isOpen={showAddLinkModal}
        entityId={company.id}
        entityType="COMPANY"
        initialLinkType={addLinkEntityType}
        onClose={() => { setShowAddLinkModal(false); }}
        onSuccess={handleLinkSuccess}
      />

      <AddAddressModal
        isOpen={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onSave={handleAddAddress}
      />

      {deleteConfirmId && (
        <DeleteConfirmModal
          companyName={company.name}
          isPending={deletePending}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      )}

      {/* Add Tag Modal */}
      {showAddTagModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddTagModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Tag</h3>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTagName.trim()) {
                  const currentTags = isEditing ? (editFormData.tags ?? company.tags) : company.tags;
                  if (!currentTags.includes(newTagName.trim())) {
                    onFieldChange('tags', [...currentTags, newTagName.trim()]);
                  }
                  setNewTagName('');
                  setShowAddTagModal(false);
                }
                if (e.key === 'Escape') {
                  setNewTagName('');
                  setShowAddTagModal(false);
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setNewTagName('');
                  setShowAddTagModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newTagName.trim()) {
                    const currentTags = isEditing ? (editFormData.tags ?? company.tags) : company.tags;
                    if (!currentTags.includes(newTagName.trim())) {
                      onFieldChange('tags', [...currentTags, newTagName.trim()]);
                    }
                    setNewTagName('');
                    setShowAddTagModal(false);
                  }
                }}
                disabled={!newTagName.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add List Modal */}
      {showAddListModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddListModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to List</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newListName.trim()) {
                  const currentLists = isEditing ? (editFormData.lists ?? company.lists) : company.lists;
                  if (!currentLists.includes(newListName.trim())) {
                    onFieldChange('lists', [...currentLists, newListName.trim()]);
                  }
                  setNewListName('');
                  setShowAddListModal(false);
                }
                if (e.key === 'Escape') {
                  setNewListName('');
                  setShowAddListModal(false);
                }
              }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setNewListName('');
                  setShowAddListModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newListName.trim()) {
                    const currentLists = isEditing ? (editFormData.lists ?? company.lists) : company.lists;
                    if (!currentLists.includes(newListName.trim())) {
                      onFieldChange('lists', [...currentLists, newListName.trim()]);
                    }
                    setNewListName('');
                    setShowAddListModal(false);
                  }
                }}
                disabled={!newListName.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Aliases Modal */}
      {showAliasesModal && (
        <AliasesModal
          type="company"
          entityName={company.name}
          aliases={companyAliases}
          onAdd={addCompanyAlias}
          onDelete={deleteCompanyAlias}
          onClose={() => setShowAliasesModal(false)}
        />
      )}

      {/* Select Child Companies Modal */}
      <SelectChildCompaniesModal
        isOpen={showChildCompaniesModal}
        hierarchyRole={pendingHierarchyRole ?? 'parent'}
        currentChildCompanies={
          pendingHierarchyRole === 'grandparent'
            ? (company.childParentCompanies ?? [])
            : (company.childCompanies ?? [])
        }
        onClose={() => {
          setShowChildCompaniesModal(false);
          setPendingHierarchyRole(null);
        }}
        onSave={(selectedCompanies) => {
          if (pendingHierarchyRole === 'grandparent') {
            onFieldChange('hierarchyRole', 'grandparent');
            onFieldChange('childParentCompanies', selectedCompanies);
          } else if (pendingHierarchyRole === 'parent') {
            onFieldChange('hierarchyRole', 'parent');
            onFieldChange('childCompanies', selectedCompanies);
          }
          setShowChildCompaniesModal(false);
          setPendingHierarchyRole(null);
        }}
      />
    </main>
  );
}

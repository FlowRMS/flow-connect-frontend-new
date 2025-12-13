/**
 * Company Detail View Component
 * Scroll-based navigation with sticky tabs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Company, CompanyAddress, AddressType, ManufacturerInfo, SalesRepAssignment } from '../types';
import type { CompanySourceType, Contact as APIContact, Job as APIJob } from '../../lib/crm-graphql';
import CompanyRelatedEntities from './CompanyRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import { AddTaskNoteLinkModal } from '../modals/AddTaskNoteLinkModal';
import { AddAddressModal, type Address } from '../../shared/AddAddressModal';

type TabId = 'overview' | 'factory-info' | 'sales-reps' | 'addresses' | 'contacts' | 'pre-quotes' | 'emails' | 'meetings' | 'tasks' | 'notes' | 'tags';

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
  onFieldChange: (field: string, value: string | number | CompanySourceType | CompanyAddress[] | ManufacturerInfo | SalesRepAssignment[]) => void;
  onContactClick?: (contact: APIContact) => void;
  onJobClick?: (job: APIJob) => void;
}

// Portaled Select Component for Company Type
function CompanyTypeSelect({
  value,
  onChange,
  disabled,
}: {
  value: CompanySourceType;
  onChange: (value: CompanySourceType) => void;
  disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: { value: CompanySourceType; label: string; description: string }[] = [
    { value: 'CUSTOMER', label: 'Customer', description: 'End customers and buyers' },
    { value: 'MANUFACTURER', label: 'Manufacturer', description: 'Product manufacturers and suppliers' },
  ];

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 120;

      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setPosition({
          top: rect.top + window.scrollY - dropdownHeight - 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      } else {
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
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

  const selectedOption = options.find(opt => opt.value === value);

  const getTypeColor = (type: CompanySourceType) => {
    return type === 'MANUFACTURER'
      ? { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' }
      : { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
  };

  if (disabled) {
    const colors = getTypeColor(value);
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
        <span className="text-gray-900">{selectedOption?.label || (value === 'MANUFACTURER' ? 'Manufacturer' : 'Customer')}</span>
      </div>
    );
  }

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="py-1">
        {options.map((option) => {
          const colors = getTypeColor(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
                transition-colors hover:bg-gray-50
                ${value === option.value ? 'bg-blue-50' : ''}
              `}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} flex-shrink-0`} />
              <div className="flex-1">
                <span className={`${value === option.value ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                  {option.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              </div>
              {value === option.value && (
                <svg className="w-4 h-4 text-blue-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
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
          <span className={`w-2.5 h-2.5 rounded-full ${getTypeColor(value).dot}`} />
          <span className="text-gray-900">{selectedOption?.label || (value === 'MANUFACTURER' ? 'Manufacturer' : 'Customer')}</span>
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
    'pre-quotes': null,
    'emails': null,
    'meetings': null,
    'tasks': null,
    'notes': null,
    'tags': null,
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
      ? [{ id: 'factory-info' as TabId, label: 'Factory Info' }]
      : [{ id: 'overview' as TabId, label: 'Overview' }]
    ),
    { id: 'sales-reps', label: 'Sales Reps' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'pre-quotes', label: 'Pre-Quotes' },
    { id: 'emails', label: 'Emails' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'notes', label: 'Notes' },
    { id: 'tags', label: 'Tags' },
  ];

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const readOnlyClass = "w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const textareaClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y min-h-[80px]";

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
            {isEditing ? (
              <>
                <button
                  onClick={onCancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
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
                    'Save Changes'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onStartEdit}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit
              </button>
            )}
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
        {/* ============ OVERVIEW SECTION (Non-manufacturers only) ============ */}
        {!isManufacturer && (
          <div ref={el => { sectionRefs.current['overview'] = el; }} id="section-overview">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Overview</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className={labelClass}>Company Name*</label>
                    <input
                      type="text"
                      value={isEditing ? editFormData.name || '' : company.name}
                      onChange={(e) => onFieldChange('name', e.target.value)}
                      className={isEditing ? inputClass : readOnlyClass}
                      readOnly={!isEditing}
                    />
                  </div>
                  {/* Contact Email */}
                  <div>
                    <label className={labelClass}>Contact Email</label>
                    <input
                      type="email"
                      value={isEditing ? editFormData.email || '' : (company.email || '')}
                      onChange={(e) => onFieldChange('email', e.target.value)}
                      className={isEditing ? inputClass : readOnlyClass}
                      readOnly={!isEditing}
                    />
                  </div>
                  {/* Contact Number */}
                  <div>
                    <label className={labelClass}>Contact Number</label>
                    <input
                      type="text"
                      value={isEditing ? editFormData.phone || '' : (company.phone || '')}
                      onChange={(e) => onFieldChange('phone', e.target.value)}
                      className={isEditing ? inputClass : readOnlyClass}
                      readOnly={!isEditing}
                    />
                  </div>
                  {/* Inside Rep */}
                  <div>
                    <label className={labelClass}>Inside Rep*</label>
                    {isEditing ? (
                      <select
                        value={editFormData.insideRep || company.insideRep || ''}
                        onChange={(e) => onFieldChange('insideRep', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select Inside Rep</option>
                        <option value="Rep 1">Rep 1</option>
                        <option value="Rep 2">Rep 2</option>
                        <option value="Rep 3">Rep 3</option>
                      </select>
                    ) : (
                      <div className={readOnlyClass}>{company.insideRep || '-'}</div>
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
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Factory Information</h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Basic Information</h3>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className={labelClass}>Factory Name*</label>
                      <input
                        type="text"
                        value={company.name}
                        className={readOnlyClass}
                        readOnly
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
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={isEditing ? manufacturerInfo.logoUrl || '' : (manufacturerInfo.logoUrl || '')}
                          onChange={(e) => updateManufacturerInfo('logoUrl', e.target.value)}
                          className={isEditing ? inputClass : readOnlyClass}
                          readOnly={!isEditing}
                        />
                        {isEditing && (
                          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
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

        {/* ============ TAGS SECTION ============ */}
        <div ref={el => { sectionRefs.current['tags'] = el; }} id="section-tags">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Tags</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  {company.tags.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Add tag */}}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Tag
                </button>
              </div>
            </div>
            <div className="p-6">
              {company.tags.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {company.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-[var(--muted-foreground)]">
                  <svg className="w-12 h-12 text-[var(--muted-foreground)]/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p className="text-sm">No tags added</p>
                  <button
                    onClick={() => {/* TODO: Add tag */}}
                    className="mt-2 text-sm text-[var(--primary)] hover:underline"
                  >
                    + Add a tag
                  </button>
                </div>
              )}
            </div>
          </div>
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
    </main>
  );
}

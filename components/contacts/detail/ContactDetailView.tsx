/**
 * Contact Detail View Component
 * Scroll-based navigation with sticky tabs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CONTACT_ROLES } from '../constants';
import { getInitials, getAvatarColor } from '../utils';
import ContactRelatedEntities from './ContactRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import { AddTaskNoteLinkModal } from '../modals/AddTaskNoteLinkModal';
import type { Contact, ContactAddress, AddressType } from '../types';
import type { Job as APIJob, Company as APICompany } from '../../lib/crm-graphql';
import { AddAddressModal, type Address } from '../../shared/AddAddressModal';

type TabId = 'overview' | 'addresses' | 'company' | 'jobs' | 'tasks' | 'notes';

// US States for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

interface ContactDetailViewProps {
  contact: Contact;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  editFormData: Partial<Contact>;
  deleteConfirmId: string | null;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onFieldChange: (field: string, value: string) => void;
  setDeleteConfirmId: (id: string | null) => void;
  onJobClick?: (job: APIJob) => void;
  onCompanyClick?: (company: APICompany) => void;
}

// Address Card Component
interface AddressCardProps {
  address: ContactAddress;
  isEditing: boolean;
  onUpdate: (updates: Partial<ContactAddress>) => void;
  onDelete: () => void;
}

function AddressCard({ address, isEditing, onUpdate, onDelete }: AddressCardProps) {
  const handleTypeToggle = (type: AddressType) => {
    const newTypes = address.types.includes(type)
      ? address.types.filter(t => t !== type)
      : [...address.types, type];
    onUpdate({ types: newTypes });
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const readOnlyClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600";

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Address Type Checkboxes */}
      <div className="flex items-center gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={address.types.includes('shipping')}
            onChange={() => isEditing && handleTypeToggle('shipping')}
            disabled={!isEditing}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Shipping</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={address.types.includes('billing')}
            onChange={() => isEditing && handleTypeToggle('billing')}
            disabled={!isEditing}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Billing</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={address.types.includes('mailing')}
            onChange={() => isEditing && handleTypeToggle('mailing')}
            disabled={!isEditing}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Mailing</span>
        </label>

        {isEditing && (
          <button
            onClick={onDelete}
            className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Remove address"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Address Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
          {isEditing ? (
            <select
              value={address.country}
              onChange={(e) => onUpdate({ country: e.target.value })}
              className={inputClass}
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="MX">Mexico</option>
            </select>
          ) : (
            <div className={readOnlyClass}>{address.country || '-'}</div>
          )}
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
          {isEditing ? (
            <select
              value={address.state}
              onChange={(e) => onUpdate({ state: e.target.value })}
              className={inputClass}
            >
              <option value="">Select State</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          ) : (
            <div className={readOnlyClass}>{address.state || '-'}</div>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1</label>
          <input
            type="text"
            value={address.addressLine1}
            onChange={(e) => onUpdate({ addressLine1: e.target.value })}
            className={isEditing ? inputClass : readOnlyClass}
            readOnly={!isEditing}
            placeholder="Street address"
          />
        </div>

        {/* Address Line 2 */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
          <input
            type="text"
            value={address.addressLine2 || ''}
            onChange={(e) => onUpdate({ addressLine2: e.target.value })}
            className={isEditing ? inputClass : readOnlyClass}
            readOnly={!isEditing}
            placeholder="Suite, unit, building, floor, etc."
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => onUpdate({ city: e.target.value })}
            className={isEditing ? inputClass : readOnlyClass}
            readOnly={!isEditing}
            placeholder="City"
          />
        </div>

        {/* ZIP Code */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ZIP Code</label>
          <input
            type="text"
            value={address.zipCode}
            onChange={(e) => onUpdate({ zipCode: e.target.value })}
            className={isEditing ? inputClass : readOnlyClass}
            readOnly={!isEditing}
            placeholder="ZIP Code"
          />
        </div>
      </div>
    </div>
  );
}

// Portaled Role Select Component
interface RoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function RoleSelect({ value, onChange, disabled }: RoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(CONTACT_ROLES.length * 44 + 8, 250);

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

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="max-h-60 overflow-y-auto py-1">
        <button
          type="button"
          onClick={() => {
            onChange('');
            setIsOpen(false);
          }}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors text-gray-500"
        >
          Select Role...
        </button>
        {CONTACT_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => {
              onChange(role);
              setIsOpen(false);
            }}
            className={`
              w-full px-4 py-2.5 text-left text-sm flex items-center justify-between
              transition-colors hover:bg-gray-50
              ${value === role ? 'bg-blue-50' : ''}
            `}
          >
            <span className={`${value === role ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
              {role}
            </span>
            {value === role && (
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>,
    portalTarget
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-blue-300 hover:shadow-sm cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {value ? (
            <span className="text-gray-900 truncate">{value}</span>
          ) : (
            <span className="text-gray-400">Select Role...</span>
          )}
        </div>
        {!disabled && (
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {dropdownContent}
    </div>
  );
}

export default function ContactDetailView({
  contact,
  isEditing,
  isSaving,
  isDeleting,
  editFormData,
  deleteConfirmId,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFieldChange,
  setDeleteConfirmId,
  onJobClick,
  onCompanyClick,
}: ContactDetailViewProps) {
  // Modal states for linking tasks/notes
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<'TASK' | 'NOTE'>('TASK');
  const [tasksSectionKey, setTasksSectionKey] = useState(0);
  const [notesSectionKey, setNotesSectionKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  // Local state for addresses (since they're managed locally until save)
  const [localAddresses, setLocalAddresses] = useState<ContactAddress[]>(contact.addresses || []);

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'addresses': null,
    'company': null,
    'jobs': null,
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

    const tabIds: TabId[] = ['overview', 'addresses', 'company', 'jobs', 'tasks', 'notes'];

    const handleScroll = () => {
      const scrollTop = container.scrollTop;

      let currentSection: TabId = 'overview';

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
  }, []);

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

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'addresses' as TabId, label: 'Addresses' },
    { id: 'company' as TabId, label: 'Company & Jobs' },
    { id: 'tasks' as TabId, label: 'Tasks' },
    { id: 'notes' as TabId, label: 'Notes' },
  ];

  // Address management functions
  const handleAddAddress = (address: Address) => {
    const newAddress: ContactAddress = {
      id: address.id,
      types: address.types,
      country: address.country,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    };
    setLocalAddresses([...localAddresses, newAddress]);
  };

  const updateAddress = (addressId: string, updates: Partial<ContactAddress>) => {
    setLocalAddresses(localAddresses.map(addr =>
      addr.id === addressId ? { ...addr, ...updates } : addr
    ));
  };

  const deleteAddress = (addressId: string) => {
    setLocalAddresses(localAddresses.filter(addr => addr.id !== addressId));
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const readOnlyClass = "w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";

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
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-xl ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                {getInitials(contact.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {contact.name}
                  </h1>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      Contact details and related entities
                    </div>
                  </div>
                  {/* Contact Types */}
                  {contact.contactType.map((type, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500">{contact.email || contact.phone || 'No contact info'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDeleteConfirmId(contact.id)}
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
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
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
                onClick={onEdit}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 010 3l-9 9L6 15l.5-3.5 9-9a2.121 2.121 0 013 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Contact
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
        {/* ============ OVERVIEW SECTION ============ */}
        <div ref={el => { sectionRefs.current['overview'] = el; }} id="section-overview">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>

          {/* Contact Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Contact Information
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* First Name */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editFormData.firstName || '' : contact.firstName}
                    onChange={(e) => onFieldChange('firstName', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder="Enter first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editFormData.lastName || '' : contact.lastName}
                    onChange={(e) => onFieldChange('lastName', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder="Enter last name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Role
                  </label>
                  {isEditing ? (
                    <RoleSelect
                      value={editFormData.role || contact.role}
                      onChange={(value) => onFieldChange('role', value)}
                    />
                  ) : (
                    <input
                      type="text"
                      value={contact.role || '-'}
                      className={readOnlyClass}
                      readOnly
                    />
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    value={isEditing ? editFormData.email || '' : (contact.email || '-')}
                    onChange={(e) => onFieldChange('email', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder="Enter email"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={isEditing ? editFormData.phone || '' : (contact.phone || '-')}
                    onChange={(e) => onFieldChange('phone', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder="Enter phone"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company
                  </label>
                  <input
                    type="text"
                    value={contact.company || '-'}
                    className={readOnlyClass}
                    readOnly
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.tags ? (Array.isArray(editFormData.tags) ? editFormData.tags.join(', ') : editFormData.tags) : contact.tags.join(', ')}
                    onChange={(e) => onFieldChange('tags', e.target.value)}
                    className={inputClass}
                    placeholder="Enter comma-separated tags (e.g. Healthcare, Monitor, VIP)"
                  />
                ) : (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {contact.tags.length > 0 ? (
                      contact.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">No tags assigned</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ ADDRESSES SECTION ============ */}
        <div ref={el => { sectionRefs.current['addresses'] = el; }} id="section-addresses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Addresses</h2>
            <button
              onClick={() => setShowAddAddressModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
              Add Address
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              {localAddresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm">No addresses added</p>
                  {isEditing && (
                    <button
                      onClick={() => setShowAddAddressModal(true)}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      + Add an address
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {localAddresses.map((address) => (
                    <AddressCard
                      key={address.id}
                      address={address}
                      isEditing={isEditing}
                      onUpdate={(updates) => updateAddress(address.id, updates)}
                      onDelete={() => deleteAddress(address.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ COMPANY & JOBS SECTION ============ */}
        <div ref={el => { sectionRefs.current['company'] = el; }} id="section-company">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company & Jobs</h2>

          <ContactRelatedEntities
            contact={contact}
            onJobClick={onJobClick}
            onCompanyClick={onCompanyClick}
          />
        </div>

        {/* ============ TASKS SECTION ============ */}
        <div ref={el => { sectionRefs.current['tasks'] = el; }} id="section-tasks">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Tasks</h2>

          <ConnectedTasksSection
            key={`tasks-${tasksSectionKey}`}
            entityId={contact.id}
            entityType="CONTACT"
            title=""
            onAddClick={() => { openAddLinkModal('TASK'); }}
            onUnlinkSuccess={() => setTasksSectionKey(prev => prev + 1)}
          />
        </div>

        {/* ============ NOTES SECTION ============ */}
        <div ref={el => { sectionRefs.current['notes'] = el; }} id="section-notes">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Notes</h2>

          <ConnectedNotesSection
            key={`notes-${notesSectionKey}`}
            entityId={contact.id}
            entityType="CONTACT"
            title=""
            onAddClick={() => { openAddLinkModal('NOTE'); }}
            onUnlinkSuccess={() => setNotesSectionKey(prev => prev + 1)}
          />
        </div>
      </div>

      {/* Add Link Modal for Tasks/Notes */}
      <AddTaskNoteLinkModal
        isOpen={showAddLinkModal}
        entityId={contact.id}
        entityType="CONTACT"
        initialLinkType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      <AddAddressModal
        isOpen={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onSave={handleAddAddress}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          contactName={contact.name}
          isDeleting={isDeleting}
          onConfirm={() => onDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </main>
  );
}

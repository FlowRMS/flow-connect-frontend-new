/**
 * Company Detail View Component
 * Scroll-based navigation with sticky tabs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Company } from '../types';
import type { CompanySourceType, Contact as APIContact, Job as APIJob } from '../../lib/crm-graphql';
import CompanyRelatedEntities from './CompanyRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import { AddTaskNoteLinkModal } from '../modals/AddTaskNoteLinkModal';

type TabId = 'overview' | 'contacts' | 'jobs' | 'tasks' | 'notes';

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
  onFieldChange: (field: string, value: string | number | CompanySourceType) => void;
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

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'contacts': null,
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

    const tabIds: TabId[] = ['overview', 'contacts', 'jobs', 'tasks', 'notes'];

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
    { id: 'contacts' as TabId, label: 'Contacts' },
    { id: 'jobs' as TabId, label: 'Jobs' },
    { id: 'tasks' as TabId, label: 'Tasks' },
    { id: 'notes' as TabId, label: 'Notes' },
  ];

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const readOnlyClass = "w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-700 mb-2";

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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {company.name}
                  </h1>
                  <div className="relative group">
                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      Company details, contacts, jobs, and related entities
                    </div>
                  </div>
                  {/* Company Type */}
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
                Edit Company
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

          {/* Company Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-5">
                {/* Company Name */}
                <div className="col-span-2">
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editFormData.name || '' : company.name}
                    onChange={(e) => onFieldChange('name', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder={isEditing ? "Enter company name" : ""}
                  />
                </div>

                {/* Company Type */}
                <div>
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company Type
                  </label>
                  <CompanyTypeSelect
                    value={(isEditing ? editFormData.companySourceType : company.companySourceType) || 'CUSTOMER'}
                    onChange={(value) => onFieldChange('companySourceType', value)}
                    disabled={!isEditing}
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
                    type="text"
                    value={isEditing ? editFormData.phone || '' : (company.phone || '-')}
                    onChange={(e) => onFieldChange('phone', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder={isEditing ? "(555) 123-4567" : ""}
                  />
                </div>

                {/* Website */}
                <div className="col-span-2">
                  <label className={labelClass}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                    </svg>
                    Website
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editFormData.website || '' : (company.website || '-')}
                    onChange={(e) => onFieldChange('website', e.target.value)}
                    className={isEditing ? inputClass : readOnlyClass}
                    readOnly={!isEditing}
                    placeholder={isEditing ? "www.example.com" : ""}
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="mt-5">
                <label className={labelClass}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tags
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.tags ? (Array.isArray(editFormData.tags) ? editFormData.tags.join(', ') : editFormData.tags) : company.tags.join(', ')}
                    onChange={(e) => onFieldChange('tags', e.target.value)}
                    className={inputClass}
                    placeholder="Enter comma-separated tags (e.g. GC, Healthcare, Monitor)"
                  />
                ) : (
                  <div className="flex gap-2 flex-wrap items-center min-h-[44px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {company.tags.length > 0 ? (
                      company.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm shadow-sm"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No tags added</span>
                    )}
                  </div>
                )}
              </div>

              {/* Commission Rates Section - Only show for Manufacturers */}
              {((isEditing ? editFormData.companySourceType : company.companySourceType) === 'MANUFACTURER') && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Commission Rates
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    {/* Standard Commission Rate */}
                    <div>
                      <label className={labelClass}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Standard Commission Rate
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editFormData.standardCommissionRate != null
                              ? (Number(editFormData.standardCommissionRate) * 100).toFixed(1)
                              : (company.standardCommissionRate != null ? (company.standardCommissionRate * 100).toFixed(1) : '')}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                onFieldChange('standardCommissionRate', '');
                              } else {
                                onFieldChange('standardCommissionRate', (parseFloat(value) / 100));
                              }
                            }}
                            className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                            placeholder="e.g. 10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                        </div>
                      ) : (
                        <div className={readOnlyClass}>
                          {company.standardCommissionRate != null
                            ? `${(company.standardCommissionRate * 100).toFixed(1)}%`
                            : '-'}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Commission rate for direct/standard sales</p>
                    </div>

                    {/* Warehouse Commission Rate */}
                    <div>
                      <label className={labelClass}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        Warehouse Commission Rate
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={editFormData.warehouseCommissionRate != null
                              ? (Number(editFormData.warehouseCommissionRate) * 100).toFixed(1)
                              : (company.warehouseCommissionRate != null ? (company.warehouseCommissionRate * 100).toFixed(1) : '')}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                onFieldChange('warehouseCommissionRate', '');
                              } else {
                                onFieldChange('warehouseCommissionRate', (parseFloat(value) / 100));
                              }
                            }}
                            className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                            placeholder="e.g. 5"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                        </div>
                      ) : (
                        <div className={readOnlyClass}>
                          {company.warehouseCommissionRate != null
                            ? `${(company.warehouseCommissionRate * 100).toFixed(1)}%`
                            : '-'}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Commission rate for warehouse sales</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ CONTACTS SECTION ============ */}
        <div ref={el => { sectionRefs.current['contacts'] = el; }} id="section-contacts">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacts at {company.name}</h2>

          <CompanyRelatedEntities
            company={company}
            onContactClick={onContactClick}
            onJobClick={onJobClick}
          />
        </div>

        {/* ============ JOBS SECTION (hidden - already in contacts) ============ */}
        <div ref={el => { sectionRefs.current['jobs'] = el; }} id="section-jobs" className="sr-only">
          {/* Jobs are shown in the CompanyRelatedEntities component above */}
        </div>

        {/* ============ TASKS SECTION ============ */}
        <div ref={el => { sectionRefs.current['tasks'] = el; }} id="section-tasks">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Tasks</h2>

          <ConnectedTasksSection
            key={`tasks-${tasksSectionKey}`}
            entityId={company.id}
            entityType="COMPANY"
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
            entityId={company.id}
            entityType="COMPANY"
            title=""
            onAddClick={() => { openAddLinkModal('NOTE'); }}
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

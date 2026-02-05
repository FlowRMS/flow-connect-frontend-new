/**
 * Company Detail View Component
 * Scroll-based navigation with sticky tabs
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Company, ManufacturerInfo, SalesRepAssignment, CompanyHierarchyRole, ChildCompanyRef } from '../types';
import type { RelatedEntityContact, RelatedEntityJob } from '../../lib/crm-graphql';
import { ConnectedEntitiesSection } from '../../shared/ConnectedEntitiesSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import {
  GoogleMapsAddressModal,
  type Address,
} from '../../shared/google-maps-address';
import {
  useAddressesBySource,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '../../hooks/useAddressApi';
import { toast } from 'sonner';
import AliasesModal, { CompanyAlias } from '../../AliasesModal';
import { SelectChildCompaniesModal } from '../modals/SelectChildCompaniesModal';
import { useCompanySearch } from '../../notes/api';
import { useCompanyTypes, type CompanyType } from '../../hooks/useCRMApi';
import { ManageCompanyTypesModal } from '../modals/ManageCompanyTypesModal';

type TabId = 'overview' | 'factory-info' | 'sales-reps' | 'addresses' | 'emails' | 'meetings' | 'connected-entities';

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
  hasLocalEdits: boolean;
  onBack: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onFieldChange: (field: string, value: string | number | boolean | string[] | ManufacturerInfo | SalesRepAssignment[] | CompanyHierarchyRole | ChildCompanyRef[]) => void;
  onContactClick?: (contact: RelatedEntityContact) => void;
  onJobClick?: (job: RelatedEntityJob) => void;
}


// Company Type Single-Select Dropdown using dynamic types from API
function CompanyTypeSelect({
  value,
  onChange,
  disabled,
  companyTypes,
  isLoading,
  companyTypeName,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  disabled: boolean;
  companyTypes: CompanyType[];
  isLoading: boolean;
  companyTypeName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = companyTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected type name - use companyTypeName as fallback if not found in array
  const selectedType = companyTypes.find(t => t.id === value);
  const selectedLabel = selectedType?.name || companyTypeName || 'Select Company Type';

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
        {isLoading ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading types...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">No matching types found</div>
        ) : (
          filteredOptions.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                onChange(type.id);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2.5 text-left text-sm flex items-center gap-2.5
                transition-colors hover:bg-gray-50
                ${value === type.id ? 'bg-blue-50' : ''}
              `}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
              <span className={`flex-1 ${value === type.id ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                {type.name}
              </span>
              {value === type.id && (
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

// Parent Company Search Select Component
interface ParentCompanySelectProps {
  value: string;
  selectedName: string;
  onChange: (id: string, name: string) => void;
  onClear: () => void;
  excludeId?: string;
  disabled?: boolean;
}

function ParentCompanySelect({ value, selectedName, onChange, onClear, excludeId, disabled }: ParentCompanySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading } = useCompanySearch(searchQuery);

  // Filter out current company from parent options
  const filteredResults = searchResults.filter(c => c.id !== excludeId);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 280;

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
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center gap-2">
        {value ? (
          <>
            <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-gray-900">{selectedName}</span>
          </>
        ) : (
          <span className="text-gray-400">No parent company</span>
        )}
      </div>
    );
  }

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            onClear();
            setIsOpen(false);
            setSearchQuery('');
          }}
          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors text-gray-500 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          None (No parent company)
        </button>

        {isLoading ? (
          <div className="px-4 py-6 text-center">
            <svg className="animate-spin h-5 w-5 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <span className="text-sm text-gray-500">Searching...</span>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            {searchQuery ? 'No companies found' : 'Type to search for companies'}
          </div>
        ) : (
          filteredResults.map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => {
                onChange(company.id, company.name);
                setIsOpen(false);
                setSearchQuery('');
              }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                value === company.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold bg-emerald-500">
                  {company.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className={`font-medium ${value === company.id ? 'text-blue-600' : 'text-gray-900'}`}>
                    {company.name}
                  </div>
                  {company.companyType?.name && (
                    <div className="text-xs text-gray-500">
                      {company.companyType.name}
                    </div>
                  )}
                </div>
              </div>
              {value === company.id && (
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer
          flex items-center justify-between gap-2 transition-all
          hover:border-blue-300 hover:shadow-sm
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {value ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-gray-900 truncate">{selectedName}</span>
            </div>
          ) : (
            <span className="text-gray-400">Select parent company (optional)</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
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
  hasLocalEdits,
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
  // Fetch company types from API
  const { data: companyTypesData, isLoading: isLoadingCompanyTypes } = useCompanyTypes();
  const companyTypes: CompanyType[] = companyTypesData ?? [];

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Address API hooks
  const { data: addresses = [], isLoading: addressesLoading } = useAddressesBySource(company.id, 'COMPANY');
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAliasesModal, setShowAliasesModal] = useState(false);
  const [showChildCompaniesModal, setShowChildCompaniesModal] = useState(false);
  const [showCompanyTypesModal, setShowCompanyTypesModal] = useState(false);
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

  // Get current company type - check if it's a Manufacturer by looking at the type name
  const currentCompanyTypeId = isEditing ? (editFormData.companyTypeId || company.companyTypeId) : company.companyTypeId;
  const currentCompanyTypeName = companyTypes.find(t => t.id === currentCompanyTypeId)?.name || company.companyTypeName;
  const isManufacturer = currentCompanyTypeName?.toLowerCase() === 'manufacturer';

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'factory-info': null,
    'sales-reps': null,
    'addresses': null,
    'emails': null,
    'meetings': null,
    'connected-entities': null,
  });

  // Reference to the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Flag to disable scroll spy during programmatic scrolling
  const isScrollingRef = useRef(false);

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      // Disable scroll spy during programmatic scroll
      isScrollingRef.current = true;
      setActiveTab(tabId);

      // Calculate the section's position relative to the scroll container
      const containerRect = container.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const headerOffset = 20;

      // Calculate the target scroll position
      const sectionTop = sectionRect.top - containerRect.top + scrollTop - headerOffset;

      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });

      // Re-enable scroll spy after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
  }, []);

  // Scroll spy - update active tab based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = isManufacturer
      ? ['overview', 'factory-info', 'sales-reps', 'addresses', 'emails', 'meetings', 'connected-entities']
      : ['overview', 'sales-reps', 'addresses', 'emails', 'meetings', 'connected-entities'];

    const handleScroll = () => {
      // Skip scroll spy updates during programmatic scrolling
      if (isScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      let currentSection: TabId = 'overview';

      for (const tabId of tabIds) {
        const section = sectionRefs.current[tabId];
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          // Check if section top is at or above the container top + offset
          if (sectionRect.top <= containerRect.top + 100) {
            currentSection = tabId;
          }
        }
      }

      setActiveTab(currentSection);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isManufacturer]);

  // Get manufacturer info
  const manufacturerInfo = isEditing
    ? (editFormData.manufacturerInfo || company.manufacturerInfo || {})
    : (company.manufacturerInfo || {});

  // Address handlers - API backed
  const handleAddressSave = async (addressData: Omit<Address, 'id' | 'createdAt'>) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          input: {
            sourceId: company.id,
            sourceType: 'COMPANY',
            addressTypes: addressData.addressTypes || [addressData.addressType],
            line1: addressData.line1,
            line2: addressData.line2,
            city: addressData.city,
            state: addressData.state,
            zipCode: addressData.zipCode,
            country: addressData.country,
            notes: addressData.notes,
            isPrimary: addressData.isPrimary,
          },
        });
        toast.success('Address updated successfully');
        setEditingAddress(null);
      } else {
        // Create new address
        await createAddressMutation.mutateAsync({
          sourceId: company.id,
          sourceType: 'COMPANY',
          addressTypes: addressData.addressTypes || [addressData.addressType],
          line1: addressData.line1,
          line2: addressData.line2,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country,
          notes: addressData.notes,
          isPrimary: addressData.isPrimary,
        });
        toast.success('Address added successfully');
      }
    } catch (err) {
      toast.error(editingAddress ? 'Failed to update address' : 'Failed to add address');
      throw err;
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleAddressModalClose = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
  };

  const handleAddressDelete = async (address: Address) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      await deleteAddressMutation.mutateAsync({
        id: address.id,
        sourceId: company.id,
        sourceType: 'COMPANY',
      });
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
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
    { id: 'emails', label: 'Emails' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'connected-entities', label: 'Connected Entities' },
  ];

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const readOnlyClass = "w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const textareaClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 resize-y min-h-[80px]";
  const selectClass = "w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer";

  const getTypeColor = (typeName: string | undefined) => {
    return typeName?.toLowerCase() === 'manufacturer'
      ? { bg: 'bg-purple-100', text: 'text-purple-700' }
      : { bg: 'bg-green-100', text: 'text-green-700' };
  };

  const typeColors = getTypeColor(company.companyTypeName);

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
                    {company.companyTypeName || 'Unknown Type'}
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
              disabled={updatePending || !hasLocalEdits}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-gray-700">Company Type</label>
                      <button
                        type="button"
                        onClick={() => setShowCompanyTypesModal(true)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage Types
                      </button>
                    </div>
                    <CompanyTypeSelect
                      value={isEditing ? (editFormData.companyTypeId ?? company.companyTypeId) : company.companyTypeId}
                      companyTypeName={isEditing ? (editFormData.companyTypeName ?? company.companyTypeName) : company.companyTypeName}
                      onChange={(value) => {
                        const selectedType = companyTypes.find(t => t.id === value);
                        onFieldChange('companyTypeId', value);
                        if (selectedType) {
                          onFieldChange('companyTypeName', selectedType.name);
                        }
                      }}
                      disabled={!isEditing}
                      companyTypes={companyTypes}
                      isLoading={isLoadingCompanyTypes}
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
                          <ParentCompanySelect
                            value={isEditing ? (editFormData.parentCompanyId ?? company.parentCompanyId ?? '') : (company.parentCompanyId ?? '')}
                            selectedName={isEditing ? (editFormData.parentCompanyName ?? company.parentCompanyName ?? '') : (company.parentCompanyName ?? '')}
                            onChange={(id, name) => {
                              onFieldChange('parentCompanyId', id);
                              onFieldChange('parentCompanyName', name);
                            }}
                            onClear={() => {
                              onFieldChange('parentCompanyId', '');
                              onFieldChange('parentCompanyName', '');
                            }}
                            excludeId={company.id}
                            disabled={!isEditing}
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-gray-700">Company Type</label>
                        <button
                          type="button"
                          onClick={() => setShowCompanyTypesModal(true)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Manage Types
                        </button>
                      </div>
                      <CompanyTypeSelect
                        value={isEditing ? (editFormData.companyTypeId ?? company.companyTypeId) : company.companyTypeId}
                        onChange={(value) => onFieldChange('companyTypeId', value)}
                        disabled={!isEditing}
                        companyTypes={companyTypes}
                        isLoading={isLoadingCompanyTypes}
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
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] relative overflow-hidden opacity-60">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-500">Coming Soon</span>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Sales Reps</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  {salesReps.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg opacity-50 cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Inside Rep
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg opacity-50 cursor-not-allowed"
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Addresses
            </h2>
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Address
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Add billing, shipping, or mailing addresses for this company using Google Maps search.
                </p>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add First Address
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="relative flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    {/* Address Type Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      address.addressType === 'BILLING' ? 'bg-blue-100' :
                      address.addressType === 'SHIPPING' ? 'bg-green-100' :
                      address.addressType === 'MAILING' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {address.addressType === 'BILLING' && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      )}
                      {address.addressType === 'SHIPPING' && (
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12l-4 9H8l-4-9h4m0 0V4m0 3v10m4-10v10m-4 0h4" />
                        </svg>
                      )}
                      {address.addressType === 'MAILING' && (
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {address.addressType === 'OTHER' && (
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>

                    {/* Address Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          address.addressType === 'BILLING' ? 'bg-blue-100 text-blue-700' :
                          address.addressType === 'SHIPPING' ? 'bg-green-100 text-green-700' :
                          address.addressType === 'MAILING' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {address.addressType.charAt(0) + address.addressType.slice(1).toLowerCase()}
                        </span>
                        {address.isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{address.line1}</p>
                      {address.line2 && <p className="text-sm text-gray-600">{address.line2}</p>}
                      <p className="text-sm text-gray-600">
                        {[address.city, address.state, address.zipCode].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-sm text-gray-500">{address.country}</p>
                      {address.notes && (
                        <p className="text-xs text-gray-400 mt-1 italic">{address.notes}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit address"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleAddressDelete(address)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete address"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============ EMAILS SECTION ============ */}
        <div ref={el => { sectionRefs.current['emails'] = el; }} id="section-emails">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] relative overflow-hidden opacity-60">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-500">Coming Soon</span>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Emails</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg opacity-50 cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Email
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg opacity-50 cursor-not-allowed"
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
              </div>
            </div>
          </div>
        </div>

        {/* ============ MEETINGS SECTION ============ */}
        <div ref={el => { sectionRefs.current['meetings'] = el; }} id="section-meetings">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] relative overflow-hidden opacity-60">
            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-500">Coming Soon</span>
              </div>
            </div>
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Meetings</h2>
                <span className="px-2 py-0.5 text-xs font-medium bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                  0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-[var(--border)] text-[var(--foreground)] rounded-lg opacity-50 cursor-not-allowed"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.172 9.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Link Meeting
                </button>
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg opacity-50 cursor-not-allowed"
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
              </div>
            </div>
          </div>
        </div>

        {/* ============ CONNECTED ENTITIES SECTION ============ */}
        <div ref={el => { sectionRefs.current['connected-entities'] = el; }} id="section-connected-entities">
          <ConnectedEntitiesSection
            entityId={company.id}
            sourceEntityType="COMPANY"
            title="Connected Entities"
            enabledCategories={['contacts', 'customers', 'jobs', 'pre-opportunities', 'tasks', 'notes', 'quotes', 'orders', 'invoices', 'checks', 'files']}
            onContactClick={onContactClick}
            onJobClick={onJobClick}
          />
        </div>

      </div>

      {/* Google Maps Address Modal */}
      <GoogleMapsAddressModal
        isOpen={isAddressModalOpen}
        onClose={handleAddressModalClose}
        onSave={handleAddressSave}
        sourceId={company.id}
        sourceType="COMPANY"
        defaultAddressType={editingAddress?.addressType || "BILLING"}
        initialAddress={editingAddress || undefined}
        mode={editingAddress ? 'edit' : 'create'}
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

      {/* Manage Company Types Modal */}
      <ManageCompanyTypesModal
        isOpen={showCompanyTypesModal}
        onClose={() => setShowCompanyTypesModal(false)}
      />
    </main>
  );
}

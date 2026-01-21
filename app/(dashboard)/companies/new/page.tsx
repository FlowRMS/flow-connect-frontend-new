'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useCreateCRMCompany, useCompanyTypes, type CompanyType } from '../../../../components/hooks/useCRMApi';
import { useCompanySearch } from '../../../../components/notes/api';

// ============================================================================
// Types
// ============================================================================

type TabId = 'overview' | 'contact-info' | 'settings';

// ============================================================================
// Helper Components
// ============================================================================

// Portaled Custom Select Component
interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
  disabled?: boolean;
}

function CustomSelect({ value, onChange, options, placeholder, disabled }: CustomSelectProps) {
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
      const dropdownHeight = Math.min(options.length * 50 + 16, 250);

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
  }, [isOpen, options.length]);

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

  const getTypeColor = (label: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      'Customer': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      'Manufacturer': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    };
    return colors[label] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
  };

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
      <div className="py-1">
        {options.map((option) => {
          const colors = getTypeColor(option.label);
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
                {option.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                )}
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300 hover:shadow-sm cursor-pointer'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${getTypeColor(selectedOption.label).dot}`} />
              <span className="text-gray-900 truncate">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder || 'Select...'}</span>
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
      </button>
      {dropdownContent}
    </div>
  );
}

// Company Type Select (uses dynamic company types from API)
interface CompanyTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  companyTypes: CompanyType[];
  isLoading?: boolean;
}

function CompanyTypeSelect({ value, onChange, companyTypes, isLoading }: CompanyTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = companyTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 320;

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

  const selectedType = companyTypes.find(t => t.id === value);
  const selectedLabel = selectedType?.name || 'Select Company Type';

  const dropdownContent = isOpen && portalTarget && createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, width: position.width }}
    >
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
        disabled={isLoading}
        className={`
          w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white text-left
          flex items-center justify-between gap-2 transition-all
          hover:border-blue-300 hover:shadow-sm cursor-pointer
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
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

// Parent Company Search Select
interface ParentCompanySelectProps {
  value: string;
  selectedName: string;
  onChange: (id: string, name: string) => void;
  onClear: () => void;
}

function ParentCompanySelect({ value, selectedName, onChange, onClear }: ParentCompanySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults = [], isLoading } = useCompanySearch(searchQuery);

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
        ) : searchResults.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            {searchQuery ? 'No companies found' : 'Type to search for companies'}
          </div>
        ) : (
          searchResults.map((company) => (
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
          w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer
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

// ============================================================================
// Main Component
// ============================================================================

export default function CreateCompanyPage() {
  const router = useRouter();
  const createCompanyMutation = useCreateCRMCompany();

  // Fetch company types from API
  const { data: companyTypesData, isLoading: isLoadingCompanyTypes } = useCompanyTypes();
  const companyTypes: CompanyType[] = companyTypesData ?? [];

  // Form state
  const [name, setName] = useState('');
  const [companyTypeId, setCompanyTypeId] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [tags, setTags] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [parentCompanyName, setParentCompanyName] = useState('');
  const [standardCommissionRate, setStandardCommissionRate] = useState('');
  const [warehouseCommissionRate, setWarehouseCommissionRate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Section refs for scroll-to functionality
  const sectionRefs = useRef<Record<TabId, HTMLDivElement | null>>({
    'overview': null,
    'contact-info': null,
    'settings': null,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll spy effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const tabIds: TabId[] = ['overview', 'contact-info', 'settings'];

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

  const scrollToSection = useCallback((tabId: TabId) => {
    const section = sectionRefs.current[tabId];
    const container = scrollContainerRef.current;
    if (section && container) {
      const headerOffset = 20;
      const sectionTop = section.offsetTop - headerOffset;
      container.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
    setActiveTab(tabId);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (standardCommissionRate && (isNaN(Number(standardCommissionRate)) || Number(standardCommissionRate) < 0 || Number(standardCommissionRate) > 100)) {
      newErrors.standardCommissionRate = 'Must be between 0 and 100';
    }

    if (warehouseCommissionRate && (isNaN(Number(warehouseCommissionRate)) || Number(warehouseCommissionRate) < 0 || Number(warehouseCommissionRate) > 100)) {
      newErrors.warehouseCommissionRate = 'Must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!companyTypeId) {
      toast.error('Please select a company type');
      return;
    }

    try {
      const newCompany = await createCompanyMutation.mutateAsync({
        name: name.trim(),
        companyTypeId: companyTypeId,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        tags: tags.trim() || undefined,
        parentCompanyId: parentCompanyId || undefined,
        standardCommissionRate: standardCommissionRate ? Number(standardCommissionRate) : undefined,
        warehouseCommissionRate: warehouseCommissionRate ? Number(warehouseCommissionRate) : undefined,
      });

      toast.success('Company created successfully');
      router.push(`/companies?id=${newCompany.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create company');
      console.error('Create error:', err);
    }
  };

  const tabs = [
    { id: 'overview' as TabId, label: 'Overview' },
    { id: 'contact-info' as TabId, label: 'Contact Info' },
    { id: 'settings' as TabId, label: 'Settings' },
  ];

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <main className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/companies')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {name || 'New Company'}
                </h1>
                <p className="text-sm text-gray-500">
                  Create a new customer company
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              Unsaved
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Customer
            </span>

            <button
              onClick={() => router.push('/companies')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createCompanyMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {createCompanyMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Company
                </>
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* ============ OVERVIEW SECTION ============ */}
        <div ref={el => { sectionRefs.current['overview'] = el; }} id="section-overview">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Company Type Selection */}
            <div>
              <label className={labelClass}>
                Company Type <span className="text-red-500">*</span>
              </label>
              <CompanyTypeSelect
                value={companyTypeId}
                onChange={(v) => setCompanyTypeId(v)}
                companyTypes={companyTypes}
                isLoading={isLoadingCompanyTypes}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Select the type that best describes this company.
              </p>
            </div>

            {/* Company Name */}
            <div>
              <label className={labelClass}>
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                className={`${inputClass} ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter company name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Parent Company */}
            <div>
              <label className={labelClass}>Parent Company</label>
              <ParentCompanySelect
                value={parentCompanyId}
                selectedName={parentCompanyName}
                onChange={(id, companyName) => {
                  setParentCompanyId(id);
                  setParentCompanyName(companyName);
                }}
                onClear={() => {
                  setParentCompanyId('');
                  setParentCompanyName('');
                }}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Optionally link this company to a parent company for hierarchical organization.
              </p>
            </div>
          </div>
        </div>

        {/* ============ CONTACT INFO SECTION ============ */}
        <div ref={el => { sectionRefs.current['contact-info'] = el; }} id="section-contact-info">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Contact Information
          </h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Phone */}
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label className={labelClass}>Website</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={`${inputClass} pl-10`}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className={labelClass}>Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className={inputClass}
                placeholder="Enter tags (comma separated)"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Add tags to help organize and find this company later.
              </p>
            </div>
          </div>
        </div>

        {/* ============ SETTINGS SECTION ============ */}
        <div ref={el => { sectionRefs.current['settings'] = el; }} id="section-settings">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-900 font-medium">Company Settings</p>
                <p className="text-sm text-gray-600 mt-1">
                  Additional settings such as addresses, contacts, and related entities
                  will be available after the company is created.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Required Fields Note */}
        <div className="flex items-center justify-center pt-4 pb-8">
          <div className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </div>
        </div>
      </div>
    </main>
  );
}

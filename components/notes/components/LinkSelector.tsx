/**
 * Link Selector Component
 * Allows selecting entities (Jobs, Companies, Tasks, Contacts) to link to a note
 * Uses Portal to render dropdown outside of overflow-hidden containers
 * Uses lazy loading - only fetches data when dropdown is opened
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  useJobSearch, 
  useCompanySearch, 
  useContactSearch, 
  useTaskSearch,
  usePreOpportunitySearch,
  type EntityType,
  type JobSearchResult,
  type CompanySearchResult,
  type ContactSearchResult,
  type TaskSearchResult,
  type PreOpportunitySearchResult,
} from '../api';

export interface SelectedLink {
  id: string;
  type: EntityType;
  name: string;
}

interface LinkSelectorProps {
  selectedLinks: SelectedLink[];
  onLinksChange: (links: SelectedLink[]) => void;
  disabled?: boolean;
  className?: string;
}

type TabType = 'JOB' | 'COMPANY' | 'CONTACT' | 'TASK' | 'PRE_OPPORTUNITY';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'JOB',
    label: 'Jobs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'COMPANY',
    label: 'Companies',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'CONTACT',
    label: 'Contacts',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'TASK',
    label: 'Tasks',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'PRE_OPPORTUNITY',
    label: 'Pre-Opps',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function LinkSelector({
  selectedLinks,
  onLinksChange,
  disabled = false,
  className = '',
}: LinkSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('JOB');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const [isMounted, setIsMounted] = useState(false);
  // Track if we've ever opened the dropdown to trigger data loading
  const [hasOpened, setHasOpened] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dropdown height estimate for positioning
  const DROPDOWN_HEIGHT = 320; // max-h-80 = 320px

  // Lazy load entities - only fetch when dropdown has been opened at least once
  const { data: jobs = [], isLoading: isLoadingJobs } = useJobSearch(searchQuery, hasOpened);
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanySearch(searchQuery, hasOpened);
  const { data: contacts = [], isLoading: isLoadingContacts } = useContactSearch(searchQuery, hasOpened);
  const { data: tasks = [], isLoading: isLoadingTasks } = useTaskSearch(searchQuery, hasOpened);
  const { data: preOpportunities = [], isLoading: isLoadingPreOpportunities } = usePreOpportunitySearch(searchQuery, hasOpened);

  // Mark as mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track when dropdown opens to trigger lazy loading
  useEffect(() => {
    if (showDropdown && !hasOpened) {
      setHasOpened(true);
    }
  }, [showDropdown, hasOpened]);

  // Update dropdown position - check if it would go off screen
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Open upward if not enough space below and more space above
      const openUpward = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;
      
      setDropdownPosition({
        top: openUpward ? rect.top - DROPDOWN_HEIGHT - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        openUpward,
      });
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get filtered entities based on active tab and search
  const getFilteredEntities = (): { id: string; name: string; subtitle?: string }[] => {
    const query = searchQuery.toLowerCase();
    const alreadySelectedIds = new Set(selectedLinks.filter(l => l.type === activeTab).map(l => l.id));

    switch (activeTab) {
      case 'JOB':
        return (jobs as JobSearchResult[])
          .filter((job: JobSearchResult) => {
            const name = job.jobName?.toLowerCase() || '';
            return name.includes(query) && !alreadySelectedIds.has(job.id);
          })
          .slice(0, 10)
          .map((job: JobSearchResult) => ({
            id: job.id,
            name: job.jobName || 'Unnamed Job',
            subtitle: job.jobType || undefined,
          }));

      case 'COMPANY':
        return (companies as CompanySearchResult[])
          .filter((company: CompanySearchResult) => {
            const name = company.name?.toLowerCase() || '';
            return name.includes(query) && !alreadySelectedIds.has(company.id);
          })
          .slice(0, 10)
          .map((company: CompanySearchResult) => ({
            id: company.id,
            name: company.name || 'Unnamed Company',
          }));

      case 'CONTACT':
        return (contacts as ContactSearchResult[])
          .filter((contact: ContactSearchResult) => {
            const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
            return fullName.includes(query) && !alreadySelectedIds.has(contact.id);
          })
          .slice(0, 10)
          .map((contact: ContactSearchResult) => ({
            id: contact.id,
            name: `${contact.firstName} ${contact.lastName}`,
            subtitle: contact.email || undefined,
          }));

      case 'TASK':
        return (tasks as TaskSearchResult[])
          .filter((task: TaskSearchResult) => {
            const title = task.title?.toLowerCase() || '';
            return title.includes(query) && !alreadySelectedIds.has(task.id);
          })
          .slice(0, 10)
          .map((task: TaskSearchResult) => ({
            id: task.id,
            name: task.title || 'Unnamed Task',
            subtitle: task.status,
          }));

      case 'PRE_OPPORTUNITY':
        return (preOpportunities as PreOpportunitySearchResult[])
          .filter((preOpp: PreOpportunitySearchResult) => {
            const entityNumber = preOpp.entityNumber?.toLowerCase() || '';
            return entityNumber.includes(query) && !alreadySelectedIds.has(preOpp.id);
          })
          .slice(0, 10)
          .map((preOpp: PreOpportunitySearchResult) => ({
            id: preOpp.id,
            name: preOpp.entityNumber || 'Unknown Pre-Opportunity',
            subtitle: preOpp.status || undefined,
          }));

      default:
        return [];
    }
  };

  const handleSelectEntity = (entity: { id: string; name: string }) => {
    const newLink: SelectedLink = {
      id: entity.id,
      type: activeTab,
      name: entity.name,
    };

    if (!selectedLinks.some(l => l.id === entity.id && l.type === activeTab)) {
      onLinksChange([...selectedLinks, newLink]);
    }

    setSearchQuery('');
  };

  const handleRemoveLink = (linkToRemove: SelectedLink) => {
    onLinksChange(selectedLinks.filter(l => !(l.id === linkToRemove.id && l.type === linkToRemove.type)));
  };

  const getTypeIcon = (type: EntityType) => {
    const tab = TABS.find(t => t.id === type);
    return tab?.icon || null;
  };

  const getTypeColor = (type: EntityType) => {
    switch (type) {
      case 'JOB':
        return 'bg-blue-100 text-blue-700';
      case 'COMPANY':
        return 'bg-purple-100 text-purple-700';
      case 'CONTACT':
        return 'bg-green-100 text-green-700';
      case 'TASK':
        return 'bg-orange-100 text-orange-700';
      case 'PRE_OPPORTUNITY':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredEntities = getFilteredEntities();

  // Check if the current tab is loading
  const isCurrentTabLoading = (): boolean => {
    switch (activeTab) {
      case 'JOB': return isLoadingJobs;
      case 'COMPANY': return isLoadingCompanies;
      case 'CONTACT': return isLoadingContacts;
      case 'TASK': return isLoadingTasks;
      case 'PRE_OPPORTUNITY': return isLoadingPreOpportunities;
      default: return false;
    }
  };

  // Dropdown content - rendered via portal
  const dropdownContent = showDropdown && !disabled && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.openUpward ? 'auto' : dropdownPosition.top,
        bottom: dropdownPosition.openUpward ? window.innerHeight - dropdownPosition.top - DROPDOWN_HEIGHT : 'auto',
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        maxHeight: DROPDOWN_HEIGHT,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto">
        {isCurrentTabLoading() ? (
          <div className="px-4 py-8 text-center">
            <svg className="animate-spin w-6 h-6 text-blue-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <p className="text-sm text-gray-500">Loading {activeTab.toLowerCase()}s...</p>
          </div>
        ) : filteredEntities.length > 0 ? (
          filteredEntities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => handleSelectEntity(entity)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(activeTab)}`}>
                {getTypeIcon(activeTab)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{entity.name}</p>
                {entity.subtitle && (
                  <p className="text-xs text-gray-500 truncate">{entity.subtitle}</p>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-gray-500">
              {searchQuery ? `No ${activeTab.toLowerCase()}s found` : `No ${activeTab.toLowerCase()}s available`}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Selected Links */}
      {selectedLinks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedLinks.map((link) => (
            <span
              key={`${link.type}-${link.id}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${getTypeColor(link.type)}`}
            >
              {getTypeIcon(link.type)}
              <span className="font-medium max-w-[150px] truncate">{link.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveLink(link)}
                  className="p-0.5 hover:bg-white/30 rounded-full transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {!disabled && (
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={selectedLinks.length > 0 ? 'Add more links...' : 'Search to link jobs, companies, contacts, tasks, or pre-opportunities...'}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
        />
      )}

      {/* Dropdown Portal */}
      {isMounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}

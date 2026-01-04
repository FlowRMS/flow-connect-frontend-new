'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useCompanySearch,
  useContactSearch,
  usePreOpportunitySearch,
  useQuoteSearch,
  useOrderSearch,
  useInvoiceSearch,
  useJobSearch,
  useTaskSearch,
  useCheckSearch,
  useFactorySearch,
  useCustomerSearch,
  useProductSearch,
} from '../../notes/api/useNotesApi';
import { searchNotes, type NoteSearchResult } from '../../lib/api/search';
import { linkFileToEntity, type FileEntityType } from '../../lib/graphql/files';
import { showSuccessToast, showErrorToast } from '../../lib/toast';

// All entity types that files can be linked to (matching FileEntityType)
type LinkableEntityType =
  | 'JOB'
  | 'TASK'
  | 'COMPANY'
  | 'CONTACT'
  | 'NOTE'
  | 'PRE_OPPORTUNITY'
  | 'QUOTE'
  | 'ORDER'
  | 'INVOICE'
  | 'CHECK'
  | 'FACTORY'
  | 'CUSTOMER'
  | 'PRODUCT';

const ENTITY_CONFIG: Record<LinkableEntityType, { label: string; plural: string; color: string; icon: React.ReactNode }> = {
  JOB: {
    label: 'Job',
    plural: 'Jobs',
    color: 'bg-indigo-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  TASK: {
    label: 'Task',
    plural: 'Tasks',
    color: 'bg-rose-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  COMPANY: {
    label: 'Company',
    plural: 'Companies',
    color: 'bg-purple-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  CONTACT: {
    label: 'Contact',
    plural: 'Contacts',
    color: 'bg-green-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  NOTE: {
    label: 'Note',
    plural: 'Notes',
    color: 'bg-yellow-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  PRE_OPPORTUNITY: {
    label: 'Pre-Opportunity',
    plural: 'Pre-Opportunities',
    color: 'bg-amber-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  QUOTE: {
    label: 'Quote',
    plural: 'Quotes',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  ORDER: {
    label: 'Order',
    plural: 'Orders',
    color: 'bg-teal-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  INVOICE: {
    label: 'Invoice',
    plural: 'Invoices',
    color: 'bg-emerald-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  CHECK: {
    label: 'Check',
    plural: 'Checks',
    color: 'bg-cyan-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  FACTORY: {
    label: 'Factory',
    plural: 'Factories',
    color: 'bg-slate-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  CUSTOMER: {
    label: 'Customer',
    plural: 'Customers',
    color: 'bg-pink-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  PRODUCT: {
    label: 'Product',
    plural: 'Products',
    color: 'bg-orange-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
};

// Entity types order
const ALL_ENTITY_TYPES: LinkableEntityType[] = [
  'JOB', 'COMPANY', 'CONTACT', 'PRE_OPPORTUNITY', 'QUOTE', 'ORDER', 'INVOICE',
  'TASK', 'NOTE', 'CHECK', 'FACTORY', 'CUSTOMER', 'PRODUCT'
];

interface LinkFileToEntityModalProps {
  isOpen: boolean;
  fileId: string;
  fileName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkFileToEntityModal({
  isOpen,
  fileId,
  fileName,
  onClose,
  onSuccess,
}: LinkFileToEntityModalProps) {
  const [entityType, setEntityType] = useState<LinkableEntityType>('JOB');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Search hooks for all entity types
  const { data: jobs = [], isLoading: jobsLoading } = useJobSearch(searchTerm, isOpen && entityType === 'JOB');
  const { data: companies = [], isLoading: companiesLoading } = useCompanySearch(searchTerm, isOpen && entityType === 'COMPANY');
  const { data: contacts = [], isLoading: contactsLoading } = useContactSearch(searchTerm, isOpen && entityType === 'CONTACT');
  const { data: preOpportunities = [], isLoading: preOpportunitiesLoading } = usePreOpportunitySearch(searchTerm, isOpen && entityType === 'PRE_OPPORTUNITY');
  const { data: quotes = [], isLoading: quotesLoading } = useQuoteSearch(searchTerm, isOpen && entityType === 'QUOTE');
  const { data: orders = [], isLoading: ordersLoading } = useOrderSearch(searchTerm, isOpen && entityType === 'ORDER');
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoiceSearch(searchTerm, isOpen && entityType === 'INVOICE');
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(searchTerm, isOpen && entityType === 'TASK');
  const { data: checks = [], isLoading: checksLoading } = useCheckSearch(searchTerm, isOpen && entityType === 'CHECK');
  const { data: factories = [], isLoading: factoriesLoading } = useFactorySearch(searchTerm, isOpen && entityType === 'FACTORY');
  const { data: customers = [], isLoading: customersLoading } = useCustomerSearch(searchTerm, isOpen && entityType === 'CUSTOMER');
  const { data: products = [], isLoading: productsLoading } = useProductSearch(searchTerm, isOpen && entityType === 'PRODUCT');

  // Note search using direct query
  const { data: notes = [], isLoading: notesLoading } = useQuery<NoteSearchResult[], Error>({
    queryKey: ['search', 'notes', searchTerm],
    queryFn: () => searchNotes(searchTerm),
    enabled: isOpen && entityType === 'NOTE',
    staleTime: 60 * 1000,
  });

  const config = ENTITY_CONFIG[entityType];

  const { entities, isLoading } = useMemo(() => {
    switch (entityType) {
      case 'JOB':
        return { entities: jobs, isLoading: jobsLoading };
      case 'COMPANY':
        return { entities: companies, isLoading: companiesLoading };
      case 'CONTACT':
        return { entities: contacts, isLoading: contactsLoading };
      case 'PRE_OPPORTUNITY':
        return { entities: preOpportunities, isLoading: preOpportunitiesLoading };
      case 'QUOTE':
        return { entities: quotes, isLoading: quotesLoading };
      case 'ORDER':
        return { entities: orders, isLoading: ordersLoading };
      case 'INVOICE':
        return { entities: invoices, isLoading: invoicesLoading };
      case 'TASK':
        return { entities: tasks, isLoading: tasksLoading };
      case 'NOTE':
        return { entities: notes, isLoading: notesLoading };
      case 'CHECK':
        return { entities: checks, isLoading: checksLoading };
      case 'FACTORY':
        return { entities: factories, isLoading: factoriesLoading };
      case 'CUSTOMER':
        return { entities: customers, isLoading: customersLoading };
      case 'PRODUCT':
        return { entities: products, isLoading: productsLoading };
      default:
        return { entities: [], isLoading: false };
    }
  }, [entityType, jobs, jobsLoading, companies, companiesLoading, contacts, contactsLoading,
      preOpportunities, preOpportunitiesLoading, quotes, quotesLoading, orders, ordersLoading,
      invoices, invoicesLoading, tasks, tasksLoading, notes, notesLoading, checks, checksLoading,
      factories, factoriesLoading, customers, customersLoading, products, productsLoading]);

  const getEntityDisplay = (entity: Record<string, unknown>): { name: string; subtitle: string } => {
    switch (entityType) {
      case 'JOB':
        return { name: (entity.jobName as string) || (entity.id as string), subtitle: (entity.jobType as string) || '' };
      case 'COMPANY':
        return { name: entity.name as string, subtitle: (entity.companySourceType as string) || '' };
      case 'CONTACT':
        return { name: `${entity.firstName} ${entity.lastName}`, subtitle: (entity.email as string) || '' };
      case 'PRE_OPPORTUNITY':
        return { name: (entity.entityNumber as string) || (entity.id as string), subtitle: (entity.status as string) || '' };
      case 'QUOTE':
        return { name: (entity.quoteNumber as string) || (entity.id as string), subtitle: (entity.jobName as string) || '' };
      case 'ORDER':
        return { name: (entity.orderNumber as string) || (entity.id as string), subtitle: (entity.jobName as string) || '' };
      case 'INVOICE':
        return { name: (entity.invoiceNumber as string) || (entity.id as string), subtitle: (entity.status as string) || '' };
      case 'TASK':
        return { name: (entity.title as string) || (entity.id as string), subtitle: (entity.status as string) || '' };
      case 'NOTE':
        return { name: (entity.title as string) || (entity.id as string), subtitle: '' };
      case 'CHECK':
        return { name: (entity.checkNumber as string) || (entity.id as string), subtitle: (entity.status as string) || '' };
      case 'FACTORY':
        return { name: (entity.title as string) || (entity.id as string), subtitle: (entity.accountNumber as string) || '' };
      case 'CUSTOMER':
        return { name: (entity.companyName as string) || (entity.id as string), subtitle: '' };
      case 'PRODUCT':
        return { name: (entity.factoryPartNumber as string) || (entity.id as string), subtitle: (entity.description as string) || '' };
      default:
        return { name: entity.id as string, subtitle: '' };
    }
  };

  const handleSubmit = async () => {
    if (!selectedEntityId) return;

    setIsLinking(true);
    try {
      await linkFileToEntity(entityType as FileEntityType, selectedEntityId, fileId);
      showSuccessToast('File linked', {
        description: `File linked to ${config.label.toLowerCase()} successfully`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      showErrorToast('Failed to link file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleEntityTypeChange = (type: LinkableEntityType) => {
    setEntityType(type);
    setSelectedEntityId(null);
    setSearchTerm('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Link File to Entity</h2>
              <p className="text-sm text-[var(--muted-foreground)] truncate max-w-[300px]" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLinking}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Entity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Entity Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_ENTITY_TYPES.map((type) => {
                const typeConfig = ENTITY_CONFIG[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleEntityTypeChange(type)}
                    className={`flex items-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                      entityType === type
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${entityType === type ? 'bg-white/20' : typeConfig.color + ' text-white'}`}>
                      {typeConfig.icon}
                    </span>
                    <span className="truncate">{typeConfig.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Search {config.plural}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${config.plural.toLowerCase()}...`}
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Entity List */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Select {config.label}
            </label>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : entities.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                  {searchTerm ? 'No results found' : `Type to search ${config.plural.toLowerCase()}`}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {entities.map((entity: { id: string }) => {
                    const isSelected = selectedEntityId === entity.id;
                    const { name, subtitle } = getEntityDisplay(entity as Record<string, unknown>);

                    return (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() => setSelectedEntityId(entity.id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          isSelected
                            ? 'bg-[var(--primary)]/10 border-l-4 border-[var(--primary)]'
                            : 'hover:bg-[var(--muted)]/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-[var(--primary)] border-[var(--primary)]'
                              : 'border-[var(--border)]'
                          }`}>
                            {isSelected && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                                <circle cx="12" cy="12" r="6" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[var(--foreground)]">{name}</p>
                            {subtitle && (
                              <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLinking}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLinking || !selectedEntityId}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
          >
            {isLinking ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Linking...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                Link File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

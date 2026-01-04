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

export type EntityModeEntityType =
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

export interface SelectedEntity {
  id: string;
  type: EntityModeEntityType;
  name: string;
}

const ENTITY_CONFIG: Record<EntityModeEntityType, { label: string; plural: string; color: string }> = {
  JOB: { label: 'Job', plural: 'Jobs', color: 'bg-indigo-500' },
  TASK: { label: 'Task', plural: 'Tasks', color: 'bg-rose-500' },
  COMPANY: { label: 'Company', plural: 'Companies', color: 'bg-purple-500' },
  CONTACT: { label: 'Contact', plural: 'Contacts', color: 'bg-green-500' },
  NOTE: { label: 'Note', plural: 'Notes', color: 'bg-yellow-500' },
  PRE_OPPORTUNITY: { label: 'Pre-Opp', plural: 'Pre-Opportunities', color: 'bg-amber-500' },
  QUOTE: { label: 'Quote', plural: 'Quotes', color: 'bg-blue-500' },
  ORDER: { label: 'Order', plural: 'Orders', color: 'bg-teal-500' },
  INVOICE: { label: 'Invoice', plural: 'Invoices', color: 'bg-emerald-500' },
  CHECK: { label: 'Check', plural: 'Checks', color: 'bg-cyan-500' },
  FACTORY: { label: 'Factory', plural: 'Factories', color: 'bg-slate-500' },
  CUSTOMER: { label: 'Customer', plural: 'Customers', color: 'bg-pink-500' },
  PRODUCT: { label: 'Product', plural: 'Products', color: 'bg-orange-500' },
};

const ALL_ENTITY_TYPES: EntityModeEntityType[] = [
  'JOB', 'COMPANY', 'CONTACT', 'PRE_OPPORTUNITY', 'QUOTE', 'ORDER', 'INVOICE',
  'TASK', 'NOTE', 'CHECK', 'FACTORY', 'CUSTOMER', 'PRODUCT'
];

interface EntityModeSelectorProps {
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity | null) => void;
  onExitEntityMode: () => void;
}

export function EntityModeSelector({
  selectedEntity,
  onSelectEntity,
  onExitEntityMode,
}: EntityModeSelectorProps) {
  const [entityType, setEntityType] = useState<EntityModeEntityType>('JOB');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Search hooks for all entity types
  const { data: jobs = [], isLoading: jobsLoading } = useJobSearch(searchTerm, entityType === 'JOB');
  const { data: companies = [], isLoading: companiesLoading } = useCompanySearch(searchTerm, entityType === 'COMPANY');
  const { data: contacts = [], isLoading: contactsLoading } = useContactSearch(searchTerm, entityType === 'CONTACT');
  const { data: preOpportunities = [], isLoading: preOpportunitiesLoading } = usePreOpportunitySearch(searchTerm, entityType === 'PRE_OPPORTUNITY');
  const { data: quotes = [], isLoading: quotesLoading } = useQuoteSearch(searchTerm, entityType === 'QUOTE');
  const { data: orders = [], isLoading: ordersLoading } = useOrderSearch(searchTerm, entityType === 'ORDER');
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoiceSearch(searchTerm, entityType === 'INVOICE');
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(searchTerm, entityType === 'TASK');
  const { data: checks = [], isLoading: checksLoading } = useCheckSearch(searchTerm, entityType === 'CHECK');
  const { data: factories = [], isLoading: factoriesLoading } = useFactorySearch(searchTerm, entityType === 'FACTORY');
  const { data: customers = [], isLoading: customersLoading } = useCustomerSearch(searchTerm, entityType === 'CUSTOMER');
  const { data: products = [], isLoading: productsLoading } = useProductSearch(searchTerm, entityType === 'PRODUCT');
  const { data: notes = [], isLoading: notesLoading } = useQuery<NoteSearchResult[], Error>({
    queryKey: ['search', 'notes', searchTerm],
    queryFn: () => searchNotes(searchTerm),
    enabled: entityType === 'NOTE',
    staleTime: 60 * 1000,
  });

  const config = ENTITY_CONFIG[entityType];

  const { entities, isSearchLoading } = useMemo(() => {
    switch (entityType) {
      case 'JOB': return { entities: jobs, isSearchLoading: jobsLoading };
      case 'COMPANY': return { entities: companies, isSearchLoading: companiesLoading };
      case 'CONTACT': return { entities: contacts, isSearchLoading: contactsLoading };
      case 'PRE_OPPORTUNITY': return { entities: preOpportunities, isSearchLoading: preOpportunitiesLoading };
      case 'QUOTE': return { entities: quotes, isSearchLoading: quotesLoading };
      case 'ORDER': return { entities: orders, isSearchLoading: ordersLoading };
      case 'INVOICE': return { entities: invoices, isSearchLoading: invoicesLoading };
      case 'TASK': return { entities: tasks, isSearchLoading: tasksLoading };
      case 'NOTE': return { entities: notes, isSearchLoading: notesLoading };
      case 'CHECK': return { entities: checks, isSearchLoading: checksLoading };
      case 'FACTORY': return { entities: factories, isSearchLoading: factoriesLoading };
      case 'CUSTOMER': return { entities: customers, isSearchLoading: customersLoading };
      case 'PRODUCT': return { entities: products, isSearchLoading: productsLoading };
      default: return { entities: [], isSearchLoading: false };
    }
  }, [entityType, jobs, jobsLoading, companies, companiesLoading, contacts, contactsLoading,
      preOpportunities, preOpportunitiesLoading, quotes, quotesLoading, orders, ordersLoading,
      invoices, invoicesLoading, tasks, tasksLoading, notes, notesLoading, checks, checksLoading,
      factories, factoriesLoading, customers, customersLoading, products, productsLoading]);

  const getEntityDisplay = (entity: Record<string, unknown>): string => {
    switch (entityType) {
      case 'JOB': return (entity.jobName as string) || (entity.id as string);
      case 'COMPANY': return entity.name as string;
      case 'CONTACT': return `${entity.firstName} ${entity.lastName}`;
      case 'PRE_OPPORTUNITY': return (entity.entityNumber as string) || (entity.id as string);
      case 'QUOTE': return (entity.quoteNumber as string) || (entity.id as string);
      case 'ORDER': return (entity.orderNumber as string) || (entity.id as string);
      case 'INVOICE': return (entity.invoiceNumber as string) || (entity.id as string);
      case 'TASK': return (entity.title as string) || (entity.id as string);
      case 'NOTE': return (entity.title as string) || (entity.id as string);
      case 'CHECK': return (entity.checkNumber as string) || (entity.id as string);
      case 'FACTORY': return (entity.title as string) || (entity.id as string);
      case 'CUSTOMER': return (entity.companyName as string) || (entity.id as string);
      case 'PRODUCT': return (entity.factoryPartNumber as string) || (entity.id as string);
      default: return entity.id as string;
    }
  };

  const handleEntityTypeChange = (type: EntityModeEntityType) => {
    setEntityType(type);
    setSearchTerm('');
    onSelectEntity(null);
  };

  const handleSelectEntity = (entity: { id: string }) => {
    const name = getEntityDisplay(entity as Record<string, unknown>);
    onSelectEntity({ id: entity.id, type: entityType, name });
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-[var(--muted)]/30 border-b border-[var(--border)] px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Exit button */}
        <button
          onClick={onExitEntityMode}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Folders
        </button>

        <div className="w-px h-6 bg-[var(--border)]" />

        {/* Entity type pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_ENTITY_TYPES.map((type) => {
            const typeConfig = ENTITY_CONFIG[type];
            const isActive = entityType === type;
            return (
              <button
                key={type}
                onClick={() => handleEntityTypeChange(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                {typeConfig.label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-[var(--border)]" />

        {/* Entity search/selector */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={selectedEntity ? selectedEntity.name : searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
                if (selectedEntity) onSelectEntity(null);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={`Search ${config.plural.toLowerCase()} to view linked files...`}
              className="w-full pl-9 pr-10 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--input)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 transition-all"
            />
            {selectedEntity && (
              <button
                onClick={() => {
                  onSelectEntity(null);
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {isDropdownOpen && !selectedEntity && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {isSearchLoading ? (
                <div className="p-4 text-center">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : entities.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
                  {searchTerm ? 'No results found' : `Type to search ${config.plural.toLowerCase()}`}
                </div>
              ) : (
                <div className="py-1">
                  {entities.map((entity: { id: string }) => {
                    const name = getEntityDisplay(entity as Record<string, unknown>);
                    return (
                      <button
                        key={entity.id}
                        onClick={() => handleSelectEntity(entity)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--muted)] transition-colors"
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected entity badge */}
        {selectedEntity && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${ENTITY_CONFIG[selectedEntity.type].color} text-white text-sm font-medium`}>
            <span>{ENTITY_CONFIG[selectedEntity.type].label}:</span>
            <span className="font-normal">{selectedEntity.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

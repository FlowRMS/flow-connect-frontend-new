/**
 * Add Link Modal Component - CENTRALIZED
 * A reusable modal for linking entities to any source entity type
 *
 * Supports: Company, Contact, Task, Note, Pre-Opportunity, Quote, Order, Invoice, Check
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useRelatedEntities,
  useCreateCRMLink,
} from '../hooks/useCRMApi';
import {
  useCompanySearch,
  useContactSearch,
  useTaskSearch,
  usePreOpportunitySearch,
  useQuoteSearch,
  useOrderSearch,
  useInvoiceSearch,
  useCheckSearch,
  useFactorySearch,
  useCustomerSearch,
  useProductSearch,
  useJobSearch,
  useFileSearch,
  formatFileSize,
  type CompanySearchResult,
  type ContactSearchResult,
  type TaskSearchResult,
  type PreOpportunitySearchResult,
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
  type FactorySearchResult,
  type CustomerSearchResult,
  type ProductSearchResult,
  type JobSearchResult,
  type FileResponse,
} from '../notes/api';
import { useNoteSearch, type NoteSearchResult } from '../tasks/api';
import type { CRMEntityType, RelatedEntitiesSourceType } from '../lib/crm-graphql';
import { linkToasts } from '../lib/toast';

// All linkable entity types
type LinkEntityType = 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT' | 'JOB' | 'FILE';

// Source entity types
type SourceEntityType = 'JOB' | 'CONTACT' | 'COMPANY' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'TASK' | 'NOTE';

// Map source entity type to API endpoint type
const SOURCE_TYPE_TO_API_TYPE: Record<SourceEntityType, RelatedEntitiesSourceType> = {
  JOB: 'JOBS',
  CONTACT: 'CONTACTS',
  COMPANY: 'COMPANIES',
  PRE_OPPORTUNITY: 'PRE_OPPORTUNITIES',
  QUOTE: 'QUOTES',
  ORDER: 'ORDERS',
  INVOICE: 'INVOICES',
  CHECK: 'CHECKS',
  TASK: 'TASKS',
  NOTE: 'NOTES',
};

// Entity type configuration for display
const ENTITY_TYPE_CONFIG: Record<LinkEntityType, { label: string; plural: string; color: string; icon: React.ReactNode }> = {
  COMPANY: {
    label: 'Company',
    plural: 'Companies',
    color: 'bg-purple-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  CONTACT: {
    label: 'Contact',
    plural: 'Contacts',
    color: 'bg-green-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  TASK: {
    label: 'Task',
    plural: 'Tasks',
    color: 'bg-orange-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  NOTE: {
    label: 'Note',
    plural: 'Notes',
    color: 'bg-yellow-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  PRE_OPPORTUNITY: {
    label: 'Pre-Opportunity',
    plural: 'Pre-Opportunities',
    color: 'bg-indigo-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  QUOTE: {
    label: 'Quote',
    plural: 'Quotes',
    color: 'bg-blue-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  ORDER: {
    label: 'Order',
    plural: 'Orders',
    color: 'bg-teal-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  INVOICE: {
    label: 'Invoice',
    plural: 'Invoices',
    color: 'bg-emerald-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
  CHECK: {
    label: 'Check',
    plural: 'Checks',
    color: 'bg-rose-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  FACTORY: {
    label: 'Factory',
    plural: 'Factories',
    color: 'bg-slate-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  CUSTOMER: {
    label: 'Customer',
    plural: 'Customers',
    color: 'bg-lime-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  PRODUCT: {
    label: 'Product',
    plural: 'Products',
    color: 'bg-fuchsia-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  JOB: {
    label: 'Job',
    plural: 'Jobs',
    color: 'bg-indigo-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  FILE: {
    label: 'File',
    plural: 'Files',
    color: 'bg-gray-500',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
};

const ALL_ENTITY_TYPES: LinkEntityType[] = [
  'COMPANY',
  'CONTACT',
  'TASK',
  'NOTE',
  'PRE_OPPORTUNITY',
  'QUOTE',
  'ORDER',
  'INVOICE',
  'CHECK',
  'FACTORY',
  'CUSTOMER',
  'PRODUCT',
  'JOB',
  'FILE',
];

interface AddLinkModalProps {
  isOpen: boolean;
  sourceEntityId: string;
  sourceEntityType: SourceEntityType;
  initialEntityType?: LinkEntityType;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLinkModal({
  isOpen,
  sourceEntityId,
  sourceEntityType,
  initialEntityType = 'COMPANY',
  onClose,
  onSuccess
}: AddLinkModalProps) {
  const [entityType, setEntityType] = useState<LinkEntityType>(initialEntityType);
  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkProgress, setLinkProgress] = useState({ current: 0, total: 0 });

  // Reset entity type when modal opens with a new initialEntityType
  useEffect(() => {
    if (isOpen) {
      setEntityType(initialEntityType);
      setSelectedEntityIds(new Set());
      setSearchTerm('');
      setIsLinking(false);
      setLinkProgress({ current: 0, total: 0 });
    }
  }, [isOpen, initialEntityType]);

  // Toggle entity selection
  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntityIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  // Select all visible entities
  const selectAllEntities = () => {
    const allIds = new Set<string>(entities.map((e: { id: string }) => e.id));
    setSelectedEntityIds(allIds);
  };

  // Deselect all entities
  const deselectAllEntities = () => {
    setSelectedEntityIds(new Set());
  };

  // Search-based entity fetching - pass searchTerm to trigger API searches on typing
  const { data: companies = [], isLoading: companiesLoading } = useCompanySearch(searchTerm, isOpen);
  const { data: contacts = [], isLoading: contactsLoading } = useContactSearch(searchTerm, isOpen);
  const { data: preOpportunities = [], isLoading: preOpportunitiesLoading } = usePreOpportunitySearch(searchTerm, isOpen);
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(searchTerm, isOpen);
  const { data: notes = [], isLoading: notesLoading } = useNoteSearch(searchTerm, isOpen);
  const { data: quotes = [], isLoading: quotesLoading } = useQuoteSearch(searchTerm, isOpen);
  const { data: orders = [], isLoading: ordersLoading } = useOrderSearch(searchTerm, isOpen);
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoiceSearch(searchTerm, isOpen);
  const { data: checks = [], isLoading: checksLoading } = useCheckSearch(searchTerm, isOpen);
  const { data: factories = [], isLoading: factoriesLoading } = useFactorySearch(searchTerm, isOpen);
  const { data: customers = [], isLoading: customersLoading } = useCustomerSearch(searchTerm, isOpen);
  const { data: products = [], isLoading: productsLoading } = useProductSearch(searchTerm, isOpen);
  const { data: jobs = [], isLoading: jobsLoading } = useJobSearch(searchTerm, isOpen);
  const { data: files = [], isLoading: filesLoading } = useFileSearch(searchTerm, isOpen);

  // Fetch already linked entities using centralized endpoint
  const { data: relatedEntities } = useRelatedEntities(sourceEntityId, SOURCE_TYPE_TO_API_TYPE[sourceEntityType]);

  // Create link mutation
  const createLinkMutation = useCreateCRMLink();

  // Get IDs of already linked entities
  // Note: Files are not returned by relatedEntities API - they use a separate endpoint
  const linkedIds = useMemo(() => ({
    companies: new Set(relatedEntities?.companies?.map((c: { id: string }) => c.id) || []),
    contacts: new Set(relatedEntities?.contacts?.map((c: { id: string }) => c.id) || []),
    preOpportunities: new Set(relatedEntities?.preOpportunities?.map((p: { id: string }) => p.id) || []),
    tasks: new Set(relatedEntities?.tasks?.map((t: { id: string }) => t.id) || []),
    notes: new Set(relatedEntities?.notes?.map((n: { id: string }) => n.id) || []),
    quotes: new Set(relatedEntities?.quotes?.map((q: { id: string }) => q.id) || []),
    orders: new Set(relatedEntities?.orders?.map((o: { id: string }) => o.id) || []),
    invoices: new Set(relatedEntities?.invoices?.map((i: { id: string }) => i.id) || []),
    checks: new Set(relatedEntities?.checks?.map((c: { id: string }) => c.id) || []),
    factories: new Set(relatedEntities?.factories?.map((f: { id: string }) => f.id) || []),
    customers: new Set(relatedEntities?.customers?.map((c: { id: string }) => c.id) || []),
    products: new Set(relatedEntities?.products?.map((p: { id: string }) => p.id) || []),
    jobs: new Set(relatedEntities?.jobs?.map((j: { id: string }) => j.id) || []),
    files: new Set<string>(), // Files not returned by relatedEntities - tracked separately
  }), [relatedEntities]);

  // Get display info for an entity
  const getEntityDisplay = (entity: Record<string, unknown>, type: LinkEntityType): { name: string; subtitle: string } => {
    switch (type) {
      case 'COMPANY':
        return { name: entity.name as string, subtitle: (entity.companySourceType as string) || '' };
      case 'CONTACT':
        return { name: `${entity.firstName} ${entity.lastName}`, subtitle: (entity.email as string) || (entity.role as string) || '' };
      case 'TASK':
        return { name: entity.title as string, subtitle: `${entity.status} - ${entity.priority}` };
      case 'NOTE':
        return { name: entity.title as string, subtitle: ((entity.content as string) || '').substring(0, 50) };
      case 'PRE_OPPORTUNITY':
        return { name: (entity.entityNumber as string) || (entity.id as string), subtitle: `${entity.status || ''} ${entity.entityDate || ''}`.trim() };
      case 'QUOTE':
        return { name: (entity.quoteNumber as string) || (entity.id as string), subtitle: (entity.jobName as string) || '' };
      case 'ORDER':
        return { name: (entity.orderNumber as string) || (entity.id as string), subtitle: (entity.jobName as string) || (entity.status as string) || '' };
      case 'INVOICE':
        return { name: (entity.invoiceNumber as string) || (entity.id as string), subtitle: (entity.status as string) || '' };
      case 'CHECK':
        return { name: (entity.checkNumber as string) || (entity.id as string), subtitle: (entity.status as string) || '' };
      case 'FACTORY':
        return { name: (entity.title as string) || (entity.id as string), subtitle: 'Factory' };
      case 'CUSTOMER':
        return { name: (entity.companyName as string) || (entity.id as string), subtitle: 'Customer' };
      case 'PRODUCT':
        return { name: (entity.factoryPartNumber as string) || (entity.id as string), subtitle: 'Product' };
      case 'JOB':
        return { name: (entity.jobName as string) || (entity.id as string), subtitle: (entity.jobType as string) || '' };
      case 'FILE':
        return { name: (entity.fileName as string) || (entity.id as string), subtitle: formatFileSize(entity.fileSize as number) };
      default:
        return { name: entity.id as string, subtitle: '' };
    }
  };

  // Get entities and loading state based on current type
  const { entities, isLoading } = useMemo(() => {
    switch (entityType) {
      case 'COMPANY':
        return {
          entities: companies.filter((c: CompanySearchResult) => !linkedIds.companies.has(c.id)),
          isLoading: companiesLoading,
        };
      case 'CONTACT':
        return {
          entities: contacts.filter((c: ContactSearchResult) => !linkedIds.contacts.has(c.id)),
          isLoading: contactsLoading,
        };
      case 'TASK':
        return {
          entities: tasks.filter((t: TaskSearchResult) => !linkedIds.tasks.has(t.id)),
          isLoading: tasksLoading,
        };
      case 'NOTE':
        return {
          entities: notes.filter((n: NoteSearchResult) => !linkedIds.notes.has(n.id)),
          isLoading: notesLoading,
        };
      case 'PRE_OPPORTUNITY':
        return {
          entities: preOpportunities.filter((p: PreOpportunitySearchResult) => !linkedIds.preOpportunities.has(p.id)),
          isLoading: preOpportunitiesLoading,
        };
      case 'QUOTE':
        return {
          entities: quotes.filter((q: QuoteSearchResult) => !linkedIds.quotes.has(q.id)),
          isLoading: quotesLoading,
        };
      case 'ORDER':
        return {
          entities: orders.filter((o: OrderSearchResult) => !linkedIds.orders.has(o.id)),
          isLoading: ordersLoading,
        };
      case 'INVOICE':
        return {
          entities: invoices.filter((i: InvoiceSearchResult) => !linkedIds.invoices.has(i.id)),
          isLoading: invoicesLoading,
        };
      case 'CHECK':
        return {
          entities: checks.filter((c: CheckSearchResult) => !linkedIds.checks.has(c.id)),
          isLoading: checksLoading,
        };
      case 'FACTORY':
        return {
          entities: factories.filter((f: FactorySearchResult) => !linkedIds.factories.has(f.id)),
          isLoading: factoriesLoading,
        };
      case 'CUSTOMER':
        return {
          entities: customers.filter((c: CustomerSearchResult) => !linkedIds.customers.has(c.id)),
          isLoading: customersLoading,
        };
      case 'PRODUCT':
        return {
          entities: products.filter((p: ProductSearchResult) => !linkedIds.products.has(p.id)),
          isLoading: productsLoading,
        };
      case 'JOB':
        return {
          entities: jobs.filter((j: JobSearchResult) => !linkedIds.jobs.has(j.id)),
          isLoading: jobsLoading,
        };
      case 'FILE':
        return {
          entities: files.filter((f: FileResponse) => !linkedIds.files.has(f.id)),
          isLoading: filesLoading,
        };
      default:
        return { entities: [], isLoading: false };
    }
  }, [
    entityType,
    companies, companiesLoading,
    contacts, contactsLoading,
    tasks, tasksLoading,
    notes, notesLoading,
    preOpportunities, preOpportunitiesLoading,
    quotes, quotesLoading,
    orders, ordersLoading,
    invoices, invoicesLoading,
    checks, checksLoading,
    factories, factoriesLoading,
    customers, customersLoading,
    products, productsLoading,
    jobs, jobsLoading,
    files, filesLoading,
    linkedIds,
  ]);

  const config = ENTITY_TYPE_CONFIG[entityType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEntityIds.size === 0) return;

    setIsLinking(true);
    setLinkProgress({ current: 0, total: selectedEntityIds.size });

    const entityIdsArray = Array.from(selectedEntityIds);
    let successCount = 0;
    let failCount = 0;
    let alreadyExistsCount = 0;

    // Link entities one by one (API calls in sequence)
    for (let i = 0; i < entityIdsArray.length; i++) {
      const targetEntityId = entityIdsArray[i];
      setLinkProgress({ current: i + 1, total: entityIdsArray.length });

      try {
        await createLinkMutation.mutateAsync({
          sourceEntityType: sourceEntityType as CRMEntityType,
          sourceEntityId: sourceEntityId,
          targetEntityType: entityType as CRMEntityType,
          targetEntityId: targetEntityId,
        });
        successCount++;
      } catch (error: unknown) {
        console.error(`Failed to link entity ${targetEntityId}:`, error);

        // Check if error is "Link already exists"
        const errorMessage = error instanceof Error ? error.message : '';
        const isAlreadyExists = errorMessage.includes('Link already exists') ||
                                errorMessage.includes('already exists');

        if (isAlreadyExists) {
          alreadyExistsCount++;
        } else {
          failCount++;
        }
      }
    }

    setIsLinking(false);

    // Reset and close
    setSelectedEntityIds(new Set());
    setSearchTerm('');
    onSuccess();
    onClose();

    // Show appropriate toast messages
    if (successCount > 0) {
      linkToasts.createSuccess(`${successCount} ${config.label}${successCount > 1 ? 's' : ''}`);
    }

    if (alreadyExistsCount > 0) {
      linkToasts.alreadyExists(`${alreadyExistsCount} ${config.label}${alreadyExistsCount > 1 ? 's' : ''}`);
    }

    if (failCount > 0) {
      linkToasts.createError(`Failed to link ${failCount} ${config.label}${failCount > 1 ? 's' : ''}`);
    }
  };

  const handleEntityTypeChange = (type: LinkEntityType) => {
    setEntityType(type);
    setSelectedEntityIds(new Set());
    setSearchTerm('');
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLinking) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Get source entity label for display
  const sourceEntityLabels: Record<SourceEntityType, string> = {
    JOB: 'Job',
    CONTACT: 'Contact',
    COMPANY: 'Company',
    PRE_OPPORTUNITY: 'Pre-Opportunity',
    QUOTE: 'Quote',
    ORDER: 'Order',
    INVOICE: 'Invoice',
    CHECK: 'Check',
    TASK: 'Task',
    NOTE: 'Note',
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Link Entity to {sourceEntityLabels[sourceEntityType]}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* Entity Type Selection - Grid of buttons */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Entity Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ALL_ENTITY_TYPES.map((type) => {
                  const typeConfig = ENTITY_TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleEntityTypeChange(type)}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        entityType === type
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded flex items-center justify-center ${entityType === type ? 'bg-white/20' : typeConfig.color + ' text-white'}`}>
                        {typeConfig.icon}
                      </span>
                      {typeConfig.label}
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
                className="w-full px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Entity List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Select {config.plural} ({selectedEntityIds.size} selected)
                </label>
                {entities.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllEntities}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      Select All
                    </button>
                    {selectedEntityIds.size > 0 && (
                      <>
                        <span className="text-[var(--muted-foreground)]">|</span>
                        <button
                          type="button"
                          onClick={deselectAllEntities}
                          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-[var(--muted-foreground)]">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Loading...</span>
                    </div>
                  </div>
                ) : entities.length === 0 ? (
                  <div className="p-4 text-center text-[var(--muted-foreground)]">
                    {searchTerm ? 'No results found' : `No ${config.plural.toLowerCase()} available`}
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {entities.map((entity: { id: string }) => {
                      const isSelected = selectedEntityIds.has(entity.id);
                      const { name, subtitle } = getEntityDisplay(entity as Record<string, unknown>, entityType);

                      return (
                        <button
                          key={entity.id}
                          type="button"
                          onClick={() => toggleEntitySelection(entity.id)}
                          className={`w-full text-left px-4 py-3 transition-colors ${
                            isSelected
                              ? 'bg-[var(--primary)]/10 border-l-4 border-[var(--primary)]'
                              : 'hover:bg-[var(--muted)]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[var(--primary)] border-[var(--primary)]'
                                  : 'border-[var(--border)]'
                              }`}>
                                {isSelected && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <span className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center text-white`}>
                                {config.icon}
                              </span>
                              <div>
                                <p className="font-medium text-[var(--foreground)]">{name}</p>
                                {subtitle && (
                                  <p className="text-sm text-[var(--muted-foreground)] truncate max-w-[300px]">{subtitle}</p>
                                )}
                              </div>
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
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-between items-center flex-shrink-0">
            <div className="text-sm text-[var(--muted-foreground)]">
              {selectedEntityIds.size > 0 && (
                <span>{selectedEntityIds.size} {selectedEntityIds.size === 1 ? config.label.toLowerCase() : config.plural.toLowerCase()} selected</span>
              )}
              {isLinking && (
                <span className="ml-2">Linking {linkProgress.current}/{linkProgress.total}...</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLinking}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedEntityIds.size === 0 || isLinking}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLinking && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                )}
                Link {selectedEntityIds.size > 1 ? `${selectedEntityIds.size} ${config.plural}` : config.label}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddLinkModal;

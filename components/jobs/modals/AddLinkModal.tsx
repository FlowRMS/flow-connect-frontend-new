/**
 * Add Link Modal Component
 * Allows users to link entities to a Job
 * Supports: Company, Contact, Task, Note, Pre-Opportunity, Quote, Order, Invoice, Check
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useCRMCompanyLandingPages,
  useCRMContactLandingPages,
  useCRMJobRelatedEntities,
  useCreateCRMLink,
  useCRMTaskSearch,
  useCRMNoteSearch,
  useCRMQuoteSearch,
  useCRMOrderSearch,
  useCRMInvoiceSearch,
  useCRMCheckSearch,
  useCRMPreOpportunityLandingPages,
  useCRMFactorySearch,
  useCRMCustomerSearch,
  useCRMProductSearch,
} from '../../hooks/useCRMApi';
import type { EntityType, FactorySearchResult, CustomerSearchResult, ProductSearchResult } from '../../lib/crm-graphql';

// All linkable entity types
type LinkEntityType = 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'FACTORY' | 'CUSTOMER' | 'PRODUCT';

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
];

interface AddLinkModalProps {
  isOpen: boolean;
  jobId: string;
  initialEntityType?: LinkEntityType;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLinkModal({ isOpen, jobId, initialEntityType = 'COMPANY', onClose, onSuccess }: AddLinkModalProps) {
  const [entityType, setEntityType] = useState<LinkEntityType>(initialEntityType);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Reset entity type when modal opens with a new initialEntityType
  useEffect(() => {
    if (isOpen) {
      setEntityType(initialEntityType);
      setSelectedEntityId('');
      setSearchTerm('');
    }
  }, [isOpen, initialEntityType]);

  // Fetch landing pages for companies, contacts, pre-opportunities
  const { data: companies, isLoading: companiesLoading } = useCRMCompanyLandingPages();
  const { data: contacts, isLoading: contactsLoading } = useCRMContactLandingPages();
  const { data: preOpportunities, isLoading: preOpportunitiesLoading } = useCRMPreOpportunityLandingPages();
  
  // Search-based entity fetching - pass empty string to get all entities initially
  const { data: tasks, isLoading: tasksLoading } = useCRMTaskSearch('');
  const { data: notes, isLoading: notesLoading } = useCRMNoteSearch('');
  const { data: quotes, isLoading: quotesLoading } = useCRMQuoteSearch('');
  const { data: orders, isLoading: ordersLoading } = useCRMOrderSearch('');
  const { data: invoices, isLoading: invoicesLoading } = useCRMInvoiceSearch('');
  const { data: checks, isLoading: checksLoading } = useCRMCheckSearch('');
  const { data: factories, isLoading: factoriesLoading } = useCRMFactorySearch('', undefined, true);
  const { data: customers, isLoading: customersLoading } = useCRMCustomerSearch('', undefined, true);
  const { data: products, isLoading: productsLoading } = useCRMProductSearch('', undefined, true);
  
  // Fetch already linked entities for this job
  const { data: relatedEntities } = useCRMJobRelatedEntities(jobId);

  // Create link mutation
  const createLinkMutation = useCreateCRMLink();

  // Get IDs of already linked entities (tasks and notes are not returned by jobRelatedEntities)
  const linkedIds = useMemo(() => ({
    companies: new Set(relatedEntities?.companies?.map(c => c.id) || []),
    contacts: new Set(relatedEntities?.contacts?.map(c => c.id) || []),
    preOpportunities: new Set(relatedEntities?.preOpportunities?.map(p => p.id) || []),
    tasks: new Set<string>(),
    notes: new Set<string>(),
    quotes: new Set(relatedEntities?.quotes?.map(q => q.id) || []),
    orders: new Set(relatedEntities?.orders?.map(o => o.id) || []),
    invoices: new Set(relatedEntities?.invoices?.map(i => i.id) || []),
    checks: new Set(relatedEntities?.checks?.map(c => c.id) || []),
    factories: new Set<string>(),
    customers: new Set<string>(),
    products: new Set<string>(),
  }), [relatedEntities]);

  // Get display info for an entity
  const getEntityDisplay = (entity: any, type: LinkEntityType): { name: string; subtitle: string } => {
    switch (type) {
      case 'COMPANY':
        return { name: entity.name, subtitle: entity.companySourceType || '' };
      case 'CONTACT':
        return { name: `${entity.firstName} ${entity.lastName}`, subtitle: entity.email || entity.role || '' };
      case 'TASK':
        return { name: entity.title, subtitle: `${entity.status} - ${entity.priority}` };
      case 'NOTE':
        return { name: entity.title, subtitle: entity.content?.substring(0, 50) || '' };
      case 'PRE_OPPORTUNITY':
        return { name: entity.entityNumber || entity.id, subtitle: `${entity.status || ''} ${entity.entityDate || ''}`.trim() };
      case 'QUOTE':
        return { name: entity.quoteNumber || entity.id, subtitle: entity.jobName || '' };
      case 'ORDER':
        return { name: entity.orderNumber || entity.id, subtitle: entity.jobName || entity.status || '' };
      case 'INVOICE':
        return { name: entity.invoiceNumber || entity.id, subtitle: entity.status || '' };
      case 'CHECK':
        return { name: entity.checkNumber || entity.id, subtitle: entity.status || '' };
      case 'FACTORY':
        return { name: entity.title || entity.id, subtitle: 'Factory' };
      case 'CUSTOMER':
        return { name: entity.companyName || entity.id, subtitle: 'Customer' };
      case 'PRODUCT':
        return { name: entity.factoryPartNumber || entity.id, subtitle: 'Product' };
      default:
        return { name: entity.id, subtitle: '' };
    }
  };

  // Get entities and loading state based on current type
  const { entities, isLoading } = useMemo(() => {
    switch (entityType) {
      case 'COMPANY':
        return {
          entities: (companies || []).filter(c => 
            !linkedIds.companies.has(c.id) && 
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
          ),
          isLoading: companiesLoading,
        };
      case 'CONTACT':
        return {
          entities: (contacts || []).filter(c => {
            if (linkedIds.contacts.has(c.id)) return false;
            const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase()) ||
              (c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
          }),
          isLoading: contactsLoading,
        };
      case 'TASK':
        return {
          entities: (tasks || []).filter(t => {
            if (linkedIds.tasks.has(t.id)) return false;
            if (!searchTerm) return true;
            return t.title?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: tasksLoading,
        };
      case 'NOTE':
        return {
          entities: (notes || []).filter(n => {
            if (linkedIds.notes.has(n.id)) return false;
            if (!searchTerm) return true;
            return n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              n.content?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: notesLoading,
        };
      case 'PRE_OPPORTUNITY':
        return {
          entities: (preOpportunities || []).filter(p => 
            !linkedIds.preOpportunities.has(p.id) &&
            (p.entityNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             p.id.toLowerCase().includes(searchTerm.toLowerCase()))
          ),
          isLoading: preOpportunitiesLoading,
        };
      case 'QUOTE':
        return {
          entities: (quotes || []).filter(q => {
            if (linkedIds.quotes.has(q.id)) return false;
            if (!searchTerm) return true;
            return q.quoteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              q.jobName?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: quotesLoading,
        };
      case 'ORDER':
        return {
          entities: (orders || []).filter(o => {
            if (linkedIds.orders.has(o.id)) return false;
            if (!searchTerm) return true;
            return o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              o.jobName?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: ordersLoading,
        };
      case 'INVOICE':
        return {
          entities: (invoices || []).filter(i => {
            if (linkedIds.invoices.has(i.id)) return false;
            if (!searchTerm) return true;
            return i.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: invoicesLoading,
        };
      case 'CHECK':
        return {
          entities: (checks || []).filter(c => {
            if (linkedIds.checks.has(c.id)) return false;
            if (!searchTerm) return true;
            return c.checkNumber?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: checksLoading,
        };
      case 'FACTORY':
        return {
          entities: (factories || []).filter((f: FactorySearchResult) => {
            if (linkedIds.factories.has(f.id)) return false;
            if (!searchTerm) return true;
            return f.title?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: factoriesLoading,
        };
      case 'CUSTOMER':
        return {
          entities: (customers || []).filter((c: CustomerSearchResult) => {
            if (linkedIds.customers.has(c.id)) return false;
            if (!searchTerm) return true;
            return c.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: customersLoading,
        };
      case 'PRODUCT':
        return {
          entities: (products || []).filter((p: ProductSearchResult) => {
            if (linkedIds.products.has(p.id)) return false;
            if (!searchTerm) return true;
            return p.factoryPartNumber?.toLowerCase().includes(searchTerm.toLowerCase());
          }),
          isLoading: productsLoading,
        };
      default:
        return { entities: [], isLoading: false };
    }
  }, [
    entityType, searchTerm, 
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
    linkedIds,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEntityId) return;

    try {
      await createLinkMutation.mutateAsync({
        sourceEntityType: 'JOB' as EntityType,
        sourceEntityId: jobId,
        targetEntityType: entityType as EntityType,
        targetEntityId: selectedEntityId,
      });
      
      // Reset and close
      setSelectedEntityId('');
      setSearchTerm('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create link:', error);
    }
  };

  const handleEntityTypeChange = (type: LinkEntityType) => {
    setEntityType(type);
    setSelectedEntityId('');
    setSearchTerm('');
  };

  if (!isOpen) return null;

  const config = ENTITY_TYPE_CONFIG[entityType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Link Entity to Job</h2>
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
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Select {config.label}
              </label>
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
                    {entities.map((entity: any) => {
                      const isSelected = selectedEntityId === entity.id;
                      const { name, subtitle } = getEntityDisplay(entity, entityType);
                      
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
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
                            {isSelected && (
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--primary)]">
                                <path d="M5 10l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
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
          <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--muted)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedEntityId || createLinkMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createLinkMutation.isPending && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              Link {config.label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

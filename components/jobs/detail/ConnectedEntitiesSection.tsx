/**
 * Connected Entities Section Component
 * Displays and manages linked entities for a Job
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useCRMJobRelatedEntities,
  useDeleteCRMLinkByEntities,
  useCRMTasksByEntity,
  useCRMNotesByEntity,
} from '../../hooks/useCRMApi';
import type { 
  Company, 
  Contact, 
  PreOpportunity, 
  CRMEntityType,
  QuoteSearchResult,
  OrderSearchResult,
  InvoiceSearchResult,
  CheckSearchResult,
  TaskByEntity,
  Note,
} from '../../lib/crm-graphql';
import { AddLinkModal } from '../modals/AddLinkModal';

interface ConnectedEntitiesSectionProps {
  jobId: string;
  onCompanyClick?: (company: Company) => void;
  onContactClick?: (contact: Contact) => void;
  onPreOpportunityClick?: (preOpp: PreOpportunity) => void;
  onQuoteClick?: (quote: QuoteSearchResult) => void;
  onOrderClick?: (order: OrderSearchResult) => void;
  onInvoiceClick?: (invoice: InvoiceSearchResult) => void;
  onCheckClick?: (check: CheckSearchResult) => void;
  onTaskClick?: (task: TaskByEntity) => void;
  onNoteClick?: (note: Note) => void;
}

// Category types for filtering
type EntityCategory = 'contacts' | 'companies' | 'pre-opportunities' | 'tasks' | 'notes' | 'quotes' | 'orders' | 'invoices' | 'checks';
type LinkEntityType = 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK';

const ALL_CATEGORIES: EntityCategory[] = [
  'contacts',
  'companies',
  'pre-opportunities',
  'tasks',
  'notes',
  'quotes',
  'orders',
  'invoices',
  'checks',
];

export function ConnectedEntitiesSection({
  jobId,
  onCompanyClick,
  onContactClick,
  onPreOpportunityClick,
  onQuoteClick,
  onOrderClick,
  onInvoiceClick,
  onCheckClick,
  onTaskClick,
  onNoteClick,
}: ConnectedEntitiesSectionProps) {
  const router = useRouter();
  const [visibleCategories, setVisibleCategories] = useState<EntityCategory[]>(ALL_CATEGORIES);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<LinkEntityType>('COMPANY');

  // Open modal with specific entity type
  const openAddLinkModal = (entityType?: LinkEntityType) => {
    if (entityType) {
      setAddLinkEntityType(entityType);
    }
    setShowAddLinkModal(true);
  };

  // Fetch related entities from API
  const { 
    data: relatedEntities, 
    isLoading, 
    error, 
    refetch 
  } = useCRMJobRelatedEntities(jobId);

  // Fetch tasks linked to this job
  const {
    data: linkedTasks = [],
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useCRMTasksByEntity(jobId, 'JOB');

  // Fetch notes linked to this job
  const {
    data: linkedNotes = [],
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useCRMNotesByEntity(jobId, 'JOB' as CRMEntityType);

  // Delete link mutation
  const deleteLinkMutation = useDeleteCRMLinkByEntities();

  // Calculate totals
  const totals = useMemo(() => {
    const companiesCount = relatedEntities?.companies?.length || 0;
    const contactsCount = relatedEntities?.contacts?.length || 0;
    const preOppsCount = relatedEntities?.preOpportunities?.length || 0;
    const quotesCount = relatedEntities?.quotes?.length || 0;
    const ordersCount = relatedEntities?.orders?.length || 0;
    const invoicesCount = relatedEntities?.invoices?.length || 0;
    const checksCount = relatedEntities?.checks?.length || 0;
    const tasksCount = linkedTasks?.length || 0;
    const notesCount = linkedNotes?.length || 0;

    return {
      companies: companiesCount,
      contacts: contactsCount,
      'pre-opportunities': preOppsCount,
      quotes: quotesCount,
      orders: ordersCount,
      invoices: invoicesCount,
      checks: checksCount,
      tasks: tasksCount,
      notes: notesCount,
      total: companiesCount + contactsCount + preOppsCount + quotesCount + ordersCount + invoicesCount + checksCount + tasksCount + notesCount,
    };
  }, [relatedEntities, linkedTasks, linkedNotes]);

  // Toggle category visibility
  const toggleCategory = (category: EntityCategory) => {
    if (visibleCategories.includes(category)) {
      setVisibleCategories(visibleCategories.filter(c => c !== category));
    } else {
      setVisibleCategories([...visibleCategories, category]);
    }
  };

  const toggleAllCategories = () => {
    if (visibleCategories.length === ALL_CATEGORIES.length) {
      setVisibleCategories([]);
    } else {
      setVisibleCategories([...ALL_CATEGORIES]);
    }
  };

  // Handle unlinking an entity
  const handleUnlink = async (entityType: LinkEntityType, entityId: string) => {
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: 'JOB' as CRMEntityType,
        sourceEntityId: jobId,
        targetEntityType: entityType as CRMEntityType,
        targetEntityId: entityId,
      });
      refetch();
      refetchTasks();
      refetchNotes();
    } catch (unlinkError) {
      console.error('Failed to unlink entity:', unlinkError);
    }
  };

  // Handle successful link creation
  const handleLinkSuccess = () => {
    refetch();
    refetchTasks();
    refetchNotes();
  };

  // Handle company click - navigate to companies page
  const handleCompanyClick = (company: Company) => {
    if (onCompanyClick) {
      onCompanyClick(company);
    } else {
      router.push(`/companies?id=${company.id}`);
    }
  };

  // Handle contact click - navigate to contacts page
  const handleContactClick = (contact: Contact) => {
    if (onContactClick) {
      onContactClick(contact);
    } else {
      router.push(`/contacts?id=${contact.id}`);
    }
  };

  // Handle pre-opportunity click - navigate to pre-opportunities page
  const handlePreOpportunityClick = (preOpp: PreOpportunity) => {
    if (onPreOpportunityClick) {
      onPreOpportunityClick(preOpp);
    } else {
      router.push(`/pre-opportunities/${preOpp.id}`);
    }
  };

  // Handle task click - navigate to tasks page with the task open
  const handleTaskClick = (task: TaskByEntity) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      router.push(`/tasks?id=${task.id}`);
    }
  };

  // Handle note click - navigate to notes page with the note open
  const handleNoteClick = (note: Note) => {
    if (onNoteClick) {
      onNoteClick(note);
    } else {
      router.push(`/notes?id=${note.id}`);
    }
  };

  // Handle quote click
  const handleQuoteClick = (quote: QuoteSearchResult) => {
    if (onQuoteClick) {
      onQuoteClick(quote);
    }
    // Quotes don't have a detail page yet
  };

  // Handle order click
  const handleOrderClick = (order: OrderSearchResult) => {
    if (onOrderClick) {
      onOrderClick(order);
    }
    // Orders don't have a detail page yet
  };

  // Handle invoice click
  const handleInvoiceClick = (invoice: InvoiceSearchResult) => {
    if (onInvoiceClick) {
      onInvoiceClick(invoice);
    }
    // Invoices don't have a detail page yet
  };

  // Handle check click
  const handleCheckClick = (check: CheckSearchResult) => {
    if (onCheckClick) {
      onCheckClick(check);
    }
    // Checks don't have a detail page yet
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span>Loading connected entities...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
        <div className="text-center text-red-500">
          <p>Failed to load connected entities</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 text-sm text-[var(--primary)] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Connected Entities</h2>
            <button
              onClick={() => openAddLinkModal()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
              Add Link
            </button>
          </div>

          {/* Entity Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleAllCategories}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.length === ALL_CATEGORIES.length
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              All ({totals.total})
            </button>
            <button
              onClick={() => toggleCategory('contacts')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('contacts')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Contacts ({totals.contacts})
            </button>
            <button
              onClick={() => toggleCategory('companies')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('companies')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Companies ({totals.companies})
            </button>
            <button
              onClick={() => toggleCategory('pre-opportunities')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('pre-opportunities')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Pre-Opps ({totals['pre-opportunities']})
            </button>
            <button
              onClick={() => toggleCategory('tasks')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('tasks')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => toggleCategory('notes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('notes')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => toggleCategory('quotes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('quotes')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Quotes ({totals.quotes})
            </button>
            <button
              onClick={() => toggleCategory('orders')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('orders')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Orders ({totals.orders})
            </button>
            <button
              onClick={() => toggleCategory('invoices')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('invoices')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Invoices ({totals.invoices})
            </button>
            <button
              onClick={() => toggleCategory('checks')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.includes('checks')
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              Checks ({totals.checks})
            </button>
          </div>
        </div>

        {/* Entities Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Contacts */}
            {visibleCategories.includes('contacts') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Contacts</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.contacts && relatedEntities.contacts.length > 0 ? (
                    relatedEntities.contacts.map((contact: Contact) => {
                      // Generate initials and color for contact avatar
                      const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?';
                      const colors = [
                        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                        'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
                      ];
                      const colorIndex = Math.abs(contact.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
                      const avatarColor = colors[colorIndex];

                      return (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group"
                        >
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => handleContactClick(contact)}
                          >
                            {/* Contact Avatar */}
                            <div className={`w-10 h-10 rounded-lg ${avatarColor} flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0`}>
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-medium text-[var(--foreground)] truncate">
                                  {contact.firstName} {contact.lastName}
                                </h4>
                                {contact.role && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">
                                    {contact.role}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                                {contact.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {contact.email}
                                  </span>
                                )}
                                {contact.phone && (
                                  <span className="flex items-center gap-1 flex-shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {contact.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('CONTACT', contact.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink contact"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <p className="text-sm">No contacts linked</p>
                      <button
                        onClick={() => openAddLinkModal('CONTACT')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a contact
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Companies */}
            {visibleCategories.includes('companies') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Companies</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.companies && relatedEntities.companies.length > 0 ? (
                    relatedEntities.companies.map((company: Company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group"
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleCompanyClick(company)}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{company.name}</h4>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              {company.companySourceType}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            {company.phone && <span>{company.phone}</span>}
                            {company.website && <span>• {company.website}</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('COMPANY', company.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink company"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <p className="text-sm">No companies linked</p>
                      <button
                        onClick={() => openAddLinkModal('COMPANY')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a company
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pre-Opportunities */}
            {visibleCategories.includes('pre-opportunities') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Pre-Opportunities</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.preOpportunities && relatedEntities.preOpportunities.length > 0 ? (
                    relatedEntities.preOpportunities.map((preOpp: PreOpportunity) => (
                      <div
                        key={preOpp.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handlePreOpportunityClick(preOpp)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">{preOpp.entityNumber}</h4>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {preOpp.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{preOpp.entityDate}</span>
                            {preOpp.expDate && <span>• Exp: {preOpp.expDate}</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('PRE_OPPORTUNITY', preOpp.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink pre-opportunity"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm">No pre-opportunities linked</p>
                      <button
                        onClick={() => openAddLinkModal('PRE_OPPORTUNITY')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a pre-opportunity
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tasks */}
            {visibleCategories.includes('tasks') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Tasks ({totals.tasks})</h3>
                </div>
                <div className="p-4 space-y-3">
                  {isLoadingTasks ? (
                    <div className="flex items-center justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  ) : linkedTasks && linkedTasks.length > 0 ? (
                    linkedTasks.map((task: TaskByEntity) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{task.title}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {task.status?.replace('_', ' ')}
                              </span>
                              {task.priority && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  task.priority === 'URGENT' || task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                  task.priority === 'NORMAL' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              {task.dueDate && <span>Due: {task.dueDate}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('TASK', task.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink task"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-sm">No tasks linked</p>
                      <button
                        onClick={() => openAddLinkModal('TASK')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a task
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {visibleCategories.includes('notes') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Notes ({totals.notes})</h3>
                </div>
                <div className="p-4 space-y-3">
                  {isLoadingNotes ? (
                    <div className="flex items-center justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  ) : linkedNotes && linkedNotes.length > 0 ? (
                    linkedNotes.map((note: Note) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handleNoteClick(note)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                              <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-[var(--foreground)] truncate mb-0.5">{note.title}</h4>
                            <div className="text-sm text-[var(--muted-foreground)] line-clamp-1">
                              {note.content || 'No content'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('NOTE', note.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink note"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-sm">No notes linked</p>
                      <button
                        onClick={() => openAddLinkModal('NOTE')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quotes */}
            {visibleCategories.includes('quotes') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Quotes</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.quotes && relatedEntities.quotes.length > 0 ? (
                    relatedEntities.quotes.map((quote: QuoteSearchResult) => (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handleQuoteClick(quote)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{quote.quoteNumber}</h4>
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              {quote.jobName && <span>{quote.jobName} • </span>}
                              {quote.entityDate && <span>{quote.entityDate}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('QUOTE', quote.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink quote"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">No quotes linked</p>
                      <button
                        onClick={() => openAddLinkModal('QUOTE')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a quote
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders */}
            {visibleCategories.includes('orders') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Orders</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.orders && relatedEntities.orders.length > 0 ? (
                    relatedEntities.orders.map((order: OrderSearchResult) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="9" cy="21" r="1"/>
                              <circle cx="20" cy="21" r="1"/>
                              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{order.orderNumber}</h4>
                              {order.status && (
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                                  {order.status}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              {order.jobName && <span>{order.jobName} • </span>}
                              {order.entityDate && <span>{order.entityDate}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('ORDER', order.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink order"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-teal-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-sm">No orders linked</p>
                      <button
                        onClick={() => openAddLinkModal('ORDER')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add an order
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoices */}
            {visibleCategories.includes('invoices') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Invoices</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.invoices && relatedEntities.invoices.length > 0 ? (
                    relatedEntities.invoices.map((invoice: InvoiceSearchResult) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                              <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{invoice.invoiceNumber}</h4>
                              {invoice.status && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                  {invoice.status}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              {invoice.entityDate && <span>{invoice.entityDate}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('INVOICE', invoice.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink invoice"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">No invoices linked</p>
                      <button
                        onClick={() => openAddLinkModal('INVOICE')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add an invoice
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checks */}
            {visibleCategories.includes('checks') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Checks</h3>
                </div>
                <div className="p-4 space-y-3">
                  {relatedEntities?.checks && relatedEntities.checks.length > 0 ? (
                    relatedEntities.checks.map((check: CheckSearchResult) => (
                      <div
                        key={check.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                        onClick={() => handleCheckClick(check)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="5" width="20" height="14" rx="2"/>
                              <line x1="2" y1="10" x2="22" y2="10"/>
                              <line x1="6" y1="15" x2="10" y2="15"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{check.checkNumber}</h4>
                              {check.status && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-medium">
                                  {check.status}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--muted-foreground)]">
                              {check.entityDate && <span>{check.entityDate}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('CHECK', check.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink check"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-sm">No checks linked</p>
                      <button
                        onClick={() => openAddLinkModal('CHECK')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a check
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        jobId={jobId}
        initialEntityType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />
    </>
  );
}

/**
 * Connected Entities Section Component
 * Displays and manages linked entities for a Job
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  useCRMJobRelatedEntities,
  useDeleteCRMLinkByEntities,
} from '../../hooks/useCRMApi';
import type { Company, Contact, PreOpportunity, EntityType } from '../../lib/crm-graphql';
import { AddLinkModal } from '../modals/AddLinkModal';

interface ConnectedEntitiesSectionProps {
  jobId: string;
  onCompanyClick?: (company: Company) => void;
  onContactClick?: (contact: Contact) => void;
}

// Category types for filtering
type EntityCategory = 'contacts' | 'companies' | 'pre-opportunities' | 'quotes' | 'orders' | 'invoices' | 'checks' | 'documents';
type LinkEntityType = 'COMPANY' | 'CONTACT';

const ALL_CATEGORIES: EntityCategory[] = [
  'contacts',
  'companies',
  'pre-opportunities',
  'quotes',
  'orders',
  'invoices',
  'checks',
  'documents',
];

export function ConnectedEntitiesSection({
  jobId,
  onCompanyClick,
  onContactClick,
}: ConnectedEntitiesSectionProps) {
  const [visibleCategories, setVisibleCategories] = useState<EntityCategory[]>(ALL_CATEGORIES);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<LinkEntityType>('COMPANY');

  // Open modal with specific entity type
  const openAddLinkModal = (entityType: LinkEntityType) => {
    setAddLinkEntityType(entityType);
    setShowAddLinkModal(true);
  };

  // Fetch related entities from API
  const { 
    data: relatedEntities, 
    isLoading, 
    error, 
    refetch 
  } = useCRMJobRelatedEntities(jobId);

  // Delete link mutation
  const deleteLinkMutation = useDeleteCRMLinkByEntities();

  // Calculate totals
  const totals = useMemo(() => {
    if (!relatedEntities) {
      return {
        companies: 0,
        contacts: 0,
        'pre-opportunities': 0,
        quotes: 0,
        orders: 0,
        invoices: 0,
        checks: 0,
        documents: 0,
        total: 0,
      };
    }

    const companiesCount = relatedEntities.companies?.length || 0;
    const contactsCount = relatedEntities.contacts?.length || 0;
    const preOppsCount = relatedEntities.preOpportunities?.length || 0;

    return {
      companies: companiesCount,
      contacts: contactsCount,
      'pre-opportunities': preOppsCount,
      quotes: 0,
      orders: 0,
      invoices: 0,
      checks: 0,
      documents: 0,
      total: companiesCount + contactsCount + preOppsCount,
    };
  }, [relatedEntities]);

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
  const handleUnlink = async (entityType: 'COMPANY' | 'CONTACT', entityId: string) => {
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: 'JOB' as EntityType,
        sourceEntityId: jobId,
        targetEntityType: entityType as EntityType,
        targetEntityId: entityId,
      });
      refetch();
    } catch (error) {
      console.error('Failed to unlink entity:', error);
    }
  };

  // Handle successful link creation
  const handleLinkSuccess = () => {
    refetch();
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
              onClick={() => openAddLinkModal('COMPANY')}
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
              Pre-Opportunities ({totals['pre-opportunities']})
            </button>
            {/* Coming Soon categories */}
            {(['quotes', 'orders', 'invoices', 'checks', 'documents'] as EntityCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes(category)
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)} (0)
              </button>
            ))}
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
                    relatedEntities.contacts.map((contact: Contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group"
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => onContactClick?.(contact)}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-[var(--foreground)]">
                              {contact.firstName} {contact.lastName}
                            </h4>
                            {contact.role && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {contact.role}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            {contact.email && <span>{contact.email}</span>}
                            {contact.phone && <span>• {contact.phone}</span>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnlink('CONTACT', contact.id);
                          }}
                          disabled={deleteLinkMutation.isPending}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Unlink contact"
                        >
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
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
                          onClick={() => onCompanyClick?.(company)}
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
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer"
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
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <p className="text-sm">No pre-opportunities linked</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Coming Soon Categories */}
            {(['quotes', 'orders', 'invoices', 'checks', 'documents'] as EntityCategory[]).map((category) => {
              if (!visibleCategories.includes(category)) return null;

              const displayName = category.charAt(0).toUpperCase() + category.slice(1);

              return (
                <div key={category} className="border border-[var(--border)] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)]">{displayName}</h3>
                  </div>
                  <div className="p-4">
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--muted)] rounded-full mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-[var(--muted-foreground)]">Coming Soon</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {displayName} linking will be available soon
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
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

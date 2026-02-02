/**
 * Connected Entities Section Component - CENTRALIZED
 * A reusable component for displaying and managing linked entities
 *
 * Can be used by any page (Jobs, Contacts, Companies, etc.) to show related entities.
 * Pages can configure which entity types they want to display.
 *
 * Uses the centralized relatedEntities endpoint for fetching all related data.
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  useRelatedEntities,
  useDeleteCRMLinkByEntities,
} from '../hooks/useCRMApi';
import type {
  CRMEntityType,
  RelatedEntitiesSourceType,
  RelatedEntityCompany,
  RelatedEntityContact,
  RelatedEntityPreOpportunity,
  RelatedEntityQuote,
  RelatedEntityOrder,
  RelatedEntityInvoice,
  RelatedEntityCheck,
  RelatedEntityTask,
  RelatedEntityNote,
  RelatedEntityJob,
  RelatedEntityCustomer,
  RelatedEntityFactory,
} from '../lib/crm-graphql';
import { AddLinkModal } from './AddLinkModal';
import { linkToasts } from '../lib/toast';
import { RelatedEntityHoverCard } from './RelatedEntityHoverCard';
import { fetchFilesByLinkedEntity, formatFileSize, getFilePresignedUrl, type FileResponse, type FileEntityType } from '../lib/graphql/files';
import { showErrorToast } from '../lib/toast';
import { CreateNoteModal } from '../notes/modals/CreateNoteModal';
import { CreateTaskModal } from '../tasks/modals/CreateTaskModal';
import type { SelectedLink } from '../notes/components/LinkSelector';
import { ConnectedEntitiesTableView } from './ConnectedEntitiesTableView';

// View mode type
export type ViewMode = 'cards' | 'table';

// ============================================================================
// Types
// ============================================================================

// Category types for filtering (user-facing)
export type EntityCategory = 'contacts' | 'companies' | 'pre-opportunities' | 'tasks' | 'notes' | 'quotes' | 'orders' | 'invoices' | 'checks' | 'jobs' | 'files' | 'customers' | 'factories';

// API entity types for linking
export type LinkEntityType = 'COMPANY' | 'CONTACT' | 'TASK' | 'NOTE' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'JOB' | 'FILE' | 'CUSTOMER' | 'FACTORY';

// Source entity types - what entity is hosting this connected entities section
export type SourceEntityType = 'JOB' | 'CONTACT' | 'COMPANY' | 'PRE_OPPORTUNITY' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'CHECK' | 'TASK' | 'NOTE' | 'FACTORY' | 'CUSTOMER';

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
  FACTORY: 'FACTORIES',
  CUSTOMER: 'CUSTOMERS',
};

// Map source entity type to link type for creating notes/tasks with auto-linking
const SOURCE_TYPE_TO_LINK_TYPE: Record<SourceEntityType, SelectedLink['type']> = {
  JOB: 'JOB',
  CONTACT: 'CONTACT',
  COMPANY: 'COMPANY',
  PRE_OPPORTUNITY: 'PRE_OPPORTUNITY',
  QUOTE: 'QUOTE',
  ORDER: 'ORDER',
  INVOICE: 'INVOICE',
  CHECK: 'CHECK',
  TASK: 'TASK',
  NOTE: 'NOTE',
  FACTORY: 'FACTORY',
  CUSTOMER: 'CUSTOMER',
};

export interface ConnectedEntitiesSectionProps {
  /** The ID of the source entity (e.g., job ID, contact ID) */
  entityId: string;
  /** The type of the source entity */
  sourceEntityType: SourceEntityType;
  /** Which entity categories to show. If not provided, shows all. */
  enabledCategories?: EntityCategory[];
  /** Which entity categories should be read-only (view only, no add/unlink). */
  readOnlyCategories?: EntityCategory[];
  /** Custom title for the section */
  title?: string;
  /** Whether to show the "Add Link" button */
  showAddLinkButton?: boolean;
  /** Key to trigger a refetch of linked entities when changed */
  refreshKey?: number;
  /** Default view mode (cards or table) */
  defaultViewMode?: ViewMode;
  /** Click handlers for different entity types */
  onCompanyClick?: (company: RelatedEntityCompany) => void;
  onContactClick?: (contact: RelatedEntityContact) => void;
  onPreOpportunityClick?: (preOpp: RelatedEntityPreOpportunity) => void;
  onQuoteClick?: (quote: RelatedEntityQuote) => void;
  onOrderClick?: (order: RelatedEntityOrder) => void;
  onInvoiceClick?: (invoice: RelatedEntityInvoice) => void;
  onCheckClick?: (check: RelatedEntityCheck) => void;
  onTaskClick?: (task: RelatedEntityTask) => void;
  onNoteClick?: (note: RelatedEntityNote) => void;
  onJobClick?: (job: RelatedEntityJob) => void;
  onFileClick?: (file: FileResponse) => void;
  onCustomerClick?: (customer: RelatedEntityCustomer) => void;
  onFactoryClick?: (factory: RelatedEntityFactory) => void;
}

// Default categories - all available
const ALL_CATEGORIES: EntityCategory[] = [
  'contacts',
  'companies',
  'customers',
  'factories',
  'pre-opportunities',
  'tasks',
  'notes',
  'quotes',
  'orders',
  'invoices',
  'checks',
  'jobs',
  'files',
];

// ============================================================================
// Entity Grid Header Component
// ============================================================================

interface EntityGridHeaderProps {
  title: string;
  entityType: LinkEntityType;
  hasEntities: boolean;
  onAddLink: (entityType: LinkEntityType) => void;
  onCreateNew?: () => void;
  readOnly?: boolean;
}

function EntityGridHeader({ title, entityType, hasEntities, onAddLink, onCreateNew, readOnly = false }: EntityGridHeaderProps) {
  return (
    <div className="px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)] flex items-center justify-between">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
      {hasEntities && !readOnly && (
        <div className="flex items-center gap-2">
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
              </svg>
              Create
            </button>
          )}
          <button
            onClick={() => onAddLink(entityType)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Link
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// View Mode Toggle Component
// ============================================================================

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center bg-[var(--muted)]/50 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'cards'
            ? 'bg-white text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        title="Card View"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Cards
      </button>
      <button
        onClick={() => onViewModeChange('table')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          viewMode === 'table'
            ? 'bg-white text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        }`}
        title="Table View"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
        Table
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConnectedEntitiesSection({
  entityId,
  sourceEntityType,
  enabledCategories,
  readOnlyCategories = [],
  title = 'Connected Entities',
  showAddLinkButton = true,
  refreshKey,
  defaultViewMode = 'cards',
  onCompanyClick,
  onContactClick,
  onPreOpportunityClick,
  onQuoteClick,
  onOrderClick,
  onInvoiceClick,
  onCheckClick,
  onTaskClick,
  onNoteClick,
  onJobClick,
  onFileClick,
  onCustomerClick,
  onFactoryClick,
}: ConnectedEntitiesSectionProps) {
  const router = useRouter();

  // Determine available categories based on props
  const availableCategories = enabledCategories || ALL_CATEGORIES;

  // Check if a category is read-only
  const isCategoryReadOnly = (category: EntityCategory) => readOnlyCategories.includes(category);

  const [visibleCategories, setVisibleCategories] = useState<EntityCategory[]>(availableCategories);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<LinkEntityType>('COMPANY');
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Open modal with specific entity type
  const openAddLinkModal = (entityType?: LinkEntityType) => {
    if (entityType) {
      setAddLinkEntityType(entityType);
    }
    setShowAddLinkModal(true);
  };

  // Fetch related entities from API using centralized endpoint
  const {
    data: relatedEntities,
    isLoading,
    error,
    refetch
  } = useRelatedEntities(entityId, SOURCE_TYPE_TO_API_TYPE[sourceEntityType]);

  // Refetch when refreshKey changes (e.g., after save)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      refetch();
    }
  }, [refreshKey, refetch]);

  // Fetch linked files separately (uses different API endpoint)
  const {
    data: linkedFiles = [],
    isLoading: filesLoading,
    refetch: refetchFiles
  } = useQuery({
    queryKey: ['files', 'byEntity', entityId, sourceEntityType],
    queryFn: () => fetchFilesByLinkedEntity(sourceEntityType as FileEntityType, entityId),
    enabled: availableCategories.includes('files'),
  });

  // Delete link mutation
  const deleteLinkMutation = useDeleteCRMLinkByEntities();

  // Calculate totals from the centralized response
  const totals = useMemo(() => {
    const companiesCount = relatedEntities?.companies?.length || 0;
    const contactsCount = relatedEntities?.contacts?.length || 0;
    const customersCount = relatedEntities?.customers?.length || 0;
    const factoriesCount = relatedEntities?.factories?.length || 0;
    const preOppsCount = relatedEntities?.preOpportunities?.length || 0;
    const quotesCount = relatedEntities?.quotes?.length || 0;
    const ordersCount = relatedEntities?.orders?.length || 0;
    const invoicesCount = relatedEntities?.invoices?.length || 0;
    const checksCount = relatedEntities?.checks?.length || 0;
    const tasksCount = relatedEntities?.tasks?.length || 0;
    const notesCount = relatedEntities?.notes?.length || 0;
    const jobsCount = relatedEntities?.jobs?.length || 0;
    const filesCount = linkedFiles?.length || 0;

    return {
      companies: companiesCount,
      contacts: contactsCount,
      customers: customersCount,
      factories: factoriesCount,
      'pre-opportunities': preOppsCount,
      quotes: quotesCount,
      orders: ordersCount,
      invoices: invoicesCount,
      checks: checksCount,
      tasks: tasksCount,
      notes: notesCount,
      jobs: jobsCount,
      files: filesCount,
      total: companiesCount + contactsCount + customersCount + factoriesCount + preOppsCount + quotesCount + ordersCount + invoicesCount + checksCount + tasksCount + notesCount + jobsCount + filesCount,
    };
  }, [relatedEntities, linkedFiles]);

  // Toggle category visibility
  const toggleCategory = (category: EntityCategory) => {
    if (visibleCategories.includes(category)) {
      setVisibleCategories(visibleCategories.filter(c => c !== category));
    } else {
      setVisibleCategories([...visibleCategories, category]);
    }
  };

  const toggleAllCategories = () => {
    if (visibleCategories.length === availableCategories.length) {
      setVisibleCategories([]);
    } else {
      setVisibleCategories([...availableCategories]);
    }
  };

  // Handle unlinking an entity
  const handleUnlink = async (entityType: LinkEntityType, targetEntityId: string) => {
    try {
      await deleteLinkMutation.mutateAsync({
        sourceEntityType: sourceEntityType as CRMEntityType,
        sourceEntityId: entityId,
        targetEntityType: entityType as CRMEntityType,
        targetEntityId: targetEntityId,
      });

      // Get entity type label for toast
      const entityTypeLabels: Record<LinkEntityType, string> = {
        COMPANY: 'Company',
        CONTACT: 'Contact',
        CUSTOMER: 'Customer',
        FACTORY: 'Factory',
        TASK: 'Task',
        NOTE: 'Note',
        PRE_OPPORTUNITY: 'Pre-Opportunity',
        QUOTE: 'Quote',
        ORDER: 'Order',
        INVOICE: 'Invoice',
        CHECK: 'Check',
        JOB: 'Job',
        FILE: 'File',
      };

      linkToasts.deleteSuccess(entityTypeLabels[entityType]);

      // Refetch all related entities
      refetch();
    } catch (unlinkError) {
      console.error('Failed to unlink entity:', unlinkError);
      linkToasts.deleteError();
    }
  };

  // Handle successful link creation
  const handleLinkSuccess = () => {
    refetch();
    refetchFiles();
  };

  // Handle company click - navigate to companies page
  const handleCompanyClick = (company: RelatedEntityCompany) => {
    if (onCompanyClick) {
      onCompanyClick(company);
    } else {
      router.push(`/companies?id=${company.id}`);
    }
  };

  // Handle contact click - navigate to contacts page
  const handleContactClick = (contact: RelatedEntityContact) => {
    if (onContactClick) {
      onContactClick(contact);
    } else {
      router.push(`/contacts?id=${contact.id}`);
    }
  };

  // Handle pre-opportunity click - navigate to pre-opportunities page
  const handlePreOpportunityClick = (preOpp: RelatedEntityPreOpportunity) => {
    if (onPreOpportunityClick) {
      onPreOpportunityClick(preOpp);
    } else {
      router.push(`/pre-opportunities/${preOpp.id}`);
    }
  };

  // Handle task click - navigate to tasks page with the task open
  const handleTaskClick = (task: RelatedEntityTask) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      router.push(`/tasks?id=${task.id}`);
    }
  };

  // Handle note click - navigate to notes page with the note open
  const handleNoteClick = (note: RelatedEntityNote) => {
    if (onNoteClick) {
      onNoteClick(note);
    } else {
      router.push(`/notes?id=${note.id}`);
    }
  };

  // Handle quote click - navigate to quote detail page
  const handleQuoteClick = (quote: RelatedEntityQuote) => {
    if (onQuoteClick) {
      onQuoteClick(quote);
    } else {
      router.push(`/quotes/${quote.id}`);
    }
  };

  // Handle order click - navigate to order detail page
  const handleOrderClick = (order: RelatedEntityOrder) => {
    if (onOrderClick) {
      onOrderClick(order);
    } else {
      router.push(`/orders/${order.id}`);
    }
  };

  // Handle invoice click - navigate to invoice detail page
  const handleInvoiceClick = (invoice: RelatedEntityInvoice) => {
    if (onInvoiceClick) {
      onInvoiceClick(invoice);
    } else {
      router.push(`/invoices/${invoice.id}`);
    }
  };

  // Handle check click - navigate to commissions detail page
  const handleCheckClick = (check: RelatedEntityCheck) => {
    if (onCheckClick) {
      onCheckClick(check);
    } else {
      router.push(`/commissions/${check.id}`);
    }
  };

  // Handle job click - navigate to jobs page
  const handleJobClick = (job: RelatedEntityJob) => {
    if (onJobClick) {
      onJobClick(job);
    } else {
      router.push(`/jobs/${job.id}`);
    }
  };

  // Handle customer click - navigate to customers page
  const handleCustomerClick = (customer: RelatedEntityCustomer) => {
    if (onCustomerClick) {
      onCustomerClick(customer);
    } else {
      router.push(`/customers/${customer.id}/edit`);
    }
  };

  // Handle factory click - navigate to factory/manufacturer page
  const handleFactoryClick = (factory: RelatedEntityFactory) => {
    if (onFactoryClick) {
      onFactoryClick(factory);
    } else {
      // Navigate to warehouse manufacturer profiles
      router.push(`/warehouse/manufacturer-profiles/${factory.id}/edit`);
    }
  };

  // Handle file click - open file or download
  const handleFileClick = async (file: FileResponse) => {
    if (onFileClick) {
      onFileClick(file);
    } else {
      try {
        const url = await getFilePresignedUrl(file.id);
        if (url) {
          window.open(url, '_blank');
        } else {
          showErrorToast('Unable to open file', {
            description: 'Could not generate download URL',
          });
        }
      } catch (error) {
        showErrorToast('Failed to open file', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  // Check if a category is enabled
  const isCategoryEnabled = (category: EntityCategory) => availableCategories.includes(category);

  // Generic entity click handler for table view
  const handleEntityClick = (type: EntityCategory, entity: unknown) => {
    switch (type) {
      case 'contacts':
        handleContactClick(entity as RelatedEntityContact);
        break;
      case 'companies':
        handleCompanyClick(entity as RelatedEntityCompany);
        break;
      case 'customers':
        handleCustomerClick(entity as RelatedEntityCustomer);
        break;
      case 'factories':
        handleFactoryClick(entity as RelatedEntityFactory);
        break;
      case 'pre-opportunities':
        handlePreOpportunityClick(entity as RelatedEntityPreOpportunity);
        break;
      case 'quotes':
        handleQuoteClick(entity as RelatedEntityQuote);
        break;
      case 'orders':
        handleOrderClick(entity as RelatedEntityOrder);
        break;
      case 'invoices':
        handleInvoiceClick(entity as RelatedEntityInvoice);
        break;
      case 'checks':
        handleCheckClick(entity as RelatedEntityCheck);
        break;
      case 'tasks':
        handleTaskClick(entity as RelatedEntityTask);
        break;
      case 'notes':
        handleNoteClick(entity as RelatedEntityNote);
        break;
      case 'jobs':
        handleJobClick(entity as RelatedEntityJob);
        break;
      case 'files':
        handleFileClick(entity as FileResponse);
        break;
    }
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
            <div className="flex items-center gap-3">
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              {showAddLinkButton && (
                <button
                  onClick={() => openAddLinkModal()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 5v10M5 10h10" strokeLinecap="round"/>
                  </svg>
                  Add Link
                </button>
              )}
            </div>
          </div>

          {/* Entity Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={toggleAllCategories}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visibleCategories.length === availableCategories.length
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
              }`}
            >
              All ({totals.total})
            </button>
            {isCategoryEnabled('contacts') && (
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
            )}
            {isCategoryEnabled('companies') && (
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
            )}
            {isCategoryEnabled('customers') && (
              <button
                onClick={() => toggleCategory('customers')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('customers')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Customers ({totals.customers})
              </button>
            )}
            {isCategoryEnabled('factories') && (
              <button
                onClick={() => toggleCategory('factories')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('factories')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Manufacturers ({totals.factories})
              </button>
            )}
            {isCategoryEnabled('pre-opportunities') && (
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
            )}
            {isCategoryEnabled('tasks') && (
              <button
                onClick={() => toggleCategory('tasks')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('tasks')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Tasks ({totals.tasks})
              </button>
            )}
            {isCategoryEnabled('notes') && (
              <button
                onClick={() => toggleCategory('notes')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('notes')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Notes ({totals.notes})
              </button>
            )}
            {isCategoryEnabled('quotes') && (
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
            )}
            {isCategoryEnabled('orders') && (
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
            )}
            {isCategoryEnabled('invoices') && (
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
            )}
            {isCategoryEnabled('checks') && (
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
            )}
            {isCategoryEnabled('jobs') && (
              <button
                onClick={() => toggleCategory('jobs')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('jobs')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Jobs ({totals.jobs})
              </button>
            )}
            {isCategoryEnabled('files') && (
              <button
                onClick={() => toggleCategory('files')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  visibleCategories.includes('files')
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                }`}
              >
                Files ({totals.files})
              </button>
            )}
          </div>
        </div>

        {/* View Content - Cards or Table */}
        {viewMode === 'table' ? (
          <ConnectedEntitiesTableView
            contacts={relatedEntities?.contacts || []}
            companies={relatedEntities?.companies || []}
            customers={relatedEntities?.customers || []}
            factories={relatedEntities?.factories || []}
            preOpportunities={relatedEntities?.preOpportunities || []}
            quotes={relatedEntities?.quotes || []}
            orders={relatedEntities?.orders || []}
            invoices={relatedEntities?.invoices || []}
            checks={relatedEntities?.checks || []}
            tasks={relatedEntities?.tasks || []}
            notes={relatedEntities?.notes || []}
            jobs={relatedEntities?.jobs || []}
            files={linkedFiles || []}
            visibleCategories={visibleCategories}
            readOnlyCategories={readOnlyCategories}
            onEntityClick={handleEntityClick}
            onUnlink={handleUnlink}
            isUnlinking={deleteLinkMutation.isPending}
          />
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {/* Contacts */}
              {isCategoryEnabled('contacts') && visibleCategories.includes('contacts') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Contacts"
                  entityType="CONTACT"
                  hasEntities={Boolean(relatedEntities?.contacts && relatedEntities.contacts.length > 0)}
                  onAddLink={openAddLinkModal}
                />
                <div className="p-4">
                  {relatedEntities?.contacts && relatedEntities.contacts.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.contacts.map((contact: RelatedEntityContact) => {
                      // Generate initials and color for contact avatar
                      const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?';
                      const colors = [
                        'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                        'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
                      ];
                      const colorIndex = Math.abs(contact.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % colors.length;
                      const avatarColor = colors[colorIndex];

                      return (
                        <RelatedEntityHoverCard key={contact.id} entity={contact} type="contact">
                          <div
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
                                <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                  {contact.email && (
                                    <span className="flex items-center gap-1.5 truncate">
                                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      {contact.email}
                                    </span>
                                  )}
                                  {contact.phone && (
                                    <span className="flex items-center gap-1.5 flex-shrink-0">
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
                        </RelatedEntityHoverCard>
                      );
                    })}
                    </div>
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
            {isCategoryEnabled('companies') && visibleCategories.includes('companies') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Companies"
                  entityType="COMPANY"
                  hasEntities={Boolean(relatedEntities?.companies && relatedEntities.companies.length > 0)}
                  onAddLink={openAddLinkModal}
                />
                <div className="p-4">
                  {relatedEntities?.companies && relatedEntities.companies.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.companies.map((company: RelatedEntityCompany) => (
                      <RelatedEntityHoverCard key={company.id} entity={company} type="company">
                        <div
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group"
                        >
                          <div
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => handleCompanyClick(company)}
                          >
                            {/* Company Icon */}
                            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-medium text-[var(--foreground)] truncate">{company.name}</h4>
                                {company.companySourceType && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                    company.companySourceType === 'MANUFACTURER'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {company.phone && (
                                  <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {company.phone}
                                  </span>
                                )}
                                {company.website && (
                                  <span className="flex items-center gap-1.5 truncate">
                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                    {company.website}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('COMPANY', company.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink company"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
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

            {/* Customers */}
            {isCategoryEnabled('customers') && visibleCategories.includes('customers') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Customers"
                  entityType="CUSTOMER"
                  hasEntities={Boolean(relatedEntities?.customers && relatedEntities.customers.length > 0)}
                  onAddLink={openAddLinkModal}
                  readOnly={isCategoryReadOnly('customers')}
                />
                <div className="p-4">
                  {relatedEntities?.customers && relatedEntities.customers.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.customers.map((customer: RelatedEntityCustomer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group"
                      >
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => handleCustomerClick(customer)}
                        >
                          {/* Customer Icon */}
                          <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{customer.companyName}</h4>
                              {customer.isParent && (
                                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium flex-shrink-0">
                                  Parent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isCategoryReadOnly('customers') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('CUSTOMER', customer.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink customer"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <p className="text-sm">No customers linked</p>
                      {!isCategoryReadOnly('customers') && (
                        <button
                          onClick={() => openAddLinkModal('CUSTOMER')}
                          className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                          + Add a customer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Factories */}
            {isCategoryEnabled('factories') && visibleCategories.includes('factories') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Manufacturers"
                  entityType="FACTORY"
                  hasEntities={Boolean(relatedEntities?.factories && relatedEntities.factories.length > 0)}
                  onAddLink={openAddLinkModal}
                  readOnly={isCategoryReadOnly('factories')}
                />
                <div className="p-4">
                  {relatedEntities?.factories && relatedEntities.factories.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.factories.map((factory: RelatedEntityFactory) => (
                      <div
                        key={factory.id}
                        className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors group"
                      >
                        <div
                          className="flex items-center gap-3 flex-1 cursor-pointer"
                          onClick={() => handleFactoryClick(factory)}
                        >
                          {/* Factory Icon */}
                          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
                              <path d="M9 20v-6h6v6"/>
                              <path d="M9 10h.01M15 10h.01"/>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-[var(--foreground)] truncate">{factory.title || 'Unnamed Factory'}</h4>
                              {factory.published === false && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium flex-shrink-0">
                                  Unpublished
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                              {factory.accountNumber && (
                                <span className="flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                  </svg>
                                  {factory.accountNumber}
                                </span>
                              )}
                              {factory.email && (
                                <span className="flex items-center gap-1.5 truncate">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {factory.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isCategoryReadOnly('factories') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('FACTORY', factory.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink factory"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                          <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
                          <path d="M9 20v-6h6v6"/>
                          <path d="M9 10h.01M15 10h.01"/>
                        </svg>
                      </div>
                      <p className="text-sm">No manufacturers linked</p>
                      {!isCategoryReadOnly('factories') && (
                        <button
                          onClick={() => openAddLinkModal('FACTORY')}
                          className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                          + Add a manufacturer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pre-Opportunities */}
            {isCategoryEnabled('pre-opportunities') && visibleCategories.includes('pre-opportunities') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Pre-Opportunities"
                  entityType="PRE_OPPORTUNITY"
                  hasEntities={Boolean(relatedEntities?.preOpportunities && relatedEntities.preOpportunities.length > 0)}
                  onAddLink={openAddLinkModal}
                />
                <div className="p-4">
                  {relatedEntities?.preOpportunities && relatedEntities.preOpportunities.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.preOpportunities.map((preOpp: RelatedEntityPreOpportunity) => (
                      <RelatedEntityHoverCard key={preOpp.id} entity={preOpp} type="preOpportunity">
                        <div
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                          onClick={() => handlePreOpportunityClick(preOpp)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {/* Pre-Opportunity Icon */}
                            <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-white flex-shrink-0">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-medium text-[var(--foreground)] truncate">{preOpp.entityNumber}</h4>
                                {preOpp.status && (
                                  <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded text-xs font-medium flex-shrink-0">
                                    {preOpp.status.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {preOpp.entityDate && <span>{preOpp.entityDate}</span>}
                                {preOpp.expDate && <span>Exp: {preOpp.expDate}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('PRE_OPPORTUNITY', preOpp.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink pre-opportunity"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
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
            {isCategoryEnabled('tasks') && visibleCategories.includes('tasks') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title={`Tasks (${totals.tasks})`}
                  entityType="TASK"
                  hasEntities={Boolean(relatedEntities?.tasks && relatedEntities.tasks.length > 0)}
                  onAddLink={openAddLinkModal}
                  onCreateNew={() => setShowCreateTaskModal(true)}
                />
                <div className="p-4">
                  {relatedEntities?.tasks && relatedEntities.tasks.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.tasks.map((task: RelatedEntityTask) => (
                      <RelatedEntityHoverCard key={task.id} entity={task} type="task">
                        <div
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
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink task"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-sm">No tasks linked</p>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <button
                          onClick={() => setShowCreateTaskModal(true)}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          Create a task
                        </button>
                        <span className="text-[var(--muted-foreground)]">or</span>
                        <button
                          onClick={() => openAddLinkModal('TASK')}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          Link an existing task
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {isCategoryEnabled('notes') && visibleCategories.includes('notes') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title={`Notes (${totals.notes})`}
                  entityType="NOTE"
                  hasEntities={Boolean(relatedEntities?.notes && relatedEntities.notes.length > 0)}
                  onAddLink={openAddLinkModal}
                  onCreateNew={() => setShowCreateNoteModal(true)}
                />
                <div className="p-4">
                  {relatedEntities?.notes && relatedEntities.notes.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.notes.map((note: RelatedEntityNote) => (
                      <RelatedEntityHoverCard key={note.id} entity={note} type="note">
                        <div
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                          onClick={() => handleNoteClick(note)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink note"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-500">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <p className="text-sm">No notes linked</p>
                      <div className="flex items-center justify-center gap-3 mt-2">
                        <button
                          onClick={() => setShowCreateNoteModal(true)}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          Create a note
                        </button>
                        <span className="text-[var(--muted-foreground)]">or</span>
                        <button
                          onClick={() => openAddLinkModal('NOTE')}
                          className="text-sm text-[var(--primary)] hover:underline"
                        >
                          Link an existing note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quotes */}
            {isCategoryEnabled('quotes') && visibleCategories.includes('quotes') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Quotes"
                  entityType="QUOTE"
                  hasEntities={Boolean(relatedEntities?.quotes && relatedEntities.quotes.length > 0)}
                  onAddLink={openAddLinkModal}
                  readOnly={isCategoryReadOnly('quotes')}
                />
                <div className="p-4">
                  {relatedEntities?.quotes && relatedEntities.quotes.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.quotes.map((quote: RelatedEntityQuote) => (
                      <RelatedEntityHoverCard key={quote.id} entity={quote} type="quote">
                        <div
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
                                {quote.status && (
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                    {quote.status}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {quote.pipelineStage && <span>{quote.pipelineStage}</span>}
                                {quote.entityDate && <span>{quote.entityDate}</span>}
                                {quote.expDate && <span>Exp: {quote.expDate}</span>}
                              </div>
                            </div>
                          </div>
                          {!isCategoryReadOnly('quotes') && (
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
                          )}
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">No quotes linked</p>
                      {!isCategoryReadOnly('quotes') && (
                        <button
                          onClick={() => openAddLinkModal('QUOTE')}
                          className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                          + Add a quote
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders */}
            {isCategoryEnabled('orders') && visibleCategories.includes('orders') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Orders"
                  entityType="ORDER"
                  hasEntities={Boolean(relatedEntities?.orders && relatedEntities.orders.length > 0)}
                  onAddLink={openAddLinkModal}
                  readOnly={isCategoryReadOnly('orders')}
                />
                <div className="p-4">
                  {relatedEntities?.orders && relatedEntities.orders.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.orders.map((order: RelatedEntityOrder) => (
                      <RelatedEntityHoverCard key={order.id} entity={order} type="order">
                        <div
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
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {order.orderType && <span>{order.orderType}</span>}
                                {order.entityDate && <span>{order.entityDate}</span>}
                                {order.shipDate && <span>Ship: {order.shipDate}</span>}
                              </div>
                            </div>
                          </div>
                          {!isCategoryReadOnly('orders') && (
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
                          )}
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-teal-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-sm">No orders linked</p>
                      {!isCategoryReadOnly('orders') && (
                        <button
                          onClick={() => openAddLinkModal('ORDER')}
                          className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                          + Add an order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoices */}
            {isCategoryEnabled('invoices') && visibleCategories.includes('invoices') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Invoices"
                  entityType="INVOICE"
                  hasEntities={Boolean(relatedEntities?.invoices && relatedEntities.invoices.length > 0)}
                  onAddLink={openAddLinkModal}
                  readOnly={isCategoryReadOnly('invoices')}
                />
                <div className="p-4">
                  {relatedEntities?.invoices && relatedEntities.invoices.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.invoices.map((invoice: RelatedEntityInvoice) => (
                      <RelatedEntityHoverCard key={invoice.id} entity={invoice} type="invoice">
                        <div
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
                                {invoice.locked && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                    <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {invoice.entityDate && <span>{invoice.entityDate}</span>}
                                {invoice.dueDate && <span>Due: {invoice.dueDate}</span>}
                              </div>
                            </div>
                          </div>
                          {!isCategoryReadOnly('invoices') && (
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
                          )}
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">No invoices linked</p>
                      {!isCategoryReadOnly('invoices') && (
                        <button
                          onClick={() => openAddLinkModal('INVOICE')}
                          className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                          + Add an invoice
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checks */}
            {isCategoryEnabled('checks') && visibleCategories.includes('checks') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title="Checks"
                  entityType="CHECK"
                  hasEntities={Boolean(relatedEntities?.checks && relatedEntities.checks.length > 0)}
                  onAddLink={openAddLinkModal}
                  readOnly={isCategoryReadOnly('checks')}
                />
                <div className="p-4">
                  {relatedEntities?.checks && relatedEntities.checks.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.checks.map((check: RelatedEntityCheck) => (
                      <RelatedEntityHoverCard key={check.id} entity={check} type="check">
                        <div
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
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {check.commissionMonth && <span>{check.commissionMonth}</span>}
                                {check.enteredCommissionAmount && <span>${check.enteredCommissionAmount.toLocaleString()}</span>}
                                {check.entityDate && <span>{check.entityDate}</span>}
                              </div>
                            </div>
                          </div>
                          {!isCategoryReadOnly('checks') && (
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
                          )}
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rose-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-sm">No checks linked</p>
                      {!isCategoryReadOnly('checks') && (
                        <button
                          onClick={() => openAddLinkModal('CHECK')}
                          className="mt-2 text-sm text-[var(--primary)] hover:underline"
                        >
                          + Add a check
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Jobs */}
            {isCategoryEnabled('jobs') && visibleCategories.includes('jobs') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title={`Jobs (${totals.jobs})`}
                  entityType="JOB"
                  hasEntities={Boolean(relatedEntities?.jobs && relatedEntities.jobs.length > 0)}
                  onAddLink={openAddLinkModal}
                />
                <div className="p-4">
                  {relatedEntities?.jobs && relatedEntities.jobs.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {relatedEntities.jobs.map((job: RelatedEntityJob) => (
                      <RelatedEntityHoverCard key={job.id} entity={job} type="job">
                        <div
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                          onClick={() => handleJobClick(job)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white flex-shrink-0">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-medium text-[var(--foreground)] truncate">{job.jobName}</h4>
                                {job.jobType && (
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex-shrink-0">
                                    {job.jobType}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {job.startDate && <span>Start: {job.startDate}</span>}
                                {job.endDate && <span>End: {job.endDate}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('JOB', job.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink job"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">No jobs linked</p>
                      <button
                        onClick={() => openAddLinkModal('JOB')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a job
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Files */}
            {isCategoryEnabled('files') && visibleCategories.includes('files') && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                <EntityGridHeader
                  title={`Files (${totals.files})`}
                  entityType="FILE"
                  hasEntities={Boolean(linkedFiles && linkedFiles.length > 0)}
                  onAddLink={openAddLinkModal}
                />
                <div className="p-4">
                  {linkedFiles && linkedFiles.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                    {linkedFiles.map((file: FileResponse) => (
                      <RelatedEntityHoverCard key={file.id} entity={file} type="file">
                        <div
                          className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/30 transition-colors cursor-pointer group"
                          onClick={() => handleFileClick(file)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gray-500 flex items-center justify-center text-white flex-shrink-0">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-[var(--foreground)] truncate mb-0.5">{file.fileName}</h4>
                              <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                                {file.fileSize && <span>{formatFileSize(file.fileSize)}</span>}
                                {file.fileType && <span>{file.fileType}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlink('FILE', file.id);
                            }}
                            disabled={deleteLinkMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                            title="Unlink file"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </RelatedEntityHoverCard>
                    ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--muted-foreground)]">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-500/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">No files linked</p>
                      <button
                        onClick={() => openAddLinkModal('FILE')}
                        className="mt-2 text-sm text-[var(--primary)] hover:underline"
                      >
                        + Add a file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        sourceEntityId={entityId}
        sourceEntityType={sourceEntityType}
        initialEntityType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={showCreateNoteModal}
        onClose={() => setShowCreateNoteModal(false)}
        onSuccess={handleLinkSuccess}
        initialLinks={[{
          id: entityId,
          type: SOURCE_TYPE_TO_LINK_TYPE[sourceEntityType],
          name: `${sourceEntityType.charAt(0) + sourceEntityType.slice(1).toLowerCase().replace('_', ' ')} #${entityId.slice(0, 8)}`,
        }]}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onSuccess={handleLinkSuccess}
        initialLinks={[{
          id: entityId,
          type: SOURCE_TYPE_TO_LINK_TYPE[sourceEntityType],
          name: `${sourceEntityType.charAt(0) + sourceEntityType.slice(1).toLowerCase().replace('_', ' ')} #${entityId.slice(0, 8)}`,
        }]}
      />
    </>
  );
}

export default ConnectedEntitiesSection;

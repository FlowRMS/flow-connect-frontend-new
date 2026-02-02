/**
 * Connected Entities Table View Component
 * Displays connected entities in a professional data table format
 */

'use client';

import React, { useMemo, useState } from 'react';
import type {
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
import type { FileResponse } from '../lib/graphql/files';
import { formatFileSize } from '../lib/graphql/files';
import type { EntityUnion, EntityType } from './RelatedEntityHoverCard';
import type { EntityCategory, LinkEntityType } from './ConnectedEntitiesSection';

// ============================================================================
// Types
// ============================================================================

interface TableEntity {
  id: string;
  type: EntityCategory;
  linkType: LinkEntityType;
  hoverCardType: EntityType;
  name: string;
  subtext?: string;
  status?: string;
  statusColor?: string;
  date?: string;
  secondaryInfo?: string;
  rawEntity: EntityUnion;
}

interface ConnectedEntitiesTableViewProps {
  contacts: RelatedEntityContact[];
  companies: RelatedEntityCompany[];
  customers: RelatedEntityCustomer[];
  factories: RelatedEntityFactory[];
  preOpportunities: RelatedEntityPreOpportunity[];
  quotes: RelatedEntityQuote[];
  orders: RelatedEntityOrder[];
  invoices: RelatedEntityInvoice[];
  checks: RelatedEntityCheck[];
  tasks: RelatedEntityTask[];
  notes: RelatedEntityNote[];
  jobs: RelatedEntityJob[];
  files: FileResponse[];
  visibleCategories: EntityCategory[];
  readOnlyCategories: EntityCategory[];
  onEntityClick: (type: EntityCategory, entity: unknown) => void;
  onUnlink: (entityType: LinkEntityType, entityId: string) => void;
  isUnlinking: boolean;
}

// ============================================================================
// Helper functions
// ============================================================================

function getStatusColor(status: string | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-700';

  const statusLower = status.toLowerCase();
  if (statusLower.includes('completed') || statusLower.includes('won') || statusLower.includes('paid')) {
    return 'bg-green-100 text-green-700';
  }
  if (statusLower.includes('progress') || statusLower.includes('active') || statusLower.includes('open')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (statusLower.includes('pending') || statusLower.includes('draft')) {
    return 'bg-yellow-100 text-yellow-700';
  }
  if (statusLower.includes('cancel') || statusLower.includes('closed') || statusLower.includes('lost')) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
}

function getTypeColor(type: EntityCategory): string {
  const colors: Record<EntityCategory, string> = {
    contacts: 'bg-blue-500',
    companies: 'bg-emerald-500',
    customers: 'bg-violet-500',
    factories: 'bg-purple-500',
    'pre-opportunities': 'bg-sky-500',
    quotes: 'bg-indigo-500',
    orders: 'bg-cyan-500',
    invoices: 'bg-emerald-500',
    checks: 'bg-rose-500',
    tasks: 'bg-orange-500',
    notes: 'bg-yellow-500',
    jobs: 'bg-indigo-500',
    files: 'bg-gray-500',
  };
  return colors[type] || 'bg-gray-500';
}

function getTypeLabel(type: EntityCategory): string {
  const labels: Record<EntityCategory, string> = {
    contacts: 'Contact',
    companies: 'Company',
    customers: 'Customer',
    factories: 'Manufacturer',
    'pre-opportunities': 'Pre-Opp',
    quotes: 'Quote',
    orders: 'Order',
    invoices: 'Invoice',
    checks: 'Check',
    tasks: 'Task',
    notes: 'Note',
    jobs: 'Job',
    files: 'File',
  };
  return labels[type] || type;
}

function getTypeIcon(type: EntityCategory): React.ReactNode {
  const iconProps = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };

  switch (type) {
    case 'contacts':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'companies':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'customers':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'factories':
      return (
        <svg {...iconProps}>
          <path d="M2 20h20M4 20V10l8-6 8 6v10"/>
          <path d="M9 20v-6h6v6"/>
          <path d="M9 10h.01M15 10h.01"/>
        </svg>
      );
    case 'pre-opportunities':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'quotes':
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8M16 17H8M10 9H8" strokeLinecap="round"/>
        </svg>
      );
    case 'orders':
      return (
        <svg {...iconProps}>
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'invoices':
      return (
        <svg {...iconProps}>
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      );
    case 'checks':
      return (
        <svg {...iconProps}>
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
          <line x1="6" y1="15" x2="10" y2="15"/>
        </svg>
      );
    case 'tasks':
      return (
        <svg {...iconProps}>
          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'notes':
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'jobs':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'files':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================================
// Main Component
// ============================================================================

export function ConnectedEntitiesTableView({
  contacts,
  companies,
  customers,
  factories,
  preOpportunities,
  quotes,
  orders,
  invoices,
  checks,
  tasks,
  notes,
  jobs,
  files,
  visibleCategories,
  readOnlyCategories,
  onEntityClick,
  onUnlink,
  isUnlinking,
}: ConnectedEntitiesTableViewProps) {
  const [sortField, setSortField] = useState<'type' | 'name' | 'status' | 'date'>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Transform all entities into a unified format
  const allEntities = useMemo(() => {
    const entities: TableEntity[] = [];

    // Contacts
    if (visibleCategories.includes('contacts')) {
      contacts.forEach(contact => {
        entities.push({
          id: contact.id,
          type: 'contacts',
          linkType: 'CONTACT',
          hoverCardType: 'contact',
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact',
          subtext: contact.role || contact.email,
          date: undefined,
          secondaryInfo: contact.phone,
          rawEntity: contact,
        });
      });
    }

    // Companies
    if (visibleCategories.includes('companies')) {
      companies.forEach(company => {
        entities.push({
          id: company.id,
          type: 'companies',
          linkType: 'COMPANY',
          hoverCardType: 'company',
          name: company.name || 'Unnamed Company',
          subtext: company.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer',
          status: company.companySourceType,
          statusColor: company.companySourceType === 'MANUFACTURER' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700',
          secondaryInfo: company.phone || company.website,
          rawEntity: company,
        });
      });
    }

    // Customers
    if (visibleCategories.includes('customers')) {
      customers.forEach(customer => {
        entities.push({
          id: customer.id,
          type: 'customers',
          linkType: 'CUSTOMER',
          hoverCardType: 'customer',
          name: customer.companyName || 'Unnamed Customer',
          subtext: customer.isParent ? 'Parent' : undefined,
          status: customer.isParent ? 'Parent' : undefined,
          statusColor: customer.isParent ? 'bg-violet-100 text-violet-700' : undefined,
          rawEntity: customer,
        });
      });
    }

    // Factories
    if (visibleCategories.includes('factories')) {
      factories.forEach(factory => {
        entities.push({
          id: factory.id,
          type: 'factories',
          linkType: 'FACTORY',
          hoverCardType: 'factory',
          name: factory.title || 'Unnamed Factory',
          subtext: factory.accountNumber,
          status: factory.published === false ? 'Unpublished' : undefined,
          statusColor: factory.published === false ? 'bg-gray-100 text-gray-700' : undefined,
          secondaryInfo: factory.email,
          rawEntity: factory,
        });
      });
    }

    // Pre-Opportunities
    if (visibleCategories.includes('pre-opportunities')) {
      preOpportunities.forEach(preOpp => {
        entities.push({
          id: preOpp.id,
          type: 'pre-opportunities',
          linkType: 'PRE_OPPORTUNITY',
          hoverCardType: 'preOpportunity',
          name: preOpp.entityNumber || 'Unnamed Pre-Opp',
          status: preOpp.status?.replace(/_/g, ' '),
          statusColor: getStatusColor(preOpp.status),
          date: preOpp.entityDate,
          secondaryInfo: preOpp.expDate ? `Exp: ${preOpp.expDate}` : undefined,
          rawEntity: preOpp,
        });
      });
    }

    // Quotes
    if (visibleCategories.includes('quotes')) {
      quotes.forEach(quote => {
        entities.push({
          id: quote.id,
          type: 'quotes',
          linkType: 'QUOTE',
          hoverCardType: 'quote',
          name: quote.quoteNumber || 'Unnamed Quote',
          subtext: quote.pipelineStage,
          status: quote.status,
          statusColor: getStatusColor(quote.status),
          date: quote.entityDate,
          secondaryInfo: quote.expDate ? `Exp: ${quote.expDate}` : undefined,
          rawEntity: quote,
        });
      });
    }

    // Orders
    if (visibleCategories.includes('orders')) {
      orders.forEach(order => {
        entities.push({
          id: order.id,
          type: 'orders',
          linkType: 'ORDER',
          hoverCardType: 'order',
          name: order.orderNumber || 'Unnamed Order',
          subtext: order.orderType,
          status: order.status,
          statusColor: getStatusColor(order.status),
          date: order.entityDate,
          secondaryInfo: order.shipDate ? `Ship: ${order.shipDate}` : undefined,
          rawEntity: order,
        });
      });
    }

    // Invoices
    if (visibleCategories.includes('invoices')) {
      invoices.forEach(invoice => {
        entities.push({
          id: invoice.id,
          type: 'invoices',
          linkType: 'INVOICE',
          hoverCardType: 'invoice',
          name: invoice.invoiceNumber || 'Unnamed Invoice',
          status: invoice.status,
          statusColor: getStatusColor(invoice.status),
          date: invoice.entityDate,
          secondaryInfo: invoice.dueDate ? `Due: ${invoice.dueDate}` : undefined,
          rawEntity: invoice,
        });
      });
    }

    // Checks
    if (visibleCategories.includes('checks')) {
      checks.forEach(check => {
        entities.push({
          id: check.id,
          type: 'checks',
          linkType: 'CHECK',
          hoverCardType: 'check',
          name: check.checkNumber || 'Unnamed Check',
          subtext: check.commissionMonth,
          status: check.status,
          statusColor: getStatusColor(check.status),
          date: check.entityDate,
          secondaryInfo: check.enteredCommissionAmount ? `$${check.enteredCommissionAmount.toLocaleString()}` : undefined,
          rawEntity: check,
        });
      });
    }

    // Tasks
    if (visibleCategories.includes('tasks')) {
      tasks.forEach(task => {
        entities.push({
          id: task.id,
          type: 'tasks',
          linkType: 'TASK',
          hoverCardType: 'task',
          name: task.title || 'Unnamed Task',
          status: task.status?.replace('_', ' '),
          statusColor: getStatusColor(task.status),
          date: task.dueDate,
          secondaryInfo: task.priority,
          rawEntity: task,
        });
      });
    }

    // Notes
    if (visibleCategories.includes('notes')) {
      notes.forEach(note => {
        entities.push({
          id: note.id,
          type: 'notes',
          linkType: 'NOTE',
          hoverCardType: 'note',
          name: note.title || 'Unnamed Note',
          subtext: note.content ? (note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content) : undefined,
          rawEntity: note,
        });
      });
    }

    // Jobs
    if (visibleCategories.includes('jobs')) {
      jobs.forEach(job => {
        entities.push({
          id: job.id,
          type: 'jobs',
          linkType: 'JOB',
          hoverCardType: 'job',
          name: job.jobName || 'Unnamed Job',
          subtext: job.jobType,
          date: job.startDate,
          secondaryInfo: job.endDate ? `End: ${job.endDate}` : undefined,
          rawEntity: job,
        });
      });
    }

    // Files
    if (visibleCategories.includes('files')) {
      files.forEach(file => {
        entities.push({
          id: file.id,
          type: 'files',
          linkType: 'FILE',
          hoverCardType: 'file',
          name: file.fileName || 'Unnamed File',
          subtext: file.fileType,
          secondaryInfo: file.fileSize ? formatFileSize(file.fileSize) : undefined,
          rawEntity: file,
        });
      });
    }

    return entities;
  }, [contacts, companies, customers, factories, preOpportunities, quotes, orders, invoices, checks, tasks, notes, jobs, files, visibleCategories]);

  // Sort entities
  const sortedEntities = useMemo(() => {
    return [...allEntities].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'date':
          comparison = (a.date || '').localeCompare(b.date || '');
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [allEntities, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (sortedEntities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-lg font-medium mb-1">No connected entities</p>
        <p className="text-sm">Click &quot;Add Link&quot; to connect entities</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--muted)]/30 border-b border-[var(--border)]">
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
                >
                  Type
                  <SortIcon field="type" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
                >
                  Name
                  <SortIcon field="name" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
                >
                  Date
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Details
                </span>
              </th>
              <th className="text-right px-4 py-3 w-16">
                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sortedEntities.map((entity) => {
              const isReadOnly = readOnlyCategories.includes(entity.type);

              return (
                <tr
                  key={`${entity.type}-${entity.id}`}
                  className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer group"
                  onClick={() => onEntityClick(entity.type, entity.rawEntity)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md ${getTypeColor(entity.type)} flex items-center justify-center text-white flex-shrink-0`}>
                        {getTypeIcon(entity.type)}
                      </div>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {getTypeLabel(entity.type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px]">
                        {entity.name}
                      </span>
                      {entity.subtext && (
                        <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[200px]">
                          {entity.subtext}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {entity.status && (
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${entity.statusColor || getStatusColor(entity.status)}`}>
                        {entity.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entity.date && (
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {entity.date}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entity.secondaryInfo && (
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {entity.secondaryInfo}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isReadOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnlink(entity.linkType, entity.id);
                        }}
                        disabled={isUnlinking}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Unlink"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-[var(--muted)]/20 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-sm text-[var(--muted-foreground)]">
          {sortedEntities.length} {sortedEntities.length === 1 ? 'entity' : 'entities'} linked
        </span>
      </div>
    </div>
  );
}

export default ConnectedEntitiesTableView;

/**
 * Related Entity Hover Card Component
 * A beautiful, centralized hover card for displaying related entity details
 *
 * Supports all entity types from the RelatedEntities response:
 * - Companies, Contacts, Jobs, Tasks, Notes
 * - Quotes, Orders, Invoices, Checks
 * - Pre-Opportunities, Factories, Customers, Products
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type {
  RelatedEntityCompany,
  RelatedEntityContact,
  RelatedEntityJob,
  RelatedEntityTask,
  RelatedEntityNote,
  RelatedEntityQuote,
  RelatedEntityOrder,
  RelatedEntityInvoice,
  RelatedEntityCheck,
  RelatedEntityPreOpportunity,
  RelatedEntityFactory,
  RelatedEntityCustomer,
  RelatedEntityProduct,
} from '../lib/crm-graphql';

// ============================================================================
// Types
// ============================================================================

export type EntityType =
  | 'company'
  | 'contact'
  | 'job'
  | 'task'
  | 'note'
  | 'quote'
  | 'order'
  | 'invoice'
  | 'check'
  | 'preOpportunity'
  | 'factory'
  | 'customer'
  | 'product';

type EntityUnion =
  | RelatedEntityCompany
  | RelatedEntityContact
  | RelatedEntityJob
  | RelatedEntityTask
  | RelatedEntityNote
  | RelatedEntityQuote
  | RelatedEntityOrder
  | RelatedEntityInvoice
  | RelatedEntityCheck
  | RelatedEntityPreOpportunity
  | RelatedEntityFactory
  | RelatedEntityCustomer
  | RelatedEntityProduct;

interface RelatedEntityHoverCardProps {
  children: React.ReactNode;
  entity: EntityUnion;
  type: EntityType;
  disabled?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date?: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeAgo = (date?: string | null): string => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Parse tags that can be either string or array
const parseTags = (tags?: string | string[] | null): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
};


// ============================================================================
// Entity Type Icons
// ============================================================================

const EntityIcons: Record<EntityType, React.ReactNode> = {
  company: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  contact: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  job: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  task: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  note: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  quote: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  order: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  invoice: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  preOpportunity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  factory: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  customer: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  product: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
};

const EntityColors: Record<EntityType, string> = {
  company: '#10b981',      // Emerald
  contact: '#3b82f6',      // Blue
  job: '#6366f1',          // Indigo
  task: '#f97316',         // Orange
  note: '#eab308',         // Yellow
  quote: '#8b5cf6',        // Violet
  order: '#06b6d4',        // Cyan
  invoice: '#14b8a6',      // Teal
  check: '#f43f5e',        // Rose
  preOpportunity: '#0ea5e9', // Sky
  factory: '#64748b',      // Slate
  customer: '#d946ef',     // Fuchsia
  product: '#84cc16',      // Lime
};

const EntityLabels: Record<EntityType, string> = {
  company: 'Company',
  contact: 'Contact',
  job: 'Job',
  task: 'Task',
  note: 'Note',
  quote: 'Quote',
  order: 'Order',
  invoice: 'Invoice',
  check: 'Check',
  preOpportunity: 'Pre-Opportunity',
  factory: 'Factory',
  customer: 'Customer',
  product: 'Product',
};

// ============================================================================
// Entity Content Components
// ============================================================================

function CompanyContent({ entity }: { entity: RelatedEntityCompany }) {
  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.company}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.name}</h4>
          {entity.companySourceType && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
              entity.companySourceType === 'MANUFACTURER'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {entity.companySourceType === 'MANUFACTURER' ? 'Manufacturer' : 'Customer'}
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.phone && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Phone</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.phone}</div>
          </div>
        )}
        {entity.website && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Website</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.website}</div>
          </div>
        )}
      </div>

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-medium border border-emerald-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function ContactContent({ entity }: { entity: RelatedEntityContact }) {
  const initials = `${entity.firstName?.[0] || ''}${entity.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
          {initials || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">
            {entity.firstName} {entity.lastName}
          </h4>
          {entity.role && (
            <span className="text-xs text-blue-600 font-medium">{entity.role}</span>
          )}
        </div>
      </div>

      {/* Contact details grid */}
      <div className="grid grid-cols-2 gap-2">
        {entity.email && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg col-span-2">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email
            </div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.email}</div>
          </div>
        )}
        {entity.phone && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Phone
            </div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.phone}</div>
          </div>
        )}
        {entity.territory && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              Territory
            </div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.territory}</div>
          </div>
        )}
      </div>

      {/* Notes */}
      {entity.notes && (
        <div className="p-2 bg-blue-50/50 rounded-lg text-xs text-[var(--foreground)] line-clamp-2 border border-blue-100">
          <div className="text-[10px] text-blue-600 font-medium mb-0.5">Notes</div>
          {entity.notes}
        </div>
      )}

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Added {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function JobContent({ entity }: { entity: RelatedEntityJob }) {
  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.job}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.jobName}</h4>
          {entity.jobType && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 text-indigo-700 mt-1">
              {entity.jobType}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {entity.description && (
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 px-1">{entity.description}</p>
      )}

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.startDate && (
          <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <div className="text-[10px] text-green-600 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Start
            </div>
            <div className="text-sm font-medium text-green-700">{formatDate(entity.startDate)}</div>
          </div>
        )}
        {entity.endDate && (
          <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
            <div className="text-[10px] text-amber-600 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              End
            </div>
            <div className="text-sm font-medium text-amber-700">{formatDate(entity.endDate)}</div>
          </div>
        )}
      </div>

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium border border-indigo-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function TaskContent({ entity }: { entity: RelatedEntityTask }) {
  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
  };
  const statusColors: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    DONE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.task}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.title}</h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {entity.status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[entity.status] || 'bg-gray-100 text-gray-700'}`}>
                {entity.status.replace(/_/g, ' ')}
              </span>
            )}
            {entity.priority && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${priorityColors[entity.priority] || 'bg-gray-100 text-gray-700'}`}>
                {entity.priority}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {entity.description && (
        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 px-1">{entity.description}</p>
      )}

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.dueDate && (
          <div className="p-2 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-100">
            <div className="text-[10px] text-red-600 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Due
            </div>
            <div className="text-sm font-medium text-red-700">{formatDate(entity.dueDate)}</div>
          </div>
        )}
        {entity.reminderDate && (
          <div className="p-2 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
            <div className="text-[10px] text-amber-600 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Reminder
            </div>
            <div className="text-sm font-medium text-amber-700">{formatDate(entity.reminderDate)}</div>
          </div>
        )}
      </div>

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-medium border border-orange-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function NoteContent({ entity }: { entity: RelatedEntityNote }) {
  const authorName = typeof entity.createdBy === 'object'
    ? entity.createdBy?.fullName || `${entity.createdBy?.firstName || ''} ${entity.createdBy?.lastName || ''}`.trim() || entity.createdBy?.email
    : entity.createdBy;

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white shadow-md">
          {EntityIcons.note}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.title}</h4>
          {authorName && (
            <div className="text-xs text-yellow-700 flex items-center gap-1 mt-0.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {authorName}
            </div>
          )}
        </div>
      </div>

      {/* Content preview */}
      {entity.content && (
        <div className="p-2 bg-yellow-50/50 rounded-lg text-xs text-[var(--foreground)] line-clamp-3 border border-yellow-100">
          <div dangerouslySetInnerHTML={{ __html: entity.content }} className="prose prose-xs max-w-none" />
        </div>
      )}

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded text-[10px] font-medium border border-yellow-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function QuoteContent({ entity }: { entity: RelatedEntityQuote }) {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.quote}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.quoteNumber}</h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {entity.status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[entity.status] || 'bg-gray-100 text-gray-700'}`}>
                {entity.status}
              </span>
            )}
            {entity.pipelineStage && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">
                {entity.pipelineStage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Quote Date</div>
          <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(entity.entityDate)}</div>
        </div>
        {entity.expDate && (
          <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
            <div className="text-[10px] text-amber-600 uppercase tracking-wide">Expires</div>
            <div className="text-sm font-medium text-amber-700">{formatDate(entity.expDate)}</div>
          </div>
        )}
      </div>

      {/* Additional info */}
      {entity.customerRef && (
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Customer Ref</div>
          <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.customerRef}</div>
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entity.blanket && (
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
            Blanket
          </span>
        )}
        {entity.published && (
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Published
          </span>
        )}
        {entity.paymentTerms && (
          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium border border-purple-200">
            {entity.paymentTerms}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function OrderContent({ entity }: { entity: RelatedEntityOrder }) {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    SHIPPED: 'bg-cyan-100 text-cyan-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.order}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.orderNumber}</h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {entity.status && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[entity.status] || 'bg-gray-100 text-gray-700'}`}>
                {entity.status.replace(/_/g, ' ')}
              </span>
            )}
            {entity.orderType && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-100 text-cyan-700">
                {entity.orderType}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Order Date</div>
          <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(entity.entityDate)}</div>
        </div>
        {entity.shipDate && (
          <div className="p-2 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg border border-cyan-100">
            <div className="text-[10px] text-cyan-600 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              Ship
            </div>
            <div className="text-sm font-medium text-cyan-700">{formatDate(entity.shipDate)}</div>
          </div>
        )}
      </div>

      {/* Factory SO# and Mark # */}
      <div className="grid grid-cols-2 gap-2">
        {entity.factSoNumber && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Factory SO#</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.factSoNumber}</div>
          </div>
        )}
        {entity.markNumber && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Mark#</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.markNumber}</div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entity.published && (
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Published
          </span>
        )}
        {entity.freightTerms && (
          <span className="px-1.5 py-0.5 bg-cyan-50 text-cyan-700 rounded text-[10px] font-medium border border-cyan-200">
            {entity.freightTerms}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function InvoiceContent({ entity }: { entity: RelatedEntityInvoice }) {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    UNPAID: 'bg-amber-100 text-amber-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.invoice}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.invoiceNumber}</h4>
          {entity.status && (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${statusColors[entity.status] || 'bg-gray-100 text-gray-700'}`}>
              {entity.status}
            </span>
          )}
        </div>
      </div>

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Invoice Date</div>
          <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(entity.entityDate)}</div>
        </div>
        {entity.dueDate && (
          <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
            <div className="text-[10px] text-amber-600 uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Due
            </div>
            <div className="text-sm font-medium text-amber-700">{formatDate(entity.dueDate)}</div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entity.locked && (
          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium border border-gray-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Locked
          </span>
        )}
        {entity.published && (
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Published
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function CheckContent({ entity }: { entity: RelatedEntityCheck }) {
  const statusColors: Record<string, string> = {
    POSTED: 'bg-green-100 text-green-700',
    UNPOSTED: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.check}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.checkNumber}</h4>
          {entity.status && (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${statusColors[entity.status] || 'bg-gray-100 text-gray-700'}`}>
              {entity.status}
            </span>
          )}
        </div>
      </div>

      {/* Commission Amount - prominent display */}
      {entity.enteredCommissionAmount !== undefined && entity.enteredCommissionAmount !== null && (
        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="text-[10px] text-green-600 font-medium uppercase tracking-wide">Commission Amount</div>
          <div className="text-xl font-bold text-green-700">
            {formatCurrency(entity.enteredCommissionAmount)}
          </div>
        </div>
      )}

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.entityDate && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Check Date</div>
            <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(entity.entityDate)}</div>
          </div>
        )}
        {entity.commissionMonth && (
          <div className="p-2 bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100">
            <div className="text-[10px] text-rose-600 uppercase tracking-wide">Comm. Month</div>
            <div className="text-sm font-medium text-rose-700">{entity.commissionMonth}</div>
          </div>
        )}
      </div>

      {/* Post date badge */}
      {entity.postDate && (
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Posted {formatDate(entity.postDate)}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function PreOpportunityContent({ entity }: { entity: RelatedEntityPreOpportunity }) {
  const statusColors: Record<string, string> = {
    QUALIFIED: 'bg-blue-100 text-blue-700',
    NEGOTIATION: 'bg-purple-100 text-purple-700',
    FOLLOW_UP: 'bg-amber-100 text-amber-700',
    WAITING_ON_FACTORY: 'bg-orange-100 text-orange-700',
    LOST: 'bg-red-100 text-red-700',
    WON: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.preOpportunity}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.entityNumber}</h4>
          {entity.status && (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${statusColors[entity.status] || 'bg-gray-100 text-gray-700'}`}>
              {entity.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Date info */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Date</div>
          <div className="text-sm font-medium text-[var(--foreground)]">{formatDate(entity.entityDate)}</div>
        </div>
        {entity.expDate && (
          <div className="p-2 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100">
            <div className="text-[10px] text-amber-600 uppercase tracking-wide">Expires</div>
            <div className="text-sm font-medium text-amber-700">{formatDate(entity.expDate)}</div>
          </div>
        )}
      </div>

      {/* Customer ref and terms */}
      <div className="grid grid-cols-2 gap-2">
        {entity.customerRef && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg col-span-2">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Customer Ref</div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.customerRef}</div>
          </div>
        )}
      </div>

      {/* Terms badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entity.paymentTerms && (
          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-medium border border-sky-200">
            {entity.paymentTerms}
          </span>
        )}
        {entity.freightTerms && (
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
            {entity.freightTerms}
          </span>
        )}
      </div>

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[10px] font-medium border border-sky-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Created {formatTimeAgo(entity.createdAt)}
      </div>
    </div>
  );
}

function FactoryContent({ entity }: { entity: RelatedEntityFactory }) {
  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.factory}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.title}</h4>
          {entity.accountNumber && (
            <span className="text-xs text-slate-600 font-medium">#{entity.accountNumber}</span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.email && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg col-span-2">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Email
            </div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.email}</div>
          </div>
        )}
        {entity.phone && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Phone
            </div>
            <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.phone}</div>
          </div>
        )}
        {entity.leadTime !== undefined && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Lead Time</div>
            <div className="text-sm font-medium text-[var(--foreground)]">{entity.leadTime} days</div>
          </div>
        )}
      </div>

      {/* Commission rates */}
      <div className="grid grid-cols-2 gap-2">
        {entity.baseCommissionRate !== undefined && (
          <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <div className="text-[10px] text-green-600 uppercase tracking-wide">Base Commission</div>
            <div className="text-sm font-bold text-green-700">{entity.baseCommissionRate}%</div>
          </div>
        )}
        {entity.paymentTerms !== undefined && (
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="text-[10px] text-blue-600 uppercase tracking-wide">Payment Terms</div>
            <div className="text-sm font-medium text-blue-700">{entity.paymentTerms} days</div>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entity.published && (
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Published
          </span>
        )}
        {entity.freightTerms && (
          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200">
            {entity.freightTerms}
          </span>
        )}
      </div>
    </div>
  );
}

function CustomerContent({ entity }: { entity: RelatedEntityCustomer }) {
  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-fuchsia-50 to-purple-50 border border-fuchsia-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.customer}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.companyName}</h4>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {entity.isParent && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                Parent Company
              </span>
            )}
            {entity.published && (
              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Parent company info if applicable */}
      {entity.parentId && (
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Parent ID</div>
          <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.parentId}</div>
        </div>
      )}
    </div>
  );
}

function ProductContent({ entity }: { entity: RelatedEntityProduct }) {
  return (
    <div className="space-y-3">
      {/* Header with gradient */}
      <div className="flex items-start gap-3 p-3 -m-1 rounded-xl bg-gradient-to-br from-lime-50 to-green-50 border border-lime-100">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white shadow-md">
          {EntityIcons.product}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[var(--foreground)] truncate">{entity.factoryPartNumber}</h4>
          {entity.description && (
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">{entity.description}</p>
          )}
        </div>
      </div>

      {/* Pricing info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.unitPrice !== undefined && (
          <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="text-[10px] text-blue-600 uppercase tracking-wide">Unit Price</div>
            <div className="text-sm font-bold text-blue-700">{formatCurrency(entity.unitPrice)}</div>
          </div>
        )}
        {entity.defaultCommissionRate !== undefined && (
          <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <div className="text-[10px] text-green-600 uppercase tracking-wide">Commission</div>
            <div className="text-sm font-bold text-green-700">{entity.defaultCommissionRate}%</div>
          </div>
        )}
      </div>

      {/* Additional product info */}
      <div className="grid grid-cols-2 gap-2">
        {entity.leadTime && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Lead Time</div>
            <div className="text-sm font-medium text-[var(--foreground)]">{entity.leadTime}</div>
          </div>
        )}
        {entity.minOrderQty !== undefined && (
          <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
            <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">Min Order Qty</div>
            <div className="text-sm font-medium text-[var(--foreground)]">{entity.minOrderQty}</div>
          </div>
        )}
      </div>

      {/* UPC if available */}
      {entity.upc && (
        <div className="p-2 bg-[var(--muted)]/40 rounded-lg">
          <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wide">UPC</div>
          <div className="text-sm font-medium text-[var(--foreground)] truncate">{entity.upc}</div>
        </div>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {entity.approvalNeeded && (
          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium border border-amber-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Approval Needed
          </span>
        )}
        {entity.published && (
          <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-medium border border-green-200 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Published
          </span>
        )}
      </div>

      {/* Tags */}
      {entity.tags && (
        <div className="flex flex-wrap gap-1">
          {parseTags(entity.tags).slice(0, 4).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 bg-lime-50 text-lime-700 rounded text-[10px] font-medium border border-lime-200">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function RelatedEntityHoverCard({ children, entity, type, disabled = false }: RelatedEntityHoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 280;
    const offset = 8;

    // Position to the right of the element by default
    let left = rect.right + offset;
    // Vertically center relative to the trigger element
    let top = rect.top + (rect.height / 2) - 40;

    // Check if card would overflow right edge - show on left instead
    if (left + cardWidth > window.innerWidth - 16) {
      left = rect.left - cardWidth - offset;
    }

    // If still overflowing (very narrow viewport), position below
    if (left < 16) {
      left = Math.max(16, rect.left);
      top = rect.bottom + offset;
    }

    // Check if card would overflow bottom
    if (top + cardHeight > window.innerHeight - 16) {
      top = window.innerHeight - cardHeight - 16;
    }

    // Ensure top is not negative
    if (top < 16) {
      top = 16;
    }

    setPosition({ top, left });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsHovered(true);
    }, 350);
  }, [disabled, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(false);
  }, []);

  const renderContent = () => {
    switch (type) {
      case 'company':
        return <CompanyContent entity={entity as RelatedEntityCompany} />;
      case 'contact':
        return <ContactContent entity={entity as RelatedEntityContact} />;
      case 'job':
        return <JobContent entity={entity as RelatedEntityJob} />;
      case 'task':
        return <TaskContent entity={entity as RelatedEntityTask} />;
      case 'note':
        return <NoteContent entity={entity as RelatedEntityNote} />;
      case 'quote':
        return <QuoteContent entity={entity as RelatedEntityQuote} />;
      case 'order':
        return <OrderContent entity={entity as RelatedEntityOrder} />;
      case 'invoice':
        return <InvoiceContent entity={entity as RelatedEntityInvoice} />;
      case 'check':
        return <CheckContent entity={entity as RelatedEntityCheck} />;
      case 'preOpportunity':
        return <PreOpportunityContent entity={entity as RelatedEntityPreOpportunity} />;
      case 'factory':
        return <FactoryContent entity={entity as RelatedEntityFactory} />;
      case 'customer':
        return <CustomerContent entity={entity as RelatedEntityCustomer} />;
      case 'product':
        return <ProductContent entity={entity as RelatedEntityProduct} />;
      default:
        return null;
    }
  };

  const color = EntityColors[type];

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {mounted && isHovered && createPortal(
        <div
          ref={cardRef}
          className="fixed z-[9999] w-[320px] animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 duration-150"
          style={{
            top: position.top,
            left: position.left,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          {/* Card Container */}
          <div className="relative">
            {/* Glowing background effect */}
            <div
              className="absolute -inset-0.5 rounded-xl opacity-20 blur-md"
              style={{ background: `linear-gradient(135deg, ${color}, transparent 60%)` }}
            />

            {/* Main card */}
            <div className="relative p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-xl backdrop-blur-sm">
              {/* Entity type label */}
              <div
                className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-md"
                style={{ backgroundColor: color }}
              >
                {EntityLabels[type]}
              </div>

              {/* Content */}
              <div className="pt-1">
                {renderContent()}
              </div>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-40"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default RelatedEntityHoverCard;

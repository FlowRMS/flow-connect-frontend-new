/**
 * EntityBadges Component
 * Reusable component for displaying linked entities (jobs, contacts, companies, notes, quotes, orders, invoices, checks, etc.)
 */

'use client';

import React from 'react';
import { useTaskRelatedEntities } from '../api';
import { convertRelatedEntitiesToUI } from '../utils';

interface EntityBadgesProps {
  taskId: string;
  compact?: boolean;
  maxItems?: number;
}

// Icon components for different entity types
const JobIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ContactIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CompanyIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const NoteIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PreOpportunityIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const QuoteIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const OrderIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const InvoiceIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const FactoryIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CustomerIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ProductIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

type EntityType = 'job' | 'contact' | 'company' | 'note' | 'preOpportunity' | 'quote' | 'order' | 'invoice' | 'check' | 'factory' | 'customer' | 'product';

export function EntityBadges({ taskId, compact = false, maxItems = 6 }: EntityBadgesProps) {
  const { data: relatedEntities, isLoading } = useTaskRelatedEntities(taskId);
  
  if (isLoading) {
    return (
      <div className="flex gap-1">
        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs animate-pulse">
          Loading...
        </span>
      </div>
    );
  }
  
  if (!relatedEntities) {
    return null;
  }
  
  const entities = convertRelatedEntitiesToUI(relatedEntities);
  
  const hasEntities = 
    (entities.jobs?.length ?? 0) > 0 || 
    (entities.contacts?.length ?? 0) > 0 || 
    (entities.companies?.length ?? 0) > 0 || 
    (entities.notes?.length ?? 0) > 0 ||
    (entities.preOpportunities?.length ?? 0) > 0 ||
    (entities.quotes?.length ?? 0) > 0 ||
    (entities.orders?.length ?? 0) > 0 ||
    (entities.invoices?.length ?? 0) > 0 ||
    (entities.checks?.length ?? 0) > 0 ||
    (entities.factories?.length ?? 0) > 0 ||
    (entities.customers?.length ?? 0) > 0 ||
    (entities.products?.length ?? 0) > 0;
  
  if (!hasEntities) {
    return compact ? null : (
      <span className="text-xs text-gray-400">-</span>
    );
  }
  
  // Flatten all entities with their types
  const allEntities: Array<{ id: string; name: string; type: EntityType }> = [];
  
  entities.jobs?.forEach(job => allEntities.push({ ...job, type: 'job' }));
  entities.contacts?.forEach(contact => allEntities.push({ ...contact, type: 'contact' }));
  entities.companies?.forEach(company => allEntities.push({ ...company, type: 'company' }));
  entities.notes?.forEach(note => allEntities.push({ ...note, type: 'note' }));
  entities.preOpportunities?.forEach(preOpp => allEntities.push({ ...preOpp, type: 'preOpportunity' }));
  entities.quotes?.forEach(quote => allEntities.push({ ...quote, type: 'quote' }));
  entities.orders?.forEach(order => allEntities.push({ ...order, type: 'order' }));
  entities.invoices?.forEach(invoice => allEntities.push({ ...invoice, type: 'invoice' }));
  entities.checks?.forEach(check => allEntities.push({ ...check, type: 'check' }));
  entities.factories?.forEach(factory => allEntities.push({ ...factory, type: 'factory' }));
  entities.customers?.forEach(customer => allEntities.push({ ...customer, type: 'customer' }));
  entities.products?.forEach(product => allEntities.push({ ...product, type: 'product' }));
  
  const visibleEntities = allEntities.slice(0, maxItems);
  const remainingCount = allEntities.length - visibleEntities.length;
  
  const badgeStyles: Record<EntityType, string> = {
    job: 'bg-green-100 text-green-700',
    contact: 'bg-orange-100 text-orange-700',
    company: 'bg-indigo-100 text-indigo-700',
    note: 'bg-yellow-100 text-yellow-700',
    preOpportunity: 'bg-purple-100 text-purple-700',
    quote: 'bg-cyan-100 text-cyan-700',
    order: 'bg-teal-100 text-teal-700',
    invoice: 'bg-rose-100 text-rose-700',
    check: 'bg-emerald-100 text-emerald-700',
    factory: 'bg-slate-100 text-slate-700',
    customer: 'bg-amber-100 text-amber-700',
    product: 'bg-lime-100 text-lime-700',
  };
  
  const getIcon = (type: EntityType) => {
    switch (type) {
      case 'job': return <JobIcon />;
      case 'contact': return <ContactIcon />;
      case 'company': return <CompanyIcon />;
      case 'note': return <NoteIcon />;
      case 'preOpportunity': return <PreOpportunityIcon />;
      case 'quote': return <QuoteIcon />;
      case 'order': return <OrderIcon />;
      case 'invoice': return <InvoiceIcon />;
      case 'check': return <CheckIcon />;
      case 'factory': return <FactoryIcon />;
      case 'customer': return <CustomerIcon />;
      case 'product': return <ProductIcon />;
    }
  };
  
  return (
    <div className="flex gap-1 flex-wrap">
      {visibleEntities.map((entity) => (
        <span 
          key={`${entity.type}-${entity.id}`}
          className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${badgeStyles[entity.type]}`}
        >
          {getIcon(entity.type)}
          <span className={compact ? 'max-w-[80px] truncate' : ''}>{entity.name}</span>
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

export default EntityBadges;

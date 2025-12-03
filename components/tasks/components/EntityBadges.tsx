/**
 * EntityBadges Component
 * Reusable component for displaying linked entities (jobs, contacts, companies, notes)
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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
    (entities.preOpportunities?.length ?? 0) > 0;
  
  if (!hasEntities) {
    return compact ? null : (
      <span className="text-xs text-gray-400">-</span>
    );
  }
  
  // Flatten all entities with their types
  const allEntities: Array<{ id: string; name: string; type: 'job' | 'contact' | 'company' | 'note' | 'preOpportunity' }> = [];
  
  entities.jobs?.forEach(job => allEntities.push({ ...job, type: 'job' }));
  entities.contacts?.forEach(contact => allEntities.push({ ...contact, type: 'contact' }));
  entities.companies?.forEach(company => allEntities.push({ ...company, type: 'company' }));
  entities.notes?.forEach(note => allEntities.push({ ...note, type: 'note' }));
  entities.preOpportunities?.forEach(preOpp => allEntities.push({ ...preOpp, type: 'preOpportunity' }));
  
  const visibleEntities = allEntities.slice(0, maxItems);
  const remainingCount = allEntities.length - visibleEntities.length;
  
  const badgeStyles = {
    job: 'bg-green-100 text-green-700',
    contact: 'bg-orange-100 text-orange-700',
    company: 'bg-indigo-100 text-indigo-700',
    note: 'bg-yellow-100 text-yellow-700',
    preOpportunity: 'bg-teal-100 text-teal-700',
  };
  
  const getIcon = (type: 'job' | 'contact' | 'company' | 'note' | 'preOpportunity') => {
    switch (type) {
      case 'job': return <JobIcon />;
      case 'contact': return <ContactIcon />;
      case 'company': return <CompanyIcon />;
      case 'note': return <NoteIcon />;
      case 'preOpportunity': return <PreOpportunityIcon />;
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

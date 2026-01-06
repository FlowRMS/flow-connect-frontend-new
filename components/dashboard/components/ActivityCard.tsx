/**
 * Activity Card Component
 * Displays individual activity items with proper linking and data display
 */

import React from 'react';
import Link from 'next/link';
import type { Activity } from '../types';
import { 
  getInitials, 
  getAvatarColor, 
  getStatusBadgeClass, 
  getEntityStatusColor,
  getPriorityColor,
  capitalize,
  formatDate,
} from '../utils';
import { ACTIVITY_TYPE_ICONS } from '../constants';

interface ActivityCardProps {
  activity: Activity;
}

/**
 * Activity type colors for prominent badges
 */
const ACTIVITY_TYPE_COLORS: Record<Activity['type'], { bg: string; text: string; border: string }> = {
  job: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  company: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  contact: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  'pre-opportunity': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  note: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  task: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  customer: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300' },
  factory: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
};

/**
 * Activity type labels for display
 */
const ACTIVITY_TYPE_LABELS: Record<Activity['type'], string> = {
  job: 'JOB',
  company: 'COMPANY',
  contact: 'CONTACT',
  'pre-opportunity': 'PRE-OPP',
  note: 'NOTE',
  task: 'TASK',
  customer: 'CUSTOMER',
  factory: 'MANUFACTURER',
};

/**
 * Get color classes for linked entity badges based on entity type
 */
function getLinkedEntityColor(type: string): string {
  switch (type.toUpperCase()) {
    case 'JOB': return 'bg-blue-100 text-blue-700';
    case 'COMPANY': return 'bg-purple-100 text-purple-700';
    case 'CONTACT': return 'bg-green-100 text-green-700';
    case 'TASK': return 'bg-orange-100 text-orange-700';
    case 'NOTE': return 'bg-yellow-100 text-yellow-700';
    case 'PRE_OPPORTUNITY': return 'bg-teal-100 text-teal-700';
    case 'QUOTE': return 'bg-cyan-100 text-cyan-700';
    case 'ORDER': return 'bg-indigo-100 text-indigo-700';
    case 'INVOICE': return 'bg-rose-100 text-rose-700';
    case 'CHECK': return 'bg-emerald-100 text-emerald-700';
    case 'FACTORY': return 'bg-slate-100 text-slate-700';
    case 'CUSTOMER': return 'bg-amber-100 text-amber-700';
    case 'PRODUCT': return 'bg-lime-100 text-lime-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get the icon for the activity type
 */
function ActivityTypeIcon({ type }: { type: Activity['type'] }) {
  const iconMap: Record<Activity['type'], React.ReactNode> = {
    job: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="16" height="14" rx="2"/>
        <path d="M6 4V2a2 2 0 012-2h4a2 2 0 012 2v2"/>
      </svg>
    ),
    company: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="2" width="14" height="16" rx="1"/>
        <path d="M7 6h2M7 10h2M7 14h2M11 6h2M11 10h2"/>
      </svg>
    ),
    contact: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="7" r="3"/>
        <path d="M4 18c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/>
      </svg>
    ),
    'pre-opportunity': (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 1v18M1 10h18"/>
        <circle cx="10" cy="10" r="7"/>
      </svg>
    ),
    note: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h12v14H4z"/>
        <path d="M7 8h6M7 12h4"/>
      </svg>
    ),
    task: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    customer: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 18v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="7.5" cy="6" r="3"/>
        <path d="M19 18v-2a4 4 0 00-3-3.87"/>
        <path d="M13.5 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    factory: (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 18V8l4-4v6l4-4v6l4-4v10H2z"/>
        <path d="M18 18V4h-4"/>
      </svg>
    ),
  };

  return <span className="text-[var(--muted-foreground)]">{iconMap[type]}</span>;
}

/**
 * Prominent Type Badge Component
 */
function ActivityTypeBadge({ type }: { type: Activity['type'] }) {
  const colors = ACTIVITY_TYPE_COLORS[type];
  const label = ACTIVITY_TYPE_LABELS[type];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-xs border ${colors.bg} ${colors.text} ${colors.border}`}>
      <ActivityTypeIcon type={type} />
      {label}
    </span>
  );
}

/**
 * Render metadata based on activity type
 */
function ActivityMetadata({ activity }: { activity: Activity }) {
  const { type, metadata, status } = activity;

  switch (type) {
    case 'job':
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--muted-foreground)]">
          {metadata.statusName && (
            <span className={`px-2 py-0.5 rounded ${getEntityStatusColor(metadata.statusName)}`}>
              {metadata.statusName}
            </span>
          )}
          {metadata.jobType && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
              {metadata.jobType}
            </span>
          )}
          {metadata.startDate && (
            <span>Start: {formatDate(metadata.startDate)}</span>
          )}
          {metadata.endDate && (
            <span>End: {formatDate(metadata.endDate)}</span>
          )}
        </div>
      );

    case 'company':
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--muted-foreground)]">
          <span className={`px-2 py-0.5 rounded ${metadata.companySourceType === 'CUSTOMER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
            {metadata.companySourceType === 'CUSTOMER' ? 'Customer' : 'Manufacturer'}
          </span>
          {metadata.phone && (
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3a2 2 0 012-2h2.28a2 2 0 011.897 1.368l.886 2.657a2 2 0 01-.477 2.022l-.846.845a1 1 0 00-.277.883 10.065 10.065 0 005.32 5.32 1 1 0 00.883-.277l.845-.846a2 2 0 012.022-.477l2.657.886A2 2 0 0119 15.72V18a2 2 0 01-2 2h-1C7.163 20 0 12.837 0 4V3z"/>
              </svg>
              {metadata.phone}
            </span>
          )}
          {metadata.website && (
            <span className="text-blue-600 truncate max-w-[150px]">{metadata.website}</span>
          )}
        </div>
      );

    case 'contact':
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--muted-foreground)]">
          {metadata.role && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
              {metadata.role}
            </span>
          )}
          {metadata.companyName && (
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="2" width="14" height="16" rx="1"/>
              </svg>
              {metadata.companyName}
            </span>
          )}
          {metadata.email && (
            <span className="flex items-center gap-1 text-blue-600">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4l8 5 8-5"/>
                <rect x="2" y="4" width="16" height="12" rx="1"/>
              </svg>
              {metadata.email}
            </span>
          )}
        </div>
      );

    case 'pre-opportunity':
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--muted-foreground)]">
          <span className={`px-2 py-0.5 rounded ${getEntityStatusColor(status)}`}>
            {capitalize(status)}
          </span>
          {metadata.total !== undefined && metadata.total > 0 && (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(metadata.total)}
            </span>
          )}
          {metadata.expDate && (
            <span>Expires: {formatDate(metadata.expDate)}</span>
          )}
          {metadata.entityDate && (
            <span>Created: {formatDate(metadata.entityDate)}</span>
          )}
        </div>
      );

    case 'note':
      return null; // Notes don't need extra metadata display

    case 'task':
      return null; // Tasks don't need extra metadata display

    case 'customer':
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--muted-foreground)]">
          <span className={`px-2 py-0.5 rounded ${metadata.isParent ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
            {metadata.isParent ? 'Parent' : 'Child'}
          </span>
          <span className={`px-2 py-0.5 rounded ${metadata.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {metadata.published ? 'Published' : 'Draft'}
          </span>
        </div>
      );

    default:
      return null;
  }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <Link
      href={activity.link}
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0 hover:bg-[var(--muted)]/30 -mx-2 px-2 sm:px-3 py-3 sm:py-4 rounded-lg transition-colors cursor-pointer"
    >
      {/* Avatar - Hidden on very small screens, shown on sm+ */}
      <div className={`hidden sm:flex flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(activity.assignedTo)} items-center justify-center text-white text-sm font-semibold`}>
        {getInitials(activity.assignedTo)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header with prominent type badge */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <ActivityTypeBadge type={activity.type} />
              <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">{activity.time}</span>
              {activity.type === 'task' && activity.metadata?.dueDate && (
                <>
                  <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">·</span>
                  <span className="text-xs sm:text-sm text-[var(--muted-foreground)]">
                    Due: {formatDate(activity.metadata.dueDate)}
                  </span>
                </>
              )}
            </div>
            <h4 className="font-semibold text-[var(--foreground)] text-sm sm:text-base mb-1 line-clamp-2 sm:line-clamp-1">{activity.entity || activity.title}</h4>
            {activity.type !== 'task' && (
              <p className="text-xs sm:text-sm text-[var(--muted-foreground)] line-clamp-2">{activity.description}</p>
            )}
            
            {/* Linked Entities for tasks */}
            {activity.type === 'task' && activity.linkedEntities && activity.linkedEntities.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-2 mt-1">
                <div className="flex gap-1.5 flex-wrap">
                  {activity.linkedEntities.slice(0, 3).map((link, idx) => (
                    <span
                      key={idx}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getLinkedEntityColor(link.type)}`}
                    >
                      {link.name}
                    </span>
                  ))}
                  {activity.linkedEntities.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      +{activity.linkedEntities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 self-start ${getStatusBadgeClass(activity.activityStatus)}`}>
            {capitalize(activity.activityStatus)}
          </span>
        </div>

        {/* Type-specific metadata */}
        <div className="mb-2">
          <ActivityMetadata activity={activity} />
        </div>

        {/* Tags */}
        {activity.type !== 'task' && activity.tags && activity.tags.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-3">
            <div className="flex gap-1 sm:gap-1.5 flex-wrap">
              {activity.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              {activity.tags.length > 3 && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs text-[var(--muted-foreground)]">
                  +{activity.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Mentions */}
        {activity.mentions && activity.mentions.length > 0 && (
          <div className="mb-2 text-xs">
            {activity.mentions.map((mention, idx) => (
              <span key={idx} className="text-[var(--primary)] mr-2">{mention}</span>
            ))}
          </div>
        )}

        {/* Linked Entities with color-coding - not for tasks (moved above) */}
        {activity.type !== 'task' && activity.linkedEntities && activity.linkedEntities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <div className="flex gap-1.5 flex-wrap">
              {activity.linkedEntities.slice(0, 3).map((link, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getLinkedEntityColor(link.type)}`}
                >
                  {link.name}
                </span>
              ))}
              {activity.linkedEntities.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  +{activity.linkedEntities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)] flex-wrap">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="10" cy="7" r="3"/>
              <path d="M4 18c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/>
            </svg>
            <span className="truncate max-w-[120px] sm:max-w-none">{activity.assignedTo}</span>
          </div>
          <span className="hidden sm:inline">·</span>
          <span>{activity.date}</span>
        </div>
      </div>
    </Link>
  );
}

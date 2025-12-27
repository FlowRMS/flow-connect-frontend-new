'use client';

import React, { useState } from 'react';
import type { ActivityV2 } from '../types';

interface ActivityTabV2Props {
  activities: ActivityV2[];
}

type ActivityFilter = 'all' | 'price_update' | 'approval_update' | 'approval_sent' | 'quote_sent' | 'status_change' | 'version_created';

const filterOptions: { value: ActivityFilter; label: string }[] = [
  { value: 'all', label: 'All Activity' },
  { value: 'price_update', label: 'Price Changes' },
  { value: 'approval_update', label: 'Approvals' },
  { value: 'approval_sent', label: 'Emails' },
  { value: 'version_created', label: 'Versions' },
];

function getActivityIcon(type: ActivityV2['type']) {
  switch (type) {
    case 'price_update':
      return {
        icon: (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 4v12M8 8l4-4 4 4M8 12l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        bg: 'bg-green-100',
        color: 'text-green-600',
        label: 'PRICE UPDATE',
        labelBg: 'bg-green-100 text-green-700',
      };
    case 'approval_update':
      return {
        icon: (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 6v4l2 2" strokeLinecap="round" />
          </svg>
        ),
        bg: 'bg-yellow-100',
        color: 'text-yellow-600',
        label: 'APPROVAL UPDATE',
        labelBg: 'bg-yellow-100 text-yellow-700',
      };
    case 'approval_sent':
      return {
        icon: (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="14" height="12" rx="2" />
            <path d="M3 6l7 5 7-5" strokeLinecap="round" />
          </svg>
        ),
        bg: 'bg-blue-100',
        color: 'text-blue-600',
        label: 'APPROVAL SENT',
        labelBg: 'bg-blue-100 text-blue-700',
      };
    case 'quote_sent':
      return {
        icon: (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 10l-4-4m0 0l-4 4m4-4v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        bg: 'bg-purple-100',
        color: 'text-purple-600',
        label: 'QUOTE SENT',
        labelBg: 'bg-purple-100 text-purple-700',
      };
    case 'status_change':
      return {
        icon: (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10h10M10 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        bg: 'bg-gray-100',
        color: 'text-gray-600',
        label: 'STATUS CHANGE',
        labelBg: 'bg-gray-100 text-gray-700',
      };
    case 'version_created':
      return {
        icon: (
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="14" height="14" rx="2" />
            <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
          </svg>
        ),
        bg: 'bg-indigo-100',
        color: 'text-indigo-600',
        label: 'VERSION CREATED',
        labelBg: 'bg-indigo-100 text-indigo-700',
      };
    default:
      return {
        icon: null,
        bg: 'bg-gray-100',
        color: 'text-gray-600',
        label: 'ACTIVITY',
        labelBg: 'bg-gray-100 text-gray-700',
      };
  }
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (hours < 24) {
    const h = Math.floor(hours);
    return `${h} hour${h !== 1 ? 's' : ''} ago`;
  }
  if (hours < 48) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function ActivityTabV2({ activities }: ActivityTabV2Props) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter((a) => a.type === filter || (filter === 'approval_sent' && (a.type === 'approval_sent' || a.type === 'quote_sent')));

  return (
    <div className="h-full overflow-auto">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Activity Feed</h3>
            <p className="text-sm text-gray-500">All activity and changes on this quote</p>
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {filterOptions.find((f) => f.value === filter)?.label || 'All Activity'}
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilter(opt.value); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filter === opt.value ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => {
            const iconInfo = getActivityIcon(activity.type);

            return (
              <div key={activity.id} className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full ${iconInfo.bg} ${iconInfo.color} flex items-center justify-center flex-shrink-0`}>
                  {iconInfo.icon}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Label and Time */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${iconInfo.labelBg}`}>
                      {iconInfo.label}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>

                  {/* Description */}
                  {activity.description && (
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  )}
                </div>
              </div>
            );
          })}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 text-gray-300">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-gray-500">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityTabV2;

/**
 * Activity Card Component
 */

import React from 'react';
import Link from 'next/link';
import type { Activity } from '../types';
import { getInitials, getAvatarColor, getStatusBadgeClass, capitalize } from '../utils';

interface ActivityCardProps {
  activity: Activity;
  index: number;
}

export function ActivityCard({ activity, index }: ActivityCardProps) {
  return (
    <Link
      key={index}
      href={activity.link}
      className="flex gap-4 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0 hover:bg-[var(--muted)]/30 -mx-2 px-2 py-3 rounded-lg transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(activity.assignedTo)} flex items-center justify-center text-white text-sm font-semibold`}>
        {getInitials(activity.assignedTo)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-[var(--foreground)]">{activity.title}</h4>
              <span className="text-sm text-[var(--muted-foreground)]">{activity.time}</span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-2">{activity.description}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadgeClass(activity.activityStatus)}`}>
            {capitalize(activity.activityStatus)}
          </span>
        </div>

        {/* Entity */}
        {activity.entityType && activity.entity && (
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                {activity.entityType}
              </span>
              <span className="text-[var(--muted-foreground)]">{activity.entity}</span>
            </div>
          </div>
        )}

        {/* Tags and Assigned To */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {activity.tags && activity.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {activity.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {activity.assignedTo && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="7" r="3"/>
                <path d="M4 18c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5"/>
              </svg>
              <span>{activity.assignedTo}</span>
            </div>
          )}
        </div>

        {/* Mentions */}
        {activity.mentions && activity.mentions.length > 0 && (
          <div className="mb-2 text-xs">
            {activity.mentions.map((mention, idx) => (
              <span key={idx} className="text-[var(--primary)] mr-2">{mention}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] pt-2 border-t border-[var(--border)]">
          <span>{activity.assignedTo}</span>
          <span>·</span>
          <span>{activity.date}</span>
          {activity.likes > 0 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{activity.likes}</span>
              </div>
            </>
          )}
          {activity.comments > 0 && (
            <>
              <span>·</span>
              <div className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 4c0-1 1-2 2-2h12c1 0 2 1 2 2v10c0 1-1 2-2 2H6l-4 3V4z" strokeLinecap="round"/>
                </svg>
                <span>{activity.comments}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

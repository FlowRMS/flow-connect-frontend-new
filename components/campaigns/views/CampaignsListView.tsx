/**
 * Campaigns List View Component
 * Enhanced with better styling, hover states, and visual feedback
 */

import React from 'react';
import type { Campaign } from '../types';
import { getStatusColor } from '../types';
import { formatDate } from '../utils';

interface CampaignsListViewProps {
  campaigns: Campaign[];
  onDelete?: (campaignId: string) => void;
  onPause?: (campaignId: string) => void;
  onResume?: (campaignId: string) => void;
  onEdit?: (campaignId: string) => void;
}

// Status icons
const StatusIcons: Record<string, React.ReactNode> = {
  Draft: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Scheduled: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  Sending: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  Completed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  Paused: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
};

// List type labels and colors
const LIST_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  STATIC: { label: 'Static', color: 'bg-purple-100 text-purple-700' },
  CRITERIA_BASED: { label: 'Criteria', color: 'bg-blue-100 text-blue-700' },
  DYNAMIC: { label: 'Dynamic', color: 'bg-green-100 text-green-700' },
};

export default function CampaignsListView({
  campaigns,
  onDelete,
  onPause,
  onResume,
  onEdit,
}: CampaignsListViewProps) {
  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--foreground)]">{campaigns.length}</div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Campaigns</div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {campaigns.filter(c => c.status === 'Completed').length}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Completed</div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {campaigns.filter(c => c.status === 'Sending').length}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Active</div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {campaigns.filter(c => c.status === 'Draft').length}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Drafts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] bg-gray-50/80">
          <div className="col-span-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Campaign
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Recipients
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Progress
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Date
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Actions
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 6l-10 7L2 6" />
              </svg>
              <span className="text-base font-medium">No campaigns yet</span>
              <span className="text-sm mt-1">Create your first email campaign to get started</span>
            </div>
          ) : (
            campaigns.map((campaign) => {
              const progress = campaign.sentCount && campaign.recipients
                ? Math.round((campaign.sentCount / campaign.recipients) * 100)
                : 0;
              const listTypeConfig = LIST_TYPE_CONFIG[campaign.recipientListType || 'STATIC'];

              return (
                <div
                  key={campaign.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  onClick={() => onEdit?.(campaign.id)}
                >
                  {/* Campaign Name & Subject */}
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        campaign.status === 'Draft' ? 'bg-gray-100' :
                        campaign.status === 'Scheduled' ? 'bg-yellow-100' :
                        campaign.status === 'Sending' ? 'bg-blue-100' :
                        campaign.status === 'Completed' ? 'bg-green-100' :
                        'bg-orange-100'
                      }`}>
                        <div className={
                          campaign.status === 'Draft' ? 'text-gray-600' :
                          campaign.status === 'Scheduled' ? 'text-yellow-600' :
                          campaign.status === 'Sending' ? 'text-blue-600' :
                          campaign.status === 'Completed' ? 'text-green-600' :
                          'text-orange-600'
                        }>
                          {StatusIcons[campaign.status]}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-blue-600 transition-colors truncate">
                          {campaign.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {listTypeConfig && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${listTypeConfig.color}`}>
                              {listTypeConfig.label}
                            </span>
                          )}
                          {campaign.subject && (
                            <p className="text-xs text-[var(--muted-foreground)] truncate">{campaign.subject}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {StatusIcons[campaign.status]}
                      {campaign.status}
                    </span>
                  </div>

                  {/* Recipients */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="text-sm font-medium text-[var(--foreground)]">{campaign.recipients}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="col-span-2 flex items-center">
                    {campaign.status === 'Sending' || campaign.status === 'Completed' ? (
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--foreground)]">
                            {campaign.sentCount} / {campaign.recipients}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              campaign.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">—</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className="text-sm text-[var(--foreground)]">
                        {campaign.status === 'Scheduled' && campaign.scheduledDate
                          ? formatDate(campaign.scheduledDate)
                          : formatDate(campaign.createdDate)}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {campaign.status === 'Scheduled' ? 'Scheduled' : 'Created'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Edit button - always shown for Draft and Scheduled */}
                      {(campaign.status === 'Draft' || campaign.status === 'Scheduled') && (
                        <button
                          onClick={() => onEdit?.(campaign.id)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Campaign"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {/* Pause for Scheduled or Sending */}
                      {(campaign.status === 'Scheduled' || campaign.status === 'Sending') && (
                        <button
                          onClick={() => onPause?.(campaign.id)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title={campaign.status === 'Sending' ? 'Pause Sending' : 'Cancel Schedule'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        </button>
                      )}
                      {/* Resume for Paused */}
                      {campaign.status === 'Paused' && (
                        <button
                          onClick={() => onResume?.(campaign.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Resume Campaign"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                      )}
                      {/* Delete button - only for Draft */}
                      {campaign.status === 'Draft' && (
                        <button
                          onClick={() => onDelete?.(campaign.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Campaign"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                      {/* View Stats for Completed */}
                      {campaign.status === 'Completed' && (
                        <button
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Statistics"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 20V10" />
                            <path d="M12 20V4" />
                            <path d="M6 20v-6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

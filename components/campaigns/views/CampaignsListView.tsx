/**
 * Campaigns List View Component
 */

import React from 'react';
import type { Campaign } from '../types';
import { getStatusColor, formatDate } from '../utils';

interface CampaignsListViewProps {
  campaigns: Campaign[];
}

export default function CampaignsListView({ campaigns }: CampaignsListViewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Campaign Name
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Recipients
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Date
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Progress
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Actions
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
            >
              <div className="col-span-3">
                <h3 className="font-medium text-[var(--foreground)] mb-1">{campaign.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">{campaign.subject}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--foreground)]">{campaign.recipients}</span>
              </div>
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
              <div className="col-span-2 flex items-center justify-center">
                {campaign.status === 'Sending' || campaign.status === 'Completed' ? (
                  <div className="text-sm">
                    <span className="font-medium text-[var(--foreground)]">{campaign.sentCount}</span>
                    <span className="text-[var(--muted-foreground)]"> / {campaign.recipients}</span>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--muted-foreground)]">-</span>
                )}
              </div>
              <div className="col-span-2 flex items-center justify-center gap-1">
                {/* Edit button - always shown for Draft */}
                {campaign.status === 'Draft' && (
                  <button
                    className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                    title="Edit Campaign"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
                {/* Duplicate button */}
                <button
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded transition-colors"
                  title="Duplicate Campaign"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                {/* Pause/Resume for Scheduled or Sending */}
                {(campaign.status === 'Scheduled' || campaign.status === 'Sending') && (
                  <button
                    className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                    title={campaign.status === 'Sending' ? 'Pause Sending' : 'Cancel Schedule'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  </button>
                )}
                {/* Delete button - only for Draft */}
                {campaign.status === 'Draft' && (
                  <button
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
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
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
          ))}
        </div>
      </div>
    </div>
  );
}

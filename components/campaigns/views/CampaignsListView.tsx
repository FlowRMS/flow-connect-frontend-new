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
          <div className="col-span-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Campaign Name
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Recipients
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Date
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
            Progress
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
            >
              <div className="col-span-4">
                <h3 className="font-medium text-[var(--foreground)] mb-1">{campaign.name}</h3>
                <p className="text-xs text-[var(--muted-foreground)]">{campaign.subject}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

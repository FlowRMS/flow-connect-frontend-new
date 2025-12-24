/**
 * Campaign Status Modal Component
 * Displays real-time campaign sending progress with polling
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  useCampaignSendingStatus,
  usePauseCampaign,
  useResumeCampaign,
  type CampaignSendingStatusResponse,
} from '../api';

interface CampaignStatusModalProps {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

// Status configuration for display
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  DRAFT: {
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  SCHEDULED: {
    label: 'Scheduled',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  SENDING: {
    label: 'Sending',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
  PAUSED: {
    label: 'Paused',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
      </svg>
    ),
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
};

// Send pace labels
const SEND_PACE_LABELS: Record<string, string> = {
  SLOW: '50 emails/hour',
  MEDIUM: '200 emails/hour',
  FAST: '500 emails/hour',
};

export default function CampaignStatusModal({
  campaignId,
  campaignName,
  isOpen,
  onClose,
  onStatusChange,
}: CampaignStatusModalProps) {
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [pollInterval, setPollInterval] = useState<number | undefined>(10000);

  // Poll for status updates
  const { data: status, isLoading, error, refetch } = useCampaignSendingStatus(
    isOpen ? campaignId : null,
    isOpen ? pollInterval : undefined
  );

  // Update poll interval based on status
  React.useEffect(() => {
    if (status?.status === 'SENDING') {
      setPollInterval(10000); // 10 seconds
    } else if (status?.status === 'PAUSED') {
      setPollInterval(30000); // 30 seconds
    } else if (status?.isCompleted) {
      setPollInterval(undefined); // Stop polling
    }
  }, [status?.status, status?.isCompleted]);

  const pauseCampaignMutation = usePauseCampaign();
  const resumeCampaignMutation = useResumeCampaign();

  // Handle pause campaign
  const handlePause = async () => {
    setIsPausing(true);
    try {
      await pauseCampaignMutation.mutateAsync(campaignId);
      refetch();
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    } finally {
      setIsPausing(false);
    }
  };

  // Handle resume campaign
  const handleResume = async () => {
    setIsResuming(true);
    try {
      await resumeCampaignMutation.mutateAsync(campaignId);
      refetch();
      onStatusChange?.();
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    } finally {
      setIsResuming(false);
    }
  };

  if (!isOpen) return null;

  const statusConfig = status ? STATUS_CONFIG[status.status] : STATUS_CONFIG.DRAFT;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center ${statusConfig.color}`}>
              {statusConfig.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">{campaignName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {status?.sendPace && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {SEND_PACE_LABELS[status.sendPace] || status.sendPace}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isLoading && !status ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
              <span className="ml-3 text-[var(--muted-foreground)]">Loading status...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Failed to load campaign status. Please try again.
            </div>
          ) : status ? (
            <div className="space-y-5">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Progress
                  </span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {status.progressDisplay}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      status.isCompleted ? 'bg-green-500' :
                      status.status === 'PAUSED' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${status.progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {status.progressPercentage.toFixed(1)}% complete
                  </span>
                  {status.emailsPerHour > 0 && status.status === 'SENDING' && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      ~{status.emailsPerHour} emails/hour
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{status.sentCount}</div>
                  <div className="text-xs text-green-700">Sent</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">{status.pendingCount}</div>
                  <div className="text-xs text-gray-700">Pending</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{status.failedCount}</div>
                  <div className="text-xs text-red-700">Failed</div>
                </div>
              </div>

              {/* Daily Limit Info */}
              <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">Today's Progress</span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {status.todaySentCount} / {status.maxEmailsPerDay} daily limit
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      status.canSendMoreToday ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min((status.todaySentCount / status.maxEmailsPerDay) * 100, 100)}%` }}
                  />
                </div>
                {!status.canSendMoreToday && (
                  <div className="mt-2 flex items-center gap-2 text-orange-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium">Daily limit reached. Sending will resume tomorrow.</span>
                  </div>
                )}
              </div>

              {/* Bounced emails warning */}
              {status.bouncedCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-yellow-800">
                      {status.bouncedCount} email{status.bouncedCount > 1 ? 's' : ''} bounced
                    </span>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      These emails could not be delivered to the recipients.
                    </p>
                  </div>
                </div>
              )}

              {/* Completion message */}
              {status.isCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Campaign Completed!</h4>
                    <p className="text-sm text-green-700">
                      All {status.totalRecipients} emails have been processed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer with actions */}
        <div className="flex items-center justify-between p-5 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <div className="text-xs text-[var(--muted-foreground)]">
            {status?.status === 'SENDING' && 'Auto-refreshing every 10 seconds'}
            {status?.status === 'PAUSED' && 'Campaign is paused'}
            {status?.isCompleted && 'Campaign finished'}
          </div>
          <div className="flex gap-2">
            {status?.status === 'SENDING' && (
              <button
                onClick={handlePause}
                disabled={isPausing}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPausing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Pausing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Pause Campaign
                  </>
                )}
              </button>
            )}
            {status?.status === 'PAUSED' && (
              <button
                onClick={handleResume}
                disabled={isResuming}
                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isResuming ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Resume Campaign
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Email Ingestion State Management Hook
 */

import { useState, useMemo } from 'react';
import { useEmails, useUpdateEmailStatus } from '../../hooks/useEmailApi';
import { mapStatusToFilter, emailNeedsAttention } from '../utils';
import type { FilterStatus, ViewMode } from '../types';

export function useEmailsState() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('All');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // Fetch emails from API (no status filter - we'll filter client-side)
  const { data: emails = [], isLoading, error } = useEmails();

  // Mutation for updating email status
  const updateEmailStatusMutation = useUpdateEmailStatus();

  // Filter emails based on selected status
  const filteredEmails = useMemo(() => {
    if (selectedStatus === 'All') {
      return emails;
    }

    return emails.filter(email => {
      const emailFilterStatus = mapStatusToFilter(email.status);
      return emailFilterStatus === selectedStatus;
    });
  }, [emails, selectedStatus]);

  // Get status counts
  const statusCounts = useMemo(() => {
    return {
      all: emails.length,
      processed: emails.filter(e => e.status === 'PROCESSED').length,
      needsAttention: emails.filter(e => emailNeedsAttention(e.status)).length,
    };
  }, [emails]);

  // Handle processing an email (updates to PROCESSED status)
  const handleProcessEmail = async (emailId: string) => {
    try {
      await updateEmailStatusMutation.mutateAsync({
        emailId,
        status: 'PROCESSED',
      });
    } catch (error) {
      console.error('Failed to process email:', error);
      // You might want to show a toast notification here
    }
  };

  return {
    viewMode,
    setViewMode,
    selectedStatus,
    setSelectedStatus,
    selectedEmailId,
    setSelectedEmailId,
    emails,
    filteredEmails,
    statusCounts,
    handleProcessEmail,
    isLoading,
    error,
  };
}

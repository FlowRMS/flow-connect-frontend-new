/**
 * Email Ingestion State Management Hook
 */

import { useState, useMemo } from 'react';
import { initialEmails } from '../mockData';
import type { Email, FilterStatus, ViewMode } from '../types';

export function useEmailsState() {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('All');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emails, setEmails] = useState<Email[]>(initialEmails);

  // Filter emails based on selected status
  const filteredEmails = useMemo(() => {
    if (selectedStatus === 'All') {
      return emails;
    }
    return emails.filter(email => email.status === selectedStatus);
  }, [emails, selectedStatus]);

  // Get status counts
  const statusCounts = useMemo(() => {
    return {
      all: emails.length,
      processed: emails.filter(e => e.status === 'Processed').length,
      needsAttention: emails.filter(e => e.status === 'Needs Attention').length,
    };
  }, [emails]);

  // Handle processing an email
  const handleProcessEmail = (emailId: string) => {
    setEmails(emails.map(email =>
      email.id === emailId
        ? { ...email, status: 'Processed' as const }
        : email
    ));
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
  };
}

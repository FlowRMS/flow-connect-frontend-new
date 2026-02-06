'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/auth';
import { searchOrganizations } from '@/lib/organizationsGqlSdk';
import {
  fetchPendingExchangeFiles,
  deleteExchangeFile,
  sendPendingExchangeFiles,
} from '@/lib/exchangeFilesGql';
import type { UploadedFile, Recipient, IntegrationMode } from '@/components/send';

/**
 * Configuration for the send data page behavior
 */
export interface SendDataConfig {
  /** Whether to search for rep firms (true) or manufacturers (false) */
  isRepFirms: boolean;
  /** Label for the recipient type (e.g., "manufacturers" or "rep firms") */
  recipientLabel: string;
  /** Icon type for recipients */
  recipientIcon: 'factory' | 'briefcase';
  /** Type identifier for the UploadModal */
  recipientType: 'manufacturers' | 'repFirms';
  /** Route paths */
  routes: {
    history: string;
    dashboard: string;
    issues: string;
  };
  /** UI labels */
  labels: {
    dashboardLabel: string;
    pageTitle: string;
    pageDescription: string;
    uploadModalTitle: string;
    fileMethodDescription: string;
    integrationMethodDescription: string;
  };
}

export interface UseSendDataOptions {
  config: SendDataConfig;
}

export interface UseSendDataReturn {
  // Modal states
  showUploadModal: boolean;
  setShowUploadModal: (show: boolean) => void;
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;

  // File states
  uploadedFiles: UploadedFile[];
  expandedFile: string | null;
  setExpandedFile: (fileId: string | null) => void;
  deletingFile: string | null;

  // Integration state
  integrationMode: IntegrationMode;
  setIntegrationMode: (mode: IntegrationMode) => void;

  // Recipient states
  recipients: Recipient[];
  isLoadingRecipients: boolean;
  recipientError: string | null;

  // Loading/sending states
  isLoadingPendingFiles: boolean;
  sendComplete: boolean;
  isSending: boolean;

  // Computed values
  totalRecords: number;
  hasBlockingIssues: boolean;

  // Actions
  handleSend: () => Promise<void>;
  handleRemoveFile: (backendFileId: string) => Promise<void>;
  handleUpload: (files: UploadedFile[]) => void;

  // Config (passed through for UI)
  config: SendDataConfig;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Unified hook for send data page logic.
 * Handles state management, data fetching, and actions for both
 * distributor and manufacturer send pages.
 */
export function useSendData({ config }: UseSendDataOptions): UseSendDataReturn {
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // File states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [isLoadingPendingFiles, setIsLoadingPendingFiles] = useState(false);

  // Integration state
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>('hold');

  // Recipient states
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);

  // Send states
  const [sendComplete, setSendComplete] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function loadSendData() {
      const token = await getAccessToken();

      setIsLoadingPendingFiles(true);
      setIsLoadingRecipients(true);

      try {
        const files = await fetchPendingExchangeFiles(token || undefined);
        setPendingFiles(files);
      } catch (error) {
        console.error('Failed to load pending files:', error);
        toast.error('Failed to load pending files');
      } finally {
        setIsLoadingPendingFiles(false);
      }

      try {
        const fetchedOrgs = await searchOrganizations(
          {
            searchTerm: '',
            repFirms: config.isRepFirms,
            connected: true,
            limit: 5,
          },
          token || undefined
        );
        const mappedRecipients: Recipient[] = fetchedOrgs.map((org) => ({
          id: org.id,
          name: org.name,
          territory: org.domain || undefined,
        }));
        setRecipients(mappedRecipients);
      } catch (error) {
        console.error('Failed to load recipients:', error);
        setRecipientError('Failed to load recipients');
        toast.error('Failed to load recipients');
      } finally {
        setIsLoadingRecipients(false);
      }
    }

    loadSendData();
  }, [config.isRepFirms]);

  // Convert pending files to UploadedFile format
  useEffect(() => {
    if (pendingFiles.length === 0) return;

    const convertedFiles: UploadedFile[] = pendingFiles.map((file) => {
      const mockFile = new File([], file.fileName, { type: file.fileType });
      const [year, month] = file.reportingPeriod.split('-');
      const periodFormatted = `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;

      let dataType: 'pos' | 'pot' | 'pos_pot' = 'pos';
      if (file.isPos && file.isPot) dataType = 'pos_pot';
      else if (file.isPot) dataType = 'pot';

      let status: 'pending' | 'validated' | 'error' = 'pending';
      if (file.validationStatus === 'VALID') status = 'validated';
      else if (file.validationStatus === 'INVALID') status = 'error';

      const recipientNames = file.targetOrganizations
        .map((target: any) => {
          const recipient = recipients.find((r) => r.id === target.connectedOrgId);
          if (!recipient) {
            return isLoadingRecipients ? 'Loading...' : 'Unknown';
          }
          return recipient.name;
        })
        .filter((name: string) => name !== 'Unknown' && name !== '#N/A');

      return {
        file: mockFile,
        period: periodFormatted,
        dataType,
        recipients: recipientNames,
        status,
        recordCount: file.rowCount,
        backendFileId: file.id,
        issues: { blocking: 0, warnings: 0, fyi: 0 },
      };
    });

    setUploadedFiles(convertedFiles);
  }, [pendingFiles, recipients, isLoadingRecipients]);

  // Computed values
  const totalRecords = useMemo(
    () => uploadedFiles.reduce((sum, f) => sum + (f.recordCount || 0), 0),
    [uploadedFiles]
  );

  const hasBlockingIssues = useMemo(
    () => uploadedFiles.some((f) => f.issues && f.issues.blocking > 0),
    [uploadedFiles]
  );

  // Actions
  const handleSend = useCallback(async () => {
    setShowConfirmModal(false);
    setIsSending(true);

    try {
      const token = await getAccessToken();
      const result = await sendPendingExchangeFiles(token || undefined);

      if (result.success) {
        toast.success(
          `Successfully sent ${result.filesSent} ${result.filesSent === 1 ? 'file' : 'files'}`
        );
        setSendComplete(true);
      } else {
        toast.error('Failed to send files');
      }
    } catch (error) {
      console.error('Failed to send files:', error);
      toast.error('Failed to send files. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, []);

  const handleRemoveFile = useCallback(async (backendFileId: string) => {
    if (!backendFileId) {
      toast.error('Cannot delete file: No backend ID found');
      return;
    }

    setDeletingFile(backendFileId);
    try {
      const token = await getAccessToken();
      const success = await deleteExchangeFile(backendFileId, token || undefined);

      if (success) {
        toast.success('File deleted successfully');
        setUploadedFiles((files) => files.filter((f) => f.backendFileId !== backendFileId));
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  }, []);

  const handleUpload = useCallback((files: UploadedFile[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    setShowUploadModal(false);
  }, []);

  return {
    showUploadModal,
    setShowUploadModal,
    showConfirmModal,
    setShowConfirmModal,
    uploadedFiles,
    expandedFile,
    setExpandedFile,
    deletingFile,
    integrationMode,
    setIntegrationMode,
    recipients,
    isLoadingRecipients,
    recipientError,
    isLoadingPendingFiles,
    sendComplete,
    isSending,
    totalRecords,
    hasBlockingIssues,
    handleSend,
    handleRemoveFile,
    handleUpload,
    config,
  };
}

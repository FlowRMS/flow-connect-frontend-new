'use client';

import React, { useState, useRef, useCallback } from 'react';
import type {
  Submittal,
  SubmittalRevision,
  SubmittalStakeholder,
  ReturnedPdf,
} from '../../lib/types/submittals';
import { uploadFileWithProgress, getFilePresignedUrl } from '../lib/graphql/files';
import {
  useAddReturnedPdf,
  useAddChangeAnalysis,
  type ChangeAnalysisSourceGQL,
  type OverallChangeStatusGQL,
  type ItemChangeStatusGQL,
} from './api/useSubmittalsApi';
import { mapReturnedPdfResponse } from './types/submittal-transforms';

// Maximum file size in bytes (100MB)
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface ReturnedPdfUploadProps {
  submittal: Submittal;
  revision: SubmittalRevision;
  onClose: () => void;
  onSuccess?: (returnedPdf: ReturnedPdf) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Simulated AI analysis - will be replaced with actual AI service when available
function simulateAIAnalysis(submittal: Submittal): {
  analyzedBy: ChangeAnalysisSourceGQL;
  overallStatus: OverallChangeStatusGQL;
  summary: string;
  itemChanges: Array<{
    itemId?: string;
    fixtureType: string;
    catalogNumber: string;
    manufacturer: string;
    status: ItemChangeStatusGQL;
    notes?: string[];
    pageReferences?: number[];
  }>;
} {
  // Randomly select some items to have changes
  const itemsWithChanges = submittal.items
    .filter(() => Math.random() > 0.5)
    .slice(0, 3);

  const statuses: ItemChangeStatusGQL[] = [
    'APPROVED_AS_NOTED',
    'REVISE',
    'REJECTED',
  ];

  const itemChanges = itemsWithChanges.map((item, idx) => ({
    itemId: item.id,
    fixtureType: item.fixtureType,
    catalogNumber: item.catalogNumber,
    manufacturer: item.manufacturer,
    status: statuses[idx % statuses.length],
    notes: [
      idx === 0 ? 'Verify mounting height requirements' :
      idx === 1 ? 'Change finish color per architect request' :
      'Check lead time availability',
    ],
    pageReferences: [Math.floor(Math.random() * 20) + 1],
  }));

  const hasRejected = itemChanges.some(c => c.status === 'REJECTED');
  const hasRevise = itemChanges.some(c => c.status === 'REVISE');
  const overallStatus: OverallChangeStatusGQL = hasRejected
    ? 'REJECTED'
    : hasRevise
    ? 'REVISE_AND_RESUBMIT'
    : itemChanges.length > 0
    ? 'APPROVED_AS_NOTED'
    : 'APPROVED';

  return {
    analyzedBy: 'AI' as ChangeAnalysisSourceGQL,
    overallStatus,
    summary: itemChanges.length > 0
      ? `${itemChanges.length} items require attention. Please review the marked changes.`
      : 'No changes detected. Document appears to be approved.',
    itemChanges,
  };
}

export default function ReturnedPdfUpload({
  submittal,
  revision,
  onClose,
  onSuccess,
}: ReturnedPdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedStakeholder, setSelectedStakeholder] = useState<SubmittalStakeholder | null>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [analyzeWithAI, setAnalyzeWithAI] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addReturnedPdfMutation = useAddReturnedPdf();
  const addChangeAnalysisMutation = useAddChangeAnalysis();

  // All stakeholders who might return a document
  const stakeholders = [
    ...submittal.engineers,
    ...submittal.architects,
    ...submittal.customers,
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(f => f.type === 'application/pdf');
    if (pdfFile) {
      // Validate file size
      if (pdfFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(pdfFile.size / (1024 * 1024)).toFixed(1)}MB.`);
        return;
      }
      setSelectedFile(pdfFile);
      setError(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        e.target.value = ''; // Clear the input
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedStakeholder) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 1. Upload the file to storage with progress tracking
      const uploadedFile = await uploadFileWithProgress({
        file: selectedFile,
        fileName: selectedFile.name,
        folderPath: `submittals/${submittal.id}/returned`,
        onProgress: (progress) => setUploadProgress(progress),
      });

      // 2. Get the presigned URL for the file
      const fileUrl = await getFilePresignedUrl(uploadedFile.id);
      if (!fileUrl) {
        throw new Error('Failed to get file URL');
      }

      // 3. Add the returned PDF to the revision
      if (!revision.id) {
        throw new Error('Revision ID is required');
      }
      const returnedPdf = await addReturnedPdfMutation.mutateAsync({
        submittalId: submittal.id,
        input: {
          revisionId: revision.id,
          fileName: selectedFile.name,
          fileUrl: fileUrl,
          fileSize: selectedFile.size,
          returnedByStakeholderId: selectedStakeholder.contactId,
          receivedDate: receivedDate,
          notes: notes || undefined,
        },
      });

      // 4. If AI analysis is enabled, add change analysis
      let analysisResponse = null;
      if (analyzeWithAI) {
        setAnalyzing(true);

        // Simulate AI analysis delay (will be replaced with real AI service)
        await new Promise(resolve => setTimeout(resolve, 1500));

        const analysisResult = simulateAIAnalysis(submittal);

        analysisResponse = await addChangeAnalysisMutation.mutateAsync({
          submittalId: submittal.id,
          input: {
            returnedPdfId: returnedPdf.id,
            analyzedBy: analysisResult.analyzedBy,
            overallStatus: analysisResult.overallStatus,
            summary: analysisResult.summary,
            itemChanges: analysisResult.itemChanges,
          },
        });

        setAnalyzing(false);
      }

      // Build the full returned PDF response for the parent
      const fullResponse = {
        ...returnedPdf,
        changeAnalysis: analysisResponse,
      };
      const mappedReturnedPdf = mapReturnedPdfResponse(fullResponse, revision.revisionNumber);

      // Success - notify parent with the result, then close
      onSuccess?.(mappedReturnedPdf);
      onClose();
    } catch (err) {
      console.error('Error uploading returned PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const isValid = selectedFile && selectedStakeholder && receivedDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Upload Returned Submittal</h2>
              <p className="text-xs text-[var(--muted-foreground)]">Revision {revision.revisionNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragging
                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--muted)]/30'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-600">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
                    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--foreground)]">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{formatFileSize(selectedFile.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--foreground)] mb-1">
                  Drag and drop PDF here, or click to browse
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  PDF files only (max {MAX_FILE_SIZE_MB}MB)
                </p>
              </>
            )}
          </div>

          {/* Received From */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Received From <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStakeholder?.contactId || ''}
              onChange={(e) => {
                const stakeholder = stakeholders.find(s => s.contactId === e.target.value);
                setSelectedStakeholder(stakeholder || null);
              }}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            >
              <option value="">Select stakeholder...</option>
              {stakeholders.map(s => (
                <option key={s.contactId} value={s.contactId}>
                  {s.contactName} - {s.companyName || s.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date Received */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Date Received <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Notes <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this response..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none"
            />
          </div>

          {/* AI Analysis Toggle */}
          <div className="bg-[var(--muted)]/30 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={analyzeWithAI}
                onChange={(e) => setAnalyzeWithAI(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Analyze PDF for changes (AI-assisted)
                </span>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Automatically detect markups, stamps, and comments that need attention
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="px-6 py-2 bg-[var(--muted)]/20">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-[var(--muted-foreground)] min-w-[3rem] text-right">
                {uploadProgress}%
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!isValid || uploading || analyzing}
            className="px-6 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading || analyzing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {analyzing ? 'Analyzing...' : `Uploading... ${uploadProgress}%`}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

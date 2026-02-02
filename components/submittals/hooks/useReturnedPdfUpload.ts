import { useState, useRef, useCallback } from 'react';
import type {
  Submittal,
  SubmittalRevision,
  SubmittalStakeholder,
  ReturnedPdf,
} from '../../../lib/types/submittals';
import { uploadFileWithProgress, getFilePresignedUrl } from '../../lib/graphql/files';
import {
  useAddReturnedPdf,
  useAddChangeAnalysis,
  type ChangeAnalysisSourceGQL,
  type OverallChangeStatusGQL,
  type ItemChangeStatusGQL,
} from '../api/useSubmittalsApi';
import { mapReturnedPdfResponse } from '../types/submittal-transforms';

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

interface UseReturnedPdfUploadParams {
  submittal: Submittal;
  revision: SubmittalRevision;
  onClose: () => void;
  onSuccess?: (returnedPdf: ReturnedPdf) => void;
}

export function useReturnedPdfUpload({
  submittal,
  revision,
  onClose,
  onSuccess,
}: UseReturnedPdfUploadParams) {
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
      if (pdfFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(pdfFile.size / (1024 * 1024)).toFixed(1)}MB.`);
        return;
      }
      setSelectedFile(pdfFile);
      setError(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedStakeholder) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploadedFile = await uploadFileWithProgress({
        file: selectedFile,
        fileName: selectedFile.name,
        folderPath: `submittals/${submittal.id}/returned`,
        onProgress: (progress) => setUploadProgress(progress),
      });

      const fileUrl = await getFilePresignedUrl(uploadedFile.id);
      if (!fileUrl) {
        throw new Error('Failed to get file URL');
      }

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
          fileId: uploadedFile.id,  // Store file ID for fresh presigned URL generation
          returnedByStakeholderId: selectedStakeholder.contactId,
          receivedDate: receivedDate,
          notes: notes || undefined,
        },
      });

      let analysisResponse = null;
      if (analyzeWithAI) {
        setAnalyzing(true);
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

      const fullResponse = {
        ...returnedPdf,
        changeAnalysis: analysisResponse,
      };
      const mappedReturnedPdf = mapReturnedPdfResponse(fullResponse, revision.revisionNumber);

      onSuccess?.(mappedReturnedPdf);
      onClose();
    } catch (err) {
      console.error('Error uploading returned PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setUploading(false);
      setAnalyzing(false);
    }
  }, [selectedFile, selectedStakeholder, submittal, revision, receivedDate, notes, analyzeWithAI, addReturnedPdfMutation, addChangeAnalysisMutation, onSuccess, onClose]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const isValid = selectedFile && selectedStakeholder && receivedDate;

  return {
    // State
    isDragging,
    selectedFile,
    selectedStakeholder,
    setSelectedStakeholder,
    receivedDate,
    setReceivedDate,
    notes,
    setNotes,
    analyzeWithAI,
    setAnalyzeWithAI,
    uploading,
    uploadProgress,
    analyzing,
    error,
    fileInputRef,
    stakeholders,
    isValid,

    // Handlers
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleUpload,
    clearFile,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MAX_FILE_SIZE_MB_EXPORT = MAX_FILE_SIZE_MB;

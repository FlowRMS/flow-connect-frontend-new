/**
 * Upload operations hook
 * Handles file upload state and operations
 */

import { useState, useCallback } from 'react';
import type { Takeoff, TakeoffDocument, ParsedItem, DocumentClassification } from '../../types';
import { transformTakeoffResponse } from '../../types';
import {
  createTakeoffWithFiles,
  type UploadProgressCallback,
} from '../../../lib/graphql/takeoffs';
import { takeoffToasts } from '../../../lib/toast';
import type { FileUploadProgress } from '../types';

interface UseUploadProps {
  setTakeoffsData: React.Dispatch<React.SetStateAction<Takeoff[]>>;
  setSelectedTakeoff: React.Dispatch<React.SetStateAction<Takeoff | null>>;
  setDocuments: React.Dispatch<React.SetStateAction<TakeoffDocument[]>>;
  setViewMode: React.Dispatch<React.SetStateAction<'list' | 'detail'>>;
  setCurrentStep: React.Dispatch<React.SetStateAction<import('../../types').TakeoffStep>>;
  setShowUploadModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShouldAutoClassify: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  currentUserName: string;
}

export function useUpload({
  setTakeoffsData,
  setSelectedTakeoff,
  setDocuments,
  setViewMode,
  setCurrentStep,
  setShowUploadModal,
  setShouldAutoClassify,
  setError,
}: UseUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  // File selection
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setUploadedFiles(prev => [...prev, ...fileArray].slice(0, 20));
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  }, []);

  const handleClearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Progress callback
  const handleUploadProgress: UploadProgressCallback = useCallback((
    fileIndex: number,
    progress: number,
    status: 'uploading' | 'complete' | 'error',
    error?: string
  ) => {
    setUploadProgress(prev => ({
      ...prev,
      [fileIndex]: { progress, status, error }
    }));
  }, []);

  // Create new takeoff with files
  const handleUploadStart = useCallback(async (projectData?: {
    projectName: string;
    clientName: string;
    bidDate: string;
    estimatedValue: string;
    city: string;
    state: string;
  }) => {
    if (uploadedFiles.length === 0) {
      takeoffToasts.uploadError('No files selected. Please select files to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    // Initialize progress
    const initialProgress: Record<number, FileUploadProgress> = {};
    uploadedFiles.forEach((_, index) => {
      initialProgress[index] = { progress: 0, status: 'pending' };
    });
    setUploadProgress(initialProgress);

    try {
      const newTakeoff = await createTakeoffWithFiles(
        {
          title: projectData?.projectName || `New Takeoff - ${new Date().toLocaleDateString()}`,
          source: 'Manual Upload',
          metadata: projectData ? {
            clientName: projectData.clientName,
            bidDate: projectData.bidDate,
            estimatedValue: projectData.estimatedValue,
            city: projectData.city,
            state: projectData.state,
          } : undefined,
          files: uploadedFiles,
        },
        handleUploadProgress
      );

      const transformed = transformTakeoffResponse(newTakeoff);
      setTakeoffsData(prev => [transformed, ...prev]);
      setSelectedTakeoff(transformed);
      setViewMode('detail');
      setCurrentStep('classification');

      // Set documents
      const docCount = transformed.documents?.length || newTakeoff.documents?.length || 0;
      if (transformed.documents && transformed.documents.length > 0) {
        setDocuments(transformed.documents);
      } else if (newTakeoff.documents && newTakeoff.documents.length > 0) {
        const docs = newTakeoff.documents.map(doc => formatDocument(doc));
        setDocuments(docs);
      }

      takeoffToasts.uploadSuccess(projectData?.projectName || 'Project', docCount);
      setShouldAutoClassify(true);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Failed to create takeoff:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create takeoff';
      takeoffToasts.uploadError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsUploading(false);
      setUploadedFiles([]);
      setUploadProgress({});
    }
  }, [uploadedFiles, handleUploadProgress, setTakeoffsData, setSelectedTakeoff, setDocuments, setViewMode, setCurrentStep, setShouldAutoClassify, setShowUploadModal, setError]);

  return {
    uploadedFiles,
    setUploadedFiles,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    handleFileSelect,
    handleRemoveFile,
    handleClearFiles,
    handleUploadProgress,
    handleUploadStart,
  };
}

// Helper to format document from API response
function formatDocument(doc: {
  id: string;
  name: string;
  fileSize: number;
  createdAt: string;
  confidence?: number | null;
  pages: number;
  abridged: boolean;
  abridgedPages?: number | null;
  reductionPercentage?: number | null;
  documentUrl?: string | null;
}): TakeoffDocument {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return {
    id: doc.id,
    name: doc.name,
    type: 'PDF' as const,
    size: formatSize(doc.fileSize),
    uploadDate: doc.createdAt,
    classification: '' as DocumentClassification,
    confidence: doc.confidence || 0,
    pages: doc.pages,
    abridged: doc.abridged,
    abridgedPages: doc.abridgedPages || undefined,
    reductionPercentage: doc.reductionPercentage || undefined,
    documentUrl: doc.documentUrl || undefined,
  };
}

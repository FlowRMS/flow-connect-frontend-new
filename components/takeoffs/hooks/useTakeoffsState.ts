/**
 * Custom Hook for Take-Offs State Management
 * Connects to flow-ai backend for real data
 * Integrates with CRM storage for file uploads
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  Takeoff,
  TakeoffDocument,
  ParsedItem,
  TakeoffViewMode,
  TakeoffStep,
  DocumentClassification
} from '../types';
import { transformTakeoffResponse } from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import {
  fetchUserTakeoffs,
  deleteTakeoff as apiDeleteTakeoff,
  createTakeoffWithFiles,
  type UploadProgressCallback,
} from '../../lib/graphql/takeoffs';
import {
  abridgeDocument,
  abridgeAllDocuments,
  classifyDocument,
  crossItem,
  crossItems,
  crossAllItems,
  getInitialStep,
} from '../utils';

// Upload progress state type
export interface FileUploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function useTakeoffsState() {
  // View state
  const [viewMode, setViewMode] = useState<TakeoffViewMode>('list');
  const [selectedTakeoff, setSelectedTakeoff] = useState<Takeoff | null>(null);
  const [currentStep, setCurrentStep] = useState<TakeoffStep>('classification');

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAbridgmentReportModal, setShowAbridgmentReportModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TakeoffDocument | null>(null);

  // Data state
  const [takeoffsData, setTakeoffsData] = useState<Takeoff[]>([]);
  const [documents, setDocuments] = useState<TakeoffDocument[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<Record<number, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch takeoffs from API with filters
  const loadTakeoffs = useCallback(async (options?: {
    search?: string;
    status?: string;
    source?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchUserTakeoffs({
        limit: 100,
        search: options?.search || undefined,
        status: options?.status || undefined,
        source: options?.source || undefined,
      });
      const transformedTakeoffs = response.map(transformTakeoffResponse);
      setTakeoffsData(transformedTakeoffs);
    } catch (err) {
      console.error('Failed to fetch takeoffs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load takeoffs');
      setTakeoffsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extract status filter from active filters
  const statusFilter = useMemo(() => {
    const statusFilterItem = activeFilters.find(f => f.columnName === 'status');
    if (statusFilterItem?.values && statusFilterItem.values.length > 0) {
      // For now, use the first status value (backend only supports single status)
      return statusFilterItem.values[0];
    }
    return undefined;
  }, [activeFilters]);

  // Debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load takeoffs when filters change
  useEffect(() => {
    loadTakeoffs({
      search: debouncedSearch || undefined,
      status: statusFilter,
    });
  }, [loadTakeoffs, debouncedSearch, statusFilter]);

  // Takeoffs from data (backend already filters)
  const takeoffs = takeoffsData;

  // Document handlers
  const handleClassifyDocument = useCallback((docId: string, classification: DocumentClassification) => {
    setDocuments(docs => classifyDocument(docs, docId, classification));
  }, []);

  const handleAbridgeDocument = useCallback((docId: string) => {
    setDocuments(docs =>
      docs.map(doc => doc.id === docId ? abridgeDocument(doc) : doc)
    );
  }, []);

  const handleAbridgeAll = useCallback(() => {
    setDocuments(docs => abridgeAllDocuments(docs));
  }, []);

  // Parsed items handlers
  const handleCrossItem = useCallback((itemId: string) => {
    setParsedItems(items =>
      items.map(item => item.id === itemId ? crossItem(item) : item)
    );
  }, []);

  const handleCrossSelected = useCallback(() => {
    setParsedItems(items => crossItems(items, selectedItems));
    setSelectedItems(new Set());
  }, [selectedItems]);

  const handleCrossAll = useCallback(() => {
    setParsedItems(items => crossAllItems(items));
  }, []);

  const handleToggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllItems = useCallback((checked: boolean) => {
    if (checked) {
      const selectableIds = parsedItems
        .filter(item => !item.isOurManufacturer && !item.isCrossed)
        .map(item => item.id);
      setSelectedItems(new Set(selectableIds));
    } else {
      setSelectedItems(new Set());
    }
  }, [parsedItems]);

  // File upload handlers
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      // Append new files to existing, limit to 20 total
      setUploadedFiles(prev => [...prev, ...fileArray].slice(0, 20));
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  }, []);

  const handleClearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Progress callback for upload
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

  // Create new takeoff with project data and real file upload
  const handleUploadStart = useCallback(async (projectData?: {
    projectName: string;
    clientName: string;
    bidDate: string;
    estimatedValue: string;
    city: string;
    state: string;
  }) => {
    if (uploadedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    // Initialize progress for all files
    const initialProgress: Record<number, FileUploadProgress> = {};
    uploadedFiles.forEach((_, index) => {
      initialProgress[index] = { progress: 0, status: 'pending' };
    });
    setUploadProgress(initialProgress);

    try {
      // Upload files to CRM storage and create takeoff in flow-ai
      const newTakeoff = await createTakeoffWithFiles(
        {
          title: projectData?.projectName || `New Takeoff - ${new Date().toLocaleDateString()}`,
          source: 'Upload',
          createdBy: 'Current User', // TODO: Get from auth context
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

      // Add to list and select it
      setTakeoffsData(prev => [transformed, ...prev]);
      setSelectedTakeoff(transformed);
      setViewMode('detail');
      setCurrentStep('classification');

      // Set documents for the detail view
      if (transformed.documents) {
        setDocuments(transformed.documents);
      }

      // Close modal after success
      setShowUploadModal(false);
    } catch (err) {
      console.error('Failed to create takeoff:', err);
      setError(err instanceof Error ? err.message : 'Failed to create takeoff');
      // Don't close modal on error so user can retry
    } finally {
      setIsUploading(false);
      setUploadedFiles([]);
      setUploadProgress({});
    }
  }, [uploadedFiles, handleUploadProgress]);

  // Navigation handlers
  const handleSelectTakeoff = useCallback((takeoff: Takeoff) => {
    setSelectedTakeoff(takeoff);
    setViewMode('detail');
    setCurrentStep(getInitialStep(takeoff.status));

    // Load documents for the selected takeoff
    if (takeoff.documents) {
      setDocuments(takeoff.documents);
      // Extract parsed items from documents
      const allParsedItems: ParsedItem[] = [];
      takeoff.documents.forEach(doc => {
        if (doc.parsedItems) {
          allParsedItems.push(...doc.parsedItems);
        }
      });
      setParsedItems(allParsedItems);
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTakeoff(null);
    setDocuments([]);
    setParsedItems([]);
    setSelectedItems(new Set());
  }, []);

  const handleCreateQuote = useCallback(() => {
    alert('Quote created successfully! You can view it on the Quotes page.');
    setViewMode('list');
    setSelectedTakeoff(null);
  }, []);

  // Delete takeoff
  const handleDeleteTakeoff = useCallback(async (takeoffId: string) => {
    try {
      await apiDeleteTakeoff(takeoffId);
      setTakeoffsData(prev => prev.filter(t => t.id !== takeoffId));
    } catch (err) {
      console.error('Failed to delete takeoff:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete takeoff');
    }
  }, []);

  // Refresh data with current filters
  const handleRefresh = useCallback(() => {
    loadTakeoffs({
      search: debouncedSearch || undefined,
      status: statusFilter,
    });
  }, [loadTakeoffs, debouncedSearch, statusFilter]);

  // Modal handlers
  const handleOpenUploadModal = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
    setUploadedFiles([]);
  }, []);

  const handleOpenAbridgmentReport = useCallback((doc: TakeoffDocument) => {
    setSelectedDocument(doc);
    setShowAbridgmentReportModal(true);
  }, []);

  const handleCloseAbridgmentReport = useCallback(() => {
    setShowAbridgmentReportModal(false);
    setSelectedDocument(null);
  }, []);

  return {
    // View state
    viewMode,
    selectedTakeoff,
    currentStep,
    setCurrentStep,

    // Filter state
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,

    // Data
    takeoffs,
    documents,
    parsedItems,
    selectedItems,
    uploadedFiles,

    // Upload state
    uploadProgress,
    isUploading,

    // Loading/Error states
    isLoading,
    error,

    // Modal state
    showUploadModal,
    showAbridgmentReportModal,
    selectedDocument,

    // Document handlers
    handleClassifyDocument,
    handleAbridgeDocument,
    handleAbridgeAll,

    // Parsed items handlers
    handleCrossItem,
    handleCrossSelected,
    handleCrossAll,
    handleToggleSelectItem,
    handleSelectAllItems,

    // File handlers
    handleFileSelect,
    handleRemoveFile,
    handleClearFiles,

    // Navigation handlers
    handleUploadStart,
    handleSelectTakeoff,
    handleBackToList,
    handleCreateQuote,
    handleDeleteTakeoff,
    handleRefresh,

    // Modal handlers
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleOpenAbridgmentReport,
    handleCloseAbridgmentReport,
  };
}

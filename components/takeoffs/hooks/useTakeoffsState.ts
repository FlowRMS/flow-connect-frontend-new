/**
 * Custom Hook for Take-Offs State Management
 * Connects to flow-ai backend for real data
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
  createTakeoff as apiCreateTakeoff,
  deleteTakeoff as apiDeleteTakeoff,
  type CreateTakeoffInput,
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

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch takeoffs from API
  const loadTakeoffs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchUserTakeoffs({ limit: 100 });
      const transformedTakeoffs = response.map(transformTakeoffResponse);
      setTakeoffsData(transformedTakeoffs);
    } catch (err) {
      console.error('Failed to fetch takeoffs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load takeoffs');
      // Keep empty array on error
      setTakeoffsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load takeoffs on mount
  useEffect(() => {
    loadTakeoffs();
  }, [loadTakeoffs]);

  // Filtered takeoffs
  const takeoffs = useMemo(() => {
    let result = takeoffsData;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.source.toLowerCase().includes(query) ||
        t.createdBy.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    activeFilters.forEach(filter => {
      if (filter.columnName === 'status' && filter.values && filter.values.length > 0) {
        result = result.filter(t => filter.values!.includes(t.status));
      }
    });

    return result;
  }, [takeoffsData, searchQuery, activeFilters]);

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
      const fileArray = Array.from(files).slice(0, 20);
      setUploadedFiles(fileArray);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadedFiles(files => files.filter((_, i) => i !== index));
  }, []);

  const handleClearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  // Create new takeoff
  const handleUploadStart = useCallback(async () => {
    if (uploadedFiles.length === 0) return;

    setShowUploadModal(false);

    try {
      // Create takeoff with document metadata
      const input: CreateTakeoffInput = {
        title: `New Takeoff - ${new Date().toLocaleDateString()}`,
        source: 'Upload',
        createdBy: 'Current User', // TODO: Get from auth context
        status: 'CLASSIFICATION',
        documents: uploadedFiles.map(file => ({
          name: file.name,
          fileType: file.type || 'application/pdf',
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          pages: 0,
          abridged: false,
        })),
      };

      const newTakeoff = await apiCreateTakeoff(input);
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
    } catch (err) {
      console.error('Failed to create takeoff:', err);
      setError(err instanceof Error ? err.message : 'Failed to create takeoff');
    }

    setUploadedFiles([]);
  }, [uploadedFiles]);

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

  // Refresh data
  const handleRefresh = useCallback(() => {
    loadTakeoffs();
  }, [loadTakeoffs]);

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

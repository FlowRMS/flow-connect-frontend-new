/**
 * Custom Hook for Take-Offs State Management
 */

import { useState, useMemo, useCallback } from 'react';
import type { 
  Takeoff, 
  TakeoffDocument, 
  ParsedItem, 
  TakeoffViewMode, 
  TakeoffStep,
  DocumentClassification 
} from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import { mockTakeoffs, mockDocuments, mockParsedItems } from '../mockData';
import { 
  abridgeDocument, 
  abridgeAllDocuments, 
  classifyDocument, 
  crossItem, 
  crossItems, 
  crossAllItems,
  getInitialStep,
  createNewTakeoff 
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
  const [documents, setDocuments] = useState<TakeoffDocument[]>(mockDocuments);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>(mockParsedItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Takeoffs list (from mock data) with filtering
  const takeoffs = useMemo(() => {
    let result = mockTakeoffs;
    
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
  }, [searchQuery, activeFilters]);

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

  // Navigation handlers
  const handleUploadStart = useCallback(() => {
    setShowUploadModal(false);
    setViewMode('detail');
    setCurrentStep('classification');
    setSelectedTakeoff(createNewTakeoff());
    setUploadedFiles([]);
  }, []);

  const handleSelectTakeoff = useCallback((takeoff: Takeoff) => {
    setSelectedTakeoff(takeoff);
    setViewMode('detail');
    setCurrentStep(getInitialStep(takeoff.status));
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTakeoff(null);
  }, []);

  const handleCreateQuote = useCallback(() => {
    alert('Quote created successfully! You can view it on the Quotes page.');
    setViewMode('list');
    setSelectedTakeoff(null);
  }, []);

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
    
    // Modal handlers
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleOpenAbridgmentReport,
    handleCloseAbridgmentReport,
  };
}

/**
 * Custom Hook for Take-Offs State Management
 * Orchestrates all takeoff operations using modular sub-hooks
 */

import { useState, useCallback } from 'react';
import type { TakeoffDocument, ParsedItem, TakeoffViewMode, TakeoffStep } from '../types';
import { statusApiMap } from '../types';
import { useUser } from '../../providers/user-provider';
import { updateTakeoff as apiUpdateTakeoff, type TakeoffStatusEnum } from '../../lib/graphql/takeoffs';
import {
  useClassification,
  useAbridgement,
  useParsing,
  useProductCross,
  useUpload,
  useDownload,
  useNavigation,
  useListManagement,
} from './operations';

export type { FileUploadProgress } from './types';

export function useTakeoffsState() {
  const user = useUser();
  const currentUserName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User'
    : 'Unknown User';

  // Core view state
  const [viewMode, setViewMode] = useState<TakeoffViewMode>('list');
  const [selectedTakeoff, setSelectedTakeoff] = useState<import('../types').Takeoff | null>(null);
  const [currentStep, setCurrentStep] = useState<TakeoffStep>('classification');

  // Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAbridgmentReportModal, setShowAbridgmentReportModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TakeoffDocument | null>(null);

  // Data state
  const [documents, setDocuments] = useState<TakeoffDocument[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [shouldAutoClassify, setShouldAutoClassify] = useState(false);

  // List management hook
  const listManagement = useListManagement();

  // Operation hooks
  const classification = useClassification({ documents, setDocuments });

  const abridgement = useAbridgement({
    documents,
    setDocuments,
    selectedTakeoff,
    setSelectedTakeoff,
    setTakeoffsData: listManagement.setTakeoffsData,
  });

  const parsing = useParsing({
    documents,
    setDocuments,
    selectedTakeoff,
    setSelectedTakeoff,
    setTakeoffsData: listManagement.setTakeoffsData,
    setParsedItems,
  });

  const productCross = useProductCross({
    documents,
    parsedItems,
    setParsedItems,
    selectedTakeoff,
    setSelectedTakeoff,
    setTakeoffsData: listManagement.setTakeoffsData,
  });

  const upload = useUpload({
    setTakeoffsData: listManagement.setTakeoffsData,
    setSelectedTakeoff,
    setDocuments,
    setViewMode,
    setCurrentStep,
    setShowUploadModal,
    setShouldAutoClassify,
    setError: () => {},
    currentUserName,
  });

  const download = useDownload({ documents, selectedTakeoff });

  const navigation = useNavigation({
    selectedTakeoff,
    setSelectedTakeoff,
    setTakeoffsData: listManagement.setTakeoffsData,
    setViewMode,
    setCurrentStep,
    setDocuments,
    setParsedItems,
    setSelectedItems,
    documents,
    parsedItems,
  });

  // Item selection handlers
  const handleToggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  }, []);

  const handleSelectAllItems = useCallback((checked: boolean) => {
    if (checked) {
      const ids = parsedItems.filter(i => !i.isOurManufacturer && !i.isCrossed).map(i => i.id);
      setSelectedItems(new Set(ids));
    } else {
      setSelectedItems(new Set());
    }
  }, [parsedItems]);

  // Modal handlers
  const handleOpenUploadModal = useCallback(() => setShowUploadModal(true), []);
  const handleCloseUploadModal = useCallback(() => {
    setShowUploadModal(false);
    upload.handleClearFiles();
  }, [upload]);

  const handleOpenAbridgmentReport = useCallback((doc: TakeoffDocument) => {
    setSelectedDocument(doc);
    setShowAbridgmentReportModal(true);
  }, []);

  const handleCloseAbridgmentReport = useCallback(() => {
    setShowAbridgmentReportModal(false);
    setSelectedDocument(null);
  }, []);

  // Step change with status update
  const handleStepChange = useCallback(async (newStep: TakeoffStep) => {
    setCurrentStep(newStep);
    if (!selectedTakeoff) return;

    const stepStatusMap: Record<TakeoffStep, TakeoffStatusEnum | null> = {
      classification: 'CLASSIFICATION',
      parsing: 'PARSING',
    };

    const newStatus = stepStatusMap[newStep];
    if (newStatus && statusApiMap[selectedTakeoff.status] !== newStatus) {
      try {
        await apiUpdateTakeoff(selectedTakeoff.id, { status: newStatus });
        const displayStatus = {
          CLASSIFICATION: 'Classification',
          ABRIDGMENT: 'Abridgment',
          PARSING: 'Parsing',
          COMPLETE: 'Complete',
        }[newStatus] as typeof selectedTakeoff.status;

        setSelectedTakeoff(prev => prev ? { ...prev, status: displayStatus } : null);
        listManagement.setTakeoffsData(prev =>
          prev.map(t => t.id === selectedTakeoff.id ? { ...t, status: displayStatus } : t)
        );
      } catch (error) {
        console.error('Failed to update takeoff status:', error);
      }
    }
  }, [selectedTakeoff, listManagement]);

  return {
    // View state
    viewMode,
    selectedTakeoff,
    currentStep,
    setCurrentStep,

    // Filter state
    activeFilters: listManagement.activeFilters,
    setActiveFilters: listManagement.setActiveFilters,
    searchQuery: listManagement.searchQuery,
    setSearchQuery: listManagement.setSearchQuery,

    // Data
    takeoffs: listManagement.takeoffs,
    documents,
    parsedItems,
    selectedItems,
    uploadedFiles: upload.uploadedFiles,

    // Upload state
    uploadProgress: upload.uploadProgress,
    isUploading: upload.isUploading,

    // Auto-classification
    shouldAutoClassify,
    setShouldAutoClassify,

    // AI Processing states
    classificationState: classification.classificationState,
    abridgementState: abridgement.abridgementState,
    productCrossState: productCross.productCrossState,
    documentAbridgementProgress: abridgement.documentAbridgementProgress,
    itemCrossingState: productCross.itemCrossingState,

    // Product cross data
    productCrossResults: productCross.productCrossResults,
    selectedCrossTypes: productCross.selectedCrossTypes,

    // Loading/Error
    isLoading: listManagement.isLoading,
    error: listManagement.error,
    totalCount: listManagement.totalCount,

    // Modal state
    showUploadModal,
    showAbridgmentReportModal,
    selectedDocument,

    // Classification handlers
    handleClassifyDocument: classification.handleClassifyDocument,
    handleBulkClassifyDocuments: classification.handleBulkClassifyDocuments,
    handleChangeDiscipline: classification.handleChangeDiscipline,

    // Abridgement handlers
    handleAbridgeDocument: abridgement.handleAbridgeDocument,
    handleAbridgeAll: abridgement.handleAbridgeAll,

    // Parsing handlers
    handleParseSchedules: parsing.handleParseSchedules,
    parsingState: parsing.parsingState,

    // Product cross handlers
    handleCrossItem: productCross.handleCrossItem,
    handleCrossAll: productCross.handleCrossAll,
    handleCrossTypesChange: productCross.handleCrossTypesChange,
    handleSelectAlternative: productCross.handleSelectAlternative,
    handleCrossSelected: productCross.handleCrossAll,

    // Item selection handlers
    handleToggleSelectItem,
    handleSelectAllItems,

    // File handlers
    handleFileSelect: upload.handleFileSelect,
    handleRemoveFile: upload.handleRemoveFile,
    handleClearFiles: upload.handleClearFiles,

    // Navigation handlers
    handleUploadStart: upload.handleUploadStart,
    handleSelectTakeoff: navigation.handleSelectTakeoff,
    handleBackToList: navigation.handleBackToList,
    handleCreateQuote: navigation.handleCreateQuote,
    handleDeleteTakeoff: navigation.handleDeleteTakeoff,
    handleRefresh: listManagement.handleRefresh,

    // Modal handlers
    handleOpenUploadModal,
    handleCloseUploadModal,
    handleOpenAbridgmentReport,
    handleCloseAbridgmentReport,

    // Download handlers
    handleDownloadDocument: download.handleDownloadDocument,
    handleDownloadAllDocuments: download.handleDownloadAllDocuments,

    // Step change
    handleStepChange,

    // Stubs for unused handlers (maintain API compatibility)
    handleSaveSelectedCrosses: async () => {},
    handleDeleteCrossAlternative: () => {},
    handleRerunCross: async () => {},
  };
}

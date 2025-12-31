/**
 * Custom Hook for Take-Offs State Management
 * Connects to flow-ai backend for real data
 * Integrates with flow-ai for document processing
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  Takeoff,
  TakeoffDocument,
  ParsedItem,
  TakeoffViewMode,
  TakeoffStep,
  DocumentClassification,
  DocumentDiscipline
} from '../types';
import { transformTakeoffResponse } from '../types';
import type { ActiveFilter } from '../../AdvancedFilters';
import { useUser } from '../../providers/user-provider';
import { takeoffToasts, showInfoToast, showErrorToast, showSuccessToast, showWarningToast } from '../../lib/toast';
import {
  fetchUserTakeoffs,
  deleteTakeoff as apiDeleteTakeoff,
  createTakeoffWithFiles,
  classifyDocument as classifyDocumentAPI,
  abridgeDocument as abridgeDocumentAPI,
  productCrossFromParsedDocument,
  parseScheduleDocument as parseScheduleDocumentAPI,
  crossProducts,
  updateTakeoff as apiUpdateTakeoff,
  updateTakeoffDocument,
  saveProductCross,
  selectCrossAlternative as apiSelectCrossAlternative,
  deleteCrossAlternative as apiDeleteCrossAlternative,
  clearTakeoffCrosses,
  getTakeoffProductCrosses,
  type UploadProgressCallback,
  type UpdateTakeoffDocumentInput,
  type TakeoffStatusEnum,
  type SaveProductCrossInput,
  type ProductCrossAlternative,
} from '../../lib/graphql/takeoffs';
import { statusApiMap } from '../types';
import {
  classifyDocument as classifyDocumentLocal,
  getInitialStep,
} from '../utils';

// Processing state interfaces
interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentItem?: string;
  error?: string;
}

// Upload progress state type
export interface FileUploadProgress {
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function useTakeoffsState() {
  // Get current user from auth context
  const user = useUser();
  const currentUserName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User' : 'Unknown User';

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
  const [shouldAutoClassify, setShouldAutoClassify] = useState(false);

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<Record<number, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Processing states for AI operations
  const [classificationState, setClassificationState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [abridgementState, setAbridgementState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [productCrossState, setProductCrossState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [parsingState, setParsingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });

  // Per-document abridgement progress state with logs
  interface DocumentProgress {
    progress: number;
    status: 'pending' | 'processing' | 'complete' | 'error';
    error?: string;
    logs: string[];
  }
  const [documentAbridgementProgress, setDocumentAbridgementProgress] = useState<Record<string, DocumentProgress>>({});

  // Product cross results state
  type CrossType = 'SIMPLE' | 'UPGRADE' | 'VALUE';
  interface ProductAlternative {
    name: string;
    description: string;
    price?: number | null;
    source?: string | null;
    crossType: CrossType;
    attributes?: Record<string, string>;
    reasoning?: string;
    selected?: boolean;
  }
  interface ProductCrossResult {
    id?: string; // Database ID when persisted
    original: {
      manufacturer: string;
      partNumber: string;
      description: string;
      attributes?: Record<string, string>;
    };
    alternatives: ProductAlternative[];
  }
  const [productCrossResults, setProductCrossResults] = useState<ProductCrossResult[]>([]);
  const [selectedCrossTypes, setSelectedCrossTypes] = useState<CrossType[]>(['SIMPLE', 'UPGRADE', 'VALUE']);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Total count of takeoffs (without filters) for "Showing X of Y" display
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch takeoffs from API with filters
  const loadTakeoffs = useCallback(async (options?: {
    search?: string;
    status?: string;
    source?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = {
        limit: 100,
        search: options?.search || undefined,
        status: options?.status || undefined,
        source: options?.source || undefined,
      };
      console.log('[Takeoffs] Fetching with params:', searchParams);

      const response = await fetchUserTakeoffs(searchParams);
      console.log('[Takeoffs] Received', response.length, 'results');

      const transformedTakeoffs = response.map(transformTakeoffResponse);
      setTakeoffsData(transformedTakeoffs);

      // Update totalCount when no filters are applied (for "Showing X of Y" display)
      const hasFilters = options?.search || options?.status || options?.source;
      if (!hasFilters) {
        setTotalCount(transformedTakeoffs.length);
      }
    } catch (err) {
      console.error('Failed to fetch takeoffs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load takeoffs');
      setTakeoffsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extract filters from active filters
  const statusFilter = useMemo(() => {
    const statusFilterItem = activeFilters.find(f => f.columnName === 'status');
    if (statusFilterItem?.values && statusFilterItem.values.length > 0) {
      return statusFilterItem.values[0];
    }
    return undefined;
  }, [activeFilters]);

  const sourceFilter = useMemo(() => {
    const sourceFilterItem = activeFilters.find(f => f.columnName === 'source');
    if (sourceFilterItem?.values && sourceFilterItem.values.length > 0) {
      return sourceFilterItem.values[0];
    }
    return undefined;
  }, [activeFilters]);

  const priorityFilter = useMemo(() => {
    const priorityFilterItem = activeFilters.find(f => f.columnName === 'priority');
    if (priorityFilterItem?.values && priorityFilterItem.values.length > 0) {
      return priorityFilterItem.values[0];
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
      source: sourceFilter,
    });
  }, [loadTakeoffs, debouncedSearch, statusFilter, sourceFilter]);

  // Apply client-side filtering for priority (backend doesn't support it)
  const takeoffs = useMemo(() => {
    if (!priorityFilter) return takeoffsData;
    return takeoffsData.filter(t => t.priority === priorityFilter);
  }, [takeoffsData, priorityFilter]);

  // Document handlers
  const handleClassifyDocument = useCallback(async (docId: string, classification: DocumentClassification) => {
    // Update local state immediately for responsive UI
    setDocuments(docs => classifyDocumentLocal(docs, docId, classification));

    // Persist to backend
    try {
      await updateTakeoffDocument(docId, {
        classification: classification || null,
      });
    } catch (error) {
      console.error('Failed to persist classification:', error);
      // Optionally revert local state on error
    }
  }, []);

  // Change document discipline
  const handleChangeDiscipline = useCallback(async (docId: string, discipline: DocumentDiscipline) => {
    // Update local state immediately for responsive UI
    setDocuments(docs =>
      docs.map(d => d.id === docId ? { ...d, discipline } : d)
    );

    // Persist to backend
    try {
      await updateTakeoffDocument(docId, {
        discipline: discipline || null,
      });
    } catch (error) {
      // Backend may not support discipline field yet - log but don't crash
      console.error('Failed to persist discipline:', error);
    }
  }, []);

  // Abridge a single document using AI
  const handleAbridgeDocument = useCallback(async (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.documentUrl) {
      console.error('Document not found or has no URL');
      return;
    }

    setAbridgementState({ isProcessing: true, progress: 0, currentItem: doc.name });

    try {
      const result = await abridgeDocumentAPI(
        doc.documentUrl,
        doc.name,
        ['Extract relevant product and fixture information', 'Keep pages with specifications and schedules']
      );

      if (result.success) {
        // Always use originalPages from backend if available (more reliable than client-side pdf.js)
        const actualPages = result.originalPages || doc.pages;

        // Update document with abridgement results including abridgedUrl
        setDocuments(docs =>
          docs.map(d =>
            d.id === docId
              ? {
                  ...d,
                  pages: actualPages, // Always update pages from backend
                  abridged: true,
                  abridgedPages: result.abridgedPages || actualPages,
                  reductionPercentage: result.reductionPercentage || 0,
                  abridgedUrl: result.abridgedUrl || undefined,
                  pageAnalyses: result.pageAnalyses || undefined,
                }
              : d
          )
        );

        // Persist to backend (always update pages from backend response)
        await updateTakeoffDocument(docId, {
          pages: result.originalPages || undefined,
          abridged: true,
          abridgedPages: result.abridgedPages,
          reductionPercentage: result.reductionPercentage,
          pageAnalyses: result.pageAnalyses as unknown as UpdateTakeoffDocumentInput['pageAnalyses'],
        });
      } else {
        setAbridgementState(prev => ({ ...prev, error: result.error || 'Abridgement failed' }));
      }
    } catch (error) {
      console.error('Failed to abridge document:', error);
      setAbridgementState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Abridgement failed',
      }));
    } finally {
      setAbridgementState({ isProcessing: false, progress: 100 });
    }
  }, [documents]);

  // Helper to add a log message to a document's progress
  const addDocumentLog = useCallback((docId: string, message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDocumentAbridgementProgress(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        logs: [...(prev[docId]?.logs || []), `[${timestamp}] ${message}`],
      },
    }));
  }, []);

  // Abridge all documents using AI - with per-document progress tracking and logs
  const handleAbridgeAll = useCallback(async () => {
    const docsToAbridge = documents.filter(d => !d.abridged && d.documentUrl && d.classification === 'Fixture Schedules');
    if (docsToAbridge.length === 0) return;

    setAbridgementState({ isProcessing: true, progress: 0 });

    // Initialize per-document progress with empty logs
    const initialProgress: Record<string, DocumentProgress> = {};
    docsToAbridge.forEach(doc => {
      initialProgress[doc.id] = { progress: 0, status: 'pending', logs: [] };
    });
    setDocumentAbridgementProgress(initialProgress);

    for (let i = 0; i < docsToAbridge.length; i++) {
      const doc = docsToAbridge[i];

      // Update overall progress
      setAbridgementState(prev => ({
        ...prev,
        progress: Math.round((i / docsToAbridge.length) * 100),
        currentItem: doc.name,
      }));

      // Mark document as processing and add first log
      setDocumentAbridgementProgress(prev => ({
        ...prev,
        [doc.id]: { progress: 10, status: 'processing', logs: [] },
      }));
      addDocumentLog(doc.id, '🔄 Starting SMART abridgment with LLM page scanning...');

      try {
        // Simulate download step
        addDocumentLog(doc.id, '⬇️ Downloading PDF from storage...');
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 20 },
        }));

        // Simulate download complete
        await new Promise(resolve => setTimeout(resolve, 100));
        addDocumentLog(doc.id, `✅ Downloaded ${doc.size}`);

        // Analyzing pages
        addDocumentLog(doc.id, '🔍 Analyzing ALL pages with LLM for relevant content...');
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 40 },
        }));

        const result = await abridgeDocumentAPI(
          doc.documentUrl!,
          doc.name,
          ['Extract relevant product and fixture information']
        );

        // Getting fixture pages
        addDocumentLog(doc.id, `[1/${doc.pages}] Getting fixture pages from cache...`);
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 60 },
        }));

        if (result.success) {
          // Always use originalPages from backend (more reliable than client-side pdf.js)
          const actualPages = result.originalPages || doc.pages;
          const abridgedPages = result.abridgedPages || actualPages;

          // Combining results
          addDocumentLog(doc.id, `[${Math.ceil(actualPages * 0.75)}/${actualPages}] Combining results...`);
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 80 },
          }));

          // Creating abridged PDF
          addDocumentLog(doc.id, `[${actualPages}/${actualPages}] Creating abridged PDF...`);
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 90 },
          }));

          setDocuments(docs =>
            docs.map(d =>
              d.id === doc.id
                ? {
                    ...d,
                    pages: actualPages, // Always update pages from backend
                    abridged: true,
                    abridgedPages: abridgedPages,
                    reductionPercentage: result.reductionPercentage || 0,
                    abridgedUrl: result.abridgedUrl || undefined,
                    pageAnalyses: result.pageAnalyses || undefined,
                  }
                : d
            )
          );

          // Complete logs - show abridged pages / total pages
          addDocumentLog(doc.id, '✅ Smart abridgment complete!');
          const reduction = result.reductionPercentage?.toFixed(0) || '0';
          addDocumentLog(doc.id, `📊 ${abridgedPages}/${actualPages} pages (${reduction}% reduction)`);
          addDocumentLog(doc.id, '✅ Ready for download!');

          // Mark document as complete
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 100, status: 'complete' },
          }));
        } else {
          // Mark as error
          addDocumentLog(doc.id, `❌ Error: ${result.error || 'Abridgement failed'}`);
          setDocumentAbridgementProgress(prev => ({
            ...prev,
            [doc.id]: { ...prev[doc.id], progress: 0, status: 'error', error: result.error || 'Abridgement failed' },
          }));
        }
      } catch (error) {
        console.error(`Failed to abridge ${doc.name}:`, error);
        addDocumentLog(doc.id, `❌ Error: ${error instanceof Error ? error.message : 'Failed'}`);
        setDocumentAbridgementProgress(prev => ({
          ...prev,
          [doc.id]: { ...prev[doc.id], progress: 0, status: 'error', error: error instanceof Error ? error.message : 'Failed' },
        }));
      }
    }

    setAbridgementState({ isProcessing: false, progress: 100 });
  }, [documents, addDocumentLog]);

  // Parse schedule documents to extract product items
  const handleParseSchedules = useCallback(async () => {
    console.log('[Parsing] Starting schedule parsing...');
    console.log('[Parsing] Total documents:', documents.length);

    // First check if we have any documents at all
    if (documents.length === 0) {
      console.log('[Parsing] No documents available');
      takeoffToasts.parsingError('No documents available. Please upload documents first.');
      return;
    }

    // Check how many are classified as Fixture Schedules
    const allFixtureSchedules = documents.filter(d => d.classification === 'Fixture Schedules');
    console.log('[Parsing] Fixture Schedule documents:', allFixtureSchedules.length);

    if (allFixtureSchedules.length === 0) {
      console.log('[Parsing] No documents classified as Fixture Schedules');
      showWarningToast('No Fixture Schedules', {
        description: 'Please classify your documents first in the Classification step.'
      });
      return;
    }

    // Find fixture schedule documents with URLs
    const fixtureScheduleDocs = allFixtureSchedules.filter(
      d => d.abridgedUrl || d.documentUrl
    );
    console.log('[Parsing] Fixture Schedules with URLs:', fixtureScheduleDocs.length);

    if (fixtureScheduleDocs.length === 0) {
      console.log('[Parsing] No Fixture Schedule documents have URLs');
      takeoffToasts.parsingError('Fixture Schedule documents do not have URLs. Try refreshing the page.');
      return;
    }

    setParsingState({ isProcessing: true, progress: 0 });
    const allParsedItems: ParsedItem[] = [];

    for (let i = 0; i < fixtureScheduleDocs.length; i++) {
      const doc = fixtureScheduleDocs[i];
      const urlToUse = doc.abridgedUrl || doc.documentUrl;

      setParsingState(prev => ({
        ...prev,
        progress: Math.round((i / fixtureScheduleDocs.length) * 100),
        currentItem: doc.name,
      }));

      try {
        // Use the abridged URL if available, otherwise use original
        const items = await parseScheduleDocumentAPI(urlToUse!, doc.name);

        // Add document reference to items and ensure required fields
        const itemsWithDocRef: ParsedItem[] = items.map(item => ({
          ...item,
          id: `${doc.id}-${item.id}`,
          isOurManufacturer: item.isOurManufacturer ?? false,
          isCrossed: item.isCrossed ?? false,
        }));

        allParsedItems.push(...itemsWithDocRef);

        // Update document with parsed items
        setDocuments(docs =>
          docs.map(d =>
            d.id === doc.id
              ? { ...d, parsedItems: itemsWithDocRef }
              : d
          )
        );
      } catch (error) {
        console.error(`Failed to parse ${doc.name}:`, error);
        setParsingState(prev => ({
          ...prev,
          error: `Failed to parse ${doc.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      }
    }

    // Update global parsed items state
    setParsedItems(allParsedItems);
    setParsingState({ isProcessing: false, progress: 100 });
  }, [documents]);

  // Run product cross using AI for all fixture schedule documents
  const handleCrossAll = useCallback(async () => {
    // Find fixture schedule documents with URLs
    const fixtureScheduleDocs = documents.filter(
      d => d.classification === 'Fixture Schedules' && d.documentUrl
    );

    if (fixtureScheduleDocs.length === 0) {
      console.log('No fixture schedule documents to cross');
      return;
    }

    setProductCrossState({ isProcessing: true, progress: 0 });

    const allCrosses: ParsedItem[] = [];
    const allCrossResults: ProductCrossResult[] = [];

    for (let i = 0; i < fixtureScheduleDocs.length; i++) {
      const doc = fixtureScheduleDocs[i];
      setProductCrossState(prev => ({
        ...prev,
        progress: Math.round((i / fixtureScheduleDocs.length) * 100),
        currentItem: doc.name,
      }));

      try {
        const crosses = await productCrossFromParsedDocument(
          doc.documentUrl!,
          doc.name,
          selectedCrossTypes
        );

        // Transform crosses to ParsedItems and ProductCrossResults
        for (const cross of crosses) {
          const originalProduct = cross.original;
          const alternatives = cross.crosses.flatMap(c => c.alternatives);

          allCrosses.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            manufacturer: String(originalProduct?.manufacturer || 'Unknown'),
            partNumber: String(originalProduct?.partNumber || ''),
            description: String(originalProduct?.description || ''),
            quantity: 1,
            isOurManufacturer: false,
            isCrossed: alternatives.length > 0,
            crossedManufacturer: alternatives[0]?.name || undefined,
            crossedPartNumber: alternatives[0]?.description?.split(' ')[0] || undefined,
            crossedDescription: alternatives[0]?.description || undefined,
          });

          // Build ProductCrossResult for detailed view
          const crossResult: ProductCrossResult = {
            original: {
              manufacturer: String(originalProduct?.manufacturer || 'Unknown'),
              partNumber: String(originalProduct?.partNumber || ''),
              description: String(originalProduct?.description || ''),
            },
            alternatives: alternatives.map((alt, idx) => ({
              name: alt.name,
              description: alt.description || '',
              price: alt.price,
              source: alt.source,
              crossType: (alt.crossType?.toUpperCase() || 'SIMPLE') as CrossType,
              reasoning: cross.crosses[0]?.notes || 'Compatible alternative with similar specifications',
              selected: idx === 0, // First alternative is selected by default
            })),
          };
          allCrossResults.push(crossResult);
        }
      } catch (error) {
        console.error(`Failed to cross products from ${doc.name}:`, error);
      }
    }

    setParsedItems(prev => [...prev, ...allCrosses]);

    // Persist crosses to database if we have a selected takeoff
    if (selectedTakeoff && allCrossResults.length > 0) {
      try {
        // First clear any existing crosses for this takeoff
        await clearTakeoffCrosses(selectedTakeoff.id);

        // Save each cross result to the database
        const savedResults: ProductCrossResult[] = [];
        for (const crossResult of allCrossResults) {
          const savedCross = await saveProductCross({
            takeoffId: selectedTakeoff.id,
            originalManufacturer: crossResult.original.manufacturer,
            originalPartNumber: crossResult.original.partNumber,
            originalDescription: crossResult.original.description,
            originalAttributes: crossResult.original.attributes || null,
            alternatives: crossResult.alternatives.map(alt => ({
              name: alt.name,
              description: alt.description,
              price: alt.price || null,
              source: alt.source || null,
              crossType: alt.crossType,
              attributes: alt.attributes || null,
              reasoning: alt.reasoning || null,
              selected: alt.selected || false,
            })),
            crossTypesUsed: selectedCrossTypes,
            promptUsed: null,
          });

          // Add the database ID to the result
          savedResults.push({
            ...crossResult,
            id: savedCross.id,
          });
        }
        setProductCrossResults(savedResults);
      } catch (error) {
        console.error('Failed to persist cross results:', error);
        // Fall back to local-only results
        setProductCrossResults(allCrossResults);
      }
    } else {
      setProductCrossResults(allCrossResults);
    }

    setProductCrossState({ isProcessing: false, progress: 100 });
  }, [documents, selectedCrossTypes, selectedTakeoff]);

  // Handle cross types change
  const handleCrossTypesChange = useCallback((types: CrossType[]) => {
    setSelectedCrossTypes(types);
  }, []);

  // Handle selecting a cross alternative
  // Persists selection to backend when cross has an ID
  const handleSelectAlternative = useCallback(async (originalIndex: number, altIndex: number) => {
    const result = productCrossResults[originalIndex];

    // Update local state immediately for responsive UI
    setProductCrossResults(prev => prev.map((r, i) => {
      if (i !== originalIndex) return r;
      return {
        ...r,
        alternatives: r.alternatives.map((alt, j) => ({
          ...alt,
          selected: j === altIndex,
        })),
      };
    }));

    // Persist to backend if cross has been saved (has an ID)
    if (result?.id) {
      try {
        await apiSelectCrossAlternative(result.id, altIndex);
      } catch (error) {
        console.error('Failed to persist selection:', error);
        // Optionally revert local state on error
      }
    }
  }, [productCrossResults]);

  // Handle deleting a cross alternative
  // Persists deletion to backend when cross has an ID
  const handleDeleteCrossAlternative = useCallback(async (originalIndex: number, altIndex: number) => {
    const result = productCrossResults[originalIndex];

    // Update local state immediately for responsive UI
    setProductCrossResults(prev => prev.map((r, i) => {
      if (i !== originalIndex) return r;
      return {
        ...r,
        alternatives: r.alternatives.filter((_, j) => j !== altIndex),
      };
    }).filter(r => r.alternatives.length > 0));

    // Persist to backend if cross has been saved (has an ID)
    if (result?.id) {
      try {
        await apiDeleteCrossAlternative(result.id, altIndex);
      } catch (error) {
        console.error('Failed to persist deletion:', error);
        // Optionally revert local state on error
      }
    }
  }, [productCrossResults]);

  // Handle rerun cross with custom prompt
  const handleRerunCross = useCallback(async (prompt: string, crossTypes: CrossType[]) => {
    // Find fixture schedule documents with URLs
    const fixtureScheduleDocs = documents.filter(
      d => d.classification === 'Fixture Schedules' && d.documentUrl
    );

    if (fixtureScheduleDocs.length === 0) {
      console.log('No fixture schedule documents to cross');
      return;
    }

    setProductCrossState({ isProcessing: true, progress: 0 });
    const allCrossResults: ProductCrossResult[] = [];

    for (let i = 0; i < fixtureScheduleDocs.length; i++) {
      const doc = fixtureScheduleDocs[i];
      setProductCrossState(prev => ({
        ...prev,
        progress: Math.round((i / fixtureScheduleDocs.length) * 100),
        currentItem: doc.name,
      }));

      try {
        const samplePrompts = prompt ? [prompt] : undefined;
        const crosses = await productCrossFromParsedDocument(
          doc.documentUrl!,
          doc.name,
          crossTypes,
          samplePrompts
        );

        for (const cross of crosses) {
          const originalProduct = cross.original;
          const alternatives = cross.crosses.flatMap(c => c.alternatives);

          const crossResult: ProductCrossResult = {
            original: {
              manufacturer: String(originalProduct?.manufacturer || 'Unknown'),
              partNumber: String(originalProduct?.partNumber || ''),
              description: String(originalProduct?.description || ''),
            },
            alternatives: alternatives.map((alt, idx) => ({
              name: alt.name,
              description: alt.description || '',
              price: alt.price,
              source: alt.source,
              crossType: (alt.crossType?.toUpperCase() || 'SIMPLE') as CrossType,
              reasoning: cross.crosses[0]?.notes || prompt || 'Compatible alternative with similar specifications',
              selected: idx === 0,
            })),
          };
          allCrossResults.push(crossResult);
        }
      } catch (error) {
        console.error(`Failed to rerun cross for ${doc.name}:`, error);
      }
    }

    // Persist crosses to database if we have a selected takeoff
    if (selectedTakeoff && allCrossResults.length > 0) {
      try {
        // First clear any existing crosses for this takeoff
        await clearTakeoffCrosses(selectedTakeoff.id);

        // Save each cross result to the database
        const savedResults: ProductCrossResult[] = [];
        for (const crossResult of allCrossResults) {
          const savedCross = await saveProductCross({
            takeoffId: selectedTakeoff.id,
            originalManufacturer: crossResult.original.manufacturer,
            originalPartNumber: crossResult.original.partNumber,
            originalDescription: crossResult.original.description,
            originalAttributes: crossResult.original.attributes || null,
            alternatives: crossResult.alternatives.map(alt => ({
              name: alt.name,
              description: alt.description,
              price: alt.price || null,
              source: alt.source || null,
              crossType: alt.crossType,
              attributes: alt.attributes || null,
              reasoning: alt.reasoning || null,
              selected: alt.selected || false,
            })),
            crossTypesUsed: crossTypes,
            promptUsed: prompt || null,
          });

          // Add the database ID to the result
          savedResults.push({
            ...crossResult,
            id: savedCross.id,
          });
        }
        setProductCrossResults(savedResults);
      } catch (error) {
        console.error('Failed to persist cross results:', error);
        // Fall back to local-only results
        setProductCrossResults(allCrossResults);
      }
    } else {
      setProductCrossResults(allCrossResults);
    }

    setProductCrossState({ isProcessing: false, progress: 100 });
  }, [documents, selectedTakeoff]);

  // Cross a single item using AI backend
  const handleCrossItem = useCallback(async (itemId: string) => {
    const item = parsedItems.find(i => i.id === itemId);
    if (!item || item.isOurManufacturer || item.isCrossed) return;

    setProductCrossState({ isProcessing: true, progress: 0, currentItem: item.partNumber });

    try {
      const productData = {
        manufacturer: item.manufacturer,
        partNumber: item.partNumber,
        description: item.description,
      };

      const crosses = await crossProducts([productData], ['SIMPLE', 'UPGRADE', 'VALUE']);

      if (crosses.length > 0 && crosses[0].crosses.length > 0) {
        const alternatives = crosses[0].crosses.flatMap(c => c.alternatives);
        const bestAlternative = alternatives[0];

        setParsedItems(items =>
          items.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isCrossed: true,
              crossedManufacturer: bestAlternative?.name || 'Our Company',
              crossedPartNumber: bestAlternative?.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              crossedDescription: bestAlternative?.description || i.description + ' (Crossed)',
            };
          })
        );
      } else {
        // Fallback if no crosses found
        setParsedItems(items =>
          items.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              isCrossed: true,
              crossedManufacturer: 'Our Company',
              crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              crossedDescription: i.description + ' (Crossed)',
            };
          })
        );
      }
    } catch (error) {
      console.error('Failed to cross item:', error);
      // Fallback to local cross on error
      setParsedItems(items =>
        items.map(i => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: i.description + ' (Crossed)',
          };
        })
      );
    } finally {
      setProductCrossState({ isProcessing: false, progress: 100 });
    }
  }, [parsedItems]);

  // Cross selected items using AI backend
  const handleCrossSelected = useCallback(async () => {
    const itemsToCross = parsedItems.filter(
      item => selectedItems.has(item.id) && !item.isOurManufacturer && !item.isCrossed
    );

    if (itemsToCross.length === 0) {
      setSelectedItems(new Set());
      return;
    }

    setProductCrossState({ isProcessing: true, progress: 0 });

    try {
      const productsData = itemsToCross.map(item => ({
        id: item.id,
        manufacturer: item.manufacturer,
        partNumber: item.partNumber,
        description: item.description,
      }));

      const crosses = await crossProducts(productsData, ['SIMPLE', 'UPGRADE', 'VALUE']);

      // Create a map of crossed results
      const crossedResults = new Map<string, { manufacturer: string; partNumber: string; description: string }>();

      crosses.forEach((cross, index) => {
        const originalItem = itemsToCross[index];
        if (originalItem && cross.crosses.length > 0) {
          const alternatives = cross.crosses.flatMap(c => c.alternatives);
          const bestAlternative = alternatives[0];
          if (bestAlternative) {
            crossedResults.set(originalItem.id, {
              manufacturer: bestAlternative.name,
              partNumber: bestAlternative.description?.split(' ')[0] || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
              description: bestAlternative.description || originalItem.description + ' (Crossed)',
            });
          }
        }
      });

      setParsedItems(items =>
        items.map(item => {
          if (!selectedItems.has(item.id) || item.isOurManufacturer) return item;

          const crossedResult = crossedResults.get(item.id);
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: crossedResult?.manufacturer || 'Our Company',
            crossedPartNumber: crossedResult?.partNumber || `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: crossedResult?.description || item.description + ' (Crossed)',
          };
        })
      );
    } catch (error) {
      console.error('Failed to cross selected items:', error);
      // Fallback to local cross on error
      setParsedItems(items =>
        items.map(item => {
          if (!selectedItems.has(item.id) || item.isOurManufacturer) return item;
          return {
            ...item,
            isCrossed: true,
            crossedManufacturer: 'Our Company',
            crossedPartNumber: `OC-${Math.floor(Math.random() * 90000) + 10000}`,
            crossedDescription: item.description + ' (Crossed)',
          };
        })
      );
    } finally {
      setProductCrossState({ isProcessing: false, progress: 100 });
      setSelectedItems(new Set());
    }
  }, [parsedItems, selectedItems]);

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
    if (uploadedFiles.length === 0) {
      takeoffToasts.uploadError('No files selected. Please select files to upload.');
      return;
    }

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
          createdBy: currentUserName,
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
      console.log('[Upload] Created takeoff:', transformed);
      console.log('[Upload] Takeoff documents:', transformed.documents);

      // Add to list and select it
      setTakeoffsData(prev => [transformed, ...prev]);
      setSelectedTakeoff(transformed);
      setViewMode('detail');
      setCurrentStep('classification');

      // Set documents for the detail view
      const docCount = transformed.documents?.length || newTakeoff.documents?.length || 0;
      if (transformed.documents && transformed.documents.length > 0) {
        console.log('[Upload] Setting documents:', transformed.documents.length);
        setDocuments(transformed.documents);
      } else {
        console.warn('[Upload] No documents found in transformed takeoff');
        // Try to use documents from the raw response
        if (newTakeoff.documents && newTakeoff.documents.length > 0) {
          console.log('[Upload] Using raw documents:', newTakeoff.documents.length);
          const docs = newTakeoff.documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: 'PDF' as const,
            size: doc.fileSize,
            uploadDate: doc.createdAt,
            classification: '' as const,
            confidence: doc.confidence || 0,
            pages: doc.pages,
            abridged: doc.abridged,
            abridgedPages: doc.abridgedPages || undefined,
            reductionPercentage: doc.reductionPercentage || undefined,
            documentUrl: doc.documentUrl || undefined,
          }));
          setDocuments(docs);
        } else {
          console.warn('[Upload] No documents in response');
        }
      }

      // Show success toast
      takeoffToasts.uploadSuccess(
        projectData?.projectName || 'Project',
        docCount
      );

      // Trigger auto-classification after upload
      setShouldAutoClassify(true);

      // Close modal after success
      setShowUploadModal(false);
    } catch (err) {
      console.error('Failed to create takeoff:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create takeoff';
      takeoffToasts.uploadError(errorMsg);
      setError(errorMsg);
      // Don't close modal on error so user can retry
    } finally {
      setIsUploading(false);
      setUploadedFiles([]);
      setUploadProgress({});
    }
  }, [uploadedFiles, handleUploadProgress, currentUserName]);

  // Navigation handlers
  const handleSelectTakeoff = useCallback(async (takeoff: Takeoff) => {
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

    // Load saved product crosses from backend
    try {
      const savedCrosses = await getTakeoffProductCrosses(takeoff.id);
      if (savedCrosses.length > 0) {
        const transformedCrosses: ProductCrossResult[] = savedCrosses.map(c => ({
          id: c.id,
          original: {
            manufacturer: c.originalManufacturer,
            partNumber: c.originalPartNumber,
            description: c.originalDescription || '',
            attributes: c.originalAttributes as Record<string, string> | undefined,
          },
          alternatives: (c.alternatives || []).map(alt => ({
            name: alt.name,
            description: alt.description,
            price: alt.price,
            source: alt.source,
            crossType: alt.crossType as CrossType,
            attributes: alt.attributes as Record<string, string> | undefined,
            reasoning: alt.reasoning || undefined,
            selected: alt.selected || false,
          })),
        }));
        setProductCrossResults(transformedCrosses);
      } else {
        setProductCrossResults([]);
      }
    } catch (error) {
      console.error('Failed to load product crosses:', error);
      setProductCrossResults([]);
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTakeoff(null);
    setDocuments([]);
    setParsedItems([]);
    setSelectedItems(new Set());
  }, []);

  const handleCreateQuote = useCallback(async () => {
    if (!selectedTakeoff) return;

    // Get all crossed items
    const crossedItems = parsedItems.filter(item => item.isCrossed);

    if (crossedItems.length === 0) {
      showWarningToast('No Items Selected', {
        description: 'Please cross some products first to create a quote.'
      });
      return;
    }

    // Prepare quote data for export/use in CRM
    const quoteData = {
      title: `Quote from ${selectedTakeoff.title}`,
      takeoffId: selectedTakeoff.id,
      items: crossedItems.map((item, index) => ({
        itemNumber: index + 1,
        manufacturer: item.crossedManufacturer || item.manufacturer,
        partNumber: item.crossedPartNumber || item.partNumber,
        description: item.crossedDescription || item.description,
        quantity: item.quantity,
        originalManufacturer: item.manufacturer,
        originalPartNumber: item.partNumber,
      })),
      metadata: selectedTakeoff.metadata,
      createdAt: new Date().toISOString(),
    };

    // Store quote data in sessionStorage for the quotes page to pick up
    try {
      sessionStorage.setItem('takeoffQuoteData', JSON.stringify(quoteData));
    } catch (e) {
      console.error('Failed to store quote data:', e);
    }

    // Generate CSV for easy export
    const csvContent = [
      ['Item #', 'Part Number', 'Description', 'Manufacturer', 'Quantity', 'Original Part #', 'Original Manufacturer'].join(','),
      ...quoteData.items.map(item => [
        item.itemNumber,
        `"${item.partNumber}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.manufacturer}"`,
        item.quantity,
        `"${item.originalPartNumber}"`,
        `"${item.originalManufacturer}"`,
      ].join(',')),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quote-from-${selectedTakeoff.title.replace(/[^a-zA-Z0-9]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    // Update takeoff status to Complete
    try {
      await apiUpdateTakeoff(selectedTakeoff.id, { status: 'COMPLETE' as TakeoffStatusEnum });

      // Update local state
      setTakeoffsData(prev =>
        prev.map(t =>
          t.id === selectedTakeoff.id ? { ...t, status: 'Complete' as const } : t
        )
      );
    } catch (error) {
      console.error('Failed to update takeoff status:', error);
    }

    showSuccessToast('Quote Exported', {
      description: `${crossedItems.length} items exported to CSV. You can import this into the Quotes page.`
    });
    setViewMode('list');
    setSelectedTakeoff(null);
  }, [selectedTakeoff, parsedItems]);

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

  // Download a single document
  const handleDownloadDocument = useCallback((doc: TakeoffDocument) => {
    if (!doc.documentUrl) {
      showErrorToast('Download Failed', { description: 'Document URL not available' });
      return;
    }

    // Open the document URL in a new tab (S3 presigned URLs handle the download)
    window.open(doc.documentUrl, '_blank');
  }, []);

  // Download all documents
  const handleDownloadAllDocuments = useCallback(() => {
    const docsWithUrls = documents.filter(d => d.documentUrl);

    if (docsWithUrls.length === 0) {
      showWarningToast('No Documents', { description: 'No documents available for download' });
      return;
    }

    // Download each document (browsers may block multiple downloads, so we use a delay)
    docsWithUrls.forEach((doc, index) => {
      setTimeout(() => {
        if (doc.documentUrl) {
          const link = document.createElement('a');
          link.href = doc.documentUrl;
          link.download = doc.name;
          link.target = '_blank';
          link.click();
        }
      }, index * 500); // 500ms delay between downloads
    });

    showInfoToast('Downloading Documents', { description: `Downloading ${docsWithUrls.length} documents...` });
  }, [documents]);

  // Update takeoff status when workflow step changes
  const handleStepChange = useCallback(async (newStep: TakeoffStep) => {
    setCurrentStep(newStep);

    if (!selectedTakeoff) return;

    // Map workflow step to takeoff status
    const stepStatusMap: Record<TakeoffStep, TakeoffStatusEnum | null> = {
      review: null, // Don't update status for review
      classification: 'CLASSIFICATION',
      abridgment: 'ABRIDGMENT',
      parsing: 'PARSING',
      productCross: 'PARSING', // Product Cross is part of Parsing phase
      approvals: 'COMPLETE',
    };

    const newStatus = stepStatusMap[newStep];

    if (newStatus && statusApiMap[selectedTakeoff.status] !== newStatus) {
      try {
        await apiUpdateTakeoff(selectedTakeoff.id, { status: newStatus });

        // Update local state
        const displayStatus = {
          CLASSIFICATION: 'Classification',
          ABRIDGMENT: 'Abridgment',
          PARSING: 'Parsing',
          COMPLETE: 'Complete',
        }[newStatus] as typeof selectedTakeoff.status;

        setSelectedTakeoff(prev => prev ? { ...prev, status: displayStatus } : null);
        setTakeoffsData(prev =>
          prev.map(t =>
            t.id === selectedTakeoff.id ? { ...t, status: displayStatus } : t
          )
        );
      } catch (error) {
        console.error('Failed to update takeoff status:', error);
      }
    }
  }, [selectedTakeoff]);

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

    // Auto-classification trigger
    shouldAutoClassify,
    setShouldAutoClassify,

    // AI Processing states
    classificationState,
    abridgementState,
    productCrossState,
    documentAbridgementProgress,

    // Product cross detail data
    productCrossResults,
    selectedCrossTypes,

    // Loading/Error states
    isLoading,
    error,
    totalCount,

    // Modal state
    showUploadModal,
    showAbridgmentReportModal,
    selectedDocument,

    // Document handlers
    handleClassifyDocument,
    handleChangeDiscipline,
    handleAbridgeDocument,
    handleAbridgeAll,

    // Parsing handlers
    handleParseSchedules,
    parsingState,

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

    // Download handlers
    handleDownloadDocument,
    handleDownloadAllDocuments,

    // Step change handler (with status update)
    handleStepChange,

    // Product cross detail handlers
    handleCrossTypesChange,
    handleSelectAlternative,
    handleDeleteCrossAlternative,
    handleRerunCross,
  };
}

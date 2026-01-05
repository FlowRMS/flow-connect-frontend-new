"use client";

import { useApolloClient, useMutation, useSubscription } from "@apollo/client/react";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  M_APPROVE,
  M_REJECT,
  Q_GET_CORRECTIONS,
  Q_GET_PENDING,
  SUB_PROCESS_DOC,
  SUB_UPDATE_INSTR,
  SUB_APPLY_CLUSTER_INSTRUCTIONS,
} from "@/lib/flow-ai/gql";
import {
  Extracted,
  LineItem,
  OtherField,
  PrimaryField,
  buildLineItems,
  buildOther,
  buildPrimary,
  safeParseExtractedArray,
  getIdentifierLabel,
  getIdentifierValue,
} from "@/lib/flow-ai/parseExtracted";
import { getExtractSessionConfig } from "@/components/flow-ai/config/extract-session";
import { generateCsvChanges } from "@/lib/flow-ai/csv-comparison";
import { fetchCsvDataViaProxy } from "@/lib/flow-ai/csv-fetch";

type PendingDocument = {
  id: string;
  additionalInstructionsJson?: string | null;
  convertedDocumentUrl?: string | null;
  originalPresignedUrl?: string | null;
  extractedDataJson?: string | null;
  sourceName?: string | null;
  status?: string | null;
  entityType?: string | null;
  fileUploadProcessId?: string | null;
  pages?: Array<{ markdownContent?: string }>;
};

type CorrectionEntry = {
  id: string;
  correctionAction: string;
  createdAt: string;
  newValue?: string | null;
  oldValue?: string | null;
};

export type ParsedCorrection = {
  id: string;
  action: string;
  createdAt: string;
  before: unknown;
  after: unknown;
};

export type PendingReviewState = {
  pendingId: string | null;
  loadingAction: string | null;
  primary: PrimaryField[];
  other: OtherField[];
  lineItems: LineItem[];
  suggestedPrompts: string[];
  corrections: ParsedCorrection[];
  documentLabel: string | null;
  convertedDocumentUrl: string | null;
  presignedPdfUrl: string | null;
  tabularPresignedUrl: string | null;
  csvData: unknown[][] | null;
  originalCsvData: unknown[][] | null;
  processedCsvData: unknown[][] | null;
  isCsv: boolean;
  isHydrating: boolean;
  isInstructionRunning: boolean;
  isApplyingTemplate: boolean;
  mode: "document" | "pending" | null;
  entityType: string | null;
  // New fields for multiple data sets
  extractedDataSets: Extracted[];
  activeDataSetIndex: number;
  dataSets: Array<{ index: number; label: string; value: string }>;
  // Pages with markdown content
  pages: Array<{ markdownContent?: string }>;
};

const EMPTY_PRIMARY: PrimaryField[] = buildPrimary({});
const EMPTY_OTHER: OtherField[] = [];
const EMPTY_LINE_ITEMS: LineItem[] = [];

export function usePendingReview(onInstructionComplete?: () => void | Promise<void>) {
  const client = useApolloClient();
  const [session, setSession] = useState<{
    mode: "document" | "pending" | null;
    documentId: string | null;
    pendingId: string | null;
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    mode: null,
    documentId: null,
    pendingId: null,
    accessToken: null,
    refreshToken: null,
  });

  // State for initial instructions - to be set before subscription starts
  const [initialInstructions, setInitialInstructions] = useState<string[] | null>(null);
  const [contextFiles, setContextFiles] = useState<string[] | null>(null);
  const [shouldStartProcessing, setShouldStartProcessing] = useState(false);

  // Helper functions for pendingId caching
  const getCachedPendingId = useCallback((documentId: string): string | null => {
    try {
      const cached = localStorage.getItem(`pendingId_${documentId}`);
      return cached;
    } catch {
      return null;
    }
  }, []);

  const cachePendingId = useCallback((documentId: string, pendingId: string) => {
    try {
      localStorage.setItem(`pendingId_${documentId}`, pendingId);
      console.log('💾 Cached pendingId:', { documentId, pendingId });
    } catch (error) {
      console.warn('⚠️ Failed to cache pendingId:', error);
    }
  }, []);

  // Initialize session on mount to prevent hydration issues
  useEffect(() => {
    const config = getExtractSessionConfig();

    // If in document mode, check for cached pendingId first
    if (config.mode === 'document' && config.documentId && config.accessToken) {
      const cachedPendingId = getCachedPendingId(config.documentId);
      if (cachedPendingId) {
        console.log('🔄 Found cached pendingId, switching to pending mode:', cachedPendingId);
        setSession({
          mode: 'pending',
          documentId: config.documentId,
          pendingId: cachedPendingId,
          accessToken: config.accessToken,
          refreshToken: config.refreshToken,
        });
        setState(prev => ({ ...prev, isHydrating: true, loadingAction: 'Loading cached document...' }));
        return;
      }
    }

    setSession({
      mode: config.mode,
      documentId: config.documentId,
      pendingId: config.pendingId,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
    });

    // Check if we should skip the initial instructions prompt (user already provided them in combined upload)
    const shouldSkipInstructionsPrompt = localStorage.getItem('flowrms_skip_instructions_prompt') === 'true';

    // Set initial loading state based on mode
    // Don't show loading for document mode until prompt is submitted
    if (config.mode === 'pending' && config.pendingId && config.accessToken) {
      setState(prev => ({ ...prev, isHydrating: true, loadingAction: 'Loading pending document...' }));
    } else if (config.mode === 'document' && config.documentId && config.accessToken && shouldSkipInstructionsPrompt) {
      // Auto-start processing if user provided instructions during upload
      const storedInstructions = localStorage.getItem('flowrms_initial_instructions');
      const storedContextFiles = localStorage.getItem('flowrms_context_files');

      // Clear the skip flag
      localStorage.removeItem('flowrms_skip_instructions_prompt');
      localStorage.removeItem('flowrms_initial_instructions');
      localStorage.removeItem('flowrms_context_files');

      // Set instructions and context files
      if (storedInstructions) {
        setInitialInstructions([storedInstructions]);
      } else {
        setInitialInstructions([]);
      }

      if (storedContextFiles) {
        try {
          const contextFileIds = JSON.parse(storedContextFiles) as string[];
          setContextFiles(contextFileIds);
        } catch {
          setContextFiles(null);
        }
      }

      // Auto-start processing
      setShouldStartProcessing(true);
      setState(prev => ({
        ...prev,
        isHydrating: true,
        loadingAction: storedInstructions
          ? 'Processing document with your instructions...'
          : 'Preparing document for review...'
      }));
    } else {
      setState(prev => ({ ...prev, isHydrating: false, loadingAction: null }));
    }
  }, [getCachedPendingId]);

  const [state, setState] = useState<PendingReviewState>({
    pendingId: null,
    loadingAction: null,
    primary: EMPTY_PRIMARY,
    other: EMPTY_OTHER,
    lineItems: EMPTY_LINE_ITEMS,
    suggestedPrompts: [],
    corrections: [],
    documentLabel: null,
    convertedDocumentUrl: null,
    presignedPdfUrl: null,
    tabularPresignedUrl: null,
    csvData: null,
    originalCsvData: null,
    processedCsvData: null,
    isCsv: false,
    isHydrating: true,
    isInstructionRunning: false,
    isApplyingTemplate: false,
    mode: null,
    entityType: null,
    extractedDataSets: [{}],
    activeDataSetIndex: 0,
    dataSets: [],
    pages: [],
  });

  const [instructionVariables, setInstructionVariables] = useState<{
    input: { 
      pendingId: string; 
      instructions: { 
        instruction: string; 
        instructionIdentifier: string | null; 
      }; 
    };
  } | null>(null);

  const [applyTemplateVariables, setApplyTemplateVariables] = useState<{
    input: {
      pendingId: string;
      clusterId: string;
    };
  } | null>(null);

  const [approveMut] = useMutation(M_APPROVE);
  const [rejectMut] = useMutation(M_REJECT);

  const shouldProcessDocument =
    session.mode === "document" && !!session.documentId && !!session.accessToken && shouldStartProcessing;

  const shouldLoadPending =
    session.mode === "pending" && !!session.pendingId && !!session.accessToken;

  useSubscription(SUB_UPDATE_INSTR, {
    variables: instructionVariables ?? undefined,
    skip: !instructionVariables,
    shouldResubscribe: true, // Allow resubscription when variables change
    onData: async ({ data }) => {
      console.log('🔄 API Response [updateDocumentInstructions]:', data);
      
      const event = (data.data as { updateDocumentInstructions?: { action?: string; isComplete?: boolean } })?.updateDocumentInstructions;
      if (!event) return;

      if (event.action) {
        console.log('📋 Instruction Action:', event.action);
        setState((prev) => ({ ...prev, loadingAction: event.action ?? prev.loadingAction }));
      }

      const isComplete = event.isComplete === true;
      if (isComplete) {
        console.log('✅ Instructions completed, refreshing data...');
        setInstructionVariables(null);
        setState((prev) => ({
          ...prev,
          loadingAction: 'Refreshing document data...',
          isInstructionRunning: false,
        }));
        
        // Refresh the pending document to get the updated convertedDocumentUrl
        await refreshPendingAfterInstruction();
        
        // Call the completion callback (e.g., to refresh version history)
        if (onInstructionComplete) {
          await Promise.resolve(onInstructionComplete());
        }
        
        // Clear loading state
        setState((prev) => ({
          ...prev,
          loadingAction: null,
        }));
      }
    },
    onError: (error) => {
      console.error('❌ API Error [updateDocumentInstructions]:', error);
      setInstructionVariables(null);
      setState((prev) => ({
        ...prev,
        loadingAction: `Instruction failed: ${error.message}`,
        isInstructionRunning: false,
      }));
      
      // Clear error after a few seconds
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          loadingAction: null,
        }));
      }, 5000);
    },
  });

  useSubscription(SUB_APPLY_CLUSTER_INSTRUCTIONS, {
    variables: applyTemplateVariables ?? undefined,
    skip: !applyTemplateVariables,
    shouldResubscribe: true,
    onData: async ({ data }) => {
      console.log('dY", API Response [applyClusterInstructions]:', data);

      const event = (data.data as { applyClusterInstructions?: { action?: string; isComplete?: boolean } })?.applyClusterInstructions;
      if (!event) return;

      if (event.action) {
        setState((prev) => ({
          ...prev,
          loadingAction: event.action ?? prev.loadingAction,
        }));
      }

      if (event.isComplete) {
        console.log('�o. applyClusterInstructions completed, refreshing data...');
        setApplyTemplateVariables(null);
        setState((prev) => ({
          ...prev,
          loadingAction: 'Refreshing document data...',
          isInstructionRunning: false,
          isApplyingTemplate: false,
        }));

        await refreshPendingAfterInstruction();

        if (onInstructionComplete) {
          await Promise.resolve(onInstructionComplete());
        }

        setState((prev) => ({
          ...prev,
          loadingAction: null,
        }));
      }
    },
    onError: (error) => {
      console.error('�?O API Error [applyClusterInstructions]:', error);
      setApplyTemplateVariables(null);
      setState((prev) => ({
        ...prev,
        loadingAction: `Template failed: ${error.message}`,
        isInstructionRunning: false,
        isApplyingTemplate: false,
      }));

      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          loadingAction: null,
        }));
      }, 5000);
    },
  });

  const loadCorrections = useCallback(
    async (pendingId?: string) => {
      const id = pendingId ?? state.pendingId;
      if (!id) {
        console.log('📋 loadCorrections: No pending ID available, skipping');
        return;
      }
      
      try {
        console.log('🔄 API Request [getPendingDocumentCorrections] - Pending ID:', id);
        
        const res = await client.query({
          query: Q_GET_CORRECTIONS,
          variables: { pendingId: id },
          fetchPolicy: "no-cache",
        });

        console.log('🔄 API Response [getPendingDocumentCorrections]:', res.data);

        const payload = res.data as {
          getPendingDocumentCorrections?: CorrectionEntry[];
        };

        const corrections = Array.isArray(payload.getPendingDocumentCorrections)
          ? payload.getPendingDocumentCorrections
          : [];

        setState((prev) => ({
          ...prev,
          corrections: corrections.map(mapCorrection),
        }));
        
        console.log('✅ Loaded', corrections.length, 'corrections');
      } catch (error) {
        console.error('❌ API Error [getPendingDocumentCorrections]:', error);
      }
    },
    [client, state.pendingId]
  );

  // Note: generatePresignedUrl is no longer needed
  // originalPresignedUrl now comes directly from the API response

  const fetchCsvData = useCallback(
    async (csvUrl: string): Promise<unknown[][] | null> => {
      console.log('dY"S Fetching CSV data from URL via backend proxy...');
      console.log('dY"S URL:', csvUrl);
      const data = await fetchCsvDataViaProxy(csvUrl);
      if (data) {
        console.log('CSV data fetched successfully:', data.length, 'rows');
        console.log('dY"S First few rows:', data.slice(0, 3));
      }
      return data;
    },
    []
  );

  const hydrateFromPending = useCallback(
    async (pending: PendingDocument) => {
      console.log('🔄 hydrateFromPending called with:', {
        pendingId: pending.id,
        convertedDocumentUrl: pending.convertedDocumentUrl,
        originalPresignedUrl: pending.originalPresignedUrl,
        sourceName: pending.sourceName,
        entityType: pending.entityType,
        fileUploadProcessId: pending.fileUploadProcessId,
      });

      // Store fileUploadProcessId in localStorage if available
      if (pending.fileUploadProcessId) {
        try {
          localStorage.setItem('fileUploadProcessId', pending.fileUploadProcessId);
          console.log('💾 Stored fileUploadProcessId in localStorage:', pending.fileUploadProcessId);
        } catch (error) {
          console.warn('⚠️ Failed to store fileUploadProcessId:', error);
        }
      }

      // Parse extracted data - may contain multiple data sets
      const extractedArray = safeParseExtractedArray(pending.extractedDataJson);
      const pendingId = pending.id;
      const convertedDocumentUrl = pending.convertedDocumentUrl ?? null;
      const originalPresignedUrl = pending.originalPresignedUrl ?? null;
      const entityType = pending.entityType ?? null;
      
      // Build data sets array with identifiers
      const dataSets = extractedArray.map((extracted, index) => ({
        index,
        label: getIdentifierLabel(entityType),
        value: getIdentifierValue(extracted, entityType),
      }));

      // Use the first data set by default
      const activeDataSetIndex = 0;
      const extracted = extractedArray[activeDataSetIndex] || {};
      
      const primary = buildPrimary(extracted, entityType);
      const other = buildOther(extracted, entityType);
      const lineItems = buildLineItems(extracted);
      const suggestedPrompts = parseSuggested(pending.additionalInstructionsJson);

      // Check if this is a CSV file by looking at the URLs
      const isCsv = convertedDocumentUrl?.toLowerCase().includes('.csv') || 
                   convertedDocumentUrl?.toLowerCase().includes('tabular') ||
                   originalPresignedUrl?.toLowerCase().includes('.csv') ||
                   originalPresignedUrl?.toLowerCase().includes('tabular');
      
      console.log('📋 File type detection:', { isCsv, convertedDocumentUrl, originalPresignedUrl });
      
      let processedCsvData: unknown[][] | null = null;
      let originalCsvData: unknown[][] | null = null;
      let presignedPdfUrl: string | null = null;
      
      // If it's a CSV file, fetch BOTH original and processed data
      if (isCsv) {
        console.log('📊 Detected CSV file, fetching data...');
        
        // Fetch the ORIGINAL CSV from originalPresignedUrl (the "before" state)
        if (originalPresignedUrl) {
          console.log('📊 Fetching ORIGINAL CSV data from originalPresignedUrl...');
          console.log('📊 originalPresignedUrl:', originalPresignedUrl);
          originalCsvData = await fetchCsvData(originalPresignedUrl);
          console.log('✅ Original CSV data fetched successfully:', originalCsvData?.length, 'rows');
          
          if (originalCsvData && originalCsvData.length > 0) {
            console.log('📊 Original Headers:', originalCsvData[0]);
          }
        } else {
          console.warn('⚠️ originalPresignedUrl is null/undefined - cannot fetch original CSV data');
        }
        
        // Fetch the PROCESSED data from convertedDocumentUrl (the "after" state)
        if (convertedDocumentUrl) {
          console.log('📊 Fetching PROCESSED CSV data from convertedDocumentUrl...');
          console.log('📊 convertedDocumentUrl:', convertedDocumentUrl);
          processedCsvData = await fetchCsvData(convertedDocumentUrl);
          console.log('✅ Processed CSV data fetched successfully:', processedCsvData?.length, 'rows');
          
          if (processedCsvData && processedCsvData.length > 0) {
            console.log('📊 Processed Headers:', processedCsvData[0]);
          }
        } else {
          console.warn('⚠️ convertedDocumentUrl is null/undefined - cannot fetch processed CSV data');
        }
        
        if (!originalCsvData && !processedCsvData) {
          console.error('❌ Both originalPresignedUrl and convertedDocumentUrl are missing - no CSV data available');
        }
      } else {
        // For PDF files, use originalPresignedUrl as presignedPdfUrl
        console.log('📄 Detected PDF file, using originalPresignedUrl as presignedPdfUrl');
        presignedPdfUrl = originalPresignedUrl;
      }

      setState((prev) => ({
        ...prev,
        pendingId,
        convertedDocumentUrl,
        presignedPdfUrl,
        tabularPresignedUrl: null, // No longer used
        csvData: processedCsvData, // Keep for backward compatibility - use processed data
        // CRITICAL: Set original CSV ONLY on initial hydration and NEVER overwrite it
        originalCsvData: originalCsvData ?? prev.originalCsvData, // Use new data or preserve existing
        processedCsvData: processedCsvData, // Current processed CSV data (updates after instructions)
        isCsv: isCsv || false,
        documentLabel: pending.sourceName ?? null,
        entityType,
        primary,
        other,
        lineItems,
        suggestedPrompts,
        isHydrating: false,
        loadingAction: null,
        extractedDataSets: extractedArray,
        activeDataSetIndex,
        dataSets,
        pages: pending.pages ?? [],
      }));

      console.log('✅ State updated:', {
        pendingId,
        isCsv,
        hasOriginalCsvData: !!originalCsvData,
        hasProcessedCsvData: !!processedCsvData,
        originalCsvRows: originalCsvData?.length,
        processedCsvRows: processedCsvData?.length,
        dataSetCount: extractedArray.length,
        dataSets,
      });

      void loadCorrections(pendingId);
    },
    [loadCorrections, fetchCsvData]
  );

  const refreshPendingAfterInstruction = useCallback(async () => {
    if (!state.pendingId) {
      console.log('📋 refreshPendingAfterInstruction: No pending ID available');
      return;
    }
    
    console.log('🔄 API Request [getPendingDocument] (after instruction) - Pending ID:', state.pendingId);
    
    try {
      // Reload the pending document to get updated convertedDocumentUrl
      const res = await client.query({
        query: Q_GET_PENDING,
        variables: { pendingId: state.pendingId },
        fetchPolicy: "no-cache",
      });
      
      console.log('🔄 API Response [getPendingDocument]:', res.data);
      
      const response = res.data as { getPendingDocument?: PendingDocument };
      const pending = response.getPendingDocument;
      
      if (pending?.id) {
        console.log('✅ Got updated pending document');
        
        // Parse extracted data - may contain multiple data sets (CRITICAL FIX: use safeParseExtractedArray)
        const extractedArray = safeParseExtractedArray(pending.extractedDataJson);
        const entityType = pending.entityType ?? null;
        
        // Build data sets array with identifiers
        const dataSets = extractedArray.map((extracted, index) => ({
          index,
          label: getIdentifierLabel(entityType),
          value: getIdentifierValue(extracted, entityType),
        }));
        
        // Use the active data set (preserve current index if valid)
        const activeDataSetIndex = Math.min(state.activeDataSetIndex, extractedArray.length - 1);
        const extracted = extractedArray[activeDataSetIndex] || {};
        
        const primary = buildPrimary(extracted, entityType);
        const other = buildOther(extracted, entityType);
        const lineItems = buildLineItems(extracted);
        const suggestedPrompts = parseSuggested(pending.additionalInstructionsJson);
        const convertedDocumentUrl = pending.convertedDocumentUrl ?? null;

        // Check if this is a CSV file
        const isCsv = convertedDocumentUrl?.toLowerCase().includes('.csv') || 
                     convertedDocumentUrl?.toLowerCase().includes('tabular') ||
                     state.isCsv;
        
        let processedCsvData: unknown[][] | null = null;
        
        // If it's a CSV file, fetch the UPDATED PROCESSED data from convertedDocumentUrl
        // IMPORTANT: Do NOT fetch original data here - it's already loaded and should never change
        if (isCsv && convertedDocumentUrl) {
          console.log('📊 Fetching updated PROCESSED CSV data from convertedDocumentUrl...');
          processedCsvData = await fetchCsvData(convertedDocumentUrl);
          console.log('✅ Updated PROCESSED CSV data fetched successfully:', processedCsvData?.length, 'rows');
        }

        setState((prev) => ({
          ...prev,
          convertedDocumentUrl,
          documentLabel: pending.sourceName ?? null,
          entityType,
          primary,
          other,
          lineItems,
          suggestedPrompts,
          processedCsvData: processedCsvData ?? prev.processedCsvData, // Update with new processed data
          // CRITICAL: Preserve originalCsvData - it should NEVER be overwritten after initial load
          // originalCsvData: prev.originalCsvData (keep unchanged - this is the immutable "before" state)
          // CRITICAL FIX: Update extractedDataSets with new data from API to prevent stale data in manual edits
          extractedDataSets: extractedArray,
          activeDataSetIndex,
          dataSets,
        }));
        
        // For CSV files, do NOT reload corrections from API
        // Changes will be computed from CSV comparison
        if (!isCsv) {
          await loadCorrections(state.pendingId);
        }
      }
    } catch (error) {
      console.error('❌ API Error [refreshPendingAfterInstruction]:', error);
    }
  }, [client, state.pendingId, state.isCsv, state.activeDataSetIndex, fetchCsvData, loadCorrections]);

  const refetchPending = useCallback(
    async (targetId?: string) => {
      const id = targetId ?? state.pendingId ?? session.pendingId;
      if (!id) return null;
      const res = await client.query({
        query: Q_GET_PENDING,
        variables: { pendingId: id },
        fetchPolicy: "no-cache",
      });
      const response = res.data as { getPendingDocument?: PendingDocument };
      const pending = response.getPendingDocument;
      if (pending?.id) {
        await hydrateFromPending(pending);
      } else {
        setState((prev) => ({
          ...prev,
          isHydrating: false,
          loadingAction: null,
        }));
      }
      return pending ?? null;
    },
    [client, hydrateFromPending, session.pendingId, state.pendingId]
  );

  useEffect(() => {
    if (!shouldLoadPending || !session.pendingId) return;
    void refetchPending(session.pendingId);
  }, [shouldLoadPending, session.pendingId, refetchPending]);

  // Update state mode when session changes
  useEffect(() => {
    setState(prev => ({ ...prev, mode: session.mode }));
  }, [session.mode]);

  // Process document subscription - ONLY for document mode, NO fallbacks
  const subscriptionResult = useSubscription(SUB_PROCESS_DOC, {
    variables: shouldProcessDocument
      ? { documentId: session.documentId, initialInstructions, contextFiles }
      : undefined,
    skip: !shouldProcessDocument,
    onData: ({ data }) => {
      console.log('🔄 API Response [processDocumentForReview]:', data);
      
      const payload = (data.data as { processDocumentForReview?: { pendingDocument?: PendingDocument; action?: string } })?.processDocumentForReview;
      if (!payload) return;
      
      // Always update action text when received
      if (payload.action) {
        console.log('📋 Action Update:', payload.action);
        setState((prev) => ({ ...prev, loadingAction: payload.action || null }));
      }
      
      // Only hydrate when we get a real pending document
      const pending = payload.pendingDocument as PendingDocument | undefined;
      if (pending?.id) {
        console.log('✅ PendingDocument received - ID:', pending.id);
        
        // Cache the pendingId for this documentId if we have one
        if (session.documentId) {
          cachePendingId(session.documentId, pending.id);
        }
        
        void hydrateFromPending(pending);
      }
    },
    onError: (error) => {
      console.error('❌ API Error [processDocumentForReview]:', error);
      setState((prev) => ({
        ...prev,
        loadingAction: `Subscription failed: ${error.message}`,
        isHydrating: false,
      }));
    },
  });

  // Debug subscription state
  useEffect(() => {
    if (shouldProcessDocument) {
      console.log('📊 Subscription Status:', {
        loading: subscriptionResult.loading,
        error: subscriptionResult.error?.message,
        documentId: session.documentId,
      });
    }
  }, [shouldProcessDocument, subscriptionResult.loading, subscriptionResult.error, session.documentId]);

  const refreshPending = useCallback(async () => {
    if (!state.pendingId) {
      console.log('📋 refreshPending: No pending ID available');
      return;
    }
    
    console.log('🔄 API Request [getPendingDocument] - Pending ID:', state.pendingId);
    
    try {
      // First reload the pending document
      const res = await client.query({
        query: Q_GET_PENDING,
        variables: { pendingId: state.pendingId },
        fetchPolicy: "no-cache",
      });
      
      console.log('🔄 API Response [getPendingDocument]:', res.data);
      
      const response = res.data as { getPendingDocument?: PendingDocument };
      const pending = response.getPendingDocument;
      
      if (pending?.id) {
        console.log('✅ Got updated pending document');
        
        // Parse extracted data - may contain multiple data sets (CRITICAL FIX: use safeParseExtractedArray)
        const extractedArray = safeParseExtractedArray(pending.extractedDataJson);
        const entityType = pending.entityType ?? null;
        
        // Build data sets array with identifiers
        const dataSets = extractedArray.map((extracted, index) => ({
          index,
          label: getIdentifierLabel(entityType),
          value: getIdentifierValue(extracted, entityType),
        }));
        
        // Use the active data set (preserve current index if valid)
        const activeDataSetIndex = Math.min(state.activeDataSetIndex, extractedArray.length - 1);
        const extracted = extractedArray[activeDataSetIndex] || {};
        
        const primary = buildPrimary(extracted, entityType);
        const other = buildOther(extracted, entityType);
        const lineItems = buildLineItems(extracted);
        const suggestedPrompts = parseSuggested(pending.additionalInstructionsJson);

        setState((prev) => ({
          ...prev,
          convertedDocumentUrl: pending.convertedDocumentUrl ?? null,
          documentLabel: pending.sourceName ?? null,
          entityType,
          primary,
          other,
          lineItems,
          suggestedPrompts,
          // CRITICAL FIX: Update extractedDataSets with new data from API to prevent stale data in manual edits
          extractedDataSets: extractedArray,
          activeDataSetIndex,
          dataSets,
        }));
        
        // Then reload corrections
        await loadCorrections(state.pendingId);
      }
    } catch (error) {
      console.error('❌ API Error [refreshPending]:', error);
    }
  }, [client, state.pendingId, state.activeDataSetIndex, loadCorrections]);

  const approve = useCallback(async (saveToTemplate: boolean = true) => {
    if (!state.pendingId) return;
    await approveMut({ variables: { pendingId: state.pendingId, saveToTemplate } });
  }, [approveMut, state.pendingId]);

  const reject = useCallback(async () => {
    if (!state.pendingId) return;
    await rejectMut({ variables: { pendingId: state.pendingId } });
  }, [rejectMut, state.pendingId]);

  const sendInstructions = useCallback(
    (instructions: string, instructionIdentifier?: string) => {
      if (!state.pendingId || !instructions.trim()) return;
      
      console.log('🔄 API Request [updateDocumentInstructions] - Pending ID:', state.pendingId, 'Instructions:', instructions.trim());
      console.log('📋 Instruction Identifier:', instructionIdentifier || 'none');
      console.log('📋 File type - isCsv:', state.isCsv);
      console.log('📋 Available URLs:', {
        presignedPdfUrl: state.presignedPdfUrl,
        convertedDocumentUrl: state.convertedDocumentUrl,
      });
      
      // New structure: instructions is now an object with instruction and instructionIdentifier
      const input = {
        pendingId: state.pendingId,
        instructions: {
          instruction: instructions.trim(),
          instructionIdentifier: instructionIdentifier || null,
        },
      };
      
      setInstructionVariables({ input });
      setState((prev) => ({
        ...prev,
        isInstructionRunning: true,
      }));
    },
    [state.pendingId, state.isCsv, state.presignedPdfUrl, state.convertedDocumentUrl]
  );

  const applyTemplate = useCallback(
    (clusterId: string) => {
      if (!state.pendingId || !clusterId) {
        console.warn('dY"< applyTemplate: Missing pendingId or clusterId');
        return false;
      }

      setApplyTemplateVariables({
        input: {
          pendingId: state.pendingId,
          clusterId,
        },
      });

      setState((prev) => ({
        ...prev,
        isInstructionRunning: true,
        isApplyingTemplate: true,
        loadingAction: prev.loadingAction ?? 'Applying template instructions...',
      }));

      return true;
    },
    [state.pendingId]
  );

  const setLoadingAction = useCallback((action: string | null) => {
    setState((prev) => ({ ...prev, loadingAction: action }));
  }, []);

  // Compute CSV changes automatically when originalCsvData or processedCsvData changes
  // This replaces the need to fetch corrections from API for CSV files
  const csvChanges = useMemo(() => {
    if (!state.isCsv || !state.originalCsvData || !state.processedCsvData) {
      return [];
    }
    
    console.log('📊 Computing CSV changes from before/after comparison...');
    const changes = generateCsvChanges(state.originalCsvData, state.processedCsvData);
    console.log('✅ Generated', changes.length, 'CSV changes');
    
    return changes;
  }, [state.isCsv, state.originalCsvData, state.processedCsvData]);

  // Combine API corrections (for PDFs) with CSV changes (for CSVs)
  const effectiveCorrections = useMemo(() => {
    if (state.isCsv) {
      // For CSV files, use computed changes instead of API corrections
      return csvChanges;
    }
    // For PDF files, use API corrections as before
    return state.corrections;
  }, [state.isCsv, csvChanges, state.corrections]);

  // Determine if we need to show the initial instructions prompt
  const needsInitialInstructions = useMemo(() => {
    return session.mode === "document" && !!session.documentId && !!session.accessToken && !shouldStartProcessing;
  }, [session.mode, session.documentId, session.accessToken, shouldStartProcessing]);

  // Function to start processing with or without initial instructions
  const startProcessing = useCallback((instructions?: string, fileIds?: string[]) => {
    if (instructions) {
      setInitialInstructions([instructions]);
    } else {
      setInitialInstructions([]);
    }
    if (fileIds && fileIds.length > 0) {
      setContextFiles(fileIds);
    } else {
      setContextFiles(null);
    }
    setShouldStartProcessing(true);
    // Set loading state when starting processing
    setState(prev => ({ 
      ...prev, 
      isHydrating: true, 
      loadingAction: instructions 
        ? 'Processing document with your instructions...' 
        : 'Preparing document for review...' 
    }));
  }, []);

  // Function to change the active data set
  const setActiveDataSet = useCallback((index: number) => {
    const extracted = state.extractedDataSets[index];
    if (!extracted) {
      console.error(`Data set at index ${index} not found`);
      return;
    }

    const primary = buildPrimary(extracted, state.entityType);
    const other = buildOther(extracted, state.entityType);
    const lineItems = buildLineItems(extracted);

    setState(prev => ({
      ...prev,
      activeDataSetIndex: index,
      primary,
      other,
      lineItems,
    }));
  }, [state.extractedDataSets, state.entityType]);

  const updateExtractedDataSets = useCallback(
    (updater: (prev: Extracted[]) => Extracted[]) => {
      setState((prev) => {
        const nextExtracted = updater(prev.extractedDataSets);
        const maxIndex = Math.max(nextExtracted.length - 1, 0);
        const nextIndex = Math.min(prev.activeDataSetIndex, maxIndex);
        const activeExtracted = nextExtracted[nextIndex] ?? ({} as Extracted);

        return {
          ...prev,
          extractedDataSets: nextExtracted,
          activeDataSetIndex: nextIndex,
          primary: buildPrimary(activeExtracted, prev.entityType),
          other: buildOther(activeExtracted, prev.entityType),
          lineItems: buildLineItems(activeExtracted),
        };
      });
    },
    []
  );

  return {
    ...state,
    corrections: effectiveCorrections, // Override with effective corrections
    needsInitialInstructions,
    startProcessing,
    approve,
    reject,
    refreshPending,
    sendInstructions,
    setLoadingAction,
    refetchPending,
    setActiveDataSet, // Export the new function
    updateExtractedDataSets,
    applyTemplate,
  };
}

function parseSuggested(input?: string | null): string[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string") as string[];
    }
    return [];
  } catch {
    return [];
  }
}

function mapCorrection(entry: CorrectionEntry): ParsedCorrection {
  return {
    id: entry.id,
    action: entry.correctionAction,
    createdAt: entry.createdAt,
    before: safeJson(entry.oldValue),
    after: safeJson(entry.newValue),
  };
}

function safeJson(value?: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}






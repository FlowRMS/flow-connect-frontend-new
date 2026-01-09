'use client';

import { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useMutation } from '@apollo/client/react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Sparkles, Zap, Star } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent } from '@/components/flow-ai/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/flow-ai/ui/dialog';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Input } from '@/components/flow-ai/ui/input';
import { FieldsExtractedPane, type ExtractedField } from '@/components/flow-ai/flowrms/FieldsExtractedPane';
import { LayoutToggle } from '@/components/flow-ai/flowrms/LayoutToggle';
import { ChatPromptComposer } from '@/components/flow-ai/flowrms/ChatPromptComposer';
import { ChangesFeed } from '@/components/flow-ai/flowrms/ChangesFeed';
import { ActionPanel } from '@/components/flow-ai/flowrms/ActionPanel';
import { InstructionsPane } from '@/components/flow-ai/flowrms/InstructionsPane';
import { generateLineItemPrompt, generateFieldPrompt } from '@/lib/flow-ai/prompt-utils';
// Auth handled by Keycloak middleware - no manual redirects needed
import type { SelectionData } from '@/components/flow-ai/DataGrid';
import { LINE_ITEM_SOURCE_MAP_KEY, type Extracted } from '@/lib/flow-ai/parseExtracted';
import { toast } from 'sonner';
import { usePendingReview } from '@/components/flow-ai/hooks/usePendingReview';
import { useVersionHistory, type VersionHistoryEntry } from '@/components/flow-ai/hooks/useVersionHistory';
import { VersionHistoryTab } from '@/components/flow-ai/flowrms/VersionHistoryTab';
import { VersionComparisonModal } from '@/components/flow-ai/flowrms/VersionComparisonModal';
import { buildExtractedFields } from '@/lib/flow-ai/extracted-field-mapper';
import { M_MANUAL_EDIT_DATA } from '@/lib/flow-ai/gql';
import { useProcessExtractedDtos } from '@/components/flow-ai/hooks/useProcessExtractedDtos';
import { SupportSubmissionModal } from '@/components/flow-ai/flowrms/SupportSubmissionModal';
import { SelectTemplateModal } from '@/components/flow-ai/flowrms/SelectTemplateModal';
import { extractUserInfoFromToken } from '@/lib/flow-ai/jwt-utils';
import { getStoredValue } from '@/lib/flow-ai/token-storage';
import { isDateField, formatDateForStorage, toDateInputValue, formatDateDisplay } from '@/lib/flow-ai/format-utils';
import { CombinedUploadPane } from '@/components/flow-ai/flowrms/CombinedUploadPane';
import { RequiredFieldsGate } from '@/components/flow-ai/flowrms/RequiredFieldsGate';
import type { EntitySearchResult } from '@/components/flow-ai/flowrms/EntitySearchDropdown';
import { Q_SEARCH_EXISTING_ENTITIES } from '@/lib/flow-ai/gql';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';

const PdfPreviewPane = dynamic(
  () => import('@/components/flow-ai/flowrms/PdfPreviewPane').then((mod) => ({ default: mod.PdfPreviewPane })),
  {
    ssr: false,
    loading: () => (
      <div className="flow-card h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="p-6 bg-muted rounded-2xl inline-flex">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Loading PDF Viewer...</h3>
            <p className="text-sm text-muted-foreground">Please wait while we initialize the PDF viewer</p>
          </div>
        </div>
      </div>
    ),
  }
);

const CsvBeforeAfterPane = dynamic(
  () => import('@/components/flow-ai/flowrms/CsvBeforeAfterPane').then((mod) => ({ default: mod.CsvBeforeAfterPane })),
  {
    ssr: false,
    loading: () => (
      <div className="flow-card h-full flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="p-6 bg-muted rounded-2xl inline-flex">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Loading CSV Before/After View...</h3>
            <p className="text-sm text-muted-foreground">Please wait while we initialize the CSV comparison view</p>
          </div>
        </div>
      </div>
    ),
  }
);

type ManualEditValue = string | null;
type ManualEditsMap = Record<string, ManualEditValue>;
type ManualEditsByDataset = Record<number, ManualEditsMap>;
const EMPTY_MANUAL_EDIT_MAP: ManualEditsMap = Object.freeze({});
const MANUAL_EDIT_NULL_TOKEN = '__FLOW_RMS_NULL__';
type ManualEditPayload = { data: Extracted[] };
type ManualEditTarget =
  | {
      kind: 'field';
      field: ExtractedField;
      parentField?: string;
      dataSetIdentifier?: string;
      dataSetIndex: number;
      sourcePath: string;
    }
  | {
      kind: 'lineItem';
      columnKey: string;
      columnName: string;
      rowIndex: number;
      rowIdentifier?: string;
      dataSetIdentifier?: string;
      dataSetIndex: number;
      sourcePath: string;
    };

// FlowAI facts and tips to show during loading
const FLOWAI_FACTS = [
  { title: "Smart Extraction", fact: "FlowAI uses advanced AI to automatically extract data from invoices, quotes, and orders with over 95% accuracy." },
  { title: "Template Learning", fact: "Save time by creating templates - FlowAI learns your document patterns and applies them to future uploads automatically." },
  { title: "Entity Matching", fact: "Our intelligent matching system connects extracted data to your existing customers, products, and contacts." },
  { title: "Multi-Format Support", fact: "FlowAI handles PDFs, Excel files, CSVs, and even scanned documents with OCR technology." },
  { title: "Real-Time Collaboration", fact: "Multiple team members can review and approve documents simultaneously with live updates." },
  { title: "Audit Trail", fact: "Every change is tracked with version history, so you can always see who modified what and when." },
  { title: "Custom Instructions", fact: "Give FlowAI natural language instructions like 'increase all prices by 10%' and watch it apply changes instantly." },
  { title: "Batch Processing", fact: "Upload multiple documents at once - FlowAI processes them in parallel for maximum efficiency." },
  { title: "Smart Suggestions", fact: "FlowAI learns from your corrections and suggests improvements for future document processing." },
  { title: "Integration Ready", fact: "Seamlessly connect FlowAI with your existing ERP and accounting systems through our API." },
  { title: "Data Validation", fact: "Built-in validation rules catch errors before they reach your system, ensuring data quality." },
  { title: "Quick Actions", fact: "Use keyboard shortcuts and quick actions to speed up your document review workflow." },
];

// Cool animated loading component
function CoolLoadingState({ message }: { message?: string }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(() => Math.floor(Math.random() * FLOWAI_FACTS.length));
  const [isFactVisible, setIsFactVisible] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Rotate facts every 5 seconds with fade animation
  useEffect(() => {
    const factInterval = setInterval(() => {
      setIsFactVisible(false);
      setTimeout(() => {
        setCurrentFactIndex(prev => (prev + 1) % FLOWAI_FACTS.length);
        setIsFactVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(factInterval);
  }, []);

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const currentFact = FLOWAI_FACTS[currentFactIndex];

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center">
      <div className="text-center space-y-8 max-w-lg mx-auto px-4">
        <div className="relative">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-bounce [animation-delay:-0.3s]">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <div className="animate-bounce [animation-delay:-0.15s]">
              <Zap className="w-12 h-12 text-primary" />
            </div>
            <div className="animate-bounce">
              <Star className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full blur-xl animate-pulse"></div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FlowAI
          </h2>
          <div className="space-y-3">
            <p className="text-lg text-muted-foreground">
              {message || 'Initializing document review system...'}
            </p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse [animation-delay:0ms]"></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse [animation-delay:150ms]"></div>
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse [animation-delay:300ms]"></div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              Time elapsed: <span className="text-primary font-semibold">{formatElapsedTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative w-80 h-2 bg-muted rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-[slide-across_2s_ease-in-out_infinite] rounded-full"></div>
          </div>
        </div>

        {/* FlowAI Facts Section */}
        <div className={`mt-8 p-6 bg-primary/5 border border-primary/20 rounded-xl transition-opacity duration-300 ${isFactVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Did you know?</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-2">{currentFact.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{currentFact.fact}</p>
          <div className="flex justify-center gap-1 mt-4">
            {FLOWAI_FACTS.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentFactIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Upload Handler
interface NoDocumentFoundStateProps {
  onDocumentUploaded: (documentId: string, documentType: string, instructions?: string, contextFileIds?: string[]) => void;
}

function NoDocumentFoundState({ onDocumentUploaded }: NoDocumentFoundStateProps) {
  return <CombinedUploadPane onDocumentUploaded={onDocumentUploaded} />;
}

function FlowRMSPageContent() {
  const searchParams = useSearchParams();

  // Capture URL parameters and store in localStorage on mount
  useEffect(() => {
    const urlPendingId = searchParams.get('pendingId');
    const urlFileUploadProcessId = searchParams.get('fileUploadProcessId');
    const urlRealm = searchParams.get('realm');

    if (urlPendingId) {
      localStorage.setItem('flowrms_pending_id', urlPendingId);
      localStorage.setItem('flowrms_mode', 'pending');
      console.log('💾 Stored pendingId from URL:', urlPendingId);
    }

    if (urlFileUploadProcessId) {
      localStorage.setItem('fileUploadProcessId', urlFileUploadProcessId);
      console.log('💾 Stored fileUploadProcessId from URL:', urlFileUploadProcessId);
    }

    if (urlRealm) {
      // Set realm cookie via API call
      fetch(`/set-tenant?realm=${urlRealm}`, { method: 'GET' })
        .then(() => console.log('💾 Set tenant realm from URL:', urlRealm))
        .catch((err) => console.error('❌ Failed to set tenant realm:', err));
    }
  }, [searchParams]);

  const router = useRouter();
  
  // Initialize version history first so we can pass refreshHistory to usePendingReview
  const [tempPendingId, setTempPendingId] = useState<string | null>(null);
  const [tempEntityType, setTempEntityType] = useState<string | null>(null);
  
  const {
    history: versionHistory,
    loadingHistory,
    historyError,
    refreshHistory,
    snapshots,
    loadSnapshot,
    loadingSnapshot,
    snapshotError,
    rollbackToVersion,
    isRollbacking,
    currentVersionNumber,
  } = useVersionHistory(tempPendingId, tempEntityType);

  const {
    pendingId,
    loadingAction,
    primary,
    other,
    lineItems: rawLineItems,
    suggestedPrompts,
    corrections,
    documentLabel,
    convertedDocumentUrl,
    presignedPdfUrl,
    originalCsvData,
    processedCsvData,
    isCsv,
    isHydrating,
    isInstructionRunning,
    mode,
    needsInitialInstructions,
    startProcessing,
    approve,
    sendInstructions,
    dataSets,
    extractedDataSets,
    activeDataSetIndex,
    setActiveDataSet,
    pages,
    refetchPending,
    entityType,
    updateExtractedDataSets,
    isApplyingTemplate,
    applyTemplate: applyTemplateFromTemplate,
  } = usePendingReview(refreshHistory);

  // Update temp values when real values change
  useEffect(() => {
    setTempPendingId(pendingId);
    setTempEntityType(entityType);
  }, [pendingId, entityType]);

  // Sync pendingId to URL whenever it changes
  useEffect(() => {
    if (pendingId && !isHydrating) {
      const currentParams = new URLSearchParams(window.location.search);
      const currentPendingId = currentParams.get('pendingId');
      
      // Only update URL if pendingId is different from what's in the URL
      if (currentPendingId !== pendingId) {
        const newParams = new URLSearchParams(currentParams);
        newParams.set('pendingId', pendingId);
        
        // Preserve other parameters like fileUploadProcessId, realm, etc.
        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        
        // Use router.replace to update URL without adding to history
        router.replace(newUrl, { scroll: false });
        
        console.log('🔗 Updated URL with pendingId:', pendingId);
      }
    }
  }, [pendingId, isHydrating, router]);

  const [activeLayout, setActiveLayout] = useState<'preview' | 'instructions' | 'changes' | 'versioning'>('preview');
  const [chatValue, setChatValue] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [saveToTemplate, setSaveToTemplate] = useState(true);
  const [noDocumentFound, setNoDocumentFound] = useState(false);
  const [pendingEntityNavigation, setPendingEntityNavigation] = useState<string | null>(null);

  // Hook for processing extracted DTOs subscription
  const {
    isComplete: processingComplete,
    isProcessing: isEntityProcessing,
    progress: entityProgress,
    error: entityProcessingError,
    startProcessing: startEntityProcessing,
    reset: resetEntityProcessing,
  } = useProcessExtractedDtos(pendingId);

  // Navigate to entity matching when processing is complete
  useEffect(() => {
    if (processingComplete && pendingEntityNavigation && pendingId) {
      console.log('✅ Entity processing complete, navigating to entity matching...');
      router.push(`/flow-ai/entity-matching?pendingId=${encodeURIComponent(pendingId)}&saveToTemplate=${pendingEntityNavigation}`);
      setIsApproving(false);
      setPendingEntityNavigation(null);
    }
  }, [processingComplete, pendingEntityNavigation, pendingId, router]);

  // Handle entity processing errors - show toast and reset state
  useEffect(() => {
    if (entityProcessingError) {
      console.error('❌ Entity processing error:', entityProcessingError);
      // Extract a user-friendly message from the error
      const errorMsg = entityProcessingError.includes('validation error')
        ? 'Processing failed due to a data validation error.'
        : 'Processing failed. Please try again.';

      // Build description with error details and pending ID for support
      const errorDetails = entityProcessingError.length > 150
        ? entityProcessingError.substring(0, 150) + '...'
        : entityProcessingError;
      const pendingIdInfo = pendingId ? `\n\nDocument ID for support: ${pendingId}` : '';

      toast.error(errorMsg, {
        description: `${errorDetails}${pendingIdInfo}`,
        duration: 15000, // Keep visible longer so user can copy the ID
      });
      // Reset the processing state so the user isn't stuck on the overlay
      setIsApproving(false);
      setPendingEntityNavigation(null);
      resetEntityProcessing();
    }
  }, [entityProcessingError, resetEntityProcessing, pendingId]);

  // Load saveToTemplate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('flowai_save_template_default');
    if (saved !== null) {
      setSaveToTemplate(saved === 'true');
    }

    // Listen for storage changes from admin settings
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flowai_save_template_default' && e.newValue !== null) {
        setSaveToTemplate(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);
  const [manualEditsByDataset, setManualEditsByDataset] = useState<ManualEditsByDataset>({});
  const [manualEditTarget, setManualEditTarget] = useState<ManualEditTarget | null>(null);
  const [manualEditValue, setManualEditValue] = useState('');
  const [manualEditInitialValue, setManualEditInitialValue] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isSelectTemplateOpen, setIsSelectTemplateOpen] = useState(false);
  const hasShownTemplateModalRef = useRef<string | null>(null);

  // Dummy quick prompts to replace additionalInstructions
  const dummyQuickPrompts = [
    'Update all prices by 10%',
    'Change the date format to MM/DD/YYYY',
    'Remove all empty rows',
    'Capitalize all customer names',
    'Convert currency from USD to EUR',
  ];

  const handleApplyTemplate = useCallback(
    async (clusterId: string) => {
      if (!clusterId) {
        toast.error('Select a template to apply.');
        return false;
      }

      if (!pendingId) {
        toast.error('A pending document is required before applying a template.');
        return false;
      }

      const started = applyTemplateFromTemplate(clusterId);
      if (started) {
        toast.info('Applying template instructions...');
        return true;
      }

      toast.error('Unable to start template application.');
      return false;
    },
    [applyTemplateFromTemplate, pendingId]
  );


  // Check if no document or pending ID exists after hydration - redirect to upload page
  useEffect(() => {
    // Only check after we've finished initial hydration
    if (!isHydrating) {
      const documentId = localStorage.getItem('flowrms_document_id');
      const storedPendingId = localStorage.getItem('flowrms_pending_id');
      const urlDocumentId = searchParams.get('documentId');
      const urlPendingId = searchParams.get('pendingId');

      // If neither document ID nor pending ID exists (in localStorage or URL), redirect to upload page
      if (!documentId && !storedPendingId && !urlDocumentId && !urlPendingId) {
        router.replace('/flow-ai/upload');
      }
    }
  }, [isHydrating, searchParams, router]);

  useEffect(() => {
    setManualEditsByDataset({});
    setManualEditTarget(null);
    setManualEditValue('');
    setManualEditInitialValue('');
  }, [pendingId]);

  const currentManualEdits = manualEditsByDataset[activeDataSetIndex] ?? EMPTY_MANUAL_EDIT_MAP;
  const stagedFieldPaths = useMemo(() => new Set(Object.keys(currentManualEdits)), [currentManualEdits]);
  const manualEditModalOpen = Boolean(manualEditTarget);
  const manualEditHasChanges = manualEditValue !== manualEditInitialValue;
  
  // Determine if the current field being edited is a date field
  const isEditingDateField = manualEditTarget
    ? manualEditTarget.kind === 'field' 
      ? isDateField(manualEditTarget.field.key)
      : isDateField(manualEditTarget.columnName)
    : false;
  
  const manualEditTitle = manualEditTarget
    ? manualEditTarget.kind === 'field'
      ? `Edit ${
          manualEditTarget.parentField
            ? `${manualEditTarget.parentField} -> ${manualEditTarget.field.key}`
            : manualEditTarget.field.key
        }`
      : `Edit ${manualEditTarget.columnName} (${manualEditTarget.rowIdentifier ?? `Row ${manualEditTarget.rowIndex + 1}`})`
    : 'Edit Field';
  const manualEditPath = manualEditTarget?.sourcePath ?? 'Unknown';
  const manualEditRowLabel =
    manualEditTarget && manualEditTarget.kind === 'lineItem'
      ? manualEditTarget.rowIdentifier ?? `Row ${manualEditTarget.rowIndex + 1}`
      : null;
  const mappedFields = useMemo<ExtractedField[]>(() => {
    const baseFields = buildExtractedFields(primary, other);
    if (Object.keys(currentManualEdits).length === 0) {
      return baseFields;
    }

    const applyOverrides = (field: ExtractedField): ExtractedField => {
      const overrideValue =
        field.sourcePath && Object.prototype.hasOwnProperty.call(currentManualEdits, field.sourcePath)
          ? currentManualEdits[field.sourcePath]
          : undefined;

      const next: ExtractedField = {
        ...field,
        value: overrideValue === undefined ? field.value : overrideValue,
      };

      if (field.nested?.length) {
        next.nested = field.nested.map(applyOverrides);
      }

      return next;
    };

    return baseFields.map(applyOverrides);
  }, [primary, other, currentManualEdits]);
  const displayLineItems = useMemo(
    () => applyLineItemOverrides(rawLineItems ?? [], currentManualEdits),
    [rawLineItems, currentManualEdits]
  );

  // Check if entity type requires validation (quotes and orders only)
  const normalizedEntityType = entityType?.toUpperCase();
  const requiresFieldValidation = normalizedEntityType === 'QUOTES' || normalizedEntityType === 'ORDERS';

  // Extract sold to customer name from primary fields
  const soldToCustomerName = useMemo(() => {
    const soldToField = primary.find(f => f.key === 'Sold To Customer');
    if (soldToField?.nested) {
      const nameField = soldToField.nested.find(nf => nf.key === 'Name');
      const value = nameField?.value;
      if (value && value !== 'NA' && value !== 'N/A') {
        return value;
      }
    }
    return null;
  }, [primary]);

  // Get line items that need end user names
  const lineItemsForEndUserAssignment = useMemo(() => {
    if (!requiresFieldValidation) return [];
    return displayLineItems.map((item, idx) => {
      const endUserName = item.end_user_name as string | null | undefined;
      const flowIndex = item.flow_index as string | number | null;
      // Get first non-internal column value as identifier
      const keys = Object.keys(item).filter(k => !k.startsWith('_') && k !== 'internal_uuid');
      const identifier = keys.length > 0 ? `${keys[0]}: ${item[keys[0]]}` : `Row ${idx + 1}`;

      // Extract additional display fields with flexible key matching
      const getFieldValue = (patterns: RegExp[]): string | number | null => {
        for (const pattern of patterns) {
          const key = keys.find(k => pattern.test(k));
          if (key && item[key] != null && item[key] !== '') {
            return item[key] as string | number;
          }
        }
        return null;
      };

      const itemNumber = getFieldValue([/^item[_\s]?(number|no|#)?$/i, /^line[_\s]?(number|no|#|item)?$/i]);
      const quantity = getFieldValue([/^(quantity|qty)$/i, /^(units?|count)$/i]);
      const unitPrice = getFieldValue([/^unit[_\s]?price$/i, /^price$/i, /^(unit[_\s]?cost|cost)$/i]);

      return {
        rowIndex: idx,
        flowIndex: flowIndex ?? null,
        currentEndUserName: endUserName?.trim() || null,
        identifier,
        itemNumber,
        quantity,
        unitPrice,
      };
    });
  }, [displayLineItems, requiresFieldValidation]);

  // Check which line items are missing end user names
  const lineItemsMissingEndUser = useMemo(() => {
    return lineItemsForEndUserAssignment.filter(item => !item.currentEndUserName);
  }, [lineItemsForEndUserAssignment]);

  // Check if all required fields are valid
  // NOTE: This validation is ONLY for PDFs, not for CSV/spreadsheets
  const allRequiredFieldsValid = useMemo(() => {
    // Skip validation entirely for CSV/spreadsheets - they don't need sold_to_customer/end_user validation here
    if (isCsv) return true;
    if (!requiresFieldValidation) return true;
    const hasSoldToName = Boolean(soldToCustomerName?.trim());
    const hasAllEndUsers = lineItemsMissingEndUser.length === 0;
    return hasSoldToName && hasAllEndUsers;
  }, [isCsv, requiresFieldValidation, soldToCustomerName, lineItemsMissingEndUser]);

  const instructionStatusRef = useRef(isInstructionRunning);
  const isSavingManualEditsRef = useRef(false);

  const selectedVersionSnapshot = selectedVersionNumber != null ? snapshots[selectedVersionNumber] ?? null : null;
  const [manualEditDataMutation] = useMutation(M_MANUAL_EDIT_DATA);

  useEffect(() => {
    if (!pendingId) return;
    if (Object.keys(manualEditsByDataset).length === 0) return;
    if (isSavingManualEditsRef.current) return; // Prevent concurrent saves

    let cancelled = false;
    isSavingManualEditsRef.current = true;

    const editsSnapshot = manualEditsByDataset;

    const saveEdits = async () => {
      const payload = buildManualEditPayload(extractedDataSets, editsSnapshot);
      if (!payload) {
        setManualEditsByDataset((current) => pruneSavedEdits(current, editsSnapshot));
        isSavingManualEditsRef.current = false;
        return;
      }

      try {
        await manualEditDataMutation({
          variables: {
            input: {
              pendingId,
              data: payload,
            },
          },
        });
        if (cancelled) return;
        toast.success('Manual changes saved.');
        updateExtractedDataSets((prev) => applyManualEditsToDataSets(prev, editsSnapshot));
        // Clear the saved edits immediately to prevent re-triggering
        setManualEditsByDataset((current) => pruneSavedEdits(current, editsSnapshot));
        
        // Refresh version history after manual edit
        refreshHistory();
        
        // Refetch in the background to sync extractedDataSets with backend
        // This happens after clearing edits to prevent re-triggering
        setTimeout(() => {
          if (!cancelled) {
            refetchPending().catch(() => undefined);
          }
        }, 100);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to save manual changes';
        toast.error(message);
      } finally {
        isSavingManualEditsRef.current = false;
      }
    };

    void saveEdits();

    return () => {
      cancelled = true;
      isSavingManualEditsRef.current = false;
    };
  }, [manualEditsByDataset, pendingId, manualEditDataMutation, extractedDataSets, refetchPending, updateExtractedDataSets]);

  const handleVersionSelect = useCallback(
    (entry: VersionHistoryEntry) => {
      setSelectedVersionNumber(entry.versionNumber);
      setIsVersionModalOpen(true);
      void loadSnapshot(entry.versionNumber).catch(() => undefined);
    },
    [loadSnapshot]
  );

  const handleRetrySnapshot = useCallback(() => {
    if (selectedVersionNumber != null) {
      void loadSnapshot(selectedVersionNumber).catch(() => undefined);
    }
  }, [selectedVersionNumber, loadSnapshot]);

  const handleRollback = useCallback(
    async (versionNumber: number, changeDescription?: string) => {
      try {
        await rollbackToVersion(versionNumber, changeDescription);
        toast.success(`Rolled back to version ${versionNumber}`);
        await refetchPending();
        await refreshHistory();
        setIsVersionModalOpen(false);
        setSelectedVersionNumber(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected rollback error';
        toast.error(`Failed to rollback: ${message}`);
      }
    },
    [rollbackToVersion, refetchPending, refreshHistory]
  );

  const handleUndoCurrentVersion = useCallback(() => {
    if (isRollbacking) return;
    if (!currentVersionNumber || currentVersionNumber <= 1) {
      toast.info('No previous version available to undo.');
      return;
    }
    void handleRollback(currentVersionNumber - 1);
  }, [currentVersionNumber, handleRollback, isRollbacking]);

  const currentPreviewData = useMemo(() => ({
    versionNumber: currentVersionNumber,
    documentLabel,
    isCsv,
    pdfUrl: presignedPdfUrl ?? convertedDocumentUrl ?? undefined,
    presignedPdfUrl,
    convertedDocumentUrl: convertedDocumentUrl ?? undefined,
    pages,
    fields: mappedFields,
    lineItems: displayLineItems,
    dataSets,
    activeDataSetIndex,
    onDataSetChange: setActiveDataSet,
    originalCsvData,
    processedCsvData,
  }), [
    currentVersionNumber,
    documentLabel,
    isCsv,
    presignedPdfUrl,
    convertedDocumentUrl,
    pages,
    mappedFields,
    displayLineItems,
    dataSets,
    activeDataSetIndex,
    setActiveDataSet,
    originalCsvData,
    processedCsvData,
  ]);

  const handleModalOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedVersionNumber(null);
    }
    setIsVersionModalOpen(open);
  }, []);

  useEffect(() => {
    if (!pendingId) return;
    if (instructionStatusRef.current && !isInstructionRunning) {
      refreshHistory();
    }
    instructionStatusRef.current = isInstructionRunning;
  }, [pendingId, isInstructionRunning, refreshHistory]);

  const shouldShowWorkspace = Boolean(pendingId);

  // Auto-show Select Template modal when reaching prompting step without a template applied
  useEffect(() => {
    if (
      shouldShowWorkspace &&
      !isHydrating &&
      !isApplyingTemplate &&
      !isInstructionRunning &&
      !isSelectTemplateOpen &&
      pendingId &&
      hasShownTemplateModalRef.current !== pendingId &&
      (!suggestedPrompts || suggestedPrompts.length === 0)
    ) {
      setIsSelectTemplateOpen(true);
      hasShownTemplateModalRef.current = pendingId;
    }
  }, [
    shouldShowWorkspace,
    isHydrating,
    isApplyingTemplate,
    isInstructionRunning,
    isSelectTemplateOpen,
    pendingId,
    suggestedPrompts,
  ]);

  // Reset the ref when pendingId changes (new document)
  useEffect(() => {
    if (pendingId && hasShownTemplateModalRef.current !== pendingId) {
      // Reset when we get a new pendingId
      hasShownTemplateModalRef.current = null;
    }
  }, [pendingId]);

  // Use entity processing action message when available, otherwise fall back to loadingAction
  const entityProcessingMessage = isEntityProcessing && entityProgress?.action ? entityProgress.action : null;
  const loadingMessage = isHydrating
    ? entityProcessingMessage ?? loadingAction ?? 'Preparing document for review...'
    : !isInstructionRunning && loadingAction
    ? loadingAction
    : null;

  // Only show banner when workspace is visible and there's an instruction running
  const bannerMessage = shouldShowWorkspace && isInstructionRunning && loadingAction
    ? loadingAction
    : null;

  // Get the current data set identifier for API calls
  // Only include identifier when there are multiple data sets
  // For API: send ONLY the value (e.g., "I-00459600")
  const currentDataSetIdentifier = useMemo(() => {
    if (dataSets && dataSets.length > 1 && activeDataSetIndex < dataSets.length) {
      const currentSet = dataSets[activeDataSetIndex];
      return currentSet.value; // Only the value, not the label
    }
    return undefined;
  }, [dataSets, activeDataSetIndex]);

  // Get the current data set identifier with label for prompts/UI
  // Format: "Invoice #I-00459600" for display purposes
  const currentDataSetIdentifierWithLabel = useMemo(() => {
    if (dataSets && dataSets.length > 1 && activeDataSetIndex < dataSets.length) {
      const currentSet = dataSets[activeDataSetIndex];
      return `${currentSet.label}${currentSet.value}`;
    }
    return undefined;
  }, [dataSets, activeDataSetIndex]);

  const handleFieldClick = (
    fieldName: string,
    fieldValue: string | number | null,
    action: 'describe' | 'edit' | 'unmap' = 'describe',
    parentField?: string,
    dataSetIdentifier?: string,
    sourcePath?: string,
    dataSetIndex?: number
  ) => {
    const targetDataSetIndex = dataSetIndex ?? activeDataSetIndex;
    if (action === 'describe' && sourcePath) {
      const pendingEdits = manualEditsByDataset[targetDataSetIndex];
      if (pendingEdits && Object.prototype.hasOwnProperty.call(pendingEdits, sourcePath)) {
        toast.warning('Please wait for the manual change on this field to finish saving before using Describe.');
        return;
      }
    }

    const normalizedAction: 'describe' | 'unmap' = action === 'edit' ? 'describe' : action;
    const promptText = generateFieldPrompt(fieldName, fieldValue, normalizedAction, parentField, dataSetIdentifier);
    setChatValue(promptText);
    requestAnimationFrame(() => {
      document.getElementById('chat-composer-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const updateManualEditValue = useCallback(
    (dataSetIndex: number, path: string, nextValue: ManualEditValue) => {
      setManualEditsByDataset((prev) => {
        const currentDataSet = extractedDataSets[dataSetIndex] ?? {};
        const originalValue = getValueAtPath(currentDataSet, path);
        const existingMap = prev[dataSetIndex];

        if (valuesMatch(originalValue, nextValue)) {
          if (!existingMap || !(path in existingMap)) {
            return prev;
          }
          const updatedMap = { ...existingMap };
          delete updatedMap[path];
          const nextState = { ...prev };
          if (Object.keys(updatedMap).length === 0) {
            delete nextState[dataSetIndex];
          } else {
            nextState[dataSetIndex] = updatedMap;
          }
          return nextState;
        }

        const updatedMap = { ...(existingMap ?? {}) };
        if (updatedMap[path] === nextValue) {
          return prev;
        }
        return {
          ...prev,
          [dataSetIndex]: {
            ...updatedMap,
            [path]: nextValue,
          },
        };
      });
    },
    [extractedDataSets]
  );

  // Search for customers (used for Sold To Customer in RequiredFieldsGate)
  const handleSearchCustomers = useCallback(
    async (query: string, limit = 15): Promise<EntitySearchResult[]> => {
      try {
        const result = await flowrmsApolloClient.query<{ searchExistingEntities: Array<{ entityId: string; name: string; similarityScore?: number; metadata?: string }> }>({
          query: Q_SEARCH_EXISTING_ENTITIES,
          variables: {
            input: {
              entityType: 'CUSTOMERS',
              query,
              limit,
            },
          },
          fetchPolicy: 'network-only',
        });
        const entities = result.data?.searchExistingEntities || [];
        return entities.map((e) => ({
          entityId: e.entityId,
          name: e.name,
          similarityScore: e.similarityScore,
          metadata: e.metadata,
        }));
      } catch (error) {
        console.error('Error searching customers:', error);
        return [];
      }
    },
    []
  );

  // Search for end users (used for End User assignment in RequiredFieldsGate)
  const handleSearchEndUsers = useCallback(
    async (query: string, limit = 15): Promise<EntitySearchResult[]> => {
      try {
        const result = await flowrmsApolloClient.query<{ searchExistingEntities: Array<{ entityId: string; name: string; similarityScore?: number; metadata?: string }> }>({
          query: Q_SEARCH_EXISTING_ENTITIES,
          variables: {
            input: {
              entityType: 'END_USERS',
              query,
              limit,
            },
          },
          fetchPolicy: 'network-only',
        });
        const entities = result.data?.searchExistingEntities || [];
        return entities.map((e) => ({
          entityId: e.entityId,
          name: e.name,
          similarityScore: e.similarityScore,
          metadata: e.metadata,
        }));
      } catch (error) {
        console.error('Error searching end users:', error);
        return [];
      }
    },
    []
  );

  // Handle sold to customer change from RequiredFieldsGate
  const handleSoldToCustomerChange = useCallback(
    (name: string, _entityId: string) => {
      // Update the sold_to_customer.name field via manual edit
      updateManualEditValue(activeDataSetIndex, 'sold_to_customer.name', name);
    },
    [activeDataSetIndex, updateManualEditValue]
  );

  // Handle end user name updates from RequiredFieldsGate
  const handleEndUserNamesChange = useCallback(
    (updates: Array<{ rowIndex: number; endUserName: string }>) => {
      updates.forEach(({ rowIndex, endUserName }) => {
        const sourcePath = `details.${rowIndex}.end_user.name`;
        updateManualEditValue(activeDataSetIndex, sourcePath, endUserName);
      });
    },
    [activeDataSetIndex, updateManualEditValue]
  );

  const startLineItemManualEdit = useCallback(
    (
      selection: SelectionData,
      dataSetIdentifier?: string,
      dataSetIndex: number = activeDataSetIndex
    ) => {
      const { rowData, columnKey, columnName, value, rowIndex } = selection.data;
      if (!rowData || !columnKey || !columnName) {
        toast.error('Select a single cell to manually edit it.');
        return false;
      }

      const sourcePath = getLineItemSourcePath(rowData, columnKey);
      if (!sourcePath) {
        toast.error('Unable to manually edit this cell because its source path is missing.');
        return false;
      }

      const stagedValueMap = manualEditsByDataset[dataSetIndex];
      const stagedValue = stagedValueMap ? stagedValueMap[sourcePath] : undefined;
      const originalDataset = extractedDataSets[dataSetIndex] ?? {};
      const originalValue = getValueAtPath(originalDataset, sourcePath);
      const fallbackValue = value === undefined || value === null ? '' : toEditableString(value);

      let initialValue =
        stagedValue === undefined
          ? toEditableString(originalValue ?? fallbackValue)
          : stagedValue === null
            ? ''
            : stagedValue;
      
      // For date fields in line items, format the display value from YYYY-MM-DD to MM-DD-YYYY
      if (columnName && isDateField(columnName) && initialValue) {
        initialValue = formatDateDisplay(initialValue);
      }

      setManualEditValue(initialValue);
      setManualEditInitialValue(initialValue);
      setManualEditTarget({
        kind: 'lineItem',
        columnKey,
        columnName,
        rowIndex: rowIndex ?? 0,
        rowIdentifier: getLineItemRowIdentifier(rowData),
        dataSetIdentifier,
        dataSetIndex,
        sourcePath,
      });

      return true;
    },
    [activeDataSetIndex, manualEditsByDataset, extractedDataSets]
  );

  const applyLineItemUnmap = useCallback(
    (
      selection: SelectionData,
      dataSetIndex: number,
      dataSetIdentifier?: string
    ) => {
      const targets = collectLineItemTargets(selection);
      if (targets.length === 0) {
        toast.error('Unable to unmap the selection because no editable cells were found.');
        return false;
      }

      const uniquePaths = new Set<string>();
      targets.forEach(({ sourcePath }) => {
        uniquePaths.add(sourcePath);
      });

      uniquePaths.forEach((sourcePath) => {
        updateManualEditValue(dataSetIndex, sourcePath, 'NA');
      });

      const contextLabel = dataSetIdentifier ? ` for ${dataSetIdentifier}` : '';
      toast.success(
        `Will set ${uniquePaths.size} value${uniquePaths.size === 1 ? '' : 's'} to "NA"${contextLabel}.`
      );

      return true;
    },
    [updateManualEditValue]
  );

  const handleLineItemSelectionChange = (
    selection: SelectionData,
    closeDialog?: () => void,
    dataSetIdentifier?: string,
    dataSetIndex: number = activeDataSetIndex,
    source: 'pdf' | 'csv' = 'pdf'
  ) => {
    if (source === 'pdf' && selection.action === 'unmap') {
      const didStage = applyLineItemUnmap(selection, dataSetIndex, dataSetIdentifier);
      if (didStage) {
        closeDialog?.();
      }
      return;
    }

    if (source === 'pdf' && selection.action === 'edit') {
      const didOpen = startLineItemManualEdit(selection, dataSetIdentifier, dataSetIndex);
      if (didOpen) {
        closeDialog?.();
      }
      return;
    }

    const promptText = generateLineItemPrompt(selection, dataSetIdentifier);
    setChatValue(promptText);
    if (closeDialog) closeDialog();
    requestAnimationFrame(() => {
      document.getElementById('chat-composer-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleLineItemCellClick = (
    rowData: Record<string, unknown>,
    columnProp: string,
    columnName: string,
    dataSetIdentifier?: string
  ) => {
    const prefix = dataSetIdentifier ? `[${dataSetIdentifier}] ` : '';
    const keys = Object.keys(rowData).filter(key => !key.startsWith('_'));
    if (keys.length === 0) {
      const currentValue = String((rowData as Record<string, unknown>)[columnProp] ?? '');
      const promptText = `${prefix}For line item, update "${columnName}" from "${currentValue}" to `;
      setChatValue(promptText);
      return;
    }

    // PRIORITY 1: Check if flow_index exists (system-generated primary key)
    if (keys.includes('flow_index') && rowData.flow_index !== undefined && rowData.flow_index !== null) {
      const identifier = String(rowData.flow_index);
      const currentValue = String((rowData as Record<string, unknown>)[columnProp] ?? '');
      const promptText = `${prefix}For line item with flow_index value "${identifier}", change "${columnName}" value from "${currentValue}" to `;
      setChatValue(promptText);
      requestAnimationFrame(() => {
        document.getElementById('chat-composer-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    // PRIORITY 2: Try to find a likely primary key field using patterns
    const primaryKeyPatterns = [
      /^(po_?number|po_?no|purchase_?order_?number?)$/i,
      /^(order_?number|order_?no|order_?id)$/i,
      /^(invoice_?number|invoice_?no|invoice_?id)$/i,
      /^(document_?number|document_?no|doc_?number|doc_?no)$/i,
      /^(item_?number|item_?no|item_?id|part_?number|part_?no|sku)$/i,
      /^(id|identifier|ref|reference)$/i,
      /^(line_?number|line_?no|line_?item)$/i,
    ];

    // Fields that should NOT be used as primary keys
    const excludePatterns = [
      /^flow_index$/i, // Exclude since handled above
      /^(name|rep_?name|sales_?rep|contact|person|user)$/i,
      /^(description|desc|notes|comments|remarks)$/i,
      /^(address|location|city|state|zip|postal)$/i,
      /^(email|phone|tel|telephone|mobile)$/i,
      /^(date|time|timestamp|created|updated|modified)$/i,
      /^(price|cost|amount|total|subtotal|tax|fee)$/i,
      /^(quantity|qty|units|count|weight|volume)$/i,
      /^(status|state|condition|type|category)$/i,
    ];

    // Filter out excluded keys
    const validKeys = keys.filter(key => 
      !excludePatterns.some(pattern => pattern.test(key))
    );

    // Find best primary key field
    let primaryKey = keys[0]; // fallback to first column
    let primaryKeyName = keys[0];

    // Look for pattern matches
    for (const pattern of primaryKeyPatterns) {
      const matchingKey = validKeys.find(key => pattern.test(key));
      if (matchingKey && rowData[matchingKey]) {
        primaryKey = matchingKey;
        primaryKeyName = matchingKey;
        break;
      }
    }

    const identifier = String(rowData[primaryKey] ?? 'unknown');
    const currentValue = String((rowData as Record<string, unknown>)[columnProp] ?? '');
    
    // Check if identifier is 'unknown' and show snackbar
    if (identifier.toLowerCase() === 'unknown') {
      toast.warning('No Primary Field Found', {
        description: 'The system could not identify a primary key field in the CSV. Please type your prompt manually for more accurate results.',
        duration: 5000,
      });
    }
    
    const promptText = `${prefix}For line item with ${primaryKeyName} value "${identifier}", change "${columnName}" value from "${currentValue}" to `;
    setChatValue(promptText);
    requestAnimationFrame(() => {
      document.getElementById('chat-composer-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleMarkdownTextSelect = (selectedText: string, closeDialog?: () => void) => {
    // Close dialog if provided (for fullscreen mode)
    if (closeDialog) {
      closeDialog();
    }
    
    // Generate a prompt based on the selected text from markdown
    const promptText = `Look at the position of the text "${selectedText}" in the document. The text in this position should be added to the field: `;
    setChatValue(promptText);
    
    // Delay scroll slightly to allow dialog close animation
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.getElementById('chat-composer-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }, closeDialog ? 150 : 0);
  };

  const handlePromptSubmit = (instruction: string) => {
    if (!instruction.trim()) return;
    // Pass instructionIdentifier only when there are multiple data sets
    sendInstructions(instruction.trim(), currentDataSetIdentifier);
  };

  const handleApprove = async (saveToTemplateValue: boolean) => {
    if (!pendingId) return;

    const saveToTemplateParam = saveToTemplateValue ? 'true' : 'false';

    // Check if this is a tabular upload (CSV/spreadsheet)
    if (isCsv) {
      // For tabular uploads, navigate to the column mapping page first
      router.push(`/flow-ai/column-mapping?pendingId=${encodeURIComponent(pendingId)}&saveToTemplate=${saveToTemplateParam}`);
      return;
    }

    // For PDFs and other document types
    setIsApproving(true);
    toast.info('Processing entities for matching...');
    setPendingEntityNavigation(saveToTemplateParam);
    startEntityProcessing();
  };

  const closeManualEditModal = useCallback(() => {
    setManualEditTarget(null);
    setManualEditValue('');
    setManualEditInitialValue('');
  }, []);

  const handleManualFieldEdit = useCallback(
    (field: ExtractedField, parentField?: string, dataSetIdentifier?: string) => {
      if (!field.sourcePath) {
        toast.error(`Unable to manually edit "${field.key}" because its source path is missing.`);
        return;
      }
      const dataSetIndex = activeDataSetIndex;
      const dataForIndex = extractedDataSets[dataSetIndex] ?? {};
      const stagedValueMap = manualEditsByDataset[dataSetIndex];
      const stagedValue = stagedValueMap ? stagedValueMap[field.sourcePath] : undefined;
      const originalValue = getValueAtPath(dataForIndex, field.sourcePath);
      let initialValue =
        stagedValue === undefined
          ? toEditableString(originalValue)
          : stagedValue === null
            ? ''
            : stagedValue;
      
      // For date fields, format the display value from YYYY-MM-DD to MM-DD-YYYY
      if (isDateField(field.key) && initialValue) {
        initialValue = formatDateDisplay(initialValue);
      }

      setManualEditValue(initialValue);
      setManualEditInitialValue(initialValue);
      setManualEditTarget({
        kind: 'field',
        field,
        parentField,
        dataSetIdentifier,
        dataSetIndex,
        sourcePath: field.sourcePath,
      });
    },
    [activeDataSetIndex, extractedDataSets, manualEditsByDataset]
  );

  const handleFieldUnmap = useCallback(
    (field: ExtractedField, parentField?: string, dataSetIdentifier?: string) => {
      if (!field.sourcePath) {
        toast.error(`Unable to unmap "${field.key}" because its source path is missing.`);
        return;
      }
      updateManualEditValue(activeDataSetIndex, field.sourcePath, 'NA');
      const fieldLabel = parentField ? `${parentField} -> ${field.key}` : field.key;
      const contextLabel = dataSetIdentifier ? ` for ${dataSetIdentifier}` : '';
      toast.success(`"${fieldLabel}" will be set to "NA"${contextLabel}.`);
    },
    [activeDataSetIndex, updateManualEditValue]
  );

  const handleManualEditApply = useCallback(() => {
    if (!manualEditTarget || !manualEditHasChanges) {
      return;
    }
    
    // Convert date values from MM-DD-YYYY back to YYYY-MM-DD for storage
    let valueToStage = manualEditValue;
    const fieldOrColumnName = manualEditTarget.kind === 'field' 
      ? manualEditTarget.field.key 
      : manualEditTarget.columnName;
    
    if (isDateField(fieldOrColumnName)) {
      valueToStage = formatDateForStorage(manualEditValue);
    }
    
    updateManualEditValue(manualEditTarget.dataSetIndex, manualEditTarget.sourcePath, valueToStage);
    const targetLabel =
      manualEditTarget.kind === 'field'
        ? manualEditTarget.parentField
          ? `${manualEditTarget.parentField} -> ${manualEditTarget.field.key}`
          : manualEditTarget.field.key
        : `${manualEditTarget.columnName} (${manualEditTarget.rowIdentifier ?? `Row ${manualEditTarget.rowIndex + 1}`})`;
    const identifierText = manualEditTarget.dataSetIdentifier ? ` for ${manualEditTarget.dataSetIdentifier}` : '';
    toast.success(`Applied manual edit for "${targetLabel}"${identifierText}.`);
    closeManualEditModal();
  }, [manualEditTarget, manualEditValue, manualEditHasChanges, updateManualEditValue, closeManualEditModal]);

  const handleSubmitToSupport = () => {
    setIsSupportModalOpen(true);
  };

  // Extract user info from token
  const getUserInfo = () => {
    const accessToken = getStoredValue('ACCESS_TOKEN');
    if (accessToken) {
      const userInfo = extractUserInfoFromToken(accessToken);
      if (userInfo) {
        return userInfo;
      }
    }
    return { email: 'Unknown', name: 'Unknown User' };
  };

  const userInfo = getUserInfo();

  const callContinueWorkflowAndRedirect = async () => {
    try {
      // Get fileUploadProcessId from localStorage
      const fileUploadProcessId = localStorage.getItem('fileUploadProcessId');
      
      if (!fileUploadProcessId) {
        console.error('❌ No fileUploadProcessId found in localStorage');
        toast.error('Unable to redirect: No process ID found');
        return;
      }

      // Get access token and refresh token from localStorage
      const accessToken = localStorage.getItem('flowrms_access_token');
      const refreshToken = localStorage.getItem('flowrms_refresh_token');
      
      if (!accessToken) {
        console.warn('⚠️ No access token available in localStorage');
        console.warn('⚠️ Skipping continueWorkflow call, redirecting directly to processing page');
        // Redirect directly to processing page without calling continueWorkflow
        const processingBaseUrl = process.env.NEXT_PUBLIC_FLOWRMS_PROCESSING_URL || 'https://staging2.app.flowrms.com/flowbot/processing/';
        const redirectUrl = `${processingBaseUrl}${fileUploadProcessId}`;
        console.log('🔄 Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
        return;
      }

      console.log('🔄 Calling continueWorkflow with fileUploadProcessId:', fileUploadProcessId);

      // Call the API route that handles continueWorkflow
      const response = await fetch('/api/flow-ai/continue-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUploadProcessId,
          accessToken,
          refreshToken,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('❌ continueWorkflow failed:', result.error || result.details);
        console.log('⚠️ Redirecting to processing page anyway...');
        // Still redirect even if continueWorkflow fails
        const processingBaseUrl = process.env.NEXT_PUBLIC_FLOWRMS_PROCESSING_URL || 'https://staging2.app.flowrms.com/flowbot/processing/';
        const redirectUrl = `${processingBaseUrl}${fileUploadProcessId}`;
        console.log('🔄 Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
        return;
      }

      console.log('✅ continueWorkflow succeeded:', result.data);

      // Redirect to the processing page using environment variable
      const processingBaseUrl = process.env.NEXT_PUBLIC_FLOWRMS_PROCESSING_URL || 'https://staging2.app.flowrms.com/flowbot/processing/';
      const redirectUrl = `${processingBaseUrl}${fileUploadProcessId}`;
      console.log('🔄 Redirecting to:', redirectUrl);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('❌ Error in callContinueWorkflowAndRedirect:', error);
      
      // Try to redirect to processing page even on error if we have fileUploadProcessId
      const fileUploadProcessId = localStorage.getItem('fileUploadProcessId');
      if (fileUploadProcessId) {
        console.log('⚠️ Error occurred but redirecting to processing page anyway...');
        const processingBaseUrl = process.env.NEXT_PUBLIC_FLOWRMS_PROCESSING_URL || 'https://staging2.app.flowrms.com/flowbot/processing/';
        const redirectUrl = `${processingBaseUrl}${fileUploadProcessId}`;
        console.log('🔄 Redirecting to:', redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.error('❌ No fileUploadProcessId available');
        toast.error('Unable to redirect: No process ID found');
      }
    }
  };

  const handleDocumentUploaded = (documentId: string, documentType: string, instructions?: string, contextFileIds?: string[]) => {
    console.log('📄 Document uploaded:', documentId, 'Type:', documentType);
    console.log('📝 Instructions:', instructions || 'None');
    console.log('📎 Context files:', contextFileIds?.length || 0);

    // Clear the noDocumentFound flag
    setNoDocumentFound(false);

    // Store document ID and instructions in localStorage for the processing hook
    localStorage.setItem('flowrms_document_id', documentId);

    // Store initial instructions if provided, so they can be used when processing starts
    if (instructions) {
      localStorage.setItem('flowrms_initial_instructions', instructions);
    } else {
      localStorage.removeItem('flowrms_initial_instructions');
    }

    // Store context file IDs if provided
    if (contextFileIds && contextFileIds.length > 0) {
      localStorage.setItem('flowrms_context_files', JSON.stringify(contextFileIds));
    } else {
      localStorage.removeItem('flowrms_context_files');
    }

    // Mark that we should skip the initial instructions prompt since user already provided them
    localStorage.setItem('flowrms_skip_instructions_prompt', 'true');

    // Trigger a page reload to start the review process
    window.location.reload();
  };

  // Show combined upload pane if needed (when in document mode without processing started)
  // This replaces the old separate InitialInstructionsPrompt
  if (needsInitialInstructions) {
    return (
      <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
        <main className="flex-1">
          <CombinedUploadPane
            onDocumentUploaded={(docId, docType, instructions, contextFileIds) => {
              // Start processing directly without page reload
              if (instructions) {
                localStorage.setItem('flowrms_initial_instructions', instructions);
              }
              if (contextFileIds && contextFileIds.length > 0) {
                localStorage.setItem('flowrms_context_files', JSON.stringify(contextFileIds));
              }
              startProcessing(instructions, contextFileIds);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Document info bar */}
      {documentLabel && (
        <div className="border-b bg-card/50 px-4 py-2 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Active document: <span className="font-medium text-foreground">{documentLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {convertedDocumentUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={isCsv ? convertedDocumentUrl : (presignedPdfUrl || convertedDocumentUrl || '#')} target="_blank" rel="noreferrer">
                  Download {isCsv ? 'CSV' : 'PDF'}
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {bannerMessage && (
        <div className="bg-primary/10 border-b border-primary/20 text-primary px-4 py-3 text-sm flex items-center gap-2 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{bannerMessage}</span>
        </div>
      )}

      <main className="flex-1 mx-auto px-2 py-6 w-full max-w-[85vw]">
        {noDocumentFound ? (
          <NoDocumentFoundState onDocumentUploaded={handleDocumentUploaded} />
        ) : !shouldShowWorkspace ? (
          <CoolLoadingState message={loadingMessage || undefined} />
        ) : (
          <div className="space-y-4">
            {/* Conditionally render CSV or PDF layout */}
            {isCsv ? (
              // CSV Layout - Show before/after panes in full width
              <div className="h-[75vh] min-h-[650px] max-h-[800px]">
                <CsvBeforeAfterPane 
                  originalCsvData={originalCsvData}
                  processedCsvData={processedCsvData}
                  fileName={documentLabel ?? undefined}
                  onSelectionChange={(selection, closeDialog) =>
                    handleLineItemSelectionChange(selection, closeDialog, undefined, activeDataSetIndex, 'csv')
                  }
                />
              </div>
            ) : (
              // PDF Layout - Show PDF and extracted fields side by side
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-3 h-[75vh] min-h-[650px] max-h-[800px]">
                <div className="h-full overflow-hidden">
                  <PdfPreviewPane 
                    fileUrl={presignedPdfUrl || convertedDocumentUrl || undefined} 
                    fileName={documentLabel ?? undefined}
                    pages={pages}
                    onMarkdownTextSelect={handleMarkdownTextSelect}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <FieldsExtractedPane
                    fields={mappedFields}
                    lineItems={displayLineItems}
                    onFieldClick={handleFieldClick}
                    onManualFieldEdit={handleManualFieldEdit}
                    onFieldUnmap={handleFieldUnmap}
                    onLineItemCellClick={handleLineItemCellClick}
                    onLineItemSelectionChange={handleLineItemSelectionChange}
                    dataSetIdentifier={currentDataSetIdentifierWithLabel}
                    dataSets={dataSets}
                    activeDataSetIndex={activeDataSetIndex}
                    onDataSetChange={setActiveDataSet}
                    stagedFieldPaths={stagedFieldPaths}
                    disableInteractions={!pendingId || isHydrating || isInstructionRunning}
                    entityType={entityType}
                  />
                </div>
              </div>
            )}

            {/* Required Fields Gate for Quotes and Orders (PDF only) - shown above tabs */}
            {!isCsv && requiresFieldValidation && (
              <RequiredFieldsGate
                entityType={entityType}
                soldToCustomerName={soldToCustomerName}
                onSoldToCustomerChange={handleSoldToCustomerChange}
                lineItems={lineItemsForEndUserAssignment}
                onEndUserNamesChange={handleEndUserNamesChange}
                onSearchCustomers={handleSearchCustomers}
                onSearchEndUsers={handleSearchEndUsers}
              />
            )}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <LayoutToggle activeLayout={activeLayout} onChange={setActiveLayout} />
              <Button
                variant="outline"
                className="justify-center lg:w-auto"
                disabled={
                  !pendingId || isHydrating || isInstructionRunning || isApplyingTemplate
                }
                onClick={() => setIsSelectTemplateOpen(true)}
              >
                {isApplyingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Applying Template...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Select Template
                  </>
                )}
              </Button>
            </div>

            <div>
              {activeLayout === 'preview' ? (
                <div className="space-y-4">
                  <div id="chat-composer-container">
                    <ChatPromptComposer
                      onSubmit={handlePromptSubmit}
                      value={chatValue}
                      onChange={setChatValue}
                      isLoading={isInstructionRunning}
                      quickPrompts={dummyQuickPrompts}
                      statusMessage={isInstructionRunning ? loadingAction : null}
                    />
                  </div>

                  {/* ActionPanel - always show, disable when required fields not valid */}
                  <ActionPanel
                    onApprove={handleApprove}
                    onSubmitToSupport={handleSubmitToSupport}
                    onSaveTemplate={() => {}}
                    onGoToQueue={() => {}}
                    isApproveDisabled={!pendingId || isHydrating || isInstructionRunning || !allRequiredFieldsValid}
                    isApproveLoading={isApproving}
                    hideTemplateButton={true}
                    hideQueueButton={true}
                    saveToTemplate={saveToTemplate}
                    onSaveToTemplateChange={setSaveToTemplate}
                    isCsv={isCsv}
                  />
                </div>
              ) : activeLayout === 'instructions' ? (
                <div className="space-y-4">
                  <div className="min-h-[200px]">
                    <InstructionsPane instructions={suggestedPrompts} />
                  </div>
                  <ActionPanel
                    onApprove={handleApprove}
                    onSubmitToSupport={handleSubmitToSupport}
                    onSaveTemplate={() => {}}
                    onGoToQueue={() => {}}
                    isApproveDisabled={!pendingId || isHydrating || isInstructionRunning || !allRequiredFieldsValid}
                    isApproveLoading={isApproving}
                    hideTemplateButton={true}
                    hideQueueButton={true}
                    saveToTemplate={saveToTemplate}
                    onSaveToTemplateChange={setSaveToTemplate}
                    isCsv={isCsv}
                  />
                </div>
              ) : activeLayout === 'versioning' ? (
                <div className="space-y-4">
                  <div className="min-h-[200px]">
                    <VersionHistoryTab
                      items={versionHistory}
                      loading={loadingHistory}
                      error={historyError}
                      onRefresh={refreshHistory}
                      onSelect={handleVersionSelect}
                      currentVersionNumber={currentVersionNumber}
                      onUndoCurrent={handleUndoCurrentVersion}
                      canUndoCurrent={Boolean(currentVersionNumber && currentVersionNumber > 1)}
                      isUndoing={isRollbacking}
                    />
                  </div>
                  <ActionPanel
                    onApprove={handleApprove}
                    onSubmitToSupport={handleSubmitToSupport}
                    onSaveTemplate={() => {}}
                    onGoToQueue={() => {}}
                    isApproveDisabled={!pendingId || isHydrating || isInstructionRunning || !allRequiredFieldsValid}
                    isApproveLoading={isApproving}
                    hideTemplateButton={true}
                    hideQueueButton={true}
                    saveToTemplate={saveToTemplate}
                    onSaveToTemplateChange={setSaveToTemplate}
                    isCsv={isCsv}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="min-h-[200px]">
                    <ChangesFeed items={corrections} />
                  </div>
                  <ActionPanel
                    onApprove={handleApprove}
                    onSubmitToSupport={handleSubmitToSupport}
                    onSaveTemplate={() => {}}
                    onGoToQueue={() => {}}
                    isApproveDisabled={!pendingId || isHydrating || isInstructionRunning || !allRequiredFieldsValid}
                    isApproveLoading={isApproving}
                    hideTemplateButton={true}
                    hideQueueButton={true}
                    saveToTemplate={saveToTemplate}
                    onSaveToTemplateChange={setSaveToTemplate}
                    isCsv={isCsv}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <SelectTemplateModal
        open={isSelectTemplateOpen}
        onOpenChange={setIsSelectTemplateOpen}
        onApplyTemplate={handleApplyTemplate}
        isApplyingTemplate={isApplyingTemplate}
      />

      <SupportSubmissionModal
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
        userEmail={userInfo.email}
        userName={userInfo.name}
        pendingId={pendingId || undefined}
        documentName={documentLabel || undefined}
        isCsv={isCsv}
        pdfUrl={presignedPdfUrl || convertedDocumentUrl || undefined}
        originalCsvData={originalCsvData}
        processedCsvData={processedCsvData}
      />
      
      <Dialog
        open={manualEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeManualEditModal();
          }
        }}
      >
        <DialogContent className="space-y-4">
          <DialogHeader>
            <DialogTitle>{manualEditTitle}</DialogTitle>
            <DialogDescription>
              Changes are saved automatically once you apply them.
            </DialogDescription>
          </DialogHeader>
          
          {/* Template Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-800">Manual edits are not saved as templates</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Manual edits apply only to this document. Use AI chat instructions to create reusable templates.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {manualEditTarget?.dataSetIdentifier && (
              <p className="text-xs text-muted-foreground">
                Data set: <span className="font-medium text-foreground">{manualEditTarget.dataSetIdentifier}</span>
              </p>
            )}
            {manualEditRowLabel && (
              <p className="text-xs text-muted-foreground">
                Line item: <span className="font-medium text-foreground">{manualEditRowLabel}</span>
              </p>
            )}
            <p className="text-xs font-mono text-muted-foreground break-all bg-muted/60 px-2 py-1 rounded">
              Path: {manualEditPath}
            </p>
            {isEditingDateField ? (
              <div className="space-y-2">
                <Input
                  type="date"
                  value={toDateInputValue(manualEditValue)}
                  onChange={(e) => {
                    // Convert from date input format (YYYY-MM-DD) to display format (MM-DD-YYYY)
                    if (e.target.value) {
                      const [year, month, day] = e.target.value.split('-');
                      setManualEditValue(`${month}-${day}-${year}`);
                    } else {
                      setManualEditValue('');
                    }
                  }}
                  className="w-full"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Select a date using the date picker. The date will be displayed as MM-DD-YYYY.
                </p>
              </div>
            ) : (
              <>
                <Textarea
                  value={manualEditValue}
                  onChange={(e) => setManualEditValue(e.target.value)}
                  rows={5}
                  placeholder="Enter the corrected value"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Leave the field blank to keep it empty. Use the <span className="font-semibold">Unmap</span> option to set the value to
                  &quot;NA&quot; explicitly.
                </p>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeManualEditModal}>
              Cancel
            </Button>
            <Button onClick={handleManualEditApply} disabled={!manualEditHasChanges}>
              Apply Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VersionComparisonModal
        open={isVersionModalOpen}
        onOpenChange={handleModalOpenChange}
        current={currentPreviewData}
        selectedVersionNumber={selectedVersionNumber}
        selectedVersion={selectedVersionSnapshot}
        loadingSnapshot={loadingSnapshot}
        snapshotError={snapshotError}
        onRetrySnapshot={handleRetrySnapshot}
        onRollback={handleRollback}
        isRollbacking={isRollbacking}
        PdfPreviewComponent={PdfPreviewPane}
        CsvPreviewComponent={CsvBeforeAfterPane}
      />

      {/* Loading Overlay for Entity Processing (Matching button) */}
      {isEntityProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="border-2 shadow-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">{formatActionMessage(entityProgress?.action)}</p>
                  <p className="text-sm text-muted-foreground">You&apos;ll be redirected to matching shortly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function FlowRMSPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <FlowRMSPageContent />
    </Suspense>
  );
}

function toEditableString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : String(value);
}

function getValueAtPath(data: Record<string, unknown> | undefined, path: string): unknown {
  if (!data || !path) return undefined;
  return path.split('.').reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined) {
      return undefined;
    }
    if (typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[segment];
  }, data);
}

function normalizeOriginalValue(value: unknown): string {
  if (value === null || value === undefined) {
    return MANUAL_EDIT_NULL_TOKEN;
  }
  return String(value);
}

function normalizeManualValue(value: ManualEditValue): string {
  if (value === null) {
    return MANUAL_EDIT_NULL_TOKEN;
  }
  return value;
}

function valuesMatch(original: unknown, manualValue: ManualEditValue): boolean {
  return normalizeOriginalValue(original) === normalizeManualValue(manualValue);
}

// Format action message to show only the part after the last fullstop
// e.g., "Processed entity type 3. Processed 9 of 12 pending entities." => "Processed 9 of 12 pending entities."
function formatActionMessage(action: string | undefined | null): string {
  if (!action) return 'Processing entities...';

  // Split by ". " and get the last meaningful part
  const parts = action.split('. ').filter(part => part.trim().length > 0);
  if (parts.length > 1) {
    // Return the last part, ensuring it ends with a period if it doesn't
    const lastPart = parts[parts.length - 1];
    return lastPart.endsWith('.') ? lastPart : lastPart;
  }

  return action;
}
function buildManualEditPayload(
  dataSets: Extracted[],
  edits: ManualEditsByDataset
): ManualEditPayload | null {
  if (Object.keys(edits).length === 0) {
    return null;
  }
  const updated = dataSets.map((dataset, index) => applyManualEditsToDataset(dataset, edits[index]));
  return { data: updated };
}

function applyManualEditsToDataset(dataset: Extracted, edits?: ManualEditsMap): Extracted {
  if (!edits || Object.keys(edits).length === 0) {
    return dataset;
  }
  const clone = cloneExtracted(dataset);
  Object.entries(edits).forEach(([path, manualValue]) => {
    const originalValue = getValueAtPath(dataset, path);
    const castValue = castManualValue(originalValue, manualValue);
    setValueAtPathMutable(clone as Record<string, unknown>, path, castValue);
  });
  return clone;
}

function applyManualEditsToDataSets(dataSets: Extracted[], edits: ManualEditsByDataset): Extracted[] {
  if (!Object.keys(edits).length) {
    return dataSets;
  }

  let nextDataSets = dataSets;
  let changed = false;

  Object.entries(edits).forEach(([indexKey, map]) => {
    if (!map || Object.keys(map).length === 0) {
      return;
    }
    const dataSetIndex = Number(indexKey);
    if (Number.isNaN(dataSetIndex) || !nextDataSets[dataSetIndex]) {
      return;
    }
    if (!changed) {
      nextDataSets = [...nextDataSets];
      changed = true;
    }
    nextDataSets[dataSetIndex] = applyManualEditsToDataset(nextDataSets[dataSetIndex], map);
  });

  return nextDataSets;
}

function cloneExtracted<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setValueAtPathMutable(target: Record<string, unknown>, path: string, value: unknown) {
  if (!path) return;
  const segments = path.split('.');
  let cursor: Record<string, unknown> | unknown[] = target;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    const keyIsIndex = isNumericSegment(segment);

    if (isLast) {
      if (Array.isArray(cursor) && keyIsIndex) {
        const arrayCursor = cursor as unknown[];
        arrayCursor[Number(segment)] = value;
      } else if (cursor && typeof cursor === 'object') {
        (cursor as Record<string, unknown>)[segment] = value;
      }
      return;
    }

    const nextSegment = segments[i + 1];
    const nextIsIndex = isNumericSegment(nextSegment);

    if (Array.isArray(cursor)) {
      const arrayCursor = cursor as unknown[];
      const index = keyIsIndex ? Number(segment) : NaN;
      if (Number.isNaN(index)) {
        // Treat as object-style access on array (unlikely but safe)
        const arrayObjectCursor = arrayCursor as unknown as Record<string, unknown>;
        const existingValue = arrayObjectCursor[segment];
        if (
          existingValue === null ||
          existingValue === undefined ||
          typeof existingValue !== 'object' ||
          (Array.isArray(existingValue) && !nextIsIndex)
        ) {
          arrayObjectCursor[segment] = nextIsIndex ? [] : {};
        }
        cursor = arrayObjectCursor[segment] as Record<string, unknown> | unknown[];
      } else {
        if (
          arrayCursor[index] === null ||
          arrayCursor[index] === undefined ||
          typeof arrayCursor[index] !== 'object'
        ) {
          arrayCursor[index] = nextIsIndex ? [] : {};
        }
        cursor = arrayCursor[index] as Record<string, unknown> | unknown[];
      }
      continue;
    }

    if (
      cursor === null ||
      cursor === undefined ||
      typeof cursor !== 'object'
    ) {
      return;
    }

    const objectCursor = cursor as Record<string, unknown>;

    const nextValue = objectCursor[segment];
    if (
      nextValue === null ||
      nextValue === undefined ||
      typeof nextValue !== 'object' ||
      (Array.isArray(nextValue) && !nextIsIndex)
    ) {
      objectCursor[segment] = nextIsIndex ? [] : {};
    }

    cursor = objectCursor[segment] as Record<string, unknown> | unknown[];
  }
}

function isNumericSegment(segment: string | undefined): boolean {
  if (!segment) return false;
  return Number.isInteger(Number(segment));
}

function castManualValue(original: unknown, manualValue: ManualEditValue): unknown {
  if (manualValue === null) {
    return null;
  }
  if (typeof original === 'number') {
    const numeric = Number(manualValue);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  if (typeof original === 'boolean' && typeof manualValue === 'string') {
    const lowered = manualValue.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(lowered)) return true;
    if (['false', '0', 'no'].includes(lowered)) return false;
  }
  return manualValue;
}

function pruneSavedEdits(current: ManualEditsByDataset, saved: ManualEditsByDataset): ManualEditsByDataset {
  let changed = false;
  const next: ManualEditsByDataset = {};

  Object.entries(current).forEach(([indexKey, edits]) => {
    const datasetIndex = Number(indexKey);
    const savedEdits = saved[datasetIndex];
    if (!savedEdits) {
      next[datasetIndex] = edits;
      return;
    }

    const remainingEntries = Object.entries(edits).filter(([path, value]) => {
      const savedValue = savedEdits[path];
      return !(savedValue !== undefined && savedValue === value);
    });

    if (remainingEntries.length === Object.keys(edits).length) {
      next[datasetIndex] = edits;
      return;
    }

    changed = true;
    if (remainingEntries.length > 0) {
      next[datasetIndex] = Object.fromEntries(remainingEntries);
    }
  });

  return changed ? next : current;
}

type LineItemRowData = Record<string, unknown> & {
  [LINE_ITEM_SOURCE_MAP_KEY]?: Record<string, string>;
};

function getLineItemSourceMap(rowData: Record<string, unknown> | undefined): Record<string, string> | null {
  if (!rowData) return null;
  const meta = (rowData as LineItemRowData)[LINE_ITEM_SOURCE_MAP_KEY];
  if (!meta || typeof meta !== 'object') {
    return null;
  }
  return meta as Record<string, string>;
}

function getLineItemSourcePath(rowData: Record<string, unknown>, columnKey: string): string | null {
  const sourceMap = getLineItemSourceMap(rowData);
  if (!sourceMap) {
    return null;
  }
  const sourcePath = sourceMap[columnKey];
  return typeof sourcePath === 'string' ? sourcePath : null;
}

function collectLineItemTargets(selection: SelectionData) {
  const targets: Array<{ sourcePath: string; columnName: string; columnKey: string }> = [];

  switch (selection.type) {
    case 'cell': {
      const { rowData, columnKey, columnName } = selection.data;
      if (rowData && columnKey && columnName) {
        const sourcePath = getLineItemSourcePath(rowData, columnKey);
        if (sourcePath) {
          targets.push({ sourcePath, columnName, columnKey });
        }
      }
      break;
    }
    case 'column': {
      (selection.data.cells ?? []).forEach((cell) => {
        const sourcePath = getLineItemSourcePath(cell.rowData, cell.columnKey);
        if (sourcePath) {
          targets.push({ sourcePath, columnName: cell.columnName, columnKey: cell.columnKey });
        }
      });
      break;
    }
    case 'row': {
      (selection.data.rows ?? []).forEach((row) => {
        const sourceMap = getLineItemSourceMap(row.data);
        if (!sourceMap) {
          return;
        }
        Object.entries(sourceMap).forEach(([columnKey, sourcePath]) => {
          targets.push({ sourcePath, columnName: columnKey, columnKey });
        });
      });
      break;
    }
    case 'range': {
      (selection.data.cells ?? []).forEach((cell) => {
        const sourcePath = getLineItemSourcePath(cell.rowData, cell.columnKey);
        if (sourcePath) {
          targets.push({ sourcePath, columnName: cell.columnName, columnKey: cell.columnKey });
        }
      });
      break;
    }
    default:
      break;
  }

  return targets;
}

function getLineItemRowIdentifier(rowData: Record<string, unknown>): string | undefined {
  const flowIndex = (rowData as Record<string, unknown>)['flow_index'];
  if (flowIndex !== undefined && flowIndex !== null) {
    return `flow_index ${flowIndex}`;
  }
  const keys = Object.keys(rowData).filter((key) => !key.startsWith('_'));
  if (!keys.length) {
    return undefined;
  }
  const referenceKey = keys[0];
  const value = rowData[referenceKey];
  if (value === null || value === undefined || value === '') {
    return referenceKey;
  }
  return `${referenceKey}: ${value}`;
}

function applyLineItemOverrides(rows: Record<string, unknown>[], manualEdits: ManualEditsMap) {
  if (!rows.length || Object.keys(manualEdits).length === 0) {
    return rows;
  }

  return rows.map((row) => {
    const sourceMap = getLineItemSourceMap(row);
    if (!sourceMap) {
      return row;
    }
    let mutated = false;
    const nextRow: Record<string, unknown> = { ...row };

    Object.entries(sourceMap).forEach(([columnKey, sourcePath]) => {
      if (Object.prototype.hasOwnProperty.call(manualEdits, sourcePath)) {
        const manualValue = manualEdits[sourcePath];
        nextRow[columnKey] = manualValue === null ? null : manualValue;
        mutated = true;
      }
    });

    if (mutated) {
      nextRow[LINE_ITEM_SOURCE_MAP_KEY] = sourceMap;
      return nextRow;
    }

    return row;
  });
}









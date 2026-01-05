'use client';

import { useState, Suspense, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Building2,
  Factory,
  Package,
  Users,
  AlertCircle,
  Sparkles,
  Info,
  FileText,
  X,
  Mail,
  Check,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Label } from '@/components/flow-ai/ui/label';
import { Input } from '@/components/flow-ai/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import { WorkflowBreadcrumb } from '@/components/flow-ai/flowrms/WorkflowBreadcrumb';
import { SearchableMatchDropdown, SearchResult } from '@/components/flow-ai/flowrms/entity-matching/SearchableMatchDropdown';
import { UserSearchDropdown, UserResult } from '@/components/flow-ai/flowrms/entity-matching/UserSearchDropdown';
import { EntitySearchDropdown, EntitySearchResult } from '@/components/flow-ai/flowrms/EntitySearchDropdown';
import { PdfPreviewPane } from '@/components/flow-ai/flowrms/PdfPreviewPane';
import { CsvPreviewPane } from '@/components/flow-ai/flowrms/CsvPreviewPane';
import {
  useEntityResolution,
  PausedEntityType,
  ResolvingEntity,
} from '@/components/flow-ai/hooks/useEntityResolution';
import { flowrmsApolloClient, flowrmsApiApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Q_GET_PENDING, M_SEND_FUP_STATUS_EMAIL, Q_SEARCH_EXISTING_ENTITIES } from '@/lib/flow-ai/gql';

export default function EntityResolutionPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading entity resolution..." />}>
      <EntityResolutionContent />
    </Suspense>
  );
}

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
  // { title: "Integration Ready", fact: "Seamlessly connect FlowAI with your existing ERP and accounting systems through our API." },
  { title: "Data Validation", fact: "Built-in validation rules catch errors before they reach your system, ensuring data quality." },
  // { title: "Quick Actions", fact: "Use keyboard shortcuts and quick actions to speed up your document review workflow." },
];

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

function EntityResolutionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingId = searchParams.get('pendingId');
  const fileUploadProcessId = searchParams.get('fileUploadProcessId');
  const source = searchParams.get('source');
  const isFromSpreadsheet = source === 'spreadsheet';

  // View details modal state
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = useState(false);
  const [selectedEntityForDetails, setSelectedEntityForDetails] = useState<ResolvingEntity | null>(null);

  // FlowAI facts state for loading screen
  const [currentFactIndex, setCurrentFactIndex] = useState(() => Math.floor(Math.random() * FLOWAI_FACTS.length));
  const [isFactVisible, setIsFactVisible] = useState(true);

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

  const currentFact = useMemo(() => FLOWAI_FACTS[currentFactIndex] || FLOWAI_FACTS[0], [currentFactIndex]);

  // View Document pane state
  const [showDocumentPane, setShowDocumentPane] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [csvData, setCsvData] = useState<unknown[][] | null>(null);

  // Email reminder state - persisted in sessionStorage per fileUploadProcessId
  // so it persists across multiple processing steps but resets for new documents
  const emailReminderStorageKey = fileUploadProcessId ? `emailReminderSent_${fileUploadProcessId}` : null;

  const [emailReminderSent, setEmailReminderSentState] = useState(() => {
    if (typeof window !== 'undefined' && emailReminderStorageKey) {
      return sessionStorage.getItem(emailReminderStorageKey) === 'true';
    }
    return false;
  });
  const [emailReminderLoading, setEmailReminderLoading] = useState(false);
  const [emailReminderError, setEmailReminderError] = useState<string | null>(null);

  // Wrapper to also persist to sessionStorage
  const setEmailReminderSent = useCallback((value: boolean) => {
    setEmailReminderSentState(value);
    if (typeof window !== 'undefined' && emailReminderStorageKey) {
      if (value) {
        sessionStorage.setItem(emailReminderStorageKey, 'true');
      } else {
        sessionStorage.removeItem(emailReminderStorageKey);
      }
    }
  }, [emailReminderStorageKey]);

  // Check sessionStorage when fileUploadProcessId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && emailReminderStorageKey) {
      const stored = sessionStorage.getItem(emailReminderStorageKey) === 'true';
      setEmailReminderSentState(stored);
    }
  }, [emailReminderStorageKey]);

  // Handler to send email reminder
  const handleSendEmailReminder = useCallback(async () => {
    if (!fileUploadProcessId || emailReminderSent || emailReminderLoading) return;

    setEmailReminderLoading(true);
    setEmailReminderError(null);

    try {
      const result = await flowrmsApiApolloClient.mutate<{
        sendFupWithStatusEmail: { status: string; message?: string };
      }>({
        mutation: M_SEND_FUP_STATUS_EMAIL,
        variables: { fileUploadProcessId },
      });

      const status = result.data?.sendFupWithStatusEmail?.status;
      // IN_PROGRESS means the email task was queued successfully
      // SUCCESS means it completed immediately
      if (status === 'SUCCESS' || status === 'IN_PROGRESS') {
        setEmailReminderSent(true);
      } else {
        setEmailReminderError(result.data?.sendFupWithStatusEmail?.message || 'Failed to send email reminder');
      }
    } catch (error) {
      console.error('Error sending email reminder:', error);
      setEmailReminderError('Failed to send email reminder. Please try again.');
    } finally {
      setEmailReminderLoading(false);
    }
  }, [fileUploadProcessId, emailReminderSent, emailReminderLoading, setEmailReminderSent]);

  // Ensure URL params are preserved - restore them if they get stripped
  useEffect(() => {
    if (typeof window !== 'undefined' && pendingId && fileUploadProcessId) {
      const currentUrl = new URL(window.location.href);
      const currentPendingId = currentUrl.searchParams.get('pendingId');
      const currentFileUploadProcessId = currentUrl.searchParams.get('fileUploadProcessId');

      // If params are missing from URL but we have them, restore them
      if (!currentPendingId || !currentFileUploadProcessId) {
        const newUrl = new URL(window.location.pathname, window.location.origin);
        newUrl.searchParams.set('pendingId', pendingId);
        newUrl.searchParams.set('fileUploadProcessId', fileUploadProcessId);
        if (source) {
          newUrl.searchParams.set('source', source);
        }
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [pendingId, fileUploadProcessId, source]);

  const {
    resolvingEntities,
    processStatus,
    isLoading,
    isSubmitting,
    subscriptionActive,
    error,
    allResolved,
    selectedCount,
    selectableCount,
    getEntityTypeLabel,
    buildAddressFromExtra,
    handleSearchEntities,
    handleSearchUsers,
    handleSelectEntity,
    handleToggleCreateNew,
    handleUpdateNewEntityName,
    handleUpdateRep,
    handleUpdateFactory,
    handleSubmit,
    handleToggleSelection,
    handleSelectAll,
    handleAutoSelectBestMatches,
  } = useEntityResolution({
    fileUploadProcessId,
    pendingId,
    source,
  });

  // Get icon for entity type
  const getEntityTypeIcon = (type: PausedEntityType) => {
    switch (type) {
      case 'FACTORY':
        return <Factory className="w-4 h-4" />;
      case 'SOLD_TO_CUSTOMER':
      case 'BILL_TO_CUSTOMER':
        return <Building2 className="w-4 h-4" />;
      case 'END_USER':
        return <Users className="w-4 h-4" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  // Get badge color for entity type
  const getEntityTypeBadgeColor = (type: PausedEntityType) => {
    switch (type) {
      case 'FACTORY':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SOLD_TO_CUSTOMER':
      case 'BILL_TO_CUSTOMER':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'END_USER':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'PRODUCT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Search callback for entity dropdown
  const searchEntitiesCallback = useCallback(
    async (query: string, entityType: PausedEntityType): Promise<SearchResult[]> => {
      const results = await handleSearchEntities(query, entityType);
      return results.map((r) => ({
        entityId: r.entityId,
        name: r.name,
        similarityScore: r.similarityScore,
        metadata: r.metadata,
      }));
    },
    [handleSearchEntities]
  );

  // Search callbacks for user dropdowns
  const searchInsideReps = useCallback(
    async (query: string): Promise<UserResult[]> => {
      return handleSearchUsers(query, 'inside', 10);
    },
    [handleSearchUsers]
  );

  const searchOutsideReps = useCallback(
    async (query: string): Promise<UserResult[]> => {
      return handleSearchUsers(query, 'outside', 10);
    },
    [handleSearchUsers]
  );

  // Search callback for factories (used when creating new Products)
  const searchFactories = useCallback(
    async (query: string, limit?: number): Promise<EntitySearchResult[]> => {
      const result = await flowrmsApolloClient.query<{
        searchExistingEntities: Array<{
          entityId: string;
          name: string;
          similarityScore: number | string;
          metadata: string | null;
        }>;
      }>({
        query: Q_SEARCH_EXISTING_ENTITIES,
        variables: {
          input: {
            entityType: 'FACTORIES',
            query,
            limit: limit || 10,
          },
        },
        fetchPolicy: 'network-only',
      });
      return (result.data?.searchExistingEntities || []).map((r) => ({
        entityId: r.entityId,
        name: r.name,
        similarityScore: r.similarityScore,
        metadata: r.metadata,
      }));
    },
    []
  );

  // Get rep/factory requirements for a given entity type
  // - Customers/End Users (SOLD_TO_CUSTOMER, BILL_TO_CUSTOMER, END_USER): outsideRepId required, insideRepId optional
  // - Factories (FACTORY): insideRepId required only
  // - Products (PRODUCT): factoryId required
  const getRepRequirements = (type: PausedEntityType): { needsOutsideRep: boolean; needsInsideRep: boolean; insideRepRequired: boolean; outsideRepRequired: boolean; needsFactory: boolean; factoryRequired: boolean } => {
    if (type === 'SOLD_TO_CUSTOMER' || type === 'BILL_TO_CUSTOMER' || type === 'END_USER') {
      return { needsOutsideRep: true, needsInsideRep: true, insideRepRequired: false, outsideRepRequired: true, needsFactory: false, factoryRequired: false };
    }
    if (type === 'FACTORY') {
      return { needsOutsideRep: false, needsInsideRep: true, insideRepRequired: true, outsideRepRequired: false, needsFactory: false, factoryRequired: false };
    }
    if (type === 'PRODUCT') {
      return { needsOutsideRep: false, needsInsideRep: false, insideRepRequired: false, outsideRepRequired: false, needsFactory: true, factoryRequired: true };
    }
    // Others: no reps, no factory
    return { needsOutsideRep: false, needsInsideRep: false, insideRepRequired: false, outsideRepRequired: false, needsFactory: false, factoryRequired: false };
  };

  // Handle back navigation
  const handleBack = () => {
    router.push(`/flow-ai/entity-matching?pendingId=${pendingId}`);
  };

  // Open view details modal
  const openViewDetailsModal = (entity: ResolvingEntity) => {
    setSelectedEntityForDetails(entity);
    setViewDetailsModalOpen(true);
  };

  // Fetch document URL for viewing
  const handleViewDocument = useCallback(async () => {
    if (!pendingId) return;

    // If we already have the data, just show the pane
    if (isFromSpreadsheet && csvData) {
      setShowDocumentPane(true);
      return;
    }
    if (!isFromSpreadsheet && documentUrl) {
      setShowDocumentPane(true);
      return;
    }

    setIsLoadingDocument(true);
    try {
      const result = await flowrmsApolloClient.query<{
        getPendingDocument?: {
          originalPresignedUrl?: string;
          convertedDocumentUrl?: string;
          entityType?: string;
        };
      }>({
        query: Q_GET_PENDING,
        variables: { pendingId },
        fetchPolicy: 'cache-first',
      });

      const doc = result.data?.getPendingDocument;
      // Use original presigned URL for spreadsheets, converted URL for PDFs
      const url = isFromSpreadsheet
        ? doc?.originalPresignedUrl
        : (doc?.convertedDocumentUrl || doc?.originalPresignedUrl);

      if (url) {
        setDocumentUrl(url);
        // Extract filename from URL
        try {
          const urlObj = new URL(url);
          const pathSegments = urlObj.pathname.split('/');
          const filename = pathSegments[pathSegments.length - 1];
          setDocumentFileName(decodeURIComponent(filename));
        } catch {
          setDocumentFileName('Document');
        }

        // For spreadsheets, fetch the CSV data
        if (isFromSpreadsheet) {
          try {
            const response = await fetch('/api/csv-fetch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ csvUrl: url }),
            });

            if (response.ok) {
              const data = await response.json();
              setCsvData(data.csvData);
            }
          } catch (csvError) {
            console.error('Error fetching CSV data:', csvError);
          }
        }

        setShowDocumentPane(true);
      }
    } catch (error) {
      console.error('Error fetching document URL:', error);
    } finally {
      setIsLoadingDocument(false);
    }
  }, [pendingId, documentUrl, csvData, isFromSpreadsheet]);

  // Show loading screen while waiting for subscription data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
          <WorkflowBreadcrumb currentStep="resolve" showMapColumns={isFromSpreadsheet} />

          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Processing Document</h2>
              <p className="text-muted-foreground">
                {processStatus?.status === 'PROCESSING'
                  ? 'Your document is being processed. Please wait...'
                  : 'Connecting to processing service...'}
              </p>
              {subscriptionActive && (
                <Badge variant="outline" className="mt-4">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Connected
                </Badge>
              )}
            </div>

            {/* Email Reminder Button */}
            <div className="flex flex-col items-center gap-3 mt-2">
              {emailReminderSent ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">You&apos;ll be notified via email when processing is complete</span>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleSendEmailReminder}
                    disabled={emailReminderLoading}
                    className="gap-2"
                  >
                    {emailReminderLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    {emailReminderLoading ? 'Sending...' : 'Remind me via email when done'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Get notified when processing completes - you can safely leave this page
                  </p>
                </>
              )}
              {emailReminderError && (
                <p className="text-sm text-red-600">{emailReminderError}</p>
              )}

              {/* Back to Queue Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/flow-ai/queue')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Queue
              </Button>
            </div>

            {/* FlowAI Facts Section */}
            <div className={`max-w-lg w-full mt-4 p-6 bg-primary/5 border border-primary/20 rounded-xl transition-opacity duration-300 ${isFactVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Did you know?</span>
              </div>
              <p className="text-sm font-medium text-foreground mb-2 text-center">{currentFact.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed text-center">{currentFact.fact}</p>
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
      </div>
    );
  }

  // Show error if there's a problem
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
          <WorkflowBreadcrumb currentStep="resolve" showMapColumns={isFromSpreadsheet} />

          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matching
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No entities to resolve - shouldn't normally happen as the hook navigates away
  if (resolvingEntities.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
          <WorkflowBreadcrumb currentStep="resolve" showMapColumns={isFromSpreadsheet} />

          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">All Done!</h2>
              <p className="text-muted-foreground">No entities need resolution.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render entity resolution card
  const renderEntityCard = (entity: ResolvingEntity, index: number) => {
    const address = buildAddressFromExtra(entity.extra);
    const suggestions = entity.suggestions || [];
    const repReqs = getRepRequirements(entity.entityType);
    const needsRep = repReqs.needsOutsideRep || repReqs.needsInsideRep;

    // Convert suggestions to SearchResult format for initial candidates
    const initialCandidates: SearchResult[] = suggestions.map((s) => ({
      entityId: s.id,
      name: s.title,
      similarityScore: s.confidenceScore,
      metadata: null,
    }));

    // Check if entity can be selected (has suggestions and not already resolved)
    const canBeSelected = suggestions.length > 0 && !entity.isCreatingNew && !entity.selectedEntityId;

    // Use uniqueId as the key (already guaranteed to be unique)
    return (
      <Card key={entity.uniqueId} className={`overflow-visible transition-all ${entity.isSelected ? 'ring-2 ring-primary/50 border-primary' : ''}`}>
        <CardHeader className="pb-3 bg-slate-50 border-b rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Selection checkbox - only show if entity has suggestions and not resolved */}
              {canBeSelected && (
                <Checkbox
                  checked={entity.isSelected}
                  onCheckedChange={() => handleToggleSelection(entity.uniqueId)}
                  className="mr-1"
                />
              )}
              <div className={`p-2 rounded-lg ${getEntityTypeBadgeColor(entity.entityType)}`}>
                {getEntityTypeIcon(entity.entityType)}
              </div>
              <div>
                <CardTitle className="text-base">
                  Entity #{index + 1}: {getEntityTypeLabel(entity.entityType)}
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {entity.originalSearchTerm || 'Unknown entity'}
                </CardDescription>
                {/* View Details button - only show if extra data exists */}
                {entity.extra && Object.keys(entity.extra).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs mt-1"
                    onClick={() => openViewDetailsModal(entity)}
                  >
                    <Info className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getEntityTypeBadgeColor(entity.entityType)}>
                {getEntityTypeLabel(entity.entityType)}
              </Badge>
              {entity.isResolved && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolved
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Display extra data if available */}
          {entity.extra && Object.keys(entity.extra).length > 0 && (
            <div className="text-sm bg-slate-50 p-3 rounded-md space-y-1">
              {/* Address if available */}
              {address && (
                <div className="text-muted-foreground">
                  <span className="font-medium text-slate-700">Address: </span>
                  {address}
                </div>
              )}
              {/* Row numbers if available */}
              {entity.extra.row_numbers && Array.isArray(entity.extra.row_numbers) && entity.extra.row_numbers.length > 0 && (
                <div className="text-muted-foreground">
                  <span className="font-medium text-slate-700">Row Numbers: </span>
                  {entity.extra.row_numbers.join(', ')}
                </div>
              )}
              {/* Display any other extra fields dynamically */}
              {Object.entries(entity.extra).map(([key, value]) => {
                // Skip already handled fields and empty objects/arrays
                if (key === 'address_dto' || key === 'row_numbers' || key === 'key') return null;
                if (value === null || value === undefined) return null;
                if (typeof value === 'object' && Object.keys(value).length === 0) return null;
                if (Array.isArray(value) && value.length === 0) return null;

                // Format the key for display
                const formattedKey = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                // Format the value - handle objects nicely instead of showing raw JSON
                const formatValue = (val: unknown): string => {
                  if (val === null || val === undefined) return '';
                  if (typeof val === 'string') return val;
                  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                  if (Array.isArray(val)) {
                    // For arrays, show a count or join simple values
                    if (val.length === 0) return '';
                    if (val.every(item => typeof item === 'string' || typeof item === 'number')) {
                      return val.join(', ');
                    }
                    return `${val.length} items`;
                  }
                  if (typeof val === 'object') {
                    // For objects, try to extract meaningful display values
                    const obj = val as Record<string, unknown>;
                    // Check for common name/title fields
                    if ('name' in obj && obj.name) return String(obj.name);
                    if ('title' in obj && obj.title) return String(obj.title);
                    if ('description' in obj && obj.description) return String(obj.description);
                    // For other objects, show key fields nicely
                    const entries = Object.entries(obj).filter(([, v]) => v != null && v !== '');
                    if (entries.length === 0) return '';
                    if (entries.length <= 3) {
                      return entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? '...' : v}`).join(', ');
                    }
                    return `${entries.length} fields`;
                  }
                  return String(val);
                };

                const displayValue = formatValue(value);

                // Skip if display value is empty
                if (!displayValue) return null;

                return (
                  <div key={key} className="text-muted-foreground">
                    <span className="font-medium text-slate-700">{formattedKey}: </span>
                    {displayValue}
                  </div>
                );
              })}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && !entity.isCreatingNew && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Suggestions:</Label>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 4).map((suggestion, suggestionIndex) => (
                  <button
                    key={`${entity.uniqueId}-suggestion-${suggestion.id}-${suggestionIndex}`}
                    onClick={() =>
                      handleSelectEntity(entity.uniqueId, suggestion.id, suggestion.title)
                    }
                    className="group"
                  >
                    <Badge
                      variant="outline"
                      className={`transition-colors text-xs py-1.5 px-3 cursor-pointer ${
                        entity.selectedEntityId === suggestion.id
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      <span className="truncate max-w-[180px]">{suggestion.title}</span>
                      <span className="text-muted-foreground ml-1">
                        ({Math.round(suggestion.confidenceScore * 100)}%)
                      </span>
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search/Select existing entity */}
          {!entity.isCreatingNew && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Match to Existing:</Label>
              <SearchableMatchDropdown
                selectedMatchId={entity.selectedEntityId}
                selectedMatchName={entity.selectedEntityName}
                confidence={
                  entity.selectedEntityId
                    ? suggestions.find((s) => s.id === entity.selectedEntityId)?.confidenceScore
                        ? Math.round(
                            (suggestions.find((s) => s.id === entity.selectedEntityId)
                              ?.confidenceScore || 0) * 100
                          )
                        : 100
                    : 0
                }
                initialCandidates={initialCandidates}
                disabled={isSubmitting}
                isLocked={false}
                onSelect={(_, result) =>
                  handleSelectEntity(entity.uniqueId, result.entityId, result.name)
                }
                onSearch={(query) => searchEntitiesCallback(query, entity.entityType)}
              />
            </div>
          )}

        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6 pb-24">
        {/* Breadcrumb */}
        <WorkflowBreadcrumb currentStep="resolve" showMapColumns={isFromSpreadsheet} />

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matching
            </Button>
            {/* View Document Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDocument}
              disabled={isLoadingDocument}
            >
              {isLoadingDocument ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              View Document
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold">Resolve Missing Entities</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              The following entities could not be automatically matched. Please match them to
              existing records or create new ones.
            </p>
          </div>
        </div>

        {/* Sticky Status banner with progress */}
        <div className="sticky top-0 z-40 -mx-4 px-4 py-2 bg-background">
          {(() => {
            const resolvedCount = resolvingEntities.filter(e => e.isResolved || e.selectedEntityId || (e.isCreatingNew && e.newEntityName.trim())).length;
            const totalCount = resolvingEntities.length;
            const progressPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

            return (
              <div className={`border rounded-lg p-4 shadow-sm ${allResolved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-3">
                  {allResolved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-medium ${allResolved ? 'text-green-800' : 'text-amber-800'}`}>
                        {resolvedCount} of {totalCount} {totalCount === 1 ? 'entity' : 'entities'} resolved
                      </p>
                      <span className={`text-sm font-medium ${allResolved ? 'text-green-700' : 'text-amber-700'}`}>
                        {progressPercent}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${allResolved ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className={`text-sm mt-2 ${allResolved ? 'text-green-700' : 'text-amber-700'}`}>
                      {allResolved
                        ? 'All entities resolved. Click "Submit & Continue" to proceed.'
                        : 'Please resolve all entities before continuing.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bulk selection controls */}
        {selectableCount > 0 && (
          <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount > 0 && selectedCount === selectableCount}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All ({selectableCount} available)
                </Label>
              </div>
              {selectedCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selected
                </span>
              )}
            </div>
            {selectedCount > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAutoSelectBestMatches}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Apply Best Matches
              </Button>
            )}
          </div>
        )}

        {/* Entity cards */}
        <div className="space-y-4">
          {resolvingEntities.map((entity, index) => renderEntityCard(entity, index))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" size="lg" onClick={handleBack} disabled={isSubmitting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matching
          </Button>

          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!allResolved || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit & Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={viewDetailsModalOpen} onOpenChange={setViewDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{selectedEntityForDetails?.originalSearchTerm || 'Entity Details'}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedEntityForDetails && (
                      <Badge variant="secondary" className="text-xs">
                        {getEntityTypeLabel(selectedEntityForDetails.entityType)}
                      </Badge>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedEntityForDetails && (
            <div className="space-y-6 py-4">
              {/* Entity Info Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Entity Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <Label className="text-xs text-muted-foreground block mb-1">Original Search Term</Label>
                    <p className="font-medium text-sm">{selectedEntityForDetails.originalSearchTerm || '—'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <Label className="text-xs text-muted-foreground block mb-1">Entity Type</Label>
                    <p className="font-medium text-sm">{getEntityTypeLabel(selectedEntityForDetails.entityType)}</p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              {buildAddressFromExtra(selectedEntityForDetails.extra) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Address
                  </h4>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">{buildAddressFromExtra(selectedEntityForDetails.extra)}</p>
                  </div>
                </div>
              )}

              {/* Row Numbers Section */}
              {selectedEntityForDetails.extra?.row_numbers && Array.isArray(selectedEntityForDetails.extra.row_numbers) && selectedEntityForDetails.extra.row_numbers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Source Rows ({selectedEntityForDetails.extra.row_numbers.length} occurrences)
                  </h4>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntityForDetails.extra.row_numbers.slice(0, 20).map((rowNum, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white">
                          Row {rowNum}
                        </Badge>
                      ))}
                      {selectedEntityForDetails.extra.row_numbers.length > 20 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selectedEntityForDetails.extra.row_numbers.length - 20} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Extra Data Section */}
              {selectedEntityForDetails.extra && (() => {
                // Helper to format value for display
                const formatValue = (val: unknown): string => {
                  if (val === null || val === undefined) return '—';
                  if (typeof val === 'string') return val || '—';
                  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                  if (Array.isArray(val)) return val.length === 0 ? '—' : val.every(item => typeof item === 'string' || typeof item === 'number') ? val.join(', ') : `${val.length} items`;
                  if (typeof val === 'object') {
                    const obj = val as Record<string, unknown>;
                    if ('name' in obj && obj.name) return String(obj.name);
                    if ('title' in obj && obj.title) return String(obj.title);
                    const keys = Object.keys(obj);
                    return keys.length === 0 ? '—' : `{${keys.length} fields}`;
                  }
                  return '—';
                };

                // Flatten nested objects for display
                const flattenData = (obj: Record<string, unknown>, prefix = ''): Array<{key: string, value: string, isNested: boolean}> => {
                  const result: Array<{key: string, value: string, isNested: boolean}> = [];
                  const skipKeys = ['address_dto', 'row_numbers', 'key'];

                  for (const [key, value] of Object.entries(obj)) {
                    if (skipKeys.includes(key)) continue;
                    const fullKey = prefix ? `${prefix}.${key}` : key;

                    if (value === null || value === undefined) {
                      result.push({ key: fullKey, value: '—', isNested: !!prefix });
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                      const nestedObj = value as Record<string, unknown>;
                      if ('name' in nestedObj || 'title' in nestedObj) {
                        result.push({ key: fullKey, value: formatValue(value), isNested: !!prefix });
                      } else {
                        result.push(...flattenData(nestedObj, fullKey));
                      }
                    } else if (Array.isArray(value)) {
                      result.push({ key: fullKey, value: formatValue(value), isNested: !!prefix });
                    } else {
                      result.push({ key: fullKey, value: formatValue(value), isNested: !!prefix });
                    }
                  }

                  return result;
                };

                const flatFields = flattenData(selectedEntityForDetails.extra as Record<string, unknown>);

                // Format key for display
                const formatKey = (key: string): string => {
                  return key
                    .replace(/_/g, ' ')
                    .replace(/\./g, ' → ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                };

                if (flatFields.length === 0) return null;

                return (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      Additional Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {flatFields.map(({ key, value, isNested }) => (
                        <div key={key} className={`p-2.5 rounded-lg border ${isNested ? 'bg-purple-25 border-purple-100' : 'bg-purple-50 border-purple-200'}`}>
                          <Label className="text-xs text-purple-700 font-medium block mb-0.5">{formatKey(key)}</Label>
                          <p className="text-sm font-mono truncate" title={value}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Suggestions Section */}
              {selectedEntityForDetails.suggestions && selectedEntityForDetails.suggestions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Match Suggestions ({selectedEntityForDetails.suggestions.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEntityForDetails.suggestions.map((suggestion, idx) => {
                      const isSelected = suggestion.id === selectedEntityForDetails.selectedEntityId;
                      const score = Math.round(suggestion.confidenceScore * 100);
                      return (
                        <div
                          key={suggestion.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-green-300 bg-green-50 ring-1 ring-green-200'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                              <span className="font-medium text-sm">{suggestion.title}</span>
                              {isSelected && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                score >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                score >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {score}% match
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setViewDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Slide-out Pane */}
      {showDocumentPane && (documentUrl || csvData) && (
        <div className="fixed inset-y-0 right-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 transition-opacity"
            onClick={() => setShowDocumentPane(false)}
          />
          {/* Pane */}
          <div className="relative w-[600px] max-w-[90vw] bg-background shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Pane Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{isFromSpreadsheet ? 'Spreadsheet Preview' : 'Document Preview'}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDocumentPane(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {/* Pane Content */}
            <div className="flex-1 overflow-hidden">
              {isFromSpreadsheet && csvData ? (
                <CsvPreviewPane
                  csvData={csvData}
                  fileName={documentFileName || undefined}
                />
              ) : (
                <PdfPreviewPane
                  fileUrl={documentUrl!}
                  fileName={documentFileName || undefined}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









'use client';

import { useState, Suspense, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, Sparkles, CheckCircle2, Info, Search, Plus, HelpCircle, Ban, ChevronDown, SkipForward, FileText } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import { Label } from '@/components/flow-ai/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/flow-ai/ui/popover';
import { Input } from '@/components/flow-ai/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/flow-ai/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/flow-ai/ui/dialog';
import { toast } from 'sonner';
import { EntityStepNavigation } from '@/components/flow-ai/flowrms/entity-matching/EntityStepNavigation';
import { EntityFilterControls } from '@/components/flow-ai/flowrms/entity-matching/EntityFilterControls';
import { SearchableMatchDropdown, SearchResult } from '@/components/flow-ai/flowrms/entity-matching/SearchableMatchDropdown';
import { UserSearchDropdown, UserResult } from '@/components/flow-ai/flowrms/entity-matching/UserSearchDropdown';
import { EntitySearchDropdown, EntitySearchResult } from '@/components/flow-ai/flowrms/EntitySearchDropdown';
import { BulkCreateNewPane } from '@/components/flow-ai/flowrms/entity-matching/BulkCreateNewPane';
import { CreateNewSpreadsheet } from '@/components/flow-ai/flowrms/entity-matching/CreateNewSpreadsheet';
import { WorkflowBreadcrumb } from '@/components/flow-ai/flowrms/WorkflowBreadcrumb';
import { useEntityMatching, CreateExtraFields } from '@/components/flow-ai/hooks/useEntityMatching';
import type { PendingEntity, PendingEntityType } from '@/components/flow-ai/types/entity-matching';
import { getConfidencePercentage, parseExtractedData } from '@/components/flow-ai/types/entity-matching';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Q_GET_PENDING, M_EXECUTE_DOCUMENT_WORKFLOW } from '@/lib/flow-ai/gql';

export default function EntityMatchingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <EntityMatchingContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Helper to get params from URL or sessionStorage (without side effects)
function getInitialParams(): {
  pendingId: string | null;
  saveToTemplate: boolean;
  source: string | null;
  needsUrlRestore: boolean;
} {
  if (typeof window === 'undefined') {
    return { pendingId: null, saveToTemplate: false, source: null, needsUrlRestore: false };
  }

  // Always read directly from window.location.search to avoid hydration issues
  const urlParams = new URLSearchParams(window.location.search);
  const urlPendingId = urlParams.get('pendingId');
  const urlSaveToTemplate = urlParams.get('saveToTemplate') === 'true';
  const urlSource = urlParams.get('source');

  if (urlPendingId) {
    const params = {
      pendingId: urlPendingId,
      saveToTemplate: urlSaveToTemplate,
      source: urlSource,
    };
    // Save to sessionStorage immediately
    sessionStorage.setItem('flowrms_entity_matching_params', JSON.stringify(params));
    return { ...params, needsUrlRestore: false };
  }

  // Fall back to sessionStorage
  const saved = sessionStorage.getItem('flowrms_entity_matching_params');
  if (saved) {
    try {
      const params = JSON.parse(saved);
      if (params.pendingId) {
        // Mark that we need to restore URL in useEffect
        return { ...params, needsUrlRestore: true };
      }
    } catch {
      // ignore
    }
  }

  return { pendingId: null, saveToTemplate: false, source: null, needsUrlRestore: false };
}

function EntityMatchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasRestoredUrl = useRef(false);

  // Initialize params once on mount - reads from URL or sessionStorage
  const [effectiveParams] = useState(getInitialParams);

  const pendingId = effectiveParams.pendingId;
  const saveToTemplate = effectiveParams.saveToTemplate;
  const source = effectiveParams.source;
  const isFromSpreadsheet = source === 'spreadsheet';

  // Restore URL from sessionStorage if needed (runs once on mount)
  useEffect(() => {
    if (effectiveParams.needsUrlRestore && !hasRestoredUrl.current) {
      hasRestoredUrl.current = true;
      const newSearchParams = new URLSearchParams();
      if (pendingId) newSearchParams.set('pendingId', pendingId);
      if (saveToTemplate) newSearchParams.set('saveToTemplate', 'true');
      if (source) newSearchParams.set('source', source);
      const newUrl = `/flow-ai/entity-matching?${newSearchParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [effectiveParams.needsUrlRestore, pendingId, saveToTemplate, source]);

  // Keep sessionStorage in sync if URL params change (e.g., user navigates with new params)
  useEffect(() => {
    const urlPendingId = searchParams.get('pendingId');
    if (urlPendingId) {
      const params = {
        pendingId: urlPendingId,
        saveToTemplate: searchParams.get('saveToTemplate') === 'true',
        source: searchParams.get('source'),
      };
      sessionStorage.setItem('flowrms_entity_matching_params', JSON.stringify(params));
    }
  }, [searchParams]);
  const [createNewPopoverOpen, setCreateNewPopoverOpen] = useState<string | null>(null);
  const [createNewFormData, setCreateNewFormData] = useState<Record<string, string>>({});
  const [viewSamplesModalOpen, setViewSamplesModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<PendingEntity | null>(null);
  const [showBackWarningModal, setShowBackWarningModal] = useState(false);

  // State for inside/outside rep selection in create new entity form
  const [insideRepId, setInsideRepId] = useState<string | null>(null);
  const [insideRepName, setInsideRepName] = useState<string | null>(null);
  const [outsideRepId, setOutsideRepId] = useState<string | null>(null);
  const [outsideRepName, setOutsideRepName] = useState<string | null>(null);

  // State for factory selection in create new product form
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [factoryName, setFactoryName] = useState<string | null>(null);

  // State for bulk create new pane
  const [showBulkCreatePane, setShowBulkCreatePane] = useState(false);

  // State for workflow triggering (new flow)
  const [isProcessingWorkflow, setIsProcessingWorkflow] = useState(false);

  // Ref to track if we've already checked for empty entities redirect
  const hasCheckedEmptyRedirect = useRef(false);

  // Pagination for performance - only render a limited number of items initially
  const ITEMS_PER_PAGE = 50;
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  // Validate pendingId exists and redirect if missing
  useEffect(() => {
    if (!pendingId) {
      toast.error('No pending document ID provided');
      router.push('/flow-ai');
    }
  }, [pendingId, router]);

  const {
    factories,
    customers,
    billToCustomers,
    endUsers,
    products,
    orders,
    invoices,
    currentStep,
    setCurrentStep,
    activeFilters,
    toggleFilter,
    createNewMode,
    setCreateNewMode,
    isLoading,
    bulkConfirmLoading,
    loadingEntities,
    getCurrentEntities,
    getCurrentEntityType,
    getStepStatus,
    allValidated,
    handleToggleSelect,
    handleSelectAll,
    handleSelectMatch,
    handleSelectFromSearch,
    handleConfirmMatch,
    handleCreateNew,
    handleBulkApprove,
    handleBulkCreateNew,
    handleBulkReject,
    handleBulkSkip,
    handleBulkSetForCreation,
    handleSearchEntities,
    handleSearchUsers,
    initialLoadComplete,
  } = useEntityMatching({ pendingDocumentId: pendingId });

  // Reset display limit when switching tabs for performance
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [currentStep]);

  // Auto-skip to upload-complete if all entity arrays are empty after loading
  // This triggers the executeDocumentWorkflow and navigates to upload-complete
  useEffect(() => {
    // Wait until initial load is complete before checking
    if (!initialLoadComplete || hasCheckedEmptyRedirect.current || !pendingId) return;

    hasCheckedEmptyRedirect.current = true;

    // Check if all entity arrays are empty
    const hasNoEntities = factories.length === 0 &&
                          customers.length === 0 &&
                          billToCustomers.length === 0 &&
                          endUsers.length === 0 &&
                          products.length === 0 &&
                          orders.length === 0 &&
                          invoices.length === 0;

    if (hasNoEntities) {
      toast.info('No entities to match. Starting document processing...');
      // Trigger the same flow as handleCompleteMatching - this will execute the workflow
      // and navigate to queue page
      handleCompleteMatching();
    }
  }, [initialLoadComplete, factories, customers, billToCustomers, endUsers, products, orders, invoices, pendingId]);

  const handleCompleteMatching = async () => {
    if (!pendingId) {
      toast.error('No pending ID found');
      return;
    }

    setIsProcessingWorkflow(true);

    try {
      // Call executeDocumentWorkflow mutation
      console.log('📄 Executing document workflow for pendingId:', pendingId);
      toast.info('Processing document...');

      const result = await flowrmsApolloClient.mutate<{
        executeDocumentWorkflow?: {
          message: string;
          success: boolean;
          taskId: string;
        };
      }>({
        mutation: M_EXECUTE_DOCUMENT_WORKFLOW,
        variables: { pendingDocumentId: pendingId },
      });

      console.log('📄 ExecuteDocumentWorkflow result:', result.data);

      const workflowResult = result.data?.executeDocumentWorkflow;
      if (!workflowResult?.success) {
        toast.error(workflowResult?.message || 'Failed to process document');
        setIsProcessingWorkflow(false);
        return;
      }

      // Navigate to queue page
      toast.success('Document processed successfully!');
      router.push(`/flow-ai/queue`);

    } catch (error) {
      console.error('Error in handleCompleteMatching:', error);
      toast.error('Failed to process document. Please try again.');
      setIsProcessingWorkflow(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusBadge = (status: PendingEntity['confirmationStatus'], hasBestMatch: boolean) => {
    switch (status) {
      case 'AUTO_MATCHED':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700">AUTO-MATCHED</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary" className="bg-green-50 text-green-700">CONFIRMED</Badge>;
      case 'NEEDS_REVIEW':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">NEEDS REVIEW</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="secondary" className="bg-orange-50 text-orange-700">PENDING</Badge>;
      case 'CREATED_NEW':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700">NEW CREATED</Badge>;
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-50 text-red-700">REJECTED</Badge>;
      case 'SKIPPED':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700">SKIPPED</Badge>;
      case 'SET_FOR_CREATION':
        return <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">SET FOR CREATION</Badge>;
      case 'EMPTY_NAME':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700">EMPTY NAME</Badge>;
      default:
        if (!hasBestMatch) {
          return <Badge variant="secondary" className="bg-red-50 text-red-700">NO MATCH FOUND</Badge>;
        }
        return null;
    }
  };

  const getEntityTypeLabel = (type: PendingEntityType): string => {
    switch (type) {
      case 'FACTORIES': return 'Factory';
      case 'CUSTOMERS': return 'Sold to Customer';
      case 'BILL_TO_CUSTOMERS': return 'Bill to Customer';
      case 'END_USERS': return 'End User';
      case 'PRODUCTS': return 'Product';
      case 'ORDERS': return 'Order';
      case 'INVOICES': return 'Invoice';
      default: return 'Entity';
    }
  };

  // Field configurations for each entity type
  // Key format: "label|apiPath" where apiPath is the nested path in the DTO (e.g., "factory.name")
  // Backend merges field_overrides with extracted_data, so we need the correct nested structure
  const getCreateNewDefaults = (entity: PendingEntity): Record<string, string> => {
    const extractedData = parseExtractedData(entity.extractedData);
    const entityType = getCurrentEntityType();

    // Get nested value from extracted data
    const getNestedValue = (obj: Record<string, unknown> | null, path: string): string => {
      if (!obj) return '';
      const parts = path.split('.');
      let current: unknown = obj;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return '';
        }
      }
      return typeof current === 'string' ? current : '';
    };

    switch (entityType) {
      case 'FACTORIES':
        // Backend expects flat: name
        return {
          'Name|name': getNestedValue(extractedData, 'factory.name') || entity.displayName,
        };
      case 'CUSTOMERS':
        // Backend expects flat: name
        return {
          'Name|name': getNestedValue(extractedData, 'sold_to_customer.name') || entity.displayName,
        };
      case 'BILL_TO_CUSTOMERS':
        // Backend expects flat: name
        return {
          'Name|name': getNestedValue(extractedData, 'bill_to_customer.name') || entity.displayName,
        };
      case 'END_USERS':
        // Backend expects flat: name
        return {
          'Name|name': entity.displayName,
        };
      case 'PRODUCTS':
        // Backend expects flat: factory_part_number, description
        return {
          'Part Number|factory_part_number': getNestedValue(extractedData, 'factory_part_number') || entity.displayName,
          'Description|description': getNestedValue(extractedData, 'description') || getNestedValue(extractedData, 'product.description') || '',
        };
      default:
        return {
          'Name|name': entity.displayName,
        };
    }
  };

  // Transform form data from "label|apiPath" format to nested API structure
  // e.g., "factory.name" -> { factory: { name: "value" } }
  const transformFormDataForApi = (formData: Record<string, string>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(formData)) {
      if (!value || value.trim() === '') continue;

      // Extract API path from "label|apiPath" format
      const parts = key.split('|');
      const apiPath = parts.length > 1 ? parts[1] : key;

      // Build nested structure from path like "factory.name"
      const pathParts = apiPath.split('.');
      let current = result;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in current)) {
          current[part] = {};
        }
        current = current[part] as Record<string, unknown>;
      }

      // Set the final value
      current[pathParts[pathParts.length - 1]] = value;
    }

    return result;
  };

  // Helper to get display label from "label|apiPath" format
  const getFieldLabel = (key: string): string => {
    const parts = key.split('|');
    return parts[0];
  };

  const initializeCreateNewForm = (entity: PendingEntity) => {
    const defaults = getCreateNewDefaults(entity);
    setCreateNewFormData(defaults);
    // Reset rep selections when opening a new form
    setInsideRepId(null);
    setInsideRepName(null);
    setOutsideRepId(null);
    setOutsideRepName(null);
    // Reset factory selection
    setFactoryId(null);
    setFactoryName(null);
  };

  const updateFormField = (key: string, value: string) => {
    setCreateNewFormData(prev => ({ ...prev, [key]: value }));
  };

  // Callbacks for user search dropdowns
  const searchInsideReps = useCallback(async (query: string): Promise<UserResult[]> => {
    return handleSearchUsers(query, 'inside', 10);
  }, [handleSearchUsers]);

  const searchOutsideReps = useCallback(async (query: string): Promise<UserResult[]> => {
    return handleSearchUsers(query, 'outside', 10);
  }, [handleSearchUsers]);

  // Callback for searching factories (used when creating new Products)
  const searchFactories = useCallback(async (query: string, limit?: number): Promise<EntitySearchResult[]> => {
    const { Q_SEARCH_EXISTING_ENTITIES } = await import('@/lib/flow-ai/gql');
    const result = await flowrmsApolloClient.query<{ searchExistingEntities: Array<{ entityId: string; name: string; similarityScore: number | string; metadata: string | null }> }>({
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
    return (result.data?.searchExistingEntities || []).map(r => ({
      entityId: r.entityId,
      name: r.name,
      similarityScore: r.similarityScore,
      metadata: r.metadata,
    }));
  }, []);

  // Check what rep/factory fields are needed for current entity type
  // - Customers/Bill to Customers/End Users: outsideRepId required, insideRepId optional
  // - Factories: insideRepId required only
  // - Products: factoryId required
  const getRepRequirements = useCallback((): { needsOutsideRep: boolean; needsInsideRep: boolean; insideRepRequired: boolean; outsideRepRequired: boolean; needsFactory: boolean; factoryRequired: boolean } => {
    const entityType = getCurrentEntityType();
    if (entityType === 'CUSTOMERS' || entityType === 'BILL_TO_CUSTOMERS' || entityType === 'END_USERS') {
      return { needsOutsideRep: true, needsInsideRep: true, insideRepRequired: false, outsideRepRequired: true, needsFactory: false, factoryRequired: false };
    }
    if (entityType === 'FACTORIES') {
      return { needsOutsideRep: false, needsInsideRep: true, insideRepRequired: true, outsideRepRequired: false, needsFactory: false, factoryRequired: false };
    }
    if (entityType === 'PRODUCTS') {
      return { needsOutsideRep: false, needsInsideRep: false, insideRepRequired: false, outsideRepRequired: false, needsFactory: true, factoryRequired: true };
    }
    // Others: no reps, no factory
    return { needsOutsideRep: false, needsInsideRep: false, insideRepRequired: false, outsideRepRequired: false, needsFactory: false, factoryRequired: false };
  }, [getCurrentEntityType]);

  // Check if current entity type requires any rep selection
  const needsRepSelection = useCallback((): boolean => {
    const reqs = getRepRequirements();
    return reqs.needsOutsideRep || reqs.needsInsideRep;
  }, [getRepRequirements]);

  // Check if current entity type requires factory selection
  const needsFactorySelection = useCallback((): boolean => {
    const reqs = getRepRequirements();
    return reqs.needsFactory;
  }, [getRepRequirements]);

  const handleCreateNewSubmit = async (entityId: string) => {
    const repReqs = getRepRequirements();

    // Validate required reps based on entity type
    if (repReqs.outsideRepRequired && !outsideRepId) {
      toast.error('Outside Rep is required');
      return;
    }
    if (repReqs.insideRepRequired && !insideRepId) {
      toast.error('Inside Rep is required');
      return;
    }
    // Validate required factory for Products
    if (repReqs.factoryRequired && !factoryId) {
      toast.error('Factory is required');
      return;
    }

    // Transform form data from display labels to API field names
    const apiFieldOverrides = transformFormDataForApi(createNewFormData);

    // Find the entity to get its flowIndexDetail
    const currentEntities = getCurrentEntities();
    const entity = currentEntities.find(e => e.id === entityId);

    // Parse flowIndex from flowIndexDetail (same as bulk mutation)
    let flowIndex: number | undefined;
    if (entity?.flowIndexDetail !== null && entity?.flowIndexDetail !== undefined) {
      const flowIndexNum = parseInt(String(entity.flowIndexDetail), 10);
      if (!isNaN(flowIndexNum)) {
        flowIndex = flowIndexNum;
      }
    }

    // Build createExtraFields based on entity type requirements
    let createExtraFields: CreateExtraFields | undefined;
    if (needsRepSelection() || needsFactorySelection()) {
      createExtraFields = {};
      if (repReqs.needsOutsideRep && outsideRepId) {
        createExtraFields.outsideRepId = outsideRepId;
      }
      if (repReqs.needsInsideRep && insideRepId) {
        createExtraFields.insideRepId = insideRepId;
      }
      if (repReqs.needsFactory && factoryId) {
        createExtraFields.factoryId = factoryId;
      }
      // Only pass createExtraFields if it has at least one field
      if (Object.keys(createExtraFields).length === 0) {
        createExtraFields = undefined;
      }
    }

    // Use single entity createNewEntity mutation with field overrides, flowIndex, and createExtraFields
    await handleCreateNew(entityId, apiFieldOverrides, flowIndex, createExtraFields);
    setCreateNewPopoverOpen(null);
    setCreateNewFormData({});
    // Reset rep selections
    setInsideRepId(null);
    setInsideRepName(null);
    setOutsideRepId(null);
    setOutsideRepName(null);
    // Reset factory selection
    setFactoryId(null);
    setFactoryName(null);
  };

  const openViewSamplesModal = (entity: PendingEntity) => {
    setSelectedEntity(entity);
    setViewSamplesModalOpen(true);
  };

  // Callback for SearchableMatchDropdown - wraps handleSearchEntities
  const searchEntitiesCallback = useCallback(async (query: string, limit?: number): Promise<SearchResult[]> => {
    const results = await handleSearchEntities(query, limit || 10);
    return results.map(r => ({
      entityId: r.entityId,
      name: r.name,
      similarityScore: r.similarityScore,
      metadata: r.metadata,
    }));
  }, [handleSearchEntities]);

  // Handle selection from the searchable dropdown
  const handleDropdownSelect = useCallback((entityId: string, result: SearchResult) => {
    handleSelectFromSearch(entityId, {
      entityId: result.entityId,
      name: result.name,
      similarityScore: Number(result.similarityScore),
    });
  }, [handleSelectFromSearch]);

  // Helper to build full address from extracted data (handles nested address object)
  const buildAddress = (data: Record<string, unknown> | null): string | null => {
    if (!data) return null;

    // Check if there's a nested 'address' object with address components
    const addressObj = data.address as Record<string, unknown> | undefined;
    if (addressObj && typeof addressObj === 'object') {
      const parts: string[] = [];

      // Address line 1
      if (typeof addressObj.address_line_one === 'string' && addressObj.address_line_one) {
        parts.push(addressObj.address_line_one);
      }
      // Address line 2
      if (typeof addressObj.address_line_two === 'string' && addressObj.address_line_two) {
        parts.push(addressObj.address_line_two);
      }
      // City, State ZIP
      const cityStateZip: string[] = [];
      if (typeof addressObj.city === 'string' && addressObj.city) {
        cityStateZip.push(addressObj.city);
      }
      if (typeof addressObj.state === 'string' && addressObj.state) {
        cityStateZip.push(addressObj.state);
      }
      if (typeof addressObj.zip_code === 'string' && addressObj.zip_code) {
        cityStateZip.push(addressObj.zip_code);
      }
      if (cityStateZip.length > 0) {
        parts.push(cityStateZip.join(', '));
      }

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    // Check for full_address at top level or in address object
    if (typeof data.full_address === 'string' && data.full_address) return data.full_address;
    if (addressObj && typeof addressObj.full_address === 'string' && addressObj.full_address) {
      return addressObj.full_address;
    }

    // Check for simple string address
    if (typeof data.address === 'string' && data.address) return data.address;

    return null;
  };

  const renderEntityRow = (entity: PendingEntity) => {
    const confidence = getConfidencePercentage(entity.bestMatchSimilarity);
    const extractedData = parseExtractedData(entity.extractedData);
    const entityAddress = buildAddress(extractedData);
    // Find the best match from candidates (if bestMatchId is in the candidate list)
    const bestMatch = entity.matchCandidates.find(m => m.entityId === entity.bestMatchId);
    // Get top match (first match candidate or best match)
    const topMatch = bestMatch || entity.matchCandidates[0];
    // Selected match ID for the dropdown - use bestMatchId if set, otherwise first candidate
    const selectedMatchId = entity.bestMatchId || topMatch?.entityId;
    // Get the display name for the selected match
    // Priority: 1) bestMatchName from API, 2) name from matched candidate, 3) name from top candidate
    const selectedMatchName = (entity.bestMatchName && entity.bestMatchName.trim())
      ? entity.bestMatchName
      : bestMatch?.name || topMatch?.name || null;
    const isEntityLoading = loadingEntities.has(entity.id);
    // Only show "no match" if there are truly NO match candidates AND no bestMatchName from API
    // After confirmation, matchCandidates may be empty but bestMatchName will be set
    const hasNoMatch = entity.matchCandidates.length === 0
      && !entity.bestMatchName
      && entity.confirmationStatus !== 'CREATED_NEW'
      && entity.confirmationStatus !== 'CONFIRMED'
      && entity.confirmationStatus !== 'SKIPPED'
      && entity.confirmationStatus !== 'SET_FOR_CREATION';
    // Check if entity is locked (confirmed, rejected, skipped, or set for creation - cannot be changed)
    const isLocked = entity.confirmationStatus === 'CONFIRMED' || entity.confirmationStatus === 'REJECTED' || entity.confirmationStatus === 'CREATED_NEW' || entity.confirmationStatus === 'SKIPPED' || entity.confirmationStatus === 'SET_FOR_CREATION';
    // Get confirmation count from metadata if available
    const confirmationCount = topMatch?.metadata ? (() => {
      try {
        const meta = JSON.parse(topMatch.metadata);
        return meta.confirmationCount || meta.pastConfirmations || 0;
      } catch { return 0; }
    })() : 0;

    return (
      <div
        key={entity.id}
        className={`border rounded-lg p-4 space-y-4 bg-white transition-all ${
          isLocked
            ? 'opacity-60 cursor-not-allowed bg-slate-50'
            : `cursor-pointer ${entity.selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-slate-50 hover:border-slate-300'}`
        } ${isEntityLoading ? 'opacity-60' : ''}`}
        onClick={(e) => {
          if (isLocked) return;
          const target = e.target as HTMLElement;
          if (
            target.closest('button') ||
            target.closest('[role="combobox"]') ||
            target.closest('input') ||
            target.tagName === 'A'
          ) {
            return;
          }
          handleToggleSelect(entity.id);
        }}
      >
        <div className="grid grid-cols-12 gap-4">
          {/* Checkbox */}
          <div className="col-span-1 flex items-start pt-2">
            <Checkbox
              checked={entity.selected}
              onCheckedChange={() => !isLocked && handleToggleSelect(entity.id)}
              disabled={isEntityLoading || isLocked}
            />
          </div>

          {/* Left: Entity Info */}
          <div className="col-span-3 space-y-2">
            <div className="font-semibold text-sm">{entity.displayName}</div>
            {entity.sourceLineNumbers && entity.sourceLineNumbers.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Lines: {entity.sourceLineNumbers.length > 10
                  ? `${entity.sourceLineNumbers.slice(0, 10).join(', ')}... (+${entity.sourceLineNumbers.length - 10} more)`
                  : entity.sourceLineNumbers.join(', ')
                }
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => openViewSamplesModal(entity)}
            >
              <Info className="w-3 h-3 mr-1" />
              View Details
            </Button>
            {entityAddress && (
              <div className="text-xs text-muted-foreground">{entityAddress}</div>
            )}
          </div>

          {/* Middle: Top Suggestions */}
          <div className="col-span-4 space-y-3">
            {hasNoMatch ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Search className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div className="text-xs text-red-700">
                    <div className="font-semibold mb-1">No Match Found</div>
                    <div className="text-red-600">No suitable matches found in the database. Create a new entity or use the searchable dropdown.</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-muted-foreground">Top Suggestions:</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Click on a suggestion to select it as the match</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Show all match candidates as clickable badges */}
                <div className="flex flex-wrap gap-2">
                  {entity.matchCandidates.slice(0, 4).map(candidate => (
                    <button
                      key={candidate.entityId}
                      onClick={() => !isLocked && handleSelectMatch(entity.id, candidate.entityId)}
                      className="group"
                      disabled={isEntityLoading || isLocked}
                    >
                      <Badge
                        variant="outline"
                        className={`transition-colors text-xs py-1.5 px-3 ${
                          isLocked
                            ? 'cursor-not-allowed opacity-60'
                            : `cursor-pointer ${candidate.entityId === selectedMatchId
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'hover:bg-blue-50 hover:border-blue-400'
                              }`
                        }`}
                      >
                        <span className="truncate max-w-[180px]">{candidate.name}</span>
                        <span className="text-muted-foreground ml-1">({Math.round(Number(candidate.similarityScore) * 100)}%)</span>
                      </Badge>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: Final Destination */}
          <div className="col-span-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold">Matched To:</Label>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs border ${getConfidenceColor(confidence)}`}>
                  {confidence}%
                </Badge>
                {getStatusBadge(entity.confirmationStatus, !!entity.bestMatchId || entity.matchCandidates.length > 0)}
              </div>
            </div>
            <SearchableMatchDropdown
              selectedMatchId={selectedMatchId || null}
              selectedMatchName={selectedMatchName || null}
              confidence={confidence}
              initialCandidates={entity.matchCandidates.map(c => ({
                entityId: c.entityId,
                name: c.name,
                similarityScore: c.similarityScore,
                metadata: c.metadata,
              }))}
              disabled={isEntityLoading}
              isLocked={isLocked}
              statusClassName={
                hasNoMatch
                  ? 'border-red-200 bg-red-50'
                  : isLocked
                    ? 'bg-slate-100'
                    : entity.confirmationStatus === 'NEEDS_REVIEW'
                      ? 'border-yellow-400 bg-yellow-50'
                      : ''
              }
              onSelect={(_, result) => handleDropdownSelect(entity.id, result)}
              onSearch={searchEntitiesCallback}
            />
            {/* Confirmation count indicator */}
            {confirmationCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Confirmed {confirmationCount} times by users</span>
              </div>
            )}
            {/* Action buttons row - Different for Orders/Invoices vs other entity types */}
            {!isLocked && (
              <div className="flex gap-2">
                {/* Orders and Invoices: Skip and Set for Creation buttons */}
                {(getCurrentEntityType() === 'ORDERS' || getCurrentEntityType() === 'INVOICES') ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={isEntityLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(entity.id);
                        // Select this entity and skip it
                        setTimeout(() => {
                          handleBulkSkip();
                        }, 50);
                      }}
                    >
                      {isEntityLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <SkipForward className="w-3 h-3 mr-1" />
                      )}
                      Skip
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={isEntityLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(entity.id);
                        // Select this entity and set for creation
                        setTimeout(() => {
                          handleBulkSetForCreation();
                        }, 50);
                      }}
                    >
                      {isEntityLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <FileText className="w-3 h-3 mr-1" />
                      )}
                      Set for Creation
                    </Button>
                  </>
                ) : (
                  /* Standard entity types: Approve button */
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={isEntityLoading || hasNoMatch}
                      onClick={(e) => {
                        e.stopPropagation();
                        const matchId = entity.bestMatchId || entity.matchCandidates[0]?.entityId;
                        const matchName = entity.bestMatchName || entity.matchCandidates[0]?.name;
                        if (matchId && matchName) {
                          handleConfirmMatch(entity.id, matchId, matchName);
                        }
                      }}
                    >
                      {isEntityLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      Approve
                    </Button>
                    {/* Products: Add Skip button */}
                    {getCurrentEntityType() === 'PRODUCTS' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        disabled={isEntityLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(entity.id);
                          // Select this entity and skip it
                          setTimeout(() => {
                            handleBulkSkip();
                          }, 50);
                        }}
                      >
                        {isEntityLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <SkipForward className="w-3 h-3 mr-1" />
                        )}
                        Skip
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
            {/* Create New button - hidden for locked entities and for Orders/Invoices */}
            {!isLocked && getCurrentEntityType() !== 'ORDERS' && getCurrentEntityType() !== 'INVOICES' && (
              <Popover
                open={createNewPopoverOpen === entity.id}
                onOpenChange={(open) => {
                  if (open) {
                    initializeCreateNewForm(entity);
                  }
                  setCreateNewPopoverOpen(open ? entity.id : null);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    disabled={isEntityLoading}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create New
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm">Create New {getEntityTypeLabel(getCurrentEntityType())}</h4>
                    <p className="text-xs text-muted-foreground">
                      Edit the values that will be used to create this entity:
                    </p>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(createNewFormData).map(([key, value]) => {
                      const label = getFieldLabel(key);
                      return (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs font-medium">{label}</Label>
                          <Input
                            value={value}
                            onChange={(e) => updateFormField(key, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Rep Selection Dropdowns - Based on entity type requirements */}
                  {needsRepSelection() && (() => {
                    const repReqs = getRepRequirements();
                    return (
                      <div className="border-t pt-3 space-y-3">
                        <p className="text-xs text-muted-foreground font-medium">Assign Representatives:</p>
                        {repReqs.needsOutsideRep && (
                          <UserSearchDropdown
                            label="Outside Rep"
                            selectedUserId={outsideRepId}
                            selectedUserName={outsideRepName}
                            required={repReqs.outsideRepRequired}
                            placeholder={repReqs.outsideRepRequired ? "Select outside rep..." : "Select outside rep (optional)..."}
                            onSelect={(userId, user) => {
                              setOutsideRepId(userId);
                              setOutsideRepName(user?.fullName || null);
                            }}
                            onSearch={searchOutsideReps}
                          />
                        )}
                        {repReqs.needsInsideRep && (
                          <UserSearchDropdown
                            label="Inside Rep"
                            selectedUserId={insideRepId}
                            selectedUserName={insideRepName}
                            required={repReqs.insideRepRequired}
                            placeholder={repReqs.insideRepRequired ? "Select inside rep..." : "Select inside rep (optional)..."}
                            onSelect={(userId, user) => {
                              setInsideRepId(userId);
                              setInsideRepName(user?.fullName || null);
                            }}
                            onSearch={searchInsideReps}
                          />
                        )}
                      </div>
                    );
                  })()}

                  {/* Factory Selection Dropdown - For Products */}
                  {needsFactorySelection() && (() => {
                    const repReqs = getRepRequirements();
                    return (
                      <div className="border-t pt-3 space-y-3">
                        <p className="text-xs text-muted-foreground font-medium">Assign Factory:</p>
                        <EntitySearchDropdown
                          label="Factory"
                          selectedId={factoryId}
                          selectedName={factoryName}
                          required={repReqs.factoryRequired}
                          placeholder={repReqs.factoryRequired ? "Select factory..." : "Select factory (optional)..."}
                          onSelect={(id, result) => {
                            setFactoryId(id);
                            setFactoryName(result?.name || null);
                          }}
                          onSearch={searchFactories}
                        />
                      </div>
                    );
                  })()}

                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleCreateNewSubmit(entity.id)}
                    disabled={(() => {
                      const repReqs = getRepRequirements();
                      if (repReqs.outsideRepRequired && !outsideRepId) return true;
                      if (repReqs.insideRepRequired && !insideRepId) return true;
                      if (repReqs.factoryRequired && !factoryId) return true;
                      return false;
                    })()}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create New {getEntityTypeLabel(getCurrentEntityType())}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            )}
          </div>
        </div>
        {isEntityLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    );
  };

  const currentEntities = getCurrentEntities();
  // Selectable entities are those that are not locked (not CONFIRMED, REJECTED, CREATED_NEW, SKIPPED, or SET_FOR_CREATION)
  const selectableEntities = currentEntities.filter(
    e => e.confirmationStatus !== 'CONFIRMED' &&
         e.confirmationStatus !== 'REJECTED' &&
         e.confirmationStatus !== 'CREATED_NEW' &&
         e.confirmationStatus !== 'SKIPPED' &&
         e.confirmationStatus !== 'SET_FOR_CREATION'
  );
  const selectedCount = currentEntities.filter(e => e.selected).length;
  const selectableCount = selectableEntities.length;
  const allSelected = selectableCount > 0 && selectableEntities.every(e => e.selected);

  // Paginated entities for performance - only render up to displayLimit items
  const paginatedEntities = useMemo(() => {
    return currentEntities.slice(0, displayLimit);
  }, [currentEntities, displayLimit]);
  const hasMoreEntities = currentEntities.length > displayLimit;
  const remainingCount = currentEntities.length - displayLimit;

  // Skeleton loading component for entity rows
  const renderEntitySkeleton = (index: number) => (
    <div key={index} className="border rounded-lg p-4 bg-white animate-pulse">
      <div className="grid grid-cols-12 gap-4">
        {/* Checkbox skeleton */}
        <div className="col-span-1 flex items-start pt-2">
          <div className="w-4 h-4 bg-slate-200 rounded" />
        </div>
        {/* Entity info skeleton */}
        <div className="col-span-3 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-1/3" />
        </div>
        {/* Match candidates skeleton */}
        <div className="col-span-4 space-y-3">
          <div className="h-3 bg-slate-200 rounded w-1/4" />
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-slate-200 rounded w-24" />
            <div className="h-6 bg-slate-200 rounded w-20" />
            <div className="h-6 bg-slate-200 rounded w-28" />
          </div>
        </div>
        {/* Match destination skeleton */}
        <div className="col-span-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-200 rounded w-16" />
            <div className="flex gap-2">
              <div className="h-5 bg-slate-200 rounded w-12" />
              <div className="h-5 bg-slate-200 rounded w-20" />
            </div>
          </div>
          <div className="h-9 bg-slate-200 rounded w-full" />
          <div className="h-8 bg-slate-200 rounded w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6 pb-24">
        {/* Breadcrumb */}
        <WorkflowBreadcrumb currentStep="validate" showMapColumns={isFromSpreadsheet} />

        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBackWarningModal(true)}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isFromSpreadsheet ? 'Back to Column Mapping' : 'Back to Review'}
          </Button>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-[#5048E6]" />
                </div>
                <h1 className="text-3xl font-bold">Validate & Match Entities</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Review AI-generated matches for factories, customers, end users, and products from your uploaded {isFromSpreadsheet ? 'spreadsheet' : 'document'}.
              </p>
              <p className="text-sm text-muted-foreground/80 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Auto-matched entities are already approved - no action needed unless you want to change the match.
              </p>
            </div>
            {/* Complete & Continue button - shown when all entities are validated */}
            {allValidated && (
              <Button
                size="lg"
                onClick={handleCompleteMatching}
                disabled={isProcessingWorkflow}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isProcessingWorkflow ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Complete & Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Step Navigation */}
        <EntityStepNavigation
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          factoriesCount={factories.length}
          customersCount={customers.length}
          billToCustomersCount={billToCustomers.length}
          endUsersCount={endUsers.length}
          productsCount={products.length}
          ordersCount={orders.length}
          invoicesCount={invoices.length}
          getStepStatus={getStepStatus}
        />

        {/* Filter and Action Controls */}
        <EntityFilterControls
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          createNewMode={createNewMode}
          setCreateNewMode={setCreateNewMode}
          selectedCount={selectedCount}
          selectableCount={selectableCount}
          entitiesCount={currentEntities.length}
          allSelected={allSelected}
          onSelectAll={handleSelectAll}
          onBulkApprove={handleBulkApprove}
          onBulkCreateNew={() => setShowBulkCreatePane(true)}
          onBulkSkip={handleBulkSkip}
          onBulkSetForCreation={handleBulkSetForCreation}
          isLoading={bulkConfirmLoading}
          currentEntityType={getCurrentEntityType()}
        />

        {/* Entities List - Show spreadsheet in Create New Mode */}
        {createNewMode ? (
          <CreateNewSpreadsheet
            entities={currentEntities}
            entityType={getCurrentEntityType()}
            onToggleSelect={handleToggleSelect}
            onBulkCreateNew={(createExtraFields) => {
              // Use the bulk create with extra fields
              handleBulkCreateNew(createExtraFields);
            }}
            onCreateSingle={async (entityId, createExtraFields) => {
              // Use single entity create mutation
              await handleCreateNew(entityId, undefined, undefined, createExtraFields);
            }}
            onSearchInsideReps={searchInsideReps}
            onSearchOutsideReps={searchOutsideReps}
            onSearchFactories={searchFactories}
            isLoading={bulkConfirmLoading}
            loadingEntityId={Array.from(loadingEntities)[0] || null}
          />
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              // Show skeleton loading
              <>
                {[0, 1, 2, 3].map(index => renderEntitySkeleton(index))}
              </>
            ) : currentEntities.length > 0 ? (
              <>
                {paginatedEntities.map(entity => renderEntityRow(entity))}
                {hasMoreEntities && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
                      className="gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Load More ({remainingCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-8 border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">
                  No entities match the current filters
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedCount > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
            <div className="container max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-sm font-semibold">
                {selectedCount} {selectedCount === 1 ? 'entity' : 'entities'} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={bulkConfirmLoading}
                >
                  {bulkConfirmLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {selectedCount > 1 ? 'Bulk Approve Matches' : 'Approve Match'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkCreatePane(true)}
                  disabled={bulkConfirmLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {selectedCount > 1 ? 'Bulk Create New' : 'Create New'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={bulkConfirmLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (currentStep === 'customers') setCurrentStep('factories');
              else if (currentStep === 'billtocustomers') setCurrentStep('customers');
              else if (currentStep === 'endusers') setCurrentStep('billtocustomers');
              else if (currentStep === 'products') setCurrentStep('endusers');
              else setShowBackWarningModal(true);
            }}
          >
            <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
            {currentStep === 'factories' ? (isFromSpreadsheet ? 'Back to Columns' : 'Back to Review') : 'Previous'}
          </Button>
          <Button
            size="lg"
            onClick={() => {
              if (currentStep === 'factories') setCurrentStep('customers');
              else if (currentStep === 'customers') setCurrentStep('billtocustomers');
              else if (currentStep === 'billtocustomers') setCurrentStep('endusers');
              else if (currentStep === 'endusers') setCurrentStep('products');
              else if (currentStep === 'products' && allValidated) handleCompleteMatching();
            }}
            disabled={(currentStep === 'products' && !allValidated) || isProcessingWorkflow}
          >
            {isProcessingWorkflow ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : currentStep === 'products' ? (
              <>
                Complete & Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={viewSamplesModalOpen} onOpenChange={setViewSamplesModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">{selectedEntity?.displayName}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedEntity && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {getEntityTypeLabel(selectedEntity.entityType)}
                        </Badge>
                        {getStatusBadge(selectedEntity.confirmationStatus, !!selectedEntity.bestMatchId || selectedEntity.matchCandidates.length > 0)}
                      </>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedEntity && (
            <div className="space-y-6 py-4">
              {/* Entity Info Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Entity Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <Label className="text-xs text-muted-foreground block mb-1">Display Name</Label>
                    <p className="font-medium text-sm">{selectedEntity.displayName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <Label className="text-xs text-muted-foreground block mb-1">Match Confidence</Label>
                    <div className="font-medium text-sm">
                      <Badge className={`${getConfidenceColor(getConfidencePercentage(selectedEntity.bestMatchSimilarity))}`}>
                        {getConfidencePercentage(selectedEntity.bestMatchSimilarity)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Source Lines Section */}
              {selectedEntity.sourceLineNumbers && selectedEntity.sourceLineNumbers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    Source Lines ({selectedEntity.sourceLineNumbers.length} occurrences)
                  </h4>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEntity.sourceLineNumbers.slice(0, 20).map((lineNum, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white">
                          Line {lineNum}
                        </Badge>
                      ))}
                      {selectedEntity.sourceLineNumbers.length > 20 && (
                        <Badge variant="secondary" className="text-xs">
                          +{selectedEntity.sourceLineNumbers.length - 20} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Data Section */}
              {selectedEntity.extractedData && (() => {
                const data = parseExtractedData(selectedEntity.extractedData) || {};

                // Helper to format value for display
                const formatValue = (val: unknown): string => {
                  if (val === null || val === undefined) return '—';
                  if (typeof val === 'string') return val || '—';
                  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                  if (Array.isArray(val)) return val.length === 0 ? '—' : `${val.length} items`;
                  if (typeof val === 'object') {
                    // For objects, try to get a name or meaningful field
                    const obj = val as Record<string, unknown>;
                    if ('name' in obj && obj.name) return String(obj.name);
                    if ('title' in obj && obj.title) return String(obj.title);
                    // Otherwise show key count
                    const keys = Object.keys(obj);
                    return keys.length === 0 ? '—' : `{${keys.length} fields}`;
                  }
                  return '—';
                };

                // Flatten nested objects for display
                const flattenData = (obj: Record<string, unknown>, prefix = ''): Array<{key: string, value: string, isNested: boolean}> => {
                  const result: Array<{key: string, value: string, isNested: boolean}> = [];

                  for (const [key, value] of Object.entries(obj)) {
                    const fullKey = prefix ? `${prefix}.${key}` : key;

                    if (value === null || value === undefined) {
                      result.push({ key: fullKey, value: '—', isNested: !!prefix });
                    } else if (typeof value === 'object' && !Array.isArray(value)) {
                      // For nested objects, show the object's main field inline
                      const nestedObj = value as Record<string, unknown>;
                      if ('name' in nestedObj || 'title' in nestedObj) {
                        result.push({ key: fullKey, value: formatValue(value), isNested: !!prefix });
                      } else {
                        // Recurse into nested object
                        result.push(...flattenData(nestedObj, fullKey));
                      }
                    } else if (Array.isArray(value)) {
                      result.push({ key: fullKey, value: `${value.length} items`, isNested: !!prefix });
                    } else {
                      result.push({ key: fullKey, value: formatValue(value), isNested: !!prefix });
                    }
                  }

                  return result;
                };

                const flatFields = flattenData(data);

                return (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                      Extracted Fields
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {flatFields.map(({ key, value, isNested }) => (
                        <div key={key} className={`p-2.5 rounded-lg border ${isNested ? 'bg-purple-25 border-purple-100' : 'bg-purple-50 border-purple-200'}`}>
                          <Label className="text-xs text-purple-700 font-medium block mb-0.5">{key}</Label>
                          <p className="text-sm font-mono truncate" title={value}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Match Candidates Section */}
              {selectedEntity.matchCandidates.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Match Candidates ({selectedEntity.matchCandidates.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEntity.matchCandidates.map((candidate, idx) => {
                      const isBestMatch = candidate.entityId === selectedEntity.bestMatchId;
                      const score = Math.round(Number(candidate.similarityScore) * 100);
                      return (
                        <div
                          key={candidate.entityId}
                          className={`p-3 rounded-lg border transition-colors ${
                            isBestMatch
                              ? 'border-green-300 bg-green-50 ring-1 ring-green-200'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                              <span className="font-medium text-sm">{candidate.name}</span>
                              {isBestMatch && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Best Match
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
            <Button variant="outline" onClick={() => setViewSamplesModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Modal for Going Back */}
      <Dialog open={showBackWarningModal} onOpenChange={setShowBackWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isFromSpreadsheet ? 'Go back to column mapping?' : 'Go back to document review?'}
            </DialogTitle>
            <DialogDescription>
              {isFromSpreadsheet
                ? 'Going back will reset your matching progress. You will need to re-process entities after making changes to column mappings.'
                : 'Going back will reset your matching progress. You will need to re-process entities if you make changes to the document data.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackWarningModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowBackWarningModal(false);
                if (isFromSpreadsheet) {
                  router.push(`/flow-ai/column-mapping?pendingId=${pendingId}&saveToTemplate=${saveToTemplate}`);
                } else {
                  router.push(`/flow-ai?pendingId=${pendingId}`);
                }
              }}
            >
              Go Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create New Pane */}
      <BulkCreateNewPane
        isOpen={showBulkCreatePane}
        onClose={() => setShowBulkCreatePane(false)}
        selectedCount={selectedCount}
        isLoading={bulkConfirmLoading}
        onConfirm={(createExtraFields) => {
          handleBulkCreateNew(createExtraFields);
          setShowBulkCreatePane(false);
        }}
        onSearchInsideReps={searchInsideReps}
        onSearchOutsideReps={searchOutsideReps}
        onSearchFactories={searchFactories}
        repRequirements={getRepRequirements()}
      />
    </div>
  );
}









import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Q_SEARCH_EXISTING_ENTITIES,
  Q_USER_SEARCH,
  SUB_FILE_UPLOAD_PROCESS_STATUS,
  M_CONTINUE_WORKFLOW,
} from '@/lib/flow-ai/gql';
import { flowrmsApolloClient, flowrmsApiApolloClient, flowrmsApiSubscriptionClient } from '@/lib/flow-ai/flowrms-apollo';
import type { SearchEntity } from '@/components/flow-ai/types/entity-matching';

// ============================================
// Types for Entity Resolution
// ============================================

// Entity types from the subscription
export type PausedEntityType =
  | 'FACTORY'
  | 'SOLD_TO_CUSTOMER'
  | 'BILL_TO_CUSTOMER'
  | 'END_USER'
  | 'PRODUCT';

// Suggestion from the subscription
export interface PausedEntitySuggestion {
  confidenceScore: number;
  id: string;
  title: string;
}

// Extra data from paused entity
export interface PausedEntityExtra {
  key?: string;
  address_dto?: {
    address_line_one?: string;
    address_line_two?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    full_address?: string;
  };
  row_numbers?: number[];
  [key: string]: unknown;
}

// Paused entity from subscription
export interface PausedEntity {
  dtoId: string;
  entityType: PausedEntityType;
  extra: PausedEntityExtra | null;
  originalSearchTerm: string;
  suggestions: PausedEntitySuggestion[] | null;
}

// Detailed exception from subscription
export interface DetailedException {
  id: string;
  fileUploadProcessDtoId: string;
  message: string;
  data: string | null;
}

// File upload process status from subscription
export interface FileUploadProcessStatus {
  pausedEntities: PausedEntity[];
  queueStatus: 'PENDING' | 'PROCESSING' | 'DONE' | 'EXCEPTION';
  status: 'PAUSED' | 'PROCESSING' | 'DONE' | 'COMPLETED' | 'EXCEPTION' | 'FAILED';
  detailedExceptions?: DetailedException[] | null;
}

// Address object for continueWorkflow mutation (without internal_uuid)
export interface ResponseEntityAddress {
  address_line_one: string | null;
  address_line_two: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | number | null;
}

// Response entity for continueWorkflow mutation
export interface ResponseEntity {
  originalTitle: string;
  entityType: PausedEntityType;
  dtoId: string;
  address: ResponseEntityAddress;
  correctedTitle: string;
  id: string; // ID of the selected existing entity or empty if creating new
}

// Local state for each paused entity during resolution
export interface ResolvingEntity extends PausedEntity {
  // Unique identifier for React state management (dtoId may not be unique across entities)
  uniqueId: string;
  // Selection state
  selectedEntityId: string | null;
  selectedEntityName: string | null;
  // Create new state
  isCreatingNew: boolean;
  newEntityName: string;
  // Rep selection for customers
  insideRepId: string | null;
  insideRepName: string | null;
  outsideRepId: string | null;
  outsideRepName: string | null;
  // Factory selection for products
  factoryId: string | null;
  factoryName: string | null;
  // Status
  isResolved: boolean;
  // UI selection for bulk actions
  isSelected: boolean;
}

// User result from user search
export interface UserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

// User search response
interface UserSearchResponse {
  userSearch: UserResult[];
}

// Search entities response
interface SearchEntitiesResponse {
  searchExistingEntities: SearchEntity[];
}

// Subscription data response
interface FileUploadProcessStatusSubscription {
  fileUploadProcessStatus: FileUploadProcessStatus;
}

// Continue workflow response
interface ContinueWorkflowResponse {
  continueWorkflow: {
    message: string;
    status: string;
  };
}

// ============================================
// Hook Options
// ============================================

export interface UseEntityResolutionOptions {
  fileUploadProcessId: string | null;
  pendingId: string | null;
  source: string | null;
}

// ============================================
// Hook Implementation
// ============================================

export function useEntityResolution({
  fileUploadProcessId,
  pendingId,
  source,
}: UseEntityResolutionOptions) {
  const router = useRouter();

  // Core state
  const [resolvingEntities, setResolvingEntities] = useState<ResolvingEntity[]>([]);
  const [processStatus, setProcessStatus] = useState<FileUploadProcessStatus | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const mountedRef = useRef(true);

  // Convert entity type from subscription format to search format
  const mapEntityTypeForSearch = useCallback((type: PausedEntityType): string => {
    switch (type) {
      case 'FACTORY':
        return 'FACTORIES';
      case 'SOLD_TO_CUSTOMER':
      case 'BILL_TO_CUSTOMER':
        return 'CUSTOMERS';
      case 'END_USER':
        return 'END_USERS';
      case 'PRODUCT':
        return 'PRODUCTS';
      default:
        return 'CUSTOMERS';
    }
  }, []);

  // Get display label for entity type
  const getEntityTypeLabel = useCallback((type: PausedEntityType): string => {
    switch (type) {
      case 'FACTORY':
        return 'Factory';
      case 'SOLD_TO_CUSTOMER':
        return 'Sold To Customer';
      case 'BILL_TO_CUSTOMER':
        return 'Bill To Customer';
      case 'END_USER':
        return 'End User';
      case 'PRODUCT':
        return 'Product';
      default:
        return 'Entity';
    }
  }, []);

  // Build address string from extra data (for display purposes)
  const buildAddressFromExtra = useCallback((extra: PausedEntityExtra | null): string => {
    if (!extra?.address_dto) return '';

    const addr = extra.address_dto;
    if (addr.full_address) return addr.full_address;

    const parts: string[] = [];
    if (addr.address_line_one) parts.push(addr.address_line_one);
    if (addr.address_line_two) parts.push(addr.address_line_two);

    const cityStateZip: string[] = [];
    if (addr.city) cityStateZip.push(addr.city);
    if (addr.state) cityStateZip.push(addr.state);
    if (addr.zip_code) cityStateZip.push(addr.zip_code);

    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '));
    }

    return parts.join(', ');
  }, []);

  // Build address object from extra data (for API - without internal_uuid)
  const buildAddressObjectFromExtra = useCallback((extra: PausedEntityExtra | null): ResponseEntityAddress => {
    if (!extra?.address_dto) {
      return {
        address_line_one: null,
        address_line_two: null,
        city: null,
        state: null,
        zip_code: null,
      };
    }

    const addr = extra.address_dto;
    return {
      address_line_one: addr.address_line_one || null,
      address_line_two: addr.address_line_two || null,
      city: addr.city || null,
      state: addr.state || null,
      zip_code: addr.zip_code || null,
    };
  }, []);

  // Initialize resolving entities from paused entities
  // IMPORTANT: We use uniqueId for state management since dtoId may not be unique across entities
  const initializeResolvingEntities = useCallback((pausedEntities: PausedEntity[]) => {
    const resolvingList: ResolvingEntity[] = pausedEntities.map((entity, index) => ({
      ...entity,
      // Generate a unique ID for state management (dtoId is preserved for backend)
      uniqueId: `${entity.dtoId}-${index}-${Date.now()}`,
      selectedEntityId: null,
      selectedEntityName: null,
      isCreatingNew: false,
      newEntityName: entity.originalSearchTerm || '',
      insideRepId: null,
      insideRepName: null,
      outsideRepId: null,
      outsideRepName: null,
      factoryId: null,
      factoryName: null,
      isResolved: false,
      isSelected: false,
    }));

    setResolvingEntities(resolvingList);
  }, []);

  // Handle subscription data
  const handleSubscriptionData = useCallback((data: FileUploadProcessStatus) => {
    if (!mountedRef.current) return;

    console.log('📡 Subscription data received:', data);
    setProcessStatus(data);

    const { status, queueStatus, pausedEntities } = data;

    // Check if we should navigate to upload-complete
    // Handle both status: "DONE"/"COMPLETED" and queueStatus: "DONE" scenarios
    // Use string comparison to handle any status value that indicates completion
    const statusStr = status as string;
    const queueStatusStr = queueStatus as string;
    const isCompleted = statusStr === 'DONE' || statusStr === 'COMPLETED' ||
                        (queueStatusStr === 'DONE' && (statusStr === 'COMPLETED' || statusStr === 'DONE'));
    const isException = status === 'EXCEPTION';
    const isFailed = status === 'FAILED';

    // Handle EXCEPTION status - redirect to processing-errors page
    if (isException) {
      console.log(`📡 Status is EXCEPTION, navigating to processing-errors`);
      const sourceParam = source === 'spreadsheet' ? '&source=spreadsheet' : '';

      // Just pass the fileUploadProcessId - the page will subscribe to get the exceptions
      router.push(`/apps/flowrms/processing-errors?fileUploadProcessId=${fileUploadProcessId}&pendingId=${pendingId}${sourceParam}`);
      return;
    }

    // Handle completed or failed status - redirect to upload-complete
    if (isCompleted || isFailed) {
      console.log(`📡 Status is ${status}, queueStatus is ${queueStatus}, navigating to upload-complete`);
      const sourceParam = source === 'spreadsheet' ? '&source=spreadsheet' : '';
      const fupIdParam = fileUploadProcessId ? `&fileUploadProcessId=${fileUploadProcessId}` : '';
      router.push(`/apps/flowrms/upload-complete?pendingId=${pendingId}&trigger=false${fupIdParam}${sourceParam}`);
      return;
    }

    // Check if we have paused entities to resolve
    if (status === 'PAUSED' && queueStatus === 'PENDING' && pausedEntities?.length > 0) {
      console.log(`📡 Status is PAUSED with ${pausedEntities.length} entities to resolve`);

      // Only initialize if these are NEW entities (different dtoIds)
      // This prevents overwriting user's selections when subscription re-emits
      setResolvingEntities(prev => {
        const prevDtoIds = new Set(prev.map(e => e.dtoId));
        const newDtoIds = new Set(pausedEntities.map(e => e.dtoId));

        // Check if this is a different set of entities
        const isDifferentSet =
          prevDtoIds.size !== newDtoIds.size ||
          pausedEntities.some(e => !prevDtoIds.has(e.dtoId));

        if (isDifferentSet || prev.length === 0) {
          console.log('📡 Initializing new set of entities');
          // Generate unique IDs for state management (dtoId may not be unique)
          return pausedEntities.map((entity, index) => ({
            ...entity,
            // Generate a unique ID for state management (dtoId is preserved for backend)
            uniqueId: `${entity.dtoId}-${index}-${Date.now()}`,
            selectedEntityId: null,
            selectedEntityName: null,
            isCreatingNew: false,
            newEntityName: entity.originalSearchTerm || '',
            insideRepId: null,
            insideRepName: null,
            outsideRepId: null,
            outsideRepName: null,
            factoryId: null,
            factoryName: null,
            isResolved: false,
            isSelected: false,
          }));
        }

        // Same entities, keep existing selections
        console.log('📡 Keeping existing entity selections');
        return prev;
      });

      setIsLoading(false);
      setIsSubmitting(false); // Reset submitting state so user can interact with new entities
    }

    // If processing, show loading state
    if (status === 'PROCESSING' || queueStatus === 'PROCESSING') {
      setIsLoading(true);
    }
  }, [pendingId, source, router, initializeResolvingEntities]);

  // Start subscription
  const startSubscription = useCallback(() => {
    if (!fileUploadProcessId || subscriptionRef.current) {
      console.log('📡 Subscription not started:', {
        hasId: !!fileUploadProcessId,
        hasExisting: !!subscriptionRef.current
      });
      return;
    }

    console.log('📡 Starting subscription for fileUploadProcessId:', fileUploadProcessId);
    setSubscriptionActive(true);

    const observable = flowrmsApiSubscriptionClient.subscribe<FileUploadProcessStatusSubscription>({
      query: SUB_FILE_UPLOAD_PROCESS_STATUS,
      variables: { fileUploadProcessId },
    });

    subscriptionRef.current = observable.subscribe({
      next: ({ data }) => {
        if (data?.fileUploadProcessStatus) {
          handleSubscriptionData(data.fileUploadProcessStatus);
        }
      },
      error: (err) => {
        console.error('📡 Subscription error:', err);
        setError('Failed to connect to processing status. Please try again.');
        setSubscriptionActive(false);
        setIsLoading(false);
      },
      complete: () => {
        console.log('📡 Subscription completed');
        setSubscriptionActive(false);
      },
    });
  }, [fileUploadProcessId, handleSubscriptionData]);

  // Stop subscription
  const stopSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('📡 Stopping subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      setSubscriptionActive(false);
    }
  }, []);

  // Effect to start subscription on mount and when returning to the page
  useEffect(() => {
    mountedRef.current = true;

    if (fileUploadProcessId) {
      // Always try to start subscription when we have a fileUploadProcessId
      // This handles both initial mount and returning to the page
      console.log('📡 Effect triggered - attempting to start subscription');
      startSubscription();
    }

    // Handle visibility change (tab focus) to restart subscription if needed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && fileUploadProcessId && !subscriptionRef.current) {
        console.log('📡 Page became visible - restarting subscription');
        startSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mountedRef.current = false;
      stopSubscription();
    };
  }, [fileUploadProcessId, startSubscription, stopSubscription]);

  // Search for existing entities
  const handleSearchEntities = useCallback(
    async (query: string, entityType: PausedEntityType, limit = 10): Promise<SearchEntity[]> => {
      try {
        const searchType = mapEntityTypeForSearch(entityType);
        const result = await flowrmsApolloClient.query<SearchEntitiesResponse>({
          query: Q_SEARCH_EXISTING_ENTITIES,
          variables: {
            input: {
              entityType: searchType,
              query,
              limit,
            },
          },
          fetchPolicy: 'network-only',
        });
        return result.data?.searchExistingEntities || [];
      } catch (error) {
        console.error('Error searching entities:', error);
        return [];
      }
    },
    [mapEntityTypeForSearch]
  );

  // Search for users (inside/outside reps)
  const handleSearchUsers = useCallback(
    async (searchTerm: string, type: 'inside' | 'outside', limit = 10): Promise<UserResult[]> => {
      try {
        const result = await flowrmsApolloClient.query<UserSearchResponse>({
          query: Q_USER_SEARCH,
          variables: {
            searchTerm,
            isInside: type === 'inside',
            isOutside: type === 'outside',
            limit,
          },
          fetchPolicy: 'network-only',
        });
        return result.data?.userSearch || [];
      } catch (error) {
        console.error('Error searching users:', error);
        return [];
      }
    },
    []
  );

  // Update a resolving entity by uniqueId (not dtoId, which may not be unique)
  const updateResolvingEntity = useCallback((uniqueId: string, updates: Partial<ResolvingEntity>) => {
    setResolvingEntities(prev =>
      prev.map(entity =>
        entity.uniqueId === uniqueId
          ? { ...entity, ...updates }
          : entity
      )
    );
  }, []);

  // Select an existing entity for resolution
  const handleSelectEntity = useCallback((uniqueId: string, entityId: string, entityName: string) => {
    updateResolvingEntity(uniqueId, {
      selectedEntityId: entityId,
      selectedEntityName: entityName,
      isCreatingNew: false,
      isResolved: true,
    });
  }, [updateResolvingEntity]);

  // Toggle create new mode
  const handleToggleCreateNew = useCallback((uniqueId: string, isCreatingNew: boolean) => {
    updateResolvingEntity(uniqueId, {
      isCreatingNew,
      selectedEntityId: isCreatingNew ? null : null,
      selectedEntityName: isCreatingNew ? null : null,
      isResolved: isCreatingNew, // If creating new, consider it resolved
    });
  }, [updateResolvingEntity]);

  // Update new entity name
  const handleUpdateNewEntityName = useCallback((uniqueId: string, name: string) => {
    updateResolvingEntity(uniqueId, {
      newEntityName: name,
    });
  }, [updateResolvingEntity]);

  // Update rep selection
  const handleUpdateRep = useCallback((
    uniqueId: string,
    repType: 'inside' | 'outside',
    repId: string | null,
    repName: string | null
  ) => {
    if (repType === 'inside') {
      updateResolvingEntity(uniqueId, {
        insideRepId: repId,
        insideRepName: repName,
      });
    } else {
      updateResolvingEntity(uniqueId, {
        outsideRepId: repId,
        outsideRepName: repName,
      });
    }
  }, [updateResolvingEntity]);

  // Update factory selection (for Products)
  const handleUpdateFactory = useCallback((
    uniqueId: string,
    factoryId: string | null,
    factoryName: string | null
  ) => {
    updateResolvingEntity(uniqueId, {
      factoryId,
      factoryName,
    });
  }, [updateResolvingEntity]);

  // Toggle selection of an entity for bulk actions
  const handleToggleSelection = useCallback((uniqueId: string) => {
    setResolvingEntities(prev =>
      prev.map(entity =>
        entity.uniqueId === uniqueId
          ? { ...entity, isSelected: !entity.isSelected }
          : entity
      )
    );
  }, []);

  // Select all entities that have suggestions (for bulk actions)
  const handleSelectAll = useCallback((selectAll: boolean) => {
    setResolvingEntities(prev =>
      prev.map(entity => ({
        ...entity,
        // Only select entities that have suggestions and are not already resolved
        isSelected: selectAll && (entity.suggestions?.length ?? 0) > 0 && !entity.isCreatingNew && !entity.selectedEntityId,
      }))
    );
  }, []);

  // Auto-select highest confidence suggestion for all selected entities
  const handleAutoSelectBestMatches = useCallback(() => {
    setResolvingEntities(prev =>
      prev.map(entity => {
        // Only process selected entities with suggestions
        if (!entity.isSelected || !entity.suggestions || entity.suggestions.length === 0) {
          return entity;
        }

        // Find the suggestion with highest confidence
        const bestSuggestion = entity.suggestions.reduce((best, current) =>
          current.confidenceScore > best.confidenceScore ? current : best
        );

        return {
          ...entity,
          selectedEntityId: bestSuggestion.id,
          selectedEntityName: bestSuggestion.title,
          isResolved: true,
          isSelected: false, // Deselect after auto-matching
        };
      })
    );
  }, []);

  // Get count of selected entities
  const selectedCount = resolvingEntities.filter(e => e.isSelected).length;

  // Get count of entities that can be selected (have suggestions and not already resolved)
  const selectableCount = resolvingEntities.filter(
    e => (e.suggestions?.length ?? 0) > 0 && !e.isCreatingNew && !e.selectedEntityId
  ).length;

  // Get rep/factory requirements for a given entity type
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

  // Check if all entities are resolved
  const allResolved = resolvingEntities.length > 0 && resolvingEntities.every(entity => {
    if (entity.isCreatingNew) {
      // For creating new, need name and appropriate reps/factory based on entity type
      const repReqs = getRepRequirements(entity.entityType);
      if (repReqs.outsideRepRequired && !entity.outsideRepId) return false;
      if (repReqs.insideRepRequired && !entity.insideRepId) return false;
      if (repReqs.factoryRequired && !entity.factoryId) return false;
      return entity.newEntityName.trim().length > 0;
    }
    // For selecting existing, need selected entity
    return !!entity.selectedEntityId;
  });

  // Build response entities for mutation
  const buildResponseEntities = useCallback((): ResponseEntity[] => {
    return resolvingEntities.map(entity => {
      // Use address object format (without internal_uuid) for the API
      const address = buildAddressObjectFromExtra(entity.extra);

      return {
        originalTitle: entity.originalSearchTerm || '',
        entityType: entity.entityType,
        dtoId: entity.dtoId,
        address,
        correctedTitle: entity.isCreatingNew ? entity.newEntityName : (entity.selectedEntityName || ''),
        id: entity.isCreatingNew ? '' : (entity.selectedEntityId || ''),
      };
    });
  }, [resolvingEntities, buildAddressObjectFromExtra]);

  // Submit resolution
  const handleSubmit = useCallback(async () => {
    if (!fileUploadProcessId || !allResolved) {
      toast.error('Please resolve all entities before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const responseEntities = buildResponseEntities();

      console.log('📤 Submitting entity resolution:', {
        fileUploadProcessId,
        responseEntities,
      });

      const result = await flowrmsApiApolloClient.mutate<ContinueWorkflowResponse>({
        mutation: M_CONTINUE_WORKFLOW,
        variables: {
          fileUploadProcessId,
          responseEntities,
        },
      });

      console.log('📤 Continue workflow result:', result.data);

      if (result.data?.continueWorkflow) {
        toast.success('Entity resolution submitted successfully');
        // Show loading while we wait for status update
        setIsLoading(true);

        // Clear existing entities so new ones will be properly initialized
        setResolvingEntities([]);

        // Restart the subscription to get the updated status
        stopSubscription();
        // Small delay to ensure the backend has processed the continue workflow
        setTimeout(() => {
          startSubscription();
        }, 500);
      } else {
        throw new Error('No response from continueWorkflow');
      }
    } catch (error) {
      console.error('Error submitting entity resolution:', error);
      toast.error('Failed to submit entity resolution');
      setIsSubmitting(false);
    }
  }, [fileUploadProcessId, allResolved, buildResponseEntities, stopSubscription, startSubscription]);

  return {
    // State
    resolvingEntities,
    processStatus,
    isLoading,
    isSubmitting,
    subscriptionActive,
    error,
    allResolved,
    selectedCount,
    selectableCount,

    // Entity helpers
    getEntityTypeLabel,
    buildAddressFromExtra,
    mapEntityTypeForSearch,

    // Actions
    handleSearchEntities,
    handleSearchUsers,
    handleSelectEntity,
    handleToggleCreateNew,
    handleUpdateNewEntityName,
    handleUpdateRep,
    handleUpdateFactory,
    handleSubmit,

    // Selection actions for bulk operations
    handleToggleSelection,
    handleSelectAll,
    handleAutoSelectBestMatches,

    // Subscription control
    startSubscription,
    stopSubscription,
  };
}






import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  Q_GET_PENDING_ENTITIES,
  Q_GET_ALL_PENDING_ENTITIES,
  Q_SEARCH_EXISTING_ENTITIES,
  Q_USER_SEARCH,
  M_CONFIRM_ENTITY_MATCH,
  M_BULK_CONFIRM_ENTITIES,
  M_CREATE_NEW_ENTITY,
  M_TRIGGER_PENDING_ENTITIES_BY_FACTORY,
} from '@/lib/flow-ai/gql';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import type {
  PendingEntity,
  PendingEntityType,
  EntityStep,
  FilterType,
  BulkConfirmAction,
  SearchEntity,
  StepStatus,
} from '@/components/flow-ai/types/entity-matching';
import {
  stepToEntityType,
  statusToFilterType,
  isResolved,
  needsAction,
} from '@/components/flow-ai/types/entity-matching';
import type { DocumentType } from '@/components/flow-ai/flowrms/entity-matching/EntityStepNavigation';

// Type for pending entities response
interface PendingEntitiesResponse {
  pendingEntities: PendingEntity[];
}

// Type for all pending entities response (single query)
interface AllPendingEntitiesResponse {
  factories: PendingEntity[];
  customers: PendingEntity[];
  billToCustomers: PendingEntity[];
  endUsers: PendingEntity[];
  products: PendingEntity[];
  orders: PendingEntity[];
  invoices: PendingEntity[];
  credits: PendingEntity[];
  adjustments: PendingEntity[];
}

// Type for search response
interface SearchEntitiesResponse {
  searchExistingEntities: SearchEntity[];
}

// Type for confirm mutation response
interface ConfirmEntityResponse {
  confirmEntityMatch: PendingEntity;
}

// Type for bulk confirm mutation response
interface BulkConfirmResponse {
  bulkConfirmEntities: PendingEntity[];
}

// Type for create new entity mutation response
interface CreateNewEntityResponse {
  createNewEntity: PendingEntity;
}

// Type for user search result
export interface UserResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

// Type for user search response
interface UserSearchResponse {
  userSearch: UserResult[];
}

// Type for createExtraFields in mutations
// - Customers/End Users: outsideRepId required, insideRepId optional
// - Factories: insideRepId required only
// - Products: factoryId required
export interface CreateExtraFields {
  insideRepId?: string;
  outsideRepId?: string;
  factoryId?: string;
}

// Type for trigger pending entities by factory response
interface TriggerPendingEntitiesByFactoryResponse {
  triggerPendingEntitiesByFactory: PendingEntity[];
}

export interface UseEntityMatchingOptions {
  pendingDocumentId: string | null;
  documentType?: DocumentType;
}

export function useEntityMatching({ pendingDocumentId, documentType }: UseEntityMatchingOptions) {
  // Entity state by type
  const [factories, setFactories] = useState<PendingEntity[]>([]);
  const [customers, setCustomers] = useState<PendingEntity[]>([]);
  const [billToCustomers, setBillToCustomers] = useState<PendingEntity[]>([]);
  const [endUsers, setEndUsers] = useState<PendingEntity[]>([]);
  const [products, setProducts] = useState<PendingEntity[]>([]);
  const [orders, setOrders] = useState<PendingEntity[]>([]);
  const [invoices, setInvoices] = useState<PendingEntity[]>([]);
  const [credits, setCredits] = useState<PendingEntity[]>([]);
  const [adjustments, setAdjustments] = useState<PendingEntity[]>([]);

  // Track which steps have been loaded
  const [loadedSteps, setLoadedSteps] = useState<Set<EntityStep>>(new Set());

  // Track factory-based entities loading state
  const [factoryEntitiesLoading, setFactoryEntitiesLoading] = useState(false);
  const [factoryEntitiesLoaded, setFactoryEntitiesLoaded] = useState(false);
  // Track the factory ID that was used to load entities (to prevent reloading with same factory)
  const loadedFactoryIdRef = useRef<string | null>(null);

  // UI state
  const [currentStep, setCurrentStep] = useState<EntityStep>('factories');
  // Default filters exclude 'auto-matched' to hide auto-matched entities by default
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(
    new Set(['needs-review', 'pending', 'confirmed', 'no-match'])
  );
  const [createNewMode, setCreateNewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState<Set<string>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);
  const [bulkConfirmLoading, setBulkConfirmLoading] = useState(false);

  // Track if component is mounted
  const mountedRef = useRef(true);

  // Direct query function - adds originalIndex for stable sorting
  const fetchEntities = useCallback(
    async (entityType: PendingEntityType, docId: string): Promise<PendingEntity[]> => {
      try {
        console.log(`Fetching entities for ${entityType}...`);
        const result = await flowrmsApolloClient.query<PendingEntitiesResponse>({
          query: Q_GET_PENDING_ENTITIES,
          variables: {
            filterInput: {
              entityType,
              pendingDocumentId: docId,
            },
          },
          fetchPolicy: 'network-only',
        });
        console.log(`Fetched ${result.data?.pendingEntities?.length || 0} entities for ${entityType}`);
        // Add originalIndex to each entity for stable sorting
        const entities = result.data?.pendingEntities || [];
        return entities.map((entity, index) => ({
          ...entity,
          originalIndex: index,
        }));
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Request aborted for', entityType);
          return [];
        }
        console.error(`Error fetching ${entityType}:`, error);
        throw error;
      }
    },
    []
  );

  // Load ALL entities on mount using a single GraphQL query
  const loadAllEntities = useCallback(async () => {
    if (!pendingDocumentId) return;

    setIsLoading(true);
    try {
      console.log('Loading all entity types in single query...');

      // Single query to fetch all entity types at once
      const result = await flowrmsApolloClient.query<AllPendingEntitiesResponse>({
        query: Q_GET_ALL_PENDING_ENTITIES,
        variables: { pendingDocumentId },
        fetchPolicy: 'network-only',
      });

      if (!mountedRef.current) return;

      // Add originalIndex to each entity for stable sorting
      const addOriginalIndex = (entities: PendingEntity[]) =>
        entities.map((entity, index) => ({ ...entity, originalIndex: index }));

      const factoriesData = addOriginalIndex(result.data?.factories || []);
      const customersData = addOriginalIndex(result.data?.customers || []);
      const billToCustomersData = addOriginalIndex(result.data?.billToCustomers || []);
      const endUsersData = addOriginalIndex(result.data?.endUsers || []);
      const productsData = addOriginalIndex(result.data?.products || []);
      const ordersData = addOriginalIndex(result.data?.orders || []);
      const invoicesData = addOriginalIndex(result.data?.invoices || []);
      const creditsData = addOriginalIndex(result.data?.credits || []);
      const adjustmentsData = addOriginalIndex(result.data?.adjustments || []);

      console.log('Loaded entities:', {
        factories: factoriesData.length,
        customers: customersData.length,
        billToCustomers: billToCustomersData.length,
        endUsers: endUsersData.length,
        products: productsData.length,
        orders: ordersData.length,
        invoices: invoicesData.length,
        credits: creditsData.length,
        adjustments: adjustmentsData.length,
      });

      setFactories(factoriesData);
      setCustomers(customersData);
      setBillToCustomers(billToCustomersData);
      setEndUsers(endUsersData);
      setProducts(productsData);
      setOrders(ordersData);
      setInvoices(invoicesData);
      setCredits(creditsData);
      setAdjustments(adjustmentsData);

      // Mark all steps as loaded
      setLoadedSteps(new Set(['factories', 'customers', 'billtocustomers', 'endusers', 'products', 'orders', 'invoices', 'credits', 'adjustments']));
      setInitialLoadComplete(true);
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error loading entities:', error);
      toast.error('Failed to load entities');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [pendingDocumentId]);

  // Load all entities on mount
  useEffect(() => {
    mountedRef.current = true;

    if (pendingDocumentId && !initialLoadComplete) {
      loadAllEntities();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [pendingDocumentId, initialLoadComplete, loadAllEntities]);

  // Reset state when pendingDocumentId changes
  useEffect(() => {
    setLoadedSteps(new Set());
    setFactories([]);
    setCustomers([]);
    setBillToCustomers([]);
    setEndUsers([]);
    setProducts([]);
    setOrders([]);
    setInvoices([]);
    setCredits([]);
    setAdjustments([]);
    setInitialLoadComplete(false);
    setFactoryEntitiesLoaded(false);
    loadedFactoryIdRef.current = null;
  }, [pendingDocumentId]);

  // Compute if factory is matched (any factory entity has CONFIRMED or AUTO_MATCHED status with a bestMatchId)
  const isFactoryMatched = useMemo(() => {
    return factories.some(
      (f) => (f.confirmationStatus === 'CONFIRMED' || f.confirmationStatus === 'AUTO_MATCHED') && f.bestMatchId
    );
  }, [factories]);

  // Get the matched factory ID (first confirmed or auto-matched factory with bestMatchId)
  const matchedFactoryId = useMemo(() => {
    const matchedFactory = factories.find(
      (f) => (f.confirmationStatus === 'CONFIRMED' || f.confirmationStatus === 'AUTO_MATCHED') && f.bestMatchId
    );
    return matchedFactory?.bestMatchId || null;
  }, [factories]);

  // Load entities by factory (Orders, Invoices, Credits, Adjustments) when factory is matched
  // This is only used for CHECKS and INVOICES document types
  const loadEntitiesByFactory = useCallback(async (factoryId: string) => {
    if (!pendingDocumentId || !factoryId) return;

    // Prevent reloading with the same factory
    if (loadedFactoryIdRef.current === factoryId) {
      console.log('Factory entities already loaded for this factory');
      return;
    }

    const normalizedDocType = documentType?.toUpperCase();

    // Only applicable for CHECKS and INVOICES
    if (normalizedDocType !== 'CHECKS' && normalizedDocType !== 'INVOICES') {
      return;
    }

    setFactoryEntitiesLoading(true);

    try {
      // Determine which entity types to load based on document type
      const entityTypes: string[] = normalizedDocType === 'CHECKS'
        ? ['ORDERS', 'INVOICES', 'CREDITS', 'ADJUSTMENTS']
        : ['ORDERS']; // INVOICES document type only needs Orders

      console.log(`Loading factory-based entities for ${normalizedDocType}:`, entityTypes);

      const result = await flowrmsApolloClient.mutate<TriggerPendingEntitiesByFactoryResponse>({
        mutation: M_TRIGGER_PENDING_ENTITIES_BY_FACTORY,
        variables: {
          input: {
            pendingDocumentId,
            entityTypes,
            factoryId,
          },
        },
      });

      if (!mountedRef.current) return;

      const responseEntities = result.data?.triggerPendingEntitiesByFactory || [];

      // Add originalIndex to each entity for stable sorting
      const addOriginalIndex = (entities: PendingEntity[]) =>
        entities.map((entity, index) => ({ ...entity, originalIndex: index }));

      // Group entities by type
      const ordersData = addOriginalIndex(
        responseEntities.filter((e) => e.entityType === 'ORDERS')
      );
      const invoicesData = addOriginalIndex(
        responseEntities.filter((e) => e.entityType === 'INVOICES')
      );
      const creditsData = addOriginalIndex(
        responseEntities.filter((e) => e.entityType === 'CREDITS')
      );
      const adjustmentsData = addOriginalIndex(
        responseEntities.filter((e) => e.entityType === 'ADJUSTMENTS')
      );

      console.log('Factory-based entities loaded:', {
        orders: ordersData.length,
        invoices: invoicesData.length,
        credits: creditsData.length,
        adjustments: adjustmentsData.length,
      });

      // Update state with the loaded entities
      setOrders(ordersData);
      if (normalizedDocType === 'CHECKS') {
        setInvoices(invoicesData);
        setCredits(creditsData);
        setAdjustments(adjustmentsData);
      }

      // Mark factory entities as loaded and track which factory was used
      setFactoryEntitiesLoaded(true);
      loadedFactoryIdRef.current = factoryId;

      // Update loaded steps
      setLoadedSteps((prev) => {
        const newSteps = new Set(prev);
        newSteps.add('orders');
        if (normalizedDocType === 'CHECKS') {
          newSteps.add('invoices');
          newSteps.add('credits');
          newSteps.add('adjustments');
        }
        return newSteps;
      });

      toast.success('Factory-related entities loaded');
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('Error loading factory-based entities:', error);
      toast.error('Failed to load factory-related entities');
    } finally {
      if (mountedRef.current) {
        setFactoryEntitiesLoading(false);
      }
    }
  }, [pendingDocumentId, documentType]);

  // Auto-load factory-based entities when factory becomes matched
  useEffect(() => {
    if (isFactoryMatched && matchedFactoryId && !factoryEntitiesLoaded && !factoryEntitiesLoading) {
      const normalizedDocType = documentType?.toUpperCase();
      if (normalizedDocType === 'CHECKS' || normalizedDocType === 'INVOICES') {
        loadEntitiesByFactory(matchedFactoryId);
      }
    }
  }, [isFactoryMatched, matchedFactoryId, factoryEntitiesLoaded, factoryEntitiesLoading, documentType, loadEntitiesByFactory]);

  // Get entities for current step
  const getEntitiesByStep = useCallback(
    (step: EntityStep): PendingEntity[] => {
      switch (step) {
        case 'factories':
          return factories;
        case 'customers':
          return customers;
        case 'billtocustomers':
          return billToCustomers;
        case 'endusers':
          return endUsers;
        case 'products':
          return products;
        case 'orders':
          return orders;
        case 'invoices':
          return invoices;
        case 'credits':
          return credits;
        case 'adjustments':
          return adjustments;
      }
    },
    [factories, customers, billToCustomers, endUsers, products, orders, invoices, credits, adjustments]
  );

  // Set entities by step
  const setEntitiesByStep = useCallback(
    (step: EntityStep, entities: PendingEntity[] | ((prev: PendingEntity[]) => PendingEntity[])) => {
      switch (step) {
        case 'factories':
          setFactories(entities as PendingEntity[]);
          break;
        case 'customers':
          setCustomers(entities as PendingEntity[]);
          break;
        case 'billtocustomers':
          setBillToCustomers(entities as PendingEntity[]);
          break;
        case 'endusers':
          setEndUsers(entities as PendingEntity[]);
          break;
        case 'products':
          setProducts(entities as PendingEntity[]);
          break;
        case 'orders':
          setOrders(entities as PendingEntity[]);
          break;
        case 'invoices':
          setInvoices(entities as PendingEntity[]);
          break;
        case 'credits':
          setCredits(entities as PendingEntity[]);
          break;
        case 'adjustments':
          setAdjustments(entities as PendingEntity[]);
          break;
      }
    },
    []
  );

  // Get current step entity type
  const getCurrentEntityType = useCallback((): PendingEntityType => {
    return stepToEntityType[currentStep];
  }, [currentStep]);

  // Filter entities based on active filters and createNewMode
  const currentStepEntities = useMemo(() => {
    return getEntitiesByStep(currentStep);
  }, [currentStep, getEntitiesByStep]);

  const getCurrentEntities = useCallback((): PendingEntity[] => {
    let entities = currentStepEntities;

    if (createNewMode) {
      // In create new mode, show only entities needing review or without matches
      entities = entities.filter(
        (e) =>
          e.confirmationStatus === 'NEEDS_REVIEW' ||
          e.confirmationStatus === 'PENDING_REVIEW' ||
          e.confirmationStatus === 'REJECTED' ||
          !e.bestMatchId
      );
    } else {
      // Filter by active filters
      entities = entities.filter((e) => {
        const filterType = statusToFilterType[e.confirmationStatus];

        // First, check by status-based filter
        if (activeFilters.has(filterType)) {
          return true;
        }

        // For entities with NO match candidates at all, check 'no-match' filter
        // But only if they don't match their status-based filter
        if (e.matchCandidates.length === 0 && e.confirmationStatus !== 'CREATED_NEW') {
          return activeFilters.has('no-match');
        }

        return false;
      });
    }

    // Stable sort: needs attention first (not completed/rejected), then by original index
    // This prevents reordering when user makes selections or changes
    return [...entities].sort((a, b) => {
      const aResolved = isResolved(a.confirmationStatus);
      const bResolved = isResolved(b.confirmationStatus);

      // Unresolved items come first
      if (aResolved !== bResolved) {
        return aResolved ? 1 : -1;
      }

      // Within the same resolved/unresolved group, maintain original order
      return (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
    });
  }, [currentStepEntities, createNewMode, activeFilters]);

  // Toggle filter
  const toggleFilter = useCallback((filter: FilterType) => {
    setActiveFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  }, []);

  // Toggle entity selection
  const handleToggleSelect = useCallback(
    (entityId: string) => {
      const updateFn = (entities: PendingEntity[]) =>
        entities.map((e) =>
          e.id === entityId ? { ...e, selected: !e.selected } : e
        );

      switch (currentStep) {
        case 'factories':
          setFactories(updateFn);
          break;
        case 'customers':
          setCustomers(updateFn);
          break;
        case 'billtocustomers':
          setBillToCustomers(updateFn);
          break;
        case 'endusers':
          setEndUsers(updateFn);
          break;
        case 'products':
          setProducts(updateFn);
          break;
        case 'orders':
          setOrders(updateFn);
          break;
        case 'invoices':
          setInvoices(updateFn);
          break;
        case 'credits':
          setCredits(updateFn);
          break;
        case 'adjustments':
          setAdjustments(updateFn);
          break;
      }
    },
    [currentStep]
  );

  // Helper to check if entity is locked (cannot be selected)
  const isEntityLocked = useCallback((entity: PendingEntity): boolean => {
    return entity.confirmationStatus === 'CONFIRMED' ||
           entity.confirmationStatus === 'REJECTED' ||
           entity.confirmationStatus === 'CREATED_NEW' ||
           entity.confirmationStatus === 'SKIPPED' ||
           entity.confirmationStatus === 'SET_FOR_CREATION';
  }, []);

  // Select all entities in current view (only selectable ones)
  const handleSelectAll = useCallback(() => {
    const currentEntities = getCurrentEntities();
    // Only consider selectable (non-locked) entities
    const selectableEntities = currentEntities.filter(e => !isEntityLocked(e));
    const selectableIds = new Set(selectableEntities.map((e) => e.id));
    const allSelected = selectableEntities.length > 0 && selectableEntities.every((e) => e.selected);

    const updateFn = (entities: PendingEntity[]) =>
      entities.map((e) =>
        selectableIds.has(e.id) ? { ...e, selected: !allSelected } : e
      );

    switch (currentStep) {
      case 'factories':
        setFactories(updateFn);
        break;
      case 'customers':
        setCustomers(updateFn);
        break;
      case 'billtocustomers':
        setBillToCustomers(updateFn);
        break;
      case 'endusers':
        setEndUsers(updateFn);
        break;
      case 'products':
        setProducts(updateFn);
        break;
      case 'orders':
        setOrders(updateFn);
        break;
      case 'invoices':
        setInvoices(updateFn);
        break;
      case 'credits':
        setCredits(updateFn);
        break;
      case 'adjustments':
        setAdjustments(updateFn);
        break;
    }
  }, [currentStep, getCurrentEntities, isEntityLocked]);

  // Confirm a single entity match
  const handleConfirmMatch = useCallback(
    async (pendingEntityId: string, existingEntityId: string, existingEntityName: string) => {
      setLoadingEntities((prev) => new Set(prev).add(pendingEntityId));
      try {
        const result = await flowrmsApolloClient.mutate<ConfirmEntityResponse>({
          mutation: M_CONFIRM_ENTITY_MATCH,
          variables: {
            input: { pendingEntityId, existingEntityId, existingEntityName },
          },
        });

        if (result.data?.confirmEntityMatch) {
          const updatedEntity = result.data.confirmEntityMatch;
          const updateFn = (entities: PendingEntity[]) =>
            entities.map((e) =>
              e.id === pendingEntityId
                ? { ...updatedEntity, selected: false, originalIndex: e.originalIndex }
                : e
            );

          switch (currentStep) {
            case 'factories':
              setFactories(updateFn);
              break;
            case 'customers':
              setCustomers(updateFn);
              break;
            case 'billtocustomers':
              setBillToCustomers(updateFn);
              break;
            case 'endusers':
              setEndUsers(updateFn);
              break;
            case 'products':
              setProducts(updateFn);
              break;
            case 'orders':
              setOrders(updateFn);
              break;
            case 'invoices':
              setInvoices(updateFn);
              break;
            case 'credits':
              setCredits(updateFn);
              break;
            case 'adjustments':
              setAdjustments(updateFn);
              break;
          }
          toast.success('Match confirmed');
        }
      } catch (error) {
        console.error('Error confirming match:', error);
        toast.error('Failed to confirm match');
      } finally {
        setLoadingEntities((prev) => {
          const next = new Set(prev);
          next.delete(pendingEntityId);
          return next;
        });
      }
    },
    [currentStep]
  );

  // Bulk action on selected entities
  const handleBulkAction = useCallback(
    async (action: BulkConfirmAction, createExtraFields?: CreateExtraFields) => {
      const currentEntities = getCurrentEntities();
      let selectedEntities = currentEntities.filter((e) => e.selected);

      if (selectedEntities.length === 0) {
        toast.error('No entities selected');
        return;
      }

      // For MATCH_EXISTING, filter out entities without bestMatchId or matchCandidates (required by API)
      if (action === 'MATCH_EXISTING') {
        // An entity can be approved if it has either:
        // 1. A bestMatchId already set, OR
        // 2. matchCandidates available (we'll use the first/best one)
        const entitiesWithMatch = selectedEntities.filter(
          (e) => e.bestMatchId || (e.matchCandidates && e.matchCandidates.length > 0)
        );
        const skippedCount = selectedEntities.length - entitiesWithMatch.length;
        if (skippedCount > 0) {
          toast.warning(`${skippedCount} entities skipped (no match available)`);
        }
        if (entitiesWithMatch.length === 0) {
          toast.error('No entities with matches to approve');
          return;
        }
        selectedEntities = entitiesWithMatch;
      }

      // Build inputs for bulk mutation
      const inputs = selectedEntities.map((entity) => {
        // Get the selected match ID - this is the entity selected in the dropdown
        // bestMatchId is updated when user selects from dropdown or search
        const selectedMatchId = entity.bestMatchId ||
          (entity.matchCandidates && entity.matchCandidates.length > 0
            ? entity.matchCandidates[0].entityId
            : null);

        // Get the selected match name - from bestMatchName or lookup from candidates
        let selectedMatchName = entity.bestMatchName;
        if (!selectedMatchName && selectedMatchId) {
          const candidate = entity.matchCandidates.find(c => c.entityId === selectedMatchId);
          selectedMatchName = candidate?.name || null;
        }

        const input: {
          pendingEntityId: string;
          action: BulkConfirmAction;
          existingEntityId?: string;
          existingEntityName?: string;
          flowIndex?: number;
          fieldOverrides?: string;
          createExtraFields?: CreateExtraFields;
        } = {
          pendingEntityId: entity.id,
          action,
        };

        // Always include existingEntityId and existingEntityName when available
        if (selectedMatchId) {
          input.existingEntityId = selectedMatchId;
        }
        if (selectedMatchName) {
          input.existingEntityName = selectedMatchName;
        }

        // Include flowIndex from flowIndexDetail (parse as integer)
        if (entity.flowIndexDetail !== null && entity.flowIndexDetail !== undefined) {
          const flowIndexNum = parseInt(String(entity.flowIndexDetail), 10);
          if (!isNaN(flowIndexNum)) {
            input.flowIndex = flowIndexNum;
          }
        }

        // Include createExtraFields for CREATE_NEW action (inside/outside rep)
        if (action === 'CREATE_NEW' && createExtraFields) {
          input.createExtraFields = createExtraFields;
        }

        return input;
      });

      setBulkConfirmLoading(true);
      try {
        const result = await flowrmsApolloClient.mutate<BulkConfirmResponse>({
          mutation: M_BULK_CONFIRM_ENTITIES,
          variables: { inputs },
        });

        if (result.data?.bulkConfirmEntities) {
          const updatedEntities = result.data.bulkConfirmEntities;
          const updatedMap = new Map<string, PendingEntity>(
            updatedEntities.map((e) => [e.id, e])
          );

          // Preserve originalIndex when updating entities
          const updateFn = (entities: PendingEntity[]): PendingEntity[] =>
            entities.map((e): PendingEntity =>
              updatedMap.has(e.id)
                ? { ...updatedMap.get(e.id)!, selected: false, originalIndex: e.originalIndex }
                : e
            );

          switch (currentStep) {
            case 'factories':
              setFactories(updateFn);
              break;
            case 'customers':
              setCustomers(updateFn);
              break;
            case 'billtocustomers':
              setBillToCustomers(updateFn);
              break;
            case 'endusers':
              setEndUsers(updateFn);
              break;
            case 'products':
              setProducts(updateFn);
              break;
            case 'orders':
              setOrders(updateFn);
              break;
            case 'invoices':
              setInvoices(updateFn);
              break;
            case 'credits':
              setCredits(updateFn);
              break;
            case 'adjustments':
              setAdjustments(updateFn);
              break;
          }

          const actionLabel =
            action === 'MATCH_EXISTING'
              ? 'approved'
              : action === 'CREATE_NEW'
              ? 'marked for creation'
              : action === 'SKIP'
              ? 'skipped'
              : action === 'SET_FOR_CREATION'
              ? 'set for creation'
              : 'rejected';
          toast.success(
            `${selectedEntities.length} ${
              selectedEntities.length === 1 ? 'entity' : 'entities'
            } ${actionLabel}`
          );
        }
      } catch (error) {
        console.error('Error performing bulk action:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check for duplicate key error
        if (errorMessage.includes('duplicate key') || errorMessage.includes('UniqueViolation') || errorMessage.includes('already exists')) {
          const nameMatch = errorMessage.match(/Key \([^)]+\)=\(([^)]+)\)/);
          const entityName = nameMatch ? nameMatch[1] : 'An entity';
          toast.error(`"${entityName}" already exists. Please remove it from selection or match to existing.`);
        } else {
          toast.error('Failed to perform bulk action');
        }
      } finally {
        setBulkConfirmLoading(false);
      }
    },
    [getCurrentEntities, currentStep]
  );

  // Convenience methods for bulk actions
  const handleBulkApprove = useCallback(
    () => handleBulkAction('MATCH_EXISTING'),
    [handleBulkAction]
  );

  const handleBulkCreateNew = useCallback(
    (createExtraFields?: CreateExtraFields) => handleBulkAction('CREATE_NEW', createExtraFields),
    [handleBulkAction]
  );

  const handleBulkReject = useCallback(
    () => handleBulkAction('REJECT'),
    [handleBulkAction]
  );

  const handleBulkSkip = useCallback(
    () => handleBulkAction('SKIP'),
    [handleBulkAction]
  );

  const handleBulkSetForCreation = useCallback(
    () => handleBulkAction('SET_FOR_CREATION'),
    [handleBulkAction]
  );

  // Handle single entity action (Skip, Set for Creation) - no checkbox selection needed
  const handleSingleAction = useCallback(
    async (entityId: string, action: BulkConfirmAction) => {
      const currentEntities = getCurrentEntities();
      const entity = currentEntities.find(e => e.id === entityId);

      if (!entity) {
        toast.error('Entity not found');
        return;
      }

      setLoadingEntities((prev) => new Set(prev).add(entityId));

      try {
        // Build input for the single entity
        const input: {
          pendingEntityId: string;
          action: BulkConfirmAction;
          existingEntityId?: string;
          existingEntityName?: string;
          flowIndex?: number;
        } = {
          pendingEntityId: entity.id,
          action,
        };

        // Include match info if available
        if (entity.bestMatchId) {
          input.existingEntityId = entity.bestMatchId;
        }
        if (entity.bestMatchName) {
          input.existingEntityName = entity.bestMatchName;
        }

        // Include flowIndex from flowIndexDetail
        if (entity.flowIndexDetail !== null && entity.flowIndexDetail !== undefined) {
          const flowIndexNum = parseInt(String(entity.flowIndexDetail), 10);
          if (!isNaN(flowIndexNum)) {
            input.flowIndex = flowIndexNum;
          }
        }

        const result = await flowrmsApolloClient.mutate<BulkConfirmResponse>({
          mutation: M_BULK_CONFIRM_ENTITIES,
          variables: { inputs: [input] },
        });

        if (result.data?.bulkConfirmEntities && result.data.bulkConfirmEntities.length > 0) {
          const updatedEntity = result.data.bulkConfirmEntities[0];

          // Preserve originalIndex when updating entity
          const updateFn = (entities: PendingEntity[]): PendingEntity[] =>
            entities.map((e): PendingEntity =>
              e.id === entityId
                ? { ...updatedEntity, selected: false, originalIndex: e.originalIndex }
                : e
            );

          switch (currentStep) {
            case 'factories':
              setFactories(updateFn);
              break;
            case 'customers':
              setCustomers(updateFn);
              break;
            case 'billtocustomers':
              setBillToCustomers(updateFn);
              break;
            case 'endusers':
              setEndUsers(updateFn);
              break;
            case 'products':
              setProducts(updateFn);
              break;
            case 'orders':
              setOrders(updateFn);
              break;
            case 'invoices':
              setInvoices(updateFn);
              break;
            case 'credits':
              setCredits(updateFn);
              break;
            case 'adjustments':
              setAdjustments(updateFn);
              break;
          }

          const actionLabel =
            action === 'SKIP' ? 'skipped' :
            action === 'SET_FOR_CREATION' ? 'set for creation' :
            action === 'REJECT' ? 'rejected' : 'updated';
          toast.success(`Entity ${actionLabel}`);
        }
      } catch (error) {
        console.error('Error performing action:', error);
        toast.error('Failed to perform action');
      } finally {
        setLoadingEntities((prev) => {
          const next = new Set(prev);
          next.delete(entityId);
          return next;
        });
      }
    },
    [getCurrentEntities, currentStep]
  );

  // Select a match for an entity (local state only - does NOT call API)
  // Use this for dropdown selection - actual confirmation happens via bulk/approve buttons
  const handleSelectMatch = useCallback(
    (entityId: string, matchEntityId: string) => {
      const updateFn = (entities: PendingEntity[]) =>
        entities.map((e) => {
          if (e.id !== entityId) return e;
          // Find the selected match candidate to get its similarity score and name
          const selectedCandidate = e.matchCandidates.find(c => c.entityId === matchEntityId);
          return {
            ...e,
            bestMatchId: matchEntityId,
            bestMatchName: selectedCandidate?.name || e.bestMatchName,
            bestMatchSimilarity: selectedCandidate?.similarityScore || e.bestMatchSimilarity,
          };
        });

      switch (currentStep) {
        case 'factories':
          setFactories(updateFn);
          break;
        case 'customers':
          setCustomers(updateFn);
          break;
        case 'billtocustomers':
          setBillToCustomers(updateFn);
          break;
        case 'endusers':
          setEndUsers(updateFn);
          break;
        case 'products':
          setProducts(updateFn);
          break;
        case 'orders':
          setOrders(updateFn);
          break;
        case 'invoices':
          setInvoices(updateFn);
          break;
        case 'credits':
          setCredits(updateFn);
          break;
        case 'adjustments':
          setAdjustments(updateFn);
          break;
      }
    },
    [currentStep]
  );

  // Select a match from search results - adds the result to matchCandidates if not present
  const handleSelectFromSearch = useCallback(
    (entityId: string, searchResult: { entityId: string; name: string; similarityScore: number }) => {
      const updateFn = (entities: PendingEntity[]) =>
        entities.map((e) => {
          if (e.id !== entityId) return e;

          // Check if this match already exists in candidates
          const existingCandidate = e.matchCandidates.find(c => c.entityId === searchResult.entityId);

          // If not in candidates, add it
          const updatedCandidates = existingCandidate
            ? e.matchCandidates
            : [
                {
                  entityId: searchResult.entityId,
                  name: searchResult.name,
                  similarityScore: searchResult.similarityScore,
                  rank: 0,
                  metadata: null,
                },
                ...e.matchCandidates,
              ];

          return {
            ...e,
            bestMatchId: searchResult.entityId,
            bestMatchName: searchResult.name,
            bestMatchSimilarity: searchResult.similarityScore,
            matchCandidates: updatedCandidates,
          };
        });

      switch (currentStep) {
        case 'factories':
          setFactories(updateFn);
          break;
        case 'customers':
          setCustomers(updateFn);
          break;
        case 'billtocustomers':
          setBillToCustomers(updateFn);
          break;
        case 'endusers':
          setEndUsers(updateFn);
          break;
        case 'products':
          setProducts(updateFn);
          break;
        case 'orders':
          setOrders(updateFn);
          break;
        case 'invoices':
          setInvoices(updateFn);
          break;
        case 'credits':
          setCredits(updateFn);
          break;
        case 'adjustments':
          setAdjustments(updateFn);
          break;
      }
    },
    [currentStep]
  );

  // Select an alternative match for an entity (calls API to confirm)
  const handleSelectAlternative = useCallback(
    async (entityId: string, alternativeEntityId: string, alternativeEntityName: string) => {
      await handleConfirmMatch(entityId, alternativeEntityId, alternativeEntityName);
    },
    [handleConfirmMatch]
  );

  // Create a new entity (single entity)
  const handleCreateNew = useCallback(
    async (
      pendingEntityId: string,
      fieldOverrides?: Record<string, unknown>,
      flowIndex?: number,
      createExtraFields?: CreateExtraFields
    ) => {
      setLoadingEntities((prev) => new Set(prev).add(pendingEntityId));
      try {
        // Build input with optional flowIndex and createExtraFields
        const input: {
          pendingEntityId: string;
          fieldOverrides: Record<string, unknown> | null;
          flowIndex?: number;
          createExtraFields?: CreateExtraFields;
        } = {
          pendingEntityId,
          fieldOverrides: fieldOverrides || null,
        };

        // Include flowIndex if provided
        if (flowIndex !== undefined && flowIndex !== null && !isNaN(flowIndex)) {
          input.flowIndex = flowIndex;
        }

        // Include createExtraFields if provided (for inside/outside rep)
        if (createExtraFields) {
          input.createExtraFields = createExtraFields;
        }

        const result = await flowrmsApolloClient.mutate<CreateNewEntityResponse>({
          mutation: M_CREATE_NEW_ENTITY,
          variables: { input },
        });

        if (result.data?.createNewEntity) {
          const updatedEntity = result.data.createNewEntity;
          const updateFn = (entities: PendingEntity[]) =>
            entities.map((e) =>
              e.id === pendingEntityId
                ? { ...updatedEntity, selected: false, originalIndex: e.originalIndex }
                : e
            );

          switch (currentStep) {
            case 'factories':
              setFactories(updateFn);
              break;
            case 'customers':
              setCustomers(updateFn);
              break;
            case 'billtocustomers':
              setBillToCustomers(updateFn);
              break;
            case 'endusers':
              setEndUsers(updateFn);
              break;
            case 'products':
              setProducts(updateFn);
              break;
            case 'orders':
              setOrders(updateFn);
              break;
            case 'invoices':
              setInvoices(updateFn);
              break;
            case 'credits':
              setCredits(updateFn);
              break;
            case 'adjustments':
              setAdjustments(updateFn);
              break;
          }
          toast.success('New entity created');
        }
      } catch (error) {
        console.error('Error creating new entity:', error);
        // Check for duplicate key error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('duplicate key') || errorMessage.includes('UniqueViolation') || errorMessage.includes('already exists')) {
          // Try to extract the entity name from the error message
          // Format: Key (title)=(Factory A) already exists.
          const nameMatch = errorMessage.match(/Key \([^)]+\)=\(([^)]+)\)/);
          const entityName = nameMatch ? nameMatch[1] : 'this name';
          toast.error(`"${entityName}" already exists. Please use a different name or match to the existing entity.`);
        } else {
          toast.error('Failed to create new entity');
        }
      } finally {
        setLoadingEntities((prev) => {
          const next = new Set(prev);
          next.delete(pendingEntityId);
          return next;
        });
      }
    },
    [currentStep]
  );

  // Search for existing entities
  const handleSearchEntities = useCallback(
    async (query: string, limit = 10): Promise<SearchEntity[]> => {
      // Allow empty string queries - API returns default results
      setSearchLoading(true);
      try {
        const result = await flowrmsApolloClient.query<SearchEntitiesResponse>({
          query: Q_SEARCH_EXISTING_ENTITIES,
          variables: {
            input: {
              entityType: stepToEntityType[currentStep],
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
      } finally {
        setSearchLoading(false);
      }
    },
    [currentStep]
  );

  // Search for users (inside or outside reps)
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

  // Get step status for navigation
  const getStepStatus = useCallback(
    (step: EntityStep): StepStatus => {
      const entities = getEntitiesByStep(step);
      const needsReviewCount = entities.filter(
        (e) => needsAction(e.confirmationStatus)
      ).length;
      const validated = entities.length === 0 || entities.every((e) => isResolved(e.confirmationStatus));

      return {
        validated: loadedSteps.has(step) ? validated : false,
        needsReview: needsReviewCount,
        total: entities.length,
      };
    },
    [getEntitiesByStep, loadedSteps]
  );

  // Check if all entities are validated (only for loaded steps)
  const allValidated = useMemo(() => {
    const allSteps: EntityStep[] = ['factories', 'customers', 'billtocustomers', 'endusers', 'products', 'orders', 'invoices', 'credits', 'adjustments'];

    // Check if all steps are loaded
    if (!allSteps.every(step => loadedSteps.has(step))) {
      return false;
    }

    const allEntities = [...factories, ...customers, ...billToCustomers, ...endUsers, ...products, ...orders, ...invoices, ...credits, ...adjustments];
    return allEntities.length === 0 || allEntities.every((e) => isResolved(e.confirmationStatus));
  }, [factories, customers, billToCustomers, endUsers, products, orders, invoices, credits, adjustments, loadedSteps]);

  // Refresh entities for current step
  const refreshCurrentStep = useCallback(async () => {
    if (!pendingDocumentId) return;

    setIsLoading(true);
    try {
      const entities = await fetchEntities(
        stepToEntityType[currentStep],
        pendingDocumentId
      );
      setEntitiesByStep(currentStep, entities);
    } catch (error) {
      console.error('Error refreshing entities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pendingDocumentId, currentStep, fetchEntities, setEntitiesByStep]);

  return {
    // Entity data
    factories,
    customers,
    billToCustomers,
    endUsers,
    products,
    orders,
    invoices,
    credits,
    adjustments,

    // UI state
    currentStep,
    setCurrentStep,
    activeFilters,
    toggleFilter,
    createNewMode,
    setCreateNewMode,
    isLoading,
    initialLoadComplete,
    bulkConfirmLoading,
    searchLoading,
    loadingEntities,
    loadedSteps,

    // Factory-based entities state (for CHECKS/INVOICES document types)
    isFactoryMatched,
    matchedFactoryId,
    factoryEntitiesLoading,
    factoryEntitiesLoaded,

    // Computed values
    getCurrentEntities,
    getCurrentEntityType,
    getStepStatus,
    allValidated,

    // Actions
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
    handleBulkAction,
    handleSingleAction,
    handleSelectAlternative,
    handleSearchEntities,
    handleSearchUsers,
    refreshCurrentStep,
    loadEntitiesByFactory,
  };
}






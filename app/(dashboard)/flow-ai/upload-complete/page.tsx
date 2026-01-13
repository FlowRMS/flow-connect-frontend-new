'use client';

import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  CheckCircle2,
  FileText,
  Package,
  Building2,
  Factory,
  Receipt,
  ShoppingCart,
  DollarSign,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight,
  Download,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from 'lucide-react';
import { Input } from '@/components/flow-ai/ui/input';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { toast } from 'sonner';
import { WorkflowBreadcrumb } from '@/components/flow-ai/flowrms/WorkflowBreadcrumb';
import { fetchRelatedEntities } from '@/components/lib/graphql/entity-links';
import type { RelatedEntities } from '@/components/lib/graphql/types';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Q_GET_PENDING, Q_PENDING_DOCUMENT_PROCESSINGS, M_EXECUTE_DOCUMENT_WORKFLOW } from '@/lib/flow-ai/gql';
import * as XLSX from 'xlsx';

// Constants for pagination
const DETAILS_PAGE_SIZE = 50; // Show 50 items at a time in detail tables

// Storage key for URL params persistence
const UPLOAD_COMPLETE_PARAMS_KEY = 'flowrms_upload_complete_params';

// Helper to get params from URL or sessionStorage (without side effects)
function getInitialParams(): {
  pendingId: string | null;
  source: string | null;
  needsUrlRestore: boolean;
} {
  if (typeof window === 'undefined') {
    return { pendingId: null, source: null, needsUrlRestore: false };
  }

  // Always read directly from window.location.search to avoid hydration issues
  const urlParams = new URLSearchParams(window.location.search);
  const urlPendingId = urlParams.get('pendingId');
  const urlSource = urlParams.get('source');

  if (urlPendingId) {
    const params = {
      pendingId: urlPendingId,
      source: urlSource,
    };
    // Save to sessionStorage immediately
    sessionStorage.setItem(UPLOAD_COMPLETE_PARAMS_KEY, JSON.stringify(params));
    return { ...params, needsUrlRestore: false };
  }

  // Fall back to sessionStorage
  const saved = sessionStorage.getItem(UPLOAD_COMPLETE_PARAMS_KEY);
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

  return { pendingId: null, source: null, needsUrlRestore: false };
}

// Types for the pendingDocumentProcessings query (for SKIPPED/ERROR only)
interface ProcessingResult {
  id: string;
  pendingDocumentId: string;
  dtoJson: string | null;
  entityId: string | null;
  errorMessage: string | null;
  status: 'CREATED' | 'SKIPPED' | 'ERROR' | 'PENDING' | string;
}

// Filter types - entity categories + special statuses
type EntityCategory = 'quotes' | 'orders' | 'invoices' | 'customers' | 'products' | 'factories' | 'checks';
type SpecialFilter = 'skipped' | 'errors';
type FilterType = EntityCategory | SpecialFilter | null;

// Sorting types
type SortDirection = 'asc' | 'desc' | null;
interface SortConfig<T extends string> {
  column: T | null;
  direction: SortDirection;
}

// Pagination constants
const TABLE_PAGE_SIZE = 50;

// Debounce hook for search input
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Optimized comparison function - pre-compute value types
function createComparator<T>(column: string, direction: 'asc' | 'desc') {
  const mult = direction === 'asc' ? 1 : -1;

  return (a: T, b: T) => {
    const aValue = (a as Record<string, unknown>)[column];
    const bValue = (b as Record<string, unknown>)[column];

    // Handle null/undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return mult;
    if (bValue == null) return -mult;

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * mult;
    }

    // Handle booleans
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return (aValue === bValue ? 0 : aValue ? -1 : 1) * mult;
    }

    // Handle strings (including potential dates)
    const aStr = String(aValue);
    const bStr = String(bValue);

    // Quick date check - only if both look like ISO dates
    if (aStr.length > 9 && bStr.length > 9 && aStr[4] === '-' && bStr[4] === '-') {
      const aDate = Date.parse(aStr);
      const bDate = Date.parse(bStr);
      if (!isNaN(aDate) && !isNaN(bDate)) {
        return (aDate - bDate) * mult;
      }
    }

    // Default string comparison
    return aStr.toLowerCase().localeCompare(bStr.toLowerCase()) * mult;
  };
}

// Generic sorting hook with pagination
function useSortableData<T, K extends string>(
  items: T[],
  defaultSort: SortConfig<K> = { column: null, direction: null }
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<K>>(defaultSort);
  const [currentPage, setCurrentPage] = useState(0);

  // Reset page when items change
  const itemsRef = useRef(items);
  useEffect(() => {
    if (itemsRef.current !== items) {
      itemsRef.current = items;
      setCurrentPage(0);
    }
  }, [items]);

  const requestSort = useCallback((column: K) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        if (prev.direction === 'asc') return { column, direction: 'desc' };
        if (prev.direction === 'desc') return { column: null, direction: null };
      }
      return { column, direction: 'asc' };
    });
    setCurrentPage(0); // Reset to first page on sort
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return items;

    const comparator = createComparator<T>(sortConfig.column, sortConfig.direction);
    return [...items].sort(comparator);
  }, [items, sortConfig]);

  // Paginated items
  const totalPages = Math.ceil(sortedItems.length / TABLE_PAGE_SIZE);
  const paginatedItems = useMemo(() => {
    const start = currentPage * TABLE_PAGE_SIZE;
    return sortedItems.slice(start, start + TABLE_PAGE_SIZE);
  }, [sortedItems, currentPage]);

  const pagination = useMemo(() => ({
    currentPage,
    totalPages,
    totalItems: sortedItems.length,
    pageSize: TABLE_PAGE_SIZE,
    hasNextPage: currentPage < totalPages - 1,
    hasPrevPage: currentPage > 0,
    goToPage: setCurrentPage,
    nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setCurrentPage(p => Math.max(p - 1, 0)),
  }), [currentPage, totalPages, sortedItems.length]);

  return { sortedItems: paginatedItems, allItems: sortedItems, sortConfig, requestSort, pagination };
}

// Sortable header component
interface SortableHeaderProps<K extends string> {
  column: K;
  label: string;
  sortConfig: SortConfig<K>;
  onSort: (column: K) => void;
  className?: string;
}

function SortableHeader<K extends string>({
  column,
  label,
  sortConfig,
  onSort,
  className = '',
}: SortableHeaderProps<K>) {
  const isActive = sortConfig.column === column;

  return (
    <th
      className={`px-4 py-3 text-left font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="inline-flex">
          {isActive ? (
            sortConfig.direction === 'asc' ? (
              <ArrowUp className="w-4 h-4 text-primary" />
            ) : (
              <ArrowDown className="w-4 h-4 text-primary" />
            )
          ) : (
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
          )}
        </span>
      </div>
    </th>
  );
}

// Table filter/search component with internal state for responsive typing
interface TableFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function TableFilter({ value, onChange, placeholder = 'Search...' }: TableFilterProps) {
  const [localValue, setLocalValue] = useState(value);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle input change with debounce
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isTypingRef.current = true;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounce timeout
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onChange(newValue);
    }, 300);
  }, [onChange]);

  // Only sync from parent when not typing (e.g., external clear)
  useEffect(() => {
    if (!isTypingRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isTypingRef.current = false;
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 w-64"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          <X className="w-3 h-3 text-slate-500" />
        </button>
      )}
    </div>
  );
}

// Pagination controls component
interface PaginationControlsProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
  };
}

function PaginationControls({ pagination }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) return null;

  const startItem = pagination.currentPage * pagination.pageSize + 1;
  const endItem = Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalItems);

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {startItem}-{endItem} of {pagination.totalItems}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={pagination.prevPage}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[80px] text-center">
          Page {pagination.currentPage + 1} of {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={pagination.nextPage}
          disabled={!pagination.hasNextPage}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// Status filter dropdown component
interface StatusFilterProps {
  statuses: string[];
  selected: string | null;
  onChange: (status: string | null) => void;
  label?: string;
}

function StatusFilter({ statuses, selected, onChange, label = 'Status' }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">{label}:</span>
      <select
        value={selected || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="">All</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function UploadCompletePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <UploadCompleteContent />
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

function UploadCompleteContent() {
  const router = useRouter();
  const hasRestoredUrl = useRef(false);
  const hasInitializedParams = useRef(false);

  // State for URL params - initialized to null, will be set on client
  const [effectiveParams, setEffectiveParams] = useState<{
    pendingId: string | null;
    source: string | null;
    needsUrlRestore: boolean;
  } | null>(null);

  // Read params on client mount
  useEffect(() => {
    if (hasInitializedParams.current) return;
    hasInitializedParams.current = true;

    const params = getInitialParams();
    setEffectiveParams(params);
  }, []);

  const pendingId = effectiveParams?.pendingId ?? null;
  const source = effectiveParams?.source ?? null;
  const isFromSpreadsheet = source === 'spreadsheet';

  // Restore URL from sessionStorage if needed (runs once on mount)
  useEffect(() => {
    if (effectiveParams?.needsUrlRestore && !hasRestoredUrl.current) {
      hasRestoredUrl.current = true;
      const newSearchParams = new URLSearchParams();
      if (pendingId) newSearchParams.set('pendingId', pendingId);
      if (source) newSearchParams.set('source', source);
      const newUrl = `/flow-ai/upload-complete?${newSearchParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [effectiveParams?.needsUrlRestore, pendingId, source]);

  // Data state - using RelatedEntities type from the CRM (for entity tabs)
  const [relatedData, setRelatedData] = useState<RelatedEntities | null>(null);

  // Processing results for SKIPPED/ERROR tabs
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);

  // Workflow status for retry functionality
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // UI state
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ref to prevent double execution in React strict mode
  const hasInitialized = useRef(false);

  // Fetch related entities using the CRM relatedEntities endpoint
  const fetchRelatedData = useCallback(async (fileId: string) => {
    try {
      console.log('Fetching related entities for fileId:', fileId);
      const data = await fetchRelatedEntities(fileId, 'FILES');
      console.log('Related entities data:', data);
      setRelatedData(data);
    } catch (error) {
      console.error('Error fetching related entities:', error);
      // Don't set error - we still want to show processing results
    }
  }, []);

  // Fetch processing results (for SKIPPED/ERROR items)
  const fetchProcessingResults = useCallback(async (documentId: string) => {
    try {
      console.log('Fetching processing results for pendingDocumentId:', documentId);
      const result = await flowrmsApolloClient.query<{
        pendingDocumentProcessings: ProcessingResult[];
      }>({
        query: Q_PENDING_DOCUMENT_PROCESSINGS,
        variables: { pendingDocumentId: documentId },
        fetchPolicy: 'no-cache',
      });

      console.log('Processing results:', result.data?.pendingDocumentProcessings);
      setProcessingResults(result.data?.pendingDocumentProcessings || []);
    } catch (error) {
      console.error('Error fetching processing results:', error);
      // Don't set error - we still want to show related entities
    }
  }, []);

  // Fetch pending document and then both related entities and processing results
  useEffect(() => {
    // Wait for params to be initialized on client
    if (effectiveParams === null) return;

    // Prevent double execution in React strict mode
    if (hasInitialized.current) return;

    if (!pendingId) {
      setLoadError('No pending ID provided');
      setIsLoading(false);
      return;
    }

    hasInitialized.current = true;

    const initialize = async () => {
      try {
        // Step 1: Fetch the pending document to get the fileId (the actual document ID)
        console.log('Fetching pending document:', pendingId);
        const pendingDocResult = await flowrmsApolloClient.query<{
          getPendingDocument?: {
            fileId?: string;
            entityType?: string;
            workflowStatus?: string;
          };
        }>({
          query: Q_GET_PENDING,
          variables: { pendingId },
          fetchPolicy: 'no-cache',
        });

        const pendingDoc = pendingDocResult.data?.getPendingDocument;

        // Store workflow status for retry functionality
        if (pendingDoc?.workflowStatus) {
          setWorkflowStatus(pendingDoc.workflowStatus);
        }

        // Fetch both data sources in parallel
        const promises: Promise<void>[] = [];

        // Fetch related entities if we have a fileId
        if (pendingDoc?.fileId) {
          promises.push(fetchRelatedData(pendingDoc.fileId));
        }

        // Always fetch processing results using pendingId
        promises.push(fetchProcessingResults(pendingId));

        await Promise.all(promises);
        setIsLoading(false);

      } catch (error) {
        console.error('Error initializing upload-complete:', error);
        setLoadError('An error occurred while loading document data');
        setIsLoading(false);
      }
    };

    initialize();
  }, [effectiveParams, pendingId, fetchRelatedData, fetchProcessingResults]);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };

  const handleDone = () => {
    router.push('/flow-ai/queue');
  };

  // Map relatedData to counts
  const quotesCount = relatedData?.quotes?.length || 0;
  const ordersCount = relatedData?.orders?.length || 0;
  const invoicesCount = relatedData?.invoices?.length || 0;
  const customersCount = relatedData?.customers?.length || 0;
  const productsCount = relatedData?.products?.length || 0;
  const factoriesCount = relatedData?.factories?.length || 0;
  const checksCount = relatedData?.checks?.length || 0;

  // Processing results counts (for SKIPPED/ERROR)
  const skippedResults = useMemo(() => processingResults.filter(r => r.status === 'SKIPPED'), [processingResults]);
  const errorResults = useMemo(() => processingResults.filter(r => r.status === 'ERROR'), [processingResults]);
  const skippedCount = skippedResults.length;
  const errorCount = errorResults.length;

  // Excel Export state and handler
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportToExcel({
        relatedData,
        skippedResults,
        errorResults,
      });
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Failed to export Excel:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setIsExporting(false);
    }
  }, [relatedData, skippedResults, errorResults]);

  // Retry handler for failed documents
  const handleRetry = useCallback(async () => {
    if (!pendingId) {
      toast.error('Cannot retry: No pending document ID available');
      return;
    }

    setIsRetrying(true);
    try {
      // Call the executeDocumentWorkflow mutation to re-process the document
      const result = await flowrmsApolloClient.mutate<{
        executeDocumentWorkflow: {
          success: boolean;
          message: string | null;
          taskId: string | null;
        };
      }>({
        mutation: M_EXECUTE_DOCUMENT_WORKFLOW,
        variables: {
          pendingDocumentId: pendingId,
        },
      });

      if (result.data?.executeDocumentWorkflow?.success) {
        toast.success('Document queued for reprocessing');
        // Navigate to queue page
        router.push('/flow-ai/queue');
      } else {
        const errorMsg = result.data?.executeDocumentWorkflow?.message || 'Unknown error occurred';
        toast.error(`Retry failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      toast.error('Failed to retry document processing');
    } finally {
      setIsRetrying(false);
    }
  }, [pendingId, router]);

  const totalEntities = quotesCount + ordersCount + invoicesCount + customersCount + productsCount + factoriesCount + checksCount;
  const hasAnyEntities = totalEntities > 0;
  const hasSkippedOrErrors = skippedCount > 0 || errorCount > 0;
  const hasAnything = hasAnyEntities || hasSkippedOrErrors;

  // Show full-page loading while waiting for params or initial data load
  if (effectiveParams === null || isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <WorkflowBreadcrumb currentStep="complete" showMapColumns={isFromSpreadsheet} />

        {/* Header */}
        <Header
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
          hasData={hasAnything}
          workflowStatus={workflowStatus}
          isRetrying={isRetrying}
          onRetry={handleRetry}
        />

        {/* Error message */}
        {loadError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="flex items-center gap-2">
              {loadError}
            </p>
          </div>
        )}

        {/* No data state - shown when loading is complete and no entities exist */}
        {!loadError && !hasAnything && (
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No linked entities found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">The document was processed but no entities were linked.</p>
          </div>
        )}

        {/* Summary Cards */}
        {hasAnything && (
          <SummaryCards
            activeFilter={activeFilter}
            onFilterClick={handleFilterClick}
            quotesCount={quotesCount}
            ordersCount={ordersCount}
            invoicesCount={invoicesCount}
            customersCount={customersCount}
            productsCount={productsCount}
            factoriesCount={factoriesCount}
            checksCount={checksCount}
            skippedCount={skippedCount}
            errorCount={errorCount}
          />
        )}

        {/* Entity Tables (from relatedEntities) */}
        {(activeFilter === null || activeFilter === 'quotes') && quotesCount > 0 && relatedData && (
          <QuotesTable quotes={relatedData.quotes} />
        )}

        {(activeFilter === null || activeFilter === 'orders') && ordersCount > 0 && relatedData && (
          <OrdersTable orders={relatedData.orders} />
        )}

        {(activeFilter === null || activeFilter === 'invoices') && invoicesCount > 0 && relatedData && (
          <InvoicesTable invoices={relatedData.invoices} />
        )}

        {(activeFilter === null || activeFilter === 'customers') && customersCount > 0 && relatedData && (
          <CustomersTable customers={relatedData.customers} />
        )}

        {(activeFilter === null || activeFilter === 'products') && productsCount > 0 && relatedData && (
          <ProductsTable products={relatedData.products} />
        )}

        {(activeFilter === null || activeFilter === 'factories') && factoriesCount > 0 && relatedData && (
          <FactoriesTable factories={relatedData.factories} />
        )}

        {(activeFilter === null || activeFilter === 'checks') && checksCount > 0 && relatedData && (
          <ChecksTable checks={relatedData.checks} />
        )}

        {/* SKIPPED and ERROR Tables (from pendingDocumentProcessings) */}
        {(activeFilter === null || activeFilter === 'skipped') && skippedCount > 0 && (
          <ProcessingResultsTable results={skippedResults} title="Skipped Items" icon={<SkipForward className="w-5 h-5 text-yellow-600" />} />
        )}

        {(activeFilter === null || activeFilter === 'errors') && errorCount > 0 && (
          <ProcessingResultsTable results={errorResults} title="Errors" icon={<XCircle className="w-5 h-5 text-red-600" />} />
        )}

        {/* Navigation */}
        <div className="flex justify-end pt-4">
          <Button size="lg" onClick={handleDone}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// Header Component
interface HeaderProps {
  onExportExcel?: () => void;
  isExporting?: boolean;
  hasData?: boolean;
  workflowStatus?: string | null;
  isRetrying?: boolean;
  onRetry?: () => void;
}

function Header({ onExportExcel, isExporting, hasData, workflowStatus, isRetrying, onRetry }: HeaderProps) {
  const isFailed = workflowStatus === 'FAILED';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload Complete</h1>
        <div className="flex items-center gap-2">
          {/* Retry button - only shown for FAILED workflow status */}
          {isFailed && onRetry && (
            <Button
              variant="destructive"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Retry Processing
                </>
              )}
            </Button>
          )}
          {hasData && onExportExcel && (
            <Button
              variant="outline"
              onClick={onExportExcel}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Excel
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground">
        {isFailed ? (
          <>This document failed to process. You can retry processing or review the details below.</>
        ) : (
          <>Your document has been processed. Here&apos;s a summary of all entities linked to this file.</>
        )}
      </p>
    </div>
  );
}

// Summary Cards Component
interface SummaryCardsProps {
  activeFilter: FilterType;
  onFilterClick: (filter: FilterType) => void;
  quotesCount: number;
  ordersCount: number;
  invoicesCount: number;
  customersCount: number;
  productsCount: number;
  factoriesCount: number;
  checksCount: number;
  skippedCount: number;
  errorCount: number;
}

function SummaryCards({
  activeFilter,
  onFilterClick,
  quotesCount,
  ordersCount,
  invoicesCount,
  customersCount,
  productsCount,
  factoriesCount,
  checksCount,
  skippedCount,
  errorCount
}: SummaryCardsProps) {
  type CardItem = { key: FilterType; label: string; count: number; icon: React.ReactNode; color: string };
  const allCards: CardItem[] = [
    { key: 'quotes', label: 'Quotes', count: quotesCount, icon: <FileText className="w-4 h-4 text-blue-600" />, color: 'blue' },
    { key: 'orders', label: 'Orders', count: ordersCount, icon: <ShoppingCart className="w-4 h-4 text-green-600" />, color: 'green' },
    { key: 'invoices', label: 'Invoices', count: invoicesCount, icon: <Receipt className="w-4 h-4 text-purple-600" />, color: 'purple' },
    { key: 'customers', label: 'Customers', count: customersCount, icon: <Building2 className="w-4 h-4 text-orange-600" />, color: 'orange' },
    { key: 'products', label: 'Products', count: productsCount, icon: <Package className="w-4 h-4 text-cyan-600" />, color: 'cyan' },
    { key: 'factories', label: 'Factories', count: factoriesCount, icon: <Factory className="w-4 h-4 text-indigo-600" />, color: 'indigo' },
    { key: 'checks', label: 'Checks', count: checksCount, icon: <DollarSign className="w-4 h-4 text-emerald-600" />, color: 'emerald' },
    { key: 'skipped', label: 'Skipped', count: skippedCount, icon: <SkipForward className="w-4 h-4 text-yellow-600" />, color: 'yellow' },
    { key: 'errors', label: 'Errors', count: errorCount, icon: <XCircle className="w-4 h-4 text-red-600" />, color: 'red' },
  ];
  const cards = allCards.filter(card => card.count > 0);

  if (cards.length === 0) return null;

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-card">
      <div className="flex items-center flex-wrap gap-4">
        {cards.map((card) => (
          <SummaryCardButton
            key={card.key}
            isActive={activeFilter === card.key}
            onClick={() => onFilterClick(card.key)}
            label={card.label}
            count={card.count}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>
    </div>
  );
}

interface SummaryCardButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

function SummaryCardButton({ isActive, onClick, label, count, icon, color }: SummaryCardButtonProps) {
  const colorClasses: Record<string, string> = {
    blue: isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    green: isActive ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    purple: isActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    orange: isActive ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    cyan: isActive ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    indigo: isActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    emerald: isActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    yellow: isActive ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    red: isActive ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
  };

  const textColorClasses: Record<string, string> = {
    blue: isActive ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300',
    green: isActive ? 'text-green-600' : 'text-gray-700 dark:text-gray-300',
    purple: isActive ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300',
    orange: isActive ? 'text-orange-600' : 'text-gray-700 dark:text-gray-300',
    cyan: isActive ? 'text-cyan-600' : 'text-gray-700 dark:text-gray-300',
    indigo: isActive ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300',
    emerald: isActive ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300',
    yellow: isActive ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300',
    red: isActive ? 'text-red-600' : 'text-gray-700 dark:text-gray-300',
  };

  const checkColorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    cyan: 'text-cyan-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[140px] p-4 rounded-lg border-2 transition-all ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold flex items-center gap-2 ${textColorClasses[color]}`}>
          {icon}
          {label}
        </span>
        {isActive && <CheckCircle2 className={`w-5 h-5 ${checkColorClasses[color]}`} />}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{count}</Badge>
        <span className="text-xs text-muted-foreground">linked</span>
      </div>
    </button>
  );
}

// Helper to format dates
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

// Helper to get internal app URL for entities
// Maps entity IDs to internal routes within this app
function getInternalUrl(entityType: 'quote' | 'order' | 'invoice' | 'check', id: string): string {
  switch (entityType) {
    case 'quote':
      return `/quotes/${id}`;
    case 'order':
      return `/orders/${id}`;
    case 'invoice':
      return `/invoices/${id}`;
    case 'check':
      return `/commissions/${id}`;
    default:
      return '#';
  }
}

// Memoized table row component for quotes
const QuoteRow = React.memo(function QuoteRow({ quote }: { quote: RelatedEntities['quotes'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium">
        <Link
          href={getInternalUrl('quote', quote.id)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {quote.quoteNumber || quote.id}
        </Link>
      </td>
      <td className="px-4 py-3">{formatDate(quote.entityDate)}</td>
      <td className="px-4 py-3">{formatDate(quote.expDate)}</td>
      <td className="px-4 py-3">
        {quote.status && <Badge variant="secondary">{quote.status}</Badge>}
      </td>
      <td className="px-4 py-3">
        {quote.blanket ? <Badge variant="secondary">Yes</Badge> : '-'}
      </td>
    </tr>
  );
});

// Quotes Table Component
type QuoteSortColumn = 'quoteNumber' | 'entityDate' | 'expDate' | 'status' | 'blanket';

function QuotesTable({ quotes }: { quotes: RelatedEntities['quotes'] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(quotes.map(q => q.status).filter(Boolean) as string[]);
    return Array.from(statuses).sort();
  }, [quotes]);

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return quotes.filter(quote => {
      const matchesSearch = !searchTerm ||
        (quote.quoteNumber?.toLowerCase().includes(searchLower)) ||
        (quote.id.toLowerCase().includes(searchLower));
      const matchesStatus = !statusFilter || quote.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof quotes[0], QuoteSortColumn>(filteredQuotes);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Quotes ({filteredQuotes.length}{filteredQuotes.length !== quotes.length ? ` of ${quotes.length}` : ''})
            </CardTitle>
            <CardDescription>
              Quotes linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search quotes..."
            />
            {uniqueStatuses.length > 0 && (
              <StatusFilter
                statuses={uniqueStatuses}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="quoteNumber" label="Quote #" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="entityDate" label="Entity Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="expDate" label="Exp Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="status" label="Status" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="blanket" label="Blanket" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No quotes match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((quote) => <QuoteRow key={quote.id} quote={quote} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Memoized table row component for orders
const OrderRow = React.memo(function OrderRow({ order }: { order: RelatedEntities['orders'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium">
        <Link
          href={getInternalUrl('order', order.id)}
          className="text-green-600 hover:text-green-800 hover:underline"
        >
          {order.orderNumber || order.id}
        </Link>
      </td>
      <td className="px-4 py-3">{order.factSoNumber || '-'}</td>
      <td className="px-4 py-3">{formatDate(order.entityDate)}</td>
      <td className="px-4 py-3">{formatDate(order.shipDate)}</td>
      <td className="px-4 py-3">
        {order.status && <Badge variant="secondary">{order.status}</Badge>}
      </td>
    </tr>
  );
});

// Orders Table Component
type OrderSortColumn = 'orderNumber' | 'factSoNumber' | 'entityDate' | 'shipDate' | 'status';

function OrdersTable({ orders }: { orders: RelatedEntities['orders'] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(orders.map(o => o.status).filter(Boolean) as string[]);
    return Array.from(statuses).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return orders.filter(order => {
      const matchesSearch = !searchTerm ||
        (order.orderNumber?.toLowerCase().includes(searchLower)) ||
        (order.factSoNumber?.toLowerCase().includes(searchLower)) ||
        (order.id.toLowerCase().includes(searchLower));
      const matchesStatus = !statusFilter || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof orders[0], OrderSortColumn>(filteredOrders);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600" />
              Orders ({filteredOrders.length}{filteredOrders.length !== orders.length ? ` of ${orders.length}` : ''})
            </CardTitle>
            <CardDescription>
              Orders linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search orders..."
            />
            {uniqueStatuses.length > 0 && (
              <StatusFilter
                statuses={uniqueStatuses}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="orderNumber" label="Order #" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="factSoNumber" label="Factory SO" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="entityDate" label="Entity Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="shipDate" label="Ship Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="status" label="Status" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No orders match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((order) => <OrderRow key={order.id} order={order} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Memoized table row component for invoices
const InvoiceRow = React.memo(function InvoiceRow({ invoice }: { invoice: RelatedEntities['invoices'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium">
        <Link
          href={getInternalUrl('invoice', invoice.id)}
          className="text-purple-600 hover:text-purple-800 hover:underline"
        >
          {invoice.invoiceNumber || invoice.id}
        </Link>
      </td>
      <td className="px-4 py-3">{formatDate(invoice.entityDate)}</td>
      <td className="px-4 py-3">{formatDate(invoice.dueDate)}</td>
      <td className="px-4 py-3">
        {invoice.status && <Badge variant="secondary">{invoice.status}</Badge>}
      </td>
      <td className="px-4 py-3">
        {invoice.locked ? <Badge variant="outline">Locked</Badge> : '-'}
      </td>
    </tr>
  );
});

// Invoices Table Component
type InvoiceSortColumn = 'invoiceNumber' | 'entityDate' | 'dueDate' | 'status' | 'locked';

function InvoicesTable({ invoices }: { invoices: RelatedEntities['invoices'] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(invoices.map(i => i.status).filter(Boolean) as string[]);
    return Array.from(statuses).sort();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return invoices.filter(invoice => {
      const matchesSearch = !searchTerm ||
        (invoice.invoiceNumber?.toLowerCase().includes(searchLower)) ||
        (invoice.id.toLowerCase().includes(searchLower));
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof invoices[0], InvoiceSortColumn>(filteredInvoices);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-purple-600" />
              Invoices ({filteredInvoices.length}{filteredInvoices.length !== invoices.length ? ` of ${invoices.length}` : ''})
            </CardTitle>
            <CardDescription>
              Invoices linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search invoices..."
            />
            {uniqueStatuses.length > 0 && (
              <StatusFilter
                statuses={uniqueStatuses}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="invoiceNumber" label="Invoice #" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="entityDate" label="Entity Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="dueDate" label="Due Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="status" label="Status" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="locked" label="Locked" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No invoices match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Memoized table row component for customers
const CustomerRow = React.memo(function CustomerRow({ customer }: { customer: RelatedEntities['customers'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium">
        <span className="text-orange-600">{customer.companyName || customer.id}</span>
      </td>
      <td className="px-4 py-3">
        {customer.isParent ? <Badge variant="secondary">Yes</Badge> : '-'}
      </td>
      <td className="px-4 py-3">
        {customer.published ? <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Yes</Badge> : '-'}
      </td>
    </tr>
  );
});

// Customers Table Component
type CustomerSortColumn = 'companyName' | 'isParent' | 'published';

function CustomersTable({ customers }: { customers: RelatedEntities['customers'] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return customers.filter(customer => {
      const matchesSearch = !searchTerm ||
        (customer.companyName?.toLowerCase().includes(searchLower)) ||
        (customer.id.toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [customers, searchTerm]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof customers[0], CustomerSortColumn>(filteredCustomers);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Customers ({filteredCustomers.length}{filteredCustomers.length !== customers.length ? ` of ${customers.length}` : ''})
            </CardTitle>
            <CardDescription>
              Customers linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search customers..."
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="companyName" label="Company Name" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="isParent" label="Is Parent" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="published" label="Published" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No customers match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((customer) => <CustomerRow key={customer.id} customer={customer} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Memoized table row component for products
const ProductRow = React.memo(function ProductRow({ product }: { product: RelatedEntities['products'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-mono text-sm">
        <span className="text-cyan-600">{product.factoryPartNumber || product.id}</span>
      </td>
      <td className="px-4 py-3">{product.description || '-'}</td>
      <td className="px-4 py-3 text-right">
        {product.unitPrice != null ? `$${Number(product.unitPrice).toFixed(2)}` : '-'}
      </td>
      <td className="px-4 py-3 text-right">
        {product.defaultCommissionRate != null ? `${(product.defaultCommissionRate * 100).toFixed(1)}%` : '-'}
      </td>
      <td className="px-4 py-3">
        {product.published ? <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Yes</Badge> : '-'}
      </td>
    </tr>
  );
});

// Products Table Component
type ProductSortColumn = 'factoryPartNumber' | 'description' | 'unitPrice' | 'defaultCommissionRate' | 'published';

function ProductsTable({ products }: { products: RelatedEntities['products'] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return products.filter(product => {
      const matchesSearch = !searchTerm ||
        (product.factoryPartNumber?.toLowerCase().includes(searchLower)) ||
        (product.description?.toLowerCase().includes(searchLower)) ||
        (product.id.toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [products, searchTerm]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof products[0], ProductSortColumn>(filteredProducts);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-600" />
              Products ({filteredProducts.length}{filteredProducts.length !== products.length ? ` of ${products.length}` : ''})
            </CardTitle>
            <CardDescription>
              Products linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search products..."
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="factoryPartNumber" label="Part Number" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="description" label="Description" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="unitPrice" label="Unit Price" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortableHeader column="defaultCommissionRate" label="Commission Rate" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortableHeader column="published" label="Published" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No products match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((product) => <ProductRow key={product.id} product={product} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Memoized table row component for factories
const FactoryRow = React.memo(function FactoryRow({ factory }: { factory: RelatedEntities['factories'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium">
        <span className="text-indigo-600">{factory.title || factory.id}</span>
      </td>
      <td className="px-4 py-3">{factory.accountNumber || '-'}</td>
      <td className="px-4 py-3">
        {factory.published ? <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Yes</Badge> : '-'}
      </td>
    </tr>
  );
});

// Factories Table Component
type FactorySortColumn = 'title' | 'accountNumber' | 'published';

function FactoriesTable({ factories }: { factories: RelatedEntities['factories'] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFactories = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return factories.filter(factory => {
      const matchesSearch = !searchTerm ||
        (factory.title?.toLowerCase().includes(searchLower)) ||
        (factory.accountNumber?.toLowerCase().includes(searchLower)) ||
        (factory.id.toLowerCase().includes(searchLower));
      return matchesSearch;
    });
  }, [factories, searchTerm]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof factories[0], FactorySortColumn>(filteredFactories);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-indigo-600" />
              Factories ({filteredFactories.length}{filteredFactories.length !== factories.length ? ` of ${factories.length}` : ''})
            </CardTitle>
            <CardDescription>
              Factories linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search factories..."
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="title" label="Title" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="accountNumber" label="Account Number" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="published" label="Published" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No factories match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((factory) => <FactoryRow key={factory.id} factory={factory} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Memoized table row component for checks
const CheckRow = React.memo(function CheckRow({ check }: { check: RelatedEntities['checks'][0] }) {
  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium">
        <Link
          href={getInternalUrl('check', check.id)}
          className="text-emerald-600 hover:text-emerald-800 hover:underline"
        >
          {check.checkNumber || check.id}
        </Link>
      </td>
      <td className="px-4 py-3 text-right">
        {check.enteredCommissionAmount != null ? `$${Number(check.enteredCommissionAmount).toFixed(2)}` : '-'}
      </td>
      <td className="px-4 py-3">{check.commissionMonth || '-'}</td>
      <td className="px-4 py-3">{formatDate(check.entityDate)}</td>
      <td className="px-4 py-3">{formatDate(check.postDate)}</td>
      <td className="px-4 py-3">
        {check.status && <Badge variant="secondary">{check.status}</Badge>}
      </td>
    </tr>
  );
});

// Checks Table Component
type CheckSortColumn = 'checkNumber' | 'enteredCommissionAmount' | 'commissionMonth' | 'entityDate' | 'postDate' | 'status';

function ChecksTable({ checks }: { checks: RelatedEntities['checks'] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(checks.map(c => c.status).filter(Boolean) as string[]);
    return Array.from(statuses).sort();
  }, [checks]);

  const filteredChecks = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return checks.filter(check => {
      const matchesSearch = !searchTerm ||
        (check.checkNumber?.toLowerCase().includes(searchLower)) ||
        (check.commissionMonth?.toLowerCase().includes(searchLower)) ||
        (check.id.toLowerCase().includes(searchLower));
      const matchesStatus = !statusFilter || check.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [checks, searchTerm, statusFilter]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<typeof checks[0], CheckSortColumn>(filteredChecks);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Checks ({filteredChecks.length}{filteredChecks.length !== checks.length ? ` of ${checks.length}` : ''})
            </CardTitle>
            <CardDescription>
              Checks linked to this document
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search checks..."
            />
            {uniqueStatuses.length > 0 && (
              <StatusFilter
                statuses={uniqueStatuses}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <SortableHeader column="checkNumber" label="Check #" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="enteredCommissionAmount" label="Commission" sortConfig={sortConfig} onSort={requestSort} className="text-right" />
                <SortableHeader column="commissionMonth" label="Commission Month" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="entityDate" label="Entity Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="postDate" label="Post Date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="status" label="Status" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No checks match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((check) => <CheckRow key={check.id} check={check} />)
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Paginated Details Table - for showing large arrays efficiently
function PaginatedDetailsTable({
  arrayField,
  columns
}: {
  arrayField: { key: string; items: Record<string, unknown>[] };
  columns: string[];
}) {
  const [page, setPage] = useState(0);
  const totalItems = arrayField.items.length;
  const totalPages = Math.ceil(totalItems / DETAILS_PAGE_SIZE);
  const startIdx = page * DETAILS_PAGE_SIZE;
  const endIdx = Math.min(startIdx + DETAILS_PAGE_SIZE, totalItems);
  const visibleItems = arrayField.items.slice(startIdx, endIdx);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {arrayField.key} ({totalItems} items)
        </h4>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">
              {startIdx + 1}-{endIdx} of {totalItems}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); }}
              disabled={page === 0}
              className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-600 disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              Prev
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages - 1, p + 1)); }}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-600 disabled:opacity-50 hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              Next
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-700/50">
            <tr>
              {columns.map((col, colIdx) => (
                <th key={colIdx} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">
                  {formatFieldName(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, itemIdx) => (
              <tr key={startIdx + itemIdx} className="border-t border-slate-200 dark:border-slate-600">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                    {formatCellValue(item[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Memoized row component for better performance
const ProcessingResultRow = React.memo(function ProcessingResultRow({
  result,
  isExpanded,
  onToggle,
}: {
  result: ProcessingResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  // Only compute expensive values when expanded
  const fields = useMemo(() => isExpanded ? getAllFields(result.dtoJson) : [], [isExpanded, result.dtoJson]);
  const arrayFields = useMemo(() => isExpanded ? getArrayFields(result.dtoJson) : [], [isExpanded, result.dtoJson]);

  // These are cheap, always compute
  const entityType = useMemo(() => getEntityType(result.dtoJson), [result.dtoJson]);
  const displayName = useMemo(() => getDisplayName(result.dtoJson), [result.dtoJson]);

  return (
    <React.Fragment>
      <tr
        className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <Badge variant="outline" className="text-xs">
            {entityType}
          </Badge>
        </td>
        <td className="px-4 py-3 font-medium">
          {displayName}
        </td>
        <td className="px-4 py-3">
          {getStatusBadge(result.status)}
        </td>
        <td className="px-4 py-3 text-sm">
          {result.errorMessage ? (
            <span className="text-yellow-600">{result.errorMessage}</span>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50 dark:bg-slate-800/30 border-b">
          <td colSpan={5} className="px-4 py-4">
            <div className="ml-8 space-y-4">
              {/* Basic fields */}
              {fields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                  {fields.map((field: { key: string; value: string }, idx: number) => (
                    <div key={idx} className="text-sm py-1">
                      <span className="text-slate-500 font-medium">{field.key}:</span>{' '}
                      <span className="text-slate-700 dark:text-slate-300">{field.value || '-'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Array fields (like details/line items) with pagination */}
              {arrayFields.map((arrayField, arrayIdx) => {
                const columns = getArrayItemColumns(arrayField.items);
                if (columns.length === 0) return null;

                return (
                  <PaginatedDetailsTable
                    key={arrayIdx}
                    arrayField={arrayField}
                    columns={columns}
                  />
                );
              })}

              {/* No details message */}
              {fields.length === 0 && arrayFields.length === 0 && (
                <p className="text-sm text-slate-500 italic">No additional details available</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
});

// Processing Results Table Component (for SKIPPED and ERROR items)
// We need a sortable version that works with processed results
interface ProcessingResultWithMeta extends ProcessingResult {
  _entityType: string;
  _displayName: string;
}

type ProcessingResultSortColumn = '_entityType' | '_displayName' | 'status' | 'errorMessage';

function ProcessingResultsTable({ results, title, icon }: { results: ProcessingResult[]; title: string; icon: React.ReactNode }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  // Enhance results with entity type and display name for sorting/filtering
  const enhancedResults = useMemo(() => {
    return results.map(result => ({
      ...result,
      _entityType: getEntityType(result.dtoJson),
      _displayName: getDisplayName(result.dtoJson),
    }));
  }, [results]);

  // Get unique entity types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(enhancedResults.map(r => r._entityType));
    return Array.from(types).sort();
  }, [enhancedResults]);

  // Filter results
  const filteredResults = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return enhancedResults.filter(result => {
      const matchesSearch = !searchTerm ||
        result._displayName.toLowerCase().includes(searchLower) ||
        result._entityType.toLowerCase().includes(searchLower) ||
        (result.errorMessage?.toLowerCase().includes(searchLower));
      const matchesType = !typeFilter || result._entityType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [enhancedResults, searchTerm, typeFilter]);

  const { sortedItems, sortConfig, requestSort, pagination } = useSortableData<ProcessingResultWithMeta, ProcessingResultSortColumn>(filteredResults);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title} ({filteredResults.length}{filteredResults.length !== results.length ? ` of ${results.length}` : ''})
            </CardTitle>
            <CardDescription>
              Click on a row to expand and see more details
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <TableFilter
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search results..."
            />
            {uniqueTypes.length > 1 && (
              <StatusFilter
                statuses={uniqueTypes}
                selected={typeFilter}
                onChange={setTypeFilter}
                label="Type"
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-10"></th>
                <SortableHeader column="_entityType" label="Type" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="_displayName" label="Name" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="status" label="Status" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader column="errorMessage" label="Message" sortConfig={sortConfig} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No results match your filters
                  </td>
                </tr>
              ) : (
                sortedItems.map((result) => (
                  <ProcessingResultRow
                    key={result.id}
                    result={result}
                    isExpanded={expandedRows.has(result.id)}
                    onToggle={() => toggleRow(result.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls pagination={pagination} />
      </CardContent>
    </Card>
  );
}

// Helper to format cell values for display
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `${value.length} items`;
    const obj = value as Record<string, unknown>;
    if (obj.name) return String(obj.name);
    return JSON.stringify(value);
  }
  return String(value);
}

// Helper functions for processing results display

// Detect entity type from dtoJson
function getEntityType(dtoJson: string | null): string {
  if (!dtoJson) return 'Entity';
  try {
    const data = JSON.parse(dtoJson);
    // Check for entity type indicators
    if (data.factory_name || data.factory) return 'Factory';
    if (data.customer_name || data.customer || data.sold_to_customer) return 'Customer';
    if (data.bill_to_customer_name || data.bill_to_customer) return 'Bill To Customer';
    if (data.end_user_name || data.end_user) return 'End User';
    if (data.product_name || data.product || data.sku) return 'Product';
    if (data.order_number || data.po_number) return 'Order';
    if (data.invoice_number || data.invoice) return 'Invoice';
    return 'Entity';
  } catch {
    return 'Entity';
  }
}

// Parse dtoJson to extract display name
function getDisplayName(dtoJson: string | null): string {
  if (!dtoJson) return 'Unknown';
  try {
    const data = JSON.parse(dtoJson);
    // Try different possible name fields in priority order
    const nameFields = [
      'factory_name', 'customer_name', 'bill_to_customer_name', 'end_user_name',
      'product_name', 'name', 'title', 'order_number', 'invoice_number',
      'po_number', 'sku', 'description'
    ];

    for (const field of nameFields) {
      if (data[field] && typeof data[field] === 'string' && data[field].trim()) {
        return data[field];
      }
    }

    // Check nested objects
    if (data.factory?.name) return data.factory.name;
    if (data.customer?.name) return data.customer.name;
    if (data.product?.name) return data.product.name;

    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

// Parse dtoJson to get all displayable fields (excluding arrays)
function getAllFields(dtoJson: string | null): { key: string; value: string }[] {
  if (!dtoJson) return [];
  try {
    const data = JSON.parse(dtoJson);
    const fields: { key: string; value: string }[] = [];

    // Skip these internal/technical fields
    const skipFields = new Set([
      'internal_uuid', 'id', 'uuid', 'created_at', 'updated_at',
      'tenant_id', 'pending_document_id', 'dto_id'
    ]);

    const processValue = (key: string, value: unknown): void => {
      if (skipFields.has(key.toLowerCase())) return;

      if (value === null || value === undefined || value === '') return;

      if (typeof value === 'object' && !Array.isArray(value)) {
        // For nested objects, try to get a meaningful representation
        const obj = value as Record<string, unknown>;
        if (obj.name) {
          fields.push({ key: formatFieldName(key), value: String(obj.name) });
        } else if (obj.id && typeof obj.id === 'string') {
          // Skip showing just IDs for nested objects
          return;
        }
      } else if (Array.isArray(value)) {
        // Skip arrays here - they'll be shown separately in getArrayFields
        return;
      } else {
        fields.push({ key: formatFieldName(key), value: String(value) });
      }
    };

    for (const [key, value] of Object.entries(data)) {
      processValue(key, value);
    }

    return fields;
  } catch {
    return [];
  }
}

// Parse dtoJson to get array fields (like details/line items)
function getArrayFields(dtoJson: string | null): { key: string; items: Record<string, unknown>[] }[] {
  if (!dtoJson) return [];
  try {
    const data = JSON.parse(dtoJson);
    const arrayFields: { key: string; items: Record<string, unknown>[] }[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0) {
        // Check if array contains objects (not primitives)
        if (typeof value[0] === 'object' && value[0] !== null) {
          arrayFields.push({ key: formatFieldName(key), items: value as Record<string, unknown>[] });
        }
      }
    }

    return arrayFields;
  } catch {
    return [];
  }
}

// Get display columns for array items (skip internal fields)
function getArrayItemColumns(items: Record<string, unknown>[]): string[] {
  if (items.length === 0) return [];

  const skipFields = new Set([
    'internal_uuid', 'id', 'uuid', 'created_at', 'updated_at',
    'tenant_id', 'pending_document_id', 'dto_id'
  ]);

  const firstItem = items[0];
  return Object.keys(firstItem).filter(key => !skipFields.has(key.toLowerCase()));
}

// Format field names for display
function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Get status badge
function getStatusBadge(status: string) {
  switch (status) {
    case 'CREATED':
      return <Badge className="bg-green-50 text-green-700 border-green-200">Created</Badge>;
    case 'SKIPPED':
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Skipped</Badge>;
    case 'ERROR':
      return <Badge className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
    case 'PENDING':
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

// Excel Export Function
interface ExcelExportData {
  relatedData: RelatedEntities | null;
  skippedResults: ProcessingResult[];
  errorResults: ProcessingResult[];
}

async function exportToExcel(data: ExcelExportData): Promise<void> {
  const { relatedData, skippedResults, errorResults } = data;

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Helper to add a sheet with data
  const addSheet = (name: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) => {
    if (rows.length === 0) return;
    const sheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    const colWidths = headers.map((header, idx) => {
      const maxDataLen = Math.max(
        header.length,
        ...rows.map(row => String(row[idx] || '').length)
      );
      return { wch: Math.min(Math.max(maxDataLen, 10), 50) };
    });
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31)); // Sheet names max 31 chars
  };

  // Summary Sheet
  const summaryData = [
    ['Upload Complete Report'],
    ['Generated', new Date().toLocaleString()],
    [''],
    ['Summary'],
    ['Entity Type', 'Count'],
    ['Quotes', relatedData?.quotes?.length || 0],
    ['Orders', relatedData?.orders?.length || 0],
    ['Invoices', relatedData?.invoices?.length || 0],
    ['Customers', relatedData?.customers?.length || 0],
    ['Products', relatedData?.products?.length || 0],
    ['Factories', relatedData?.factories?.length || 0],
    ['Checks', relatedData?.checks?.length || 0],
    ['Skipped', skippedResults.length],
    ['Errors', errorResults.length],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Quotes Sheet
  if (relatedData?.quotes && relatedData.quotes.length > 0) {
    addSheet('Quotes',
      ['Quote #', 'Entity Date', 'Exp Date', 'Status', 'Blanket'],
      relatedData.quotes.map(q => [
        q.quoteNumber || q.id,
        formatDate(q.entityDate),
        formatDate(q.expDate),
        q.status || '-',
        q.blanket ? 'Yes' : '-'
      ])
    );
  }

  // Orders Sheet
  if (relatedData?.orders && relatedData.orders.length > 0) {
    addSheet('Orders',
      ['Order #', 'Factory SO', 'Entity Date', 'Ship Date', 'Status'],
      relatedData.orders.map(o => [
        o.orderNumber || o.id,
        o.factSoNumber || '-',
        formatDate(o.entityDate),
        formatDate(o.shipDate),
        o.status || '-'
      ])
    );
  }

  // Invoices Sheet
  if (relatedData?.invoices && relatedData.invoices.length > 0) {
    addSheet('Invoices',
      ['Invoice #', 'Entity Date', 'Due Date', 'Status', 'Locked'],
      relatedData.invoices.map(i => [
        i.invoiceNumber || i.id,
        formatDate(i.entityDate),
        formatDate(i.dueDate),
        i.status || '-',
        i.locked ? 'Yes' : '-'
      ])
    );
  }

  // Customers Sheet
  if (relatedData?.customers && relatedData.customers.length > 0) {
    addSheet('Customers',
      ['Company Name', 'Is Parent', 'Published'],
      relatedData.customers.map(c => [
        c.companyName || c.id,
        c.isParent ? 'Yes' : '-',
        c.published ? 'Yes' : '-'
      ])
    );
  }

  // Products Sheet
  if (relatedData?.products && relatedData.products.length > 0) {
    addSheet('Products',
      ['Part Number', 'Description', 'Unit Price', 'Commission Rate', 'Published'],
      relatedData.products.map(p => [
        p.factoryPartNumber || p.id,
        p.description || '-',
        p.unitPrice != null ? p.unitPrice : '-',
        p.defaultCommissionRate != null ? p.defaultCommissionRate * 100 : '-',
        p.published ? 'Yes' : '-'
      ])
    );
  }

  // Factories Sheet
  if (relatedData?.factories && relatedData.factories.length > 0) {
    addSheet('Factories',
      ['Title', 'Account Number', 'Published'],
      relatedData.factories.map(f => [
        f.title || f.id,
        f.accountNumber || '-',
        f.published ? 'Yes' : '-'
      ])
    );
  }

  // Checks Sheet
  if (relatedData?.checks && relatedData.checks.length > 0) {
    addSheet('Checks',
      ['Check #', 'Commission', 'Commission Month', 'Entity Date', 'Post Date', 'Status'],
      relatedData.checks.map(c => [
        c.checkNumber || c.id,
        c.enteredCommissionAmount != null ? Number(c.enteredCommissionAmount) : '-',
        c.commissionMonth || '-',
        formatDate(c.entityDate),
        formatDate(c.postDate),
        c.status || '-'
      ])
    );
  }

  // Helper to get all fields from dtoJson including nested values
  const getAllFieldsForExport = (dtoJson: string | null): Record<string, unknown> => {
    if (!dtoJson) return {};
    try {
      const data = JSON.parse(dtoJson);
      const result: Record<string, unknown> = {};

      const skipFields = new Set([
        'internal_uuid', 'id', 'uuid', 'created_at', 'updated_at',
        'tenant_id', 'pending_document_id', 'dto_id'
      ]);

      for (const [key, value] of Object.entries(data)) {
        if (skipFields.has(key.toLowerCase())) continue;
        if (Array.isArray(value)) continue; // Skip arrays, handled separately

        if (value === null || value === undefined || value === '') continue;

        if (typeof value === 'object') {
          const obj = value as Record<string, unknown>;
          if (obj.name) {
            result[formatFieldName(key)] = String(obj.name);
          }
        } else {
          result[formatFieldName(key)] = value;
        }
      }
      return result;
    } catch {
      return {};
    }
  };

  // Helper to get array fields from dtoJson
  const getArrayFieldsForExport = (dtoJson: string | null): { key: string; items: Record<string, unknown>[] }[] => {
    if (!dtoJson) return [];
    try {
      const data = JSON.parse(dtoJson);
      const arrayFields: { key: string; items: Record<string, unknown>[] }[] = [];

      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0) {
          if (typeof value[0] === 'object' && value[0] !== null) {
            arrayFields.push({ key: formatFieldName(key), items: value as Record<string, unknown>[] });
          }
        }
      }
      return arrayFields;
    } catch {
      return [];
    }
  };

  // Skipped Items Sheet - with full details including all line items
  if (skippedResults.length > 0) {
    const allSkippedRows: Record<string, unknown>[] = [];

    for (const result of skippedResults) {
      const entityType = getEntityType(result.dtoJson);
      const displayName = getDisplayName(result.dtoJson);
      const entityFields = getAllFieldsForExport(result.dtoJson);
      const arrayFields = getArrayFieldsForExport(result.dtoJson);

      // Base info for every row
      const baseInfo: Record<string, unknown> = {
        'Entity Type': entityType,
        'Name': displayName,
        'Status': 'SKIPPED',
        'Message': result.errorMessage || '-',
        ...entityFields,
      };

      // If there are detail arrays (line items), create a row for each detail item
      if (arrayFields.length > 0) {
        for (const arrayField of arrayFields) {
          for (const item of arrayField.items) {
            const detailRow: Record<string, unknown> = {
              ...baseInfo,
              'Detail Type': arrayField.key
            };

            // Add all fields from the detail item
            for (const [key, value] of Object.entries(item)) {
              if (key === 'id' || key === 'uuid' || key === 'internal_uuid') continue;
              const formattedKey = formatFieldName(key);
              if (value === null || value === undefined) {
                detailRow[formattedKey] = '-';
              } else if (typeof value === 'object') {
                const obj = value as Record<string, unknown>;
                detailRow[formattedKey] = obj.name ? String(obj.name) : '-';
              } else {
                detailRow[formattedKey] = value;
              }
            }
            allSkippedRows.push(detailRow);
          }
        }
      } else {
        // No details, just add the base row
        allSkippedRows.push(baseInfo);
      }
    }

    if (allSkippedRows.length > 0) {
      // Get all unique headers from all rows
      const allHeaders = Array.from(new Set(allSkippedRows.flatMap(row => Object.keys(row))));
      // Prioritize common columns first
      const priorityHeaders = ['Entity Type', 'Name', 'Status', 'Message', 'Detail Type'];
      const sortedHeaders = [
        ...priorityHeaders.filter(h => allHeaders.includes(h)),
        ...allHeaders.filter(h => !priorityHeaders.includes(h)).sort()
      ];

      const skippedSheet = XLSX.utils.json_to_sheet(allSkippedRows, { header: sortedHeaders });
      // Set column widths based on content
      skippedSheet['!cols'] = sortedHeaders.map(h => ({ wch: Math.min(Math.max(h.length, 12), 50) }));
      XLSX.utils.book_append_sheet(workbook, skippedSheet, 'Skipped Items');
    }
  }

  // Error Items Sheet - with full details including all line items
  if (errorResults.length > 0) {
    const allErrorRows: Record<string, unknown>[] = [];

    for (const result of errorResults) {
      const entityType = getEntityType(result.dtoJson);
      const displayName = getDisplayName(result.dtoJson);
      const entityFields = getAllFieldsForExport(result.dtoJson);
      const arrayFields = getArrayFieldsForExport(result.dtoJson);

      const baseInfo: Record<string, unknown> = {
        'Entity Type': entityType,
        'Name': displayName,
        'Status': 'ERROR',
        'Error Message': result.errorMessage || '-',
        ...entityFields,
      };

      if (arrayFields.length > 0) {
        for (const arrayField of arrayFields) {
          for (const item of arrayField.items) {
            const detailRow: Record<string, unknown> = {
              ...baseInfo,
              'Detail Type': arrayField.key
            };

            for (const [key, value] of Object.entries(item)) {
              if (key === 'id' || key === 'uuid' || key === 'internal_uuid') continue;
              const formattedKey = formatFieldName(key);
              if (value === null || value === undefined) {
                detailRow[formattedKey] = '-';
              } else if (typeof value === 'object') {
                const obj = value as Record<string, unknown>;
                detailRow[formattedKey] = obj.name ? String(obj.name) : '-';
              } else {
                detailRow[formattedKey] = value;
              }
            }
            allErrorRows.push(detailRow);
          }
        }
      } else {
        allErrorRows.push(baseInfo);
      }
    }

    if (allErrorRows.length > 0) {
      const allHeaders = Array.from(new Set(allErrorRows.flatMap(row => Object.keys(row))));
      const priorityHeaders = ['Entity Type', 'Name', 'Status', 'Error Message', 'Detail Type'];
      const sortedHeaders = [
        ...priorityHeaders.filter(h => allHeaders.includes(h)),
        ...allHeaders.filter(h => !priorityHeaders.includes(h)).sort()
      ];

      const errorSheet = XLSX.utils.json_to_sheet(allErrorRows, { header: sortedHeaders });
      errorSheet['!cols'] = sortedHeaders.map(h => ({ wch: Math.min(Math.max(h.length, 12), 50) }));
      XLSX.utils.book_append_sheet(workbook, errorSheet, 'Errors');
    }
  }

  // Save the workbook
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `upload-complete-report-${timestamp}.xlsx`);
}

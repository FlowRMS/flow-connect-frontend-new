'use client';

import React, { useState, Suspense, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { toast } from 'sonner';
import { WorkflowBreadcrumb } from '@/components/flow-ai/flowrms/WorkflowBreadcrumb';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Q_GET_PENDING, Q_PENDING_DOCUMENT_PROCESSINGS } from '@/lib/flow-ai/gql';

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

// Types for the pendingDocumentProcessings query
interface ProcessingResult {
  id: string;
  pendingDocumentId: string;
  dtoJson: string | null;
  entityId: string | null;
  errorMessage: string | null;
  status: 'CREATED' | 'SKIPPED' | 'ERROR' | 'PENDING' | string;
}

type StatusFilter = 'all' | 'CREATED' | 'SKIPPED' | 'ERROR';

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

  // Data state
  const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ref to prevent double execution in React strict mode
  const hasInitialized = useRef(false);

  // Fetch processing results
  const fetchData = useCallback(async (documentId: string) => {
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
      setLoadError(null);
    } catch (error) {
      console.error('Error fetching processing results:', error);
      setLoadError('Failed to load processing results');
    }
  }, []);

  // Fetch pending document and then processing results
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
        // Fetch processing results directly using pendingId
        await fetchData(pendingId);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing upload-complete:', error);
        setLoadError('An error occurred while loading processing data');
        setIsLoading(false);
      }
    };

    initialize();
  }, [effectiveParams, pendingId, fetchData]);

  const handleDone = () => {
    router.push('/flow-ai/queue');
  };

  // Calculate counts by status
  const counts = useMemo(() => {
    const created = processingResults.filter(r => r.status === 'CREATED').length;
    const skipped = processingResults.filter(r => r.status === 'SKIPPED').length;
    const error = processingResults.filter(r => r.status === 'ERROR').length;
    return { created, skipped, error, total: processingResults.length };
  }, [processingResults]);

  // Filter results based on selected status
  const filteredResults = useMemo(() => {
    if (statusFilter === 'all') return processingResults;
    return processingResults.filter(r => r.status === statusFilter);
  }, [processingResults, statusFilter]);

  const hasAnyResults = processingResults.length > 0;

  // Show full-page loading while waiting for params or initial data load
  if (effectiveParams === null || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading processing results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <WorkflowBreadcrumb currentStep="complete" showMapColumns={isFromSpreadsheet} />

        {/* Header */}
        <Header />

        {/* Error message */}
        {loadError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="flex items-center gap-2">
              {loadError}
            </p>
          </div>
        )}

        {/* No data state - shown when loading is complete and no results exist */}
        {!loadError && !hasAnyResults && (
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No processing results found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">The document was processed but no entities were created or skipped.</p>
          </div>
        )}

        {/* Summary Cards */}
        {hasAnyResults && (
          <SummaryCards
            counts={counts}
            activeFilter={statusFilter}
            onFilterClick={setStatusFilter}
          />
        )}

        {/* Processing Results Table */}
        {hasAnyResults && (
          <ProcessingResultsTable results={filteredResults} />
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
function Header() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload Complete</h1>
      </div>
      <p className="text-muted-foreground">
        Your document has been processed. Here&apos;s a summary of all processing results.
      </p>
    </div>
  );
}

// Summary Cards Component
interface SummaryCardsProps {
  counts: { created: number; skipped: number; error: number; total: number };
  activeFilter: StatusFilter;
  onFilterClick: (filter: StatusFilter) => void;
}

function SummaryCards({ counts, activeFilter, onFilterClick }: SummaryCardsProps) {
  const cards: { key: StatusFilter; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    {
      key: 'all',
      label: 'All',
      count: counts.total,
      icon: <FileText className="w-4 h-4 text-blue-600" />,
      color: 'blue'
    },
    {
      key: 'CREATED',
      label: 'Created',
      count: counts.created,
      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
      color: 'green'
    },
    {
      key: 'SKIPPED',
      label: 'Skipped',
      count: counts.skipped,
      icon: <SkipForward className="w-4 h-4 text-yellow-600" />,
      color: 'yellow'
    },
    {
      key: 'ERROR',
      label: 'Errors',
      count: counts.error,
      icon: <XCircle className="w-4 h-4 text-red-600" />,
      color: 'red'
    },
  ];

  // Only show cards that have counts (except 'all' which is always shown)
  const visibleCards = cards.filter(card => card.key === 'all' || card.count > 0);

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-card">
      <div className="flex items-center flex-wrap gap-4">
        {visibleCards.map((card) => (
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
    yellow: isActive ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
    red: isActive ? 'border-red-500 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
  };

  const textColorClasses: Record<string, string> = {
    blue: isActive ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300',
    green: isActive ? 'text-green-600' : 'text-gray-700 dark:text-gray-300',
    yellow: isActive ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300',
    red: isActive ? 'text-red-600' : 'text-gray-700 dark:text-gray-300',
  };

  const checkColorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
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
        <span className="text-xs text-muted-foreground">items</span>
      </div>
    </button>
  );
}

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

// Parse dtoJson to get all displayable fields
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
        if (value.length > 0) {
          fields.push({ key: formatFieldName(key), value: `${value.length} items` });
        }
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

// Processing Results Table Component
function ProcessingResultsTable({ results }: { results: ProcessingResult[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Processing Results ({results.length})
        </CardTitle>
        <CardDescription>
          Click on a row to expand and see more details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold w-10"></th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const isExpanded = expandedRows.has(result.id);
                const fields = getAllFields(result.dtoJson);
                const entityType = getEntityType(result.dtoJson);
                const displayName = getDisplayName(result.dtoJson);

                return (
                  <React.Fragment key={result.id}>
                    <tr
                      className={`border-b hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/20' : ''}`}
                      onClick={() => toggleRow(result.id)}
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
                          <div className="ml-8">
                            {fields.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                                {fields.map((field: { key: string; value: string }, idx: number) => (
                                  <div key={idx} className="text-sm py-1">
                                    <span className="text-slate-500 font-medium">{field.key}:</span>{' '}
                                    <span className="text-slate-700 dark:text-slate-300">{field.value || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No additional details available</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

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
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { toast } from 'sonner';
import { WorkflowBreadcrumb } from '@/components/flow-ai/flowrms/WorkflowBreadcrumb';
import { fetchRelatedEntities } from '@/components/lib/graphql/entity-links';
import type { RelatedEntities } from '@/components/lib/graphql/types';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Q_GET_PENDING, Q_PENDING_DOCUMENT_PROCESSINGS } from '@/lib/flow-ai/gql';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
          };
        }>({
          query: Q_GET_PENDING,
          variables: { pendingId },
          fetchPolicy: 'no-cache',
        });

        const pendingDoc = pendingDocResult.data?.getPendingDocument;

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

  // PDF Export state and handler
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        relatedData,
        skippedResults,
        errorResults,
      });
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  }, [relatedData, skippedResults, errorResults]);

  const totalEntities = quotesCount + ordersCount + invoicesCount + customersCount + productsCount + factoriesCount + checksCount;
  const hasAnyEntities = totalEntities > 0;
  const hasSkippedOrErrors = skippedCount > 0 || errorCount > 0;
  const hasAnything = hasAnyEntities || hasSkippedOrErrors;

  // Show full-page loading while waiting for params or initial data load
  if (effectiveParams === null || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document data...</p>
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
        <Header
          onExportPDF={handleExportPDF}
          isExporting={isExporting}
          hasData={hasAnything}
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
  onExportPDF?: () => void;
  isExporting?: boolean;
  hasData?: boolean;
}

function Header({ onExportPDF, isExporting, hasData }: HeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upload Complete</h1>
        {hasData && onExportPDF && (
          <Button
            variant="outline"
            onClick={onExportPDF}
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
                Export PDF
              </>
            )}
          </Button>
        )}
      </div>
      <p className="text-muted-foreground">
        Your document has been processed. Here&apos;s a summary of all entities linked to this file.
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
      return `/checks/${id}`;
    default:
      return '#';
  }
}

// Quotes Table Component
function QuotesTable({ quotes }: { quotes: RelatedEntities['quotes'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Quotes ({quotes.length})
        </CardTitle>
        <CardDescription>
          Quotes linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Quote #</th>
                <th className="px-4 py-3 text-left font-semibold">Entity Date</th>
                <th className="px-4 py-3 text-left font-semibold">Exp Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Blanket</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Orders Table Component
function OrdersTable({ orders }: { orders: RelatedEntities['orders'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-green-600" />
          Orders ({orders.length})
        </CardTitle>
        <CardDescription>
          Orders linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Order #</th>
                <th className="px-4 py-3 text-left font-semibold">Factory SO</th>
                <th className="px-4 py-3 text-left font-semibold">Entity Date</th>
                <th className="px-4 py-3 text-left font-semibold">Ship Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Invoices Table Component
function InvoicesTable({ invoices }: { invoices: RelatedEntities['invoices'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-purple-600" />
          Invoices ({invoices.length})
        </CardTitle>
        <CardDescription>
          Invoices linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Invoice #</th>
                <th className="px-4 py-3 text-left font-semibold">Entity Date</th>
                <th className="px-4 py-3 text-left font-semibold">Due Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Locked</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Customers Table Component
function CustomersTable({ customers }: { customers: RelatedEntities['customers'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-orange-600" />
          Customers ({customers.length})
        </CardTitle>
        <CardDescription>
          Customers linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Company Name</th>
                <th className="px-4 py-3 text-left font-semibold">Is Parent</th>
                <th className="px-4 py-3 text-left font-semibold">Published</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Products Table Component
function ProductsTable({ products }: { products: RelatedEntities['products'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-cyan-600" />
          Products ({products.length})
        </CardTitle>
        <CardDescription>
          Products linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Part Number</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="px-4 py-3 text-right font-semibold">Commission Rate</th>
                <th className="px-4 py-3 text-left font-semibold">Published</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-sm">
                    <span className="text-cyan-600">{product.factoryPartNumber || product.id}</span>
                  </td>
                  <td className="px-4 py-3">{product.description || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    {product.unitPrice != null ? `$${product.unitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {product.defaultCommissionRate != null ? `${(product.defaultCommissionRate * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {product.published ? <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Yes</Badge> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Factories Table Component
function FactoriesTable({ factories }: { factories: RelatedEntities['factories'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-indigo-600" />
          Factories ({factories.length})
        </CardTitle>
        <CardDescription>
          Factories linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Account Number</th>
                <th className="px-4 py-3 text-left font-semibold">Published</th>
              </tr>
            </thead>
            <tbody>
              {factories.map((factory) => (
                <tr key={factory.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-medium">
                    <span className="text-indigo-600">{factory.title || factory.id}</span>
                  </td>
                  <td className="px-4 py-3">{factory.accountNumber || '-'}</td>
                  <td className="px-4 py-3">
                    {factory.published ? <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">Yes</Badge> : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Checks Table Component
function ChecksTable({ checks }: { checks: RelatedEntities['checks'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Checks ({checks.length})
        </CardTitle>
        <CardDescription>
          Checks linked to this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Check #</th>
                <th className="px-4 py-3 text-right font-semibold">Commission</th>
                <th className="px-4 py-3 text-left font-semibold">Commission Month</th>
                <th className="px-4 py-3 text-left font-semibold">Entity Date</th>
                <th className="px-4 py-3 text-left font-semibold">Post Date</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
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
              ))}
            </tbody>
          </table>
        </div>
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
function ProcessingResultsTable({ results, title, icon }: { results: ProcessingResult[]; title: string; icon: React.ReactNode }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({results.length})
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
              {results.map((result) => (
                <ProcessingResultRow
                  key={result.id}
                  result={result}
                  isExpanded={expandedRows.has(result.id)}
                  onToggle={() => toggleRow(result.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
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

// PDF Export Function
interface PDFExportData {
  relatedData: RelatedEntities | null;
  skippedResults: ProcessingResult[];
  errorResults: ProcessingResult[];
}

async function exportToPDF(data: PDFExportData): Promise<void> {
  const { relatedData, skippedResults, errorResults } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235];
  const darkColor: [number, number, number] = [31, 41, 55];
  const lightGray: [number, number, number] = [107, 114, 128];

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Upload Complete Report', margin, yPos);
  yPos += 8;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
  yPos += 15;

  // Summary section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Summary', margin, yPos);
  yPos += 8;

  const summaryItems = [
    { label: 'Quotes', count: relatedData?.quotes?.length || 0 },
    { label: 'Orders', count: relatedData?.orders?.length || 0 },
    { label: 'Invoices', count: relatedData?.invoices?.length || 0 },
    { label: 'Customers', count: relatedData?.customers?.length || 0 },
    { label: 'Products', count: relatedData?.products?.length || 0 },
    { label: 'Factories', count: relatedData?.factories?.length || 0 },
    { label: 'Checks', count: relatedData?.checks?.length || 0 },
    { label: 'Skipped', count: skippedResults.length },
    { label: 'Errors', count: errorResults.length },
  ].filter(item => item.count > 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  summaryItems.forEach((item, idx) => {
    const xOffset = margin + (idx % 3) * 60;
    const yOffset = yPos + Math.floor(idx / 3) * 6;
    doc.text(`${item.label}: ${item.count}`, xOffset, yOffset);
  });
  yPos += Math.ceil(summaryItems.length / 3) * 6 + 10;

  // Helper to add section with table
  const addSection = (title: string, headers: string[], rows: string[][]) => {
    if (rows.length === 0) return;

    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`${title} (${rows.length})`, margin, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: darkColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    yPos = (doc as any).lastAutoTable?.finalY + 10 || yPos + 20;
  };

  // Add entity tables
  if (relatedData?.quotes && relatedData.quotes.length > 0) {
    addSection('Quotes',
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

  if (relatedData?.orders && relatedData.orders.length > 0) {
    addSection('Orders',
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

  if (relatedData?.invoices && relatedData.invoices.length > 0) {
    addSection('Invoices',
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

  if (relatedData?.customers && relatedData.customers.length > 0) {
    addSection('Customers',
      ['Company Name', 'Is Parent', 'Published'],
      relatedData.customers.map(c => [
        c.companyName || c.id,
        c.isParent ? 'Yes' : '-',
        c.published ? 'Yes' : '-'
      ])
    );
  }

  if (relatedData?.products && relatedData.products.length > 0) {
    addSection('Products',
      ['Part Number', 'Description', 'Unit Price', 'Commission Rate', 'Published'],
      relatedData.products.map(p => [
        p.factoryPartNumber || p.id,
        p.description || '-',
        p.unitPrice != null ? `$${p.unitPrice.toFixed(2)}` : '-',
        p.defaultCommissionRate != null ? `${(p.defaultCommissionRate * 100).toFixed(1)}%` : '-',
        p.published ? 'Yes' : '-'
      ])
    );
  }

  if (relatedData?.factories && relatedData.factories.length > 0) {
    addSection('Factories',
      ['Title', 'Account Number', 'Published'],
      relatedData.factories.map(f => [
        f.title || f.id,
        f.accountNumber || '-',
        f.published ? 'Yes' : '-'
      ])
    );
  }

  if (relatedData?.checks && relatedData.checks.length > 0) {
    addSection('Checks',
      ['Check #', 'Commission', 'Commission Month', 'Entity Date', 'Post Date', 'Status'],
      relatedData.checks.map(c => [
        c.checkNumber || c.id,
        c.enteredCommissionAmount != null ? `$${Number(c.enteredCommissionAmount).toFixed(2)}` : '-',
        c.commissionMonth || '-',
        formatDate(c.entityDate),
        formatDate(c.postDate),
        c.status || '-'
      ])
    );
  }

  // Add Skipped Items with full details
  if (skippedResults.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(202, 138, 4); // Yellow color
    doc.text(`Skipped Items (${skippedResults.length})`, margin, yPos);
    yPos += 8;

    for (const result of skippedResults) {
      if (yPos > 260) {
        doc.addPage();
        yPos = margin;
      }

      const entityType = getEntityType(result.dtoJson);
      const displayName = getDisplayName(result.dtoJson);
      const fields = getAllFields(result.dtoJson);
      const arrayFields = getArrayFields(result.dtoJson);

      // Item header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text(`${entityType}: ${displayName}`, margin, yPos);
      yPos += 5;

      if (result.errorMessage) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(202, 138, 4);
        doc.text(`Message: ${result.errorMessage}`, margin, yPos);
        yPos += 5;
      }

      // Basic fields
      if (fields.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        fields.forEach((field, idx) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = margin;
          }
          const xOffset = margin + (idx % 2) * 90;
          if (idx % 2 === 0 && idx > 0) yPos += 4;
          doc.text(`${field.key}: ${field.value}`, xOffset, yPos);
        });
        yPos += 6;
      }

      // Array fields (details)
      for (const arrayField of arrayFields) {
        if (arrayField.items.length === 0) continue;

        const columns = getArrayItemColumns(arrayField.items);
        if (columns.length === 0) continue;

        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text(`${arrayField.key} (${arrayField.items.length} items)`, margin + 5, yPos);
        yPos += 4;

        autoTable(doc, {
          startY: yPos,
          head: [columns.map(formatFieldName)],
          body: arrayField.items.map(item => columns.map(col => formatCellValue(item[col]))),
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
          margin: { left: margin + 5, right: margin },
        });

        yPos = (doc as any).lastAutoTable?.finalY + 6 || yPos + 20;
      }

      yPos += 4;
    }
  }

  // Add Error Items with full details
  if (errorResults.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Red color
    doc.text(`Errors (${errorResults.length})`, margin, yPos);
    yPos += 8;

    for (const result of errorResults) {
      if (yPos > 260) {
        doc.addPage();
        yPos = margin;
      }

      const entityType = getEntityType(result.dtoJson);
      const displayName = getDisplayName(result.dtoJson);
      const fields = getAllFields(result.dtoJson);
      const arrayFields = getArrayFields(result.dtoJson);

      // Item header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text(`${entityType}: ${displayName}`, margin, yPos);
      yPos += 5;

      if (result.errorMessage) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(220, 38, 38);
        doc.text(`Error: ${result.errorMessage}`, margin, yPos);
        yPos += 5;
      }

      // Basic fields
      if (fields.length > 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightGray);
        fields.forEach((field, idx) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = margin;
          }
          const xOffset = margin + (idx % 2) * 90;
          if (idx % 2 === 0 && idx > 0) yPos += 4;
          doc.text(`${field.key}: ${field.value}`, xOffset, yPos);
        });
        yPos += 6;
      }

      // Array fields (details)
      for (const arrayField of arrayFields) {
        if (arrayField.items.length === 0) continue;

        const columns = getArrayItemColumns(arrayField.items);
        if (columns.length === 0) continue;

        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text(`${arrayField.key} (${arrayField.items.length} items)`, margin + 5, yPos);
        yPos += 4;

        autoTable(doc, {
          startY: yPos,
          head: [columns.map(formatFieldName)],
          body: arrayField.items.map(item => columns.map(col => formatCellValue(item[col]))),
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 1.5 },
          headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
          margin: { left: margin + 5, right: margin },
        });

        yPos = (doc as any).lastAutoTable?.finalY + 6 || yPos + 20;
      }

      yPos += 4;
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    doc.text('Generated by FlowRMS', margin, doc.internal.pageSize.getHeight() - 10);
  }

  // Save
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`upload-complete-report-${timestamp}.pdf`);
}

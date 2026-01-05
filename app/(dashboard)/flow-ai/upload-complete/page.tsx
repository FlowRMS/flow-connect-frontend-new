'use client';

import { useState, Suspense, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { toast } from 'sonner';
import { WorkflowBreadcrumb } from '@/components/flow-ai/flowrms/WorkflowBreadcrumb';
import { fetchRelatedEntities } from '@/components/lib/graphql/entity-links';
import type { RelatedEntities } from '@/components/lib/graphql/types';
import { flowrmsApolloClient } from '@/lib/flow-ai/flowrms-apollo';
import { Q_GET_PENDING } from '@/lib/flow-ai/gql';

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

type EntityCategory = 'quotes' | 'orders' | 'invoices' | 'customers' | 'products' | 'factories' | 'checks';

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

  // Data state - using RelatedEntities type from the CRM
  const [relatedData, setRelatedData] = useState<RelatedEntities | null>(null);

  // UI state
  const [activeFilter, setActiveFilter] = useState<EntityCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Ref to prevent double execution in React strict mode
  const hasInitialized = useRef(false);

  // Fetch related entities using the CRM relatedEntities endpoint
  const fetchData = useCallback(async (documentId: string) => {
    try {
      console.log('Fetching related entities for documentId:', documentId);
      const data = await fetchRelatedEntities(documentId, 'FILES');
      console.log('Related entities data:', data);
      setRelatedData(data);
      setLoadError(null);
    } catch (error) {
      console.error('Error fetching related entities:', error);
      setLoadError('Failed to load related entities');
    }
  }, []);

  // Fetch pending document and then related entities
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

        if (!pendingDoc?.fileId) {
          console.error('Missing fileId from pending document:', pendingDoc);
          setLoadError('Unable to process: missing document information');
          setIsLoading(false);
          return;
        }

        const fileId = pendingDoc.fileId;
        console.log('Got fileId:', fileId);

        // Step 2: Fetch related entities using the fileId
        await fetchData(fileId);
        setIsLoading(false);

      } catch (error) {
        console.error('Error initializing upload-complete:', error);
        setLoadError('An error occurred while loading document data');
        setIsLoading(false);
      }
    };

    initialize();
  }, [effectiveParams, pendingId, fetchData]);

  const handleFilterClick = (filter: EntityCategory) => {
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

  const totalEntities = quotesCount + ordersCount + invoicesCount + customersCount + productsCount + factoriesCount + checksCount;
  const hasAnyEntities = totalEntities > 0;

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
        <Header />

        {/* Error message */}
        {loadError && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            <p className="flex items-center gap-2">
              {loadError}
            </p>
          </div>
        )}

        {/* No data state - shown when loading is complete and no entities exist */}
        {!loadError && !hasAnyEntities && (
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No linked entities found</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">The document was processed but no entities were linked.</p>
          </div>
        )}

        {/* Summary Cards */}
        {hasAnyEntities && (
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
          />
        )}

        {/* Entity Tables */}
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
        Your document has been processed. Here&apos;s a summary of all entities linked to this file.
      </p>
    </div>
  );
}

// Summary Cards Component
interface SummaryCardsProps {
  activeFilter: EntityCategory | null;
  onFilterClick: (filter: EntityCategory) => void;
  quotesCount: number;
  ordersCount: number;
  invoicesCount: number;
  customersCount: number;
  productsCount: number;
  factoriesCount: number;
  checksCount: number;
}

function SummaryCards({ activeFilter, onFilterClick, quotesCount, ordersCount, invoicesCount, customersCount, productsCount, factoriesCount, checksCount }: SummaryCardsProps) {
  type CardItem = { key: EntityCategory; label: string; count: number; icon: React.ReactNode; color: string };
  const allCards: CardItem[] = [
    { key: 'quotes' as const, label: 'Quotes', count: quotesCount, icon: <FileText className="w-4 h-4 text-blue-600" />, color: 'blue' },
    { key: 'orders' as const, label: 'Orders', count: ordersCount, icon: <ShoppingCart className="w-4 h-4 text-green-600" />, color: 'green' },
    { key: 'invoices' as const, label: 'Invoices', count: invoicesCount, icon: <Receipt className="w-4 h-4 text-purple-600" />, color: 'purple' },
    { key: 'customers' as const, label: 'Customers', count: customersCount, icon: <Building2 className="w-4 h-4 text-orange-600" />, color: 'orange' },
    { key: 'products' as const, label: 'Products', count: productsCount, icon: <Package className="w-4 h-4 text-cyan-600" />, color: 'cyan' },
    { key: 'factories' as const, label: 'Factories', count: factoriesCount, icon: <Factory className="w-4 h-4 text-indigo-600" />, color: 'indigo' },
    { key: 'checks' as const, label: 'Checks', count: checksCount, icon: <DollarSign className="w-4 h-4 text-emerald-600" />, color: 'emerald' },
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
  };

  const textColorClasses: Record<string, string> = {
    blue: isActive ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300',
    green: isActive ? 'text-green-600' : 'text-gray-700 dark:text-gray-300',
    purple: isActive ? 'text-purple-600' : 'text-gray-700 dark:text-gray-300',
    orange: isActive ? 'text-orange-600' : 'text-gray-700 dark:text-gray-300',
    cyan: isActive ? 'text-cyan-600' : 'text-gray-700 dark:text-gray-300',
    indigo: isActive ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300',
    emerald: isActive ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300',
  };

  const checkColorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    cyan: 'text-cyan-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
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

// Helper to open URL - prepends NEXT_PUBLIC_FLOWRMS_APP_URL to the relative URL
function openUrl(url: string | null | undefined) {
  if (url) {
    const baseUrl = process.env.NEXT_PUBLIC_FLOWRMS_APP_URL || 'https://staging2.app.flowrms.com';
    // Remove trailing slash from base URL and leading slash from url if both present
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${cleanBaseUrl}${cleanPath}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
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
                    {quote.url ? (
                      <button
                        onClick={() => openUrl(quote.url)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {quote.quoteNumber || quote.id}
                      </button>
                    ) : (
                      <span className="text-blue-600">{quote.quoteNumber || quote.id}</span>
                    )}
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
                    {order.url ? (
                      <button
                        onClick={() => openUrl(order.url)}
                        className="text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                      >
                        {order.orderNumber || order.id}
                      </button>
                    ) : (
                      <span className="text-green-600">{order.orderNumber || order.id}</span>
                    )}
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
                    {invoice.url ? (
                      <button
                        onClick={() => openUrl(invoice.url)}
                        className="text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                      >
                        {invoice.invoiceNumber || invoice.id}
                      </button>
                    ) : (
                      <span className="text-purple-600">{invoice.invoiceNumber || invoice.id}</span>
                    )}
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
                    {check.url ? (
                      <button
                        onClick={() => openUrl(check.url)}
                        className="text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                      >
                        {check.checkNumber || check.id}
                      </button>
                    ) : (
                      <span className="text-emerald-600">{check.checkNumber || check.id}</span>
                    )}
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

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  ListTodo,
  RefreshCw,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  ShoppingCart,
  Receipt,
  Package,
  Building2,
  Factory,
  Users,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Archive,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Trash2,
  File,
  Table as TableIcon,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent } from '@/components/flow-ai/ui/card';
import { Input } from '@/components/flow-ai/ui/input';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/flow-ai/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/flow-ai/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/flow-ai/ui/tooltip';
import { AdminSettingsDialog } from '@/components/flow-ai/flowrms/AdminSettingsDialog';
import { navigateToNewUpload } from '@/lib/flow-ai/navigation-utils';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { Q_PENDING_DOCUMENTS_LANDING, M_ARCHIVE_PENDING_DOCUMENTS } from '@/lib/flow-ai/gql';
import { toast } from 'sonner';
import {
  PendingDocument,
  PaginatedResponse,
  AiStatus,
  DocumentType,
  EntityType,
  OrderBy,
  OrderDirection,
  AI_STATUS_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  ORDER_BY_OPTIONS,
  LandingPageFilter,
  LandingPageOrderBy,
} from '@/components/flow-ai/types/queue';

// Entity type configuration with icons and colors
const getEntityTypeConfig = (entityType: string | null) => {
  const type = (entityType || '').toUpperCase();

  switch (type) {
    case 'ORDERS':
      return {
        icon: ShoppingCart,
        bg: 'bg-violet-100 dark:bg-violet-950/40',
        text: 'text-violet-700 dark:text-violet-300',
        border: 'border-violet-200 dark:border-violet-800',
        iconBg: 'bg-violet-500',
      };
    case 'INVOICES':
      return {
        icon: Receipt,
        bg: 'bg-blue-100 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-500',
      };
    case 'QUOTES':
      return {
        icon: FileSpreadsheet,
        bg: 'bg-cyan-100 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800',
        iconBg: 'bg-cyan-500',
      };
    case 'PRODUCTS':
      return {
        icon: Package,
        bg: 'bg-orange-100 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        iconBg: 'bg-orange-500',
      };
    case 'CUSTOMERS':
      return {
        icon: Users,
        bg: 'bg-green-100 dark:bg-green-950/40',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        iconBg: 'bg-green-500',
      };
    case 'FACTORIES':
      return {
        icon: Factory,
        bg: 'bg-rose-100 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        iconBg: 'bg-rose-500',
      };
    case 'END_USERS':
      return {
        icon: Users,
        bg: 'bg-teal-100 dark:bg-teal-950/40',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800',
        iconBg: 'bg-teal-500',
      };
    case 'CHECKS':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-100 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        iconBg: 'bg-emerald-500',
      };
    case 'ORDER_ACKNOWLEDGEMENTS':
      return {
        icon: FileText,
        bg: 'bg-purple-100 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        iconBg: 'bg-purple-500',
      };
    default:
      return {
        icon: FileText,
        bg: 'bg-slate-100 dark:bg-slate-800/40',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        iconBg: 'bg-slate-500',
      };
  }
};

// AI Status badge configuration
const getAiStatusConfig = (status: string | null) => {
  const statusUpper = (status || '').toUpperCase();

  switch (statusUpper) {
    case 'APPROVED':
    case 'AUTO_APPROVED':
      return {
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'PENDING_REVIEW':
    case 'IN_REVISION':
      return {
        icon: Clock,
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    case 'REJECTED':
      return {
        icon: XCircle,
        bg: 'bg-red-50 dark:bg-red-950/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        dot: 'bg-red-500',
      };
    case 'SKIPPED':
      return {
        icon: AlertCircle,
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    default:
      return {
        icon: FileText,
        bg: 'bg-slate-50 dark:bg-slate-900/30',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
};

// Queue Status / File Status badge configuration
const getQueueFileStatusConfig = (status: string | null) => {
  const statusUpper = (status || '').toUpperCase();

  switch (statusUpper) {
    // Done / Complete states - Green
    case 'DONE':
    case 'COMPLETE':
    case 'COMPLETED':
    case 'SUCCESS':
    case 'PROCESSED':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
      };
    // In Progress states - Blue
    case 'IN_PROGRESS':
    case 'PROCESSING':
    case 'RUNNING':
    case 'ACTIVE':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
      };
    // Pending / Waiting states - Amber/Yellow
    case 'PENDING':
    case 'WAITING':
    case 'QUEUED':
    case 'PAUSED':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
      };
    // Error / Failed states - Red
    case 'ERROR':
    case 'FAILED':
    case 'FAILURE':
    case 'CANCELLED':
    case 'CANCELED':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        dot: 'bg-red-500',
      };
    // Exception states - Orange/Warning
    case 'EXCEPTION':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500',
      };
    // Playground states - Cyan/Teal
    case 'PLAYGROUND':
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        text: 'text-cyan-600 dark:text-cyan-400',
        border: 'border-cyan-200 dark:border-cyan-800',
        dot: 'bg-cyan-500',
      };
    // Skipped / Ignored states - Purple
    case 'SKIPPED':
    case 'IGNORED':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500',
      };
    // Default - Slate/Gray
    default:
      return {
        bg: 'bg-slate-50 dark:bg-slate-900/30',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
};

// Document type icon configuration
const getDocumentTypeIcon = (docType: string | null) => {
  const type = (docType || '').toUpperCase();
  switch (type) {
    case 'PDF':
      return File;
    case 'TABULAR':
      return TableIcon;
    case 'TXT':
    default:
      return FileText;
  }
};

const EntityTypeBadge = ({ entityType }: { entityType: string | null }) => {
  const config = getEntityTypeConfig(entityType);
  const Icon = config.icon;
  const displayText = formatEntityType(entityType);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.border} border`}>
      <div className={`p-1 rounded-md ${config.iconBg}`}>
        <Icon className="w-3 h-3 text-white" />
      </div>
      <span className={`text-xs font-semibold ${config.text}`}>{displayText}</span>
    </div>
  );
};

const StatusBadge = ({ status, type = 'ai' }: { status: string | null; type?: 'ai' | 'file' }) => {
  const config = type === 'ai' ? getAiStatusConfig(status) : getQueueFileStatusConfig(status);
  const displayText = formatStatus(status);

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md ${config.bg} ${config.border} border`}>
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-medium ${config.text}`}>{displayText}</span>
    </div>
  );
};

// Format date for display (converts UTC to local timezone)
const formatDate = (dateString: string) => {
  // Parse the date string - handles both Z suffix and timezone offset formats (+00:00, -05:00, etc.)
  // ISO 8601 dates with timezone offsets are valid and don't need modification
  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

// Format exact date and time for tooltip (12-hour format with AM/PM)
const formatExactDateTime = (dateString: string) => {
  // Parse the date string - handles both Z suffix and timezone offset formats (+00:00, -05:00, etc.)
  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Format entity type for display
const formatEntityType = (entityType: string | null) => {
  if (!entityType) return 'Unknown';
  return entityType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Format status for display
const formatStatus = (status: string | null) => {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

function QueuePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apolloClient = useApolloClient();

  // Document state
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selection state for archive
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [aiStatusFilter, setAiStatusFilter] = useState<AiStatus | 'all'>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType | 'all'>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityType | 'all'>('all');
  const [createdByIdFilter, setCreatedByIdFilter] = useState<string | 'all'>('all');

  // Track unique creators from loaded documents for the filter dropdown
  const [uniqueCreators, setUniqueCreators] = useState<{ id: string; name: string }[]>([]);

  // Sorting state
  const [orderBy, setOrderBy] = useState<OrderBy>('CREATED_AT');
  const [orderDirection, setOrderDirection] = useState<OrderDirection>('DESC');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Archive mutation
  const [archiveMutation, { loading: archiving }] = useMutation(M_ARCHIVE_PENDING_DOCUMENTS);

  // localStorage key for saved filters
  const QUEUE_FILTERS_KEY = 'flowrms_queue_filters';

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(QUEUE_FILTERS_KEY);
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        if (filters.searchTerm) setSearchTerm(filters.searchTerm);
        if (filters.aiStatusFilter) setAiStatusFilter(filters.aiStatusFilter);
        if (filters.documentTypeFilter) setDocumentTypeFilter(filters.documentTypeFilter);
        if (filters.entityTypeFilter) setEntityTypeFilter(filters.entityTypeFilter);
        if (filters.createdByIdFilter) setCreatedByIdFilter(filters.createdByIdFilter);
        if (filters.orderBy) setOrderBy(filters.orderBy);
        if (filters.orderDirection) setOrderDirection(filters.orderDirection);
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  }, []);

  // Save filters to localStorage
  const saveFiltersToLocalStorage = useCallback(() => {
    try {
      const filters = {
        searchTerm,
        aiStatusFilter,
        documentTypeFilter,
        entityTypeFilter,
        createdByIdFilter,
        orderBy,
        orderDirection,
      };
      localStorage.setItem(QUEUE_FILTERS_KEY, JSON.stringify(filters));
      toast.success('Filters saved successfully');
    } catch (error) {
      console.error('Failed to save filters:', error);
      toast.error('Failed to save filters');
    }
  }, [searchTerm, aiStatusFilter, documentTypeFilter, entityTypeFilter, createdByIdFilter, orderBy, orderDirection]);

  // Clear saved filters from localStorage
  const clearSavedFilters = useCallback(() => {
    try {
      localStorage.removeItem(QUEUE_FILTERS_KEY);
      toast.success('Saved filters cleared');
    } catch (error) {
      console.error('Failed to clear saved filters:', error);
      toast.error('Failed to clear saved filters');
    }
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, aiStatusFilter, documentTypeFilter, entityTypeFilter, createdByIdFilter, orderBy, orderDirection]);

  // Capture realm from URL and set tenant
  useEffect(() => {
    const urlRealm = searchParams.get('realm');
    if (urlRealm) {
      fetch(`/set-tenant?realm=${urlRealm}`, { method: 'GET' })
        .then(() => console.log('Set tenant realm from URL:', urlRealm))
        .catch((err) => console.error('Failed to set tenant realm:', err));
    }
  }, [searchParams]);

  // Build filter array for findLandingPages
  const buildFilters = useCallback((): LandingPageFilter[] | undefined => {
    const filters: LandingPageFilter[] = [];

    if (aiStatusFilter !== 'all') {
      filters.push({ columnName: 'status', operator: 'EQ', value: aiStatusFilter });
    }
    if (documentTypeFilter !== 'all') {
      filters.push({ columnName: 'documentType', operator: 'EQ', value: documentTypeFilter });
    }
    if (entityTypeFilter !== 'all') {
      filters.push({ columnName: 'entityType', operator: 'EQ', value: entityTypeFilter });
    }
    if (debouncedSearchTerm.trim()) {
      filters.push({ columnName: 'fileName', operator: 'ILIKE', value: debouncedSearchTerm.trim() });
    }
    if (createdByIdFilter !== 'all') {
      filters.push({ columnName: 'createdById', operator: 'EQ', value: createdByIdFilter });
    }

    return filters.length > 0 ? filters : undefined;
  }, [aiStatusFilter, documentTypeFilter, entityTypeFilter, debouncedSearchTerm, createdByIdFilter]);

  // Build orderBy array for findLandingPages (note: it's an array in the schema)
  const buildOrderBy = useCallback((): LandingPageOrderBy[] | undefined => {
    // Map the OrderBy enum to column names
    const columnMap: Record<OrderBy, string> = {
      'CREATED_AT': 'createdAt',
      'AI_STATUS': 'status',
      'ENTITY_TYPE': 'entityType',
      'CLUSTER_NAME': 'clusterName',
    };

    return [{
      columnName: columnMap[orderBy],
      direction: orderDirection,
    }];
  }, [orderBy, orderDirection]);

  // Fetch documents
  const fetchDocuments = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const offset = (currentPage - 1) * pageSize;
      const filters = buildFilters();
      const orderByInput = buildOrderBy();

      const { data } = await apolloClient.query<PaginatedResponse>({
        query: Q_PENDING_DOCUMENTS_LANDING,
        variables: {
          limit: pageSize,
          offset,
          filters,
          orderBy: orderByInput,
        },
        fetchPolicy: 'network-only',
      });

      const response = data?.findLandingPages;
      const items = response?.records || [];
      setDocuments(items);
      setTotalCount(response?.total || 0);

      // Update unique creators list (merge with existing to keep all seen creators)
      setUniqueCreators(prev => {
        const existingMap = new Map(prev.map(c => [c.id, c]));
        items.forEach(doc => {
          if (doc.createdById && doc.createdBy && !existingMap.has(doc.createdById)) {
            existingMap.set(doc.createdById, { id: doc.createdById, name: doc.createdBy });
          }
        });
        return Array.from(existingMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      });

      if (showRefreshToast) {
        toast.success('Queue refreshed');
      }
    } catch (error) {
      toast.error('Failed to load queue', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apolloClient, currentPage, pageSize, buildFilters, buildOrderBy]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchDocuments(false);
  }, [fetchDocuments]);

  // Handle document click - redirect based on workflow status
  // Note: Using new field names from findLandingPages:
  //   - id = pending document ID
  //   - workflowStatus = queue/workflow status (was queueStatus)
  //   - status = file status (was fileStatus)
  const handleDocumentClick = (doc: PendingDocument) => {
    const params = new URLSearchParams();
    params.set('pendingId', doc.id);

    // If file status is 'Exception', redirect to processing-errors page
    if (doc.status?.toUpperCase() === 'EXCEPTION') {
      router.push(`/flow-ai/processing-errors?${params.toString()}`);
      return;
    }

    const workflowStatus = doc.workflowStatus?.toUpperCase();

    // If workflow status is 'IN_PROGRESS', show toast and do nothing
    if (workflowStatus === 'IN_PROGRESS') {
      toast.info('Document is still being processed. Please wait.');
      return;
    }

    // If workflow status is 'COMPLETED', 'DONE', or 'FAILED', redirect to upload-complete page
    // FAILED status allows users to view the errors and details
    if (workflowStatus === 'COMPLETED' || workflowStatus === 'DONE' || workflowStatus === 'FAILED') {
      // For TABULAR (spreadsheet) documents, add source=spreadsheet
      if (doc.documentType?.toUpperCase() === 'TABULAR') {
        params.set('source', 'spreadsheet');
      }
      router.push(`/flow-ai/upload-complete?${params.toString()}`);
      return;
    }

    // If workflow status is null/undefined, redirect to preview page
    if (!doc.workflowStatus) {
      router.push(`/flow-ai?pendingId=${doc.id}`);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchDocuments(true);
  };

  // Handle select all / deselect all
  // If any items are selected, deselect all. Otherwise, select all.
  const handleSelectAll = () => {
    if (selectedIds.size > 0) {
      // If any are selected, deselect all
      setSelectedIds(new Set());
    } else {
      // If none are selected, select all
      setSelectedIds(new Set(documents.map(d => d.id)));
    }
  };

  // Handle individual selection
  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Handle archive
  const handleArchive = async () => {
    if (selectedIds.size === 0) return;

    try {
      await archiveMutation({
        variables: {
          pendingIds: Array.from(selectedIds),
        },
      });

      toast.success(`${selectedIds.size} document(s) archived`);
      setSelectedIds(new Set());
      setShowArchiveDialog(false);
      fetchDocuments(false);
    } catch (error) {
      toast.error('Failed to archive documents', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle sort
  const handleSort = (column: OrderBy) => {
    if (orderBy === column) {
      setOrderDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(column);
      setOrderDirection('DESC');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setAiStatusFilter('all');
    setDocumentTypeFilter('all');
    setEntityTypeFilter('all');
    setCreatedByIdFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || aiStatusFilter !== 'all' || documentTypeFilter !== 'all' || entityTypeFilter !== 'all' || createdByIdFilter !== 'all';

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Sort indicator component
  const SortIndicator = ({ column }: { column: OrderBy }) => {
    if (orderBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return orderDirection === 'ASC'
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
                  <ListTodo className="w-6 h-6 text-primary" />
                </div>
                Document Queue
              </h2>
              <p className="text-muted-foreground">
                View and manage pending documents awaiting review
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <Button
                  onClick={() => setShowArchiveDialog(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive ({selectedIds.size})
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                {/* Search and Filters Row */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by file name, ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={aiStatusFilter} onValueChange={(v) => setAiStatusFilter(v as AiStatus | 'all')}>
                      <SelectTrigger className="w-[180px] focus:ring-0 focus:ring-offset-0">
                        <Filter className="w-4 h-4 mr-2 shrink-0" />
                        <SelectValue placeholder="AI Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All AI Statuses</SelectItem>
                        {AI_STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={documentTypeFilter} onValueChange={(v) => setDocumentTypeFilter(v as DocumentType | 'all')}>
                      <SelectTrigger className="w-[170px] focus:ring-0 focus:ring-offset-0">
                        <FileText className="w-4 h-4 mr-2 shrink-0" />
                        <SelectValue placeholder="Doc Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Doc Types</SelectItem>
                        {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={entityTypeFilter} onValueChange={(v) => setEntityTypeFilter(v as EntityType | 'all')}>
                      <SelectTrigger className="w-[190px] focus:ring-0 focus:ring-offset-0">
                        <Building2 className="w-4 h-4 mr-2 shrink-0" />
                        <SelectValue placeholder="Entity Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entity Types</SelectItem>
                        {ENTITY_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={createdByIdFilter} onValueChange={(v) => setCreatedByIdFilter(v)}>
                      <SelectTrigger className="w-[180px] focus:ring-0 focus:ring-offset-0">
                        <Users className="w-4 h-4 mr-2 shrink-0" />
                        <SelectValue placeholder="Created By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {uniqueCreators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id}>
                            {creator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                        <X className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Sort Row */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select value={orderBy} onValueChange={(v) => setOrderBy(v as OrderBy)}>
                      <SelectTrigger className="w-[150px] focus:ring-0 focus:ring-offset-0">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_BY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                      className="gap-1 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                    >
                      {orderDirection === 'ASC' ? (
                        <>
                          <ArrowUp className="w-4 h-4" />
                          Ascending
                        </>
                      ) : (
                        <>
                          <ArrowDown className="w-4 h-4" />
                          Descending
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveFiltersToLocalStorage}
                      className="gap-2 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                    >
                      <Save className="w-4 h-4" />
                      Save Filters
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSavedFilters}
                      className="gap-1 text-muted-foreground hover:text-destructive focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                      title="Clear saved filters"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="w-full flex items-center justify-center py-20">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                      <Loader2 className="w-12 h-12 animate-spin text-primary relative" />
                    </div>
                    <p className="text-muted-foreground">Loading documents...</p>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-5 bg-muted/30 rounded-2xl mb-4">
                    <FileText className="w-14 h-14 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                  <p className="text-muted-foreground max-w-sm mb-4">
                    {hasActiveFilters
                      ? 'Try adjusting your search or filter criteria'
                      : 'Upload a new document to get started'}
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline" className="mt-2">
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                  {!hasActiveFilters && (
                    <Button onClick={navigateToNewUpload} className="mt-2">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedIds.size === documents.length && documents.length > 0}
                            // Show indeterminate state when some but not all are selected
                            {...(selectedIds.size > 0 && selectedIds.size < documents.length ? { 'data-state': 'indeterminate' } : {})}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">File Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Doc Type</TableHead>
                        <TableHead className="font-semibold text-foreground">
                          <button
                            onClick={() => handleSort('ENTITY_TYPE')}
                            className="flex items-center hover:text-primary transition-colors"
                          >
                            Entity Type
                            <SortIndicator column="ENTITY_TYPE" />
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          <button
                            onClick={() => handleSort('CLUSTER_NAME')}
                            className="flex items-center hover:text-primary transition-colors"
                          >
                            Template
                            <SortIndicator column="CLUSTER_NAME" />
                          </button>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">File Status</TableHead>
                        <TableHead className="font-semibold text-foreground">Workflow Status</TableHead>
                        <TableHead className="font-semibold text-foreground">Created By</TableHead>
                        <TableHead className="font-semibold text-foreground">
                          <button
                            onClick={() => handleSort('CREATED_AT')}
                            className="flex items-center hover:text-primary transition-colors"
                          >
                            Created
                            <SortIndicator column="CREATED_AT" />
                          </button>
                        </TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc, index) => {
                        const entityConfig = getEntityTypeConfig(doc.entityType);
                        const EntityIcon = entityConfig.icon;
                        const DocTypeIcon = getDocumentTypeIcon(doc.documentType);
                        const uniqueKey = `${doc.id}-${index}`;
                        const isSelected = selectedIds.has(doc.id);
                        const isNewDocument = doc.isNew;

                        return (
                          <TableRow
                            key={uniqueKey}
                            className={`cursor-pointer group transition-all duration-300 ${
                              isNewDocument
                                ? 'bg-gradient-to-r from-primary/10 via-secondary/8 to-primary/10 border-l-4 border-l-primary shadow-sm hover:shadow-md hover:from-primary/15 hover:via-secondary/12 hover:to-primary/15'
                                : isSelected
                                  ? 'bg-primary/5 hover:bg-muted/50'
                                  : 'hover:bg-muted/50'
                            }`}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleSelect(doc.id)}
                              />
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  isNewDocument
                                    ? 'bg-gradient-to-br from-primary/25 to-secondary/20 border-primary/40 shadow-md shadow-primary/20 animate-pulse'
                                    : `${entityConfig.bg} ${entityConfig.border}`
                                } border group-hover:scale-105 transition-transform relative`}>
                                  <EntityIcon className={`w-4 h-4 ${isNewDocument ? 'text-primary' : entityConfig.text}`} />
                                  {isNewDocument && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-medium text-sm ${isNewDocument ? 'text-primary' : 'text-foreground'}`}>
                                      {doc.fileName || 'Untitled Document'}
                                    </p>
                                    {isNewDocument && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 animate-pulse">
                                        <Sparkles className="w-3 h-3" />
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {doc.id.slice(0, 8)}...
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              <div className="flex items-center gap-2">
                                <DocTypeIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{doc.documentType || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              <EntityTypeBadge entityType={doc.entityType} />
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              {doc.clusterName ? (
                                <span className="text-sm text-foreground">{doc.clusterName}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">No template</span>
                              )}
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              {doc.status ? (
                                <StatusBadge status={doc.status} type="file" />
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              {doc.workflowStatus ? (
                                <StatusBadge status={doc.workflowStatus} type="file" />
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              {doc.createdBy ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                    {doc.createdBy.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-foreground truncate max-w-[120px]" title={doc.createdBy}>
                                    {doc.createdBy}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)} className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-sm text-muted-foreground cursor-default">
                                      {formatDate(doc.createdAt)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{formatExactDateTime(doc.createdAt)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell onClick={() => handleDocumentClick(doc)}>
                              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {!loading && documents.length > 0 && (
                <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between bg-muted/10">
                  <div className="text-sm text-muted-foreground">
                    Showing {startItem} - {endItem} of {totalCount} documents
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-destructive" />
              Archive Documents
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to archive {selectedIds.size} document(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)} disabled={archiving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchive} disabled={archiving}>
              {archiving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Archive
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }
    >
      <QueuePageContent />
    </Suspense>
  );
}









'use client';

import { useState, useMemo } from 'react';
import type { Quote, QuoteSortKey, QuoteFilterValue, QuickDatePreset, QuickDateField } from '../types';
import { mockQuotes } from '../data';

/**
 * Hook for managing the main quotes list state including:
 * - Filtering (column filters, quick date filter)
 * - Sorting
 * - Bulk actions
 * - Drag-and-drop for Kanban board
 * - Mark as lost modal state
 */
export function useQuotesState() {
  // ============================================
  // MAIN QUOTES STATE
  // ============================================
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // DnD state for Kanban
  const [activeId, setActiveId] = useState<string | null>(null);

  // ============================================
  // QUOTES LIST SORTING STATE
  // ============================================
  const [quotesSortColumn, setQuotesSortColumn] = useState<QuoteSortKey | null>('entryDate');
  const [quotesSortDirection, setQuotesSortDirection] = useState<'asc' | 'desc'>('desc');

  // ============================================
  // QUOTES LIST FILTERING STATE
  // ============================================
  const [quoteColumnFilters, setQuoteColumnFilters] = useState<Record<QuoteSortKey, QuoteFilterValue | null>>({} as Record<QuoteSortKey, QuoteFilterValue | null>);
  const [activeQuoteFilterColumn, setActiveQuoteFilterColumn] = useState<QuoteSortKey | null>(null);
  const [filterSearchText, setFilterSearchText] = useState('');

  // ============================================
  // QUICK DATE FILTER STATE
  // ============================================
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // ============================================
  // BULK SELECTION STATE
  // ============================================
  const [selectedQuotesForBulk, setSelectedQuotesForBulk] = useState<Set<string>>(new Set());
  const [showQuotesBulkActionsMenu, setShowQuotesBulkActionsMenu] = useState(false);

  // ============================================
  // MARK AS LOST MODAL STATE
  // ============================================
  const [showMarkAsLostModal, setShowMarkAsLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [customLostReason, setCustomLostReason] = useState('');
  const [lostReasons, setLostReasons] = useState([
    'Price too high',
    'Lost to competitor',
    'Project cancelled',
    'Project delayed',
    'Spec changed to different brand',
    'Customer went with another supplier',
    'No response from customer',
    'Budget constraints',
    'Other'
  ]);
  const [showAddReasonInput, setShowAddReasonInput] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');

  // ============================================
  // SORTING HANDLER
  // ============================================
  const handleQuotesSort = (column: QuoteSortKey) => {
    if (quotesSortColumn === column) {
      setQuotesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setQuotesSortColumn(column);
      setQuotesSortDirection('asc');
    }
  };

  // ============================================
  // FILTER HANDLERS
  // ============================================
  const handleQuoteFilterChange = (column: QuoteSortKey, filter: QuoteFilterValue | null) => {
    setQuoteColumnFilters(prev => ({
      ...prev,
      [column]: filter
    }));
  };

  const clearQuoteFilter = (column: QuoteSortKey) => {
    setQuoteColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
    setActiveQuoteFilterColumn(null);
  };

  // Get unique values for picklist filters
  const getUniqueValuesForColumn = (column: QuoteSortKey): string[] => {
    const values = new Set<string>();
    quotes.forEach(quote => {
      switch (column) {
        case 'status':
          values.add(quote.status);
          break;
        case 'stage':
          values.add(quote.stage);
          break;
        case 'factories':
          quote.factories.forEach(f => values.add(f.name));
          break;
        case 'soldToCustomer':
          values.add(quote.soldToCustomer);
          break;
        case 'billToCustomer':
          values.add(quote.billToCustomer);
          break;
        case 'jobName':
          values.add(quote.jobName);
          break;
        case 'endUsers':
          quote.endUsers.forEach(e => values.add(e.name));
          break;
        case 'insideReps':
          quote.insideReps.forEach(r => values.add(r.name));
          break;
        case 'outsideReps':
          quote.outsideReps.forEach(r => values.add(r.name));
          break;
        case 'tags':
          quote.tags.forEach(t => values.add(t));
          break;
        case 'approvalStatus':
          values.add(quote.approvalStatus);
          break;
      }
    });
    return Array.from(values).sort();
  };

  // Determine filter type for each column
  const getFilterType = (column: QuoteSortKey): 'text' | 'select' | 'multiselect' | 'daterange' => {
    switch (column) {
      case 'status':
      case 'stage':
      case 'approvalStatus':
      case 'published':
        return 'select';
      case 'factories':
      case 'endUsers':
      case 'insideReps':
      case 'outsideReps':
      case 'tags':
        return 'multiselect';
      case 'entryDate':
      case 'quoteDate':
      case 'expirationDate':
        return 'daterange';
      default:
        return 'text';
    }
  };

  // Check if a column has an active filter
  const hasActiveFilter = (column: QuoteSortKey): boolean => {
    const filter = quoteColumnFilters[column];
    if (!filter) return false;
    switch (filter.type) {
      case 'text': return !!filter.value;
      case 'select': return !!filter.value;
      case 'multiselect': return !!filter.values && filter.values.length > 0;
      case 'daterange': return !!filter.dateFrom || !!filter.dateTo;
      default: return false;
    }
  };

  // Helper function to get date range for quick date filter
  const getQuickDateRange = (preset: QuickDatePreset): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'this_week': {
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
      }
      case 'last_week': {
        const dayOfWeek = today.getDay();
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - dayOfWeek);
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }
      default:
        return { start: null, end: null };
    }
  };

  // ============================================
  // SORTED AND FILTERED QUOTES (MEMOIZED)
  // ============================================
  const sortedQuotes = useMemo(() => {
    // First apply quick date filter
    let result = quotes;
    if (quickDatePreset !== 'all') {
      const { start, end } = getQuickDateRange(quickDatePreset);
      if (start && end) {
        result = result.filter(q => {
          const dateStr = quickDateField === 'entryDate' ? q.entryDate : q.quoteDate;
          if (!dateStr) return false;
          const date = new Date(dateStr);
          return date >= start && date <= end;
        });
      }
    }

    // Then apply column filters
    result = result.filter(quote => {
      for (const [column, filter] of Object.entries(quoteColumnFilters)) {
        if (!filter) continue;

        const col = column as QuoteSortKey;

        switch (filter.type) {
          case 'text': {
            const searchVal = filter.value.toLowerCase();
            if (!searchVal) continue;

            let fieldValue = '';
            switch (col) {
              case 'id': fieldValue = quote.id; break;
              case 'soldToCustomer': fieldValue = quote.soldToCustomer; break;
              case 'billToCustomer': fieldValue = quote.billToCustomer; break;
              case 'jobName': fieldValue = quote.jobName; break;
              case 'valueNumber': fieldValue = quote.value; break;
            }
            if (!fieldValue.toLowerCase().includes(searchVal)) return false;
            break;
          }
          case 'select': {
            if (!filter.value) continue;
            let fieldValue = '';
            switch (col) {
              case 'status': fieldValue = quote.status; break;
              case 'stage': fieldValue = quote.stage; break;
              case 'approvalStatus': fieldValue = quote.approvalStatus; break;
              case 'published': fieldValue = quote.published ? 'Yes' : 'No'; break;
            }
            if (fieldValue !== filter.value) return false;
            break;
          }
          case 'multiselect': {
            if (!filter.values || filter.values.length === 0) continue;
            let fieldValues: string[] = [];
            switch (col) {
              case 'factories': fieldValues = quote.factories.map(f => f.name); break;
              case 'endUsers': fieldValues = quote.endUsers.map(e => e.name); break;
              case 'insideReps': fieldValues = quote.insideReps.map(r => r.name); break;
              case 'outsideReps': fieldValues = quote.outsideReps.map(r => r.name); break;
              case 'tags': fieldValues = quote.tags; break;
            }
            // Check if any of the filter values match any field values
            if (!filter.values.some(v => fieldValues.includes(v))) return false;
            break;
          }
          case 'daterange': {
            let dateVal = '';
            switch (col) {
              case 'entryDate': dateVal = quote.entryDate; break;
              case 'quoteDate': dateVal = quote.quoteDate; break;
              case 'expirationDate': dateVal = quote.expirationDate; break;
            }
            if (filter.dateFrom && dateVal < filter.dateFrom) return false;
            if (filter.dateTo && dateVal > filter.dateTo) return false;
            break;
          }
        }
      }
      return true;
    });

    // Then sort
    if (quotesSortColumn) {
      result.sort((a, b) => {
        let aVal: string | number | boolean;
        let bVal: string | number | boolean;

        switch (quotesSortColumn) {
          case 'id':
            aVal = a.id;
            bVal = b.id;
            break;
          case 'status':
            aVal = a.status;
            bVal = b.status;
            break;
          case 'stage':
            aVal = a.stage;
            bVal = b.stage;
            break;
          case 'valueNumber':
            aVal = a.valueNumber;
            bVal = b.valueNumber;
            break;
          case 'billToCustomer':
            aVal = a.billToCustomer;
            bVal = b.billToCustomer;
            break;
          case 'entryDate':
            aVal = a.entryDate;
            bVal = b.entryDate;
            break;
          case 'quoteDate':
            aVal = a.quoteDate;
            bVal = b.quoteDate;
            break;
          case 'expirationDate':
            aVal = a.expirationDate;
            bVal = b.expirationDate;
            break;
          case 'factories':
            aVal = a.factories.length > 0 ? a.factories[0].name : '';
            bVal = b.factories.length > 0 ? b.factories[0].name : '';
            break;
          case 'soldToCustomer':
            aVal = a.soldToCustomer;
            bVal = b.soldToCustomer;
            break;
          case 'jobName':
            aVal = a.jobName;
            bVal = b.jobName;
            break;
          case 'winProbability':
            aVal = a.winProbability;
            bVal = b.winProbability;
            break;
          case 'approvalStatus':
            aVal = a.approvalStatus;
            bVal = b.approvalStatus;
            break;
          case 'endUsers':
            aVal = a.endUsers.length > 0 ? a.endUsers[0].name : '';
            bVal = b.endUsers.length > 0 ? b.endUsers[0].name : '';
            break;
          case 'insideReps':
            aVal = a.insideReps.length > 0 ? a.insideReps[0].name : '';
            bVal = b.insideReps.length > 0 ? b.insideReps[0].name : '';
            break;
          case 'outsideReps':
            aVal = a.outsideReps.length > 0 ? a.outsideReps[0].name : '';
            bVal = b.outsideReps.length > 0 ? b.outsideReps[0].name : '';
            break;
          case 'published':
            aVal = a.published ? 1 : 0;
            bVal = b.published ? 1 : 0;
            break;
          case 'tags':
            aVal = a.tags.join(',');
            bVal = b.tags.join(',');
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return quotesSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return quotesSortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [quotes, quotesSortColumn, quotesSortDirection, quoteColumnFilters, quickDatePreset, quickDateField]);

  // ============================================
  // RETURN ALL STATE AND HANDLERS
  // ============================================
  return {
    // Main quotes state
    quotes,
    setQuotes,
    viewMode,
    setViewMode,
    selectedQuote,
    setSelectedQuote,

    // DnD state
    activeId,
    setActiveId,

    // Sorting state and handlers
    quotesSortColumn,
    setQuotesSortColumn,
    quotesSortDirection,
    setQuotesSortDirection,
    handleQuotesSort,

    // Filtering state and handlers
    quoteColumnFilters,
    setQuoteColumnFilters,
    activeQuoteFilterColumn,
    setActiveQuoteFilterColumn,
    filterSearchText,
    setFilterSearchText,
    handleQuoteFilterChange,
    clearQuoteFilter,
    getUniqueValuesForColumn,
    getFilterType,
    hasActiveFilter,

    // Quick date filter state
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,
    getQuickDateRange,

    // Bulk selection state
    selectedQuotesForBulk,
    setSelectedQuotesForBulk,
    showQuotesBulkActionsMenu,
    setShowQuotesBulkActionsMenu,

    // Mark as lost modal state
    showMarkAsLostModal,
    setShowMarkAsLostModal,
    lostReason,
    setLostReason,
    customLostReason,
    setCustomLostReason,
    lostReasons,
    setLostReasons,
    showAddReasonInput,
    setShowAddReasonInput,
    newReasonText,
    setNewReasonText,

    // Computed/memoized values
    sortedQuotes,
  };
}

'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Quote } from '../types';

export type QuoteSortKey = 'id' | 'status' | 'valueNumber' | 'entryDate' | 'quoteDate' | 'expirationDate' | 'expDate' | 'factories' | 'factory' | 'soldToCustomer' | 'customer' | 'jobName' | 'endUsers' | 'insideReps' | 'outsideReps' | 'published' | 'stage' | 'billToCustomer' | 'billTo' | 'winProbability' | 'approvalStatus' | 'tags' | 'quoteAmount';

export type QuickDatePreset = 'all' | 'today' | 'this_week' | 'last_week';
export type QuickDateField = 'entryDate' | 'quoteDate';

export type QuoteFilterValue = {
  type: 'text' | 'select' | 'multiselect' | 'daterange';
  value: string;
  values?: string[];
  dateFrom?: string;
  dateTo?: string;
};

export function useQuotesListFilters(quotes: Quote[]) {
  // Sorting state
  const [quotesSortColumn, setQuotesSortColumn] = useState<QuoteSortKey | null>('entryDate');
  const [quotesSortDirection, setQuotesSortDirection] = useState<'asc' | 'desc'>('desc');

  // Quick date filter state
  const [quickDatePreset, setQuickDatePreset] = useState<QuickDatePreset>('all');
  const [quickDateField, setQuickDateField] = useState<QuickDateField>('entryDate');
  const [showQuickDateFieldDropdown, setShowQuickDateFieldDropdown] = useState(false);

  // Column filter state
  const [quoteColumnFilters, setQuoteColumnFilters] = useState<Record<QuoteSortKey, QuoteFilterValue | null>>({} as Record<QuoteSortKey, QuoteFilterValue | null>);
  const [activeQuoteFilterColumn, setActiveQuoteFilterColumn] = useState<QuoteSortKey | null>(null);
  const [filterSearchText, setFilterSearchText] = useState('');

  const handleQuotesSort = useCallback((column: QuoteSortKey) => {
    if (quotesSortColumn === column) {
      setQuotesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setQuotesSortColumn(column);
      setQuotesSortDirection('asc');
    }
  }, [quotesSortColumn]);

  const handleQuoteFilterChange = useCallback((column: QuoteSortKey, filter: QuoteFilterValue | null) => {
    setQuoteColumnFilters(prev => ({
      ...prev,
      [column]: filter
    }));
  }, []);

  const clearQuoteFilter = useCallback((column: QuoteSortKey) => {
    setQuoteColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
    setActiveQuoteFilterColumn(null);
  }, []);

  // Get unique values for picklist filters
  const getUniqueValuesForColumn = useCallback((column: QuoteSortKey): string[] => {
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
  }, [quotes]);

  // Determine filter type for each column
  const getFilterType = useCallback((column: QuoteSortKey): 'text' | 'select' | 'multiselect' | 'daterange' => {
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
  }, []);

  // Check if a column has an active filter
  const hasActiveFilter = useCallback((column: QuoteSortKey): boolean => {
    const filter = quoteColumnFilters[column];
    if (!filter) return false;
    switch (filter.type) {
      case 'text': return !!filter.value;
      case 'select': return !!filter.value;
      case 'multiselect': return !!filter.values && filter.values.length > 0;
      case 'daterange': return !!filter.dateFrom || !!filter.dateTo;
      default: return false;
    }
  }, [quoteColumnFilters]);

  // Helper function to get date range for quick date filter
  const getQuickDateRange = useCallback((preset: QuickDatePreset): { start: Date | null; end: Date | null } => {
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
  }, []);

  // Sorted and filtered quotes for list view
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
      result = [...result].sort((a, b) => {
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
  }, [quotes, quotesSortColumn, quotesSortDirection, quoteColumnFilters, quickDatePreset, quickDateField, getQuickDateRange]);

  return {
    // Sorted quotes
    sortedQuotes,

    // Sorting state and handlers
    quotesSortColumn,
    quotesSortDirection,
    handleQuotesSort,

    // Quick date filter
    quickDatePreset,
    setQuickDatePreset,
    quickDateField,
    setQuickDateField,
    showQuickDateFieldDropdown,
    setShowQuickDateFieldDropdown,

    // Column filters
    quoteColumnFilters,
    activeQuoteFilterColumn,
    setActiveQuoteFilterColumn,
    filterSearchText,
    setFilterSearchText,
    handleQuoteFilterChange,
    clearQuoteFilter,
    getUniqueValuesForColumn,
    getFilterType,
    hasActiveFilter,
  };
}

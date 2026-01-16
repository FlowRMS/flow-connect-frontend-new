'use client';

/**
 * Quotes V2 API Module
 * Reuses the existing quotes API with V2-specific hooks and utilities
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

// Re-export everything from the existing quotes API
export * from '../../quotes/api/quotesApi';
export * from '../../quotes/api/useQuotesApi';

// Import types we need
import type {
  Quote,
  QuoteLandingPage,
  QuoteLandingPageFilter,
  QuoteLandingPageOrderBy,
  PaginatedQuotesResult,
  CreateQuoteInput,
  UpdateQuoteInput,
  QuotePipelineStage,
  QuoteStatus,
} from '../../quotes/api/quotesApi';

import {
  fetchQuotesWithPagination,
  fetchQuoteById,
  createQuote,
  updateQuote,
  duplicateQuote,
  deleteQuote,
} from '../../quotes/api/quotesApi';

// Import quote search from central API
import { searchQuotes, type QuoteSearchResult } from '@/components/lib/api/search';

// ============================================================================
// V2-Specific Query Keys
// ============================================================================

export const quoteV2QueryKeys = {
  all: ['quotes-v2'] as const,
  quotes: () => [...quoteV2QueryKeys.all, 'list'] as const,
  quoteLandingPages: (filters?: QuoteLandingPageFilter[], orderBy?: QuoteLandingPageOrderBy[]) =>
    [...quoteV2QueryKeys.all, 'landingPages', { filters, orderBy }] as const,
  quote: (id: string) => [...quoteV2QueryKeys.all, 'detail', id] as const,
  quoteSearch: (searchTerm: string) => [...quoteV2QueryKeys.all, 'search', { searchTerm }] as const,
};

// ============================================================================
// Stage/Status Mapping Utilities
// ============================================================================

// Map API pipeline stage to V2 UI stage
export type QuoteV2UIStage = 'Draft' | 'Review' | 'Sent' | 'Negotiating' | 'Won' | 'Lost' | 'Dormant';

export function mapPipelineStageToUIStage(pipelineStage?: QuotePipelineStage, status?: QuoteStatus): QuoteV2UIStage {
  // If status is LOST, return Lost
  if (status === 'LOST') return 'Lost';

  // If status is ORDERED, return Won
  if (status === 'ORDERED') return 'Won';

  // Map based on pipeline stage
  switch (pipelineStage) {
    case 'DISCOVERY':
      return 'Draft';
    case 'PROSPECT':
      return 'Draft';
    case 'QUALIFICATION':
      return 'Review';
    case 'PROPOSAL':
      return 'Sent';
    case 'NEGOTIATION':
      return 'Negotiating';
    case 'CLOSED_WON':
      return 'Won';
    case 'CLOSED_LOST':
      return 'Lost';
    default:
      return 'Draft';
  }
}

// Map UI stage back to API pipeline stage
export function mapUIStageToAPIStage(uiStage: QuoteV2UIStage): { pipelineStage: QuotePipelineStage; status?: QuoteStatus } {
  switch (uiStage) {
    case 'Draft':
      return { pipelineStage: 'DISCOVERY' };
    case 'Review':
      return { pipelineStage: 'QUALIFICATION' };
    case 'Sent':
      return { pipelineStage: 'PROPOSAL' };
    case 'Negotiating':
      return { pipelineStage: 'NEGOTIATION' };
    case 'Won':
      return { pipelineStage: 'CLOSED_WON', status: 'ORDERED' };
    case 'Lost':
      return { pipelineStage: 'CLOSED_LOST', status: 'LOST' };
    case 'Dormant':
      return { pipelineStage: 'DISCOVERY', status: 'EXPIRED' };
    default:
      return { pipelineStage: 'DISCOVERY' };
  }
}

// Map API status to UI status
export type QuoteV2UIStatus = 'OPEN' | 'ORDERED' | 'EXPIRED' | 'LOST';

export function mapAPIStatusToUIStatus(status?: QuoteStatus): QuoteV2UIStatus {
  switch (status) {
    case 'OPEN':
      return 'OPEN';
    case 'ORDERED':
      return 'ORDERED';
    case 'EXPIRED':
      return 'EXPIRED';
    case 'LOST':
      return 'LOST';
    default:
      return 'OPEN';
  }
}

// ============================================================================
// V2-Specific Hooks
// ============================================================================

const DEFAULT_PAGE_SIZE = 50;

/**
 * Fetch quotes with infinite scroll for V2 Kanban/List views
 */
export function useQuotesV2Infinite(
  filters?: QuoteLandingPageFilter[],
  orderBy?: QuoteLandingPageOrderBy[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  return useInfiniteQuery<PaginatedQuotesResult, Error>({
    queryKey: [...quoteV2QueryKeys.quoteLandingPages(filters, orderBy), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchQuotesWithPagination(filters, orderBy, {
        limit: pageSize,
        offset: pageParam as number,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((acc, page) => acc + page.records.length, 0);
      if (totalFetched >= lastPage.total) return undefined;
      return totalFetched;
    },
    enabled: true,
    staleTime: 30 * 1000,
    // Keep previous data while fetching new data to prevent UI flicker
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Fetch all quotes for V2 (non-paginated, up to 1000)
 */
export function useQuotesV2(
  filters?: QuoteLandingPageFilter[],
  orderBy?: QuoteLandingPageOrderBy[]
) {
  return useQuery<QuoteLandingPage[], Error>({
    queryKey: quoteV2QueryKeys.quoteLandingPages(filters, orderBy),
    queryFn: async () => {
      const result = await fetchQuotesWithPagination(filters, orderBy, { limit: 1000, offset: 0 });
      return result.records;
    },
    enabled: true,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch single quote by ID for detail page
 */
export function useQuoteV2(id: string | null) {
  return useQuery<Quote | null, Error>({
    queryKey: quoteV2QueryKeys.quote(id || ''),
    queryFn: () => fetchQuoteById(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Create new quote mutation
 */
export function useCreateQuoteV2() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, CreateQuoteInput>({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.all });
    },
  });
}

/**
 * Update existing quote mutation
 */
export function useUpdateQuoteV2() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, UpdateQuoteInput>({
    mutationFn: updateQuote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quote(data.id) });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.all });
    },
  });
}

/**
 * Duplicate quote mutation
 */
export function useDuplicateQuoteV2() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, { sourceQuoteId: string; newQuoteNumber: string }>({
    mutationFn: ({ sourceQuoteId, newQuoteNumber }) => duplicateQuote(sourceQuoteId, newQuoteNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.all });
    },
  });
}

/**
 * Delete quote mutation
 */
export function useDeleteQuoteV2() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.all });
    },
  });
}

/**
 * Update quote pipeline stage (for drag & drop in Kanban)
 * Uses optimistic updates for immediate visual feedback
 */
export function useUpdateQuoteStageV2() {
  const queryClient = useQueryClient();

  return useMutation<Quote, Error, { quoteId: string; pipelineStage: QuotePipelineStage }>({
    mutationFn: async ({ quoteId, pipelineStage }) => {
      // Fetch the current quote to get required fields
      const currentQuote = await fetchQuoteById(quoteId);
      if (!currentQuote) {
        throw new Error('Quote not found');
      }

      // Build update input with all required fields + new stage
      const input: UpdateQuoteInput = {
        id: quoteId,
        quoteNumber: currentQuote.quoteNumber,
        entityDate: currentQuote.entityDate || new Date().toISOString().split('T')[0],
        soldToCustomerId: currentQuote.soldToCustomerId || '',
        status: currentQuote.status || 'OPEN',
        pipelineStage,
        published: currentQuote.published ?? true,
        creationType: currentQuote.creationType || 'MANUAL',
        blanket: currentQuote.blanket ?? false,
        // Include existing details to avoid overwriting them
        details: currentQuote.details?.map(detail => ({
          id: detail.id,
          quantity: detail.quantity || 0,
          unitPrice: detail.unitPrice || '0',
          commissionDiscountRate: detail.commissionDiscountRate,
          commissionRate: detail.commissionRate,
          discountRate: detail.discountRate,
          endUserId: detail.endUserId,
          factoryId: detail.factoryId,
          itemNumber: detail.itemNumber,
          leadTime: detail.leadTime,
          note: detail.note,
          productDescriptionAdhoc: detail.productDescriptionAdhoc,
          productNameAdhoc: detail.productNameAdhoc,
          productId: detail.productId,
          status: detail.status,
        })) || [],
      };

      return updateQuote(input);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quotes() });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.quote(data.id) });
      queryClient.invalidateQueries({ queryKey: quoteV2QueryKeys.all });
    },
  });
}

/**
 * Search quotes hook with debounce
 */
export function useQuoteSearchV2(searchTerm: string, limit: number = 50) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery<QuoteSearchResult[], Error>({
    queryKey: quoteV2QueryKeys.quoteSearch(debouncedTerm),
    queryFn: () => searchQuotes(debouncedTerm, limit),
    enabled: debouncedTerm.length >= 2,
    staleTime: 30 * 1000,
  });
}

// Re-export QuoteSearchResult type
export type { QuoteSearchResult } from '@/components/lib/api/search';

// ============================================================================
// Utility Types for V2 UI
// ============================================================================

export interface QuoteLandingPageV2Display extends QuoteLandingPage {
  uiStage: QuoteV2UIStage;
  uiStatus: QuoteV2UIStatus;
}

/**
 * Transform landing page data for V2 display
 */
export function transformLandingPageForV2(quote: QuoteLandingPage): QuoteLandingPageV2Display {
  return {
    ...quote,
    uiStage: mapPipelineStageToUIStage(quote.pipelineStage, quote.status),
    uiStatus: mapAPIStatusToUIStatus(quote.status),
  };
}

/**
 * Transform array of landing pages for V2 display
 */
export function transformLandingPagesForV2(quotes: QuoteLandingPage[]): QuoteLandingPageV2Display[] {
  return quotes.map(transformLandingPageForV2);
}

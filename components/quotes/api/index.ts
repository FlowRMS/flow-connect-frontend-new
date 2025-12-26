/**
 * Quotes API Module - Index
 * Re-exports all quotes API functionality
 */

// API Functions
export {
  fetchQuotesWithPagination,
  fetchQuotes,
  fetchQuoteById,
  createQuote,
  updateQuote,
  duplicateQuote,
  deleteQuote,
  searchCustomers,
  searchProducts,
  searchFactories,
  searchUsers,
} from './quotesApi';

// Types
export type {
  Quote,
  QuoteLandingPage,
  QuoteBalance,
  QuoteCustomer,
  QuoteCreatedBy,
  QuoteSplitRate,
  QuoteDetail,
  QuoteInsideRep,
  QuoteStatus,
  QuotePipelineStage,
  QuoteCreationType,
  QuoteDetailStatus,
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteDetailInput,
  QuoteSplitRateInput,
  QuoteLandingPageFilter,
  QuoteLandingPageOrderBy,
  PaginatedQuotesResult,
  CustomerSearchResult,
  ProductSearchResult,
  FactorySearchResult,
  UserSearchResult,
} from './quotesApi';

// React Query Hooks
export {
  quoteQueryKeys,
  useQuotesInfinite,
  useQuotes,
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useDuplicateQuote,
  useDeleteQuote,
  useCustomerSearch,
  useProductSearch,
  useFactorySearch,
  useUserSearch,
} from './useQuotesApi';

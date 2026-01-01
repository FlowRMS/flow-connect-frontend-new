/**
 * Invoices API Module
 * Re-exports from centralized GraphQL module for backward compatibility
 */

// Re-export everything from the centralized invoices module
export {
  fetchInvoicesWithPagination,
  fetchInvoices,
  fetchInvoiceById,
  searchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  type Invoice,
  type InvoiceLandingPage,
  type InvoiceBalance,
  type InvoiceUser,
  type InvoiceSplitRate,
  type InvoiceProduct,
  type InvoiceUom,
  type InvoiceFactory,
  type InvoiceOrder,
  type InvoiceDetail,
  type InvoiceCreationType,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
  type InvoiceDetailInput,
  type InvoiceSplitRateInput,
  type InvoiceLandingPageFilter,
  type InvoiceLandingPageOrderBy,
  type PaginatedInvoicesResult,
  type InvoiceSearchOptions,
} from '../../lib/graphql/invoices';

// Re-export PaginationParams for backward compatibility
export type { PaginationParams } from '../../lib/graphql/invoices';

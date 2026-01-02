/**
 * GraphQL API Index
 * Central export point for all GraphQL modules
 *
 * This modular structure organizes the API by domain:
 * - client.ts: Core GraphQL client and utilities
 * - types.ts: Shared type definitions
 * - jobs.ts: Jobs-related queries and mutations
 * - companies.ts: Companies-related queries and mutations
 * - contacts.ts: Contacts-related queries and mutations
 * - pre-opportunities.ts: Pre-opportunities-related queries and mutations
 *
 * For backward compatibility, crm-graphql.ts re-exports everything from here.
 */

// Core client
export {
  crmGraphQLRequest,
  crmGraphQLMultipartRequest,
  clearTokenCache,
  formatCreatedBy,
  withFormattedCreatedBy,
  mapFormattedCreatedBy,
  type GraphQLRequestOptions,
  type GraphQLResponse,
  type CreatedByResponse,
} from './client';

// Shared types
export * from './types';

// Jobs module
export {
  fetchJobStatuses,
  fetchJob,
  createJob,
  updateJob,
  deleteJob,
  fetchJobsByIds,
  fetchJobLandingPages,
  getStoredJobIds,
  addStoredJobId,
} from './jobs';

// Companies module
export {
  fetchCompanies,
  fetchCompany,
  fetchCompaniesByJobId,
  createCompany,
  updateCompany,
  deleteCompany,
  fetchCompanyLandingPages,
} from './companies';

// Contacts module
export {
  fetchContacts,
  fetchContact,
  fetchContactsByCompanyId,
  fetchJobsByCompanyId,
  fetchJobsByContactId,
  createContact,
  updateContact,
  deleteContact,
  fetchContactLandingPages,
} from './contacts';

// Pre-opportunities module
export {
  fetchPreOpportunityLandingPages,
  fetchPreOpportunity,
  fetchPreOpportunitiesByJob,
  fetchPreOpportunitiesByCustomer,
  searchProducts,
  searchFactories,
  searchCustomers,
  searchJobs,
  createPreOpportunity,
  updatePreOpportunity,
  deletePreOpportunity,
} from './pre-opportunities';

// Entity links module
export {
  createLink,
  deleteLink,
  deleteLinkByEntities,
  fetchJobRelatedEntities,
  fetchContactRelatedEntities,
  searchTasks,
  searchNotes,
  searchQuotes,
  searchOrders,
  searchInvoices,
  searchChecks,
  fetchLinksBySource,
  fetchNotesByEntity,
  // Re-export search result types from central search API
  type TaskSearchResult,
  type NoteSearchResult,
  // Re-export extended job related entity types
  type JobRelatedQuote,
  type JobRelatedOrder,
  type JobRelatedInvoice,
  type JobRelatedCheck,
  type JobRelatedCustomer,
  type JobRelatedFactory,
  type JobRelatedProduct,
  type BalanceLite,
  type CustomerLite,
  type FactoryLite,
  type UserLite,
  type OrderQuoteDetail,
  type CheckDetail as JobRelatedCheckDetail,
} from './entity-links';

// Notes module - re-exported from component API for backward compatibility
export {
  fetchNotes,
  fetchNoteLandingPages,
  fetchNote,
  fetchNoteConversations,
  createNote,
  updateNote,
  deleteNote,
  addNoteConversation,
  updateNoteConversation,
  deleteNoteConversation as deleteNoteConversations,
  type Note,
  type NoteConversation,
  type NoteLandingPage,
  type CreateNoteInput,
  type UpdateNoteInput,
  type AddNoteConversationInput,
  type UpdateNoteConversationInput,
  type PaginatedNotesResult,
} from '../../notes/api/notesApi';

// Tasks module - re-exported from component API for backward compatibility
export {
  fetchTasksWithPagination as fetchTaskLandingPages,
  fetchTask,
  fetchTaskConversations,
  createTask,
  updateTask,
  deleteTask,
  addTaskConversation,
  updateTaskConversation,
  addTaskRelation,
  fetchTaskRelations,
  deleteTaskRelation,
  fetchTasksByEntity,
  type Task as CRMTask,
  type TaskLandingPage,
  type TaskConversation,
  type CreateTaskInput,
  type UpdateTaskInput,
  type TaskPriority as TaskPriorityAPI,
  type TaskStatus as TaskStatusAPI,
  type TaskRelation,
  type AddTaskRelationInput,
  type TaskByEntity,
  type TaskEntityType,
  type TaskRelatedType,
  type AddTaskConversationInput,
  type UpdateTaskConversationInput,
} from '../../tasks/api/tasksApi';

// Universal search module
export {
  universalSearch,
  type UniversalSearchResult,
} from './universal-search';

// Landing pages module (combined queries)
export {
  fetchAllLandingPages,
  type AllLandingPagesResponse,
} from './landing-pages';

// Files module
export {
  fetchFile,
  searchFiles,
  fetchFilesByLinkedEntity,
  fetchFilesByFolder,
  getFilePresignedUrl,
  uploadFile,
  uploadFiles,
  archiveFile,
  deleteFile,
  linkFileToEntity,
  uploadAndLinkFile,
  uploadAndLinkFiles,
  formatFileSize,
  getFileIcon,
  getFileExtension,
  type FileResponse,
  type FileCreatedBy,
  type FileUploadInput,
  type MultiFileUploadInput,
  type FileEntityType,
} from './files';

// Orders module
export {
  fetchOrdersWithPagination,
  fetchOrders,
  fetchOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  createOrderFromQuote,
  type Order,
  type OrderLandingPage,
  type OrderBalance,
  type OrderCustomer,
  type OrderCreatedBy,
  type OrderSplitRate,
  type OrderDetail,
  type OrderInsideRep,
  type OrderOutsideRep,
  type OrderJob,
  type OrderFactory,
  type OrderProduct,
  type OrderUom,
  type OrderType,
  type OrderCreationType,
  type OrderHeaderStatus,
  type OrderDetailStatus,
  type CreateOrderInput,
  type UpdateOrderInput,
  type OrderDetailInput,
  type OrderSplitRateInput,
  type OrderLandingPageFilter,
  type OrderLandingPageOrderBy,
  type PaginatedOrdersResult,
  type CreateOrderFromQuoteInput,
} from './orders';

// Invoices module
// Note: searchInvoices and InvoiceSearchResult are already exported from entity-links
export {
  fetchInvoicesWithPagination,
  fetchInvoices,
  fetchInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createInvoiceFromOrder,
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
  type CreateInvoiceFromOrderInput,
  type InvoiceDetailInput,
  type InvoiceSplitRateInput,
  type InvoiceLandingPageFilter,
  type InvoiceLandingPageOrderBy,
  type PaginatedInvoicesResult,
  type InvoiceSearchOptions,
} from './invoices';

// Credits module
export {
  fetchCreditById,
  searchCredits,
  fetchCreditsByOrder,
  createCredit,
  updateCredit,
  deleteCredit,
  type Credit,
  type CreditLandingPage,
  type CreditBalance,
  type CreditUser,
  type CreditOutsideSplitRate,
  type CreditDetail,
  type CreditOrder,
  type CreditType,
  type CreditCreationType,
  type CreditStatus,
  type CreditSearchResult,
  type CreateCreditInput,
  type UpdateCreditInput,
  type CreditDetailInput,
  type CreditOutsideSplitRateInput,
  type CreditSearchOptions,
  type FindLandingPagesResponse as CreditFindLandingPagesResponse,
} from './credits';

// Adjustments module
export {
  fetchAdjustmentById,
  searchAdjustments,
  fetchAdjustmentsWithPagination,
  fetchAdjustmentsLandingPage,
  createAdjustment,
  updateAdjustment,
  deleteAdjustment,
  type Adjustment,
  type AdjustmentLandingPage,
  type AdjustmentUser,
  type AdjustmentSplitRate,
  type AdjustmentFactory,
  type AdjustmentCustomer,
  type AllocationMethod,
  type AdjustmentCreationType,
  type AdjustmentStatus,
  type AdjustmentSearchResult,
  type CreateAdjustmentInput,
  type UpdateAdjustmentInput,
  type AdjustmentSplitRateInput,
  type AdjustmentSearchOptions,
  type PaginatedAdjustmentsResult,
  type FindAdjustmentsLandingPagesResponse,
} from './adjustments';

// Checks module
// Note: searchChecks and CheckSearchResult are already exported from entity-links
export {
  fetchCheckById,
  fetchChecksByFactory,
  fetchChecksLandingPage,
  createCheck,
  updateCheck,
  deleteCheck,
  type Check,
  type CheckLandingPage,
  type CheckFactory,
  type CheckInvoice,
  type CheckInvoiceOrder,
  type CheckCredit,
  type CheckCreditOrder,
  type CheckAdjustment,
  type CheckAdjustmentFactory,
  type CheckAdjustmentCustomer,
  type CheckDetail,
  type CheckStatus,
  type CheckCreationType,
  type CreateCheckInput,
  type UpdateCheckInput,
  type CheckDetailInput,
  type FindChecksLandingPagesResponse,
} from './checks';

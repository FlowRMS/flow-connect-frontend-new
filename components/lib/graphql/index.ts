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
  type QuoteSearchResult,
  type OrderSearchResult,
  type InvoiceSearchResult,
  type CheckSearchResult,
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

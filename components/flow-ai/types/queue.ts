// Queue Page Types and Enums

// AI Status enum values
export type AiStatus =
  | 'PENDING_REVIEW'
  | 'IN_REVISION'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTO_APPROVED'
  | 'SKIPPED';

export const AI_STATUS_OPTIONS: { value: AiStatus; label: string }[] = [
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'IN_REVISION', label: 'In Revision' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'AUTO_APPROVED', label: 'Auto Approved' },
  { value: 'SKIPPED', label: 'Skipped' },
];

// Document Type enum values
export type DocumentType = 'TXT' | 'PDF' | 'TABULAR';

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'TXT', label: 'Text' },
  { value: 'PDF', label: 'PDF' },
  { value: 'TABULAR', label: 'Tabular' },
];

// Entity Type enum values
export type EntityType =
  | 'QUOTES'
  | 'ORDERS'
  | 'INVOICES'
  | 'CHECKS'
  | 'UNDEFINED'
  | 'ORDER_ACKNOWLEDGEMENTS'
  | 'CUSTOMERS'
  | 'FACTORIES'
  | 'PRODUCTS'
  | 'END_USERS';

export const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: 'QUOTES', label: 'Quotes' },
  { value: 'ORDERS', label: 'Orders' },
  { value: 'INVOICES', label: 'Invoices' },
  { value: 'CHECKS', label: 'Checks' },
  { value: 'UNDEFINED', label: 'Undefined' },
  { value: 'ORDER_ACKNOWLEDGEMENTS', label: 'Order Acknowledgements' },
  { value: 'CUSTOMERS', label: 'Customers' },
  { value: 'FACTORIES', label: 'Factories' },
  { value: 'PRODUCTS', label: 'Products' },
  { value: 'END_USERS', label: 'End Users' },
];

// Order By enum values
export type OrderBy =
  | 'CREATED_AT'
  | 'AI_STATUS'
  | 'ENTITY_TYPE'
  | 'CLUSTER_NAME';

export const ORDER_BY_OPTIONS: { value: OrderBy; label: string }[] = [
  { value: 'CREATED_AT', label: 'Created At' },
  { value: 'AI_STATUS', label: 'AI Status' },
  { value: 'ENTITY_TYPE', label: 'Entity Type' },
  { value: 'CLUSTER_NAME', label: 'Cluster Name' },
];

// Order Direction enum values
export type OrderDirection = 'ASC' | 'DESC';

export const ORDER_DIRECTION_OPTIONS: { value: OrderDirection; label: string }[] = [
  { value: 'ASC', label: 'Ascending' },
  { value: 'DESC', label: 'Descending' },
];

// Pending Document interface
export interface PendingDocument {
  pendingDocumentId: string;
  documentId: string;
  documentProcessId: string | null;
  aiStatus: AiStatus | null;
  clusterId: string | null;
  clusterName: string | null;
  createdAt: string;
  createdBy: string | null;
  createdById: string | null;
  documentType: DocumentType | null;
  entityType: EntityType | null;
  fileName: string | null;
  fileStatus: string | null;
  queueStatus: string | null;
  isNew: boolean;
}

// Filter input interface (matches LandingPageFilterInput in GraphQL schema)
export interface LandingPageFilterInput {
  aiStatuses?: AiStatus;
  clusterId?: string;
  entityTypes?: EntityType;
  documentTypes?: DocumentType;
  searchTerm?: string;
  createdById?: string;
}

// Alias for backwards compatibility
export type PendingDocumentsFilterInput = LandingPageFilterInput;

// Paginated response interface
export interface PaginatedResponse {
  pendingDocumentsLandingPage: {
    items: PendingDocument[];
    limit: number;
    offset: number;
    totalCount: number;
  };
}

// Archive response interface
export interface ArchiveResponse {
  archivePendingDocuments: boolean;
}





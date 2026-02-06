/**
 * GraphQL Types
 * 
 * Type definitions matching the Python backend GraphQL schema.
 * These types are authoritative and should match the schema exactly.
 */

// ============================================
// ENUMS
// ============================================

export type Application = 'POS';

export type ConnectionStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type FieldCategory =
  | 'TRANSACTION'
  | 'SELLING_BRANCH'
  | 'TERRITORY'
  | 'SHIPPING_BRANCH'
  | 'BILL_TO'
  | 'PRODUCT_IDENTIFICATION'
  | 'QUANTITY_PRICING'
  | 'CUSTOM_COLUMNS';

export type FieldMapType = 'POS' | 'POT';

export type FieldStatus =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'HIGHLY_SUGGESTED'
  | 'ONE_REQUIRED'
  | 'CAN_CALCULATE';

export type FieldType = 'TEXT' | 'DATE' | 'DECIMAL' | 'INTEGER';

// ============================================
// RESPONSE TYPES
// ============================================

export interface PosContact {
  id: string;
  name: string | null;
  email: string | null;
}

export interface AgreementResponse {
  id: string;
  connectedOrgId: string;
  fileName: string;
  fileSize: number;
  presignedUrl: string;
  createdAt: string;
}

export interface OrganizationLiteResponse {
  id: string;
  name: string;
  domain: string | null;
  members: number;
  posContactsCount: number;
  posContacts: PosContact[];
  flowConnectMember: boolean;
  connectionStatus: ConnectionStatus | null;
  agreement: AgreementResponse | null;
}

export interface OrganizationPreferenceResponse {
  application: Application;
  key: string;
  value: string | null;
}

export interface CategoryConfigResponse {
  category: FieldCategory;
  name: string;
  description: string;
  order: number;
  visible: boolean;
}

export interface FieldMapFieldResponse {
  id: string;
  standardFieldKey: string;
  category: FieldCategory;
  standardFieldName: string;
  standardFieldNameDescription: string | null;
  organizationFieldName: string | null;
  status: FieldStatus;
  manufacturer: boolean | null;
  rep: boolean | null;
  linked: boolean;
  preferred: boolean;
  isDefault: boolean;
  fieldType: FieldType;
  displayOrder: number;
}

export interface FieldMapResponse {
  id: string;
  organizationId: string | null;
  mapType: FieldMapType;
  fields: FieldMapFieldResponse[];
  categories: CategoryConfigResponse[];
}

export interface OrganizationAliasResponse {
  id: string;
  connectedOrgId: string;
  connectedOrgName: string;
  alias: string;
  createdAt: string | null;
}

export interface OrganizationAliasGroupResponse {
  connectedOrgId: string;
  connectedOrgName: string;
  aliases: OrganizationAliasResponse[];
}

export interface BulkCreateFailureResponse {
  rowNumber: number;
  organizationName: string;
  alias: string;
  reason: string;
}

export interface BulkCreateOrganizationAliasesResponse {
  insertedCount: number;
  failures: BulkCreateFailureResponse[];
}

export interface PrefixPatternResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string | null;
}

// ============================================
// INPUT TYPES
// ============================================

export interface PosContactInput {
  email: string;
}

export interface ManufacturerInput {
  name: string;
  domain: string;
  contact?: PosContactInput | null;
}

export interface FieldInput {
  standardFieldKey: string;
  organizationFieldName?: string | null;
  manufacturer?: boolean | null;
  rep?: boolean | null;
  standardFieldName?: string | null;
  fieldType?: FieldType | null;
  category?: FieldCategory | null;
  status?: FieldStatus | null;
}

export interface SaveFieldMapInput {
  mapType: FieldMapType;
  fields: FieldInput[];
  organizationId?: string | null;
}

export interface CreateOrganizationAliasInput {
  connectedOrgId: string;
  alias: string;
}

export interface CreatePrefixPatternInput {
  name: string;
  description?: string | null;
}

// ============================================
// QUERY RESULT TYPES
// ============================================

export interface ManufacturerSearchResult {
  connectionSearch: OrganizationLiteResponse[];
}

export interface FieldMapResult {
  fieldMap: FieldMapResponse | null;
}

export interface OrganizationAliasesResult {
  organizationAliases: OrganizationAliasGroupResponse[];
}

export interface PrefixPatternsResult {
  prefixPatterns: PrefixPatternResponse[];
}

export interface OrganizationPreferenceResult {
  organizationPreference: OrganizationPreferenceResponse | null;
}

export interface OrganizationPreferencesResult {
  organizationPreferences: OrganizationPreferenceResponse[];
}

export interface OrganizationPreferencesByApplicationResult {
  organizationPreferencesByApplication: OrganizationPreferenceResponse[];
}

// ============================================
// MUTATION RESULT TYPES
// ============================================

export interface CreateOrganizationResult {
  createOrganization: OrganizationLiteResponse;
}

export interface CreateConnectionResult {
  createConnection: boolean;
}

export interface InviteConnectionResult {
  inviteConnection: boolean;
}

export interface UploadAgreementResult {
  uploadAgreement: AgreementResponse;
}

export interface DeleteAgreementResult {
  deleteAgreement: boolean;
}

export interface UpdateOrganizationPreferenceResult {
  updateOrganizationPreference: OrganizationPreferenceResponse;
}

export interface SaveFieldMapResult {
  saveFieldMap: FieldMapResponse;
}

export interface CreateOrganizationAliasResult {
  createOrganizationAlias: OrganizationAliasResponse;
}

export interface DeleteOrganizationAliasResult {
  deleteOrganizationAlias: boolean;
}

export interface BulkSpreadsheetCreateOrganizationAliasesResult {
  bulkSpreadsheetCreateOrganizationAliases: BulkCreateOrganizationAliasesResponse;
}

export interface CreatePrefixPatternResult {
  createPrefixPattern: PrefixPatternResponse;
}

export interface DeletePrefixPatternResult {
  deletePrefixPattern: boolean;
}

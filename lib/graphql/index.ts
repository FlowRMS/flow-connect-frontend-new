/**
 * GraphQL SDK Index
 * 
 * Central export point for all GraphQL operations.
 * Import from this file for clean, organized access to the GraphQL SDK.
 */

// Types
export * from './types';

// Manufacturer operations
export {
  searchOrganizations,
  createOrganization,
  createConnection,
  inviteConnection,
  type ManufacturerSearchOptions,
} from './manufacturer';

// Field mapping operations
export {
  getFieldMap,
  saveFieldMap,
  buildFieldMapInput,
  parseFieldMapResponse,
  type GetFieldMapOptions,
} from './field-mapping';

// Organization aliases operations
export {
  getOrganizationAliases,
  createOrganizationAlias,
  deleteOrganizationAlias,
  bulkCreateOrganizationAliases,
  flattenAliases,
  findAliasesForOrganization,
  aliasExists,
} from './organization-aliases';

// Prefix patterns operations
export {
  getPrefixPatterns,
  createPrefixPattern,
  deletePrefixPattern,
} from './prefix-patterns';

// Organization preferences operations
export {
  getOrganizationPreference,
  getOrganizationPreferencesByApplication,
  getAllOrganizationPreferences,
  updateOrganizationPreference,
  preferencesToMap,
  getPreferenceValue,
} from './organization-preferences';

// Connection & agreement operations
export {
  uploadAgreement,
  deleteAgreement,
} from './connection';


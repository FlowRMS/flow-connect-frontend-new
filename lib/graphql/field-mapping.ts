/**
 * Field Mapping GraphQL SDK
 * 
 * Handles fetching and saving field mapping configurations.
 * Supports both POS and POT field map types.
 */

import { requestGraphQL } from '../graphqlClient';
import type {
  FieldMapResponse,
  FieldMapType,
  SaveFieldMapInput,
  FieldInput,
  FieldMapResult,
  SaveFieldMapResult,
} from './types';

// ============================================
// QUERIES
// ============================================

const FieldMapQuery = `
  query FieldMap($mapType: FieldMapType!, $organizationId: ID) {
    fieldMap(mapType: $mapType, organizationId: $organizationId) {
      id
      organizationId
      mapType
      fields {
        id
        standardFieldKey
        category
        standardFieldName
        standardFieldNameDescription
        organizationFieldName
        status
        manufacturer
        rep
        linked
        preferred
        isDefault
        fieldType
        displayOrder
      }
      categories {
        category
        name
        description
        order
        visible
      }
    }
  }
`;

// ============================================
// MUTATIONS
// ============================================

const SaveFieldMapMutation = `
  mutation SaveFieldMap($input: SaveFieldMapInput!) {
    saveFieldMap(input: $input) {
      id
      organizationId
      mapType
      fields {
        id
        standardFieldKey
        category
        standardFieldName
        standardFieldNameDescription
        organizationFieldName
        status
        manufacturer
        rep
        linked
        preferred
        isDefault
        fieldType
        displayOrder
      }
      categories {
        category
        name
        description
        order
        visible
      }
    }
  }
`;

// ============================================
// SDK FUNCTIONS
// ============================================

export interface GetFieldMapOptions {
  mapType: FieldMapType;
  organizationId?: string | null;
}

/**
 * Fetch the field mapping configuration for a given map type.
 * If organizationId is provided, returns organization-specific mappings;
 * otherwise returns the default mapping.
 */
export async function getFieldMap(
  options: GetFieldMapOptions,
  token?: string
): Promise<FieldMapResponse | null> {
  const { mapType, organizationId = null } = options;

  try {
    const result = await requestGraphQL<FieldMapResult>(
      FieldMapQuery,
      { mapType, organizationId },
      token
    );
    return result.fieldMap;
  } catch (error) {
    console.error('getFieldMap failed:', error);
    throw error;
  }
}

/**
 * Save field mapping configuration.
 * This replaces the existing field mappings with the provided fields.
 */
export async function saveFieldMap(
  input: SaveFieldMapInput,
  token?: string
): Promise<FieldMapResponse> {
  try {
    const result = await requestGraphQL<SaveFieldMapResult>(
      SaveFieldMapMutation,
      { input },
      token
    );
    return result.saveFieldMap;
  } catch (error) {
    console.error('saveFieldMap failed:', error);
    throw error;
  }
}

/**
 * Helper to convert UI field state to SaveFieldMapInput format.
 * Maps local field mappings to the GraphQL input structure.
 */
export function buildFieldMapInput(
  mapType: FieldMapType,
  fieldMappings: Record<string, string>,
  visibilitySettings?: {
    manufacturer?: Record<string, boolean>;
    rep?: Record<string, boolean>;
  },
  organizationId?: string | null
): SaveFieldMapInput {
  const fields: FieldInput[] = Object.entries(fieldMappings).map(([standardFieldKey, organizationFieldName]) => {
    const field: FieldInput = {
      standardFieldKey,
      organizationFieldName: organizationFieldName || null,
    };

    // Add visibility settings if provided
    if (visibilitySettings?.manufacturer && standardFieldKey in visibilitySettings.manufacturer) {
      field.manufacturer = visibilitySettings.manufacturer[standardFieldKey];
    }
    if (visibilitySettings?.rep && standardFieldKey in visibilitySettings.rep) {
      field.rep = visibilitySettings.rep[standardFieldKey];
    }

    return field;
  });

  return {
    mapType,
    fields,
    organizationId: organizationId || null,
  };
}

/**
 * Helper to convert FieldMapResponse to UI-friendly format.
 * Transforms the field array into a mapping record.
 */
export function parseFieldMapResponse(response: FieldMapResponse): {
  fieldMappings: Record<string, string>;
  manufacturerVisibility: Record<string, boolean>;
  repVisibility: Record<string, boolean>;
  categories: FieldMapResponse['categories'];
  fields: FieldMapResponse['fields'];
} {
  const fieldMappings: Record<string, string> = {};
  const manufacturerVisibility: Record<string, boolean> = {};
  const repVisibility: Record<string, boolean> = {};

  for (const field of response.fields) {
    fieldMappings[field.standardFieldKey] = field.organizationFieldName || '';
    
    if (field.manufacturer !== null) {
      manufacturerVisibility[field.standardFieldKey] = field.manufacturer;
    }
    if (field.rep !== null) {
      repVisibility[field.standardFieldKey] = field.rep;
    }
  }

  return {
    fieldMappings,
    manufacturerVisibility,
    repVisibility,
    categories: response.categories,
    fields: response.fields,
  };
}

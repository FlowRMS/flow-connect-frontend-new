import { requestGraphQL } from './graphqlClient';

// Types from backend schema
export type FieldMapType = 'POS' | 'POT';

export type FieldCategory =
  | 'TRANSACTION'
  | 'SELLING_BRANCH'
  | 'TERRITORY'
  | 'SHIPPING_BRANCH'
  | 'BILL_TO'
  | 'PRODUCT_IDENTIFICATION'
  | 'QUANTITY_PRICING'
  | 'QUANTITY_COST'
  | 'TRANSFER_BRANCH'
  | 'CUSTOM_COLUMNS';

export type FieldStatus =
  | 'REQUIRED'
  | 'OPTIONAL'
  | 'HIGHLY_SUGGESTED'
  | 'ONE_REQUIRED'
  | 'CAN_CALCULATE';

export type FieldType = 'TEXT' | 'DATE' | 'DECIMAL' | 'INTEGER';

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
  standardFieldNameDescription?: string;
  organizationFieldName?: string;
  status: FieldStatus;
  manufacturer?: boolean;
  rep?: boolean;
  linked: boolean;
  preferred: boolean;
  isDefault: boolean;
  fieldType: FieldType;
  displayOrder: number;
}

export interface FieldMapResponse {
  id: string;
  organizationId?: string;
  mapType: FieldMapType;
  fields: FieldMapFieldResponse[];
  categories: CategoryConfigResponse[];
}

export interface FieldInput {
  standardFieldKey: string;
  organizationFieldName?: string;
  manufacturer?: boolean;
  rep?: boolean;
  standardFieldName?: string;
  fieldType?: FieldType;
  category?: FieldCategory;
  status?: FieldStatus;
}

export interface SaveFieldMapInput {
  mapType: FieldMapType;
  fields: FieldInput[];
  organizationId?: string;
}

// GraphQL Queries and Mutations
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

/**
 * Fetch field map configuration from backend
 * @param mapType POS or POT
 * @param organizationId Optional organization ID for organization-specific mapping
 * @param token Access token
 */
export async function getFieldMap(
  mapType: FieldMapType,
  organizationId?: string,
  token?: string
): Promise<FieldMapResponse> {
  const data = await requestGraphQL<{ fieldMap: FieldMapResponse }>(
    FieldMapQuery,
    { mapType, organizationId: organizationId || null },
    token
  );
  return data.fieldMap;
}

/**
 * Save field map configuration to backend
 * @param input Field map configuration to save
 * @param token Access token
 */
export async function saveFieldMap(
  input: SaveFieldMapInput,
  token?: string
): Promise<FieldMapResponse> {
  const data = await requestGraphQL<{ saveFieldMap: FieldMapResponse }>(
    SaveFieldMapMutation,
    { input },
    token
  );
  return data.saveFieldMap;
}
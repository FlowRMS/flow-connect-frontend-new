import { safeRequest } from '../graphql';

export type ValidationType = 'STANDARD_VALIDATION' | 'VALIDATION_WARNING' | 'AI_POWERED_VALIDATION';

export interface ValidationRule {
  name: string;
  description: string;
  triggers: string[];
  validationType: ValidationType;
  enabled: boolean;
}

export interface ValidationRulesResponse {
  validationRules: ValidationRule[];
}

const GET_VALIDATION_RULES_QUERY = `
  query GetValidationRules {
    validationRules {
      name
      description
      triggers
      validationType
      enabled
    }
  }
`;

/**
 * Fetches validation rules from GraphQL endpoint.
 * Throws an error if the request fails.
 */
export async function getValidationRules(token?: string): Promise<ValidationRule[]> {
  const response = await safeRequest<ValidationRulesResponse>(GET_VALIDATION_RULES_QUERY, undefined, token);
  return response.validationRules.filter((rule) => rule.enabled);
}

export interface GroupedValidationRules {
  standard: ValidationRule[];
  warning: ValidationRule[];
  ai: ValidationRule[];
}

/**
 * Groups validation rules by their validationType.
 */
export function groupValidationRulesByType(rules: ValidationRule[]): GroupedValidationRules {
  return {
    standard: rules.filter((rule) => rule.validationType === 'STANDARD_VALIDATION'),
    warning: rules.filter((rule) => rule.validationType === 'VALIDATION_WARNING'),
    ai: rules.filter((rule) => rule.validationType === 'AI_POWERED_VALIDATION'),
  };
}

// Prefix Patterns

export interface PrefixPatternResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PrefixPatternsResponse {
  prefixPatterns: PrefixPatternResponse[];
}

const GET_PREFIX_PATTERNS_QUERY = `
  query PrefixPatterns {
    prefixPatterns {
      id
      name
      description
      createdAt
    }
  }
`;

/**
 * Fetches prefix patterns from GraphQL endpoint.
 * Throws an error if the request fails.
 */
export async function getPrefixPatterns(token?: string): Promise<PrefixPatternResponse[]> {
  const response = await safeRequest<PrefixPatternsResponse>(GET_PREFIX_PATTERNS_QUERY, undefined, token);
  return response.prefixPatterns;
}

// Create Prefix Pattern

export interface CreatePrefixPatternInput {
  name: string;
  description?: string | null;
}

interface CreatePrefixPatternResponse {
  createPrefixPattern: PrefixPatternResponse;
}

const CREATE_PREFIX_PATTERN_MUTATION = `
  mutation CreatePrefixPattern($input: CreatePrefixPatternInput!) {
    createPrefixPattern(input: $input) {
      id
      name
      description
      createdAt
    }
  }
`;

/**
 * Creates a new prefix pattern.
 * Throws an error if the request fails.
 */
export async function createPrefixPattern(
  input: CreatePrefixPatternInput,
  token?: string
): Promise<PrefixPatternResponse> {
  const response = await safeRequest<CreatePrefixPatternResponse>(
    CREATE_PREFIX_PATTERN_MUTATION,
    { input },
    token
  );
  return response.createPrefixPattern;
}

// Delete Prefix Pattern

interface DeletePrefixPatternResponse {
  deletePrefixPattern: boolean;
}

const DELETE_PREFIX_PATTERN_MUTATION = `
  mutation DeletePrefixPattern($id: ID!) {
    deletePrefixPattern(id: $id)
  }
`;

/**
 * Deletes a prefix pattern by ID.
 * Throws an error if the request fails.
 */
export async function deletePrefixPattern(id: string, token?: string): Promise<boolean> {
  const response = await safeRequest<DeletePrefixPatternResponse>(
    DELETE_PREFIX_PATTERN_MUTATION,
    { id },
    token
  );
  return response.deletePrefixPattern;
}

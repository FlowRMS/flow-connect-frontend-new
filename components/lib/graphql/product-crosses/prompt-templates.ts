/**
 * Cross Prompt Templates Functions
 * CRUD operations for prompt templates
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import {
  GET_CROSS_PROMPT_TEMPLATE,
  GET_CROSS_PROMPT_TEMPLATES,
  GET_CROSS_PROMPT_TEMPLATES_PAGINATED,
} from './queries';
import {
  CREATE_CROSS_PROMPT_TEMPLATE,
  UPDATE_CROSS_PROMPT_TEMPLATE,
  DELETE_CROSS_PROMPT_TEMPLATE,
  INCREMENT_CROSS_PROMPT_TEMPLATE_USAGE,
} from './mutations';
import type {
  CrossPromptTemplate,
  CrossPromptTemplateListResult,
  CreateCrossPromptTemplateInput,
  UpdateCrossPromptTemplateInput,
} from './types';

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get a single prompt template by ID
 */
export async function getCrossPromptTemplate(templateId: string): Promise<CrossPromptTemplate | null> {
  const response = await flowAIGraphQLRequest<{ getCrossPromptTemplate: CrossPromptTemplate | null }>({
    query: GET_CROSS_PROMPT_TEMPLATE,
    variables: { templateId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get prompt template');
  }

  return response.data?.getCrossPromptTemplate || null;
}

/**
 * Get prompt templates with filtering and pagination
 */
export async function getCrossPromptTemplates(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<CrossPromptTemplate[]> {
  const response = await flowAIGraphQLRequest<{ getCrossPromptTemplates: CrossPromptTemplate[] }>({
    query: GET_CROSS_PROMPT_TEMPLATES,
    variables: options,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get prompt templates');
  }

  return response.data?.getCrossPromptTemplates || [];
}

/**
 * Get prompt templates with total count for pagination
 */
export async function getCrossPromptTemplatesPaginated(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}
): Promise<CrossPromptTemplateListResult> {
  const response = await flowAIGraphQLRequest<{ getCrossPromptTemplatesPaginated: CrossPromptTemplateListResult }>({
    query: GET_CROSS_PROMPT_TEMPLATES_PAGINATED,
    variables: options,
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to get prompt templates');
  }

  return response.data?.getCrossPromptTemplatesPaginated || { templates: [], totalCount: 0 };
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new prompt template
 */
export async function createCrossPromptTemplate(
  input: CreateCrossPromptTemplateInput
): Promise<CrossPromptTemplate> {
  const response = await flowAIGraphQLRequest<{ createCrossPromptTemplate: CrossPromptTemplate }>({
    query: CREATE_CROSS_PROMPT_TEMPLATE,
    variables: { input },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to create prompt template');
  }

  if (!response.data?.createCrossPromptTemplate) {
    throw new Error('Failed to create prompt template');
  }

  return response.data.createCrossPromptTemplate;
}

/**
 * Update an existing prompt template
 */
export async function updateCrossPromptTemplate(
  templateId: string,
  input: UpdateCrossPromptTemplateInput
): Promise<CrossPromptTemplate> {
  const response = await flowAIGraphQLRequest<{ updateCrossPromptTemplate: CrossPromptTemplate }>({
    query: UPDATE_CROSS_PROMPT_TEMPLATE,
    variables: { templateId, input },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to update prompt template');
  }

  if (!response.data?.updateCrossPromptTemplate) {
    throw new Error('Failed to update prompt template');
  }

  return response.data.updateCrossPromptTemplate;
}

/**
 * Delete a prompt template
 */
export async function deleteCrossPromptTemplate(templateId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deleteCrossPromptTemplate: boolean }>({
    query: DELETE_CROSS_PROMPT_TEMPLATE,
    variables: { templateId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to delete prompt template');
  }

  return response.data?.deleteCrossPromptTemplate || false;
}

/**
 * Increment usage count for a prompt template
 */
export async function incrementCrossPromptTemplateUsage(
  templateId: string
): Promise<CrossPromptTemplate> {
  const response = await flowAIGraphQLRequest<{ incrementCrossPromptTemplateUsage: CrossPromptTemplate }>({
    query: INCREMENT_CROSS_PROMPT_TEMPLATE_USAGE,
    variables: { templateId },
  });

  if (response.errors) {
    console.error('GraphQL errors:', response.errors);
    throw new Error(response.errors[0]?.message || 'Failed to increment usage');
  }

  if (!response.data?.incrementCrossPromptTemplateUsage) {
    throw new Error('Failed to increment usage');
  }

  return response.data.incrementCrossPromptTemplateUsage;
}

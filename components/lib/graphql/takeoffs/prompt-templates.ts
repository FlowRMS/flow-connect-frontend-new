/**
 * Takeoffs Prompt Templates Functions
 * CRUD operations for prompt templates
 */

import { flowAIGraphQLRequest } from '../flow-ai-client';
import { GET_PROMPT_TEMPLATES } from './queries';
import {
  CREATE_PROMPT_TEMPLATE,
  UPDATE_PROMPT_TEMPLATE,
  DELETE_PROMPT_TEMPLATE,
} from './mutations';
import type { PromptTemplateResponse } from './types';

/**
 * Get all prompt templates for the current user
 */
export async function getPromptTemplates(): Promise<PromptTemplateResponse[]> {
  const response = await flowAIGraphQLRequest<{ getPromptTemplates: PromptTemplateResponse[] }>({
    query: GET_PROMPT_TEMPLATES,
    variables: {},
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to get prompt templates');
  }

  return response.data?.getPromptTemplates || [];
}

/**
 * Create a new prompt template
 */
export async function createPromptTemplate(input: {
  name: string;
  prompt: string;
  description?: string;
}): Promise<PromptTemplateResponse> {
  const response = await flowAIGraphQLRequest<{ createPromptTemplate: PromptTemplateResponse }>({
    query: CREATE_PROMPT_TEMPLATE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to create prompt template');
  }

  return response.data!.createPromptTemplate;
}

/**
 * Update a prompt template
 */
export async function updatePromptTemplate(input: {
  id: string;
  name?: string;
  prompt?: string;
  description?: string;
}): Promise<PromptTemplateResponse> {
  const response = await flowAIGraphQLRequest<{ updatePromptTemplate: PromptTemplateResponse }>({
    query: UPDATE_PROMPT_TEMPLATE,
    variables: { input },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to update prompt template');
  }

  return response.data!.updatePromptTemplate;
}

/**
 * Delete a prompt template
 */
export async function deletePromptTemplate(templateId: string): Promise<boolean> {
  const response = await flowAIGraphQLRequest<{ deletePromptTemplate: boolean }>({
    query: DELETE_PROMPT_TEMPLATE,
    variables: { templateId },
  });

  if (response.errors) {
    throw new Error(response.errors[0]?.message || 'Failed to delete prompt template');
  }

  return response.data?.deletePromptTemplate || false;
}

'use client';

import { apolloClient } from './apollo';
import {
  Q_GET_WORKFLOW,
  Q_GET_WORKFLOWS,
  Q_GET_WORKFLOW_EXECUTIONS,
  Q_GET_WORKFLOW_GALLERY,
  Q_GET_ALL_EXECUTIONS,
  Q_GET_EXECUTION_BY_ID,
  Q_GET_PRICING_TEMPLATES,
  M_SAVE_WORKFLOW,
  M_UPDATE_WORKFLOW,
  M_DELETE_WORKFLOW,
  M_EXECUTE_WORKFLOW,
  M_EXECUTE_PIPELINE,
} from './gql';
import { uploadFile as crmUploadFile } from '@/components/lib/graphql/files';

export class WorkflowAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowAPIError';
  }
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  instruction?: string;
  workflow_json: WorkflowJson;
  generated_code?: string;
  pseudo_code?: string;
  status: string;
  is_public?: boolean;
  template_type?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  tenant_id?: string;
}

export interface WorkflowJson {
  steps?: WorkflowStep[];
  output_format?: string;
  [key: string]: unknown;
}

export interface WorkflowStep {
  id?: string;
  type?: string;
  step_number?: number;
  description?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  input_data?: Record<string, unknown>;
  output_data?: ExecutionOutputData;
  error_message?: string;
  execution_log?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ExecutionOutputData {
  nodes?: Record<string, PipelineNodeResult>;
  [key: string]: unknown;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  instruction: string;
  auto_execute?: boolean;
  input_data?: Record<string, unknown>;
  is_public?: boolean;
}

export interface WorkflowGalleryResponse {
  public_workflows: Workflow[];
  my_workflows: Workflow[];
}

export interface PipelineNodeResult {
  success: boolean;
  error?: string | null;
  result?: PipelineResultData;
  file_metadata?: FileMetadata[];
  workflow_plan?: WorkflowPlan;
  code?: string;
  pseudo_code?: string;
  stdout?: string;
  stderr?: string;
  [key: string]: unknown;
}

export type PipelineResultData = Record<string, unknown> | unknown[] | string | null;

export interface FileMetadata {
  filename: string;
  filepath: string;
  file_type: string;
  was_structured: boolean;
  tabs_data?: TabData[];
}

export interface TabData {
  tab_name: string;
  columns?: string[];
  sample_rows?: unknown[];
  error?: string;
}

export interface WorkflowPlan {
  steps?: PlanStep[];
  output_format?: string;
  [key: string]: unknown;
}

export interface PlanStep {
  step_number?: number;
  description?: string;
  [key: string]: unknown;
}

export interface PipelineExecuteResponse {
  success: boolean;
  error?: string | null;
  result?: unknown;
  nodes: {
    node1?: PipelineNodeResult;
    node2?: PipelineNodeResult;
    node3?: PipelineNodeResult;
    node4?: PipelineNodeResult;
    [key: string]: PipelineNodeResult | undefined;
  };
  warnings?: string[];
  column_mapping?: Record<string, string>;
  fileIds?: string[];
  executionId?: string;
}

interface GraphQLWorkflow {
  id: string;
  name: string;
  description?: string | null;
  instruction?: string;
  workflowJson?: WorkflowJson;
  generatedCode?: string | null;
  pseudoCode?: string | null;
  status: string;
  isPublic?: boolean | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
}

interface GraphQLExecution {
  id: string;
  workflowId: string;
  status: string;
  inputData?: Record<string, unknown>;
  outputData?: ExecutionOutputData | string;
  errorMessage?: string | null;
  executionLog?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

interface GraphQLPipelineResult {
  success: boolean;
  error: string | null;
  result: unknown;
  nodes: Record<string, PipelineNodeResult> | string;
  warnings: string[] | null;
  columnMapping: Record<string, string> | string | null;
}

function transformWorkflow(w: GraphQLWorkflow): Workflow {
  return {
    id: w.id,
    name: w.name,
    description: w.description ?? undefined,
    instruction: w.instruction,
    workflow_json: w.workflowJson ?? {},
    generated_code: w.generatedCode ?? undefined,
    pseudo_code: w.pseudoCode ?? undefined,
    status: w.status,
    is_public: w.isPublic ?? false,
    created_at: w.createdAt,
    updated_at: w.updatedAt ?? undefined,
    created_by: w.createdBy ?? undefined,
    tenant_id: undefined,
  };
}

function transformExecution(e: GraphQLExecution): WorkflowExecution {
  return {
    id: e.id,
    workflow_id: e.workflowId,
    status: e.status,
    input_data: e.inputData,
    output_data: parseOutputDataNodes(e.outputData),
    error_message: e.errorMessage ?? undefined,
    execution_log: e.executionLog ?? undefined,
    started_at: e.startedAt ?? undefined,
    completed_at: e.completedAt ?? undefined,
    created_at: e.createdAt,
  };
}

function parseOutputDataNodes(outputData: ExecutionOutputData | string | undefined): ExecutionOutputData | undefined {
  if (!outputData) {
    return undefined;
  }

  let parsedOutput: ExecutionOutputData | undefined = undefined;
  if (typeof outputData === 'string') {
    try {
      parsedOutput = JSON.parse(outputData);
    } catch {
      console.error('Failed to parse output_data JSON string');
      return undefined;
    }
  } else {
    parsedOutput = outputData;
  }

  if (!parsedOutput || typeof parsedOutput !== 'object') {
    return parsedOutput;
  }

  // Handle nested nodes JSON string
  if (parsedOutput.nodes && typeof parsedOutput.nodes === 'string') {
    try {
      return {
        ...parsedOutput,
        nodes: JSON.parse(parsedOutput.nodes as unknown as string),
      };
    } catch {
      console.error('Failed to parse output_data.nodes JSON string');
      return parsedOutput;
    }
  }

  return parsedOutput;
}

function parseJsonString<T>(value: T | string, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

class WorkflowAPI {
  async getWorkflowGallery(): Promise<WorkflowGalleryResponse> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflowGallery: {
        publicWorkflows: GraphQLWorkflow[];
        myWorkflows: GraphQLWorkflow[];
      };
    }>({
      query: Q_GET_WORKFLOW_GALLERY,
      fetchPolicy: 'network-only',
    });

    if (!data?.workflowGallery) {
      throw new WorkflowAPIError('GALLERY_FETCH_FAILED', 'Failed to fetch workflow gallery');
    }

    return {
      public_workflows: data.workflowGallery.publicWorkflows.map(transformWorkflow),
      my_workflows: data.workflowGallery.myWorkflows.map(transformWorkflow),
    };
  }

  async getPricingTemplates(): Promise<Workflow[]> {
    const client = apolloClient;
    const { data } = await client.query<{
      pricingTemplates: GraphQLWorkflow[];
    }>({
      query: Q_GET_PRICING_TEMPLATES,
      fetchPolicy: 'network-only',
    });

    if (!data?.pricingTemplates) {
      throw new WorkflowAPIError('PRICING_TEMPLATES_FETCH_FAILED', 'Failed to fetch pricing templates');
    }

    return data.pricingTemplates.map(transformWorkflow);
  }

  async listWorkflows(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ workflows: Workflow[]; total: number; page: number; page_size: number }> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflows: {
        workflows: GraphQLWorkflow[];
        total: number;
        page: number;
        pageSize: number;
      };
    }>({
      query: Q_GET_WORKFLOWS,
      variables: { page, pageSize },
      fetchPolicy: 'network-only',
    });

    if (!data?.workflows) {
      throw new WorkflowAPIError('WORKFLOWS_FETCH_FAILED', 'Failed to fetch workflows');
    }

    return {
      workflows: data.workflows.workflows.map(transformWorkflow),
      total: data.workflows.total,
      page: data.workflows.page,
      page_size: data.workflows.pageSize,
    };
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflow: GraphQLWorkflow | null;
    }>({
      query: Q_GET_WORKFLOW,
      variables: { workflowId: id },
      fetchPolicy: 'network-only',
    });

    if (!data?.workflow) {
      throw new WorkflowAPIError('WORKFLOW_NOT_FOUND', 'Workflow not found', { workflowId: id });
    }

    return transformWorkflow(data.workflow);
  }

  async saveWorkflow(opts: {
    name: string;
    instruction: string;
    workflowJson?: WorkflowJson;
    generatedCode?: string;
    description?: string;
    pseudoCode?: string;
    isPublic?: boolean;
    templateType?: string;
  }): Promise<Workflow> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      saveWorkflow: GraphQLWorkflow;
    }>({
      mutation: M_SAVE_WORKFLOW,
      variables: {
        name: opts.name,
        instruction: opts.instruction,
        workflowJson: opts.workflowJson ?? {},
        generatedCode: opts.generatedCode ?? '',
        description: opts.description,
        pseudoCode: opts.pseudoCode,
        isPublic: opts.isPublic ?? false,
        templateType: opts.templateType ?? 'workflow',
      },
    });

    if (!data?.saveWorkflow) {
      throw new WorkflowAPIError('WORKFLOW_SAVE_FAILED', 'Failed to save workflow');
    }

    return transformWorkflow(data.saveWorkflow);
  }

  async saveWorkflowFromPipeline(opts: {
    name: string;
    instruction: string;
    workflowJson?: WorkflowJson;
    generatedCode?: string;
    description?: string;
    pseudoCode?: string;
    isPublic?: boolean;
    templateType?: string;
  }): Promise<Workflow> {
    return this.saveWorkflow(opts);
  }

  async updateWorkflow(id: string, payload: Partial<Workflow>): Promise<Workflow> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      updateWorkflow: GraphQLWorkflow | null;
    }>({
      mutation: M_UPDATE_WORKFLOW,
      variables: {
        workflowId: id,
        name: payload.name,
        description: payload.description,
        instruction: payload.instruction,
        workflowJson: payload.workflow_json,
        status: payload.status,
        generatedCode: payload.generated_code,
        pseudoCode: payload.pseudo_code,
        isPublic: payload.is_public,
        templateType: payload.template_type,
      },
    });

    if (!data?.updateWorkflow) {
      throw new WorkflowAPIError('WORKFLOW_NOT_FOUND', 'Workflow not found', { workflowId: id });
    }

    return transformWorkflow(data.updateWorkflow);
  }

  async deleteWorkflow(id: string): Promise<void> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      deleteWorkflow: boolean;
    }>({
      mutation: M_DELETE_WORKFLOW,
      variables: { workflowId: id },
    });

    if (!data?.deleteWorkflow) {
      throw new WorkflowAPIError('WORKFLOW_DELETE_FAILED', 'Failed to delete workflow', { workflowId: id });
    }
  }

  async executeWorkflow(
    workflowId: string,
    inputData?: Record<string, unknown>
  ): Promise<WorkflowExecution> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      executeWorkflow: GraphQLExecution;
    }>({
      mutation: M_EXECUTE_WORKFLOW,
      variables: {
        workflowId,
        inputData,
      },
    });

    if (!data?.executeWorkflow) {
      throw new WorkflowAPIError('WORKFLOW_EXECUTE_FAILED', 'Failed to execute workflow', { workflowId });
    }

    return transformExecution(data.executeWorkflow);
  }

  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const client = apolloClient;
    const { data } = await client.query<{
      executionById: GraphQLExecution | null;
    }>({
      query: Q_GET_EXECUTION_BY_ID,
      variables: { executionId },
      fetchPolicy: 'network-only',
    });

    if (!data?.executionById) {
      throw new WorkflowAPIError('EXECUTION_NOT_FOUND', 'Execution not found', { executionId });
    }

    return transformExecution(data.executionById);
  }

  async listExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflowExecutions: GraphQLExecution[];
    }>({
      query: Q_GET_WORKFLOW_EXECUTIONS,
      variables: { workflowId },
      fetchPolicy: 'network-only',
    });

    if (!data?.workflowExecutions) {
      throw new WorkflowAPIError('EXECUTIONS_FETCH_FAILED', 'Failed to fetch executions', { workflowId });
    }

    return data.workflowExecutions.map(transformExecution);
  }

  async listAllExecutions(params?: {
    status?: string;
    workflowId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<WorkflowExecution[]> {
    const client = apolloClient;
    const { data } = await client.query<{
      allExecutions: {
        executions: GraphQLExecution[];
        total: number;
        page: number;
        pageSize: number;
      };
    }>({
      query: Q_GET_ALL_EXECUTIONS,
      variables: {
        status: params?.status,
        workflowId: params?.workflowId,
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
      },
      fetchPolicy: 'network-only',
    });

    if (!data?.allExecutions) {
      throw new WorkflowAPIError('EXECUTIONS_FETCH_FAILED', 'Failed to fetch executions');
    }

    return data.allExecutions.executions.map(transformExecution);
  }

  private async uploadFile(file: File): Promise<string> {
    try {
      const result = await crmUploadFile({
        file,
        fileName: file.name,
        fileEntityType: 'UNDEFINED',
      });

      return result.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new WorkflowAPIError('FILE_UPLOAD_FAILED', `Failed to upload ${file.name}: ${message}`, {
        fileName: file.name,
      });
    }
  }

  async executePipeline(
    prompt: string,
    files: File[] | undefined,
    existingFileIds: string[] | undefined,
    stopAfter: number = 4,
    overrideCode?: string,
    options?: {
      executionId?: string;
      startFromNode?: number;
      runAsync?: boolean;
      workflowId?: string;
    }
  ): Promise<PipelineExecuteResponse> {
    const client = apolloClient;

    let fileIds: string[];

    if (existingFileIds && existingFileIds.length > 0) {
      fileIds = existingFileIds;
    } else if (files && files.length > 0) {
      fileIds = [];
      for (const file of files) {
        const fileId = await this.uploadFile(file);
        fileIds.push(fileId);
      }
    } else {
      throw new WorkflowAPIError('MISSING_FILES', 'Either files or fileIds must be provided');
    }

    const { data } = await client.mutate<{
      executePipeline: GraphQLPipelineResult & { executionId?: string | null };
    }>({
      mutation: M_EXECUTE_PIPELINE,
      variables: {
        prompt,
        fileIds,
        overrideCode,
        stopAfter,
        executionId: options?.executionId,
        startFromNode: options?.startFromNode,
        runAsync: options?.runAsync ?? false,
        workflowId: options?.workflowId,
      },
    });

    if (!data?.executePipeline) {
      throw new WorkflowAPIError('PIPELINE_EXECUTE_FAILED', 'Pipeline execution failed');
    }

    const result = data.executePipeline;
    const nodes = parseJsonString(result.nodes, {} as Record<string, PipelineNodeResult>);

    const response: PipelineExecuteResponse = {
      success: result.success,
      error: result.error,
      result: result.result,
      nodes: nodes,
      fileIds: fileIds,
      executionId: result.executionId ?? undefined,
    };

    if (result.warnings) {
      response.warnings = result.warnings;
    }

    if (result.columnMapping) {
      response.column_mapping = parseJsonString(result.columnMapping, {} as Record<string, string>);
    }

    return response;
  }
}

export const workflowAPI = new WorkflowAPI();

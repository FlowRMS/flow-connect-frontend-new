/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { apolloClient } from './apollo';
import { flowrmsApolloClient } from './flowrms-apollo';
import {
  Q_GET_WORKFLOW,
  Q_GET_WORKFLOWS,
  Q_GET_WORKFLOW_EXECUTIONS,
  Q_GET_WORKFLOW_GALLERY,
  Q_GET_ALL_EXECUTIONS,
  Q_GET_EXECUTION_BY_ID,
  M_SAVE_WORKFLOW,
  M_UPDATE_WORKFLOW,
  M_DELETE_WORKFLOW,
  M_EXECUTE_WORKFLOW,
  M_EXECUTE_PIPELINE,
  M_UPLOAD_FILE,
} from './gql';

// Type definitions
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  instruction?: string;
  workflow_json: any;
  generated_code?: string;
  pseudo_code?: string;
  status: string;
  is_public?: boolean;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  tenant_id?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  execution_log?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  instruction: string;
  auto_execute?: boolean;
  input_data?: Record<string, any>;
  is_public?: boolean;
}

export interface WorkflowGalleryResponse {
  public_workflows: Workflow[];
  my_workflows: Workflow[];
}

export interface PipelineNodeResult {
  success: boolean;
  error?: string | null;
  [key: string]: any;
}

export interface PipelineExecuteResponse {
  success: boolean;
  error?: string | null;
  result?: any;
  nodes: {
    node1?: PipelineNodeResult;
    node2?: PipelineNodeResult;
    node3?: PipelineNodeResult;
    node4?: PipelineNodeResult;
    [key: string]: PipelineNodeResult | undefined;
  };
  warnings?: string[];
  column_mapping?: Record<string, any>;
  fileIds?: string[]; // Returned after Node 1 upload for reuse in subsequent nodes
}

// Helper to transform GraphQL workflow response to our format
function transformWorkflow(w: any): Workflow {
  return {
    id: w.id,
    name: w.name,
    description: w.description ?? undefined,
    instruction: w.instruction,
    workflow_json: w.workflowJson,
    generated_code: w.generatedCode ?? undefined,
    pseudo_code: w.pseudoCode ?? undefined,
    status: w.status,
    is_public: w.isPublic ?? false,
    created_at: w.createdAt,
    updated_at: w.updatedAt ?? undefined,
    created_by: w.createdBy ?? undefined,
    tenant_id: undefined, // tenantId not available in GraphQL schema
  };
}

// Helper to transform GraphQL execution response to our format
function transformExecution(e: any): WorkflowExecution {
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

// Helper to parse nodes in output_data if it's a JSON string
function parseOutputDataNodes(outputData: any): any {
  if (!outputData || typeof outputData !== 'object') {
    return outputData;
  }

  if (outputData.nodes && typeof outputData.nodes === 'string') {
    try {
      return {
        ...outputData,
        nodes: JSON.parse(outputData.nodes),
      };
    } catch (err) {
      console.error('Failed to parse output_data.nodes JSON string:', err);
      return outputData;
    }
  }

  return outputData;
}

class WorkflowAPI {
  // Get workflow gallery (public + my workflows)
  async getWorkflowGallery(): Promise<WorkflowGalleryResponse> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflowGallery: {
        publicWorkflows: any[];
        myWorkflows: any[];
      };
    }>({
      query: Q_GET_WORKFLOW_GALLERY,
      fetchPolicy: 'network-only',
    });

    if (!data?.workflowGallery) {
      throw new Error('Failed to fetch workflow gallery');
    }

    return {
      public_workflows: data.workflowGallery.publicWorkflows.map(transformWorkflow),
      my_workflows: data.workflowGallery.myWorkflows.map(transformWorkflow),
    };
  }

  // List workflows with pagination
  async listWorkflows(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ workflows: Workflow[]; total: number; page: number; page_size: number }> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflows: {
        workflows: any[];
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
      throw new Error('Failed to fetch workflows');
    }

    return {
      workflows: data.workflows.workflows.map(transformWorkflow),
      total: data.workflows.total,
      page: data.workflows.page,
      page_size: data.workflows.pageSize,
    };
  }

  // Get single workflow by ID
  async getWorkflow(id: string): Promise<Workflow> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflow: any | null;
    }>({
      query: Q_GET_WORKFLOW,
      variables: { workflowId: id },
      fetchPolicy: 'network-only',
    });

    if (!data?.workflow) {
      throw new Error('Workflow not found');
    }

    return transformWorkflow(data.workflow);
  }

  // Save workflow from pipeline
  async saveWorkflow(opts: {
    name: string;
    instruction: string;
    workflowJson: any;
    generatedCode: string;
    description?: string;
    pseudoCode?: string;
    isPublic?: boolean;
  }): Promise<Workflow> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      saveWorkflow: any;
    }>({
      mutation: M_SAVE_WORKFLOW,
      variables: {
        name: opts.name,
        instruction: opts.instruction,
        workflowJson: opts.workflowJson,
        generatedCode: opts.generatedCode,
        description: opts.description,
        pseudoCode: opts.pseudoCode,
        isPublic: opts.isPublic ?? false,
      },
    });

    if (!data?.saveWorkflow) {
      throw new Error('Failed to save workflow');
    }

    return transformWorkflow(data.saveWorkflow);
  }

  // Alias for saveWorkflow for compatibility
  async saveWorkflowFromPipeline(opts: {
    name: string;
    instruction: string;
    workflowJson: any;
    generatedCode: string;
    description?: string;
    pseudoCode?: string;
    isPublic?: boolean;
  }): Promise<Workflow> {
    return this.saveWorkflow(opts);
  }

  // Update workflow
  async updateWorkflow(id: string, payload: Partial<Workflow>): Promise<Workflow> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      updateWorkflow: any | null;
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
      },
    });

    if (!data?.updateWorkflow) {
      throw new Error('Workflow not found');
    }

    return transformWorkflow(data.updateWorkflow);
  }

  // Delete workflow
  async deleteWorkflow(id: string): Promise<void> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      deleteWorkflow: boolean;
    }>({
      mutation: M_DELETE_WORKFLOW,
      variables: { workflowId: id },
    });

    if (!data?.deleteWorkflow) {
      throw new Error('Failed to delete workflow');
    }
  }

  // Execute workflow
  async executeWorkflow(
    workflowId: string,
    inputData?: Record<string, any>
  ): Promise<WorkflowExecution> {
    const client = apolloClient;
    const { data } = await client.mutate<{
      executeWorkflow: any;
    }>({
      mutation: M_EXECUTE_WORKFLOW,
      variables: {
        workflowId,
        inputData,
      },
    });

    if (!data?.executeWorkflow) {
      throw new Error('Failed to execute workflow');
    }

    return transformExecution(data.executeWorkflow);
  }

  // Get execution by ID
  async getExecution(executionId: string): Promise<WorkflowExecution> {
    const client = apolloClient;
    const { data } = await client.query<{
      executionById: any | null;
    }>({
      query: Q_GET_EXECUTION_BY_ID,
      variables: { executionId },
      fetchPolicy: 'network-only',
    });

    if (!data?.executionById) {
      throw new Error('Execution not found');
    }

    return transformExecution(data.executionById);
  }

  // List executions for a workflow
  async listExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    const client = apolloClient;
    const { data } = await client.query<{
      workflowExecutions: any[];
    }>({
      query: Q_GET_WORKFLOW_EXECUTIONS,
      variables: { workflowId },
      fetchPolicy: 'network-only',
    });

    if (!data?.workflowExecutions) {
      throw new Error('Failed to fetch executions');
    }

    return data.workflowExecutions.map(transformExecution);
  }

  // List all executions with optional filters
  async listAllExecutions(params?: {
    status?: string;
    workflowId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<WorkflowExecution[]> {
    const client = apolloClient;
    const { data } = await client.query<{
      allExecutions: {
        executions: any[];
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
      throw new Error('Failed to fetch executions');
    }

    return data.allExecutions.executions.map(transformExecution);
  }

  // Upload a single file using singleFileUpload mutation (same as DocumentUploadPane)
  private async uploadFile(file: File): Promise<string> {
    console.log('📤 Uploading file for pipeline:', file.name);

    const result = await flowrmsApolloClient.mutate({
      mutation: M_UPLOAD_FILE,
      variables: {
        file: file,
        tenantLevel: true,
        public: false,
      },
    });

    // Check for GraphQL errors in the result
    const errors = (result as any).errors;
    if (errors && errors.length > 0) {
      console.error('❌ Upload error:', errors);
      throw new Error(`Failed to upload ${file.name}: ${errors[0]?.message || 'Unknown error'}`);
    }

    const data = result.data as {
      singleFileUpload?: {
        results?: Array<{
          id: string;
          fileName: string;
          status: { code: string; message: string };
        }>;
      };
    };

    if (data?.singleFileUpload?.results) {
      const uploadResult = data.singleFileUpload.results[0];
      console.log('✅ Upload successful:', uploadResult);

      if (uploadResult.status?.code === 'SUCCESS' || uploadResult.id) {
        return uploadResult.id;
      } else {
        console.error('❌ Upload failed with status:', uploadResult.status);
        throw new Error(`Failed to upload: ${uploadResult.status?.message || 'Unknown error'}`);
      }
    }

    throw new Error('Failed to upload file: No results returned');
  }

  // Execute pipeline (4-node)
  // For Node 1: pass files to upload
  // For Nodes 2-4: pass fileIds from previous Node 1 run
  async executePipeline(
    prompt: string,
    files: File[] | undefined,
    existingFileIds: string[] | undefined,
    stopAfter: number = 4,
    overrideCode?: string
  ): Promise<PipelineExecuteResponse> {
    const client = apolloClient;

    let fileIds: string[];

    if (existingFileIds && existingFileIds.length > 0) {
      // Reuse existing fileIds (for nodes 2, 3, 4)
      fileIds = existingFileIds;
      console.log('♻️ Reusing existing fileIds:', fileIds);
    } else if (files && files.length > 0) {
      // Upload files to get fileIds (for node 1)
      fileIds = [];
      for (const file of files) {
        const fileId = await this.uploadFile(file);
        fileIds.push(fileId);
      }
      console.log('📄 Files uploaded with IDs:', fileIds);
    } else {
      throw new Error('Either files or fileIds must be provided');
    }

    const { data } = await client.mutate<{
      executePipeline: {
        success: boolean;
        error: string | null;
        result: any;
        nodes: any;
        warnings: string[] | null;
        columnMapping: any;
      };
    }>({
      mutation: M_EXECUTE_PIPELINE,
      variables: {
        prompt,
        fileIds,
        overrideCode,
        stopAfter,
      },
    });

    if (!data?.executePipeline) {
      throw new Error('Pipeline execution failed');
    }

    const result = data.executePipeline;

    // Parse nodes if it's a JSON string
    let nodes = result.nodes || {};
    if (typeof nodes === 'string') {
      try {
        nodes = JSON.parse(nodes);
      } catch (e) {
        console.error('Failed to parse nodes JSON string:', e);
        nodes = {};
      }
    }

    const response: PipelineExecuteResponse = {
      success: result.success,
      error: result.error,
      result: result.result,
      nodes: nodes,
      fileIds: fileIds, // Return fileIds so caller can reuse for subsequent nodes
    };

    if (result.warnings) {
      response.warnings = result.warnings;
    }

    // Parse columnMapping if it's a JSON string
    if (result.columnMapping) {
      let columnMapping = result.columnMapping;
      if (typeof columnMapping === 'string') {
        try {
          columnMapping = JSON.parse(columnMapping);
        } catch (e) {
          console.error('Failed to parse columnMapping JSON string:', e);
          columnMapping = {};
        }
      }
      response.column_mapping = columnMapping;
    }

    return response;
  }
}

export const workflowAPI = new WorkflowAPI();






'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { workflowAPI, type PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';

type StepIndex = 1 | 2 | 3 | 4;

export function useCreateWorkflow() {
  const router = useRouter();

  // Form state
  const [prompt, setPrompt] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [editedCode, setEditedCode] = useState<string>('');

  // Pipeline state
  const [currentStep, setCurrentStep] = useState<StepIndex>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<StepIndex | 0>(0);
  const [loadingStep, setLoadingStep] = useState<StepIndex | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineExecuteResponse | null>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[] | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pollingExecutionId, setPollingExecutionId] = useState<string | null>(null);
  const [autoDownloadedCsv, setAutoDownloadedCsv] = useState(false);
  const [lastHydratedExecutionId, setLastHydratedExecutionId] = useState<string | null>(null);

  // Dialog state
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [pendingTemplateType, setPendingTemplateType] = useState<'workflow' | 'pricing_template'>('workflow');

  const isPolling = pollingExecutionId !== null;
  const isBusy = loadingStep !== null || isPolling;
  const canRun = useMemo(() => prompt.trim().length > 0 && files.length > 0, [prompt, files]);
  const canGoNext = currentStep < 4 && maxCompletedStep >= currentStep;
  const canSave = currentStep >= 3 && !!pipelineResult;

  // Merge pipeline results
  const mergePipelineResult = useCallback((
    prev: PipelineExecuteResponse | null,
    next: PipelineExecuteResponse
  ): PipelineExecuteResponse => {
    if (!prev) return next;
    const mergedNodes = { ...(prev.nodes ?? {}) };
    Object.entries(next.nodes ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        mergedNodes[key] = value;
      }
    });
    return {
      ...prev,
      ...next,
      nodes: mergedNodes,
      fileIds: next.fileIds ?? prev.fileIds,
      executionId: next.executionId ?? prev.executionId,
    };
  }, []);

  // Normalize pipeline response
  const normalizePipelineResponse = useCallback((res: PipelineExecuteResponse): PipelineExecuteResponse => {
    const rawNodes = (res as unknown as { nodes?: unknown }).nodes;
    let nodes = res.nodes ?? {};
    if (typeof rawNodes === 'string') {
      try {
        nodes = JSON.parse(rawNodes) as PipelineExecuteResponse['nodes'];
      } catch (err) {
        console.warn('Failed to parse nodes JSON string in response.', err);
        nodes = {};
      }
    }
    if (!nodes || typeof nodes !== 'object') {
      nodes = {};
    }
    return { ...res, nodes };
  }, []);

  // File handlers
  const handleFileChange = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList);
    setFiles((prev) => [...prev, ...arr]);
    setUploadedFileIds(null);
    setExecutionId(null);
    setPipelineResult(null);
    toast.success(`Added ${arr.length} file(s)`);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileIds(null);
    setExecutionId(null);
    setPipelineResult(null);
  }, []);

  // Run step
  const runStep = useCallback(async (step: StepIndex) => {
    if (isPolling) {
      toast.error('A pipeline execution is already running.');
      return;
    }

    if (step === 1) {
      if (!canRun) {
        toast.error('Please provide a prompt and at least one file.');
        return;
      }
    } else {
      if (!uploadedFileIds || uploadedFileIds.length === 0) {
        toast.error('Please run Node 1 first to upload files.');
        return;
      }
      if (!executionId) {
        toast.error('Please run Node 1 first to initialize the execution.');
        return;
      }
    }

    setLoadingStep(step);
    try {
      const node3Code = pipelineResult?.nodes?.node3?.code ?? '';
      const overrideCode = step === 4 ? (editedCode.trim() || node3Code || '').trim() : '';
      const shouldOverrideCode = step === 4 && overrideCode.length > 0;
      const runAsync = step === 4;

      const res = await workflowAPI.executePipeline(
        prompt.trim(),
        step === 1 ? files : undefined,
        step === 1 ? undefined : uploadedFileIds ?? undefined,
        step,
        shouldOverrideCode ? overrideCode : undefined,
        {
          executionId: step === 1 ? undefined : executionId ?? undefined,
          startFromNode: step,
          runAsync,
        }
      );

      if (step === 1 && res.fileIds && res.fileIds.length > 0) {
        setUploadedFileIds(res.fileIds);
      }

      if (res.executionId) {
        setExecutionId(res.executionId);
      }

      if (!res.success) {
        toast.error(res.error || `Pipeline failed at node ${step}`);
        return;
      }

      if (runAsync) {
        if (!res.executionId) {
          toast.error('Execution did not return an ID. Cannot poll for results.');
          return;
        }
        setAutoDownloadedCsv(false);
        setPollingExecutionId(res.executionId);
        setCurrentStep(step);
        toast.success('Node 4 started. Waiting for completion...');
        return;
      }

      const normalizedRes = normalizePipelineResponse(res);
      let hydratedResult = normalizedRes;

      const hydrationId = normalizedRes.executionId ?? executionId;
      if (hydrationId && step >= 2) {
        try {
          const execution = await workflowAPI.getExecution(hydrationId);
          let nodes = execution.output_data?.nodes ?? {};
          if (typeof nodes === 'string') {
            try {
              nodes = JSON.parse(nodes);
            } catch (err) {
              console.warn('Failed to parse execution nodes JSON string.', err);
              nodes = {};
            }
          }
          if (nodes && Object.keys(nodes).length > 0) {
            hydratedResult = mergePipelineResult(hydratedResult, { ...normalizedRes, nodes });
          }
        } catch (err) {
          console.warn('Failed to hydrate pipeline nodes from execution.', err);
        }
      }

      setPipelineResult((prev) => mergePipelineResult(prev, hydratedResult));
      setMaxCompletedStep((prev) => (step > prev ? step : prev) as StepIndex | 0);
      toast.success(`Node ${step} completed successfully.`);
      setCurrentStep(step);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message || `Failed to run node ${step}`);
    } finally {
      setLoadingStep(null);
    }
  }, [isPolling, canRun, uploadedFileIds, executionId, pipelineResult, editedCode, prompt, files, normalizePipelineResponse, mergePipelineResult]);

  const handleNext = useCallback(async () => {
    const nextStep = (currentStep + 1) as StepIndex;
    if (nextStep > 4) return;
    await runStep(nextStep);
  }, [currentStep, runStep]);

  const handleRunThisStep = useCallback(async () => {
    await runStep(currentStep);
  }, [currentStep, runStep]);

  // Step status
  const stepStatus = useCallback((step: StepIndex): 'loading' | 'done' | 'pending' => {
    if (loadingStep === step || (isPolling && step === 4)) return 'loading';
    if (maxCompletedStep >= step) return 'done';
    return 'pending';
  }, [loadingStep, isPolling, maxCompletedStep]);

  const handleStepClick = useCallback((step: StepIndex) => {
    if (step <= (maxCompletedStep || 1)) {
      setCurrentStep(step);
    }
  }, [maxCompletedStep]);

  // Save workflow
  const handleSaveWorkflow = useCallback((templateType: 'workflow' | 'pricing_template') => {
    if (!pipelineResult?.nodes?.node2 || !pipelineResult.nodes.node3) {
      toast.error('Run up to Node 3 (plan + code) before saving.');
      return;
    }
    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name.');
      return;
    }
    setPendingTemplateType(templateType);
    setShowVisibilityDialog(true);
  }, [pipelineResult, workflowName]);

  const confirmSaveWorkflow = useCallback(async (isPublic: boolean) => {
    if (!pipelineResult?.nodes?.node2 || !pipelineResult.nodes.node3) return;

    setSavingVisibility(true);
    try {
      const isPricingTemplate = pendingTemplateType === 'pricing_template';
      const saved = await workflowAPI.saveWorkflowFromPipeline({
        name: workflowName.trim(),
        description: description.trim() || undefined,
        instruction: prompt.trim(),
        workflowJson: pipelineResult.nodes.node2.workflow_plan,
        generatedCode: pipelineResult.nodes.node3.code,
        pseudoCode: pipelineResult.nodes.node3.pseudo_code,
        isPublic,
        templateType: pendingTemplateType,
      });

      if (isPricingTemplate) {
        toast.success('Pricing template saved. Redirecting to Upload...');
        router.push('/flow-ai/upload');
      } else {
        toast.success(
          isPublic
            ? 'Workflow saved as public. Redirecting to workflow details...'
            : 'Workflow saved as private. Redirecting to workflow details...'
        );
        router.push(`/flow-ai/workflows/${saved.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message || 'Failed to save workflow.');
    } finally {
      setSavingVisibility(false);
      setShowVisibilityDialog(false);
    }
  }, [pipelineResult, workflowName, description, prompt, router, pendingTemplateType]);

  // Polling effect
  useEffect(() => {
    if (!pollingExecutionId) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const pollExecution = async () => {
      try {
        const execution = await workflowAPI.getExecution(pollingExecutionId);
        if (cancelled) return;

        if (execution.status === 'completed' || execution.status === 'failed') {
          const output = execution.output_data ?? {};
          let nodes = output?.nodes ?? {};
          if (typeof nodes === 'string') {
            try {
              nodes = JSON.parse(nodes);
            } catch {
              nodes = {};
            }
          }

          const response: PipelineExecuteResponse = {
            success: typeof output?.success === 'boolean' ? output.success : execution.status === 'completed',
            error: (typeof output?.error === 'string' ? output.error : null) ?? execution.error_message ?? null,
            result: output?.result ?? null,
            nodes: nodes,
            warnings: Array.isArray(output?.warnings) ? output.warnings : undefined,
            fileIds: uploadedFileIds ?? undefined,
            executionId: pollingExecutionId,
          };

          setPipelineResult((prev) => mergePipelineResult(prev, response));
          setMaxCompletedStep(4);
          setCurrentStep(4);
          setPollingExecutionId(null);

          if (execution.status === 'failed') {
            toast.error(response.error || 'Node 4 failed.');
          } else {
            toast.success('Node 4 completed successfully.');
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setPollingExecutionId(null);
        const message = err instanceof Error ? err.message : 'Unknown error';
        toast.error(message || 'Failed to fetch execution status.');
      }
    };

    pollExecution();
    intervalId = setInterval(pollExecution, 4000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingExecutionId, uploadedFileIds, mergePipelineResult]);

  // Auto-download CSV effect
  useEffect(() => {
    if (!pipelineResult?.nodes?.node4 || autoDownloadedCsv) return;
    const raw = pipelineResult.nodes.node4.result;
    const extractData = (r: unknown): Record<string, unknown>[] => {
      if (!r) return [];
      if (Array.isArray(r)) return r as Record<string, unknown>[];
      const obj = r as Record<string, unknown>;
      if (Array.isArray(obj?.data)) return obj.data as Record<string, unknown>[];
      if (Array.isArray(obj?.rows)) return obj.rows as Record<string, unknown>[];
      return [];
    };
    const data = extractData(raw);
    if (!data.length) return;

    const headers = Object.keys(data[0] ?? {});
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-result.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setAutoDownloadedCsv(true);
    toast.success('Result CSV downloaded.');
  }, [pipelineResult, autoDownloadedCsv]);

  // Hydration effect
  useEffect(() => {
    if (!executionId) return;
    if (lastHydratedExecutionId === executionId) return;
    if (pipelineResult?.nodes?.node2 && pipelineResult?.nodes?.node3) return;

    const hydrateNodes = async () => {
      try {
        const execution = await workflowAPI.getExecution(executionId);
        let nodes = execution.output_data?.nodes ?? {};
        if (typeof nodes === 'string') {
          try {
            nodes = JSON.parse(nodes);
          } catch {
            nodes = {};
          }
        }
        if (nodes && Object.keys(nodes).length > 0) {
          setPipelineResult((prev) =>
            mergePipelineResult(prev, { success: true, nodes } as PipelineExecuteResponse)
          );
        }
      } catch {
        console.warn('Failed to hydrate pipeline nodes from execution.');
      } finally {
        setLastHydratedExecutionId(executionId);
      }
    };

    hydrateNodes();
  }, [executionId, lastHydratedExecutionId, pipelineResult, mergePipelineResult]);

  const bannerMessage = useMemo(() => {
    if (!pipelineResult) return null;
    if (!pipelineResult.success && pipelineResult.error) return pipelineResult.error;
    return null;
  }, [pipelineResult]);

  return {
    // Form state
    prompt,
    setPrompt,
    workflowName,
    setWorkflowName,
    description,
    setDescription,
    files,
    handleFileChange,
    removeFile,
    editedCode,
    setEditedCode,

    // Pipeline state
    currentStep,
    setCurrentStep,
    maxCompletedStep,
    loadingStep,
    pipelineResult,
    isPolling,
    isBusy,
    canRun,
    canGoNext,
    canSave,

    // Actions
    runStep,
    handleNext,
    handleRunThisStep,
    stepStatus,
    handleStepClick,
    handleSaveWorkflow,

    // Dialog state
    showVisibilityDialog,
    setShowVisibilityDialog,
    savingVisibility,
    confirmSaveWorkflow,

    // Misc
    bannerMessage,
  };
}

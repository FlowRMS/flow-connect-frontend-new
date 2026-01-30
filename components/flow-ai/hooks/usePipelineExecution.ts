'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { workflowAPI, type Workflow, type PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';

export type StepIndex = 1 | 2 | 3 | 4;

export interface UsePipelineExecutionProps {
  prompt: string;
  files: File[];
  uploadedFileIds: string[];
  setUploadedFileIds: (ids: string[]) => void;
  editedCode: string;
  workflow?: Workflow;
  onSave?: (result: PipelineExecuteResponse) => void;
}

export interface UsePipelineExecutionReturn {
  currentStep: StepIndex;
  maxCompletedStep: StepIndex | 0;
  loadingStep: StepIndex | null;
  pipelineResult: PipelineExecuteResponse | null;
  setCurrentStep: (step: StepIndex) => void;
  runStep: (step: StepIndex) => Promise<void>;
  runWithSavedCode: () => Promise<void>;
  handleNext: () => Promise<void>;
  handleRunThisStep: () => Promise<void>;
  canRun: boolean;
  canGoNext: boolean;
  stepStatus: (step: StepIndex) => 'loading' | 'done' | 'pending';
  handleStepClick: (step: StepIndex) => void;
}

export function usePipelineExecution({
  prompt,
  files,
  uploadedFileIds,
  setUploadedFileIds,
  editedCode,
  workflow,
  onSave,
}: UsePipelineExecutionProps): UsePipelineExecutionReturn {
  const [currentStep, setCurrentStep] = useState<StepIndex>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<StepIndex | 0>(0);
  const [loadingStep, setLoadingStep] = useState<StepIndex | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineExecuteResponse | null>(null);

  const canRun = prompt.trim().length > 0 && files.length > 0;
  const canGoNext = currentStep < 4 && maxCompletedStep >= currentStep;

  const runStep = useCallback(async (step: StepIndex) => {
    if (!canRun) {
      toast.error('Please provide a prompt and at least one file.');
      return;
    }

    if (step > 1 && uploadedFileIds.length === 0) {
      toast.error('Please run Node 1 first to upload files.');
      return;
    }

    setLoadingStep(step);
    try {
      const shouldOverrideCode = step === 4 && editedCode.trim().length > 0;

      const res = await workflowAPI.executePipeline(
        prompt.trim(),
        step === 1 ? files : undefined,
        step === 1 ? undefined : uploadedFileIds,
        step,
        shouldOverrideCode ? editedCode : undefined
      );
      setPipelineResult(res);

      if (step === 1 && res.fileIds) {
        setUploadedFileIds(res.fileIds);
      }

      if (!res.success) {
        toast.error(res.error || `Pipeline failed at node ${step}`);
        return;
      }

      setMaxCompletedStep((prev) => {
        const next = step > prev ? step : prev;
        return next as StepIndex | 0;
      });

      toast.success(`Node ${step} completed successfully.`);
      setCurrentStep(step);

      if (onSave && step >= 3) {
        onSave(res);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message || `Failed to run node ${step}`);
    } finally {
      setLoadingStep(null);
    }
  }, [canRun, uploadedFileIds, editedCode, prompt, files, setUploadedFileIds, onSave]);

  const runWithSavedCode = useCallback(async () => {
    if (!canRun) {
      toast.error('Please provide a prompt and at least one file.');
      return;
    }

    const savedCode = editedCode || workflow?.generated_code || '';
    if (!savedCode.trim()) {
      toast.error('No saved code available. Run the full pipeline first.');
      return;
    }

    setLoadingStep(4);
    try {
      const res = await workflowAPI.executePipeline(
        prompt.trim(),
        files,
        undefined,
        4,
        savedCode,
        4
      );
      setPipelineResult(res);

      if (res.fileIds) {
        setUploadedFileIds(res.fileIds);
      }

      if (!res.success) {
        toast.error(res.error || 'Pipeline failed at Node 4');
        return;
      }

      setMaxCompletedStep(4);
      setCurrentStep(4);
      toast.success('Execution completed with saved code!');

      if (onSave) {
        onSave(res);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(message || 'Failed to run with saved code');
    } finally {
      setLoadingStep(null);
    }
  }, [canRun, editedCode, workflow?.generated_code, prompt, files, setUploadedFileIds, onSave]);

  const handleNext = useCallback(async () => {
    const nextStep = (currentStep + 1) as StepIndex;
    if (nextStep > 4) return;
    await runStep(nextStep);
  }, [currentStep, runStep]);

  const handleRunThisStep = useCallback(async () => {
    await runStep(currentStep);
  }, [currentStep, runStep]);

  const stepStatus = useCallback((step: StepIndex): 'loading' | 'done' | 'pending' => {
    if (loadingStep === step) return 'loading';
    if (maxCompletedStep >= step) return 'done';
    return 'pending';
  }, [loadingStep, maxCompletedStep]);

  const handleStepClick = useCallback((step: StepIndex) => {
    if (step <= (maxCompletedStep || 1)) {
      setCurrentStep(step);
    }
  }, [maxCompletedStep]);

  return {
    currentStep,
    maxCompletedStep,
    loadingStep,
    pipelineResult,
    setCurrentStep,
    runStep,
    runWithSavedCode,
    handleNext,
    handleRunThisStep,
    canRun,
    canGoNext,
    stepStatus,
    handleStepClick,
  };
}

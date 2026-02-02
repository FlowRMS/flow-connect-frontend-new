'use client';

import { useState, useMemo, useEffect } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { useWorkflowTenant } from '@/lib/flow-ai/workflow-tenant-context';
import type { Workflow, PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';
import { cleanupOldImports } from '@/lib/flow-ai/workflow-import-storage';
import { jsonToCsv, downloadCsv } from '@/lib/flow-ai/pipeline-utils';
import { toast } from 'sonner';
import {
  usePipelineFiles,
  usePipelineExecution,
  useProductImport,
  type StepIndex,
} from '@/components/flow-ai/hooks';
import {
  PipelineInput,
  PipelineStepIndicator,
  PipelineNodeViewer,
  TemplateRunnerView,
} from './pipeline';

const STEP_TITLES: Record<StepIndex, string> = {
  1: 'Files & Tabs (Node 1)',
  2: 'Workflow Plan (Node 2)',
  3: 'Generated Code (Node 3)',
  4: 'Execution Result (Node 4)',
};

interface PipelineRunnerProps {
  workflow?: Workflow;
  onSave?: (result: PipelineExecuteResponse) => void;
}

export function PipelineRunner({ workflow, onSave }: PipelineRunnerProps) {
  const { isAdmin } = useWorkflowTenant();
  const [prompt, setPrompt] = useState(workflow?.instruction || '');
  const [editedCode, setEditedCode] = useState<string>(workflow?.generated_code || '');
  const [autoDownloadedCsv, setAutoDownloadedCsv] = useState(false);

  const hasSavedCode = useMemo(
    () => Boolean(workflow?.generated_code && workflow.generated_code.trim().length > 0),
    [workflow]
  );

  const isPricingTemplate = workflow?.template_type === 'pricing_template';

  const pipelineFiles = usePipelineFiles();
  const pipelineExecution = usePipelineExecution({
    prompt,
    files: pipelineFiles.files,
    uploadedFileIds: pipelineFiles.uploadedFileIds,
    setUploadedFileIds: pipelineFiles.setUploadedFileIds,
    editedCode,
    workflow,
    onSave,
  });

  const productImport = useProductImport({
    prompt,
    workflow,
  });

  // Cleanup old workflow imports on mount
  useEffect(() => {
    cleanupOldImports();
  }, []);

  // Auto-download CSV on node4 completion
  useEffect(() => {
    if (!pipelineExecution.pipelineResult?.nodes?.node4 || autoDownloadedCsv) return;

    const raw = pipelineExecution.pipelineResult.nodes.node4.result;
    const rawObj = raw as Record<string, unknown> | undefined;
    const data = (rawObj?.data ?? rawObj?.rows ?? raw) as Record<string, unknown>[] | undefined;

    if (!Array.isArray(data) || !data.length) return;

    const csv = jsonToCsv(data);
    if (!csv) return;

    downloadCsv('workflow-result.csv', csv);
    setAutoDownloadedCsv(true);
    toast.success('Result CSV downloaded.');
  }, [pipelineExecution.pipelineResult, autoDownloadedCsv]);

  const handleDownloadCsv = (data: unknown) => {
    const rows = extractTabularData(data);
    if (!rows.length) {
      toast.error('No data to download');
      return;
    }
    const csv = jsonToCsv(rows);
    if (csv) {
      downloadCsv('workflow-result.csv', csv);
      toast.success('CSV downloaded');
    }
  };

  // Helper to extract tabular data from various result formats
  function extractTabularData(raw: unknown): Record<string, unknown>[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(item => typeof item === 'object' && item !== null);

    const obj = raw as Record<string, unknown>;
    const possibleArrayProps = [
      'data', 'rows', 'result', 'results', 'items', 'records',
      'preview_rows', 'customer_price_list', 'products',
    ];

    for (const prop of possibleArrayProps) {
      if (Array.isArray(obj[prop])) {
        return (obj[prop] as unknown[]).filter(item => typeof item === 'object' && item !== null) as Record<string, unknown>[];
      }
    }

    // Check inside nodes.node4.result structure
    const nodes = obj.nodes as Record<string, unknown> | undefined;
    if (nodes?.node4) {
      const node4 = nodes.node4 as Record<string, unknown>;
      const node4Result = node4.result;
      if (Array.isArray(node4Result)) {
        return node4Result.filter(item => typeof item === 'object' && item !== null);
      }
      if (node4Result && typeof node4Result === 'object') {
        const resultObj = node4Result as Record<string, unknown>;
        for (const prop of possibleArrayProps) {
          if (Array.isArray(resultObj[prop])) {
            return (resultObj[prop] as unknown[]).filter(item => typeof item === 'object' && item !== null) as Record<string, unknown>[];
          }
        }
      }
    }

    return [];
  }

  // Template mode: simplified view for workflows with saved code
  if (hasSavedCode) {
    return (
      <TemplateRunnerView
        files={pipelineFiles.files}
        handleFileChange={pipelineFiles.handleFileChange}
        removeFile={pipelineFiles.removeFile}
        loadingStep={pipelineExecution.loadingStep}
        pipelineResult={pipelineExecution.pipelineResult}
        isNavigatingToImport={productImport.isNavigatingToImport}
        isPricingTemplate={isPricingTemplate}
        onRunWithSavedCode={pipelineExecution.runWithSavedCode}
        onNavigateToImport={productImport.handleNavigateToImport}
        onDownloadCsv={handleDownloadCsv}
      />
    );
  }

  // Full pipeline mode: step-by-step execution
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <PipelineInput
            prompt={prompt}
            setPrompt={setPrompt}
            files={pipelineFiles.files}
            handleFileChange={pipelineFiles.handleFileChange}
            removeFile={pipelineFiles.removeFile}
            canRun={pipelineExecution.canRun}
            loadingStep={pipelineExecution.loadingStep}
            currentStep={pipelineExecution.currentStep}
            hasSavedCode={hasSavedCode}
            onStartFromNode1={() => pipelineExecution.runStep(1)}
            onRunWithSavedCode={pipelineExecution.runWithSavedCode}
            onRunThisStep={pipelineExecution.handleRunThisStep}
          />
        </div>

        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-12rem)] flex flex-col flow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{STEP_TITLES[pipelineExecution.currentStep]}</span>
                <PipelineStepIndicator
                  steps={[1, 2, 3, 4]}
                  stepStatus={pipelineExecution.stepStatus}
                  onStepClick={pipelineExecution.handleStepClick}
                />
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect each node&apos;s output, then click Next to advance the pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto mb-3 border rounded-md p-3 bg-background">
                <PipelineNodeViewer
                  currentStep={pipelineExecution.currentStep}
                  pipelineResult={pipelineExecution.pipelineResult}
                  isAdmin={isAdmin}
                  editedCode={editedCode}
                  setEditedCode={setEditedCode}
                  isNavigatingToImport={productImport.isNavigatingToImport}
                  onNavigateToImport={productImport.handleNavigateToImport}
                  onDownloadProductJson={productImport.downloadProductImportJson}
                />
              </div>
              <PipelineNavigation
                currentStep={pipelineExecution.currentStep}
                setCurrentStep={pipelineExecution.setCurrentStep}
                canGoNext={pipelineExecution.canGoNext}
                loadingStep={pipelineExecution.loadingStep}
                onNext={pipelineExecution.handleNext}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface PipelineNavigationProps {
  currentStep: StepIndex;
  setCurrentStep: (step: StepIndex) => void;
  canGoNext: boolean;
  loadingStep: StepIndex | null;
  onNext: () => void;
}

function PipelineNavigation({
  currentStep,
  setCurrentStep,
  canGoNext,
  loadingStep,
  onNext,
}: PipelineNavigationProps) {
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as StepIndex);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">Node {currentStep} of 4</div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentStep === 1 || loadingStep !== null}
          onClick={handlePrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canGoNext || loadingStep !== null}
          onClick={onNext}
        >
          {loadingStep === ((currentStep + 1) as StepIndex) ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Node {currentStep + 1}...
            </>
          ) : (
            <>
              Next Node
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

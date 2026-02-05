'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { useWorkflowTenant } from '@/lib/flow-ai/workflow-tenant-context';
import {
  CreateWorkflowInput,
  CreateNodeViewer,
  PipelineNavigation,
  VisibilityDialog,
  useCreateWorkflow,
} from '@/components/flow-ai/workflows/create';

type StepIndex = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<StepIndex, string> = {
  1: 'Files & Tabs (Node 1)',
  2: 'Workflow Plan (Node 2)',
  3: 'Generated Code (Node 3)',
  4: 'Execution Result (Node 4)',
};

export default function CreateWorkflowPage() {
  const { isAdmin } = useWorkflowTenant();

  const {
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
  } = useCreateWorkflow();

  return (
    <div className="h-screen overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" asChild>
            <Link href="/flow-ai/workflows">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflows
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Create Workflow - 4-Node Pipeline Runner</span>
          </div>
        </div>

        {/* Error Banner */}
        {bannerMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {bannerMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-1">
            <CreateWorkflowInput
              workflowName={workflowName}
              setWorkflowName={setWorkflowName}
              description={description}
              setDescription={setDescription}
              prompt={prompt}
              setPrompt={setPrompt}
              files={files}
              handleFileChange={handleFileChange}
              removeFile={removeFile}
              canRun={canRun}
              currentStep={currentStep}
              loadingStep={loadingStep}
              isPolling={isPolling}
              canSave={canSave}
              onStartFromNode1={() => runStep(1)}
              onRunThisStep={handleRunThisStep}
              onSaveWorkflow={handleSaveWorkflow}
            />
          </div>

          {/* Right Panel - Node Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)] flex flex-col flow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{STEP_TITLES[currentStep]}</span>
                  <StepIndicator
                    steps={[1, 2, 3, 4] as StepIndex[]}
                    stepStatus={stepStatus}
                    onStepClick={handleStepClick}
                  />
                </CardTitle>
                <CardDescription className="text-xs">
                  Inspect each node&apos;s output, then click Next to advance the pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto mb-3 border rounded-md p-3 bg-background">
                  <CreateNodeViewer
                    currentStep={currentStep}
                    pipelineResult={pipelineResult}
                    isAdmin={isAdmin}
                    isPolling={isPolling}
                    editedCode={editedCode}
                    setEditedCode={setEditedCode}
                  />
                </div>
                <PipelineNavigation
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  canGoNext={canGoNext}
                  loadingStep={loadingStep}
                  isPolling={isPolling}
                  onNext={handleNext}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Visibility Dialog */}
      <VisibilityDialog
        open={showVisibilityDialog}
        onOpenChange={setShowVisibilityDialog}
        saving={savingVisibility}
        onSave={confirmSaveWorkflow}
      />
    </div>
  );
}

// Step Indicator Component
interface StepIndicatorProps {
  steps: StepIndex[];
  stepStatus: (step: StepIndex) => 'loading' | 'done' | 'pending';
  onStepClick: (step: StepIndex) => void;
}

function StepIndicator({ steps, stepStatus, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex gap-2 text-xs">
      {steps.map((step) => {
        const status = stepStatus(step);
        return (
          <button
            key={step}
            type="button"
            onClick={() => onStepClick(step)}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 border text-[11px] transition-colors ${
              status === 'done'
                ? 'border-success/60 text-success bg-success/10'
                : status === 'loading'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-muted text-muted-foreground bg-background'
            }`}
          >
            {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
            <span>Node {step}</span>
          </button>
        );
      })}
    </div>
  );
}

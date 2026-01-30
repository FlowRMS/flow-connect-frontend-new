'use client';

import { Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';

type StepIndex = 1 | 2 | 3 | 4;

interface PipelineNavigationProps {
  currentStep: StepIndex;
  setCurrentStep: (step: StepIndex) => void;
  canGoNext: boolean;
  loadingStep: StepIndex | null;
  isPolling: boolean;
  onNext: () => void;
}

export function PipelineNavigation({
  currentStep,
  setCurrentStep,
  canGoNext,
  loadingStep,
  isPolling,
  onNext,
}: PipelineNavigationProps) {
  const isBusy = loadingStep !== null || isPolling;

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
          disabled={currentStep === 1 || isBusy}
          onClick={handlePrevious}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canGoNext || isBusy}
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

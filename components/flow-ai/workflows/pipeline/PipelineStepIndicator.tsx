'use client';

import { CheckCircle2 } from 'lucide-react';
import type { StepIndex } from '@/components/flow-ai/hooks';

export interface PipelineStepIndicatorProps {
  steps: StepIndex[];
  stepStatus: (step: StepIndex) => 'loading' | 'done' | 'pending';
  onStepClick: (step: StepIndex) => void;
}

export function PipelineStepIndicator({
  steps,
  stepStatus,
  onStepClick,
}: PipelineStepIndicatorProps) {
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

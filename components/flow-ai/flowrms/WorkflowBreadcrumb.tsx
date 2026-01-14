'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';

export type WorkflowStep = 'upload' | 'map-columns' | 'validate' | 'resolve' | 'complete';

interface WorkflowBreadcrumbProps {
  currentStep: WorkflowStep;
  /** If true, shows Map Columns step (for spreadsheets). If false, hides it (for PDFs) */
  showMapColumns?: boolean;
}

export function WorkflowBreadcrumb({ currentStep, showMapColumns = false }: WorkflowBreadcrumbProps) {
  const steps: { key: WorkflowStep; label: string; showAlways: boolean }[] = [
    { key: 'upload', label: 'Upload', showAlways: true },
    { key: 'map-columns', label: 'Map Columns', showAlways: false },
    { key: 'validate', label: 'Validate Entities', showAlways: true },
    { key: 'resolve', label: 'Resolve Missing', showAlways: true },
    { key: 'complete', label: 'Complete', showAlways: true },
  ];

  const visibleSteps = steps.filter(step => step.showAlways || (step.key === 'map-columns' && showMapColumns));

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {visibleSteps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          <span
            className={cn(
              currentStep === step.key && 'font-semibold text-foreground'
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}










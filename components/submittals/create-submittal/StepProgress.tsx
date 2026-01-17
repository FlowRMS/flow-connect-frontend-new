'use client';

import React from 'react';

interface StepProgressProps {
  steps: string[];
  currentStepIndex: number;
}

export function StepProgress({ steps, currentStepIndex }: StepProgressProps) {
  return (
    <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= currentStepIndex ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                i < currentStepIndex
                  ? 'bg-[var(--primary)] text-white'
                  : i === currentStepIndex
                  ? 'border-2 border-[var(--primary)] text-[var(--primary)]'
                  : 'border border-[var(--muted-foreground)] text-[var(--muted-foreground)]'
              }`}>
                {i < currentStepIndex ? (
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className="text-sm hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < currentStepIndex ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

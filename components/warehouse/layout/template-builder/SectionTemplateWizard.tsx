'use client';

import React, { useState, useMemo } from 'react';
import type { TemplateWizardProps, WizardStep, StructureConfig, NamingConfig, LevelNaming } from './types';
import { getEnabledLevelOrder, generateTemplateLocations, calculateTotalLocations } from './generateTemplateLocations';
import { levelLabels } from '../constants';
import TemplateStructureStep from './TemplateStructureStep';
import TemplateNamingStep from './TemplateNamingStep';
import TemplatePreviewStep from './TemplatePreviewStep';

const STEPS: WizardStep[] = ['structure', 'naming', 'preview'];

const stepTitles: Record<WizardStep, string> = {
  structure: 'Template Structure',
  naming: 'Naming Convention',
  preview: 'Preview & Create',
};

export default function SectionTemplateWizard({
  isOpen,
  onClose,
  onComplete,
  enabledLevels,
}: TemplateWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('structure');
  const orderedLevels = getEnabledLevelOrder(enabledLevels);

  // Structure config state
  const [structureConfig, setStructureConfig] = useState<StructureConfig>(() => {
    const counts: StructureConfig['counts'] = {};
    orderedLevels.forEach((level, idx) => {
      counts[level] = idx === 0 ? 1 : 0;
    });
    return { counts };
  });

  // Naming config state
  const [namingConfig, setNamingConfig] = useState<NamingConfig>(() => {
    const levels: NamingConfig['levels'] = {};
    orderedLevels.forEach((level) => {
      const label = levelLabels[level] || level;
      levels[level] = {
        prefix: `${label}-`,
        type: 'numbers',
        continueAfterMax: false,
      } as LevelNaming;
    });
    return { levels, includeParentName: false };
  });

  // Generate preview locations
  const previewLocations = useMemo(() => {
    return generateTemplateLocations(structureConfig, namingConfig, enabledLevels);
  }, [structureConfig, namingConfig, enabledLevels]);

  const { total } = calculateTotalLocations(structureConfig, enabledLevels);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleCreate = () => {
    onComplete(previewLocations);
    onClose();
  };

  const canProceed = () => {
    if (currentStep === 'structure') {
      // At least the root level must have count > 0
      return orderedLevels.length > 0 && (structureConfig.counts[orderedLevels[0]] || 0) > 0;
    }
    return true;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-[var(--card)] w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">Section Template Builder</h2>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{stepTitles[currentStep]}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Step indicator */}
              <div className="flex items-center gap-1">
                {STEPS.map((step, idx) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx <= currentStepIndex ? 'bg-blue-500' : 'bg-[var(--muted)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[var(--muted-foreground)] ml-1">
                {currentStepIndex + 1}/{STEPS.length}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {currentStep === 'structure' && (
            <TemplateStructureStep
              enabledLevels={enabledLevels}
              config={structureConfig}
              onChange={setStructureConfig}
            />
          )}
          {currentStep === 'naming' && (
            <TemplateNamingStep
              enabledLevels={enabledLevels}
              config={namingConfig}
              onChange={setNamingConfig}
            />
          )}
          {currentStep === 'preview' && (
            <TemplatePreviewStep
              locations={previewLocations}
              enabledLevels={enabledLevels}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={currentStepIndex === 0 ? onClose : handleBack}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {currentStepIndex === 0 ? 'Cancel' : '← Back'}
          </button>

          {currentStep === 'preview' ? (
            <button
              onClick={handleCreate}
              disabled={total === 0}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create {total} Items
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

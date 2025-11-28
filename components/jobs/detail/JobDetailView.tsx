/**
 * Job Detail View Component
 */

import React from 'react';
import { JobDetailHeader } from './JobDetailHeader';
import { JobDetailsForm } from './JobDetailsForm';
import { ConnectedEntitiesSection } from './ConnectedEntitiesSection';
import { RepTypeModal } from '../modals/RepTypeModal';
import type { Job, RepType, ConnectedEntities } from '../types';
import { DEFAULT_VISIBLE_CATEGORIES } from '../constants';

interface JobDetailViewProps {
  job: Job;
  isEditing: boolean;
  isSaving: boolean;
  editFormData: Partial<Job>;
  repType: RepType;
  showRepTypeModal: boolean;
  visibleCategories: string[];
  connectedEntities: ConnectedEntities;
  onBack: () => void;
  onEditChange: (field: keyof Job, value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRepTypeChange: (type: RepType) => void;
  onToggleRepTypeModal: (show: boolean) => void;
  onToggleCategory: (category: string) => void;
  onToggleAllCategories: () => void;
  onCompanyClick?: (company: any) => void;
}

export function JobDetailView({
  job,
  isEditing,
  isSaving,
  editFormData,
  repType,
  showRepTypeModal,
  visibleCategories,
  connectedEntities,
  onBack,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRepTypeChange,
  onToggleRepTypeModal,
  onToggleCategory,
  onToggleAllCategories,
  onCompanyClick,
}: JobDetailViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <JobDetailHeader
        job={job}
        repType={repType}
        isEditing={isEditing}
        isSaving={isSaving}
        onBack={onBack}
        onRepTypeClick={() => onToggleRepTypeModal(true)}
        onEditClick={onStartEdit}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />

      <JobDetailsForm
        job={job}
        isEditing={isEditing}
        editFormData={editFormData}
        onChange={onEditChange}
      />

      <ConnectedEntitiesSection
        entities={connectedEntities}
        visibleCategories={visibleCategories}
        repType={repType}
        onToggleCategory={onToggleCategory}
        onToggleAll={onToggleAllCategories}
        onCompanyClick={onCompanyClick}
      />

      <RepTypeModal
        isOpen={showRepTypeModal}
        currentType={repType}
        onClose={() => onToggleRepTypeModal(false)}
        onSelect={(type: RepType) => {
          onRepTypeChange(type);
          onToggleRepTypeModal(false);
        }}
      />
    </main>
  );
}

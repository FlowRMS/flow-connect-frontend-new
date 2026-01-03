/**
 * Job Detail View Component
 */

import React, { useState } from 'react';
import { JobDetailHeader } from './JobDetailHeader';
import { JobDetailsForm } from './JobDetailsForm';
import { ConnectedEntitiesSection } from '../../shared/ConnectedEntitiesSection';
import { RepTypeModal } from '../modals/RepTypeModal';
import { DeleteJobConfirmModal } from '../modals/DeleteJobConfirmModal';
import type { Job, RepType } from '../types';
import type { RelatedEntityCompany, RelatedEntityContact } from '../../lib/crm-graphql';

interface JobDetailViewProps {
  job: Job;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting?: boolean;
  editFormData: Partial<Job>;
  repType: RepType;
  showRepTypeModal: boolean;
  onBack: () => void;
  onEditChange: (field: keyof Job, value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete?: () => void;
  onRepTypeChange: (type: RepType) => void;
  onToggleRepTypeModal: (show: boolean) => void;
  onCompanyClick?: (company: RelatedEntityCompany) => void;
  onContactClick?: (contact: RelatedEntityContact) => void;
}

export function JobDetailView({
  job,
  isEditing,
  isSaving,
  isDeleting = false,
  editFormData,
  repType,
  showRepTypeModal,
  onBack,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onRepTypeChange,
  onToggleRepTypeModal,
  onCompanyClick,
  onContactClick,
}: JobDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

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
        onDelete={onDelete ? handleDeleteClick : undefined}
      />

      <JobDetailsForm
        job={job}
        isEditing={isEditing}
        editFormData={editFormData}
        onChange={onEditChange}
      />

      <ConnectedEntitiesSection
        entityId={job.id}
        sourceEntityType="JOB"
        onCompanyClick={onCompanyClick}
        onContactClick={onContactClick}
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

      {showDeleteConfirm && (
        <DeleteJobConfirmModal
          jobName={job.name}
          isDeleting={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </main>
  );
}

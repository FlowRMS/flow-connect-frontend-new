/**
 * Job Detail View Component
 */

import React from 'react';
import { JobDetailHeader } from './JobDetailHeader';
import { JobDetailsForm } from './JobDetailsForm';
import { ConnectedEntitiesSection } from './ConnectedEntitiesSection';
import { RepTypeModal } from '../modals/RepTypeModal';
import type { Job, RepType } from '../types';
import type { Company, Contact } from '../../lib/crm-graphql';

interface JobDetailViewProps {
  job: Job;
  isEditing: boolean;
  isSaving: boolean;
  editFormData: Partial<Job>;
  repType: RepType;
  showRepTypeModal: boolean;
  onBack: () => void;
  onEditChange: (field: keyof Job, value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRepTypeChange: (type: RepType) => void;
  onToggleRepTypeModal: (show: boolean) => void;
  onCompanyClick?: (company: Company) => void;
  onContactClick?: (contact: Contact) => void;
}

export function JobDetailView({
  job,
  isEditing,
  isSaving,
  editFormData,
  repType,
  showRepTypeModal,
  onBack,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRepTypeChange,
  onToggleRepTypeModal,
  onCompanyClick,
  onContactClick,
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
        jobId={job.id}
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
    </main>
  );
}

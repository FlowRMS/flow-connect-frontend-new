/**
 * Company Detail View Component
 */

import React from 'react';
import type { Company } from '../types';
import type { CompanySourceType, Contact as APIContact, Job as APIJob } from '../../lib/crm-graphql';
import CompanyDetailHeader from './CompanyDetailHeader';
import CompanyInfoForm from './CompanyInfoForm';
import CompanyRelatedEntities from './CompanyRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';

interface CompanyDetailViewProps {
  company: Company;
  isEditing: boolean;
  editFormData: Partial<Company>;
  deleteConfirmId: string | null;
  updatePending: boolean;
  deletePending: boolean;
  onBack: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onFieldChange: (field: string, value: string | CompanySourceType) => void;
  onContactClick?: (contact: APIContact) => void;
  onJobClick?: (job: APIJob) => void;
}

export default function CompanyDetailView({
  company,
  isEditing,
  editFormData,
  deleteConfirmId,
  updatePending,
  deletePending,
  onBack,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onFieldChange,
  onContactClick,
  onJobClick,
}: CompanyDetailViewProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      <CompanyDetailHeader
        company={company}
        isEditing={isEditing}
        isPending={updatePending}
        onBack={onBack}
        onDelete={onDeleteClick}
        onEdit={onStartEdit}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />

      <CompanyInfoForm
        company={company}
        isEditing={isEditing}
        editFormData={editFormData}
        onFieldChange={onFieldChange}
      />

      <CompanyRelatedEntities 
        company={company}
        onContactClick={onContactClick}
        onJobClick={onJobClick}
      />

      {/* Connected Tasks */}
      <ConnectedTasksSection
        entityId={company.id}
        entityType="COMPANY"
        title="Connected Tasks"
      />

      {/* Connected Notes */}
      <ConnectedNotesSection
        entityId={company.id}
        entityType="COMPANY"
        title="Connected Notes"
      />

      {deleteConfirmId && (
        <DeleteConfirmModal
          companyName={company.name}
          isPending={deletePending}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
        />
      )}
    </main>
  );
}

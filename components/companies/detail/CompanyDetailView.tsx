/**
 * Company Detail View Component
 */

import React, { useState } from 'react';
import type { Company } from '../types';
import type { CompanySourceType, Contact as APIContact, Job as APIJob } from '../../lib/crm-graphql';
import CompanyDetailHeader from './CompanyDetailHeader';
import CompanyInfoForm from './CompanyInfoForm';
import CompanyRelatedEntities from './CompanyRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import { AddTaskNoteLinkModal } from '../modals/AddTaskNoteLinkModal';

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
  // Modal states for linking tasks/notes
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [addLinkEntityType, setAddLinkEntityType] = useState<'TASK' | 'NOTE'>('TASK');
  const [tasksSectionKey, setTasksSectionKey] = useState(0);
  const [notesSectionKey, setNotesSectionKey] = useState(0);

  // Handle link success - trigger refetch via key change
  const handleLinkSuccess = () => {
    if (addLinkEntityType === 'TASK') {
      setTasksSectionKey(prev => prev + 1);
    } else {
      setNotesSectionKey(prev => prev + 1);
    }
  };

  // Open add link modal for specific entity type
  const openAddLinkModal = (entityType: 'TASK' | 'NOTE') => {
    setAddLinkEntityType(entityType);
    setShowAddLinkModal(true);
  };

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
        key={`tasks-${tasksSectionKey}`}
        entityId={company.id}
        entityType="COMPANY"
        title="Connected Tasks"
        onAddClick={() => { openAddLinkModal('TASK'); }}
        onUnlinkSuccess={() => setTasksSectionKey(prev => prev + 1)}
      />

      {/* Connected Notes */}
      <ConnectedNotesSection
        key={`notes-${notesSectionKey}`}
        entityId={company.id}
        entityType="COMPANY"
        title="Connected Notes"
        onAddClick={() => { openAddLinkModal('NOTE'); }}
        onUnlinkSuccess={() => setNotesSectionKey(prev => prev + 1)}
      />

      {/* Add Link Modal for Tasks/Notes */}
      <AddTaskNoteLinkModal
        isOpen={showAddLinkModal}
        entityId={company.id}
        entityType="COMPANY"
        initialLinkType={addLinkEntityType}
        onClose={() => { setShowAddLinkModal(false); }}
        onSuccess={handleLinkSuccess}
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

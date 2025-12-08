/**
 * Contact Detail View Component
 */

import React, { useState } from 'react';
import ContactDetailHeader from './ContactDetailHeader';
import ContactInfoForm from './ContactInfoForm';
import ContactRelatedEntities from './ContactRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
import { AddTaskNoteLinkModal } from '../modals/AddTaskNoteLinkModal';
import type { Contact } from '../types';
import type { Job as APIJob, Company as APICompany } from '../../lib/crm-graphql';

interface ContactDetailViewProps {
  contact: Contact;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  editFormData: Partial<Contact>;
  deleteConfirmId: string | null;
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onFieldChange: (field: string, value: string) => void;
  setDeleteConfirmId: (id: string | null) => void;
  onJobClick?: (job: APIJob) => void;
  onCompanyClick?: (company: APICompany) => void;
}

export default function ContactDetailView({
  contact,
  isEditing,
  isSaving,
  isDeleting,
  editFormData,
  deleteConfirmId,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onFieldChange,
  setDeleteConfirmId,
  onJobClick,
  onCompanyClick,
}: ContactDetailViewProps) {
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
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-3 sm:p-6">
      <ContactDetailHeader
        contact={contact}
        isEditing={isEditing}
        isSaving={isSaving}
        onBack={onBack}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={() => setDeleteConfirmId(contact.id)}
      />

      <ContactInfoForm
        contact={contact}
        isEditing={isEditing}
        editFormData={editFormData}
        onFieldChange={onFieldChange}
      />

      {/* Related Entities (Company & Jobs) */}
      <ContactRelatedEntities
        contact={contact}
        onJobClick={onJobClick}
        onCompanyClick={onCompanyClick}
      />

      {/* Connected Tasks */}
      <ConnectedTasksSection
        key={`tasks-${tasksSectionKey}`}
        entityId={contact.id}
        entityType="CONTACT"
        title="Connected Tasks"
        onAddClick={() => { openAddLinkModal('TASK'); }}
        onUnlinkSuccess={() => setTasksSectionKey(prev => prev + 1)}
      />

      {/* Connected Notes */}
      <ConnectedNotesSection
        key={`notes-${notesSectionKey}`}
        entityId={contact.id}
        entityType="CONTACT"
        title="Connected Notes"
        onAddClick={() => { openAddLinkModal('NOTE'); }}
        onUnlinkSuccess={() => setNotesSectionKey(prev => prev + 1)}
      />

      {/* Add Link Modal for Tasks/Notes */}
      <AddTaskNoteLinkModal
        isOpen={showAddLinkModal}
        entityId={contact.id}
        entityType="CONTACT"
        initialLinkType={addLinkEntityType}
        onClose={() => setShowAddLinkModal(false)}
        onSuccess={handleLinkSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          contactName={contact.name}
          isDeleting={isDeleting}
          onConfirm={() => onDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </main>
  );
}

/**
 * Contact Detail View Component
 */

import React from 'react';
import ContactDetailHeader from './ContactDetailHeader';
import ContactInfoForm from './ContactInfoForm';
import ContactRelatedEntities from './ContactRelatedEntities';
import ConnectedNotesSection from '../../notes/ConnectedNotesSection';
import ConnectedTasksSection from '../../tasks/ConnectedTasksSection';
import DeleteConfirmModal from './DeleteConfirmModal';
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
  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
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
        entityId={contact.id}
        entityType="CONTACT"
        title="Connected Tasks"
      />

      {/* Connected Notes */}
      <ConnectedNotesSection
        entityId={contact.id}
        entityType="CONTACT"
        title="Connected Notes"
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

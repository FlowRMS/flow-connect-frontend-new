/**
 * Contact Detail View Component
 */

import React from 'react';
import ContactDetailHeader from './ContactDetailHeader';
import ContactInfoForm from './ContactInfoForm';
import DeleteConfirmModal from './DeleteConfirmModal';
import type { Contact } from '../types';

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

      {/* Activity Timeline - Placeholder */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] mb-6">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Activity Timeline</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Activity timeline feature coming soon
          </div>
        </div>
      </div>

      {/* Related Jobs - Placeholder */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)]">
        <div className="px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Related Jobs</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-[var(--muted-foreground)]">
            Jobs connected to this contact will appear here
          </div>
        </div>
      </div>

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

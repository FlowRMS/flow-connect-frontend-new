/**
 * Contact Information Form Component
 */

import React from 'react';
import { CONTACT_ROLES } from '../constants';
import type { Contact } from '../types';

interface ContactInfoFormProps {
  contact: Contact;
  isEditing: boolean;
  editFormData: Partial<Contact>;
  onFieldChange: (field: string, value: string) => void;
}

export default function ContactInfoForm({
  contact,
  isEditing,
  editFormData,
  onFieldChange,
}: ContactInfoFormProps) {
  return (
    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Contact Information</h2>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">First Name</label>
          <input
            type="text"
            value={isEditing ? editFormData.firstName || '' : contact.firstName}
            onChange={(e) => onFieldChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Last Name</label>
          <input
            type="text"
            value={isEditing ? editFormData.lastName || '' : contact.lastName}
            onChange={(e) => onFieldChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Role</label>
          {isEditing ? (
            <select
              value={editFormData.role || contact.role}
              onChange={(e) => onFieldChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            >
              <option value="">Select Role</option>
              {CONTACT_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={contact.role}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              readOnly
            />
          )}
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Email</label>
          <input
            type="email"
            value={isEditing ? editFormData.email || '' : (contact.email || '-')}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Phone</label>
          <input
            type="tel"
            value={isEditing ? editFormData.phone || '' : (contact.phone || '-')}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly={!isEditing}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--muted-foreground)] mb-1 block">Company</label>
          <input
            type="text"
            value={contact.company || '-'}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            readOnly
          />
        </div>
        <div className="col-span-3">
          <label className="text-sm text-[var(--muted-foreground)] mb-2 block">Tags</label>
          <div className="flex gap-2 flex-wrap">
            {contact.tags.length > 0 ? (
              contact.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full text-sm">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--muted-foreground)]">No tags</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

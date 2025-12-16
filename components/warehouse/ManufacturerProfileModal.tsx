'use client';

import React, { useState, useEffect } from 'react';
import {
  ManufacturerProfile,
  VendorCustomerXRef,
  FreightCategory,
  ManufacturerContact,
} from '@/lib/types/warehouse';

interface ManufacturerProfileModalProps {
  profile: ManufacturerProfile;
  onClose: () => void;
  onSave: (profile: ManufacturerProfile) => void;
}

type TabId = 'vendor' | 'customer-xref' | 'shipto-xref' | 'freight';

export default function ManufacturerProfileModal({
  profile,
  onClose,
  onSave,
}: ManufacturerProfileModalProps) {
  const [editedProfile, setEditedProfile] = useState<ManufacturerProfile>({ ...profile });
  const [activeTab, setActiveTab] = useState<TabId>('vendor');
  const [selectedXRef, setSelectedXRef] = useState<VendorCustomerXRef | null>(null);
  const [showAddXRefForm, setShowAddXRefForm] = useState(false);
  const [showAddFreightForm, setShowAddFreightForm] = useState(false);

  const handleFieldChange = (field: keyof ManufacturerProfile, value: any) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'vendor' as TabId, label: 'Vendor Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'customer-xref' as TabId, label: 'Customer X-Ref', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'shipto-xref' as TabId, label: 'Ship-To X-Ref', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'freight' as TabId, label: 'Freight Categories', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-[var(--card)] rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{editedProfile.vendorName}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">Manufacturer Profile Settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Suspended Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">Suspended?</span>
                <button
                  onClick={() => handleFieldChange('isSuspended', !editedProfile.isSuspended)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editedProfile.isSuspended ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editedProfile.isSuspended ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'vendor' && (
              <VendorSettingsTab
                profile={editedProfile}
                onChange={handleFieldChange}
              />
            )}

            {activeTab === 'customer-xref' && (
              <CustomerXRefTab
                profile={editedProfile}
                onChange={handleFieldChange}
              />
            )}

            {activeTab === 'shipto-xref' && (
              <ShipToXRefTab
                profile={editedProfile}
                onChange={handleFieldChange}
              />
            )}

            {activeTab === 'freight' && (
              <FreightCategoryTab
                profile={editedProfile}
                showAddForm={showAddFreightForm}
                setShowAddForm={setShowAddFreightForm}
                onChange={handleFieldChange}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(editedProfile)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Warehouse Contact type for storing contact with warehouse-specific role
interface WarehouseContact {
  contactId: string;
  name: string;
  email: string;
  phone: string;
  warehouseRole: string;
  isDefault?: boolean;
}

// Vendor Settings Tab Component
function VendorSettingsTab({
  profile,
  onChange,
}: {
  profile: ManufacturerProfile;
  onChange: (field: keyof ManufacturerProfile, value: any) => void;
}) {
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');

  // Predefined warehouse roles
  const predefinedRoles = [
    'Primary Contact',
    'Receiving Coordinator',
    'Shipping Manager',
    'Inventory Specialist',
    'Order Processing',
    'Returns Handler',
    'Quality Control',
    'Logistics Coordinator',
  ];

  // Mock available contacts for the manufacturer
  const availableContacts = [
    { id: 'c1', name: 'John Smith', email: 'john.smith@company.com', phone: '555-0101', role: 'Sales Manager' },
    { id: 'c2', name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '555-0102', role: 'Account Executive' },
    { id: 'c3', name: 'Mike Williams', email: 'mike.w@company.com', phone: '555-0103', role: 'Operations' },
    { id: 'c4', name: 'Emily Brown', email: 'emily.b@company.com', phone: '555-0104', role: 'Logistics Coordinator' },
    { id: 'c5', name: 'David Lee', email: 'david.lee@company.com', phone: '555-0105', role: 'Warehouse Manager' },
  ];

  // Get warehouse contacts from profile
  const warehouseContacts: WarehouseContact[] = profile.warehouseContacts || [];

  // Filter out already added contacts and apply search
  const filteredContacts = availableContacts.filter(
    (c) =>
      !warehouseContacts.some((wc) => wc.contactId === c.id) &&
      (c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  // Filter roles based on search
  const filteredRoles = predefinedRoles.filter((role) =>
    role.toLowerCase().includes(roleSearch.toLowerCase())
  );

  const handleAddContact = (contact: typeof availableContacts[0]) => {
    const newContact: WarehouseContact = {
      contactId: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      warehouseRole: '',
      isDefault: warehouseContacts.length === 0, // First contact is default
    };
    onChange('warehouseContacts', [...warehouseContacts, newContact]);
    setContactSearch('');
    setShowContactDropdown(false);
    // Open role dropdown immediately
    setShowRoleDropdown(contact.id);
    setRoleSearch('');
  };

  const handleRemoveContact = (contactId: string) => {
    const updated = warehouseContacts.filter((c) => c.contactId !== contactId);
    // If we removed the default, make the first remaining contact default
    if (updated.length > 0 && !updated.some((c) => c.isDefault)) {
      updated[0].isDefault = true;
    }
    onChange('warehouseContacts', updated);
  };

  const handleUpdateRole = (contactId: string, newRole: string) => {
    onChange(
      'warehouseContacts',
      warehouseContacts.map((c) =>
        c.contactId === contactId ? { ...c, warehouseRole: newRole } : c
      )
    );
    setShowRoleDropdown(null);
    setRoleSearch('');
  };

  const handleSetDefault = (contactId: string) => {
    onChange(
      'warehouseContacts',
      warehouseContacts.map((c) => ({
        ...c,
        isDefault: c.contactId === contactId,
      }))
    );
  };

  const handleAddNewContact = () => {
    // Open new contact page in new tab with warehouse contact flag
    window.open('/contacts/new?isWarehouseContact=true', '_blank');
  };

  const handleSaveRole = () => {
    if (editingContactId) {
      handleUpdateRole(editingContactId, editingRole);
      setEditingContactId(null);
      setEditingRole('');
    }
  };

  const handleStartEditRole = (contact: WarehouseContact) => {
    setEditingContactId(contact.contactId);
    setEditingRole(contact.warehouseRole);
  };

  return (
    <div className="space-y-6">
      {/* Main Form Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Row 1 */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={profile.vendorName}
            onChange={(e) => onChange('vendorName', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Order Prefix</label>
          <input
            type="text"
            value={profile.orderPrefix || ''}
            onChange={(e) => onChange('orderPrefix', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Select Default Shipper</label>
          <select
            value={profile.selectDefaultShipper || ''}
            onChange={(e) => onChange('selectDefaultShipper', e.target.value)}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">--Select--</option>
            <option value="CJI Robinson">CJI Robinson</option>
            <option value="UPS">UPS</option>
            <option value="FedEx">FedEx</option>
            <option value="Old Dominion">Old Dominion</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Freight Terms</label>
          <input
            type="text"
            value={profile.freightTerms || ''}
            onChange={(e) => onChange('freightTerms', e.target.value)}
            placeholder="Enter freight terms..."
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Toggle Settings */}
      <div className="flex flex-wrap gap-6 pt-4 border-t border-[var(--border)]">
        {/* Order Allowed Without Customer X Ref Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange('orderAllowedWithoutCustomerXRef', !profile.orderAllowedWithoutCustomerXRef)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              profile.orderAllowedWithoutCustomerXRef ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                profile.orderAllowedWithoutCustomerXRef ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-[var(--foreground)]">Order Allowed Without Customer X Ref</span>
        </div>

        {/* Order Allowed Without Ship-To X Ref Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange('orderAllowedWithoutShipToXRef', !profile.orderAllowedWithoutShipToXRef)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              profile.orderAllowedWithoutShipToXRef ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                profile.orderAllowedWithoutShipToXRef ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-[var(--foreground)]">Order Allowed Without Ship-To X Ref</span>
        </div>
      </div>

      {/* Contacts Section */}
      <div className="pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Default Warehouse Contacts</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--muted-foreground)]">
              {warehouseContacts.length} contact{warehouseContacts.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleAddNewContact}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Contact
            </button>
          </div>
        </div>

        {/* Add Contact Dropdown */}
        <div className="relative mb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value);
                setShowContactDropdown(true);
              }}
              onFocus={() => setShowContactDropdown(true)}
              placeholder="Search contacts to add..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {showContactDropdown && contactSearch && (
            <>
              <div className="fixed inset-0 z-[5]" onClick={() => setShowContactDropdown(false)} />
              <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleAddContact(contact)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0"
                    >
                      <div className="text-sm font-medium text-[var(--foreground)]">{contact.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{contact.email} · {contact.phone}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No contacts found</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Added Contacts List */}
        {warehouseContacts.length > 0 ? (
          <div className="space-y-2">
            {warehouseContacts.map((contact) => (
              <div
                key={contact.contactId}
                className={`flex items-center gap-3 p-3 rounded-lg border bg-[var(--background)] ${
                  contact.isDefault ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-[var(--border)]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0 relative">
                  <span className="text-sm font-medium text-[var(--muted-foreground)]">
                    {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                  {contact.isDefault && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{contact.name}</span>
                    {contact.isDefault && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Default
                      </span>
                    )}
                    <a
                      href={`/contacts/${contact.contactId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      See contact record
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--muted-foreground)]">
                    <span>{contact.email}</span>
                    <span>{contact.phone}</span>
                  </div>
                </div>

                {/* Warehouse Role - Searchable Dropdown */}
                <div className="relative">
                  {showRoleDropdown === contact.contactId ? (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => { setShowRoleDropdown(null); setRoleSearch(''); }} />
                      <div className="relative z-[70]">
                        <input
                          type="text"
                          value={roleSearch}
                          onChange={(e) => setRoleSearch(e.target.value)}
                          placeholder="Search or type role..."
                          className="w-48 px-3 py-1.5 text-sm border border-blue-500 rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && roleSearch) {
                              handleUpdateRole(contact.contactId, roleSearch);
                            }
                            if (e.key === 'Escape') {
                              setShowRoleDropdown(null);
                              setRoleSearch('');
                            }
                          }}
                        />
                        <div className="fixed mt-1 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl max-h-60 overflow-y-auto z-[80]">
                          {roleSearch && !predefinedRoles.some(r => r.toLowerCase() === roleSearch.toLowerCase()) && (
                            <button
                              onClick={() => handleUpdateRole(contact.contactId, roleSearch)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] text-blue-600"
                            >
                              Add "{roleSearch}"
                            </button>
                          )}
                          {(roleSearch ? filteredRoles : predefinedRoles).map((role) => (
                            <button
                              key={role}
                              onClick={() => handleUpdateRole(contact.contactId, role)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => { setShowRoleDropdown(contact.contactId); setRoleSearch(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors"
                    >
                      {contact.warehouseRole ? (
                        <span className="text-[var(--foreground)]">{contact.warehouseRole}</span>
                      ) : (
                        <span className="text-[var(--muted-foreground)]">Select role...</span>
                      )}
                      <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Set as Default Button */}
                {!contact.isDefault && (
                  <button
                    onClick={() => handleSetDefault(contact.contactId)}
                    className="text-xs text-[var(--muted-foreground)] hover:text-blue-600 hover:underline flex-shrink-0"
                  >
                    Set as default
                  </button>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveContact(contact.contactId)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
            <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">No warehouse contacts added</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Search for contacts above to add them</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Customer X-Ref Tab Component
function CustomerXRefTab({
  profile,
  onChange,
}: {
  profile: ManufacturerProfile;
  onChange: (field: keyof ManufacturerProfile, value: any) => void;
}) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    vendorCustomerNumber: '',
  });

  // Mock customers for dropdown
  const mockCustomers = [
    { id: 'CUST-001', name: 'CED (All Phases) College Park', address: '3375 Highway 85, College Park, GA 30349' },
    { id: 'CUST-002', name: 'CED (Athens) Brandon', address: '123 Main St, Brandon, MS 39042' },
    { id: 'CUST-003', name: 'CED (Athens) Irmo', address: '456 Oak Ave, Irmo, SC 29063' },
    { id: 'CUST-004', name: 'CED (Athens) Pensacola', address: '789 Beach Blvd, Pensacola, FL 32501' },
    { id: 'CUST-005', name: 'CED (Carol Springs) Florida', address: '321 Spring Rd, Carol Springs, FL 33065' },
    { id: 'CUST-006', name: 'CED (Drop Ship) North Georgia', address: '654 Mountain Rd, Dalton, GA 30720' },
    { id: 'CUST-007', name: 'CED (Drop Ship) South Georgia', address: '987 Peach St, Albany, GA 31701' },
    { id: 'CUST-008', name: 'CED (ABM Electric) Cumming', address: '147 Electric Way, Cumming, GA 30040' },
  ];

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.address.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleSelectCustomer = (customer: typeof mockCustomers[0]) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: customer.name,
    });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const handleAddXRef = () => {
    if (!formData.customerId || !formData.vendorCustomerNumber) return;

    const newXRef: VendorCustomerXRef = {
      id: `xref-${Date.now()}`,
      manufacturerProfileId: profile.id,
      customerId: formData.customerId,
      customerName: formData.customerName,
      vendorCustomerNumber: formData.vendorCustomerNumber,
      alwaysFactoryBO: false,
      creditHold: false,
    };

    const updatedXRefs = [...(profile.customerXRefs || []), newXRef];
    onChange('customerXRefs', updatedXRefs);
    setFormData({ customerId: '', customerName: '', vendorCustomerNumber: '' });
  };

  const handleRemoveXRef = (id: string) => {
    const updatedXRefs = (profile.customerXRefs || []).filter((x) => x.id !== id);
    onChange('customerXRefs', updatedXRefs);
  };

  const canAdd = formData.customerId && formData.vendorCustomerNumber;

  return (
    <div className="space-y-6">
      {/* Add New X-Ref */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Customer Cross-Reference</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Map your customers to this manufacturer's customer codes
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Customer Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.customerName || customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setFormData({ ...formData, customerId: '', customerName: '' });
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search customers..."
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {showCustomerDropdown && (
              <>
                <div className="fixed inset-0 z-[5]" onClick={() => setShowCustomerDropdown(false)} />
                <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full px-3 py-2 text-left hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0"
                      >
                        <div className="text-sm font-medium text-[var(--foreground)]">{customer.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{customer.address}</div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No customers found</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Vendor Customer Number */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Vendor Customer # <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vendorCustomerNumber}
              onChange={(e) => setFormData({ ...formData, vendorCustomerNumber: e.target.value })}
              placeholder="e.g., MGM001"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              onClick={handleAddXRef}
              disabled={!canAdd}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                canAdd
                  ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
              }`}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Existing X-Refs List */}
      <div className="space-y-3 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Customer Cross-References</h3>
          <span className="text-xs text-[var(--muted-foreground)]">
            {profile.customerXRefs?.length || 0} mappings
          </span>
        </div>

        {profile.customerXRefs && profile.customerXRefs.length > 0 ? (
          <div className="space-y-2">
            {profile.customerXRefs.map((xref) => (
              <div
                key={xref.id}
                className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">{xref.customerName}</span>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Vendor Customer #: <span className="font-mono">{xref.vendorCustomerNumber}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveXRef(xref.id)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
            <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">No customer cross-references</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Add a customer mapping above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Ship-To X-Ref Tab Component
function ShipToXRefTab({
  profile,
  onChange,
}: {
  profile: ManufacturerProfile;
  onChange: (field: keyof ManufacturerProfile, value: any) => void;
}) {
  const [addressSearch, setAddressSearch] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [formData, setFormData] = useState({
    shipToName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    vendorShipToCode: '',
  });

  // US States
  const usStates = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'District of Columbia' },
  ];

  // Countries
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },
  ];

  // Mock address suggestions database
  const mockAddresses = [
    { id: '1', name: 'CED Atlanta Warehouse', address: '3375 Highway 85', city: 'College Park', state: 'GA', postalCode: '30349', country: 'US' },
    { id: '2', name: 'CED Athens Distribution', address: '456 Industrial Blvd', city: 'Athens', state: 'GA', postalCode: '30601', country: 'US' },
    { id: '3', name: 'CED Pensacola Hub', address: '789 Beach Blvd', city: 'Pensacola', state: 'FL', postalCode: '32501', country: 'US' },
    { id: '4', name: 'CED Birmingham Center', address: '1200 Commerce St', city: 'Birmingham', state: 'AL', postalCode: '35203', country: 'US' },
    { id: '5', name: 'CED Charlotte Facility', address: '500 Trade St', city: 'Charlotte', state: 'NC', postalCode: '28202', country: 'US' },
    { id: '6', name: 'CED Nashville Depot', address: '321 Music Row', city: 'Nashville', state: 'TN', postalCode: '37203', country: 'US' },
    { id: '7', name: 'CED Jacksonville Port', address: '888 Port Way', city: 'Jacksonville', state: 'FL', postalCode: '32202', country: 'US' },
    { id: '8', name: 'CED Tampa Bay', address: '150 Harbor Dr', city: 'Tampa', state: 'FL', postalCode: '33602', country: 'US' },
  ];

  const filteredAddresses = mockAddresses.filter(
    (a) =>
      a.name.toLowerCase().includes(addressSearch.toLowerCase()) ||
      a.address.toLowerCase().includes(addressSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(addressSearch.toLowerCase())
  );

  const handleSelectAddress = (addr: typeof mockAddresses[0]) => {
    setFormData({
      ...formData,
      shipToName: addr.name,
      addressLine1: addr.address,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    });
    setAddressSearch('');
    setShowAddressDropdown(false);
  };

  const handleAddShipToXRef = () => {
    if (!formData.shipToName || !formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode || !formData.vendorShipToCode) return;

    const fullAddress = [
      formData.addressLine1,
      formData.addressLine2,
      `${formData.city}, ${formData.state} ${formData.postalCode}`,
      formData.country !== 'US' ? formData.country : ''
    ].filter(Boolean).join(', ');

    const newXRef = {
      id: `shipto-xref-${Date.now()}`,
      shipToId: `SHIP-${Date.now()}`,
      shipToName: formData.shipToName,
      shipToAddress: fullAddress,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
      vendorShipToCode: formData.vendorShipToCode,
    };

    const updatedXRefs = [...(profile.shipToXRefs || []), newXRef];
    onChange('shipToXRefs', updatedXRefs);
    setFormData({ shipToName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'US', vendorShipToCode: '' });
  };

  const handleRemoveShipToXRef = (id: string) => {
    const updatedXRefs = (profile.shipToXRefs || []).filter((x: any) => x.id !== id);
    onChange('shipToXRefs', updatedXRefs);
  };

  const canAdd = formData.shipToName && formData.addressLine1 && formData.city && formData.state && formData.postalCode && formData.vendorShipToCode;

  return (
    <div className="space-y-6">
      {/* Add New Ship-To X-Ref */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Ship-To Cross-Reference</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Search for an address to auto-populate fields, or enter manually
          </p>
        </div>

        {/* Row 1: Address Search with Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Search Address
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={addressSearch}
              onChange={(e) => {
                setAddressSearch(e.target.value);
                setShowAddressDropdown(true);
              }}
              onFocus={() => setShowAddressDropdown(true)}
              placeholder="Start typing an address or location name..."
              className="w-full pl-10 pr-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {showAddressDropdown && addressSearch && (
            <>
              <div className="fixed inset-0 z-[5]" onClick={() => setShowAddressDropdown(false)} />
              <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredAddresses.length > 0 ? (
                  filteredAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0"
                    >
                      <div className="text-sm font-medium text-[var(--foreground)]">{addr.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {addr.address}, {addr.city}, {addr.state} {addr.postalCode}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No matching addresses found</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Row 2: Location Name and Vendor Code */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Ship-To Location Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.shipToName}
              onChange={(e) => setFormData({ ...formData, shipToName: e.target.value })}
              placeholder="e.g., Main Warehouse"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Vendor Ship-To Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.vendorShipToCode}
              onChange={(e) => setFormData({ ...formData, vendorShipToCode: e.target.value })}
              placeholder="e.g., ATL-WH-01"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 3: Address Lines */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="Street address"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="Suite, unit, building (optional)"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 4: City, State, Postal Code, Country */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select state</option>
              {usStates.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.code} - {state.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Postal Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="Postal code"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAddShipToXRef}
            disabled={!canAdd}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              canAdd
                ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            Add Ship-To
          </button>
        </div>
      </div>

      {/* Existing Ship-To X-Refs List */}
      <div className="space-y-3 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Ship-To Cross-References</h3>
          <span className="text-xs text-[var(--muted-foreground)]">
            {profile.shipToXRefs?.length || 0} mappings
          </span>
        </div>

        {profile.shipToXRefs && profile.shipToXRefs.length > 0 ? (
          <div className="space-y-2">
            {profile.shipToXRefs.map((xref: any) => (
              <div
                key={xref.id}
                className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{xref.shipToName}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">{xref.shipToAddress}</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                      Vendor Code: <span className="font-mono">{xref.vendorShipToCode}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveShipToXRef(xref.id)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
            <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">No ship-to cross-references</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Add a ship-to mapping above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Combobox Field Component - Searchable dropdown with custom value support
function ComboboxField({
  label,
  required,
  value,
  onChange,
  placeholder,
  options,
  mono,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string; sublabel?: string }[];
  mono?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(
    (opt) =>
      opt.value.toLowerCase().includes(search.toLowerCase()) ||
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.sublabel?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setSearch('');
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono ? 'font-mono' : ''}`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[5]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0 ${
                    opt.value === value ? 'bg-[var(--muted)]/30' : ''
                  }`}
                >
                  <span className={`text-sm text-[var(--foreground)] ${mono ? 'font-mono' : ''}`}>
                    {opt.label}
                  </span>
                  {opt.sublabel && (
                    <p className="text-xs text-[var(--muted-foreground)] truncate">{opt.sublabel}</p>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                No matches — using custom value
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Freight Category Tab Component
function FreightCategoryTab({
  profile,
  showAddForm,
  setShowAddForm,
  onChange,
}: {
  profile: ManufacturerProfile;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  onChange: (field: keyof ManufacturerProfile, value: any) => void;
}) {
  // Editable form fields for adding new
  const [formData, setFormData] = useState({
    nmfcCode: '',
    description: '',
    freightClass: '',
    flammable: false,
    hazmat: false,
  });

  // Editing state - holds the ID of the category being edited, or null
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    nmfcCode: '',
    description: '',
    freightClass: '',
    flammable: false,
    hazmat: false,
  });

  // NMFC Database - National Motor Freight Classification codes
  const nmfcDatabase = [
    { nmfc: '48505', description: 'Lubricants, NOI', freightClass: 65, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '48510', description: 'Lubricants, Petroleum Based', freightClass: 70, defaultFlags: { flammable: true, hazmat: false } },
    { nmfc: '48520', description: 'Lubricants, Synthetic', freightClass: 65, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '61790', description: 'Machinery, NOI', freightClass: 85, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '61800', description: 'Machinery Parts, Iron or Steel', freightClass: 70, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '100240', description: 'Chemicals, NOI', freightClass: 55, defaultFlags: { flammable: false, hazmat: true } },
    { nmfc: '100250', description: 'Chemicals, Hazardous', freightClass: 60, defaultFlags: { flammable: true, hazmat: true } },
    { nmfc: '100260', description: 'Chemicals, Cleaning Compounds', freightClass: 50, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '116030', description: 'Electrical Equipment, NOI', freightClass: 100, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '116050', description: 'Transformers, Electrical', freightClass: 92.5, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '116060', description: 'Wire, Electrical', freightClass: 65, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '150300', description: 'Paint, NOI', freightClass: 55, defaultFlags: { flammable: true, hazmat: false } },
    { nmfc: '150310', description: 'Paint, Latex Based', freightClass: 50, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '150320', description: 'Paint, Oil Based', freightClass: 55, defaultFlags: { flammable: true, hazmat: false } },
    { nmfc: '169700', description: 'Steel Products, NOI', freightClass: 65, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '169710', description: 'Steel Bars or Rods', freightClass: 60, defaultFlags: { flammable: false, hazmat: false } },
    { nmfc: '169720', description: 'Steel Pipe or Tubing', freightClass: 70, defaultFlags: { flammable: false, hazmat: false } },
  ];

  const handleAddCategory = () => {
    if (!formData.nmfcCode || !formData.freightClass) return;

    const newFreightCategory = {
      id: `fc-${Date.now()}`,
      vendorName: profile.vendorName,
      nmfcCode: formData.nmfcCode,
      freightCategory: parseFloat(formData.freightClass),
      description: formData.description,
      classRate: parseFloat(formData.freightClass),
      flammable: formData.flammable,
      hazmat: formData.hazmat,
    };

    const updatedCategories = [...(profile.freightCategories || []), newFreightCategory];
    onChange('freightCategories', updatedCategories);

    // Reset form
    setFormData({
      nmfcCode: '',
      description: '',
      freightClass: '',
      flammable: false,
      hazmat: false,
    });
  };

  const handleRemoveCategory = (id: string) => {
    const updatedCategories = (profile.freightCategories || []).filter((fc) => fc.id !== id);
    onChange('freightCategories', updatedCategories);
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const handleStartEdit = (fc: FreightCategory) => {
    setEditingId(fc.id);
    setEditData({
      nmfcCode: fc.nmfcCode || fc.freightCategory?.toString() || '',
      description: fc.description || '',
      freightClass: fc.classRate?.toString() || '',
      flammable: fc.flammable || false,
      hazmat: fc.hazmat || false,
    });
  };

  const handleSaveEdit = () => {
    if (!editingId || !editData.nmfcCode || !editData.freightClass) return;

    const updatedCategories = (profile.freightCategories || []).map((fc) =>
      fc.id === editingId
        ? {
            ...fc,
            nmfcCode: editData.nmfcCode,
            freightCategory: parseFloat(editData.freightClass),
            description: editData.description,
            classRate: parseFloat(editData.freightClass),
            flammable: editData.flammable,
            hazmat: editData.hazmat,
          }
        : fc
    );
    onChange('freightCategories', updatedCategories);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const canAdd = formData.nmfcCode && formData.freightClass;
  const canSaveEdit = editData.nmfcCode && editData.freightClass;

  return (
    <div className="space-y-6">
      {/* Add Category Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Freight Category</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Select from standard codes or enter custom values
          </p>
        </div>

        {/* Editable Fields with Searchable Dropdowns */}
        <div className="grid grid-cols-3 gap-4">
          {/* NMFC Code - Searchable Dropdown */}
          <ComboboxField
            label="NMFC Code"
            required
            value={formData.nmfcCode}
            onChange={(value) => {
              setFormData({ ...formData, nmfcCode: value });
              // Auto-fill other fields if this matches a known NMFC
              const match = nmfcDatabase.find((item) => item.nmfc === value);
              if (match) {
                setFormData({
                  nmfcCode: value,
                  description: match.description,
                  freightClass: match.freightClass.toString(),
                  flammable: match.defaultFlags.flammable,
                  hazmat: match.defaultFlags.hazmat,
                });
              }
            }}
            placeholder="e.g., 48505"
            options={nmfcDatabase.map((item) => ({
              value: item.nmfc,
              label: item.nmfc,
              sublabel: item.description,
            }))}
            mono
          />

          {/* Freight Class - Searchable Dropdown */}
          <ComboboxField
            label="Freight Class"
            required
            value={formData.freightClass}
            onChange={(value) => setFormData({ ...formData, freightClass: value })}
            placeholder="e.g., 65"
            options={[
              { value: '50', label: 'Class 50', sublabel: 'Clean freight, fits on standard pallet' },
              { value: '55', label: 'Class 55', sublabel: 'Bricks, cement, hardwood flooring' },
              { value: '60', label: 'Class 60', sublabel: 'Car accessories, car parts' },
              { value: '65', label: 'Class 65', sublabel: 'Car parts, bottled beverages' },
              { value: '70', label: 'Class 70', sublabel: 'Newspapers, wooden pencils' },
              { value: '77.5', label: 'Class 77.5', sublabel: 'Tires, bathroom fixtures' },
              { value: '85', label: 'Class 85', sublabel: 'Crated machinery, cast iron stoves' },
              { value: '92.5', label: 'Class 92.5', sublabel: 'Computers, monitors, refrigerators' },
              { value: '100', label: 'Class 100', sublabel: 'Boat covers, car covers, wine cases' },
              { value: '110', label: 'Class 110', sublabel: 'Cabinets, framed paintings' },
              { value: '125', label: 'Class 125', sublabel: 'Small household appliances' },
              { value: '150', label: 'Class 150', sublabel: 'Auto sheet metal, bookcases' },
              { value: '175', label: 'Class 175', sublabel: 'Clothing, couches' },
              { value: '200', label: 'Class 200', sublabel: 'Sheet rock, plywood' },
              { value: '250', label: 'Class 250', sublabel: 'Bamboo furniture, mattresses' },
              { value: '300', label: 'Class 300', sublabel: 'Model boats, wood cabinets' },
              { value: '400', label: 'Class 400', sublabel: 'Deer antlers' },
              { value: '500', label: 'Class 500', sublabel: 'Low density/high value items' },
            ]}
          />

          {/* Description - Regular Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Lubricants, NOI"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Handling Flags & Add Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, flammable: !formData.flammable })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  formData.flammable ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                  style={{ transform: formData.flammable ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
              <span className="text-sm text-[var(--foreground)]">Flammable</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, hazmat: !formData.hazmat })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  formData.hazmat ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                  style={{ transform: formData.hazmat ? 'translateX(18px)' : 'translateX(2px)' }}
                />
              </button>
              <span className="text-sm text-[var(--foreground)]">Hazmat</span>
            </label>
          </div>

          <button
            onClick={handleAddCategory}
            disabled={!canAdd}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canAdd
                ? 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
            }`}
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Existing Categories List */}
      <div className="space-y-3 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Assigned Freight Categories
          </h3>
          <span className="text-xs text-[var(--muted-foreground)]">
            {profile.freightCategories?.length || 0} categories
          </span>
        </div>

        {profile.freightCategories && profile.freightCategories.length > 0 ? (
          <div className="space-y-2">
            {profile.freightCategories.map((fc) => (
              <div key={fc.id}>
                {editingId === fc.id ? (
                  /* Editing Mode */
                  <div className="p-4 bg-[var(--muted)]/20 border-2 border-blue-500 rounded-lg space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <ComboboxField
                        label="NMFC Code"
                        required
                        value={editData.nmfcCode}
                        onChange={(value) => {
                          const match = nmfcDatabase.find((item) => item.nmfc === value);
                          if (match) {
                            setEditData({
                              nmfcCode: value,
                              description: match.description,
                              freightClass: match.freightClass.toString(),
                              flammable: match.defaultFlags.flammable,
                              hazmat: match.defaultFlags.hazmat,
                            });
                          } else {
                            setEditData({ ...editData, nmfcCode: value });
                          }
                        }}
                        placeholder="e.g., 48505"
                        options={nmfcDatabase.map((item) => ({
                          value: item.nmfc,
                          label: item.nmfc,
                          sublabel: item.description,
                        }))}
                        mono
                      />
                      <ComboboxField
                        label="Freight Class"
                        required
                        value={editData.freightClass}
                        onChange={(value) => setEditData({ ...editData, freightClass: value })}
                        placeholder="e.g., 65"
                        options={[
                          { value: '50', label: 'Class 50', sublabel: 'Clean freight' },
                          { value: '55', label: 'Class 55', sublabel: 'Bricks, cement' },
                          { value: '60', label: 'Class 60', sublabel: 'Car accessories' },
                          { value: '65', label: 'Class 65', sublabel: 'Car parts, beverages' },
                          { value: '70', label: 'Class 70', sublabel: 'Newspapers, pencils' },
                          { value: '77.5', label: 'Class 77.5', sublabel: 'Tires, fixtures' },
                          { value: '85', label: 'Class 85', sublabel: 'Machinery' },
                          { value: '92.5', label: 'Class 92.5', sublabel: 'Computers' },
                          { value: '100', label: 'Class 100', sublabel: 'Boat covers' },
                          { value: '110', label: 'Class 110', sublabel: 'Cabinets' },
                          { value: '125', label: 'Class 125', sublabel: 'Appliances' },
                          { value: '150', label: 'Class 150', sublabel: 'Sheet metal' },
                          { value: '175', label: 'Class 175', sublabel: 'Clothing' },
                          { value: '200', label: 'Class 200', sublabel: 'Sheet rock' },
                          { value: '250', label: 'Class 250', sublabel: 'Mattresses' },
                          { value: '300', label: 'Class 300', sublabel: 'Wood cabinets' },
                          { value: '400', label: 'Class 400', sublabel: 'Deer antlers' },
                          { value: '500', label: 'Class 500', sublabel: 'High value' },
                        ]}
                      />
                      <div>
                        <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="e.g., Lubricants, NOI"
                          className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => setEditData({ ...editData, flammable: !editData.flammable })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              editData.flammable ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                              style={{ transform: editData.flammable ? 'translateX(18px)' : 'translateX(2px)' }}
                            />
                          </button>
                          <span className="text-sm text-[var(--foreground)]">Flammable</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => setEditData({ ...editData, hazmat: !editData.hazmat })}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              editData.hazmat ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                              style={{ transform: editData.hazmat ? 'translateX(18px)' : 'translateX(2px)' }}
                            />
                          </button>
                          <span className="text-sm text-[var(--foreground)]">Hazmat</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!canSaveEdit}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            canSaveEdit
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                          }`}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div
                    onClick={() => handleStartEdit(fc)}
                    className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                        <svg className="w-5 h-5 text-[var(--muted-foreground)] group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                            NMFC {fc.nmfcCode || fc.freightCategory}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                            Class {fc.classRate}
                          </span>
                        </div>
                        {fc.description && (
                          <p className="text-sm text-[var(--muted-foreground)]">{fc.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Flags */}
                      <div className="flex items-center gap-1">
                        {fc.flammable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Flammable
                          </span>
                        )}
                        {fc.hazmat && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Hazmat
                          </span>
                        )}
                      </div>

                      {/* Edit hint */}
                      <span className="text-xs text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to edit
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCategory(fc.id);
                        }}
                        className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
            <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">No freight categories assigned</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Search for an NMFC code above or enter values manually</p>
          </div>
        )}
      </div>
    </div>
  );
}

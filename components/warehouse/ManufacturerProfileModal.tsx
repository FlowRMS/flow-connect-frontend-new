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

type TabId = 'vendor' | 'customer-xref' | 'freight';

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
                selectedXRef={selectedXRef}
                setSelectedXRef={setSelectedXRef}
                showAddForm={showAddXRefForm}
                setShowAddForm={setShowAddXRefForm}
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
              Update Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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

  // Mock available contacts for the company
  const availableContacts = [
    { id: 'c1', name: 'John Smith', email: 'john.smith@company.com', phone: '555-0101', role: 'Sales Manager' },
    { id: 'c2', name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '555-0102', role: 'Account Executive' },
    { id: 'c3', name: 'Mike Williams', email: 'mike.w@company.com', phone: '555-0103', role: 'Operations' },
    { id: 'c4', name: 'Emily Brown', email: 'emily.b@company.com', phone: '555-0104', role: 'Logistics Coordinator' },
    { id: 'c5', name: 'David Lee', email: 'david.lee@company.com', phone: '555-0105', role: 'Warehouse Manager' },
  ];

  const filteredContacts = availableContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const selectedContactIds = profile.defaultWarehouseContactIds || [];

  const toggleContact = (contactId: string) => {
    const current = profile.defaultWarehouseContactIds || [];
    if (current.includes(contactId)) {
      onChange('defaultWarehouseContactIds', current.filter((id: string) => id !== contactId));
    } else {
      onChange('defaultWarehouseContactIds', [...current, contactId]);
    }
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
          <span className="text-xs text-[var(--muted-foreground)]">
            {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
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
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search contacts by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contacts List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContactIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => toggleContact(contact.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-[var(--border)] hover:bg-[var(--muted)]/30'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{contact.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {contact.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-xs text-[var(--muted-foreground)]">{contact.email}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{contact.phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredContacts.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No contacts found matching "{contactSearch}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Customer X-Ref Tab Component
function CustomerXRefTab({
  profile,
  selectedXRef,
  setSelectedXRef,
  showAddForm,
  setShowAddForm,
  onChange,
}: {
  profile: ManufacturerProfile;
  selectedXRef: VendorCustomerXRef | null;
  setSelectedXRef: (xref: VendorCustomerXRef | null) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  onChange: (field: keyof ManufacturerProfile, value: any) => void;
}) {
  // Mock customers for dropdown
  const mockCustomers = [
    { id: 'CUST-001', name: 'CED (All Phases) College Park', address: '3375 Highway 85\nCollege Park, GA 30349-9801' },
    { id: 'CUST-002', name: 'CED (Athens) Brandon', address: '123 Main St, Brandon, MS 39042' },
    { id: 'CUST-003', name: 'CED (Athens) Irmo', address: '456 Oak Ave, Irmo, SC 29063' },
    { id: 'CUST-004', name: 'CED (Athens) Pensacola', address: '789 Beach Blvd, Pensacola, FL 32501' },
    { id: 'CUST-005', name: 'CED (Carol Springs) Florida', address: '321 Spring Rd, Carol Springs, FL 33065' },
    { id: 'CUST-006', name: 'CED (Drop Ship) North Georgia', address: '654 Mountain Rd, Dalton, GA 30720' },
    { id: 'CUST-007', name: 'CED (Drop Ship) South Georgia', address: '987 Peach St, Albany, GA 31701' },
    { id: 'CUST-008', name: 'CED (ABM Electric) Cumming', address: '147 Electric Way, Cumming, GA 30040' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="flex items-center gap-2 text-blue-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-semibold">Vendor Customer X Ref</h3>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 space-y-6">
        {/* Row 1: Select Vendor, Select Customer, Vendor Customer Number, Select Default Shipper */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Select Vendor <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value={profile.manufacturerId}>{profile.vendorName}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Select Customer <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select customer...</option>
              {mockCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="mt-1 text-xs text-blue-600 cursor-pointer hover:underline">
              3375 Highway 85<br />College Park, GA 30349-9801
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Vendor Customer Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="MGM001"
              className="w-full px-3 py-2 bg-blue-100 dark:bg-blue-900/30 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Select Default Shipper</label>
            <select className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">--</option>
              <option value="CJI Robinson">CJI Robinson</option>
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
              <option value="Old Dominion">Old Dominion</option>
            </select>
          </div>
        </div>

        {/* Row 2: Checkboxes and Quote Reference */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-[var(--foreground)]">Always Factory BO</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-[var(--foreground)]">Credit Hold</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-[var(--foreground)]">Warehouse Order Allowed</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Quote Reference</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Additional Vendor Customer Number(s) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
              Additional Vendor Customer Number(s)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-1">Additional Vendor Customer Number</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-1">Additional Vendor Customer Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Add Code
              </button>
            </div>
          </div>
        </div>

        {/* Customer Assigned Code Number Table */}
        <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white text-xs font-semibold uppercase">
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Customer Assigned Code Number</th>
                <th className="px-4 py-2 text-left">Customer Assigned Code Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No customer assigned codes
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer Ship-To Addresses */}
        <div>
          <div className="text-sm font-medium text-blue-600 mb-2 cursor-pointer hover:underline">
            Customer Ship-To Addresses
          </div>
          <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-600 text-white text-xs font-semibold">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Address</th>
                  <th className="px-4 py-2 text-left">Customer Address Code Assigned By {profile.vendorName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {profile.customerXRefs?.[0]?.shipToAddresses?.map((addr) => (
                  <tr key={addr.id} className="hover:bg-[var(--muted)]/30">
                    <td className="px-4 py-3 text-sm text-[var(--foreground)]">{addr.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--muted-foreground)]">{addr.address}</td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={addr.customerAddressCode || ''}
                        placeholder=""
                        className="px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm w-48"
                      />
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                      No ship-to addresses
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Update
          </button>
        </div>
      </div>

      {/* Existing X-Refs List (below the form) */}
      {profile.customerXRefs && profile.customerXRefs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-[var(--foreground)]">Existing Customer Cross-References</h4>
          {profile.customerXRefs.map((xref) => (
            <div
              key={xref.id}
              className="flex items-center justify-between p-3 bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-medium text-[var(--foreground)]">{xref.customerName}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">
                    Vendor Customer #: {xref.vendorCustomerNumber}
                    {xref.warehouseOrderAllowed && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Warehouse Allowed
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
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
  const [nmfcSearch, setNmfcSearch] = useState('');
  const [showNmfcDropdown, setShowNmfcDropdown] = useState(false);
  const [selectedNmfc, setSelectedNmfc] = useState<typeof nmfcDatabase[0] | null>(null);
  const [newCategory, setNewCategory] = useState({
    flammable: false,
    hazmat: false,
    fragile: false,
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

  const filteredNmfc = nmfcDatabase.filter(
    (item) =>
      item.nmfc.includes(nmfcSearch) ||
      item.description.toLowerCase().includes(nmfcSearch.toLowerCase())
  );

  const handleSelectNmfc = (item: typeof nmfcDatabase[0]) => {
    setSelectedNmfc(item);
    setNmfcSearch('');
    setShowNmfcDropdown(false);
    setNewCategory({
      ...newCategory,
      flammable: item.defaultFlags.flammable,
      hazmat: item.defaultFlags.hazmat,
    });
  };

  const handleAddCategory = () => {
    if (!selectedNmfc) return;

    const newFreightCategory = {
      id: `fc-${Date.now()}`,
      vendorName: profile.vendorName,
      nmfcCode: selectedNmfc.nmfc,
      freightCategory: selectedNmfc.freightClass,
      description: selectedNmfc.description,
      classRate: selectedNmfc.freightClass,
      flammable: newCategory.flammable,
      hazmat: newCategory.hazmat,
      fragile: newCategory.fragile,
    };

    const updatedCategories = [...(profile.freightCategories || []), newFreightCategory];
    onChange('freightCategories', updatedCategories);
    setSelectedNmfc(null);
    setNewCategory({ flammable: false, hazmat: false, fragile: false });
  };

  const handleRemoveCategory = (id: string) => {
    const updatedCategories = (profile.freightCategories || []).filter((fc) => fc.id !== id);
    onChange('freightCategories', updatedCategories);
  };

  return (
    <div className="space-y-6">
      {/* Add Category Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Add Freight Category</h3>

        {/* NMFC Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
            Search NMFC Code
          </label>
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
              value={nmfcSearch}
              onChange={(e) => {
                setNmfcSearch(e.target.value);
                setShowNmfcDropdown(true);
              }}
              onFocus={() => setShowNmfcDropdown(true)}
              placeholder="Search by NMFC code or description..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* NMFC Dropdown */}
          {showNmfcDropdown && nmfcSearch && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredNmfc.length > 0 ? (
                filteredNmfc.map((item) => (
                  <button
                    key={item.nmfc}
                    onClick={() => handleSelectNmfc(item)}
                    className="w-full px-4 py-3 text-left hover:bg-[var(--muted)]/50 transition-colors border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-medium text-[var(--foreground)]">NMFC {item.nmfc}</span>
                        <p className="text-sm text-[var(--muted-foreground)]">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)]">
                          Class {item.freightClass}
                        </span>
                        {item.defaultFlags.flammable && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Flammable
                          </span>
                        )}
                        {item.defaultFlags.hazmat && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            Hazmat
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  No NMFC codes found matching "{nmfcSearch}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected NMFC Preview */}
        {selectedNmfc && (
          <div className="p-4 bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-semibold text-[var(--foreground)]">
                    NMFC {selectedNmfc.nmfc}
                  </span>
                  <span className="text-sm px-2 py-1 rounded-full bg-[var(--muted)] text-[var(--foreground)]">
                    Class {selectedNmfc.freightClass}
                  </span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedNmfc.description}</p>

                {/* Special Handling Flags */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      onClick={() => setNewCategory({ ...newCategory, flammable: !newCategory.flammable })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        newCategory.flammable ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          newCategory.flammable ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                        style={{ transform: newCategory.flammable ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                    <span className="text-sm text-[var(--foreground)]">Flammable</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      onClick={() => setNewCategory({ ...newCategory, hazmat: !newCategory.hazmat })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        newCategory.hazmat ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                        style={{ transform: newCategory.hazmat ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                    <span className="text-sm text-[var(--foreground)]">Hazmat</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      onClick={() => setNewCategory({ ...newCategory, fragile: !newCategory.fragile })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        newCategory.fragile ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform`}
                        style={{ transform: newCategory.fragile ? 'translateX(18px)' : 'translateX(2px)' }}
                      />
                    </button>
                    <span className="text-sm text-[var(--foreground)]">Fragile</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNmfc(null)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Existing Categories List */}
      <div className="space-y-3">
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
              <div
                key={fc.id}
                className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <p className="text-sm text-[var(--muted-foreground)]">{fc.description}</p>
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
                    {fc.fragile && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Fragile
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveCategory(fc.id)}
                    className="p-2 text-[var(--muted-foreground)] hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-lg">
            <svg className="w-10 h-10 mx-auto text-[var(--muted-foreground)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm text-[var(--muted-foreground)]">No freight categories assigned</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Search for an NMFC code above to add one</p>
          </div>
        )}
      </div>
    </div>
  );
}

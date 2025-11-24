'use client';

import React, { useState } from 'react';
import AdvancedFilters from './AdvancedFilters';

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  contactType: string[];
  tags: string[];
  lists: string[];
  territory: string;
  lastActivity: string;
};

type DuplicateGroup = {
  id: string;
  contacts: Contact[];
  matchType: 'exact' | 'similar';
  matchFields: string[];
};

export default function ContactsContent() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showDedupeModal, setShowDedupeModal] = useState(false);
  const [selectedDuplicateGroup, setSelectedDuplicateGroup] = useState<DuplicateGroup | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<'keep' | 'combine'>('keep');
  const [primaryContact, setPrimaryContact] = useState<string>('');
  const [selectedFields, setSelectedFields] = useState<Record<string, string>>({});

  // Mock duplicate groups
  const duplicateGroups: DuplicateGroup[] = [
    {
      id: 'DG-001',
      matchType: 'exact',
      matchFields: ['email'],
      contacts: [
        {
          id: 'C-011',
          name: 'John Smith',
          email: 'jsmith@turnerconst.com',
          phone: '(555) 111-2222',
          company: 'Turner Construction',
          role: 'Project Manager',
          contactType: ['GC'],
          tags: ['Commercial'],
          lists: ['Active Projects'],
          territory: 'West',
          lastActivity: '2024-11-22',
        },
        {
          id: 'C-012',
          name: 'John M. Smith',
          email: 'jsmith@turnerconst.com',
          phone: '(555) 111-2223',
          company: 'Turner Construction',
          role: 'Senior PM',
          contactType: ['GC'],
          tags: ['Commercial', 'Key Contact'],
          lists: ['VIP Contacts', 'Active Projects'],
          territory: 'West',
          lastActivity: '2024-11-15',
        }
      ]
    },
    {
      id: 'DG-002',
      matchType: 'similar',
      matchFields: ['name', 'company'],
      contacts: [
        {
          id: 'C-013',
          name: 'Jennifer Walsh',
          email: 'j.walsh@millerelectric.com',
          phone: '(555) 345-6789',
          company: 'Miller Electric',
          role: 'VP Operations',
          contactType: ['EC'],
          tags: ['Decision Maker'],
          lists: ['Decision Makers'],
          territory: 'West',
          lastActivity: '2024-11-21',
        },
        {
          id: 'C-014',
          name: 'Jenny Walsh',
          email: 'jwalsh@millerelectric.com',
          phone: '(555) 345-6788',
          company: 'Miller Electric',
          role: 'VP of Operations',
          contactType: ['EC'],
          tags: ['Decision Maker', 'VIP'],
          lists: ['VIP Contacts', 'Decision Makers'],
          territory: 'West',
          lastActivity: '2024-11-19',
        }
      ]
    },
    {
      id: 'DG-003',
      matchType: 'exact',
      matchFields: ['phone'],
      contacts: [
        {
          id: 'C-015',
          name: 'Robert Johnson',
          email: 'rjohnson@skanska.com',
          phone: '(555) 999-8888',
          company: 'Skanska USA',
          role: 'Estimator',
          contactType: ['GC'],
          tags: ['Education'],
          lists: ['Education Projects'],
          territory: 'East',
          lastActivity: '2024-11-20',
        },
        {
          id: 'C-016',
          name: 'Bob Johnson',
          email: 'bjohnson@skanska.com',
          phone: '(555) 999-8888',
          company: 'Skanska USA',
          role: 'Senior Estimator',
          contactType: ['GC'],
          tags: ['Education', 'Key Contact'],
          lists: ['Education Projects', 'Estimating Team'],
          territory: 'East',
          lastActivity: '2024-11-18',
        }
      ]
    }
  ];

  const contactFilterOptions = [
    { id: 'contact-id', label: 'Contact ID', type: 'text' as const },
    { id: 'name', label: 'Name', type: 'text' as const },
    { id: 'email', label: 'Email', type: 'text' as const },
    { id: 'phone', label: 'Phone', type: 'text' as const },
    { id: 'company', label: 'Company', type: 'dropdown' as const },
    { id: 'role', label: 'Role', type: 'dropdown' as const },
    { id: 'contact-type', label: 'Contact Type', type: 'dropdown' as const },
    { id: 'territory', label: 'Territory', type: 'dropdown' as const },
    { id: 'tags', label: 'Tags', type: 'dropdown' as const },
    { id: 'lists', label: 'Lists', type: 'dropdown' as const },
    { id: 'last-activity', label: 'Last Activity', type: 'date' as const },
  ];

  const initialContacts: Contact[] = [
    {
      id: 'C-001',
      name: 'Michael Rodriguez',
      email: 'mrodriguez@turnerconst.com',
      phone: '(555) 234-5678',
      company: 'Turner Construction',
      role: 'Project Manager',
      contactType: ['GC'],
      tags: ['Commercial', 'Key Contact'],
      lists: ['VIP Contacts', 'Active Projects'],
      territory: 'West',
      lastActivity: '2024-11-20',
    },
    {
      id: 'C-002',
      name: 'Jennifer Walsh',
      email: 'jwalsh@millerelectric.com',
      phone: '(555) 345-6789',
      company: 'Miller Electric',
      role: 'VP of Operations',
      contactType: ['EC'],
      tags: ['Decision Maker', 'VIP'],
      lists: ['VIP Contacts', 'Decision Makers'],
      territory: 'West',
      lastActivity: '2024-11-19',
    },
    {
      id: 'C-003',
      name: 'David Chen',
      email: 'd.chen@smitharch.com',
      phone: '(555) 456-7890',
      company: 'Smith & Associates',
      role: 'Senior Architect',
      contactType: ['Architect'],
      tags: ['Design', 'Specification'],
      lists: ['Design Team'],
      territory: 'Central',
      lastActivity: '2024-11-21',
    },
    {
      id: 'C-004',
      name: 'Sarah Thompson',
      email: 'sthompson@jci.com',
      phone: '(555) 567-8901',
      company: 'Johnson Controls',
      role: 'Field Engineer',
      contactType: ['EC', 'Engineer'],
      tags: ['Technical'],
      lists: ['Technical Contacts'],
      territory: 'West',
      lastActivity: '2024-11-18',
    },
    {
      id: 'C-005',
      name: 'Marcus Williams',
      email: 'marcus.w@henselphelps.com',
      phone: '(555) 678-9012',
      company: 'Hensel Phelps',
      role: 'Superintendent',
      contactType: ['GC'],
      tags: ['Field Contact'],
      lists: ['Active Projects'],
      territory: 'East',
      lastActivity: '2024-11-22',
    },
    {
      id: 'C-006',
      name: 'Amanda Foster',
      email: 'afoster@summitelec.com',
      phone: '(555) 789-0123',
      company: 'Summit Electric',
      role: 'Purchasing Manager',
      contactType: ['EC', 'Distributor'],
      tags: ['Procurement', 'Decision Maker'],
      lists: ['Decision Makers', 'Procurement Team'],
      territory: 'West',
      lastActivity: '2024-11-17',
    },
    {
      id: 'C-007',
      name: 'Robert Jackson',
      email: 'rjackson@mccarthybuilding.com',
      phone: '(555) 890-1234',
      company: 'McCarthy Building',
      role: 'Project Executive',
      contactType: ['GC'],
      tags: ['VIP', 'Healthcare'],
      lists: ['VIP Contacts', 'Healthcare Projects'],
      territory: 'Central',
      lastActivity: '2024-11-21',
    },
    {
      id: 'C-008',
      name: 'Lisa Martinez',
      email: 'l.martinez@bayareaelec.com',
      phone: '(555) 901-2345',
      company: 'Bay Area Electric',
      role: 'Estimator',
      contactType: ['EC'],
      tags: ['Residential', 'Estimating'],
      lists: ['Estimating Team'],
      territory: 'West',
      lastActivity: '2024-11-16',
    },
    {
      id: 'C-009',
      name: 'Kevin Park',
      email: 'kpark@skanska.com',
      phone: '(555) 012-3456',
      company: 'Skanska USA',
      role: 'MEP Coordinator',
      contactType: ['GC'],
      tags: ['Education', 'Coordination'],
      lists: ['Education Projects'],
      territory: 'East',
      lastActivity: '2024-11-20',
    },
    {
      id: 'C-010',
      name: 'Rachel Kim',
      email: 'rkim@primeelectric.com',
      phone: '(555) 123-4567',
      company: 'Prime Electric',
      role: 'Chief Estimator',
      contactType: ['EC'],
      tags: ['Decision Maker', 'Education'],
      lists: ['Decision Makers', 'Education Projects'],
      territory: 'East',
      lastActivity: '2024-11-19',
    },
  ];

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);

  const contactTypes = ['All', 'GC', 'EC', 'Architect', 'Engineer', 'Distributor', 'Owner'];

  const filteredContacts = selectedType === 'All'
    ? contacts
    : contacts.filter(contact => contact.contactType.includes(selectedType));

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const getAvatarColor = (id: string) => {
    const colors = ['bg-orange-500', 'bg-teal-500', 'bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Contacts</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Dedupe Button */}
            <button
              onClick={() => setShowDedupeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Find Duplicates ({duplicateGroups.length})
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="Grid View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-[var(--card)]'}`}
                title="List View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
            </div>

            <AdvancedFilters filterOptions={contactFilterOptions} />
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
              </svg>
              Sort
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
              </svg>
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {contactTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                selectedType === type
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              {type}
              {type === 'All' && <span className="ml-2 text-xs opacity-75">({contacts.length})</span>}
              {type !== 'All' && (
                <span className="ml-2 text-xs opacity-75">
                  ({contacts.filter(c => c.contactType.includes(type)).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List View */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
          <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Name
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Company
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Role
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Type
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Tags
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Lists
          </div>
          <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Last Activity
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[var(--border)]">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-sm font-semibold`}>
                  {getInitials(contact.name)}
                </div>
                <div>
                  <h3 className="font-medium text-[var(--foreground)]">{contact.name}</h3>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <a href={`mailto:${contact.email}`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                      {contact.email}
                    </a>
                    <a href={`tel:${contact.phone}`} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)]">
                      {contact.phone}
                    </a>
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-sm text-[var(--foreground)]">{contact.company}</span>
              </div>
              <div className="col-span-2 flex items-center">
                <span className="text-sm text-[var(--foreground)]">{contact.role}</span>
              </div>
              <div className="col-span-1 flex items-center gap-1 flex-wrap">
                {contact.contactType.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="col-span-1 flex items-center gap-1 flex-wrap">
                {contact.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="col-span-2 flex items-center gap-1 flex-wrap">
                {contact.lists.map((list, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                  >
                    {list}
                  </span>
                ))}
              </div>
              <div className="col-span-1 flex items-center">
                <span className="text-xs text-[var(--muted-foreground)]">{formatDate(contact.lastActivity)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deduplication Modal - List of Duplicate Groups */}
      {showDedupeModal && mergeStrategy === 'keep' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Potential Duplicate Contacts</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Found {duplicateGroups.length} groups of potential duplicates
                </p>
              </div>
              <button
                onClick={() => setShowDedupeModal(false)}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l12 12M16 4L4 16" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {duplicateGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded text-xs font-medium ${
                        group.matchType === 'exact'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {group.matchType === 'exact' ? 'Exact Match' : 'Similar'}
                      </div>
                      <span className="text-sm text-[var(--muted-foreground)]">
                        Matched by: {group.matchFields.join(', ')}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {group.contacts.length} contacts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {group.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => {
                          setPrimaryContact(contact.id);
                          setSelectedDuplicateGroup(group);
                        }}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          primaryContact === contact.id && selectedDuplicateGroup?.id === group.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <input
                            type="radio"
                            checked={primaryContact === contact.id && selectedDuplicateGroup?.id === group.id}
                            onChange={() => {
                              setPrimaryContact(contact.id);
                              setSelectedDuplicateGroup(group);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 mt-1 accent-[var(--primary)]"
                          />
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(contact.id)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                            {getInitials(contact.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-[var(--foreground)] truncate">{contact.name}</h4>
                            <p className="text-xs text-[var(--muted-foreground)]">{contact.id}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs ml-7">
                          <div className="truncate">
                            <span className="text-[var(--muted-foreground)]">Email:</span>{' '}
                            <span className="text-[var(--foreground)]">{contact.email}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-[var(--muted-foreground)]">Phone:</span>{' '}
                            <span className="text-[var(--foreground)]">{contact.phone}</span>
                          </div>
                          <div className="truncate">
                            <span className="text-[var(--muted-foreground)]">Role:</span>{' '}
                            <span className="text-[var(--foreground)]">{contact.role}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <button
                      onClick={() => {
                        setPrimaryContact(group.contacts[0].id);
                        setSelectedDuplicateGroup(group);
                        setMergeStrategy('combine');
                        const firstContact = group.contacts[0];
                        const initialFields: Record<string, string> = {
                          name: firstContact.id,
                          email: firstContact.id,
                          phone: firstContact.id,
                          company: firstContact.id,
                          role: firstContact.id
                        };
                        setSelectedFields(initialFields);
                      }}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
                    >
                      Combine Information
                    </button>
                    <button
                      onClick={() => {
                        const contactToKeep = primaryContact && selectedDuplicateGroup?.id === group.id
                          ? primaryContact
                          : group.contacts[0].id;
                        alert(`Keeping contact ${contactToKeep} and archiving others`);
                        setPrimaryContact('');
                        setSelectedDuplicateGroup(null);
                      }}
                      className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
                    >
                      Keep & Merge
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-[var(--card)] px-6 py-4 border-t border-[var(--border)] flex items-center justify-end">
              <button
                onClick={() => setShowDedupeModal(false)}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deduplication Modal - Combine Information */}
      {showDedupeModal && selectedDuplicateGroup && mergeStrategy === 'combine' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Combine Contact Information</h2>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Select the best information from each contact
                </p>
              </div>
              <button
                onClick={() => {
                  setMergeStrategy('keep');
                  setSelectedFields({});
                }}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 6l-9 9M6 6l9 9" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Combine Information Option */}
              <div className="mb-6">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                    Select Best Information for Each Field
                  </h3>
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Name</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDuplicateGroup.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedFields({...selectedFields, name: contact.id})}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                              selectedFields['name'] === contact.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedFields['name'] === contact.id}
                                onChange={() => setSelectedFields({...selectedFields, name: contact.id})}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-sm font-medium text-[var(--foreground)]">{contact.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Email</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDuplicateGroup.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedFields({...selectedFields, email: contact.id})}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                              selectedFields['email'] === contact.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedFields['email'] === contact.id}
                                onChange={() => setSelectedFields({...selectedFields, email: contact.id})}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-sm font-medium text-[var(--foreground)]">{contact.email}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Phone</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDuplicateGroup.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedFields({...selectedFields, phone: contact.id})}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                              selectedFields['phone'] === contact.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedFields['phone'] === contact.id}
                                onChange={() => setSelectedFields({...selectedFields, phone: contact.id})}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-sm font-medium text-[var(--foreground)]">{contact.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Company */}
                    <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Company</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDuplicateGroup.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedFields({...selectedFields, company: contact.id})}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                              selectedFields['company'] === contact.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedFields['company'] === contact.id}
                                onChange={() => setSelectedFields({...selectedFields, company: contact.id})}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-sm font-medium text-[var(--foreground)]">{contact.company}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="bg-[var(--muted)]/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">Role</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedDuplicateGroup.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => setSelectedFields({...selectedFields, role: contact.id})}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                              selectedFields['role'] === contact.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={selectedFields['role'] === contact.id}
                                onChange={() => setSelectedFields({...selectedFields, role: contact.id})}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-sm font-medium text-[var(--foreground)]">{contact.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Merge Preview</h3>
                  <p className="text-sm text-blue-800">
                    A new contact will be created with your selected information. All activities, notes, and related records will be transferred to this combined contact. The original contacts will be archived.
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-[var(--card)] px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
              <button
                onClick={() => {
                  setMergeStrategy('keep');
                  setSelectedFields({});
                }}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--muted)] transition-colors"
              >
                Back
              </button>
              <button
                disabled={Object.keys(selectedFields).length === 0}
                onClick={() => {
                  alert(`Creating combined contact with selected fields: ${JSON.stringify(selectedFields)}`);
                  setSelectedDuplicateGroup(null);
                  setSelectedFields({});
                  setMergeStrategy('keep');
                  setShowDedupeModal(false);
                }}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Combined Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

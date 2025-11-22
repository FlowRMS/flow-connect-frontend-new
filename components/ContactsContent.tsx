'use client';

import React, { useState } from 'react';

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  contactType: string[];
  tags: string[];
  territory: string;
  lastActivity: string;
};

export default function ContactsContent() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedType, setSelectedType] = useState<string>('All');

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
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            Add Contact
          </button>
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

        <div className="flex gap-2 pb-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round"/>
            </svg>
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h14M6 8h11M9 12h8M12 16h5" strokeLinecap="round"/>
            </svg>
            Sort
          </button>
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
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Type
          </div>
          <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
            Tags
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
              <div className="col-span-2 flex items-center gap-1 flex-wrap">
                {contact.contactType.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div className="col-span-2 flex items-center gap-1 flex-wrap">
                {contact.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded text-xs"
                  >
                    {tag}
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
    </main>
  );
}

'use client';

import React, { useState } from 'react';

type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  type: string;
};

type Campaign = {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  status: 'Draft' | 'Scheduled' | 'Sending' | 'Completed';
  scheduledDate?: string;
  sentCount?: number;
  createdDate: string;
};

export default function EmailHelperContent() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'new-campaign'>('campaigns');
  const [selectedSource, setSelectedSource] = useState<'Contacts' | 'Jobs' | 'Companies' | 'Pre-Opportunities'>('Contacts');
  const [recipientList, setRecipientList] = useState<Contact[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendPace, setSendPace] = useState<'fast' | 'medium' | 'slow' | 'very-slow' | 'randomized'>('medium');
  const [maxPerDay, setMaxPerDay] = useState(50);
  const [useAIPersonalization, setUseAIPersonalization] = useState(true);

  const availableContacts: Contact[] = [
    { id: 'C-001', name: 'Michael Rodriguez', email: 'mrodriguez@turnerconst.com', company: 'Turner Construction', type: 'GC' },
    { id: 'C-002', name: 'Jennifer Walsh', email: 'jwalsh@millerelectric.com', company: 'Miller Electric', type: 'EC' },
    { id: 'C-003', name: 'David Chen', email: 'd.chen@smitharch.com', company: 'Smith & Associates', type: 'Architect' },
    { id: 'C-004', name: 'Sarah Thompson', email: 'sthompson@jci.com', company: 'Johnson Controls', type: 'EC' },
    { id: 'C-005', name: 'Marcus Williams', email: 'marcus.w@henselphelps.com', company: 'Hensel Phelps', type: 'GC' },
    { id: 'C-006', name: 'Amanda Foster', email: 'afoster@summitelec.com', company: 'Summit Electric', type: 'EC' },
    { id: 'C-007', name: 'Robert Jackson', email: 'rjackson@mccarthybuilding.com', company: 'McCarthy Building', type: 'GC' },
    { id: 'C-008', name: 'Lisa Martinez', email: 'l.martinez@bayareaelec.com', company: 'Bay Area Electric', type: 'EC' },
  ];

  const campaigns: Campaign[] = [
    {
      id: 'CAM-001',
      name: 'Q1 Product Launch - LED Line',
      subject: 'Introducing Our New Energy-Efficient LED Product Line',
      recipients: 45,
      status: 'Completed',
      sentCount: 45,
      createdDate: '2024-11-15',
    },
    {
      id: 'CAM-002',
      name: 'Healthcare Sector - Controls Opportunity',
      subject: 'Advanced Building Controls for Healthcare Facilities',
      recipients: 28,
      status: 'Scheduled',
      scheduledDate: '2024-11-25',
      createdDate: '2024-11-20',
    },
    {
      id: 'CAM-003',
      name: 'Trade Show Invitations - LightFair 2025',
      subject: 'Join Us at LightFair 2025 - Booth #1234',
      recipients: 120,
      status: 'Draft',
      createdDate: '2024-11-21',
    },
    {
      id: 'CAM-004',
      name: 'Year-End Follow-up - Active Projects',
      subject: 'Year-End Check-in: Your Active Projects',
      recipients: 32,
      status: 'Sending',
      sentCount: 18,
      createdDate: '2024-11-22',
    },
  ];

  const addToRecipientList = (contact: Contact) => {
    if (!recipientList.find(c => c.id === contact.id)) {
      setRecipientList([...recipientList, contact]);
    }
  };

  const removeFromRecipientList = (contactId: string) => {
    setRecipientList(recipientList.filter(c => c.id !== contactId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'Sending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[var(--background)] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-1">Email Helper</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Create targeted email campaigns with AI personalization
            </p>
          </div>
          <button
            onClick={() => setActiveTab('new-campaign')}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
            New Campaign
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-[var(--border)]">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'campaigns'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('new-campaign')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'new-campaign'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List View */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Campaign Name
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
                Recipients
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Date
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
                Progress
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                >
                  <div className="col-span-4">
                    <h3 className="font-medium text-[var(--foreground)] mb-1">{campaign.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{campaign.subject}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--foreground)]">{campaign.recipients}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <div>
                      <div className="text-sm text-[var(--foreground)]">
                        {campaign.status === 'Scheduled' && campaign.scheduledDate
                          ? formatDate(campaign.scheduledDate)
                          : formatDate(campaign.createdDate)}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {campaign.status === 'Scheduled' ? 'Scheduled' : 'Created'}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    {campaign.status === 'Sending' || campaign.status === 'Completed' ? (
                      <div className="text-sm">
                        <span className="font-medium text-[var(--foreground)]">{campaign.sentCount}</span>
                        <span className="text-[var(--muted-foreground)]"> / {campaign.recipients}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Campaign View */}
      {activeTab === 'new-campaign' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Build Target List */}
          <div className="col-span-1 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Build Target List</h3>

              {/* Source Selection */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Contacts', 'Jobs', 'Companies', 'Pre-Opportunities'] as const).map((source) => (
                    <button
                      key={source}
                      onClick={() => setSelectedSource(source)}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedSource === source
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Contacts */}
              <div>
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Available {selectedSource}
                </label>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 border border-[var(--border)] rounded-md hover:bg-[var(--muted)]/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.company}</div>
                      </div>
                      <button
                        onClick={() => addToRecipientList(contact)}
                        className="ml-2 p-1 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Count */}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Recipients Selected</span>
                  <span className="font-semibold text-[var(--foreground)]">{recipientList.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Email Drafting */}
          <div className="col-span-1 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Email Content</h3>

              {/* Subject */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter base email content... AI will personalize for each recipient."
                  rows={12}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                />
              </div>

              {/* AI Personalization */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <input
                  type="checkbox"
                  id="ai-personalization"
                  checked={useAIPersonalization}
                  onChange={(e) => setUseAIPersonalization(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                <label htmlFor="ai-personalization" className="text-sm text-blue-900">
                  Enable AI personalization per recipient
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Scheduling & Settings */}
          <div className="col-span-1 space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Scheduling & Throttling</h3>

              {/* Max Per Day */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Max Emails Per Day
                </label>
                <input
                  type="number"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Send Pace */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Send Pace
                </label>
                <div className="space-y-2">
                  {(['fast', 'medium', 'slow', 'very-slow', 'randomized'] as const).map((pace) => (
                    <label key={pace} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="send-pace"
                        value={pace}
                        checked={sendPace === pace}
                        onChange={(e) => setSendPace(e.target.value as typeof sendPace)}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                      <span className="text-sm text-[var(--foreground)] capitalize">
                        {pace === 'very-slow' ? 'Very Slow' : pace}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Windows */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Time Window
                </label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    defaultValue="09:00"
                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                  <span className="text-[var(--muted-foreground)] flex items-center">to</span>
                  <input
                    type="time"
                    defaultValue="17:00"
                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Output Options */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
                  Output
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="output"
                      value="drafts"
                      defaultChecked
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Push to Outlook/Gmail drafts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="output"
                      value="scheduled"
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--foreground)]">Send on schedule</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                <button className="w-full px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                  Create Campaign
                </button>
                <button className="w-full px-4 py-2 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
                  Save as Draft
                </button>
              </div>
            </div>

            {/* Selected Recipients */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
              <h3 className="font-semibold text-[var(--foreground)] mb-4">Selected Recipients ({recipientList.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {recipientList.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-2 border border-[var(--border)] rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                    </div>
                    <button
                      onClick={() => removeFromRecipientList(contact.id)}
                      className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
                {recipientList.length === 0 && (
                  <div className="text-center text-sm text-[var(--muted-foreground)] py-8">
                    No recipients selected yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

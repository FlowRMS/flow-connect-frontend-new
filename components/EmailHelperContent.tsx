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

type Rule = {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  status: 'Active' | 'Paused' | 'Draft';
  emailsSent: number;
  lastTriggered?: string;
  createdDate: string;
};

export default function EmailHelperContent() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'new-campaign' | 'rules' | 'new-rule'>('campaigns');
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

  const rules: Rule[] = [
    {
      id: 'RULE-001',
      name: 'New Contact Welcome Email',
      subject: 'Welcome to Our Network',
      trigger: 'When contact is added',
      status: 'Active',
      emailsSent: 127,
      lastTriggered: '2024-11-22',
      createdDate: '2024-10-01',
    },
    {
      id: 'RULE-002',
      name: 'Job Win Follow-up',
      subject: 'Congratulations on Your Project Win',
      trigger: 'When job status = Won',
      status: 'Active',
      emailsSent: 34,
      lastTriggered: '2024-11-21',
      createdDate: '2024-10-15',
    },
    {
      id: 'RULE-003',
      name: 'Inactive Contact Re-engagement',
      subject: "We'd Love to Reconnect",
      trigger: 'When contact inactive > 90 days',
      status: 'Paused',
      emailsSent: 52,
      lastTriggered: '2024-11-10',
      createdDate: '2024-09-01',
    },
    {
      id: 'RULE-004',
      name: 'Birthday Greeting',
      subject: 'Happy Birthday from Our Team!',
      trigger: "When contact's birthday",
      status: 'Draft',
      emailsSent: 0,
      createdDate: '2024-11-20',
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
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'Paused':
        return 'bg-yellow-100 text-yellow-700';
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
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Email Flow</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-md">
              <button className="p-2 rounded bg-white shadow-sm" title="List View">
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
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'rules'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Rules
          </button>
          <button
            onClick={() => setActiveTab('new-rule')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'new-rule'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            New Rule
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

      {/* Rules List View */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
              <div className="col-span-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Rule Name
              </div>
              <div className="col-span-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Trigger
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Status
              </div>
              <div className="col-span-1 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-center">
                Emails Sent
              </div>
              <div className="col-span-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Last Triggered
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[var(--border)]">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                >
                  <div className="col-span-4">
                    <h3 className="font-medium text-[var(--foreground)] mb-1">{rule.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{rule.subject}</p>
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm text-[var(--foreground)]">{rule.trigger}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(rule.status)}`}>
                      {rule.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--foreground)]">{rule.emailsSent}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {rule.lastTriggered ? formatDate(rule.lastTriggered) : 'Never'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Rule View */}
      {activeTab === 'new-rule' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Rule Configuration */}
          <div className="col-span-8 space-y-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Rule Configuration</h2>

              {/* Rule Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., New Contact Welcome Email"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>

              {/* Trigger Condition */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Trigger When
                </label>
                <select className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]">
                  <option value="">Select trigger...</option>
                  <option value="contact-added">Contact is added</option>
                  <option value="job-won">Job status changes to Won</option>
                  <option value="job-lost">Job status changes to Lost</option>
                  <option value="contact-inactive">Contact inactive for X days</option>
                  <option value="birthday">Contact's birthday</option>
                  <option value="anniversary">Contact's work anniversary</option>
                  <option value="tag-added">Tag is added to contact</option>
                  <option value="note-added">Note is added</option>
                </select>
              </div>

              {/* Email Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter email subject"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>

              {/* Email Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Email Body
                </label>
                <textarea
                  rows={10}
                  placeholder="Compose your email..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none bg-[var(--background)]"
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Use variables: {'{name}'}, {'{company}'}, {'{email}'}, {'{phone}'}
                </p>
              </div>

              {/* AI Personalization */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useAIPersonalization}
                  onChange={(e) => setUseAIPersonalization(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                <label className="text-sm text-[var(--foreground)]">
                  Use AI to personalize each email
                </label>
              </div>

              {/* Send Pace */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Send Pace
                </label>
                <select
                  value={sendPace}
                  onChange={(e) => setSendPace(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                >
                  <option value="fast">Fast (500/hour)</option>
                  <option value="medium">Medium (200/hour)</option>
                  <option value="slow">Slow (100/hour)</option>
                  <option value="very-slow">Very Slow (50/hour)</option>
                  <option value="randomized">Randomized (Human-like)</option>
                </select>
              </div>

              {/* Max Emails Per Day */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Max Emails Per Day
                </label>
                <input
                  type="number"
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:bg-[var(--primary-hover)] transition-colors">
                  Activate Rule
                </button>
                <button className="px-4 py-2 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
                  Save as Draft
                </button>
                <button
                  onClick={() => setActiveTab('rules')}
                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Rule Info */}
          <div className="col-span-4 space-y-4">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">About Rules</h3>
              <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <p>
                  Rules automatically send emails when specific triggers occur, unlike campaigns which are one-time sends.
                </p>
                <p>
                  <strong className="text-[var(--foreground)]">Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Welcome new contacts</li>
                  <li>Follow up on won/lost jobs</li>
                  <li>Re-engage inactive contacts</li>
                  <li>Send birthday wishes</li>
                </ul>
                <p>
                  Rules can be paused or activated at any time from the Rules tab.
                </p>
              </div>
            </div>

            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Best Practices</h3>
              <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                <p>✓ Test with a small group first</p>
                <p>✓ Use personalization variables</p>
                <p>✓ Set reasonable send limits</p>
                <p>✓ Monitor engagement metrics</p>
                <p>✓ Review and update regularly</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

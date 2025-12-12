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

type RuleCondition = {
  id: string;
  entity: 'Contact' | 'Job' | 'Company' | 'Pre-Opportunity' | 'Quote' | '';
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'days_until' | 'days_after' | '';
  value: string;
};

type RuleConditionGroup = {
  id: string;
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
};

export default function EmailHelperContent() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'new-campaign' | 'rules' | 'new-rule'>('campaigns');
  const [selectedSource, setSelectedSource] = useState<'Contacts' | 'Jobs' | 'Companies' | 'Pre-Opportunities'>('Contacts');
  const [recipientList, setRecipientList] = useState<Contact[]>([]);
  const [listType, setListType] = useState<'static' | 'criteria' | 'dynamic'>('static');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [aiContext, setAIContext] = useState<'campaign' | 'rule' | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendPace, setSendPace] = useState<'fast' | 'medium' | 'slow' | 'very-slow' | 'randomized'>('medium');
  const [maxPerDay, setMaxPerDay] = useState(50);
  const [useAIPersonalization, setUseAIPersonalization] = useState(true);
  const [communicationType, setCommunicationType] = useState<'email' | 'notification' | 'both'>('email');
  const [isInternalCommunication, setIsInternalCommunication] = useState(false);
  const [ruleConditionGroups, setRuleConditionGroups] = useState<RuleConditionGroup[]>([
    {
      id: '1',
      logic: 'AND',
      conditions: [
        { id: '1-1', entity: '', field: '', operator: '', value: '' }
      ]
    }
  ]);
  const [campaignConditionGroups, setCampaignConditionGroups] = useState<RuleConditionGroup[]>([
    {
      id: '1',
      logic: 'AND',
      conditions: [
        { id: '1-1', entity: '', field: '', operator: '', value: '' }
      ]
    }
  ]);

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

  const getFieldsForEntity = (entity: string) => {
    const fieldMap: Record<string, { value: string; label: string; type: string }[]> = {
      'Contact': [
        { value: 'name', label: 'Name', type: 'text' },
        { value: 'email', label: 'Email', type: 'text' },
        { value: 'company', label: 'Company', type: 'text' },
        { value: 'role', label: 'Role', type: 'text' },
        { value: 'type', label: 'Contact Type', type: 'text' },
        { value: 'tags', label: 'Tags', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'last_activity', label: 'Last Activity Date', type: 'date' },
        { value: 'created_date', label: 'Created Date', type: 'date' },
      ],
      'Job': [
        { value: 'name', label: 'Job Name', type: 'text' },
        { value: 'status', label: 'Status', type: 'text' },
        { value: 'type', label: 'Job Type', type: 'text' },
        { value: 'value', label: 'Value', type: 'number' },
        { value: 'start_date', label: 'Start Date', type: 'date' },
        { value: 'gc', label: 'General Contractor', type: 'text' },
        { value: 'ec', label: 'Electrical Contractor', type: 'text' },
        { value: 'owner', label: 'Owner', type: 'text' },
        { value: 'tags', label: 'Tags', type: 'text' },
      ],
      'Company': [
        { value: 'name', label: 'Company Name', type: 'text' },
        { value: 'type', label: 'Company Type', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'tags', label: 'Tags', type: 'text' },
        { value: 'contact_count', label: 'Contact Count', type: 'number' },
        { value: 'job_count', label: 'Job Count', type: 'number' },
        { value: 'last_activity', label: 'Last Activity Date', type: 'date' },
      ],
      'Pre-Opportunity': [
        { value: 'name', label: 'Name', type: 'text' },
        { value: 'stage', label: 'Stage', type: 'text' },
        { value: 'owner', label: 'Owner', type: 'text' },
        { value: 'tags', label: 'Tags', type: 'text' },
        { value: 'created_date', label: 'Created Date', type: 'date' },
        { value: 'due_date', label: 'Due Date', type: 'date' },
      ],
      'Quote': [
        { value: 'name', label: 'Quote Name', type: 'text' },
        { value: 'status', label: 'Status', type: 'text' },
        { value: 'amount', label: 'Amount', type: 'number' },
        { value: 'valid_until', label: 'Valid Until Date', type: 'date' },
        { value: 'created_date', label: 'Created Date', type: 'date' },
        { value: 'owner', label: 'Owner', type: 'text' },
        { value: 'customer', label: 'Customer', type: 'text' },
        { value: 'tags', label: 'Tags', type: 'text' },
      ],
    };
    return fieldMap[entity] || [];
  };

  const getOperatorsForFieldType = (fieldType: string) => {
    const operatorMap: Record<string, { value: string; label: string }[]> = {
      'text': [
        { value: 'equals', label: 'equals' },
        { value: 'contains', label: 'contains' },
      ],
      'number': [
        { value: 'equals', label: 'equals' },
        { value: 'greater_than', label: 'greater than' },
        { value: 'less_than', label: 'less than' },
      ],
      'date': [
        { value: 'equals', label: 'equals' },
        { value: 'days_until', label: 'days until' },
        { value: 'days_after', label: 'days after' },
      ],
    };
    return operatorMap[fieldType] || operatorMap['text'];
  };

  const addCondition = (groupId: string) => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                { id: `${groupId}-${group.conditions.length + 1}`, entity: '', field: '', operator: '', value: '' }
              ]
            }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
          : group
      )
    );
  };

  const updateCondition = (groupId: string, conditionId: string, field: keyof RuleCondition, value: any) => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map(c =>
                c.id === conditionId ? { ...c, [field]: value } : c
              )
            }
          : group
      )
    );
  };

  const addConditionGroup = () => {
    const newGroupId = String(ruleConditionGroups.length + 1);
    setRuleConditionGroups([
      ...ruleConditionGroups,
      {
        id: newGroupId,
        logic: 'AND',
        conditions: [
          { id: `${newGroupId}-1`, entity: '', field: '', operator: '', value: '' }
        ]
      }
    ]);
  };

  const removeConditionGroup = (groupId: string) => {
    setRuleConditionGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setRuleConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, logic } : group
      )
    );
  };

  // Campaign condition helpers (reuse same logic)
  const addCampaignCondition = (groupId: string) => {
    setCampaignConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                { id: `${groupId}-${group.conditions.length + 1}`, entity: '', field: '', operator: '', value: '' }
              ]
            }
          : group
      )
    );
  };

  const removeCampaignCondition = (groupId: string, conditionId: string) => {
    setCampaignConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? { ...group, conditions: group.conditions.filter(c => c.id !== conditionId) }
          : group
      )
    );
  };

  const updateCampaignCondition = (groupId: string, conditionId: string, field: keyof RuleCondition, value: any) => {
    setCampaignConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map(c =>
                c.id === conditionId ? { ...c, [field]: value } : c
              )
            }
          : group
      )
    );
  };

  const addCampaignConditionGroup = () => {
    const newGroupId = String(campaignConditionGroups.length + 1);
    setCampaignConditionGroups([
      ...campaignConditionGroups,
      {
        id: newGroupId,
        logic: 'AND',
        conditions: [
          { id: `${newGroupId}-1`, entity: '', field: '', operator: '', value: '' }
        ]
      }
    ]);
  };

  const removeCampaignConditionGroup = (groupId: string) => {
    setCampaignConditionGroups(groups => groups.filter(g => g.id !== groupId));
  };

  const updateCampaignGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setCampaignConditionGroups(groups =>
      groups.map(group =>
        group.id === groupId ? { ...group, logic } : group
      )
    );
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
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Campaign Configuration */}
          <div className="col-span-8 space-y-6">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Campaign Configuration</h2>

              {/* Campaign Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q1 Product Launch"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>

              {/* List Type Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Recipient List Type
                  </label>
                  <button
                    onClick={() => {
                      setAIContext('campaign');
                      setShowAIModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={() => setListType('static')}
                    className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                      listType === 'static'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                        : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="font-medium mb-1">Static List</div>
                    <div className="text-xs opacity-75">Manually select recipients</div>
                  </button>
                  <button
                    onClick={() => setListType('criteria')}
                    className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                      listType === 'criteria'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                        : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="font-medium mb-1">Criteria-Based</div>
                    <div className="text-xs opacity-75">Filter by conditions</div>
                  </button>
                  <button
                    onClick={() => setListType('dynamic')}
                    className={`px-4 py-3 text-sm rounded-lg border-2 transition-all ${
                      listType === 'dynamic'
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                        : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    <div className="font-medium mb-1">Dynamic Rules</div>
                    <div className="text-xs opacity-75">Auto-updating list</div>
                  </button>
                </div>

                {/* Static List - Manual Selection with Filters */}
                {listType === 'static' && (
                  <div className="border border-[var(--border)] rounded-lg p-4">
                    {/* Search and Filters */}
                    <div className="mb-4 space-y-3">
                      {/* Search Bar */}
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search contacts by name, email, or company..."
                          className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                        />
                      </div>

                      {/* Filter Chips */}
                      <div className="flex flex-wrap gap-2">
                        {/* Company Filter */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
                            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Company {selectedCompanies.length > 0 && `(${selectedCompanies.length})`}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {openDropdown === 'company' && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-10 min-w-[200px] max-h-[200px] overflow-y-auto">
                              {Array.from(new Set(availableContacts.map(c => c.company))).map(company => (
                                <label key={company} className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedCompanies.includes(company)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCompanies([...selectedCompanies, company]);
                                      } else {
                                        setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                                      }
                                    }}
                                    className="w-4 h-4 accent-[var(--primary)]"
                                  />
                                  <span className="text-xs">{company}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {openDropdown === 'type' && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-10 min-w-[150px]">
                              {Array.from(new Set(availableContacts.map(c => c.type))).map(type => (
                                <label key={type} className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedTypes.includes(type)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTypes([...selectedTypes, type]);
                                      } else {
                                        setSelectedTypes(selectedTypes.filter(t => t !== type));
                                      }
                                    }}
                                    className="w-4 h-4 accent-[var(--primary)]"
                                  />
                                  <span className="text-xs">{type}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tags Filter */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
                            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {openDropdown === 'tags' && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-md shadow-lg z-10 min-w-[150px]">
                              {['VIP', 'Decision Maker', 'Follow Up', 'Hot Lead', 'Cold Lead'].map(tag => (
                                <label key={tag} className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--muted)] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedTags.includes(tag)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTags([...selectedTags, tag]);
                                      } else {
                                        setSelectedTags(selectedTags.filter(t => t !== tag));
                                      }
                                    }}
                                    className="w-4 h-4 accent-[var(--primary)]"
                                  />
                                  <span className="text-xs">{tag}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Location Filter */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
                            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Status
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {/* Clear Filters */}
                        {(searchQuery || selectedCompanies.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0) && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCompanies([]);
                              setSelectedTypes([]);
                              setSelectedTags([]);
                            }}
                            className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Active Filter Tags */}
                      {(selectedCompanies.length > 0 || selectedTypes.length > 0 || selectedTags.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {selectedCompanies.map(company => (
                            <span key={company} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {company}
                              <button onClick={() => setSelectedCompanies(selectedCompanies.filter(c => c !== company))} className="hover:text-blue-900">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                          {selectedTypes.map(type => (
                            <span key={type} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              {type}
                              <button onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))} className="hover:text-green-900">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                          {selectedTags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                              {tag}
                              <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))} className="hover:text-purple-900">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bulk Actions Bar */}
                    {(() => {
                      const filteredContacts = availableContacts
                        .filter(contact => {
                          if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            return contact.name.toLowerCase().includes(query) ||
                                   contact.email.toLowerCase().includes(query) ||
                                   contact.company.toLowerCase().includes(query);
                          }
                          return true;
                        })
                        .filter(contact => {
                          if (selectedCompanies.length > 0) {
                            return selectedCompanies.includes(contact.company);
                          }
                          return true;
                        })
                        .filter(contact => {
                          if (selectedTypes.length > 0) {
                            return selectedTypes.includes(contact.type);
                          }
                          return true;
                        });

                      const allFilteredSelected = filteredContacts.length > 0 &&
                        filteredContacts.every(c => selectedContactIds.includes(c.id));

                      return (
                        <>
                          <div className="flex items-center justify-between py-2 px-3 bg-[var(--muted)]/30 rounded-md mb-2">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allFilteredSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedContactIds([...new Set([...selectedContactIds, ...filteredContacts.map(c => c.id)])]);
                                  } else {
                                    setSelectedContactIds(selectedContactIds.filter(id => !filteredContacts.some(c => c.id === id)));
                                  }
                                }}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-[var(--foreground)]">Select all ({filteredContacts.length})</span>
                            </label>
                            {selectedContactIds.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--muted-foreground)]">{selectedContactIds.length} selected</span>
                                <button
                                  onClick={() => {
                                    const contactsToAdd = availableContacts.filter(c => selectedContactIds.includes(c.id));
                                    setRecipientList([...recipientList, ...contactsToAdd.filter(c => !recipientList.some(r => r.id === c.id))]);
                                    setSelectedContactIds([]);
                                  }}
                                  className="px-3 py-1 text-xs bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary)]/90 transition-colors"
                                >
                                  Add Selected
                                </button>
                                <button
                                  onClick={() => setSelectedContactIds([])}
                                  className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                  Clear Selection
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Results List */}
                          <div className="max-h-[350px] overflow-y-auto space-y-2 mb-3">
                            {filteredContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className={`flex items-center gap-3 p-3 border rounded-md transition-colors ${
                                  selectedContactIds.includes(contact.id)
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                    : 'border-[var(--border)] hover:bg-[var(--muted)]/20'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedContactIds.includes(contact.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedContactIds([...selectedContactIds, contact.id]);
                                    } else {
                                      setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                                    }
                                  }}
                                  className="w-4 h-4 accent-[var(--primary)] flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">{contact.type}</span>
                                  </div>
                                  <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.company}</div>
                                  <div className="text-xs text-[var(--muted-foreground)] truncate">{contact.email}</div>
                                </div>
                                <button
                                  onClick={() => addToRecipientList(contact)}
                                  className="ml-3 px-3 py-1.5 text-xs text-[var(--primary)] border border-[var(--primary)] rounded-md hover:bg-[var(--primary)] hover:text-white transition-colors flex-shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}

                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {recipientList.length} recipients added to campaign
                      </div>
                      {recipientList.length > 0 && (
                        <button
                          onClick={() => setRecipientList([])}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Clear all recipients
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Criteria-Based List */}
                {listType === 'criteria' && (
                  <div className="border border-[var(--border)] rounded-lg p-4">
                    <div className="mb-3">
                      <label className="text-sm font-medium text-[var(--foreground)]">
                        Define Criteria
                      </label>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        The list will be generated once when the campaign is created, based on the criteria below.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {campaignConditionGroups.map((group, groupIndex) => (
                        <div key={group.id} className="border border-[var(--border)] rounded-lg p-4">
                          {groupIndex > 0 && (
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Group Logic:</span>
                                <select
                                  value={group.logic}
                                  onChange={(e) => updateCampaignGroupLogic(group.id, e.target.value as 'AND' | 'OR')}
                                  className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:12px] bg-[position:right_8px_center] bg-no-repeat"
                                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                >
                                  <option value="AND">AND</option>
                                  <option value="OR">OR</option>
                                </select>
                                <span className="text-xs text-[var(--muted-foreground)]">with previous group</span>
                              </div>
                              <button
                                onClick={() => removeCampaignConditionGroup(group.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          )}

                          <div className="space-y-3">
                            {group.conditions.map((condition, conditionIndex) => {
                              const selectedField = getFieldsForEntity(condition.entity).find(f => f.value === condition.field);
                              const availableOperators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];

                              return (
                                <div key={condition.id}>
                                  {conditionIndex > 0 && (
                                    <div className="flex items-center gap-2 my-2">
                                      <div className="flex-1 border-t border-[var(--border)]"></div>
                                      <span className="text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                                        {group.logic}
                                      </span>
                                      <div className="flex-1 border-t border-[var(--border)]"></div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-3">
                                      <select
                                        value={condition.entity}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'entity', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
                                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                      >
                                        <option value="">Select entity...</option>
                                        <option value="Contact">Contact</option>
                                        <option value="Job">Job</option>
                                        <option value="Company">Company</option>
                                        <option value="Pre-Opportunity">Pre-Opportunity</option>
                                        <option value="Quote">Quote</option>
                                      </select>
                                    </div>
                                    <div className="col-span-3">
                                      <select
                                        value={condition.field}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'field', e.target.value)}
                                        disabled={!condition.entity}
                                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                      >
                                        <option value="">Select field...</option>
                                        {getFieldsForEntity(condition.entity).map(field => (
                                          <option key={field.value} value={field.value}>{field.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-span-2">
                                      <select
                                        value={condition.operator}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'operator', e.target.value)}
                                        disabled={!condition.field}
                                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                      >
                                        <option value="">Operator...</option>
                                        {availableOperators.map(op => (
                                          <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-span-3">
                                      <input
                                        type="text"
                                        value={condition.value}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'value', e.target.value)}
                                        placeholder="Value..."
                                        disabled={!condition.operator}
                                        className="w-full px-2 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                                      />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                      {group.conditions.length > 1 && (
                                        <button
                                          onClick={() => removeCampaignCondition(group.id, condition.id)}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => addCampaignCondition(group.id)}
                            className="mt-3 flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                            </svg>
                            Add {group.logic} condition
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addCampaignConditionGroup}
                      className="mt-3 flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      Add OR condition group
                    </button>
                  </div>
                )}

                {/* Dynamic Rules - Same as Criteria but Always Dynamic */}
                {listType === 'dynamic' && (
                  <div className="border border-[var(--border)] rounded-lg p-4">
                    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex gap-2">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-green-900">
                          <strong>Dynamic rules enabled:</strong> This list is automatically evaluated daily and recipients are added/removed based on the rules below.
                        </div>
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-[var(--foreground)] mb-3">
                      Define Rules
                    </label>

                    {/* Same condition builder as criteria */}
                    <div className="space-y-4">
                      {campaignConditionGroups.map((group, groupIndex) => (
                        <div key={group.id} className="border border-[var(--border)] rounded-lg p-4">
                          {groupIndex > 0 && (
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Group Logic:</span>
                                <select
                                  value={group.logic}
                                  onChange={(e) => updateCampaignGroupLogic(group.id, e.target.value as 'AND' | 'OR')}
                                  className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:12px] bg-[position:right_8px_center] bg-no-repeat"
                                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                >
                                  <option value="AND">AND</option>
                                  <option value="OR">OR</option>
                                </select>
                                <span className="text-xs text-[var(--muted-foreground)]">with previous group</span>
                              </div>
                              <button
                                onClick={() => removeCampaignConditionGroup(group.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          )}

                          <div className="space-y-3">
                            {group.conditions.map((condition, conditionIndex) => {
                              const selectedField = getFieldsForEntity(condition.entity).find(f => f.value === condition.field);
                              const availableOperators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];

                              return (
                                <div key={condition.id}>
                                  {conditionIndex > 0 && (
                                    <div className="flex items-center gap-2 my-2">
                                      <div className="flex-1 border-t border-[var(--border)]"></div>
                                      <span className="text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                                        {group.logic}
                                      </span>
                                      <div className="flex-1 border-t border-[var(--border)]"></div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-3">
                                      <select
                                        value={condition.entity}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'entity', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
                                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                      >
                                        <option value="">Select entity...</option>
                                        <option value="Contact">Contact</option>
                                        <option value="Job">Job</option>
                                        <option value="Company">Company</option>
                                        <option value="Pre-Opportunity">Pre-Opportunity</option>
                                        <option value="Quote">Quote</option>
                                      </select>
                                    </div>
                                    <div className="col-span-3">
                                      <select
                                        value={condition.field}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'field', e.target.value)}
                                        disabled={!condition.entity}
                                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                      >
                                        <option value="">Select field...</option>
                                        {getFieldsForEntity(condition.entity).map(field => (
                                          <option key={field.value} value={field.value}>{field.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-span-2">
                                      <select
                                        value={condition.operator}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'operator', e.target.value)}
                                        disabled={!condition.field}
                                        className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                                        style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                      >
                                        <option value="">Operator...</option>
                                        {availableOperators.map(op => (
                                          <option key={op.value} value={op.value}>{op.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-span-3">
                                      <input
                                        type="text"
                                        value={condition.value}
                                        onChange={(e) => updateCampaignCondition(group.id, condition.id, 'value', e.target.value)}
                                        placeholder="Value..."
                                        disabled={!condition.operator}
                                        className="w-full px-2 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
                                      />
                                    </div>
                                    <div className="col-span-1 flex items-center justify-center">
                                      {group.conditions.length > 1 && (
                                        <button
                                          onClick={() => removeCampaignCondition(group.id, condition.id)}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => addCampaignCondition(group.id)}
                            className="mt-3 flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                            </svg>
                            Add {group.logic} condition
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addCampaignConditionGroup}
                      className="mt-3 flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                      </svg>
                      Add OR condition group
                    </button>
                  </div>
                )}
              </div>

              {/* Email Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>

              {/* Email Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter base email content... AI will personalize for each recipient."
                  rows={12}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none bg-[var(--background)]"
                />
              </div>

              {/* AI Personalization */}
              <div className="mb-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <input
                  type="checkbox"
                  id="campaign-ai-personalization"
                  checked={useAIPersonalization}
                  onChange={(e) => setUseAIPersonalization(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)]"
                />
                <label htmlFor="campaign-ai-personalization" className="text-sm text-blue-900">
                  Enable AI personalization per recipient
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
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[var(--background)] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                >
                  <option value="fast">Fast (500/hour)</option>
                  <option value="medium">Medium (200/hour)</option>
                  <option value="slow">Slow (100/hour)</option>
                  <option value="very-slow">Very Slow (50/hour)</option>
                  <option value="randomized">Randomized (Human-like)</option>
                </select>
              </div>

              {/* Max Per Day */}
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
                  Create Campaign
                </button>
                <button className="px-4 py-2 border border-[var(--border)] rounded-lg font-medium text-sm hover:bg-[var(--muted)] transition-colors">
                  Save as Draft
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Info & Selected Recipients */}
          <div className="col-span-4 space-y-4">
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">About List Types</h3>
              <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <div>
                  <strong className="text-[var(--foreground)]">Static List:</strong>
                  <p className="mt-1">Manually select specific recipients. The list remains fixed once created.</p>
                </div>
                <div>
                  <strong className="text-[var(--foreground)]">Criteria-Based:</strong>
                  <p className="mt-1">Define conditions to filter recipients. Optionally make it dynamic to auto-update daily.</p>
                </div>
                <div>
                  <strong className="text-[var(--foreground)]">Dynamic Rules:</strong>
                  <p className="mt-1">Automatically evaluates rules daily. Recipients are added/removed based on current data.</p>
                </div>
              </div>
            </div>

            {listType === 'static' && recipientList.length > 0 && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Selected Recipients ({recipientList.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                </div>
              </div>
            )}

            {(listType === 'criteria' || listType === 'dynamic') && (
              <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Estimated Recipients</h3>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-[var(--foreground)] mb-2">~45</div>
                  <div className="text-sm text-[var(--muted-foreground)]">recipients match your criteria</div>
                </div>
              </div>
            )}
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

              {/* Trigger Conditions */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    Trigger When
                  </label>
                  <button
                    onClick={() => {
                      setAIContext('rule');
                      setShowAIModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </button>
                </div>

                <div className="space-y-4">
                  {ruleConditionGroups.map((group, groupIndex) => (
                    <div key={group.id} className="border border-[var(--border)] rounded-lg p-4">
                      {groupIndex > 0 && (
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--muted-foreground)] uppercase">Group Logic:</span>
                            <select
                              value={group.logic}
                              onChange={(e) => updateGroupLogic(group.id, e.target.value as 'AND' | 'OR')}
                              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:12px] bg-[position:right_8px_center] bg-no-repeat"
                              style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                            <span className="text-xs text-[var(--muted-foreground)]">with previous group</span>
                          </div>
                          <button
                            onClick={() => removeConditionGroup(group.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove group"
                          >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      )}

                      <div className="space-y-3">
                        {group.conditions.map((condition, conditionIndex) => {
                          const selectedField = getFieldsForEntity(condition.entity).find(f => f.value === condition.field);
                          const availableOperators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];

                          return (
                            <div key={condition.id}>
                              {conditionIndex > 0 && (
                                <div className="flex items-center gap-2 my-2">
                                  <div className="flex-1 border-t border-[var(--border)]"></div>
                                  <span className="text-xs font-semibold text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded">
                                    {group.logic}
                                  </span>
                                  <div className="flex-1 border-t border-[var(--border)]"></div>
                                </div>
                              )}

                              <div className="grid grid-cols-12 gap-2">
                                {/* Entity Selection */}
                                <div className="col-span-3">
                                  <select
                                    value={condition.entity}
                                    onChange={(e) => updateCondition(group.id, condition.id, 'entity', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
                                    style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                  >
                                    <option value="">Select entity...</option>
                                    <option value="Contact">Contact</option>
                                    <option value="Job">Job</option>
                                    <option value="Company">Company</option>
                                    <option value="Pre-Opportunity">Pre-Opportunity</option>
                                    <option value="Quote">Quote</option>
                                  </select>
                                </div>

                                {/* Field Selection */}
                                <div className="col-span-3">
                                  <select
                                    value={condition.field}
                                    onChange={(e) => updateCondition(group.id, condition.id, 'field', e.target.value)}
                                    disabled={!condition.entity}
                                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                                    style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                  >
                                    <option value="">Select field...</option>
                                    {getFieldsForEntity(condition.entity).map(field => (
                                      <option key={field.value} value={field.value}>{field.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Operator Selection */}
                                <div className="col-span-2">
                                  <select
                                    value={condition.operator}
                                    onChange={(e) => updateCondition(group.id, condition.id, 'operator', e.target.value)}
                                    disabled={!condition.field}
                                    className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)]"
                                    style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
                                  >
                                    <option value="">Operator...</option>
                                    {availableOperators.map(op => (
                                      <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Value Input */}
                                <div className="col-span-3">
                                  <input
                                    type="text"
                                    value={condition.value}
                                    onChange={(e) => updateCondition(group.id, condition.id, 'value', e.target.value)}
                                    placeholder="Value..."
                                    disabled={!condition.operator}
                                    className="w-full px-2 py-2 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>

                                {/* Remove Condition Button */}
                                <div className="col-span-1 flex items-center justify-center">
                                  {group.conditions.length > 1 && (
                                    <button
                                      onClick={() => removeCondition(group.id, condition.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Remove condition"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Condition to Group */}
                      <button
                        onClick={() => addCondition(group.id)}
                        className="mt-3 flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                        </svg>
                        Add {group.logic} condition
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Condition Group */}
                <button
                  onClick={addConditionGroup}
                  className="mt-3 flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 6v8M6 10h8" strokeLinecap="round"/>
                  </svg>
                  Add OR condition group
                </button>
              </div>

              {/* Communication Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Communication Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCommunicationType('email')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      communicationType === 'email'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setCommunicationType('notification')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      communicationType === 'notification'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                    }`}
                  >
                    Notification
                  </button>
                  <button
                    onClick={() => setCommunicationType('both')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      communicationType === 'both'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              {/* Audience Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsInternalCommunication(false)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      !isInternalCommunication
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                    }`}
                  >
                    External
                  </button>
                  <button
                    onClick={() => setIsInternalCommunication(true)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      isInternalCommunication
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/70'
                    }`}
                  >
                    Internal
                  </button>
                </div>
              </div>

              {/* Email Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  {communicationType === 'notification' ? 'Notification Title' : 'Email Subject'}
                </label>
                <input
                  type="text"
                  placeholder={communicationType === 'notification' ? 'Enter notification title' : 'Enter email subject'}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)]"
                />
              </div>

              {/* Email Body / Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  {communicationType === 'notification' ? 'Message' : 'Email Body'}
                </label>
                <textarea
                  rows={10}
                  placeholder={communicationType === 'notification' ? 'Compose your notification message...' : 'Compose your email...'}
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
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm hover:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors cursor-pointer appearance-none bg-[var(--background)] bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat"
                  style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")"}}
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

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {aiContext === 'campaign' ? 'Generate Campaign with AI' : 'Generate Rule with AI'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Describe what you want to create and AI will build it for you
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAIPrompt('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {aiContext === 'campaign'
                  ? 'Describe your campaign goal and target audience'
                  : 'Describe when this rule should trigger and what it should do'}
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                placeholder={
                  aiContext === 'campaign'
                    ? 'Example: Create a campaign to reach out to all electrical contractors in California who haven\'t been contacted in the last 6 months. Focus on our new energy-efficient lighting products.'
                    : 'Example: When a new contact is added with the title "Project Manager" at a general contractor company, send them a welcome email introducing our building automation services.'
                }
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Be specific about your criteria, target audience, and desired outcome. The more detail you provide, the better AI can generate your {aiContext === 'campaign' ? 'campaign' : 'rule'}.</span>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setAIPrompt('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // AI generation logic would go here
                  console.log('Generating with AI:', { context: aiContext, prompt: aiPrompt });
                  // For now, just close the modal
                  setShowAIModal(false);
                  setAIPrompt('');
                }}
                disabled={!aiPrompt.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

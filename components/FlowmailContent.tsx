'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdvancedFilters from './AdvancedFilters';
import CampaignCompose from './flowmail/CampaignCompose';
import WorkflowSelector from './flowmail/WorkflowSelector';
import { mockSpecSheets } from '@/lib/data/submittals-mock';
import type { SpecSheet } from '@/lib/types/submittals';

// ============================================
// TYPES
// ============================================

type EmailParticipant = {
  email: string;
  name: string;
  contactId?: string;
};

type Attachment = {
  id: string;
  name: string;
  size: string;
  type: string;
};

type Email = {
  id: string;
  threadId: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  subject: string;
  body: string;
  bodyHtml: string;
  date: string;
  read: boolean;
  starred: boolean;
  hasAttachments: boolean;
  attachments: Attachment[];
  labels: string[];
  tags: string[];
  category: 'Projects' | 'Sales' | 'Support' | 'Partnerships' | 'Documentation' | 'Internal' | 'Other';
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive';
  provider: 'gmail' | 'microsoft365';
  associatedJobs?: string[];
  associatedQuotes?: string[];
  associatedCompanies?: string[];
  priority: 'high' | 'normal' | 'low';
  processed: boolean;
  processedDate?: string;
  createdTaskId?: string;
  followUp?: {
    date: string;
    dismissOnReply: boolean;
    notes?: string;
    createdDate: string;
  };
  filed?: {
    category: string;
    subcategories: string[];
    tags: string[];
    filedDate: string;
    autoFiled: boolean;
  };
};

type FollowUp = {
  emailId: string;
  date: string;
  dismissOnReply: boolean;
  createdDate: string;
};

type ColumnId = 'actions' | 'file' | 'star' | 'fromTo' | 'participants' | 'subject' | 'category' | 'priority' | 'tags' | 'jobs' | 'quotes' | 'companies' | 'date' | 'status';

type ColumnConfig = {
  id: ColumnId;
  label: string;
  visible: boolean;
  width: string;
};

type SavedColumnLayout = {
  id: string;
  name: string;
  columns: ColumnId[];
  isDefault?: boolean;
};

const ALL_COLUMNS: { id: ColumnId; label: string; width: string }[] = [
  { id: 'actions', label: 'Actions', width: 'w-[120px]' },
  { id: 'file', label: 'File', width: 'w-[100px]' },
  { id: 'star', label: 'Star', width: 'w-8' },
  { id: 'fromTo', label: 'From/To', width: 'w-[180px]' },
  { id: 'participants', label: 'Participants', width: 'w-[140px]' },
  { id: 'subject', label: 'Subject', width: 'min-w-[250px]' },
  { id: 'category', label: 'Category', width: 'w-[120px]' },
  { id: 'priority', label: 'Priority', width: 'w-[100px]' },
  { id: 'tags', label: 'Tags', width: 'w-[150px]' },
  { id: 'jobs', label: 'Jobs', width: 'w-[180px]' },
  { id: 'quotes', label: 'Quotes', width: 'w-[150px]' },
  { id: 'companies', label: 'Companies', width: 'w-[150px]' },
  { id: 'date', label: 'Date', width: 'w-[100px]' },
  { id: 'status', label: 'Status', width: 'w-[100px]' },
];

const DEFAULT_LAYOUTS: SavedColumnLayout[] = [
  {
    id: 'default',
    name: 'Default View',
    columns: ['actions', 'file', 'star', 'fromTo', 'participants', 'subject', 'category', 'priority', 'tags', 'jobs', 'quotes', 'companies', 'date', 'status'],
    isDefault: true,
  },
  {
    id: 'compact',
    name: 'Compact View',
    columns: ['actions', 'file', 'star', 'fromTo', 'subject', 'date', 'status'],
  },
  {
    id: 'sales',
    name: 'Sales Focus',
    columns: ['actions', 'file', 'star', 'fromTo', 'subject', 'jobs', 'quotes', 'companies', 'priority', 'date'],
  },
];

type CreatedTask = {
  id: string;
  emailId: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed';
  createdDate: string;
};

type Activity = {
  id: string;
  type: 'call' | 'email' | 'note' | 'meeting' | 'task';
  description: string;
  date: string;
};

type Note = {
  id: string;
  title: string;
  content: string;
  date: string;
};

type Task = {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
};

type IngestionRuleCondition =
  | { type: 'sender'; value: string }
  | { type: 'senderDomain'; value: string }
  | { type: 'recipient'; value: string }
  | { type: 'subjectContains'; value: string }
  | { type: 'bodyContains'; value: string }
  | { type: 'hasAttachment'; value: boolean };

type IngestionRule = {
  id: string;
  name: string;
  enabled: boolean;
  conditions: IngestionRuleCondition[];
  action: 'process' | 'skip' | 'file';
  fileCategory?: string;
  fileSubcategory?: string;
};

type Job = {
  id: string;
  name: string;
  status: string;
  value: string;
  gc: string;
  ec: string;
};

type Quote = {
  id: string;
  name: string;
  stage: string;
  value: string;
  expirationDate: string;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
};

type ContactContext = {
  contact: Contact;
  recentActivity: Activity[];
  notes: Note[];
  tasks: Task[];
  jobs: Job[];
  quotes: Quote[];
};

type EmailToneStyle = {
  id: string;
  name: string;
  description: string;
  tone: 'formal' | 'friendly' | 'professional' | 'casual' | 'urgent' | 'custom';
  customInstructions?: string;
  isDefault: boolean;
  createdDate: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  category: 'follow-up' | 'introduction' | 'quote-request' | 'thank-you' | 'meeting' | 'custom';
  placeholders: string[];
  createdDate: string;
};

type MeetingAttendee = {
  email: string;
  name: string;
  type: 'required' | 'optional';
  contactId?: string;
};

type Meeting = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string;
  isOnline: boolean;
  teamsLink?: string;
  requiredAttendees: MeetingAttendee[];
  optionalAttendees: MeetingAttendee[];
  showAs: 'busy' | 'free' | 'tentative' | 'out-of-office';
  reminder: number; // minutes before
  isRecurring: boolean;
  recurrencePattern?: string;
  category?: string;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  isInPerson: boolean;
  organizer: MeetingAttendee;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'none';
  createdFromEmailId?: string;
  associatedJobs?: string[];
  associatedQuotes?: string[];
  associatedCompanies?: string[];
  followUp?: {
    date: string;
    note?: string;
  };
  filed?: {
    category: string;
    subcategories?: string[];
  };
};

// ============================================
// MOCK DATA
// ============================================

const mockContacts: Contact[] = [
  { id: 'c1', name: 'Sarah Johnson', email: 'sarah.johnson@builderco.com', phone: '(555) 123-4567', company: 'BuilderCo Construction', role: 'Project Manager' },
  { id: 'c2', name: 'Marcus Chen', email: 'marcus.chen@deltamechanical.com', phone: '(555) 234-5678', company: 'Delta Mechanical', role: 'Lead Engineer' },
  { id: 'c3', name: 'Emily Rodriguez', email: 'emily.r@skylinearch.com', phone: '(555) 345-6789', company: 'Skyline Architects', role: 'Senior Architect' },
  { id: 'c4', name: 'James Wilson', email: 'jwilson@precisionelec.com', phone: '(555) 456-7890', company: 'Precision Electric', role: 'Sales Director' },
  { id: 'c5', name: 'Amanda Foster', email: 'afoster@greenbuild.com', phone: '(555) 567-8901', company: 'GreenBuild Solutions', role: 'Sustainability Manager' },
];

const mockContactContexts: Record<string, ContactContext> = {
  'c1': {
    contact: mockContacts[0],
    recentActivity: [
      { id: 'a1', type: 'call', description: 'Discussed project timeline for Downtown Plaza', date: '2025-01-20' },
      { id: 'a2', type: 'email', description: 'Sent updated proposal', date: '2025-01-18' },
      { id: 'a3', type: 'meeting', description: 'Site visit at BuilderCo offices', date: '2025-01-15' },
    ],
    notes: [
      { id: 'n1', title: 'Budget Concerns', content: 'Sarah mentioned budget constraints for Q2. Need to propose cost-effective alternatives.', date: '2025-01-20' },
      { id: 'n2', title: 'Preferred Vendors', content: 'BuilderCo prefers working with certified green vendors.', date: '2025-01-10' },
    ],
    tasks: [
      { id: 't1', title: 'Send revised quote', dueDate: '2025-01-25', status: 'pending' },
      { id: 't2', title: 'Schedule follow-up call', dueDate: '2025-01-22', status: 'completed' },
    ],
    jobs: [
      { id: 'j1', name: 'Downtown Plaza Renovation', status: 'Bidding', value: '$2.4M', gc: 'BuilderCo Construction', ec: 'Precision Electric' },
      { id: 'j2', name: 'BuilderCo HQ Expansion', status: 'Active', value: '$890K', gc: 'BuilderCo Construction', ec: 'FlowConnect' },
    ],
    quotes: [
      { id: 'q1', name: 'Downtown Plaza - Lighting Package', stage: 'Sent', value: '$245,000', expirationDate: '2025-02-15' },
      { id: 'q2', name: 'HQ Expansion - Phase 2', stage: 'Draft', value: '$78,500', expirationDate: '2025-02-28' },
    ],
  },
  'c2': {
    contact: mockContacts[1],
    recentActivity: [
      { id: 'a4', type: 'email', description: 'Received specs for hospital project', date: '2025-01-19' },
      { id: 'a5', type: 'note', description: 'Added technical requirements note', date: '2025-01-17' },
    ],
    notes: [
      { id: 'n3', title: 'Technical Requirements', content: 'Marcus requires all fixtures to be UL listed and ASHRAE compliant.', date: '2025-01-17' },
    ],
    tasks: [
      { id: 't3', title: 'Review mechanical drawings', dueDate: '2025-01-26', status: 'pending' },
    ],
    jobs: [
      { id: 'j3', name: 'Hospital Expansion Project', status: 'Bidding', value: '$5.2M', gc: 'Delta Mechanical', ec: 'FlowConnect' },
    ],
    quotes: [
      { id: 'q3', name: 'Hospital HVAC Controls', stage: 'Review', value: '$320,000', expirationDate: '2025-02-20' },
    ],
  },
  'c3': {
    contact: mockContacts[2],
    recentActivity: [
      { id: 'a6', type: 'meeting', description: 'Design review meeting', date: '2025-01-18' },
    ],
    notes: [],
    tasks: [],
    jobs: [
      { id: 'j4', name: 'Office Complex Lighting', status: 'Classification', value: '$1.8M', gc: 'Skyline Architects', ec: 'TBD' },
    ],
    quotes: [],
  },
  'c4': {
    contact: mockContacts[3],
    recentActivity: [
      { id: 'a7', type: 'call', description: 'Discussed partnership opportunities', date: '2025-01-21' },
      { id: 'a8', type: 'email', description: 'Sent product catalog', date: '2025-01-16' },
    ],
    notes: [
      { id: 'n4', title: 'Partnership Interest', content: 'James expressed interest in becoming a distributor for our LED panels.', date: '2025-01-21' },
    ],
    tasks: [
      { id: 't4', title: 'Prepare distributor agreement draft', dueDate: '2025-01-28', status: 'pending' },
    ],
    jobs: [],
    quotes: [
      { id: 'q4', name: 'Distributor Sample Kit', stage: 'Draft', value: '$5,200', expirationDate: '2025-03-01' },
    ],
  },
  'c5': {
    contact: mockContacts[4],
    recentActivity: [
      { id: 'a9', type: 'email', description: 'Shared sustainability certifications', date: '2025-01-20' },
    ],
    notes: [
      { id: 'n5', title: 'Green Certifications', content: 'Amanda needs LEED documentation for all products.', date: '2025-01-20' },
    ],
    tasks: [
      { id: 't5', title: 'Gather LEED certification docs', dueDate: '2025-01-30', status: 'pending' },
    ],
    jobs: [
      { id: 'j5', name: 'GreenBuild Campus Retrofit', status: 'Pre-Opportunity', value: '$3.1M', gc: 'GreenBuild Solutions', ec: 'TBD' },
    ],
    quotes: [],
  },
};

const mockEmails: Email[] = [
  {
    id: 'e1',
    threadId: 't1',
    from: { email: 'sarah.johnson@builderco.com', name: 'Sarah Johnson', contactId: 'c1' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Re: Downtown Plaza Renovation - Updated Timeline',
    body: `Hi,

I wanted to follow up on our call from yesterday. After discussing with our team, we've decided to push the project start date to March 15th to allow for additional planning.

Can we schedule a call this week to discuss the revised fixture specifications? I have some concerns about the lead times for the custom pendant lights we discussed.

Also, please send over the updated quote when you have a chance. Our budget review is coming up next week.

Best regards,
Sarah Johnson
Project Manager
BuilderCo Construction`,
    bodyHtml: '',
    date: '2025-01-22T09:30:00Z',
    read: false,
    starred: true,
    hasAttachments: false,
    attachments: [],
    labels: ['Important'],
    tags: ['Timeline', 'Follow-up', 'Quote Request'],
    category: 'Projects',
    folder: 'inbox',
    provider: 'microsoft365',
    associatedJobs: ['Downtown Plaza Renovation'],
    associatedQuotes: ['Downtown Plaza - Lighting Package'],
    associatedCompanies: ['BuilderCo Construction'],
    priority: 'high',
    processed: true,
    processedDate: '2025-01-22T10:00:00Z',
  },
  {
    id: 'e2',
    threadId: 't2',
    from: { email: 'marcus.chen@deltamechanical.com', name: 'Marcus Chen', contactId: 'c2' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [{ email: 'emily.r@skylinearch.com', name: 'Emily Rodriguez', contactId: 'c3' }],
    subject: 'Hospital Expansion - Electrical Coordination Meeting',
    body: `Team,

I'm scheduling a coordination meeting for the hospital expansion project. We need to align on the electrical distribution layout before we can finalize the mechanical routing.

Please review the attached drawings and come prepared to discuss:
1. Main switchgear location
2. Generator backup requirements
3. Emergency lighting placement

Meeting: Thursday, Jan 25th at 2:00 PM
Location: Delta Mechanical Conference Room or Teams

Let me know if you have any conflicts.

Thanks,
Marcus Chen
Lead Engineer
Delta Mechanical`,
    bodyHtml: '',
    date: '2025-01-21T14:15:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [
      { id: 'att1', name: 'Hospital_Electrical_Layout_v2.pdf', size: '2.4 MB', type: 'application/pdf' },
      { id: 'att2', name: 'Coordination_Schedule.xlsx', size: '156 KB', type: 'application/xlsx' },
    ],
    labels: ['Projects'],
    tags: ['Meeting', 'Coordination', 'Healthcare'],
    category: 'Projects',
    folder: 'inbox',
    provider: 'gmail',
    associatedJobs: ['Hospital Expansion Project'],
    associatedQuotes: ['Hospital HVAC Controls'],
    associatedCompanies: ['Delta Mechanical', 'Skyline Architects'],
    priority: 'normal',
    processed: false,
  },
  {
    id: 'e3',
    threadId: 't3',
    from: { email: 'jwilson@precisionelec.com', name: 'James Wilson', contactId: 'c4' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Partnership Opportunity - LED Product Line',
    body: `Hello,

Great speaking with you earlier today! As discussed, Precision Electric is very interested in becoming an authorized distributor for your LED panel product line.

Our key points of interest:
- Exclusive territory rights for the Southwest region
- Volume discount structure
- Marketing support and co-op funds
- Technical training for our sales team

I've attached our company profile and financial statements as requested. Please review and let me know what additional information you need to move forward.

Looking forward to a mutually beneficial partnership.

Best,
James Wilson
Sales Director
Precision Electric`,
    bodyHtml: '',
    date: '2025-01-21T11:00:00Z',
    read: true,
    starred: true,
    hasAttachments: true,
    attachments: [
      { id: 'att3', name: 'Precision_Electric_Profile.pdf', size: '1.8 MB', type: 'application/pdf' },
    ],
    labels: ['Partnerships'],
    tags: ['Partnership', 'Distribution', 'LED', 'Negotiation'],
    category: 'Partnerships',
    folder: 'inbox',
    provider: 'microsoft365',
    associatedJobs: [],
    associatedQuotes: ['Distributor Sample Kit'],
    associatedCompanies: ['Precision Electric'],
    priority: 'high',
    processed: true,
    processedDate: '2025-01-21T12:00:00Z',
    createdTaskId: 't-email-3',
  },
  {
    id: 'e4',
    threadId: 't4',
    from: { email: 'afoster@greenbuild.com', name: 'Amanda Foster', contactId: 'c5' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'LEED Certification Documentation Request',
    body: `Hi there,

For our upcoming campus retrofit project, we need to ensure all lighting products meet LEED v4.1 requirements.

Could you please provide the following documentation for the products in your catalog:
- Energy Star certifications
- LM-79 and LM-80 test reports
- IES files for all fixtures
- Environmental product declarations (EPDs)
- Mercury content statements

We're targeting LEED Platinum certification, so this documentation is critical for our submission.

Timeline: We need these by end of month if possible.

Thanks for your help!
Amanda Foster
Sustainability Manager
GreenBuild Solutions`,
    bodyHtml: '',
    date: '2025-01-20T16:45:00Z',
    read: false,
    starred: false,
    hasAttachments: false,
    attachments: [],
    labels: ['Documentation'],
    tags: ['LEED', 'Certification', 'Documentation', 'Sustainability'],
    category: 'Documentation',
    folder: 'inbox',
    provider: 'gmail',
    associatedJobs: ['GreenBuild Campus Retrofit'],
    associatedQuotes: [],
    associatedCompanies: ['GreenBuild Solutions'],
    priority: 'normal',
    processed: false,
  },
  {
    id: 'e5',
    threadId: 't5',
    from: { email: 'me@flowconnect.com', name: 'Current User' },
    to: [{ email: 'sarah.johnson@builderco.com', name: 'Sarah Johnson', contactId: 'c1' }],
    cc: [],
    subject: 'Downtown Plaza Renovation - Initial Proposal',
    body: `Hi Sarah,

Thank you for meeting with us last week to discuss the Downtown Plaza Renovation project.

As promised, I'm attaching our initial lighting proposal that includes:
- Complete fixture schedule
- Preliminary pricing
- Estimated lead times
- Energy savings calculations

Please review and let me know if you have any questions. I'm happy to schedule a follow-up call to walk through the details.

Best regards`,
    bodyHtml: '',
    date: '2025-01-18T10:30:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [
      { id: 'att4', name: 'Downtown_Plaza_Proposal.pdf', size: '3.2 MB', type: 'application/pdf' },
    ],
    labels: [],
    tags: ['Proposal', 'Lighting', 'Commercial'],
    category: 'Sales',
    folder: 'sent',
    provider: 'microsoft365',
    associatedJobs: ['Downtown Plaza Renovation'],
    associatedQuotes: ['Downtown Plaza - Lighting Package'],
    associatedCompanies: ['BuilderCo Construction'],
    priority: 'normal',
    processed: true,
    processedDate: '2025-01-18T11:00:00Z',
  },
  {
    id: 'e6',
    threadId: 't1',
    from: { email: 'me@flowconnect.com', name: 'Current User' },
    to: [{ email: 'sarah.johnson@builderco.com', name: 'Sarah Johnson', contactId: 'c1' }],
    cc: [],
    subject: 'Re: Downtown Plaza Renovation - Updated Timeline',
    body: `Hi Sarah,

Thanks for the update on the timeline change. March 15th works well for us and actually gives us better lead time for those custom pendants.

I'm available for a call on Thursday or Friday this week. Does 2 PM on either day work for you?

I'll have the updated quote ready by end of day tomorrow.

Best regards`,
    bodyHtml: '',
    date: '2025-01-22T11:15:00Z',
    read: true,
    starred: false,
    hasAttachments: false,
    attachments: [],
    labels: [],
    tags: ['Follow-up', 'Scheduling'],
    category: 'Projects',
    folder: 'sent',
    provider: 'microsoft365',
    associatedJobs: ['Downtown Plaza Renovation'],
    associatedQuotes: ['Downtown Plaza - Lighting Package'],
    associatedCompanies: ['BuilderCo Construction'],
    priority: 'normal',
    processed: false,
  },
  // Filed emails for demonstrating hierarchical view
  {
    id: 'e7',
    threadId: 't7',
    from: { email: 'john.smith@acmecorp.com', name: 'John Smith', contactId: 'c6' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Q4 Contract Renewal - Signed Documents',
    body: `Hi,

Please find attached the signed contract renewal documents for Q4. All terms have been approved by our legal team.

Looking forward to another great year of partnership.

Best,
John Smith
VP of Procurement
Acme Corp`,
    bodyHtml: '',
    date: '2025-01-15T09:00:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [{ id: 'att5', name: 'Contract_Renewal_Signed.pdf', size: '1.2 MB', type: 'application/pdf' }],
    labels: ['Contracts'],
    tags: ['Contract', 'Renewal', 'Q4'],
    category: 'Sales',
    folder: 'inbox',
    provider: 'gmail',
    associatedJobs: [],
    associatedQuotes: [],
    associatedCompanies: ['Acme Corp'],
    priority: 'high',
    processed: true,
    processedDate: '2025-01-15T09:30:00Z',
    filed: {
      category: 'Contracts',
      subcategories: ['Sales', 'Renewals'],
      tags: ['Q4', 'Signed', 'High Priority'],
      filedDate: '2025-01-15T10:00:00Z',
      autoFiled: false,
    },
  },
  {
    id: 'e8',
    threadId: 't8',
    from: { email: 'lisa.wang@techstart.io', name: 'Lisa Wang', contactId: 'c7' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'New Project Inquiry - Office Renovation',
    body: `Hello,

We're planning a complete office renovation and need lighting solutions for our 50,000 sq ft space.

Requirements:
- Energy efficient LED fixtures
- Smart lighting controls
- Conference room specialty lighting

Can you provide a consultation and preliminary quote?

Thanks,
Lisa Wang
Facilities Manager
TechStart Inc`,
    bodyHtml: '',
    date: '2025-01-18T14:30:00Z',
    read: true,
    starred: true,
    hasAttachments: false,
    attachments: [],
    labels: ['Sales'],
    tags: ['New Lead', 'Commercial', 'Lighting'],
    category: 'Sales',
    folder: 'inbox',
    provider: 'microsoft365',
    associatedJobs: [],
    associatedQuotes: [],
    associatedCompanies: ['TechStart Inc'],
    priority: 'high',
    processed: true,
    processedDate: '2025-01-18T15:00:00Z',
    filed: {
      category: 'Projects',
      subcategories: ['Active', 'Commercial', 'Office'],
      tags: ['New Lead', 'High Value'],
      filedDate: '2025-01-18T15:30:00Z',
      autoFiled: false,
    },
  },
  {
    id: 'e9',
    threadId: 't9',
    from: { email: 'mike.davis@legalsolutions.com', name: 'Mike Davis', contactId: 'c8' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'NDA and Partnership Agreement Review',
    body: `Hi Team,

Attached are the NDA and partnership agreement documents for your review. Please note the following key points:

1. Exclusivity clause in Section 4.2
2. Termination terms in Section 7
3. IP ownership provisions in Section 9

Let me know if you have any questions or need revisions.

Best regards,
Mike Davis
Legal Counsel`,
    bodyHtml: '',
    date: '2025-01-12T11:00:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [
      { id: 'att6', name: 'NDA_Draft.pdf', size: '850 KB', type: 'application/pdf' },
      { id: 'att7', name: 'Partnership_Agreement.pdf', size: '1.1 MB', type: 'application/pdf' },
    ],
    labels: ['Legal'],
    tags: ['NDA', 'Partnership', 'Legal Review'],
    category: 'Partnerships',
    folder: 'inbox',
    provider: 'gmail',
    associatedJobs: [],
    associatedQuotes: [],
    associatedCompanies: ['Legal Solutions Inc'],
    priority: 'normal',
    processed: true,
    processedDate: '2025-01-12T11:30:00Z',
    filed: {
      category: 'Contracts',
      subcategories: ['Legal', 'Partnerships'],
      tags: ['NDA', 'Review Pending'],
      filedDate: '2025-01-12T12:00:00Z',
      autoFiled: true,
    },
  },
  {
    id: 'e10',
    threadId: 't10',
    from: { email: 'support@vendor.com', name: 'Vendor Support', contactId: 'c9' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Invoice #INV-2025-0142 - Payment Received',
    body: `Dear Customer,

This is to confirm that we have received your payment for Invoice #INV-2025-0142.

Amount: $15,750.00
Payment Date: January 10, 2025
Payment Method: ACH Transfer

Thank you for your business.

Vendor Support Team`,
    bodyHtml: '',
    date: '2025-01-10T16:00:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [{ id: 'att8', name: 'Receipt_INV-2025-0142.pdf', size: '125 KB', type: 'application/pdf' }],
    labels: ['Finance'],
    tags: ['Invoice', 'Payment', 'Receipt'],
    category: 'Other',
    folder: 'inbox',
    provider: 'gmail',
    associatedJobs: [],
    associatedQuotes: [],
    associatedCompanies: [],
    priority: 'low',
    processed: true,
    processedDate: '2025-01-10T16:30:00Z',
    filed: {
      category: 'Finance',
      subcategories: ['Invoices', 'Paid'],
      tags: ['Receipt', 'Q1'],
      filedDate: '2025-01-10T17:00:00Z',
      autoFiled: true,
    },
  },
  {
    id: 'e11',
    threadId: 't11',
    from: { email: 'hr@flowconnect.com', name: 'HR Department' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Updated Employee Handbook 2025',
    body: `Hello Team,

Please find attached the updated Employee Handbook for 2025. Key changes include:

- Updated PTO policy (Section 3.2)
- New remote work guidelines (Section 5)
- Revised benefits enrollment process (Section 7)

Please review and acknowledge receipt by January 31st.

HR Department`,
    bodyHtml: '',
    date: '2025-01-05T09:00:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [{ id: 'att9', name: 'Employee_Handbook_2025.pdf', size: '2.8 MB', type: 'application/pdf' }],
    labels: ['Internal'],
    tags: ['HR', 'Policy', 'Handbook'],
    category: 'Internal',
    folder: 'inbox',
    provider: 'microsoft365',
    associatedJobs: [],
    associatedQuotes: [],
    associatedCompanies: [],
    priority: 'normal',
    processed: false,
    filed: {
      category: 'Internal',
      subcategories: ['HR', 'Policies'],
      tags: ['2025', 'Handbook'],
      filedDate: '2025-01-05T10:00:00Z',
      autoFiled: false,
    },
  },
  {
    id: 'e12',
    threadId: 't12',
    from: { email: 'sarah.johnson@builderco.com', name: 'Sarah Johnson', contactId: 'c1' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Downtown Plaza - Final Inspection Passed',
    body: `Great news!

The final electrical inspection for Downtown Plaza passed with flying colors. The inspector was particularly impressed with the lighting control system.

Attached is the signed certificate of completion.

Thanks for all your hard work on this project!

Best,
Sarah`,
    bodyHtml: '',
    date: '2025-01-20T15:00:00Z',
    read: true,
    starred: true,
    hasAttachments: true,
    attachments: [{ id: 'att10', name: 'Certificate_of_Completion.pdf', size: '450 KB', type: 'application/pdf' }],
    labels: ['Projects'],
    tags: ['Completion', 'Inspection', 'Success'],
    category: 'Projects',
    folder: 'inbox',
    provider: 'microsoft365',
    associatedJobs: ['Downtown Plaza Renovation'],
    associatedQuotes: ['Downtown Plaza - Lighting Package'],
    associatedCompanies: ['BuilderCo Construction'],
    priority: 'normal',
    processed: true,
    processedDate: '2025-01-20T15:30:00Z',
    filed: {
      category: 'Projects',
      subcategories: ['Completed', 'Downtown Plaza'],
      tags: ['Certificate', 'Milestone'],
      filedDate: '2025-01-20T16:00:00Z',
      autoFiled: false,
    },
  },
  {
    id: 'e13',
    threadId: 't13',
    from: { email: 'billing@utilities.com', name: 'Utility Company' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Monthly Utility Statement - December 2024',
    body: `Your December 2024 utility statement is now available.

Account: 1234567890
Amount Due: $2,450.00
Due Date: January 25, 2025

View your detailed statement online or see attached PDF.

Thank you,
Utility Billing Department`,
    bodyHtml: '',
    date: '2025-01-08T08:00:00Z',
    read: true,
    starred: false,
    hasAttachments: true,
    attachments: [{ id: 'att11', name: 'Utility_Statement_Dec2024.pdf', size: '320 KB', type: 'application/pdf' }],
    labels: ['Finance'],
    tags: ['Utility', 'Bill', 'Monthly'],
    category: 'Other',
    folder: 'inbox',
    provider: 'gmail',
    associatedJobs: [],
    associatedQuotes: [],
    associatedCompanies: [],
    priority: 'normal',
    processed: false,
    filed: {
      category: 'Finance',
      subcategories: ['Bills', 'Utilities'],
      tags: ['December', 'Pending Payment'],
      filedDate: '2025-01-08T09:00:00Z',
      autoFiled: true,
    },
  },
  {
    id: 'e14',
    threadId: 't14',
    from: { email: 'david.kim@projectalpha.com', name: 'David Kim', contactId: 'c10' },
    to: [{ email: 'me@flowconnect.com', name: 'Current User' }],
    cc: [],
    subject: 'Project Alpha - Phase 2 Kickoff',
    body: `Hi Team,

Excited to announce that Project Alpha Phase 2 is officially kicking off next week!

Key dates:
- Kickoff meeting: January 27th at 10 AM
- Design review: February 3rd
- Installation start: February 15th

Please confirm your availability for the kickoff meeting.

Thanks,
David Kim
Project Lead`,
    bodyHtml: '',
    date: '2025-01-19T13:00:00Z',
    read: true,
    starred: true,
    hasAttachments: false,
    attachments: [],
    labels: ['Projects'],
    tags: ['Kickoff', 'Phase 2', 'Meeting'],
    category: 'Projects',
    folder: 'inbox',
    provider: 'microsoft365',
    associatedJobs: ['Project Alpha'],
    associatedQuotes: [],
    associatedCompanies: ['Alpha Industries'],
    priority: 'high',
    processed: true,
    processedDate: '2025-01-19T13:30:00Z',
    filed: {
      category: 'Projects',
      subcategories: ['Active', 'Project Alpha'],
      tags: ['Phase 2', 'Kickoff'],
      filedDate: '2025-01-19T14:00:00Z',
      autoFiled: false,
    },
  },
];

const mockMeetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Downtown Plaza - Electrical Coordination',
    description: `Coordination meeting to discuss:
1. Main switchgear location
2. Generator backup requirements
3. Emergency lighting placement

Please review the attached drawings before the meeting.`,
    date: '2025-01-25',
    startTime: '14:00',
    endTime: '15:00',
    isAllDay: false,
    location: 'Delta Mechanical Conference Room',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/meet/123456',
    requiredAttendees: [
      { email: 'sarah.johnson@builderco.com', name: 'Sarah Johnson', type: 'required', contactId: 'c1' },
      { email: 'marcus.chen@deltamechanical.com', name: 'Marcus Chen', type: 'required', contactId: 'c2' },
    ],
    optionalAttendees: [
      { email: 'emily.r@skylinearch.com', name: 'Emily Rodriguez', type: 'optional', contactId: 'c3' },
    ],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    isInPerson: true,
    organizer: { email: 'sarah.johnson@builderco.com', name: 'Sarah Johnson', type: 'required', contactId: 'c1' },
    responseStatus: 'accepted',
    associatedJobs: ['Downtown Plaza Renovation'],
    associatedCompanies: ['BuilderCo Construction', 'Delta Mechanical'],
    category: 'Projects',
    priority: 'high',
    tags: ['Coordination', 'Electrical'],
  },
  {
    id: 'm2',
    title: 'Hospital Project Kickoff',
    description: 'Initial kickoff meeting for the hospital expansion project. We will discuss project timeline, milestones, and team assignments.',
    date: '2025-01-28',
    startTime: '10:30',
    endTime: '11:30',
    isAllDay: false,
    location: '',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/meet/789012',
    requiredAttendees: [
      { email: 'marcus.chen@deltamechanical.com', name: 'Marcus Chen', type: 'required', contactId: 'c2' },
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    isInPerson: false,
    organizer: { email: 'marcus.chen@deltamechanical.com', name: 'Marcus Chen', type: 'required', contactId: 'c2' },
    responseStatus: 'tentative',
    associatedJobs: ['Hospital Expansion Project'],
    associatedCompanies: ['Delta Mechanical'],
    category: 'Projects',
    priority: 'high',
    tags: ['Kickoff', 'Hospital'],
  },
  {
    id: 'm3',
    title: 'Weekly Sales Sync',
    description: 'Weekly team sync to discuss pipeline, forecasts, and key accounts.',
    date: '2025-01-24',
    startTime: '09:00',
    endTime: '09:30',
    isAllDay: false,
    location: 'Conference Room A',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/meet/weekly123',
    requiredAttendees: [
      { email: 'james.wilson@precisionelec.com', name: 'James Wilson', type: 'required', contactId: 'c4' },
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 15,
    isRecurring: true,
    recurrencePattern: 'Weekly on Fridays',
    isInPerson: true,
    organizer: { email: 'james.wilson@precisionelec.com', name: 'James Wilson', type: 'required', contactId: 'c4' },
    responseStatus: 'accepted',
    category: 'Internal',
    priority: 'normal',
    tags: ['Sales', 'Weekly'],
  },
  {
    id: 'm4',
    title: 'GreenBuild Campus - Sustainability Review',
    description: 'Review LEED certification requirements and discuss sustainable product options for the campus retrofit project.',
    date: '2025-01-30',
    startTime: '13:00',
    endTime: '14:30',
    isAllDay: false,
    location: 'GreenBuild HQ',
    isOnline: false,
    requiredAttendees: [
      { email: 'afoster@greenbuild.com', name: 'Amanda Foster', type: 'required', contactId: 'c5' },
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 30,
    isRecurring: false,
    isInPerson: true,
    organizer: { email: 'afoster@greenbuild.com', name: 'Amanda Foster', type: 'required', contactId: 'c5' },
    responseStatus: 'accepted',
    associatedJobs: ['GreenBuild Campus Retrofit'],
    associatedCompanies: ['GreenBuild Solutions'],
    category: 'Documentation',
    priority: 'normal',
    tags: ['LEED', 'Sustainability'],
  },
];

const defaultToneStyles: EmailToneStyle[] = [
  { id: 'ts1', name: 'Professional', description: 'Clear, business-appropriate tone', tone: 'professional', isDefault: true, createdDate: '2025-01-01' },
  { id: 'ts2', name: 'Formal', description: 'Highly formal and respectful', tone: 'formal', isDefault: false, createdDate: '2025-01-01' },
  { id: 'ts3', name: 'Friendly', description: 'Warm and approachable', tone: 'friendly', isDefault: false, createdDate: '2025-01-01' },
  { id: 'ts4', name: 'Casual', description: 'Relaxed and conversational', tone: 'casual', isDefault: false, createdDate: '2025-01-01' },
  { id: 'ts5', name: 'Urgent', description: 'Direct and action-oriented', tone: 'urgent', isDefault: false, createdDate: '2025-01-01' },
];

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'tpl1',
    name: 'Follow-Up After Meeting',
    description: 'Standard follow-up email after a meeting or call',
    subject: 'Following up on our conversation',
    body: `Hi {{contact_name}},

Thank you for taking the time to meet with me today. I enjoyed learning more about {{company}} and the {{project_name}} project.

As discussed, I will:
{{action_items}}

Please let me know if you have any questions or need anything else from my end.

Best regards`,
    category: 'follow-up',
    placeholders: ['{{contact_name}}', '{{company}}', '{{project_name}}', '{{action_items}}'],
    createdDate: '2025-01-01'
  },
  {
    id: 'tpl2',
    name: 'Quote Request Response',
    description: 'Response to a quote or pricing request',
    subject: 'Re: Quote Request for {{project_name}}',
    body: `Hi {{contact_name}},

Thank you for reaching out regarding {{project_name}}. I'm happy to provide a quote for your requirements.

To prepare an accurate proposal, I'll need the following information:
- Project specifications and drawings
- Required quantities
- Delivery timeline
- Any specific brand preferences

I'll have the quote ready within {{timeline}} of receiving this information.

Best regards`,
    category: 'quote-request',
    placeholders: ['{{contact_name}}', '{{project_name}}', '{{timeline}}'],
    createdDate: '2025-01-01'
  },
  {
    id: 'tpl3',
    name: 'Introduction Email',
    description: 'Initial outreach to a new contact',
    subject: 'Introduction from FlowConnect',
    body: `Hi {{contact_name}},

I hope this email finds you well. My name is {{sender_name}} from FlowConnect, and I'm reaching out to introduce our company and explore potential opportunities to work together.

FlowConnect specializes in {{services}}, and I believe we could add value to {{company}}'s projects.

Would you be available for a brief call next week to discuss how we might collaborate?

Best regards`,
    category: 'introduction',
    placeholders: ['{{contact_name}}', '{{sender_name}}', '{{services}}', '{{company}}'],
    createdDate: '2025-01-01'
  },
  {
    id: 'tpl4',
    name: 'Thank You Email',
    description: 'Express gratitude after a project or interaction',
    subject: 'Thank You - {{project_name}}',
    body: `Hi {{contact_name}},

I wanted to take a moment to thank you for {{reason}}. It was a pleasure working with you and the team at {{company}}.

We look forward to future opportunities to collaborate.

Best regards`,
    category: 'thank-you',
    placeholders: ['{{contact_name}}', '{{reason}}', '{{company}}', '{{project_name}}'],
    createdDate: '2025-01-01'
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const getContactFromEmail = (email: Email): Contact | undefined => {
  const contactId = email.from.contactId || email.to.find(t => t.contactId)?.contactId;
  return mockContacts.find(c => c.id === contactId);
};

const getAllContactsFromEmail = (email: Email): Contact[] => {
  const contactIds = new Set<string>();
  if (email.from.contactId) contactIds.add(email.from.contactId);
  email.to.forEach(t => { if (t.contactId) contactIds.add(t.contactId); });
  email.cc.forEach(c => { if (c.contactId) contactIds.add(c.contactId); });
  return mockContacts.filter(c => contactIds.has(c.id));
};

const generateMockEmail = (contacts: Contact[], toneStyle: EmailToneStyle, prompt?: string): string => {
  const contact = contacts[0];
  const context = contact ? mockContactContexts[contact.id] : null;

  let greeting = 'Hi';
  let closing = 'Best regards';

  switch (toneStyle.tone) {
    case 'formal':
      greeting = 'Dear';
      closing = 'Sincerely';
      break;
    case 'friendly':
      greeting = 'Hey';
      closing = 'Cheers';
      break;
    case 'casual':
      greeting = 'Hi';
      closing = 'Thanks';
      break;
    case 'urgent':
      greeting = 'Hi';
      closing = 'Please respond ASAP';
      break;
  }

  if (prompt) {
    return `${greeting} ${contact?.name || 'there'},

${prompt}

${context?.jobs.length ? `Regarding ${context.jobs[0].name}, ` : ''}I wanted to reach out to discuss this matter further.

${closing}`;
  }

  if (context) {
    const recentJob = context.jobs[0];
    const recentQuote = context.quotes[0];
    const recentActivity = context.recentActivity[0];

    let body = `${greeting} ${contact.name},\n\n`;

    if (recentActivity) {
      body += `Following up on our recent ${recentActivity.type} regarding ${recentActivity.description.toLowerCase()}.\n\n`;
    }

    if (recentJob) {
      body += `I wanted to touch base about the ${recentJob.name} project (currently in ${recentJob.status} stage).\n\n`;
    }

    if (recentQuote) {
      body += `Also, just a reminder that the quote for "${recentQuote.name}" (${recentQuote.value}) is set to expire on ${new Date(recentQuote.expirationDate).toLocaleDateString()}.\n\n`;
    }

    body += `Please let me know if you have any questions or if there's anything I can help with.\n\n${closing}`;

    return body;
  }

  return `${greeting},\n\nI hope this email finds you well. I wanted to reach out to discuss potential opportunities to work together.\n\nPlease let me know if you'd like to schedule a call.\n\n${closing}`;
};

// ============================================
// COMPONENT
// ============================================

// Available categories and tags for filtering
const availableCategories: Email['category'][] = ['Projects', 'Sales', 'Support', 'Partnerships', 'Documentation', 'Internal', 'Other'];
const availableTags = ['Timeline', 'Follow-up', 'Quote Request', 'Meeting', 'Coordination', 'Healthcare', 'Partnership', 'Distribution', 'LED', 'Negotiation', 'LEED', 'Certification', 'Documentation', 'Sustainability', 'Proposal', 'Lighting', 'Commercial', 'Scheduling'];
const availablePriorities: Email['priority'][] = ['high', 'normal', 'low'];

// Filing categories with subcategories for auto-file feature
const filingCategories: { category: string; subcategories: string[] }[] = [
  { category: 'Project Communications', subcategories: ['RFIs', 'Submittals', 'Change Orders', 'Meeting Notes', 'Schedule Updates', 'General Correspondence'] },
  { category: 'Sales & Quotes', subcategories: ['Quote Requests', 'Quote Responses', 'Negotiations', 'Follow-ups', 'Won', 'Lost'] },
  { category: 'Vendor & Supplier', subcategories: ['Purchase Orders', 'Pricing Updates', 'Product Info', 'Delivery Updates', 'Returns'] },
  { category: 'Customer Support', subcategories: ['Technical Issues', 'Warranty Claims', 'General Inquiries', 'Complaints', 'Feedback'] },
  { category: 'Internal', subcategories: ['HR', 'Finance', 'Operations', 'IT', 'Announcements', 'Team Updates'] },
  { category: 'Legal & Compliance', subcategories: ['Contracts', 'NDAs', 'Insurance', 'Certifications', 'Regulatory'] },
  { category: 'Marketing', subcategories: ['Campaigns', 'Events', 'Press', 'Social Media', 'Newsletter'] },
  { category: 'Archive', subcategories: ['Completed Projects', 'Old Quotes', 'Obsolete', 'Reference'] },
];

// Workflow template type with criteria and email templates (defined outside component for reuse)
type WorkflowTemplateType = {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: {
    type: 'criteria-based' | 'manual-select' | 'all';
    entity: 'company' | 'contact' | 'job' | 'quote';
    field?: string;
    operator?: string;
    value?: string;
    additionalFields?: { field: string; operator: string; value?: string }[];
  };
  emailTemplate: {
    subject: string;
    body: string;
  };
};

export default function FlowmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'spreadsheet' | 'email' | 'meeting' | 'compose' | 'workflow-select' | 'campaign-compose'>('spreadsheet');
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<WorkflowTemplateType | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [defaultItemView, setDefaultItemView] = useState<'emails' | 'meetings' | 'both'>('emails');
  const [itemViewFilter, setItemViewFilter] = useState<'emails' | 'meetings' | 'both'>('emails');
  const [cameFromCalendar, setCameFromCalendar] = useState(false);
  const [showDefaultViewDropdown, setShowDefaultViewDropdown] = useState(false);
  const [folderFilter, setFolderFilter] = useState<'inbox' | 'sent' | 'drafts' | 'all'>('inbox');
  const [emailTab, setEmailTab] = useState<'new' | 'filed'>('new');

  // Meeting compose state
  const [showMeetingComposer, setShowMeetingComposer] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingStartTime, setMeetingStartTime] = useState('10:30');
  const [meetingEndTime, setMeetingEndTime] = useState('11:00');
  const [meetingIsAllDay, setMeetingIsAllDay] = useState(false);
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingIsOnline, setMeetingIsOnline] = useState(true);
  const [meetingIsInPerson, setMeetingIsInPerson] = useState(false);
  const [meetingRequiredAttendees, setMeetingRequiredAttendees] = useState<string[]>([]);
  const [meetingOptionalAttendees, setMeetingOptionalAttendees] = useState<string[]>([]);
  const [meetingShowAs, setMeetingShowAs] = useState<'busy' | 'free' | 'tentative' | 'out-of-office'>('busy');
  const [meetingReminder, setMeetingReminder] = useState<number>(15);
  const [meetingIsRecurring, setMeetingIsRecurring] = useState(false);
  const [meetingRecurrencePattern, setMeetingRecurrencePattern] = useState('');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [creatingMeetingFromEmailId, setCreatingMeetingFromEmailId] = useState<string | null>(null);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [selectedMeetingContactId, setSelectedMeetingContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-file state
  const [filingEmailId, setFilingEmailId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'sender' | 'subject' | 'category' | 'priority' | 'status' | 'jobs' | 'quotes' | 'companies' | 'participants' | 'followUp'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<Email['category'] | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Email['priority'] | 'all'>('all');
  const [senderFilter, setSenderFilter] = useState<string[]>([]);
  const [jobFilter, setJobFilter] = useState<string[]>([]);
  const [quoteFilter, setQuoteFilter] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'processed' | 'pending'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [participantsFilter, setParticipantsFilter] = useState<string[]>([]);
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'has-followup' | 'no-followup' | 'overdue' | 'upcoming'>('all');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null);

  // Compose state
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward' | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context sidebar state
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['activity', 'jobs', 'quotes', 'newFlow', 'inProgress', 'completed']));

  // Modal state
  const [showJobModal, setShowJobModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');

  // Flow search and modal state
  const [flowSearchQuery, setFlowSearchQuery] = useState('');
  const [showAllFlowsModal, setShowAllFlowsModal] = useState(false);

  // Campaign configuration modal state
  const [campaignName, setCampaignName] = useState('');
  const [campaignListType, setCampaignListType] = useState<'static' | 'criteria' | 'dynamic'>('criteria');
  const [campaignEntity, setCampaignEntity] = useState('');
  const [campaignField, setCampaignField] = useState('');
  const [campaignOperator, setCampaignOperator] = useState('');
  const [campaignValue, setCampaignValue] = useState('');
  const [campaignConditions, setCampaignConditions] = useState<Array<{ field: string; operator: string; value: string }>>([]);
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  // Static list selection state
  const [staticListSearch, setStaticListSearch] = useState('');
  const [staticListCompanyFilter, setStaticListCompanyFilter] = useState('');
  const [staticListRoleFilter, setStaticListRoleFilter] = useState('');
  const [selectedStaticContacts, setSelectedStaticContacts] = useState<Set<string>>(new Set());

  // Style settings state
  const [showToneStylesModal, setShowToneStylesModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [toneStyles, setToneStyles] = useState<EmailToneStyle[]>(defaultToneStyles);
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedToneStyle, setSelectedToneStyle] = useState<EmailToneStyle>(defaultToneStyles[0]);

  // Edit style state
  const [editingStyle, setEditingStyle] = useState<EmailToneStyle | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // Processing and task creation state
  const [processingEmailId, setProcessingEmailId] = useState<string | null>(null);
  const [creatingTaskEmailId, setCreatingTaskEmailId] = useState<string | null>(null);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);

  // Follow-up state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpEmailId, setFollowUpEmailId] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpDismissOnReply, setFollowUpDismissOnReply] = useState(true);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpNotesExpanded, setFollowUpNotesExpanded] = useState(false);
  const [showFollowUpSettings, setShowFollowUpSettings] = useState(false);

  // Follow-up settings (persisted preferences)
  const [followUpSettings, setFollowUpSettings] = useState({
    dismissOnReplyDefault: true,
    oneClickSave: true,
    presetDays: [1, 3, 5, 14, 21] // 1 day, 3 days, 5 days, 2 weeks, 3 weeks
  });

  // File state
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileEmailId, setFileEmailId] = useState<string | null>(null);
  const [fileCategory, setFileCategory] = useState('');
  const [fileSubcategories, setFileSubcategories] = useState<string[]>([]);
  const [fileTags, setFileTags] = useState<string[]>([]);
  const [showFileSettings, setShowFileSettings] = useState(false);

  // Filed email tree view state - tracks which categories and subcategories are expanded
  const [expandedFileCategories, setExpandedFileCategories] = useState<Set<string>>(new Set());
  const [expandedFileSubcategories, setExpandedFileSubcategories] = useState<Set<string>>(new Set());

  // File settings (persisted preferences)
  const [fileSettings, setFileSettings] = useState({
    autoFileOnClick: false, // When true, clicking File button immediately files with suggested values
  });

  // Ingestion rules state
  const [ingestionRules, setIngestionRules] = useState<IngestionRule[]>([
    {
      id: 'rule-1',
      name: 'Process vendor emails',
      enabled: true,
      conditions: [{ type: 'senderDomain', value: 'acmesupply.com' }],
      action: 'process',
    },
    {
      id: 'rule-2',
      name: 'Auto-file newsletters',
      enabled: true,
      conditions: [{ type: 'subjectContains', value: 'newsletter' }],
      action: 'file',
      fileCategory: 'Internal',
      fileSubcategory: 'Team Updates',
    },
  ]);
  const [showIngestionRulesModal, setShowIngestionRulesModal] = useState(false);
  const [editingRule, setEditingRule] = useState<IngestionRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // Spec Sheet attachment modals
  const [showSpecSheetsModal, setShowSpecSheetsModal] = useState(false);
  const [showOpenCatalogModal, setShowOpenCatalogModal] = useState(false);
  const [specSheetSearch, setSpecSheetSearch] = useState('');
  const [selectedSpecSheets, setSelectedSpecSheets] = useState<SpecSheet[]>([]);
  const [showSpecSheetDropdown, setShowSpecSheetDropdown] = useState(false);

  // Available file categories and subcategories
  const fileCategories = [
    { category: 'Sales & Quotes', subcategories: ['Quote Requests', 'Quote Responses', 'Negotiations', 'Follow-ups', 'Won', 'Lost'] },
    { category: 'Projects', subcategories: ['Active Projects', 'Project Updates', 'Change Orders', 'Closeout', 'Warranty'] },
    { category: 'Support', subcategories: ['Technical Support', 'Customer Service', 'Complaints', 'Returns'] },
    { category: 'Partnerships', subcategories: ['Vendor Communications', 'Partner Updates', 'Agreements', 'Co-marketing'] },
    { category: 'Documentation', subcategories: ['Specs & Submittals', 'Certifications', 'Manuals', 'Compliance'] },
    { category: 'Internal', subcategories: ['Team Updates', 'HR', 'Finance', 'IT'] },
  ];

  // Calendar state for inline date picker
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // Column configuration state
  const [savedLayouts, setSavedLayouts] = useState<SavedColumnLayout[]>(DEFAULT_LAYOUTS);
  const [activeLayoutId, setActiveLayoutId] = useState<string>('default');
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [editingLayoutName, setEditingLayoutName] = useState('');
  const [isCreatingLayout, setIsCreatingLayout] = useState(false);

  // Get active column configuration
  const activeLayout = useMemo(() => {
    return savedLayouts.find(l => l.id === activeLayoutId) || savedLayouts[0];
  }, [savedLayouts, activeLayoutId]);

  const visibleColumns = useMemo(() => {
    return activeLayout.columns.map(colId => ALL_COLUMNS.find(c => c.id === colId)!).filter(Boolean);
  }, [activeLayout]);

  // Helper to check if a column is visible
  const isColumnVisible = (columnId: ColumnId): boolean => {
    return activeLayout.columns.includes(columnId);
  };

  // Helper function to render a table cell based on column ID
  const renderCell = (columnId: ColumnId, email: Email) => {
    switch (columnId) {
      case 'actions':
        return (
          <td key={columnId} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleOpenFollowUp(email.id, e)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  email.followUp
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                }`}
                title={email.followUp ? `Follow up: ${new Date(email.followUp.date).toLocaleDateString()}` : 'Set follow-up'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                {email.followUp ? (
                  <span className="max-w-[60px] truncate">{new Date(email.followUp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                ) : (
                  'Follow up'
                )}
              </button>
              {email.followUp && (
                <button
                  onClick={(e) => handleRemoveFollowUp(email.id, e)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  title="Remove follow-up"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </td>
        );
      case 'file':
        return (
          <td key={columnId} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleOpenFile(email.id, e)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  email.filed
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                }`}
                title={email.filed ? `Filed: ${email.filed.category}${email.filed.subcategories?.length ? ' > ' + email.filed.subcategories.join(' > ') : ''}` : 'File email'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg>
                {email.filed ? (
                  <span className="max-w-[50px] truncate">{email.filed.category.split(' ')[0]}</span>
                ) : (
                  'File'
                )}
              </button>
              {email.filed && (
                <button
                  onClick={(e) => handleRemoveFile(email.id, e)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  title="Remove filing"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </td>
        );
      case 'star':
        return (
          <td key={columnId} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => handleStarEmail(email.id, e)}
              className={`${email.starred ? 'text-yellow-500' : 'text-[var(--muted-foreground)] hover:text-yellow-500'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={email.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          </td>
        );
      case 'fromTo':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {email.from.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className={`text-sm line-clamp-1 ${!email.read ? 'font-semibold' : ''}`}>
                  {email.folder === 'sent' ? `To: ${email.to[0]?.name || email.to[0]?.email}` : email.from.name}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] truncate">
                  {email.from.email}
                </div>
              </div>
            </div>
          </td>
        );
      case 'participants':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              To: {email.to.map(t => t.name || t.email).join(', ')}
              {email.cc.length > 0 && ` | CC: ${email.cc.map(c => c.name || c.email).join(', ')}`}
            </div>
          </td>
        );
      case 'subject':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex items-start gap-2">
              {email.hasAttachments && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] flex-shrink-0 mt-0.5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              )}
              <span className={`text-sm line-clamp-2 ${!email.read ? 'font-semibold' : ''}`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {email.subject}
              </span>
            </div>
          </td>
        );
      case 'category':
        return (
          <td key={columnId} className="px-3 py-2">
            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getCategoryColor(email.category)}`}>
              {email.category}
            </span>
          </td>
        );
      case 'priority':
        return (
          <td key={columnId} className="px-3 py-2">
            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getPriorityColor(email.priority)}`}>
              {email.priority}
            </span>
          </td>
        );
      case 'tags':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex gap-1 flex-wrap" style={{ maxHeight: '2.5rem', overflow: 'hidden' }}>
              {email.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs whitespace-nowrap">
                  {tag}
                </span>
              ))}
              {email.tags.length > 3 && (
                <span className="text-xs text-[var(--muted-foreground)]">+{email.tags.length - 3}</span>
              )}
            </div>
          </td>
        );
      case 'jobs':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(email.associatedJobs || []).length > 0
                ? (email.associatedJobs || []).join(', ')
                : <span className="text-gray-400">-</span>}
            </div>
          </td>
        );
      case 'quotes':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(email.associatedQuotes || []).length > 0
                ? (email.associatedQuotes || []).join(', ')
                : <span className="text-gray-400">-</span>}
            </div>
          </td>
        );
      case 'companies':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(email.associatedCompanies || []).length > 0
                ? (email.associatedCompanies || []).join(', ')
                : <span className="text-gray-400">-</span>}
            </div>
          </td>
        );
      case 'date':
        return (
          <td key={columnId} className="px-3 py-2 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
            {formatDate(email.date)}
          </td>
        );
      case 'status':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex items-center gap-2">
              {email.processed ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs whitespace-nowrap">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  AI Processed
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs whitespace-nowrap">
                  Pending
                </span>
              )}
              {!email.read && (
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block" title="Unread"></span>
              )}
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  // Helper function to render a meeting cell (similar to email cells)
  const renderMeetingCell = (columnId: ColumnId, meeting: Meeting) => {
    switch (columnId) {
      case 'actions':
        return (
          <td key={columnId} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle follow-up for meeting
                  setMeetings(prev => prev.map(m =>
                    m.id === meeting.id
                      ? { ...m, followUp: m.followUp ? undefined : { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } }
                      : m
                  ));
                }}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  meeting.followUp
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                }`}
                title={meeting.followUp ? `Follow up: ${new Date(meeting.followUp.date).toLocaleDateString()}` : 'Set follow-up'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                {meeting.followUp ? (
                  <span className="max-w-[60px] truncate">{new Date(meeting.followUp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                ) : (
                  'Follow up'
                )}
              </button>
              {meeting.followUp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, followUp: undefined } : m));
                  }}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  title="Remove follow-up"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </td>
        );
      case 'file':
        return (
          <td key={columnId} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle filed status for meeting
                  setMeetings(prev => prev.map(m =>
                    m.id === meeting.id
                      ? { ...m, filed: m.filed ? undefined : { category: 'Meetings' } }
                      : m
                  ));
                }}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  meeting.filed
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]'
                }`}
                title={meeting.filed ? `Filed: ${meeting.filed.category}` : 'File meeting'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                </svg>
                {meeting.filed ? (
                  <span className="max-w-[50px] truncate">{meeting.filed.category.split(' ')[0]}</span>
                ) : (
                  'File'
                )}
              </button>
              {meeting.filed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, filed: undefined } : m));
                  }}
                  className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                  title="Remove filing"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </td>
        );
      case 'star':
        return (
          <td key={columnId} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
            <span className={`text-sm ${
              meeting.responseStatus === 'accepted' ? 'text-green-600' :
              meeting.responseStatus === 'tentative' ? 'text-yellow-600' :
              meeting.responseStatus === 'declined' ? 'text-red-600' : 'text-gray-400'
            }`}>
              {meeting.responseStatus === 'accepted' ? '✓' :
               meeting.responseStatus === 'tentative' ? '?' :
               meeting.responseStatus === 'declined' ? '✗' : '○'}
            </span>
          </td>
        );
      case 'fromTo':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {meeting.organizer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm line-clamp-1">
                  {meeting.organizer.name}
                </div>
                <div className="text-xs text-[var(--muted-foreground)] truncate">
                  {meeting.organizer.email}
                </div>
              </div>
            </div>
          </td>
        );
      case 'participants':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              To: {[...meeting.requiredAttendees, ...meeting.optionalAttendees].map(a => a.name).join(', ') || 'No attendees'}
            </div>
          </td>
        );
      case 'subject':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex items-start gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 flex-shrink-0 mt-0.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {meeting.isOnline && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500 flex-shrink-0 mt-0.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              )}
              {meeting.isRecurring && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0 mt-0.5">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 014-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 01-4 4H3"/>
                </svg>
              )}
              <span className="text-sm line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {meeting.title}
              </span>
            </div>
          </td>
        );
      case 'category':
        return (
          <td key={columnId} className="px-3 py-2">
            {meeting.category && meeting.category.length > 0 ? (
              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getCategoryColor(meeting.category)}`}>
                {meeting.category}
              </span>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </td>
        );
      case 'priority':
        return (
          <td key={columnId} className="px-3 py-2">
            {meeting.priority && meeting.priority.length > 0 ? (
              <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getPriorityColor(meeting.priority)}`}>
                {meeting.priority}
              </span>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
          </td>
        );
      case 'tags':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex gap-1 flex-wrap" style={{ maxHeight: '2.5rem', overflow: 'hidden' }}>
              {meeting.tags && meeting.tags.length > 0 ? (
                <>
                  {meeting.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs whitespace-nowrap">
                      {tag}
                    </span>
                  ))}
                  {meeting.tags.length > 3 && (
                    <span className="text-xs text-[var(--muted-foreground)]">+{meeting.tags.length - 3}</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400">-</span>
              )}
            </div>
          </td>
        );
      case 'jobs':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(meeting.associatedJobs || []).length > 0
                ? (meeting.associatedJobs || []).join(', ')
                : <span className="text-gray-400">-</span>}
            </div>
          </td>
        );
      case 'quotes':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(meeting.associatedQuotes || []).length > 0
                ? (meeting.associatedQuotes || []).join(', ')
                : <span className="text-gray-400">-</span>}
            </div>
          </td>
        );
      case 'companies':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="text-xs text-[var(--muted-foreground)]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(meeting.associatedCompanies || []).length > 0
                ? (meeting.associatedCompanies || []).join(', ')
                : <span className="text-gray-400">-</span>}
            </div>
          </td>
        );
      case 'date':
        return (
          <td key={columnId} className="px-3 py-2 text-xs text-[var(--muted-foreground)] whitespace-nowrap">
            {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </td>
        );
      case 'status':
        return (
          <td key={columnId} className="px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded whitespace-nowrap ${
                meeting.responseStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                meeting.responseStatus === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                meeting.responseStatus === 'declined' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {meeting.responseStatus === 'accepted' ? 'Accepted' :
                 meeting.responseStatus === 'tentative' ? 'Tentative' :
                 meeting.responseStatus === 'declined' ? 'Declined' : 'Pending'}
              </span>
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  // Helper function to render a table header based on column ID
  const renderHeader = (columnId: ColumnId) => {
    switch (columnId) {
      case 'actions':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[100px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('followUp'); setSortOrder(prev => sortBy === 'followUp' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                Actions
                {sortBy === 'followUp' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'followUp' ? null : 'followUp')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${followUpFilter !== 'all' ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'followUp' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[160px]">
                <div className="p-2 space-y-1">
                  <button onClick={() => { setFollowUpFilter('all'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${followUpFilter === 'all' ? 'bg-[var(--muted)] font-medium' : ''}`}>All</button>
                  <button onClick={() => { setFollowUpFilter('has-followup'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${followUpFilter === 'has-followup' ? 'bg-[var(--muted)] font-medium' : ''}`}>Has follow-up</button>
                  <button onClick={() => { setFollowUpFilter('no-followup'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${followUpFilter === 'no-followup' ? 'bg-[var(--muted)] font-medium' : ''}`}>No follow-up</button>
                  <button onClick={() => { setFollowUpFilter('overdue'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] text-red-600 ${followUpFilter === 'overdue' ? 'bg-[var(--muted)] font-medium' : ''}`}>Overdue</button>
                  <button onClick={() => { setFollowUpFilter('upcoming'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] text-green-600 ${followUpFilter === 'upcoming' ? 'bg-[var(--muted)] font-medium' : ''}`}>Upcoming</button>
                </div>
              </div>
            )}
          </th>
        );
      case 'file':
        return <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[100px]">File</th>;
      case 'star':
        return <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-8"></th>;
      case 'fromTo':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[160px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('sender'); setSortOrder(prev => sortBy === 'sender' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                From/To
                {sortBy === 'sender' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'sender' ? null : 'sender')}
                className={`p-1 rounded hover:bg-[var(--muted)] relative ${senderFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'sender' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setSenderFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableSenders.map(sender => (
                    <label key={sender} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={senderFilter.includes(sender)} onChange={(e) => { if (e.target.checked) { setSenderFilter(prev => [...prev, sender]); } else { setSenderFilter(prev => prev.filter(s => s !== sender)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm">{sender}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'participants':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[120px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('participants'); setSortOrder(prev => sortBy === 'participants' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                To
                {sortBy === 'participants' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'participants' ? null : 'participants')}
                className={`p-1 rounded hover:bg-[var(--muted)] relative ${participantsFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'participants' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setParticipantsFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableParticipants.map(participant => (
                    <label key={participant} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={participantsFilter.includes(participant)} onChange={(e) => { if (e.target.checked) { setParticipantsFilter(prev => [...prev, participant]); } else { setParticipantsFilter(prev => prev.filter(p => p !== participant)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm">{participant}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'subject':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider min-w-[180px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('subject'); setSortOrder(prev => sortBy === 'subject' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                Subject
                {sortBy === 'subject' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'subject' ? null : 'subject')}
                className={`p-1 rounded hover:bg-[var(--muted)] relative ${subjectFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'subject' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[280px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setSubjectFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableSubjects.map(subject => (
                    <label key={subject} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={subjectFilter.includes(subject)} onChange={(e) => { if (e.target.checked) { setSubjectFilter(prev => [...prev, subject]); } else { setSubjectFilter(prev => prev.filter(s => s !== subject)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm truncate max-w-[220px]">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'category':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[100px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('category'); setSortOrder(prev => sortBy === 'category' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                Category
                {sortBy === 'category' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'category' ? null : 'category')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${categoryFilter !== 'all' ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'category' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[140px]">
                <div className="p-2 space-y-1">
                  {(['all', 'Projects', 'Sales', 'Support', 'Partnerships', 'Documentation', 'Internal', 'Other'] as const).map(cat => (
                    <button key={cat} onClick={() => { setCategoryFilter(cat); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${categoryFilter === cat ? 'bg-[var(--muted)] font-medium' : ''}`}>{cat === 'all' ? 'All' : cat}</button>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'priority':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[90px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('priority'); setSortOrder(prev => sortBy === 'priority' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                Priority
                {sortBy === 'priority' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'priority' ? null : 'priority')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${priorityFilter !== 'all' ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'priority' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[120px]">
                <div className="p-2 space-y-1">
                  {(['all', 'high', 'normal', 'low'] as const).map(pri => (
                    <button key={pri} onClick={() => { setPriorityFilter(pri); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${priorityFilter === pri ? 'bg-[var(--muted)] font-medium' : ''}`}>{pri === 'all' ? 'All' : pri.charAt(0).toUpperCase() + pri.slice(1)}</button>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'tags':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[140px] relative">
            <div className="flex items-center gap-1">
              <span>Tags</span>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'tags' ? null : 'tags')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${tagFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'tags' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[180px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setTagFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={tagFilter.includes(tag)} onChange={(e) => { if (e.target.checked) { setTagFilter(prev => [...prev, tag]); } else { setTagFilter(prev => prev.filter(t => t !== tag)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'jobs':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[140px] relative">
            <div className="flex items-center gap-1">
              <span>Jobs</span>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'jobs' ? null : 'jobs')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${jobFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'jobs' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setJobFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableJobs.map(job => (
                    <label key={job} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={jobFilter.includes(job)} onChange={(e) => { if (e.target.checked) { setJobFilter(prev => [...prev, job]); } else { setJobFilter(prev => prev.filter(j => j !== job)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm">{job}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'quotes':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[140px] relative">
            <div className="flex items-center gap-1">
              <span>Quotes</span>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'quotes' ? null : 'quotes')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${quoteFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'quotes' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setQuoteFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableQuotes.map(quote => (
                    <label key={quote} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={quoteFilter.includes(quote)} onChange={(e) => { if (e.target.checked) { setQuoteFilter(prev => [...prev, quote]); } else { setQuoteFilter(prev => prev.filter(q => q !== quote)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm">{quote}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'companies':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[120px] relative">
            <div className="flex items-center gap-1">
              <span>Companies</span>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'companies' ? null : 'companies')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${companyFilter.length > 0 ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'companies' && (
              <div className="column-filter-dropdown absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[var(--border)]">
                  <button onClick={() => setCompanyFilter([])} className="w-full px-3 py-1.5 text-left text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] rounded">Clear all</button>
                </div>
                <div className="p-2 space-y-1">
                  {availableCompanies.map(company => (
                    <label key={company} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                      <input type="checkbox" checked={companyFilter.includes(company)} onChange={(e) => { if (e.target.checked) { setCompanyFilter(prev => [...prev, company]); } else { setCompanyFilter(prev => prev.filter(c => c !== company)); }}} className="w-4 h-4 accent-[var(--primary)]"/>
                      <span className="text-sm">{company}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </th>
        );
      case 'date':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[90px]">
            <button
              onClick={() => { setSortBy('date'); setSortOrder(prev => sortBy === 'date' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
              className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
            >
              Date
              {sortBy === 'date' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              )}
            </button>
          </th>
        );
      case 'status':
        return (
          <th key={columnId} className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-[100px] relative">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setSortBy('status'); setSortOrder(prev => sortBy === 'status' ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'); }}
                className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
              >
                Status
                {sortBy === 'status' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                )}
              </button>
              <button
                data-filter-trigger
                onClick={() => setOpenColumnFilter(openColumnFilter === 'status' ? null : 'status')}
                className={`p-1 rounded hover:bg-[var(--muted)] ${statusFilter !== 'all' ? 'text-[var(--primary)]' : ''}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
              </button>
            </div>
            {openColumnFilter === 'status' && (
              <div className="column-filter-dropdown absolute top-full right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-20 min-w-[140px]">
                <div className="p-2 space-y-1">
                  <button onClick={() => { setStatusFilter('all'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${statusFilter === 'all' ? 'bg-[var(--muted)] font-medium' : ''}`}>All</button>
                  <button onClick={() => { setStatusFilter('processed'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${statusFilter === 'processed' ? 'bg-[var(--muted)] font-medium' : ''}`}>AI Processed</button>
                  <button onClick={() => { setStatusFilter('pending'); setOpenColumnFilter(null); }} className={`w-full px-3 py-1.5 text-left text-sm rounded hover:bg-[var(--muted)] ${statusFilter === 'pending' ? 'bg-[var(--muted)] font-medium' : ''}`}>Pending</button>
                </div>
              </div>
            )}
          </th>
        );
      default:
        return null;
    }
  };

  // Handle meeting navigation from Flow Calendar
  useEffect(() => {
    const meetingId = searchParams.get('meeting');
    if (meetingId) {
      // Check if we came from calendar
      const returnPath = sessionStorage.getItem('calendarReturnPath');
      if (returnPath === '/flow-calendar') {
        setCameFromCalendar(true);
      }

      // Try to get meeting data from sessionStorage first
      const storedMeetingData = sessionStorage.getItem('selectedMeeting');
      if (storedMeetingData) {
        try {
          const meeting = JSON.parse(storedMeetingData) as Meeting;
          setSelectedMeeting(meeting);
          setViewMode('meeting');
          // Initialize meeting form fields
          setMeetingTitle(meeting.title);
          setMeetingDescription(meeting.description);
          setMeetingDate(meeting.date);
          setMeetingStartTime(meeting.startTime);
          setMeetingEndTime(meeting.endTime);
          setMeetingIsAllDay(meeting.isAllDay);
          setMeetingLocation(meeting.location);
          setMeetingIsOnline(meeting.isOnline);
          setMeetingIsInPerson(meeting.isInPerson);
          setMeetingRequiredAttendees(meeting.requiredAttendees.map(a => a.email));
          setMeetingOptionalAttendees(meeting.optionalAttendees.map(a => a.email));
          setMeetingShowAs(meeting.showAs);
          setMeetingReminder(meeting.reminder);
          setMeetingIsRecurring(meeting.isRecurring);
          setMeetingRecurrencePattern(meeting.recurrencePattern || '');
          // Clear the stored data
          sessionStorage.removeItem('selectedMeeting');
        } catch (e) {
          console.error('Error parsing meeting data:', e);
        }
      } else {
        // Fallback: find meeting in local state
        const meeting = meetings.find(m => m.id === meetingId);
        if (meeting) {
          setSelectedMeeting(meeting);
          setViewMode('meeting');
          setMeetingTitle(meeting.title);
          setMeetingDescription(meeting.description);
          setMeetingDate(meeting.date);
          setMeetingStartTime(meeting.startTime);
          setMeetingEndTime(meeting.endTime);
          setMeetingIsAllDay(meeting.isAllDay);
          setMeetingLocation(meeting.location);
          setMeetingIsOnline(meeting.isOnline);
          setMeetingIsInPerson(meeting.isInPerson);
          setMeetingRequiredAttendees(meeting.requiredAttendees.map(a => a.email));
          setMeetingOptionalAttendees(meeting.optionalAttendees.map(a => a.email));
          setMeetingShowAs(meeting.showAs);
          setMeetingReminder(meeting.reminder);
          setMeetingIsRecurring(meeting.isRecurring);
          setMeetingRecurrencePattern(meeting.recurrencePattern || '');
        }
      }
    }
  }, [searchParams, meetings]);

  // Close column filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openColumnFilter) {
        const target = event.target as Element;
        if (!target.closest('.column-filter-dropdown') && !target.closest('[data-filter-trigger]')) {
          setOpenColumnFilter(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openColumnFilter]);

  // Close column config dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnConfig) {
        const target = event.target as Element;
        if (!target.closest('.column-config-dropdown') && !target.closest('[data-column-config-trigger]')) {
          setShowColumnConfig(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnConfig]);

  // Close default view dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDefaultViewDropdown) {
        const target = event.target as Element;
        if (!target.closest('.default-view-dropdown') && !target.closest('[data-default-view-trigger]')) {
          setShowDefaultViewDropdown(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDefaultViewDropdown]);

  // Get unique values for filter dropdowns
  const availableSenders = useMemo(() => {
    const senders = new Set<string>();
    emails.forEach(e => senders.add(e.from.name));
    return Array.from(senders).sort();
  }, [emails]);

  const availableJobs = useMemo(() => {
    const jobs = new Set<string>();
    emails.forEach(e => (e.associatedJobs || []).forEach(j => jobs.add(j)));
    return Array.from(jobs).sort();
  }, [emails]);

  const availableQuotes = useMemo(() => {
    const quotes = new Set<string>();
    emails.forEach(e => (e.associatedQuotes || []).forEach(q => quotes.add(q)));
    return Array.from(quotes).sort();
  }, [emails]);

  const availableCompanies = useMemo(() => {
    const companies = new Set<string>();
    emails.forEach(e => (e.associatedCompanies || []).forEach(c => companies.add(c)));
    return Array.from(companies).sort();
  }, [emails]);

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    emails.forEach(e => subjects.add(e.subject));
    return Array.from(subjects).sort();
  }, [emails]);

  const availableParticipants = useMemo(() => {
    const participants = new Set<string>();
    emails.forEach(e => {
      participants.add(e.from.name);
      e.to.forEach(p => participants.add(p.name));
      e.cc.forEach(p => participants.add(p.name));
    });
    return Array.from(participants).sort();
  }, [emails]);

  // Mock flow data for workflow types, in-progress, and completed flows
  const newFlowTypes = useMemo<WorkflowTemplateType[]>(() => [
    {
      id: 'city-visit',
      name: 'City Visit',
      description: 'Email contacts before visiting their city',
      icon: 'location',
      criteria: {
        type: 'criteria-based',
        entity: 'company',
        field: 'city',
        operator: 'within_miles',
        value: '', // User fills in the city
      },
      emailTemplate: {
        subject: 'I\'ll be in {city} on {visitDate} - time to meet?',
        body: `Hi {firstName},

I'll be visiting {city} on {visitDate} and wanted to reach out to see if you'd have time for a quick meeting or coffee.

I'd love to catch up on how things are going at {companyName} and discuss any upcoming projects you might have in the pipeline.

Would you be available for a 30-minute meeting while I'm in town? I'm flexible on timing and happy to come to your office.

Let me know what works best for your schedule.

Best regards,
{senderName}`,
      },
    },
    {
      id: 'event-attendees',
      name: 'Event Attendees',
      description: 'Follow up with trade show or event contacts',
      icon: 'calendar',
      criteria: {
        type: 'criteria-based',
        entity: 'contact',
        field: 'event',
        operator: 'attended',
        value: '', // User selects event
      },
      emailTemplate: {
        subject: 'Great meeting you at {eventName}!',
        body: `Hi {firstName},

It was great connecting with you at {eventName}! I really enjoyed our conversation about {topic}.

As I mentioned, we specialize in {specialty} and I think there could be some great opportunities to work together on your upcoming projects.

I'd love to schedule a follow-up call to discuss how we can help {companyName}. Would you have 20-30 minutes this week or next?

Looking forward to continuing our conversation.

Best regards,
{senderName}`,
      },
    },
    {
      id: 'job-contacts',
      name: 'Job Contacts',
      description: 'Email all contacts associated with a job',
      icon: 'folder',
      criteria: {
        type: 'criteria-based',
        entity: 'contact',
        field: 'job',
        operator: 'associated_with',
        value: '', // User selects job
      },
      emailTemplate: {
        subject: 'Update on {jobName}',
        body: `Hi {firstName},

I wanted to reach out with an update regarding the {jobName} project.

{updateContent}

Please let me know if you have any questions or would like to schedule a call to discuss further.

Best regards,
{senderName}`,
      },
    },
    {
      id: 'overdue-quotes',
      name: 'Overdue Quotes',
      description: 'Follow up on quotes past their expiration',
      icon: 'clock',
      criteria: {
        type: 'criteria-based',
        entity: 'quote',
        field: 'expirationDate',
        operator: 'is_past',
        value: '', // Days overdue
      },
      emailTemplate: {
        subject: 'Following up on Quote #{quoteNumber} for {projectName}',
        body: `Hi {firstName},

I wanted to follow up on the quote we sent over for {projectName} (Quote #{quoteNumber}).

I noticed the quote expired on {expirationDate}, but I'd be happy to extend it or make any adjustments based on your current needs.

Has your team had a chance to review it? I'm available to hop on a quick call to answer any questions or discuss any changes to the scope.

Let me know how you'd like to proceed.

Best regards,
{senderName}`,
      },
    },
    {
      id: 'quote-followup',
      name: 'Quote Follow-up',
      description: 'Check in on pending quote decisions',
      icon: 'document',
      criteria: {
        type: 'criteria-based',
        entity: 'quote',
        field: 'status',
        operator: 'equals',
        value: '', // User selects status
        additionalFields: [
          { field: 'daysSinceSent', operator: 'greater_than', value: '' },
        ],
      },
      emailTemplate: {
        subject: 'Checking in on our proposal for {projectName}',
        body: `Hi {firstName},

I wanted to touch base regarding the quote we sent for {projectName}. I know you and your team are busy, but I wanted to make sure you received everything you need to make a decision.

Do you have any questions about the scope or pricing? I'm happy to jump on a quick call to walk through any details.

What's the best way to move forward?

Best regards,
{senderName}`,
      },
    },
    {
      id: 'cold-outreach',
      name: 'Cold Outreach',
      description: 'Reach out to new potential customers',
      icon: 'users',
      criteria: {
        type: 'criteria-based',
        entity: 'company',
        field: 'hasBeenContacted',
        operator: 'equals',
        value: 'false',
      },
      emailTemplate: {
        subject: 'Quick question about {companyName}\'s lighting needs',
        body: `Hi {firstName},

I came across {companyName} and noticed you're working on some exciting projects in the {industry} space.

We specialize in {specialty} and have helped companies similar to yours with {valueProposition}.

I'd love to learn more about your current projects and see if there's a fit. Would you be open to a brief 15-minute call?

Best regards,
{senderName}`,
      },
    },
    {
      id: 'custom',
      name: 'Custom Campaign',
      description: 'Create a custom email campaign from scratch',
      icon: 'settings',
      criteria: {
        type: 'manual-select',
        entity: 'contact',
      },
      emailTemplate: {
        subject: '',
        body: `Hi {firstName},

`,
      },
    },
  ], []);

  const inProgressFlows = useMemo(() => [
    { id: 'ip-1', name: 'NYC City Visit', type: 'city-visit', remaining: 5, total: 12, startedDate: '2024-12-01' },
    { id: 'ip-2', name: 'Q4 Quote Follow-ups', type: 'quote-followup', remaining: 8, total: 15, startedDate: '2024-11-28' },
    { id: 'ip-3', name: 'Trade Show Attendees', type: 'event-attendees', remaining: 22, total: 30, startedDate: '2024-11-20' },
  ], []);

  const completedFlows = useMemo(() => [
    { id: 'c-1', name: 'Chicago Visit - Nov 2024', type: 'city-visit', contacts: 18, completedDate: '2024-11-15', description: 'Contacted GCs and architects before Chicago trip' },
    { id: 'c-2', name: 'Q3 Overdue Quotes', type: 'overdue-quotes', contacts: 24, completedDate: '2024-10-28', description: 'Follow-up on expired Q3 quotes' },
    { id: 'c-3', name: 'AIA Conference Attendees', type: 'event-attendees', contacts: 45, completedDate: '2024-08-20', description: 'Post-conference follow-up with new contacts' },
    { id: 'c-4', name: 'Dallas Trip', type: 'city-visit', contacts: 8, completedDate: '2024-08-10', description: 'Pre-trip outreach for Dallas area clients' },
  ], []);

  // Filter flows based on search query (always filter out 'custom' - it's accessed via Create New Campaign)
  const filteredNewFlowTypes = useMemo(() => {
    const templates = newFlowTypes.filter(f => f.id !== 'custom');
    if (!flowSearchQuery) return templates;
    const query = flowSearchQuery.toLowerCase();
    return templates.filter(f =>
      f.name.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query)
    );
  }, [newFlowTypes, flowSearchQuery]);

  const filteredInProgressFlows = useMemo(() => {
    if (!flowSearchQuery) return inProgressFlows;
    const query = flowSearchQuery.toLowerCase();
    return inProgressFlows.filter(f => f.name.toLowerCase().includes(query));
  }, [inProgressFlows, flowSearchQuery]);

  const filteredCompletedFlows = useMemo(() => {
    if (!flowSearchQuery) return completedFlows;
    const query = flowSearchQuery.toLowerCase();
    return completedFlows.filter(f =>
      f.name.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query)
    );
  }, [completedFlows, flowSearchQuery]);

  // Filtered and sorted emails
  const filteredEmails = useMemo(() => {
    let result = [...emails];

    // Email tab filter (New vs Filed)
    if (emailTab === 'new') {
      result = result.filter(e => !e.filed);
    } else if (emailTab === 'filed') {
      result = result.filter(e => !!e.filed);
    }

    // Folder filter
    if (folderFilter !== 'all') {
      result = result.filter(e => e.folder === folderFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(e => e.priority === priorityFilter);
    }

    // Tag filter (if any tags selected, show emails that have at least one)
    if (tagFilter.length > 0) {
      result = result.filter(e => e.tags.some(t => tagFilter.includes(t)));
    }

    // Sender filter
    if (senderFilter.length > 0) {
      result = result.filter(e => senderFilter.includes(e.from.name));
    }

    // Job filter
    if (jobFilter.length > 0) {
      result = result.filter(e => (e.associatedJobs || []).some(j => jobFilter.includes(j)));
    }

    // Quote filter
    if (quoteFilter.length > 0) {
      result = result.filter(e => (e.associatedQuotes || []).some(q => quoteFilter.includes(q)));
    }

    // Company filter
    if (companyFilter.length > 0) {
      result = result.filter(e => (e.associatedCompanies || []).some(c => companyFilter.includes(c)));
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(e => statusFilter === 'processed' ? e.processed : !e.processed);
    }

    // Subject filter
    if (subjectFilter.length > 0) {
      result = result.filter(e => subjectFilter.includes(e.subject));
    }

    // Participants filter (check from, to, and cc)
    if (participantsFilter.length > 0) {
      result = result.filter(e => {
        const emailParticipants = [
          e.from.name,
          ...e.to.map(p => p.name),
          ...e.cc.map(p => p.name)
        ];
        return participantsFilter.some(p => emailParticipants.includes(p));
      });
    }

    // Follow-up filter
    if (followUpFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter(e => {
        switch (followUpFilter) {
          case 'has-followup':
            return !!e.followUp;
          case 'no-followup':
            return !e.followUp;
          case 'overdue':
            if (!e.followUp) return false;
            const followUpDate = new Date(e.followUp.date);
            return followUpDate < today;
          case 'upcoming':
            if (!e.followUp) return false;
            const upcomingDate = new Date(e.followUp.date);
            return upcomingDate >= today;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.subject.toLowerCase().includes(query) ||
        e.body.toLowerCase().includes(query) ||
        e.from.name.toLowerCase().includes(query) ||
        e.from.email.toLowerCase().includes(query) ||
        e.to.some(t => t.name.toLowerCase().includes(query) || t.email.toLowerCase().includes(query)) ||
        e.tags.some(t => t.toLowerCase().includes(query)) ||
        e.category.toLowerCase().includes(query) ||
        (e.associatedJobs || []).some(j => j.toLowerCase().includes(query)) ||
        (e.associatedQuotes || []).some(q => q.toLowerCase().includes(query)) ||
        (e.associatedCompanies || []).some(c => c.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'sender':
          comparison = a.from.name.localeCompare(b.from.name);
          break;
        case 'subject':
          comparison = a.subject.localeCompare(b.subject);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'priority':
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = (a.processed ? 1 : 0) - (b.processed ? 1 : 0);
          break;
        case 'jobs':
          comparison = (a.associatedJobs?.[0] || '').localeCompare(b.associatedJobs?.[0] || '');
          break;
        case 'quotes':
          comparison = (a.associatedQuotes?.[0] || '').localeCompare(b.associatedQuotes?.[0] || '');
          break;
        case 'companies':
          comparison = (a.associatedCompanies?.[0] || '').localeCompare(b.associatedCompanies?.[0] || '');
          break;
        case 'participants':
          // Sort by the first participant (from) then first to
          const aParticipants = [a.from.name, ...a.to.map(p => p.name)].join(', ');
          const bParticipants = [b.from.name, ...b.to.map(p => p.name)].join(', ');
          comparison = aParticipants.localeCompare(bParticipants);
          break;
        case 'followUp':
          // Sort by follow-up date (emails with follow-ups first, then by date)
          if (a.followUp && b.followUp) {
            comparison = new Date(a.followUp.date).getTime() - new Date(b.followUp.date).getTime();
          } else if (a.followUp) {
            comparison = -1; // a has follow-up, b doesn't - a comes first
          } else if (b.followUp) {
            comparison = 1; // b has follow-up, a doesn't - b comes first
          } else {
            comparison = 0; // neither has follow-up
          }
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [emails, emailTab, folderFilter, searchQuery, sortBy, sortOrder, categoryFilter, tagFilter, priorityFilter, senderFilter, jobFilter, quoteFilter, companyFilter, statusFilter, subjectFilter, participantsFilter, followUpFilter]);

  // Organize filed emails into hierarchical structure by category > subcategory path
  const filedEmailsHierarchy = useMemo(() => {
    const filedEmails = emails.filter(e => !!e.filed);
    const hierarchy: Record<string, Record<string, Email[]>> = {};

    filedEmails.forEach(email => {
      if (!email.filed) return;
      const category = email.filed.category || 'Uncategorized';
      // Join multiple subcategories into a path string
      const subcategoryPath = email.filed.subcategories && email.filed.subcategories.length > 0
        ? email.filed.subcategories.join(' > ')
        : 'General';

      if (!hierarchy[category]) {
        hierarchy[category] = {};
      }
      if (!hierarchy[category][subcategoryPath]) {
        hierarchy[category][subcategoryPath] = [];
      }
      hierarchy[category][subcategoryPath].push(email);
    });

    // Sort emails within each subcategory by date (most recent first)
    Object.keys(hierarchy).forEach(cat => {
      Object.keys(hierarchy[cat]).forEach(subcat => {
        hierarchy[cat][subcat].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    });

    return hierarchy;
  }, [emails]);

  // Initialize filed emails sections to be expanded by default
  useEffect(() => {
    const categories = Object.keys(filedEmailsHierarchy);
    const subcategoryKeys: string[] = [];

    categories.forEach(category => {
      Object.keys(filedEmailsHierarchy[category]).forEach(subcategory => {
        subcategoryKeys.push(`${category}:${subcategory}`);
      });
    });

    setExpandedFileCategories(new Set(categories));
    setExpandedFileSubcategories(new Set(subcategoryKeys));
  }, [filedEmailsHierarchy]);

  // Get context for selected email
  const emailContacts = selectedEmail ? getAllContactsFromEmail(selectedEmail) : [];
  const currentContactContext = selectedContactId ? mockContactContexts[selectedContactId] :
    (emailContacts[0] ? mockContactContexts[emailContacts[0].id] : null);

  // Handlers
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setViewMode('email');
    // Mark as read
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    // Set initial contact context
    const contacts = getAllContactsFromEmail(email);
    if (contacts.length > 0) {
      setSelectedContactId(contacts[0].id);
    }
  };

  const handleBackToList = () => {
    setViewMode('spreadsheet');
    setSelectedEmail(null);
    setComposeMode(null);
    setSelectedContactId(null);
    // Clear meeting param from URL if present
    if (searchParams.get('meeting')) {
      router.replace('/flowmail');
    }
    setCameFromCalendar(false);
    sessionStorage.removeItem('calendarReturnPath');
  };

  const handleBackToCalendar = () => {
    sessionStorage.removeItem('calendarReturnPath');
    setCameFromCalendar(false);
    router.push('/flow-calendar');
  };

  const handleCompose = (mode: 'new' | 'reply' | 'forward') => {
    setComposeMode(mode);
    if (mode === 'new') {
      // Open normal compose view for new emails
      setViewMode('compose');
      setComposeTo('');
      setComposeCc('');
      setComposeSubject('');
      setComposeBody('');
    } else if (mode === 'reply' && selectedEmail) {
      setComposeTo(selectedEmail.from.email);
      setComposeSubject(`Re: ${selectedEmail.subject}`);
      setComposeBody('');
    } else if (mode === 'forward' && selectedEmail) {
      setComposeTo('');
      setComposeSubject(`Fwd: ${selectedEmail.subject}`);
      setComposeBody(`\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.from.name} <${selectedEmail.from.email}>\nDate: ${new Date(selectedEmail.date).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`);
    }
  };

  // Workflow/Campaign handlers
  const handleOpenWorkflowSelector = () => {
    setViewMode('workflow-select');
  };

  const handleSelectWorkflow = (workflowId: string) => {
    const template = newFlowTypes.find(f => f.id === workflowId);
    if (template) {
      setSelectedWorkflowTemplate(template);
      // Initialize campaign form with template values
      setCampaignName('');
      setCampaignListType(template.criteria.type === 'manual-select' ? 'static' : template.criteria.type === 'criteria-based' ? 'criteria' : 'dynamic');
      setCampaignEntity(template.criteria.entity || '');
      setCampaignField(template.criteria.field || '');
      setCampaignOperator(template.criteria.operator || '');
      setCampaignValue(template.criteria.value || '');
      setCampaignConditions((template.criteria.additionalFields || []).map(f => ({ field: f.field, operator: f.operator, value: f.value || '' })));
      setCampaignSubject(template.emailTemplate.subject || '');
      setCampaignBody(template.emailTemplate.body || '');
      // Reset static list selection state
      setStaticListSearch('');
      setStaticListCompanyFilter('');
      setStaticListRoleFilter('');
      setSelectedStaticContacts(new Set());
      setShowCampaignModal(true);
    }
  };

  const handleBackFromCampaign = () => {
    setViewMode('spreadsheet');
    setSelectedWorkflowTemplate(null);
  };

  const handleBackFromWorkflowSelector = () => {
    setViewMode('spreadsheet');
  };

  // Meeting handlers
  const resetMeetingForm = () => {
    setMeetingTitle('');
    setMeetingDescription('');
    setMeetingDate('');
    setMeetingStartTime('10:30');
    setMeetingEndTime('11:00');
    setMeetingIsAllDay(false);
    setMeetingLocation('');
    setMeetingIsOnline(true);
    setMeetingIsInPerson(false);
    setMeetingRequiredAttendees([]);
    setMeetingOptionalAttendees([]);
    setMeetingShowAs('busy');
    setMeetingReminder(15);
    setMeetingIsRecurring(false);
    setMeetingRecurrencePattern('');
    setEditingMeetingId(null);
    setCreatingMeetingFromEmailId(null);
  };

  const handleNewMeeting = () => {
    resetMeetingForm();
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(tomorrow.toISOString().split('T')[0]);
    setShowMeetingComposer(true);
  };

  const handleCreateMeetingFromEmail = (email: Email) => {
    resetMeetingForm();
    setCreatingMeetingFromEmailId(email.id);

    // Pre-fill from email data
    setMeetingTitle(`Discussion: ${email.subject}`);
    setMeetingDescription(`Follow-up meeting regarding:\n\n${email.body}`);

    // Add email participants as required attendees
    const attendees: string[] = [];
    if (email.from.email !== 'me@flowconnect.com') {
      attendees.push(email.from.email);
    }
    email.to.forEach(t => {
      if (t.email !== 'me@flowconnect.com' && !attendees.includes(t.email)) {
        attendees.push(t.email);
      }
    });
    email.cc.forEach(c => {
      if (c.email !== 'me@flowconnect.com' && !attendees.includes(c.email)) {
        attendees.push(c.email);
      }
    });
    setMeetingRequiredAttendees(attendees);

    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(tomorrow.toISOString().split('T')[0]);

    setShowMeetingComposer(true);
  };

  const handleMeetingClick = (meeting: Meeting) => {
    // Open the meeting detail view (similar to email detail view)
    setSelectedMeeting(meeting);
    setEditingMeetingId(meeting.id);
    setMeetingTitle(meeting.title);
    setMeetingDescription(meeting.description);
    setMeetingDate(meeting.date);
    setMeetingStartTime(meeting.startTime);
    setMeetingEndTime(meeting.endTime);
    setMeetingIsAllDay(meeting.isAllDay);
    setMeetingLocation(meeting.location);
    setMeetingIsOnline(meeting.isOnline);
    setMeetingIsInPerson(meeting.isInPerson);
    setMeetingRequiredAttendees(meeting.requiredAttendees.map(a => a.email));
    setMeetingOptionalAttendees(meeting.optionalAttendees.map(a => a.email));
    setMeetingShowAs(meeting.showAs);
    setMeetingReminder(meeting.reminder);
    setMeetingIsRecurring(meeting.isRecurring);
    setMeetingRecurrencePattern(meeting.recurrencePattern || '');
    // Set first attendee as selected for context sidebar
    if (meeting.requiredAttendees.length > 0 && meeting.requiredAttendees[0].contactId) {
      setSelectedMeetingContactId(meeting.requiredAttendees[0].contactId);
    } else if (meeting.optionalAttendees.length > 0 && meeting.optionalAttendees[0].contactId) {
      setSelectedMeetingContactId(meeting.optionalAttendees[0].contactId);
    } else {
      setSelectedMeetingContactId(null);
    }
    setViewMode('meeting');
  };

  const handleEditMeeting = (meeting: Meeting) => {
    // Legacy function - now redirects to meeting view
    handleMeetingClick(meeting);
  };

  const handleSaveMeeting = () => {
    const newMeeting: Meeting = {
      id: editingMeetingId || `m${Date.now()}`,
      title: meetingTitle,
      description: meetingDescription,
      date: meetingDate,
      startTime: meetingStartTime,
      endTime: meetingEndTime,
      isAllDay: meetingIsAllDay,
      location: meetingLocation,
      isOnline: meetingIsOnline,
      teamsLink: meetingIsOnline ? `https://teams.microsoft.com/meet/${Date.now()}` : undefined,
      requiredAttendees: meetingRequiredAttendees.map(email => {
        const contact = mockContacts.find(c => c.email === email);
        return { email, name: contact?.name || email.split('@')[0], type: 'required' as const, contactId: contact?.id };
      }),
      optionalAttendees: meetingOptionalAttendees.map(email => {
        const contact = mockContacts.find(c => c.email === email);
        return { email, name: contact?.name || email.split('@')[0], type: 'optional' as const, contactId: contact?.id };
      }),
      showAs: meetingShowAs,
      reminder: meetingReminder,
      isRecurring: meetingIsRecurring,
      recurrencePattern: meetingIsRecurring ? meetingRecurrencePattern : undefined,
      isInPerson: meetingIsInPerson,
      organizer: { email: 'me@flowconnect.com', name: 'Current User', type: 'required' },
      responseStatus: 'accepted',
      createdFromEmailId: creatingMeetingFromEmailId || undefined,
    };

    if (editingMeetingId) {
      setMeetings(prev => prev.map(m => m.id === editingMeetingId ? newMeeting : m));
    } else {
      setMeetings(prev => [...prev, newMeeting]);
    }

    setShowMeetingComposer(false);
    resetMeetingForm();
  };

  const handleSendFollowUpFromMeeting = (meeting: Meeting) => {
    // Pre-fill compose with meeting info
    setComposeMode('new');
    setViewMode('compose');

    // Combine all attendees
    const allAttendees = [
      ...meeting.requiredAttendees.map(a => a.email),
      ...meeting.optionalAttendees.map(a => a.email),
    ].filter(email => email !== 'me@flowconnect.com');

    setComposeTo(allAttendees.join(', '));
    setComposeCc('');
    setComposeSubject(`Follow-up: ${meeting.title}`);
    setComposeBody(`Hi everyone,\n\nThank you for attending the meeting on ${new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.\n\n--- Meeting Summary ---\n${meeting.description}\n\nPlease let me know if you have any questions or follow-up items.\n\nBest regards`);
  };

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const contacts = selectedEmail ? getAllContactsFromEmail(selectedEmail) : [];
      const generatedBody = generateMockEmail(contacts, selectedToneStyle);
      setComposeBody(generatedBody);
      setIsGenerating(false);
    }, 1500);
  };

  const handleAutoGenerateWithPrompt = () => {
    if (!generationPrompt.trim()) return;
    setIsGenerating(true);
    setShowPromptModal(false);
    setTimeout(() => {
      const contacts = selectedEmail ? getAllContactsFromEmail(selectedEmail) : [];
      const generatedBody = generateMockEmail(contacts, selectedToneStyle, generationPrompt);
      setComposeBody(generatedBody);
      setIsGenerating(false);
      setGenerationPrompt('');
    }, 1500);
  };

  const handleSendEmail = () => {
    // Mock sending email
    const newEmail: Email = {
      id: `e${Date.now()}`,
      threadId: `t${Date.now()}`,
      from: { email: 'me@flowconnect.com', name: 'Current User' },
      to: [{ email: composeTo, name: composeTo.split('@')[0] }],
      cc: composeCc ? [{ email: composeCc, name: composeCc.split('@')[0] }] : [],
      subject: composeSubject,
      body: composeBody,
      bodyHtml: '',
      date: new Date().toISOString(),
      read: true,
      starred: false,
      hasAttachments: composeAttachments.length > 0,
      attachments: composeAttachments,
      labels: [],
      tags: [],
      category: 'Other',
      folder: 'sent',
      provider: 'microsoft365',
      priority: 'normal',
      processed: false,
    };
    setEmails(prev => [newEmail, ...prev]);
    setComposeAttachments([]);
    handleBackToList();
  };

  // Rich text formatting functions
  const applyFormatting = (format: string) => {
    const textarea = document.querySelector('textarea[data-compose-body]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = composeBody.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'bullet':
        formattedText = `\n• ${selectedText}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
      case 'numbered':
        formattedText = `\n1. ${selectedText}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'quote':
        formattedText = `\n> ${selectedText}`;
        cursorOffset = selectedText ? 0 : 0;
        break;
      default:
        formattedText = selectedText;
    }

    const newBody = composeBody.substring(0, start) + formattedText + composeBody.substring(end);
    setComposeBody(newBody);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + formattedText.length - cursorOffset;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // File attachment functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || 'application/octet-stream',
    }));

    setComposeAttachments(prev => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeAttachment = (attachmentId: string) => {
    setComposeAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21,15 16,10 5,21"/>
        </svg>
      );
    }
    if (type.includes('pdf')) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>
    );
  };

  const handleCreateTask = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === emailId);
    if (!email) return;

    setCreatingTaskEmailId(emailId);

    // Simulate task creation delay
    setTimeout(() => {
      const newTask: CreatedTask = {
        id: `task-${Date.now()}`,
        emailId: emailId,
        title: `Follow up: ${email.subject}`,
        description: `Created from email from ${email.from.name}. ${email.body.substring(0, 100)}...`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
        status: 'pending',
        createdDate: new Date().toISOString(),
      };

      setCreatedTasks(prev => [...prev, newTask]);
      setEmails(prev => prev.map(em =>
        em.id === emailId ? { ...em, createdTaskId: newTask.id } : em
      ));
      setCreatingTaskEmailId(null);
    }, 800);
  };

  const handleProcessEmail = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === emailId);
    if (!email || email.processed) return;

    setProcessingEmailId(emailId);

    // Simulate AI processing delay
    setTimeout(() => {
      // Mock entity extraction - in real implementation this would call an AI service
      const extractedEntities = {
        contacts: email.from.contactId ? [email.from.contactId] : [],
        jobs: email.associatedJobs || [],
        quotes: email.associatedQuotes || [],
        companies: email.associatedCompanies || [],
      };

      setEmails(prev => prev.map(em =>
        em.id === emailId ? {
          ...em,
          processed: true,
          processedDate: new Date().toISOString(),
          // In real implementation, these would be updated with extracted entities
          associatedJobs: extractedEntities.jobs.length > 0 ? extractedEntities.jobs : em.associatedJobs,
          associatedQuotes: extractedEntities.quotes.length > 0 ? extractedEntities.quotes : em.associatedQuotes,
          associatedCompanies: extractedEntities.companies.length > 0 ? extractedEntities.companies : em.associatedCompanies,
        } : em
      ));
      setProcessingEmailId(null);
    }, 1500);
  };

  // Auto-file handler - simulates AI categorization
  const handleAutoFile = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === emailId);
    if (!email || email.filed) return;

    setFilingEmailId(emailId);

    // Simulate AI categorization delay
    setTimeout(() => {
      // Mock AI categorization based on email content/context
      // In real implementation, this would call an AI service to analyze the email
      let category = 'Project Communications';
      let subcategory = 'General Correspondence';

      // Simple mock logic based on email properties
      if (email.category === 'Projects') {
        category = 'Project Communications';
        if (email.subject.toLowerCase().includes('meeting') || email.subject.toLowerCase().includes('schedule')) {
          subcategory = 'Meeting Notes';
        } else if (email.subject.toLowerCase().includes('change') || email.subject.toLowerCase().includes('update')) {
          subcategory = 'Change Orders';
        } else if (email.subject.toLowerCase().includes('timeline') || email.subject.toLowerCase().includes('schedule')) {
          subcategory = 'Schedule Updates';
        } else {
          subcategory = 'General Correspondence';
        }
      } else if (email.category === 'Sales' || email.associatedQuotes?.length) {
        category = 'Sales & Quotes';
        if (email.subject.toLowerCase().includes('quote') || email.subject.toLowerCase().includes('proposal')) {
          subcategory = email.folder === 'sent' ? 'Quote Responses' : 'Quote Requests';
        } else if (email.subject.toLowerCase().includes('negotiat') || email.subject.toLowerCase().includes('pricing')) {
          subcategory = 'Negotiations';
        } else {
          subcategory = 'Follow-ups';
        }
      } else if (email.category === 'Partnerships') {
        category = 'Vendor & Supplier';
        if (email.subject.toLowerCase().includes('partner')) {
          subcategory = 'Product Info';
        } else {
          subcategory = 'Pricing Updates';
        }
      } else if (email.category === 'Support') {
        category = 'Customer Support';
        subcategory = 'General Inquiries';
      } else if (email.category === 'Documentation') {
        category = 'Legal & Compliance';
        subcategory = 'Certifications';
      } else if (email.category === 'Internal') {
        category = 'Internal';
        subcategory = 'Team Updates';
      }

      setEmails(prev => prev.map(em =>
        em.id === emailId ? {
          ...em,
          filed: {
            category,
            subcategories: [subcategory],
            tags: email.tags || [],
            filedDate: new Date().toISOString(),
            autoFiled: true,
          },
        } : em
      ));
      setFilingEmailId(null);
    }, 1000);
  };

  // Unfile email handler
  const handleUnfile = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(em =>
      em.id === emailId ? { ...em, filed: undefined } : em
    ));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleStarEmail = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, starred: !email.starred } : email
    ));
  };

  const handleOpenFollowUp = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === emailId);
    setFollowUpEmailId(emailId);
    // Pre-fill with existing follow-up if any
    if (email?.followUp) {
      setFollowUpDate(email.followUp.date);
      setFollowUpDismissOnReply(email.followUp.dismissOnReply);
      setFollowUpNotes(email.followUp.notes || '');
      setFollowUpNotesExpanded(!!email.followUp.notes);
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowUpDate(tomorrow.toISOString().split('T')[0]);
      setFollowUpDismissOnReply(followUpSettings.dismissOnReplyDefault);
      setFollowUpNotes('');
      setFollowUpNotesExpanded(false);
    }
    // Reset calendar to current month
    const now = new Date();
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
    setShowFollowUpSettings(false);
    setShowFollowUpModal(true);
  };

  const handleSelectFollowUpDate = (date: string) => {
    setFollowUpDate(date);
    // If one-click save is enabled, save immediately
    if (followUpSettings.oneClickSave && followUpEmailId) {
      setEmails(prev => prev.map(email =>
        email.id === followUpEmailId ? {
          ...email,
          followUp: {
            date: date,
            dismissOnReply: followUpDismissOnReply,
            notes: followUpNotes || undefined,
            createdDate: new Date().toISOString(),
          }
        } : email
      ));
      setShowFollowUpModal(false);
      setFollowUpEmailId(null);
      setFollowUpDate('');
      setFollowUpNotes('');
    }
  };

  const handleQuickFollowUp = (days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dateStr = targetDate.toISOString().split('T')[0];
    handleSelectFollowUpDate(dateStr);
  };

  const handleSetFollowUp = () => {
    if (!followUpEmailId || !followUpDate) return;

    setEmails(prev => prev.map(email =>
      email.id === followUpEmailId ? {
        ...email,
        followUp: {
          date: followUpDate,
          dismissOnReply: followUpDismissOnReply,
          notes: followUpNotes || undefined,
          createdDate: new Date().toISOString(),
        }
      } : email
    ));
    setShowFollowUpModal(false);
    setFollowUpEmailId(null);
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  const handleRemoveFollowUp = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, followUp: undefined } : email
    ));
  };

  // Get suggested filing info based on email content
  const getSuggestedFiling = (email: Email) => {
    // Simple heuristic based on email category and tags
    let category = 'Projects';
    let subcategory = 'Active Projects';
    const tags: string[] = [];

    // Map email category to file category
    if (email.category === 'Sales') {
      category = 'Sales & Quotes';
      if (email.tags.some(t => t.toLowerCase().includes('quote'))) {
        subcategory = 'Quote Requests';
      } else if (email.tags.some(t => t.toLowerCase().includes('negotiat'))) {
        subcategory = 'Negotiations';
      } else if (email.tags.some(t => t.toLowerCase().includes('follow'))) {
        subcategory = 'Follow-ups';
      } else {
        subcategory = 'Quote Responses';
      }
    } else if (email.category === 'Support') {
      category = 'Support';
      subcategory = 'Technical Support';
    } else if (email.category === 'Partnerships') {
      category = 'Partnerships';
      subcategory = 'Vendor Communications';
    } else if (email.category === 'Documentation') {
      category = 'Documentation';
      subcategory = 'Specs & Submittals';
    } else if (email.category === 'Internal') {
      category = 'Internal';
      subcategory = 'Team Updates';
    }

    // Add relevant tags
    if (email.priority === 'high') tags.push('Urgent');
    if (email.hasAttachments) tags.push('Has Attachments');
    email.tags.slice(0, 3).forEach(t => {
      if (!tags.includes(t)) tags.push(t);
    });

    return { category, subcategory, tags };
  };

  const handleOpenFile = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === emailId);
    if (!email) return;

    setFileEmailId(emailId);

    // Pre-fill with existing filing if any, otherwise use suggestions
    if (email.filed) {
      setFileCategory(email.filed.category);
      setFileSubcategories(email.filed.subcategories || []);
      setFileTags(email.filed.tags || []);
    } else {
      const suggested = getSuggestedFiling(email);
      setFileCategory(suggested.category);
      setFileSubcategories([suggested.subcategory]);
      setFileTags(suggested.tags);
    }

    // If auto-file is enabled and email isn't already filed, file immediately
    if (fileSettings.autoFileOnClick && !email.filed) {
      const suggested = getSuggestedFiling(email);
      setEmails(prev => prev.map(em =>
        em.id === emailId ? {
          ...em,
          filed: {
            category: suggested.category,
            subcategories: [suggested.subcategory],
            tags: suggested.tags,
            filedDate: new Date().toISOString(),
            autoFiled: true,
          }
        } : em
      ));
      return; // Don't show modal
    }

    setShowFileSettings(false);
    setShowFileModal(true);
  };

  const handleFileEmail = () => {
    if (!fileEmailId || !fileCategory) return;

    setEmails(prev => prev.map(email =>
      email.id === fileEmailId ? {
        ...email,
        filed: {
          category: fileCategory,
          subcategories: fileSubcategories,
          tags: fileTags,
          filedDate: new Date().toISOString(),
          autoFiled: false,
        }
      } : email
    ));
    setShowFileModal(false);
    setFileEmailId(null);
    setFileCategory('');
    setFileSubcategories([]);
    setFileTags([]);
  };

  const handleRemoveFile = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, filed: undefined } : email
    ));
  };

  // Toggle category expansion in filed emails tree view
  const toggleFileCategory = (category: string) => {
    setExpandedFileCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Toggle subcategory expansion in filed emails tree view
  const toggleFileSubcategory = (key: string) => {
    setExpandedFileSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSetDefaultStyle = (styleId: string) => {
    setToneStyles(prev => prev.map(s => ({ ...s, isDefault: s.id === styleId })));
    const newDefault = toneStyles.find(s => s.id === styleId);
    if (newDefault) setSelectedToneStyle(newDefault);
  };

  const handleSaveStyle = (style: EmailToneStyle) => {
    if (editingStyle) {
      setToneStyles(prev => prev.map(s => s.id === style.id ? style : s));
    } else {
      setToneStyles(prev => [...prev, { ...style, id: `ts${Date.now()}`, createdDate: new Date().toISOString() }]);
    }
    setEditingStyle(null);
  };

  const handleDeleteStyle = (styleId: string) => {
    setToneStyles(prev => prev.filter(s => s.id !== styleId));
  };

  const handleSaveTemplate = (template: EmailTemplate) => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates(prev => [...prev, { ...template, id: `tpl${Date.now()}`, createdDate: new Date().toISOString() }]);
    }
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
    setComposeSubject(template.subject);
    setComposeBody(template.body);
    setShowTemplatesModal(false);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Projects': return 'bg-blue-100 text-blue-700';
      case 'Sales': return 'bg-green-100 text-green-700';
      case 'Support': return 'bg-orange-100 text-orange-700';
      case 'Partnerships': return 'bg-purple-100 text-purple-700';
      case 'Documentation': return 'bg-yellow-100 text-yellow-700';
      case 'Internal': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'normal': return 'bg-gray-100 text-gray-600';
      case 'low': return 'bg-blue-50 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const renderEmailList = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">FlowMail</h1>
          <div className="flex items-center gap-3">
            {/* Emails / Meetings / Both Toggle */}
            <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
              <button
                onClick={() => setItemViewFilter('emails')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  itemViewFilter === 'emails'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
                Emails
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${itemViewFilter === 'emails' ? 'bg-[var(--primary)]/10' : 'bg-white/50'}`}>
                  {emails.length}
                </span>
              </button>
              <button
                onClick={() => setItemViewFilter('meetings')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  itemViewFilter === 'meetings'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Meetings
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${itemViewFilter === 'meetings' ? 'bg-[var(--primary)]/10' : 'bg-white/50'}`}>
                  {meetings.length}
                </span>
              </button>
              <button
                onClick={() => setItemViewFilter('both')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  itemViewFilter === 'both'
                    ? 'bg-white text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                Both
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${itemViewFilter === 'both' ? 'bg-[var(--primary)]/10' : 'bg-white/50'}`}>
                  {emails.length + meetings.length}
                </span>
              </button>

              {/* Default View Settings */}
              <div className="relative">
                <button
                  data-default-view-trigger
                  onClick={() => setShowDefaultViewDropdown(!showDefaultViewDropdown)}
                  className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/50 rounded transition-colors"
                  title="Set default view"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                </button>
                {showDefaultViewDropdown && (
                  <div className="default-view-dropdown absolute top-full right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-30 min-w-[200px] py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase border-b border-[var(--border)]">
                      Default View
                    </div>
                    {(['emails', 'meetings', 'both'] as const).map(view => (
                      <button
                        key={view}
                        onClick={() => {
                          setDefaultItemView(view);
                          setItemViewFilter(view);
                          setShowDefaultViewDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-[var(--muted)] transition-colors ${defaultItemView === view ? 'bg-[var(--muted)]' : ''}`}
                      >
                        <span className="capitalize">{view}</span>
                        {defaultItemView === view && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </button>
                    ))}
                    <div className="px-3 py-2 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] mt-1">
                      This will be your default view when opening FlowMail
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column Configuration Button */}
            {viewMode === 'spreadsheet' && (
              <div className="relative">
                <button
                  data-column-config-trigger
                  onClick={() => setShowColumnConfig(!showColumnConfig)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--muted)] rounded-lg hover:bg-[var(--muted)]/80 transition-colors"
                  title="Configure columns"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  <span>{activeLayout.name}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showColumnConfig ? 'rotate-180' : ''}`}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                {/* Column Configuration Dropdown */}
                {showColumnConfig && (
                  <div className="column-config-dropdown absolute top-full left-0 mt-2 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-30 min-w-[320px]">
                    {/* Saved Layouts */}
                    <div className="p-3 border-b border-[var(--border)]">
                      <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Saved Views</div>
                      <div className="space-y-1">
                        {savedLayouts.map(layout => (
                          <div key={layout.id} className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setActiveLayoutId(layout.id);
                              }}
                              className={`flex-1 px-3 py-2 text-left text-sm rounded hover:bg-[var(--muted)] ${activeLayoutId === layout.id ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary)]' : ''}`}
                            >
                              {layout.name}
                              <span className="text-xs opacity-70 ml-2">({layout.columns.length} columns)</span>
                            </button>
                            {!layout.isDefault && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete "${layout.name}"?`)) {
                                    setSavedLayouts(prev => prev.filter(l => l.id !== layout.id));
                                    if (activeLayoutId === layout.id) {
                                      setActiveLayoutId('default');
                                    }
                                  }
                                }}
                                className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column Selection */}
                    <div className="p-3 border-b border-[var(--border)]">
                      <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Visible Columns</div>
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {ALL_COLUMNS.map(col => {
                          const isVisible = activeLayout.columns.includes(col.id);
                          return (
                            <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--muted)] rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={(e) => {
                                  setSavedLayouts(prev => prev.map(layout => {
                                    if (layout.id === activeLayoutId) {
                                      if (e.target.checked) {
                                        return { ...layout, columns: [...layout.columns, col.id] };
                                      } else {
                                        return { ...layout, columns: layout.columns.filter(c => c !== col.id) };
                                      }
                                    }
                                    return layout;
                                  }));
                                }}
                                className="w-4 h-4 accent-[var(--primary)]"
                              />
                              <span className="text-sm">{col.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column Order */}
                    <div className="p-3 border-b border-[var(--border)]">
                      <div className="text-xs font-semibold text-[var(--muted-foreground)] uppercase mb-2">Column Order (drag to reorder)</div>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {activeLayout.columns.map((colId, index) => {
                          const col = ALL_COLUMNS.find(c => c.id === colId);
                          if (!col) return null;
                          return (
                            <div key={colId} className="flex items-center gap-2 px-2 py-1.5 bg-[var(--muted)]/50 rounded">
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => {
                                    if (index === 0) return;
                                    setSavedLayouts(prev => prev.map(layout => {
                                      if (layout.id === activeLayoutId) {
                                        const newColumns = [...layout.columns];
                                        [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
                                        return { ...layout, columns: newColumns };
                                      }
                                      return layout;
                                    }));
                                  }}
                                  disabled={index === 0}
                                  className="p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 15l-6-6-6 6"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    if (index === activeLayout.columns.length - 1) return;
                                    setSavedLayouts(prev => prev.map(layout => {
                                      if (layout.id === activeLayoutId) {
                                        const newColumns = [...layout.columns];
                                        [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
                                        return { ...layout, columns: newColumns };
                                      }
                                      return layout;
                                    }));
                                  }}
                                  disabled={index === activeLayout.columns.length - 1}
                                  className="p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30"
                                >
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 9l6 6 6-6"/>
                                  </svg>
                                </button>
                              </div>
                              <span className="text-sm flex-1">{col.label}</span>
                              <span className="text-xs text-[var(--muted-foreground)]">#{index + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save New Layout */}
                    <div className="p-3">
                      {isCreatingLayout ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Layout name..."
                            value={editingLayoutName}
                            onChange={(e) => setEditingLayoutName(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded bg-[var(--background)]"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editingLayoutName.trim()) {
                                const newLayout: SavedColumnLayout = {
                                  id: `custom-${Date.now()}`,
                                  name: editingLayoutName.trim(),
                                  columns: [...activeLayout.columns],
                                };
                                setSavedLayouts(prev => [...prev, newLayout]);
                                setActiveLayoutId(newLayout.id);
                                setEditingLayoutName('');
                                setIsCreatingLayout(false);
                              }
                            }}
                            className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded hover:opacity-90"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingLayoutName('');
                              setIsCreatingLayout(false);
                            }}
                            className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsCreatingLayout(true)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[var(--primary)] hover:bg-[var(--muted)] rounded border border-dashed border-[var(--border)]"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14"/>
                          </svg>
                          Save Current as New Layout
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => handleCompose('new')}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Compose
            </button>
            <button
              onClick={() => handleNewMeeting()}
              className="px-4 py-2 bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Meeting
            </button>
          </div>
        </div>

        {/* Email Tab Filter (New Email / Filed Email) - only show when emails are visible */}
        <div className="flex items-center gap-3 mb-3">
          {(itemViewFilter === 'emails' || itemViewFilter === 'both') && (
            <div className="flex">
              <button
                onClick={() => setEmailTab('new')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  emailTab === 'new'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  New
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${emailTab === 'new' ? 'bg-[var(--primary)]/10' : 'bg-[var(--muted)]'}`}>
                    {emails.filter(e => !e.filed).length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setEmailTab('filed')}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  emailTab === 'filed'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  Filed
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${emailTab === 'filed' ? 'bg-[var(--primary)]/10' : 'bg-[var(--muted)]'}`}>
                    {emails.filter(e => !!e.filed).length}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Filters Row 1 */}
        <div className="flex items-center gap-4 flex-wrap mb-3">
          {/* Folder tabs */}
          <div className="flex gap-1 bg-[var(--muted)] rounded-lg p-1">
            {(['inbox', 'sent', 'drafts', 'all'] as const).map(folder => (
              <button
                key={folder}
                onClick={() => setFolderFilter(folder)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  folderFilter === folder
                    ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {folder.charAt(0).toUpperCase() + folder.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search emails, tags, jobs, quotes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort (only visible in list view) */}
          {viewMode === 'list' && (
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] text-sm"
              >
                <option value="date">Date</option>
                <option value="sender">Sender</option>
                <option value="subject">Subject</option>
                <option value="category">Category</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortOrder === 'asc' ? 'rotate-180' : ''}>
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </button>
            </div>
          )}

          {/* Active filters display (for list view) */}
          {viewMode === 'list' && (categoryFilter !== 'all' || priorityFilter !== 'all' || tagFilter.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {categoryFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-[var(--secondary)] text-[var(--foreground)] rounded-full flex items-center gap-1">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter('all')} className="hover:text-red-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              )}
              {priorityFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-[var(--secondary)] text-[var(--foreground)] rounded-full flex items-center gap-1">
                  {priorityFilter} priority
                  <button onClick={() => setPriorityFilter('all')} className="hover:text-red-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              )}
              {tagFilter.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button onClick={() => setTagFilter(prev => prev.filter(t => t !== tag))} className="hover:text-red-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </span>
              ))}
              {(categoryFilter !== 'all' || priorityFilter !== 'all' || tagFilter.length > 0) && (
                <button
                  onClick={() => { setCategoryFilter('all'); setPriorityFilter('all'); setTagFilter([]); }}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Email List or Spreadsheet View */}
      <div className="flex-1 overflow-y-auto">
        {emailTab === 'filed' ? (
          /* Filed Emails Spreadsheet View with Collapsible Sections */
          <div className="bg-[var(--card)] border-b border-[var(--border)]">
            {Object.keys(filedEmailsHierarchy).length === 0 ? (
              <div className="p-8 text-center text-[var(--muted-foreground)]">
                No filed emails
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)] sticky top-0 z-10">
                    <tr>
                      {/* Checkbox column */}
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-10">
                        <input
                          type="checkbox"
                          checked={selectedEmails.length === emails.filter(e => e.filed).length && emails.filter(e => e.filed).length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmails(emails.filter(em => em.filed).map(em => em.id));
                            } else {
                              setSelectedEmails([]);
                            }
                          }}
                          className="w-4 h-4 accent-[var(--primary)]"
                        />
                      </th>
                      {/* Dynamic columns rendered in order */}
                      {activeLayout.columns.map(colId => renderHeader(colId))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {Object.entries(filedEmailsHierarchy).sort(([a], [b]) => a.localeCompare(b)).map(([category, subcategories]) => {
                      const categoryEmailCount = Object.values(subcategories).reduce((sum, emails) => sum + emails.length, 0);
                      const isCategoryExpanded = expandedFileCategories.has(category);

                      return (
                        <React.Fragment key={category}>
                          {/* Category Section Header Row */}
                          <tr
                            className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 cursor-pointer"
                            onClick={() => toggleFileCategory(category)}
                          >
                            <td colSpan={activeLayout.columns.length + 2} className="px-3 py-2.5">
                              <div className="flex items-center gap-3">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={`transition-transform ${isCategoryExpanded ? 'rotate-90' : ''}`}
                                >
                                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                                </svg>
                                <span className="font-semibold text-[var(--foreground)]">{category}</span>
                                <span className="px-2 py-0.5 text-xs bg-[var(--primary)]/20 text-[var(--primary)] rounded-full font-medium">
                                  {categoryEmailCount} email{categoryEmailCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Subcategories and Emails */}
                          {isCategoryExpanded && Object.entries(subcategories).sort(([a], [b]) => a.localeCompare(b)).map(([subcategory, subEmails]) => {
                            const subcategoryKey = `${category}:${subcategory}`;
                            const isSubcategoryExpanded = expandedFileSubcategories.has(subcategoryKey);

                            return (
                              <React.Fragment key={subcategoryKey}>
                                {/* Subcategory Section Header Row */}
                                <tr
                                  className="bg-[var(--muted)]/40 hover:bg-[var(--muted)]/60 cursor-pointer"
                                  onClick={() => toggleFileSubcategory(subcategoryKey)}
                                >
                                  <td colSpan={activeLayout.columns.length + 2} className="px-3 py-2 pl-10">
                                    <div className="flex items-center gap-3">
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className={`transition-transform ${isSubcategoryExpanded ? 'rotate-90' : ''}`}
                                      >
                                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                                      </svg>
                                      <span className="text-sm font-medium text-[var(--foreground)]">{subcategory}</span>
                                      <span className="px-1.5 py-0.5 text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] rounded-full">
                                        {subEmails.length}
                                      </span>
                                    </div>
                                  </td>
                                </tr>

                                {/* Email Rows in Subcategory */}
                                {isSubcategoryExpanded && subEmails.map((email) => (
                                  <tr
                                    key={email.id}
                                    className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${!email.read ? 'bg-[var(--secondary)]/50' : ''}`}
                                    onClick={() => handleEmailClick(email)}
                                  >
                                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={selectedEmails.includes(email.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedEmails(prev => [...prev, email.id]);
                                          } else {
                                            setSelectedEmails(prev => prev.filter(id => id !== email.id));
                                          }
                                        }}
                                        className="w-4 h-4 accent-[var(--primary)]"
                                      />
                                    </td>
                                    {/* Dynamic columns rendered in order */}
                                    {activeLayout.columns.map(colId => renderCell(colId, email))}
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            No emails found
          </div>
        ) : viewMode === 'spreadsheet' ? (
          /* Spreadsheet View */
          <div className="bg-[var(--card)] border-b border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--muted)]/30 border-b border-[var(--border)] sticky top-0 z-10">
                  <tr>
                    {/* Checkbox column */}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-10">
                      <input
                        type="checkbox"
                        checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmails(filteredEmails.map(e => e.id));
                          } else {
                            setSelectedEmails([]);
                          }
                        }}
                        className="w-4 h-4 accent-[var(--primary)]"
                      />
                    </th>
                    {/* Dynamic columns rendered in order */}
                    {activeLayout.columns.map(colId => renderHeader(colId))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {/* Email rows */}
                  {(itemViewFilter === 'emails' || itemViewFilter === 'both') && filteredEmails.map((email) => (
                    <tr
                      key={email.id}
                      className={`hover:bg-[var(--muted)]/20 transition-colors cursor-pointer ${!email.read ? 'bg-[var(--secondary)]/50' : ''}`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(email.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmails(prev => [...prev, email.id]);
                            } else {
                              setSelectedEmails(prev => prev.filter(id => id !== email.id));
                            }
                          }}
                          className="w-4 h-4 accent-[var(--primary)]"
                        />
                      </td>
                      {/* Dynamic columns rendered in order */}
                      {activeLayout.columns.map(colId => renderCell(colId, email))}
                    </tr>
                  ))}
                  {/* Meeting rows */}
                  {(itemViewFilter === 'meetings' || itemViewFilter === 'both') && meetings.map((meeting) => (
                    <tr
                      key={meeting.id}
                      className="hover:bg-[var(--muted)]/20 transition-colors cursor-pointer"
                      onClick={() => handleMeetingClick(meeting)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          disabled
                          className="w-4 h-4 accent-[var(--primary)] opacity-50"
                        />
                      </td>
                      {/* Dynamic columns rendered in order - same as emails */}
                      {activeLayout.columns.map(colId => renderMeetingCell(colId, meeting))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="divide-y divide-[var(--border)]">
            {/* Email items */}
            {(itemViewFilter === 'emails' || itemViewFilter === 'both') && filteredEmails.map(email => (
              <div
                key={email.id}
                onClick={() => handleEmailClick(email)}
                className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-[var(--muted)] transition-colors ${
                  !email.read ? 'bg-[var(--secondary)]' : ''
                }`}
              >
                {/* Star */}
                <button
                  onClick={(e) => handleStarEmail(email.id, e)}
                  className={`mt-1 ${email.starred ? 'text-yellow-500' : 'text-[var(--muted-foreground)] hover:text-yellow-500'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={email.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium flex-shrink-0">
                  {email.from.name.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className={`font-medium truncate ${!email.read ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                      {email.folder === 'sent' ? `To: ${email.to[0]?.name || email.to[0]?.email}` : email.from.name}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <div className={`text-sm truncate mb-1 ${!email.read ? 'font-medium text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                    {email.subject}
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate mb-2">
                    {email.body.substring(0, 100)}...
                  </div>
                  {/* Tags row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(email.category)}`}>
                      {email.category}
                    </span>
                    {email.priority === 'high' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                        High Priority
                      </span>
                    )}
                    {email.tags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {email.tags.length > 2 && (
                      <span className="text-xs text-[var(--muted-foreground)]">+{email.tags.length - 2} tags</span>
                    )}
                  </div>
                </div>

                {/* Indicators and Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* Status indicators row */}
                  <div className="flex items-center gap-2">
                    {email.hasAttachments && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                    )}
                    {/* Processed indicator */}
                    {email.processed ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs" title="Processed">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs" title="Not processed">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      </span>
                    )}
                    {/* Task created indicator */}
                    {email.createdTaskId && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs" title="Task created">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  {/* Jobs and quotes info */}
                  <div className="flex flex-col items-end gap-0.5">
                    {(email.associatedJobs?.length || 0) > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">{email.associatedJobs?.length} job(s)</span>
                    )}
                    {(email.associatedQuotes?.length || 0) > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">{email.associatedQuotes?.length} quote(s)</span>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Create Task Button */}
                    <button
                      onClick={(e) => handleCreateTask(email.id, e)}
                      disabled={!!email.createdTaskId || creatingTaskEmailId === email.id}
                      className={`p-1.5 rounded transition-colors ${
                        email.createdTaskId
                          ? 'bg-green-50 text-green-600 cursor-default'
                          : creatingTaskEmailId === email.id
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                      title={email.createdTaskId ? 'Task already created' : 'Create task from email'}
                    >
                      {creatingTaskEmailId === email.id ? (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      )}
                    </button>
                    {/* Process Email Button */}
                    <button
                      onClick={(e) => handleProcessEmail(email.id, e)}
                      disabled={email.processed || processingEmailId === email.id}
                      className={`p-1.5 rounded transition-colors ${
                        email.processed
                          ? 'bg-green-50 text-green-600 cursor-default'
                          : processingEmailId === email.id
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                      title={email.processed ? 'Already processed' : 'Process email for entities'}
                    >
                      {processingEmailId === email.id ? (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Meeting items - styled same as emails */}
            {(itemViewFilter === 'meetings' || itemViewFilter === 'both') && meetings.map(meeting => (
              <div
                key={meeting.id}
                onClick={() => handleMeetingClick(meeting)}
                className="p-4 flex items-start gap-4 cursor-pointer hover:bg-[var(--muted)] transition-colors"
              >
                {/* Star equivalent - response status */}
                <button className={`mt-1 ${
                  meeting.responseStatus === 'accepted' ? 'text-green-500' :
                  meeting.responseStatus === 'tentative' ? 'text-yellow-500' :
                  meeting.responseStatus === 'declined' ? 'text-red-500' : 'text-[var(--muted-foreground)]'
                }`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={meeting.responseStatus === 'accepted' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium flex-shrink-0">
                  {meeting.organizer.name.charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-medium truncate text-[var(--foreground)]">
                      {meeting.organizer.name}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                      {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-sm truncate mb-1 font-medium text-[var(--foreground)] flex items-center gap-2">
                    {/* Calendar icon before subject */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 flex-shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {meeting.isOnline && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500 flex-shrink-0">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    )}
                    {meeting.isRecurring && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500 flex-shrink-0">
                        <polyline points="17 1 21 5 17 9"/>
                        <path d="M3 11V9a4 4 0 014-4h14"/>
                        <polyline points="7 23 3 19 7 15"/>
                        <path d="M21 13v2a4 4 0 01-4 4H3"/>
                      </svg>
                    )}
                    <span className="truncate">{meeting.title}</span>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate mb-2">
                    {meeting.isAllDay ? 'All day' : `${meeting.startTime} - ${meeting.endTime}`}
                    {meeting.location && ` • ${meeting.location}`}
                    {!meeting.location && meeting.isOnline && ' • Online'}
                  </div>
                  {/* Tags row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                      Meeting
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      meeting.showAs === 'busy' ? 'bg-red-100 text-red-700' :
                      meeting.showAs === 'free' ? 'bg-green-100 text-green-700' :
                      meeting.showAs === 'tentative' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {meeting.showAs}
                    </span>
                  </div>
                </div>

                {/* Indicators and Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* Attendees count */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {meeting.requiredAttendees.length + meeting.optionalAttendees.length} attendees
                    </span>
                  </div>
                  {/* Jobs and companies info */}
                  <div className="flex flex-col items-end gap-0.5">
                    {(meeting.associatedJobs?.length || 0) > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">{meeting.associatedJobs?.length} job(s)</span>
                    )}
                    {(meeting.associatedCompanies?.length || 0) > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">{meeting.associatedCompanies?.length} company(s)</span>
                    )}
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditMeeting(meeting)}
                      className="p-1.5 rounded transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                      title="Edit meeting"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleSendFollowUpFromMeeting(meeting)}
                      className="p-1.5 rounded transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100"
                      title="Send follow-up email"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"/>
                        <path d="M22 7l-10 7L2 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContextSidebar = () => {
    if (!currentContactContext) return null;

    const { contact, recentActivity, notes, tasks, jobs, quotes } = currentContactContext;

    return (
      <div className="w-96 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto">
        {/* Contact selector if multiple contacts */}
        {emailContacts.length > 1 && (
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex gap-2 overflow-x-auto">
              {emailContacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContactId(c.id)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    selectedContactId === c.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contact header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium text-lg">
              {contact.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)]">{contact.name}</h3>
              <p className="text-sm text-[var(--muted-foreground)]">{contact.role}</p>
              <p className="text-sm text-[var(--muted-foreground)]">{contact.company}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border-b border-[var(--border)]">
          <button
            onClick={() => toggleSection('activity')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
          >
            <span className="font-medium text-[var(--foreground)]">Recent Activity</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('activity') ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {expandedSections.has('activity') && (
            <div className="px-4 pb-4 space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No recent activity</p>
              ) : (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-2 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'call' ? 'bg-green-100 text-green-600' :
                      activity.type === 'email' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'call' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}
                      {activity.type === 'email' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>}
                      {activity.type === 'meeting' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
                      {activity.type === 'note' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>}
                    </div>
                    <div className="flex-1">
                      <p className="text-[var(--foreground)]">{activity.description}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="border-b border-[var(--border)]">
          <button
            onClick={() => toggleSection('notes')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
          >
            <span className="font-medium text-[var(--foreground)]">Notes ({notes.length})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('notes') ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {expandedSections.has('notes') && (
            <div className="px-4 pb-4 space-y-2">
              {notes.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No notes</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-2 bg-[var(--muted)] rounded-lg">
                    <p className="font-medium text-sm text-[var(--foreground)]">{note.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{note.content}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{new Date(note.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="border-b border-[var(--border)]">
          <button
            onClick={() => toggleSection('tasks')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
          >
            <span className="font-medium text-[var(--foreground)]">Tasks ({tasks.length})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('tasks') ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {expandedSections.has('tasks') && (
            <div className="px-4 pb-4 space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No tasks</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-[var(--muted)] rounded-lg">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-[var(--muted-foreground)]'
                    }`}>
                      {task.status === 'completed' && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M5 12l5 5L20 7"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${task.status === 'completed' ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>{task.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Jobs */}
        <div className="border-b border-[var(--border)]">
          <button
            onClick={() => toggleSection('jobs')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
          >
            <span className="font-medium text-[var(--foreground)]">Jobs ({jobs.length})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('jobs') ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {expandedSections.has('jobs') && (
            <div className="px-4 pb-4 space-y-2">
              {jobs.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No jobs</p>
              ) : (
                jobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => { setSelectedJob(job); setShowJobModal(true); }}
                    className="p-3 bg-[var(--muted)] rounded-lg cursor-pointer hover:bg-[var(--secondary)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-[var(--foreground)]">{job.name}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        job.status === 'Active' ? 'bg-green-100 text-green-700' :
                        job.status === 'Bidding' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{job.value}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">GC: {job.gc}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quotes */}
        <div className="border-b border-[var(--border)]">
          <button
            onClick={() => toggleSection('quotes')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
          >
            <span className="font-medium text-[var(--foreground)]">Quotes ({quotes.length})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('quotes') ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          {expandedSections.has('quotes') && (
            <div className="px-4 pb-4 space-y-2">
              {quotes.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No quotes</p>
              ) : (
                quotes.map(quote => (
                  <div
                    key={quote.id}
                    onClick={() => { setSelectedQuote(quote); setShowQuoteModal(true); }}
                    className="p-3 bg-[var(--muted)] rounded-lg cursor-pointer hover:bg-[var(--secondary)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-[var(--foreground)]">{quote.name}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        quote.stage === 'Sent' ? 'bg-blue-100 text-blue-700' :
                        quote.stage === 'Draft' ? 'bg-gray-100 text-gray-700' :
                        quote.stage === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {quote.stage}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{quote.value}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Expires: {new Date(quote.expirationDate).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    );
  };

  const renderEmailView = () => {
    if (!selectedEmail) return null;

    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Email content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)]">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Inbox
            </button>

            <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">{selectedEmail.subject}</h1>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium">
                {selectedEmail.from.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">{selectedEmail.from.name}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">&lt;{selectedEmail.from.email}&gt;</span>
                </div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  To: {selectedEmail.to.map(t => t.name || t.email).join(', ')}
                  {selectedEmail.cc.length > 0 && ` • CC: ${selectedEmail.cc.map(c => c.name || c.email).join(', ')}`}
                </div>
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                {new Date(selectedEmail.date).toLocaleString()}
              </div>
            </div>

            {/* Attachments */}
            {selectedEmail.hasAttachments && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedEmail.attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)] rounded-lg text-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                    <span>{att.name}</span>
                    <span className="text-[var(--muted-foreground)]">({att.size})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email body */}
          <div className="p-6">
            <div className="whitespace-pre-wrap text-[var(--foreground)]">
              {selectedEmail.body}
            </div>
          </div>

          {/* Reply section */}
          <div className="p-6 border-t border-[var(--border)]">
            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => handleCompose('reply')}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 17l-5-5 5-5M4 12h16"/>
                </svg>
                Reply
              </button>
              <button
                onClick={() => handleCompose('forward')}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 17l5-5-5-5M20 12H4"/>
                </svg>
                Forward
              </button>
              {/* Create Meeting from Email button */}
              <button
                onClick={() => selectedEmail && handleCreateMeetingFromEmail(selectedEmail)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="12" y1="14" x2="12" y2="18"/>
                  <line x1="10" y1="16" x2="14" y2="16"/>
                </svg>
                Create Meeting
              </button>
              {/* Process by AI button */}
              <button
                onClick={() => {
                  if (selectedEmail) {
                    setEmails(prev => prev.map(email =>
                      email.id === selectedEmail.id
                        ? { ...email, processed: true, processedDate: new Date().toISOString() }
                        : email
                    ));
                  }
                }}
                disabled={selectedEmail?.processed}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  selectedEmail?.processed
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {selectedEmail?.processed ? (
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                  )}
                </svg>
                {selectedEmail?.processed ? 'AI Processed' : 'Process by AI'}
              </button>
              {/* Tone Styles button */}
              <button
                onClick={() => setShowToneStylesModal(true)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"/>
                  <circle cx="7.5" cy="10" r="1.5"/>
                  <circle cx="12" cy="7" r="1.5"/>
                  <circle cx="16.5" cy="10" r="1.5"/>
                </svg>
                Tone Styles
              </button>
              {/* Templates button */}
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Templates
              </button>
            </div>

            {/* Compose area when replying */}
            {composeMode && (
              <div className="space-y-4">
                {composeMode === 'forward' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">To</label>
                    <input
                      type="email"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="recipient@example.com"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Message</label>

                  {/* Rich Text Toolbar */}
                  <div className="flex items-center gap-1 p-2 border border-b-0 border-[var(--border)] rounded-t-lg bg-[var(--muted)]">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                      title="Bold"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                        <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('italic')}
                      className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                      title="Italic"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="4" x2="10" y2="4"/>
                        <line x1="14" y1="20" x2="5" y2="20"/>
                        <line x1="15" y1="4" x2="9" y2="20"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('underline')}
                      className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                      title="Underline"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/>
                        <line x1="4" y1="21" x2="20" y2="21"/>
                      </svg>
                    </button>

                    <div className="w-px h-5 bg-[var(--border)] mx-1" />

                    <button
                      type="button"
                      onClick={() => applyFormatting('bullet')}
                      className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                      title="Bullet List"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <circle cx="4" cy="6" r="1" fill="currentColor"/>
                        <circle cx="4" cy="12" r="1" fill="currentColor"/>
                        <circle cx="4" cy="18" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('link')}
                      className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                      title="Insert Link"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>

                    <div className="flex-1" />

                    {/* Spec Sheets button with dropdown */}
                    <div className="relative">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowSpecSheetsModal(true)}
                          className="p-1.5 rounded-l hover:bg-[var(--background)] transition-colors flex items-center gap-1 text-sm text-[var(--muted-foreground)] border-r border-[var(--border)]"
                          title="Attach Spec Sheets"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6"/>
                            <path d="M8 13h8M8 17h5"/>
                          </svg>
                          <span>Spec Sheets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSpecSheetDropdown(!showSpecSheetDropdown)}
                          className="p-1.5 rounded-r hover:bg-[var(--background)] transition-colors text-[var(--muted-foreground)]"
                          title="More options"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                      </div>
                      {showSpecSheetDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowSpecSheetDropdown(false)} />
                          <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[180px]">
                            <button
                              type="button"
                              onClick={() => {
                                setShowSpecSheetDropdown(false);
                                setShowOpenCatalogModal(true);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
                              </svg>
                              Attach from Open Catalog
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Attachment button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded hover:bg-[var(--background)] transition-colors flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
                      title="Attach File"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                      </svg>
                      <span>Attach</span>
                    </button>
                  </div>

                  <textarea
                    data-compose-body
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-t-0 border-[var(--border)] rounded-b-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    placeholder="Write your reply..."
                  />

                  {/* Attachments Display */}
                  {composeAttachments.length > 0 && (
                    <div className="mt-2 p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
                      <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                        Attachments ({composeAttachments.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {composeAttachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 px-2 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-sm"
                          >
                            <span className="text-[var(--muted-foreground)]">
                              {getFileIcon(attachment.type)}
                            </span>
                            <span className="text-[var(--foreground)] max-w-[150px] truncate">
                              {attachment.name}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              ({attachment.size})
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(attachment.id)}
                              className="p-0.5 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-red-500"
                              title="Remove attachment"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Generation buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleAutoGenerate}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                    )}
                    Auto Generate Email
                  </button>
                  <button
                    onClick={() => setShowPromptModal(true)}
                    disabled={isGenerating}
                    className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    Auto Generate with Prompt
                  </button>
                </div>

                {/* Send button */}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setComposeMode(null)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Context sidebar */}
        {renderContextSidebar()}
      </div>
    );
  };

  // Get all contacts from meeting attendees
  const getMeetingContacts = (meeting: Meeting): Contact[] => {
    const contacts: Contact[] = [];
    const addedEmails = new Set<string>();

    [...meeting.requiredAttendees, ...meeting.optionalAttendees].forEach(attendee => {
      if (attendee.contactId && !addedEmails.has(attendee.email)) {
        const contact = mockContacts.find(c => c.id === attendee.contactId);
        if (contact) {
          contacts.push(contact);
          addedEmails.add(attendee.email);
        }
      }
    });

    return contacts;
  };

  // Get meeting contact context (similar to email contact context)
  const getMeetingContactContext = (contactId: string) => {
    const contact = mockContacts.find(c => c.id === contactId);
    if (!contact) return null;

    return {
      contact,
      recentActivity: [
        { type: 'email', description: 'Sent quote follow-up', date: '2 days ago' },
        { type: 'meeting', description: 'Project kickoff call', date: '1 week ago' },
        { type: 'note', description: 'Discussed budget concerns', date: '2 weeks ago' },
      ],
      notes: [
        { id: '1', content: 'Prefers morning meetings', date: '2025-01-15' },
        { id: '2', content: 'Key decision maker for electrical', date: '2025-01-10' },
      ],
      tasks: [
        { id: '1', title: 'Send updated proposal', dueDate: '2025-01-25', completed: false },
        { id: '2', title: 'Schedule site visit', dueDate: '2025-01-28', completed: false },
      ],
      jobs: [
        { id: 'j1', name: 'Downtown Plaza Renovation', status: 'In Progress', value: '$125,000', gc: 'BuilderCo Inc.', ec: 'FlowConnect' },
      ],
      quotes: [
        { id: 'q1', name: 'Electrical Package - Phase 2', stage: 'Pending', value: '$45,000', expirationDate: '2025-02-15' },
      ],
    };
  };

  const renderMeetingContextSidebar = () => {
    if (!selectedMeeting) return null;

    const meetingContacts = getMeetingContacts(selectedMeeting);
    const currentContext = selectedMeetingContactId ? getMeetingContactContext(selectedMeetingContactId) : null;

    return (
      <div className="w-96 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto">
        {/* Contact selector if multiple attendees */}
        {meetingContacts.length > 1 && (
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex gap-2 overflow-x-auto">
              {meetingContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedMeetingContactId(contact.id)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    selectedMeetingContactId === contact.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  {contact.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentContext ? (
          <>
            {/* Contact header */}
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium text-lg">
                  {currentContext.contact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{currentContext.contact.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{currentContext.contact.role}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{currentContext.contact.company}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('activity')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">Recent Activity</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('activity') ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {expandedSections.has('activity') && (
                <div className="px-4 pb-4 space-y-2">
                  {currentContext.recentActivity.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No recent activity</p>
                  ) : (
                    currentContext.recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'call' ? 'bg-green-100 text-green-600' :
                          activity.type === 'email' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'meeting' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.type === 'call' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}
                          {activity.type === 'email' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>}
                          {activity.type === 'meeting' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
                          {activity.type === 'note' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>}
                        </div>
                        <div className="flex-1">
                          <p className="text-[var(--foreground)]">{activity.description}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{activity.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('notes')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">Notes ({currentContext.notes.length})</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('notes') ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {expandedSections.has('notes') && (
                <div className="px-4 pb-4 space-y-2">
                  {currentContext.notes.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No notes</p>
                  ) : (
                    currentContext.notes.map(note => (
                      <div key={note.id} className="p-2 bg-[var(--muted)] rounded-lg">
                        <p className="font-medium text-sm text-[var(--foreground)]">{(note as { title?: string }).title || note.content}</p>
                        {(note as { title?: string }).title && <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">{note.content}</p>}
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{new Date(note.date).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('tasks')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">Tasks ({currentContext.tasks.length})</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('tasks') ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {expandedSections.has('tasks') && (
                <div className="px-4 pb-4 space-y-2">
                  {currentContext.tasks.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No tasks</p>
                  ) : (
                    currentContext.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 bg-[var(--muted)] rounded-lg">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          task.completed ? 'bg-green-500 border-green-500' : 'border-[var(--muted-foreground)]'
                        }`}>
                          {task.completed && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M5 12l5 5L20 7"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${task.completed ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>{task.title}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Jobs */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('jobs')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">Jobs ({currentContext.jobs.length})</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('jobs') ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {expandedSections.has('jobs') && (
                <div className="px-4 pb-4 space-y-2">
                  {currentContext.jobs.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No jobs</p>
                  ) : (
                    currentContext.jobs.map(job => (
                      <div
                        key={job.id}
                        onClick={() => { setSelectedJob(job); setShowJobModal(true); }}
                        className="p-3 bg-[var(--muted)] rounded-lg cursor-pointer hover:bg-[var(--secondary)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-[var(--foreground)]">{job.name}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            job.status === 'Active' ? 'bg-green-100 text-green-700' :
                            job.status === 'Bidding' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{job.value}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">GC: {job.gc}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quotes */}
            <div className="border-b border-[var(--border)]">
              <button
                onClick={() => toggleSection('quotes')}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">Quotes ({currentContext.quotes.length})</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('quotes') ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {expandedSections.has('quotes') && (
                <div className="px-4 pb-4 space-y-2">
                  {currentContext.quotes.length === 0 ? (
                    <p className="text-sm text-[var(--muted-foreground)]">No quotes</p>
                  ) : (
                    currentContext.quotes.map(quote => (
                      <div
                        key={quote.id}
                        onClick={() => { setSelectedQuote(quote); setShowQuoteModal(true); }}
                        className="p-3 bg-[var(--muted)] rounded-lg cursor-pointer hover:bg-[var(--secondary)] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-[var(--foreground)]">{quote.name}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            quote.stage === 'Won' ? 'bg-green-100 text-green-700' :
                            quote.stage === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            quote.stage === 'Lost' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {quote.stage}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{quote.value}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-4 text-sm text-[var(--muted-foreground)] text-center">
            {meetingContacts.length === 0 ? 'No contact information available for attendees' : 'Select an attendee to view details'}
          </div>
        )}
      </div>
    );
  };

  const renderMeetingView = () => {
    if (!selectedMeeting) return null;

    const reminderOptions = [
      { value: 0, label: 'None' },
      { value: 5, label: '5 minutes' },
      { value: 15, label: '15 minutes' },
      { value: 30, label: '30 minutes' },
      { value: 60, label: '1 hour' },
      { value: 120, label: '2 hours' },
      { value: 1440, label: '1 day' },
    ];

    const showAsOptions = [
      { value: 'busy', label: 'Busy', color: 'bg-red-500' },
      { value: 'free', label: 'Free', color: 'bg-green-500' },
      { value: 'tentative', label: 'Tentative', color: 'bg-yellow-500' },
      { value: 'out-of-office', label: 'Out of Office', color: 'bg-purple-500' },
    ];

    const handleSaveMeetingChanges = () => {
      const updatedMeeting: Meeting = {
        ...selectedMeeting,
        title: meetingTitle,
        description: meetingDescription,
        date: meetingDate,
        startTime: meetingStartTime,
        endTime: meetingEndTime,
        isAllDay: meetingIsAllDay,
        location: meetingLocation,
        isOnline: meetingIsOnline,
        isInPerson: meetingIsInPerson,
        requiredAttendees: meetingRequiredAttendees.map(email => {
          const contact = mockContacts.find(c => c.email === email);
          return { email, name: contact?.name || email.split('@')[0], type: 'required' as const, contactId: contact?.id };
        }),
        optionalAttendees: meetingOptionalAttendees.map(email => {
          const contact = mockContacts.find(c => c.email === email);
          return { email, name: contact?.name || email.split('@')[0], type: 'optional' as const, contactId: contact?.id };
        }),
        showAs: meetingShowAs,
        reminder: meetingReminder,
        isRecurring: meetingIsRecurring,
        recurrencePattern: meetingIsRecurring ? meetingRecurrencePattern : undefined,
      };

      setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
      setSelectedMeeting(updatedMeeting);
    };

    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Main meeting content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)] bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-3 py-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
                FlowMail Inbox
              </button>
              <span className="text-[var(--muted-foreground)]">|</span>
              <button
                onClick={handleBackToCalendar}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${cameFromCalendar ? 'text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Flow Calendar
              </button>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <input
                    type="text"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="text-xl font-semibold text-[var(--foreground)] bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 -ml-1 w-full"
                    placeholder="Meeting title"
                  />
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {meetingIsAllDay ? 'All day' : `${meetingStartTime} - ${meetingEndTime}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {new Date(meetingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCalendarPopup(true)}
                  className="px-3 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  View Calendar
                </button>
                <button
                  onClick={handleSaveMeetingChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Meeting configuration */}
          <div className="p-6 space-y-6">
            {/* Date and Time Section */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Date & Time
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meetingIsAllDay}
                      onChange={(e) => setMeetingIsAllDay(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">All day</span>
                  </label>
                </div>
                {!meetingIsAllDay && (
                  <>
                    <div>
                      <label className="block text-sm text-[var(--muted-foreground)] mb-1">Start Time</label>
                      <select
                        value={meetingStartTime}
                        onChange={(e) => setMeetingStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                          return <option key={time} value={time}>{displayTime}</option>;
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--muted-foreground)] mb-1">End Time</label>
                      <select
                        value={meetingEndTime}
                        onChange={(e) => setMeetingEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                          return <option key={time} value={time}>{displayTime}</option>;
                        })}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meetingIsRecurring}
                    onChange={(e) => setMeetingIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 014-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 01-4 4H3"/>
                  </svg>
                  <span className="text-sm">Make recurring</span>
                </label>
                {meetingIsRecurring && (
                  <select
                    value={meetingRecurrencePattern}
                    onChange={(e) => setMeetingRecurrencePattern(e.target.value)}
                    className="px-3 py-1 border border-[var(--border)] rounded-lg bg-[var(--background)] text-sm"
                  >
                    <option value="">Select pattern...</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>
            </div>

            {/* Attendees Section */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
                Attendees
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-2">Required</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {meetingRequiredAttendees.map(email => (
                      <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                        {mockContacts.find(c => c.email === email)?.name || email}
                        <button onClick={() => setMeetingRequiredAttendees(prev => prev.filter(e => e !== email))} className="hover:text-blue-600">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="email"
                    placeholder="Add required attendee..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value && !meetingRequiredAttendees.includes(input.value)) {
                          setMeetingRequiredAttendees(prev => [...prev, input.value]);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-2">Optional</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {meetingOptionalAttendees.map(email => (
                      <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                        {mockContacts.find(c => c.email === email)?.name || email}
                        <button onClick={() => setMeetingOptionalAttendees(prev => prev.filter(e => e !== email))} className="hover:text-gray-600">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="email"
                    placeholder="Add optional attendee..."
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value && !meetingOptionalAttendees.includes(input.value)) {
                          setMeetingOptionalAttendees(prev => [...prev, input.value]);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Location
              </h3>
              <input
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="Add a room or location"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meetingIsInPerson}
                    onChange={(e) => setMeetingIsInPerson(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">In-person event</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMeetingIsOnline(!meetingIsOnline)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${meetingIsOnline ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${meetingIsOnline ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className="text-sm">Teams meeting</span>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
                Options
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">Show as</label>
                  <div className="flex gap-2">
                    {showAsOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setMeetingShowAs(opt.value as typeof meetingShowAs)}
                        className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                          meetingShowAs === opt.value
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">Reminder</label>
                  <select
                    value={meetingReminder}
                    onChange={(e) => setMeetingReminder(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {reminderOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} before</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="17" y1="10" x2="3" y2="10"/>
                  <line x1="21" y1="6" x2="3" y2="6"/>
                  <line x1="21" y1="14" x2="3" y2="14"/>
                  <line x1="17" y1="18" x2="3" y2="18"/>
                </svg>
                Description
              </h3>

              {/* AI Generation Toolbar */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <button
                  onClick={() => setShowToneStylesModal(true)}
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
                  </svg>
                  Tone & Style
                </button>
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                  Templates
                </button>
                <button
                  onClick={() => {
                    // Auto generate meeting description based on title and attendees
                    const attendeeNames = [...meetingRequiredAttendees, ...meetingOptionalAttendees].join(', ');
                    const generatedDescription = `Meeting: ${meetingTitle}\n\nAttendees: ${attendeeNames || 'TBD'}\n\nAgenda:\n1. \n2. \n3. \n\nObjectives:\n- \n\nAction Items:\n- `;
                    setMeetingDescription(generatedDescription);
                  }}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  )}
                  Auto Generate
                </button>
                <button
                  onClick={() => setShowPromptModal(true)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                  Generate with Prompt
                </button>
              </div>

              <textarea
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                placeholder="Add a description or agenda..."
                rows={6}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSendFollowUpFromMeeting(selectedMeeting)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 7l-10 7L2 7"/>
                </svg>
                Send Follow-up Email
              </button>
              <button
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                onClick={() => {
                  setMeetings(prev => prev.filter(m => m.id !== selectedMeeting.id));
                  handleBackToList();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Delete Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Context sidebar for meeting attendees */}
        {renderMeetingContextSidebar()}

        {/* Calendar Popup */}
        {showCalendarPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCalendarPopup(false)} />
            <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-lg font-semibold">Calendar View</h2>
                <button onClick={() => setShowCalendarPopup(false)} className="p-2 hover:bg-[var(--muted)] rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {/* Simple calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-sm font-medium text-[var(--muted-foreground)]">{day}</div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const date = new Date(meetingDate);
                    date.setDate(1);
                    const firstDay = date.getDay();
                    const dayNum = i - firstDay + 1;
                    const currentDate = new Date(date.getFullYear(), date.getMonth(), dayNum);
                    const isCurrentMonth = currentDate.getMonth() === date.getMonth();
                    const isMeetingDay = currentDate.toDateString() === new Date(meetingDate).toDateString();
                    const hasMeeting = meetings.some(m => new Date(m.date).toDateString() === currentDate.toDateString());

                    return (
                      <div
                        key={i}
                        className={`py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                          !isCurrentMonth ? 'text-gray-300 dark:text-gray-700' :
                          isMeetingDay ? 'bg-blue-500 text-white' :
                          hasMeeting ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'hover:bg-[var(--muted)]'
                        }`}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setMeetingDate(currentDate.toISOString().split('T')[0]);
                          }
                        }}
                      >
                        {dayNum > 0 && dayNum <= new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() ? dayNum : ''}
                        {hasMeeting && isCurrentMonth && !isMeetingDay && (
                          <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Meetings on selected date */}
                <div className="mt-6 border-t border-[var(--border)] pt-4">
                  <h3 className="text-sm font-semibold mb-3">Meetings on {new Date(meetingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  <div className="space-y-2">
                    {meetings.filter(m => m.date === meetingDate).map(m => (
                      <div key={m.id} className={`p-3 rounded-lg border ${m.id === selectedMeeting?.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-[var(--border)]'}`}>
                        <div className="font-medium">{m.title}</div>
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {m.isAllDay ? 'All day' : `${m.startTime} - ${m.endTime}`}
                        </div>
                      </div>
                    ))}
                    {meetings.filter(m => m.date === meetingDate).length === 0 && (
                      <div className="text-sm text-[var(--muted-foreground)]">No meetings scheduled</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComposeView = () => (
    <div className="flex-1 flex overflow-hidden w-full">
      {/* Left side - Compose form */}
      <div className="flex-1 overflow-y-auto p-6">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Inbox
        </button>

        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-6">New Email</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">To</label>
            <input
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">CC</label>
            <input
              type="email"
              value={composeCc}
              onChange={(e) => setComposeCc(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="cc@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Subject</label>
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Message</label>

            {/* Rich Text Toolbar */}
            <div className="flex items-center gap-1 p-2 border border-b-0 border-[var(--border)] rounded-t-lg bg-[var(--muted)]">
              <button
                type="button"
                onClick={() => applyFormatting('bold')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Bold"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                  <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('italic')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Italic"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="4" x2="10" y2="4"/>
                  <line x1="14" y1="20" x2="5" y2="20"/>
                  <line x1="15" y1="4" x2="9" y2="20"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('underline')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Underline"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/>
                  <line x1="4" y1="21" x2="20" y2="21"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('strikethrough')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Strikethrough"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="12" x2="20" y2="12"/>
                  <path d="M17.5 7.5c-.5-1.5-2-2.5-4-2.5-3 0-4.5 1.5-4.5 3.5 0 1 .5 1.5 1.5 2"/>
                  <path d="M6.5 16.5c.5 1.5 2 2.5 4 2.5 3 0 4.5-1.5 4.5-3.5 0-1-.5-1.5-1.5-2"/>
                </svg>
              </button>

              <div className="w-px h-5 bg-[var(--border)] mx-1" />

              <button
                type="button"
                onClick={() => applyFormatting('bullet')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Bullet List"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="4" cy="6" r="1" fill="currentColor"/>
                  <circle cx="4" cy="12" r="1" fill="currentColor"/>
                  <circle cx="4" cy="18" r="1" fill="currentColor"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('numbered')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Numbered List"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="10" y1="6" x2="21" y2="6"/>
                  <line x1="10" y1="12" x2="21" y2="12"/>
                  <line x1="10" y1="18" x2="21" y2="18"/>
                  <text x="3" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
                  <text x="3" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
                  <text x="3" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
                </svg>
              </button>

              <div className="w-px h-5 bg-[var(--border)] mx-1" />

              <button
                type="button"
                onClick={() => applyFormatting('link')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Insert Link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('quote')}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors"
                title="Quote"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/>
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                </svg>
              </button>

              <div className="flex-1" />

              {/* Spec Sheets button with dropdown */}
              <div className="relative">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowSpecSheetsModal(true)}
                    className="p-1.5 rounded-l hover:bg-[var(--background)] transition-colors flex items-center gap-1 text-sm text-[var(--muted-foreground)] border-r border-[var(--border)]"
                    title="Attach Spec Sheets"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                      <path d="M8 13h8M8 17h5"/>
                    </svg>
                    <span>Spec Sheets</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSpecSheetDropdown(!showSpecSheetDropdown)}
                    className="p-1.5 rounded-r hover:bg-[var(--background)] transition-colors text-[var(--muted-foreground)]"
                    title="More options"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                </div>
                {showSpecSheetDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSpecSheetDropdown(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[180px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSpecSheetDropdown(false);
                          setShowOpenCatalogModal(true);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                          <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
                        </svg>
                        Attach from Open Catalog
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Attachment button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded hover:bg-[var(--background)] transition-colors flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
                title="Attach File"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
                <span>Attach</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <textarea
              data-compose-body
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 border border-t-0 border-[var(--border)] rounded-b-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              placeholder="Write your message..."
            />

            {/* Attachments Display */}
            {composeAttachments.length > 0 && (
              <div className="mt-2 p-3 border border-[var(--border)] rounded-lg bg-[var(--muted)]">
                <div className="text-xs font-medium text-[var(--muted-foreground)] mb-2">
                  Attachments ({composeAttachments.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {composeAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 px-2 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded text-sm"
                    >
                      <span className="text-[var(--muted-foreground)]">
                        {getFileIcon(attachment.type)}
                      </span>
                      <span className="text-[var(--foreground)] max-w-[150px] truncate">
                        {attachment.name}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        ({attachment.size})
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        className="p-0.5 hover:bg-[var(--muted)] rounded text-[var(--muted-foreground)] hover:text-red-500"
                        title="Remove attachment"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Generation buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              )}
              Auto Generate Email
            </button>
            <button
              onClick={() => setShowPromptModal(true)}
              disabled={isGenerating}
              className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              Auto Generate with Prompt
            </button>
          </div>

          {/* Send button */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={handleBackToList}
              className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendEmail}
              disabled={!composeTo || !composeSubject}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar - Campaigns */}
      <div className="w-72 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-[var(--foreground)]">Email Campaigns</h3>
            <button
              onClick={() => setShowAllFlowsModal(true)}
              className="text-xs text-[var(--primary)] hover:underline"
            >
              See All
            </button>
          </div>
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={flowSearchQuery}
              onChange={(e) => setFlowSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

        {/* Create New Campaign Button */}
        <div className="p-4 border-b border-[var(--border)]">
          <button
            onClick={() => handleSelectWorkflow('custom')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create New Campaign
          </button>
        </div>

        {/* Start from Template Shelf */}
        {filteredNewFlowTypes.length > 0 && (
          <div className="border-b border-[var(--border)]">
            <button
              onClick={() => {
                const newSections = new Set(expandedSections);
                if (newSections.has('newFlow')) {
                  newSections.delete('newFlow');
                } else {
                  newSections.add('newFlow');
                }
                setExpandedSections(newSections);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
                <span className="font-medium text-[var(--foreground)]">Start from Template</span>
                {flowSearchQuery && <span className="text-xs text-[var(--muted-foreground)]">({filteredNewFlowTypes.length})</span>}
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`text-[var(--muted-foreground)] transition-transform ${expandedSections.has('newFlow') ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {expandedSections.has('newFlow') && (
              <div className="px-4 pb-3 space-y-1">
                {filteredNewFlowTypes.map(flow => (
                  <button
                    key={flow.id}
                    onClick={() => handleSelectWorkflow(flow.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] flex-shrink-0">
                      {flow.icon === 'location' && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>}
                      {flow.icon === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
                      {flow.icon === 'folder' && <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>}
                      {flow.icon === 'clock' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                      {flow.icon === 'document' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
                      {flow.icon === 'import' && <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}
                      {flow.icon === 'mail' && <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}
                      {flow.icon === 'users' && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>}
                      {flow.icon === 'settings' && <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>}
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--foreground)]">{flow.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">{flow.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Continue Campaign in Progress Shelf */}
        {filteredInProgressFlows.length > 0 && (
          <div className="border-b border-[var(--border)]">
            <button
              onClick={() => {
                const newSections = new Set(expandedSections);
                if (newSections.has('inProgress')) {
                  newSections.delete('inProgress');
                } else {
                  newSections.add('inProgress');
                }
                setExpandedSections(newSections);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="font-medium text-[var(--foreground)]">Continue Campaign</span>
                <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">{filteredInProgressFlows.length}</span>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`text-[var(--muted-foreground)] transition-transform ${expandedSections.has('inProgress') ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {expandedSections.has('inProgress') && (
              <div className="px-4 pb-3 space-y-1">
                {filteredInProgressFlows.map(flow => {
                  const percentComplete = Math.round(((flow.total - flow.remaining) / flow.total) * 100);
                  return (
                    <button
                      key={flow.id}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-[var(--muted)] transition-colors"
                    >
                      <div className="flex-1">
                        <div className="text-[var(--foreground)]">{flow.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{flow.remaining} of {flow.total} contacts remaining</div>
                      </div>
                      <span className="text-xs text-amber-600">{percentComplete}%</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Completed Campaigns Shelf */}
        {filteredCompletedFlows.length > 0 && (
          <div className="border-b border-[var(--border)]">
            <button
              onClick={() => {
                const newSections = new Set(expandedSections);
                if (newSections.has('completed')) {
                  newSections.delete('completed');
                } else {
                  newSections.add('completed');
                }
                setExpandedSections(newSections);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--muted)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span className="font-medium text-[var(--foreground)]">Completed Campaigns</span>
                {flowSearchQuery && <span className="text-xs text-[var(--muted-foreground)]">({filteredCompletedFlows.length})</span>}
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`text-[var(--muted-foreground)] transition-transform ${expandedSections.has('completed') ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {expandedSections.has('completed') && (
              <div className="px-4 pb-3 space-y-1">
                {filteredCompletedFlows.map(flow => (
                  <button
                    key={flow.id}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-[var(--muted)] transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-[var(--foreground)]">{flow.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{flow.contacts} contacts • Completed {new Date(flow.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] flex-shrink-0">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* No results message */}
        {flowSearchQuery && filteredNewFlowTypes.length === 0 && filteredInProgressFlows.length === 0 && filteredCompletedFlows.length === 0 && (
          <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
            No campaigns matching "{flowSearchQuery}"
          </div>
        )}
      </div>
    </div>
  );

  const renderAllFlowsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowAllFlowsModal(false)} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">All Email Campaigns</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage and start email campaigns</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAllFlowsModal(false);
                handleSelectWorkflow('custom');
              }}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create New Campaign
            </button>
            <button
              onClick={() => setShowAllFlowsModal(false)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={flowSearchQuery}
              onChange={(e) => setFlowSearchQuery(e.target.value)}
              placeholder="Search all campaigns..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Campaign Templates Section */}
          {filteredNewFlowTypes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/>
                  <path d="M9 21V9"/>
                </svg>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Campaign Templates</h3>
                <span className="text-sm text-[var(--muted-foreground)]">({filteredNewFlowTypes.length} templates)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredNewFlowTypes.map(flow => (
                  <button
                    key={flow.id}
                    onClick={() => {
                      setShowAllFlowsModal(false);
                      handleSelectWorkflow(flow.id);
                    }}
                    className="flex items-start gap-3 p-4 text-left border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] hover:border-[var(--primary)] transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)] flex-shrink-0 mt-0.5">
                      {flow.icon === 'location' && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>}
                      {flow.icon === 'calendar' && <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}
                      {flow.icon === 'folder' && <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>}
                      {flow.icon === 'clock' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                      {flow.icon === 'document' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
                      {flow.icon === 'import' && <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}
                      {flow.icon === 'mail' && <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>}
                      {flow.icon === 'users' && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>}
                      {flow.icon === 'settings' && <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>}
                    </svg>
                    <div>
                      <div className="font-medium text-[var(--foreground)]">{flow.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)] mt-0.5">{flow.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Section */}
          {filteredInProgressFlows.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">In Progress</h3>
                <span className="text-sm text-[var(--muted-foreground)]">({filteredInProgressFlows.length} flows)</span>
              </div>
              <div className="space-y-2">
                {filteredInProgressFlows.map(flow => {
                  const percentComplete = Math.round(((flow.total - flow.remaining) / flow.total) * 100);
                  return (
                    <button
                      key={flow.id}
                      onClick={() => setShowAllFlowsModal(false)}
                      className="w-full flex items-center gap-4 p-4 text-left border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] hover:border-amber-400 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-[var(--foreground)]">{flow.name}</div>
                        <div className="text-sm text-[var(--muted-foreground)] mt-0.5">
                          {flow.remaining} of {flow.total} contacts remaining • Started {new Date(flow.startedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentComplete}%` }} />
                        </div>
                        <span className="text-sm font-medium text-amber-600 w-10">{percentComplete}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Section */}
          {filteredCompletedFlows.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Completed</h3>
                <span className="text-sm text-[var(--muted-foreground)]">({filteredCompletedFlows.length} flows)</span>
              </div>
              <div className="space-y-2">
                {filteredCompletedFlows.map(flow => (
                  <button
                    key={flow.id}
                    onClick={() => setShowAllFlowsModal(false)}
                    className="w-full flex items-center gap-4 p-4 text-left border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] hover:border-green-400 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[var(--foreground)]">{flow.name}</div>
                      <div className="text-sm text-[var(--muted-foreground)] mt-0.5">{flow.description}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-1">
                        {flow.contacts} contacts • Completed {new Date(flow.completedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                      </svg>
                      <span className="text-sm">Redo</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {flowSearchQuery && filteredNewFlowTypes.length === 0 && filteredInProgressFlows.length === 0 && filteredCompletedFlows.length === 0 && (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-[var(--muted-foreground)] mb-4">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p className="text-[var(--muted-foreground)]">No flows matching "{flowSearchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderToneStylesModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowToneStylesModal(false)} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Tone Styles</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Select a tone style for AI-generated emails</p>
          </div>
          <button
            onClick={() => setShowToneStylesModal(false)}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setEditingStyle({ id: '', name: '', description: '', tone: 'custom', isDefault: false, createdDate: '' })}
                className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Add New Style
              </button>
            </div>

            {editingStyle && (
              <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)] mb-4">
                <h4 className="font-medium mb-3">{editingStyle.id ? 'Edit Style' : 'New Style'}</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingStyle.name}
                    onChange={(e) => setEditingStyle({ ...editingStyle, name: e.target.value })}
                    placeholder="Style name"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <input
                    type="text"
                    value={editingStyle.description}
                    onChange={(e) => setEditingStyle({ ...editingStyle, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <textarea
                    value={editingStyle.customInstructions || ''}
                    onChange={(e) => setEditingStyle({ ...editingStyle, customInstructions: e.target.value })}
                    placeholder="Custom instructions for AI (e.g., 'Use short sentences, be direct')"
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveStyle(editingStyle)}
                      className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingStyle(null)}
                      className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {toneStyles.map(style => (
              <div
                key={style.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedToneStyle.id === style.id
                    ? 'border-[var(--primary)] bg-[var(--secondary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)]'
                }`}
                onClick={() => setSelectedToneStyle(style)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedToneStyle.id === style.id
                        ? 'border-[var(--primary)] bg-[var(--primary)]'
                        : 'border-[var(--muted-foreground)]'
                    }`}>
                      {selectedToneStyle.id === style.id && (
                        <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--foreground)]">{style.name}</span>
                        {style.isDefault && (
                          <span className="px-2 py-0.5 text-xs bg-[var(--primary)] text-white rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)]">{style.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!style.isDefault && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSetDefaultStyle(style.id); }}
                        className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingStyle(style); }}
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {style.tone === 'custom' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteStyle(style.id); }}
                        className="p-1 hover:bg-[var(--muted)] rounded text-red-500"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplatesModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowTemplatesModal(false)} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Email Templates</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">Save and reuse email templates</p>
          </div>
          <button
            onClick={() => setShowTemplatesModal(false)}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setEditingTemplate({ id: '', name: '', description: '', subject: '', body: '', category: 'custom', placeholders: [], createdDate: '' })}
                className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Add New Template
              </button>
            </div>

            {editingTemplate && (
              <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)] mb-4">
                <h4 className="font-medium mb-3">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="Template name"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <input
                    type="text"
                    value={editingTemplate.description}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <input
                    type="text"
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    placeholder="Email subject"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <textarea
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    placeholder="Email body (use {{placeholder}} for dynamic content)"
                    rows={6}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTemplate(editingTemplate)}
                      className="px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[var(--foreground)]">{template.name}</span>
                      <span className="px-2 py-0.5 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] rounded-full">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">{template.description}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Subject: {template.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApplyTemplate(template)}
                      className="px-3 py-1.5 text-xs bg-[var(--primary)] text-white rounded-lg"
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-1 hover:bg-[var(--muted)] rounded"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1 hover:bg-[var(--muted)] rounded text-red-500"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Meeting Composer Modal
  const renderMeetingComposer = () => {
    const reminderOptions = [
      { value: 0, label: 'None' },
      { value: 5, label: '5 minutes' },
      { value: 15, label: '15 minutes' },
      { value: 30, label: '30 minutes' },
      { value: 60, label: '1 hour' },
      { value: 120, label: '2 hours' },
      { value: 1440, label: '1 day' },
      { value: 10080, label: '1 week' },
    ];

    const showAsOptions = [
      { value: 'busy', label: 'Busy' },
      { value: 'free', label: 'Free' },
      { value: 'tentative', label: 'Tentative' },
      { value: 'out-of-office', label: 'Out of Office' },
    ];

    const recurrenceOptions = [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' },
    ];

    const addRequiredAttendee = (email: string) => {
      if (email && !meetingRequiredAttendees.includes(email)) {
        setMeetingRequiredAttendees(prev => [...prev, email]);
      }
    };

    const removeRequiredAttendee = (email: string) => {
      setMeetingRequiredAttendees(prev => prev.filter(e => e !== email));
    };

    const addOptionalAttendee = (email: string) => {
      if (email && !meetingOptionalAttendees.includes(email)) {
        setMeetingOptionalAttendees(prev => [...prev, email]);
      }
    };

    const removeOptionalAttendee = (email: string) => {
      setMeetingOptionalAttendees(prev => prev.filter(e => e !== email));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowMeetingComposer(false)} />
        <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header with calendar colors */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMeeting}
                disabled={!meetingTitle || !meetingDate}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save
              </button>
              <span className="text-white/80 text-sm">Calendar (cs@flowrms.com)</span>
            </div>
            <button
              onClick={() => setShowMeetingComposer(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Top toolbar */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)]/50">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <path d="M22 10.5V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12.5"/>
                <path d="M22 22l-5-5"/>
                <path d="M22 13v9"/>
                <path d="M13 22h9"/>
              </svg>
              <select
                value={meetingShowAs}
                onChange={(e) => setMeetingShowAs(e.target.value as typeof meetingShowAs)}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer text-[var(--foreground)]"
              >
                {showAsOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <select
                value={meetingReminder}
                onChange={(e) => setMeetingReminder(Number(e.target.value))}
                className="text-sm bg-transparent border-none focus:outline-none cursor-pointer text-[var(--foreground)]"
              >
                {reminderOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} before</option>
                ))}
              </select>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Add a title"
                className="flex-1 text-xl font-semibold bg-transparent border-none focus:outline-none placeholder-[var(--muted-foreground)]"
              />
            </div>

            {/* Required Attendees */}
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] mt-2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                <path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <div className="flex-1">
                <div className="text-sm text-[var(--muted-foreground)] mb-1">Invite required attendees</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meetingRequiredAttendees.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                      {mockContacts.find(c => c.email === email)?.name || email}
                      <button onClick={() => removeRequiredAttendee(email)} className="hover:text-blue-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        addRequiredAttendee(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    {mockContacts.slice(0, 3).filter(c => !meetingRequiredAttendees.includes(c.email)).map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => addRequiredAttendee(contact.email)}
                        className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center hover:opacity-80"
                        title={contact.name}
                      >
                        {contact.name.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Attendees */}
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] mt-2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <div className="flex-1">
                <div className="text-sm text-[var(--muted-foreground)] mb-1">Invite optional attendees</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {meetingOptionalAttendees.map(email => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {mockContacts.find(c => c.email === email)?.name || email}
                      <button onClick={() => removeOptionalAttendee(email)} className="hover:text-gray-600">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement;
                      addOptionalAttendee(input.value);
                      input.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] mt-2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {!meetingIsAllDay && (
                    <>
                      <select
                        value={meetingStartTime}
                        onChange={(e) => setMeetingStartTime(e.target.value)}
                        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                          return <option key={time} value={time}>{displayTime}</option>;
                        })}
                      </select>
                      <span className="text-[var(--muted-foreground)]">to</span>
                      <select
                        value={meetingEndTime}
                        onChange={(e) => setMeetingEndTime(e.target.value)}
                        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 48 }, (_, i) => {
                          const hour = Math.floor(i / 2);
                          const minute = i % 2 === 0 ? '00' : '30';
                          const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                          const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                          return <option key={time} value={time}>{displayTime}</option>;
                        })}
                      </select>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meetingIsAllDay}
                      onChange={(e) => setMeetingIsAllDay(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)]"
                    />
                    <span className="text-sm">All day</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meetingIsRecurring}
                      onChange={(e) => setMeetingIsRecurring(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border)]"
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9"/>
                      <path d="M3 11V9a4 4 0 014-4h14"/>
                      <polyline points="7 23 3 19 7 15"/>
                      <path d="M21 13v2a4 4 0 01-4 4H3"/>
                    </svg>
                    <span className="text-sm">Make recurring</span>
                  </label>
                </div>
                {meetingIsRecurring && (
                  <select
                    value={meetingRecurrencePattern}
                    onChange={(e) => setMeetingRecurrencePattern(e.target.value)}
                    className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select pattern...</option>
                    {recurrenceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] mt-2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  placeholder="Add a room or location"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meetingIsInPerson}
                    onChange={(e) => setMeetingIsInPerson(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)]"
                  />
                  <span className="text-sm">In-person event</span>
                </label>
              </div>
            </div>

            {/* Teams Meeting Toggle */}
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setMeetingIsOnline(!meetingIsOnline)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${meetingIsOnline ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${meetingIsOnline ? 'left-7' : 'left-1'}`} />
                </button>
                <span className="text-sm">Teams meeting</span>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)] mt-2">
                <line x1="17" y1="10" x2="3" y2="10"/>
                <line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="21" y1="14" x2="3" y2="14"/>
                <line x1="17" y1="18" x2="3" y2="18"/>
              </svg>
              <div className="flex-1">
                {/* AI Generation Toolbar */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <button
                    onClick={() => setShowToneStylesModal(true)}
                    className="px-2.5 py-1 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
                    </svg>
                    Tone & Style
                  </button>
                  <button
                    onClick={() => setShowTemplatesModal(true)}
                    className="px-2.5 py-1 text-xs border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    Templates
                  </button>
                  <button
                    onClick={() => {
                      const attendeeNames = [...meetingRequiredAttendees, ...meetingOptionalAttendees].join(', ');
                      const generatedDescription = `Meeting: ${meetingTitle}\n\nAttendees: ${attendeeNames || 'TBD'}\n\nAgenda:\n1. \n2. \n3. \n\nObjectives:\n- \n\nAction Items:\n- `;
                      setMeetingDescription(generatedDescription);
                    }}
                    disabled={isGenerating}
                    className="px-2.5 py-1 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Auto Generate
                  </button>
                  <button
                    onClick={() => setShowPromptModal(true)}
                    disabled={isGenerating}
                    className="px-2.5 py-1 text-xs border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                    With Prompt
                  </button>
                </div>
                <textarea
                  value={meetingDescription}
                  onChange={(e) => setMeetingDescription(e.target.value)}
                  placeholder="Add a description or attach documents"
                  rows={6}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                {/* Toolbar for description */}
                <div className="flex items-center gap-2 mt-2 py-2 border-t border-[var(--border)]">
                  <button className="p-1.5 hover:bg-[var(--muted)] rounded" title="Attach file">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  <button className="p-1.5 hover:bg-[var(--muted)] rounded" title="Insert image">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>
                  <button className="p-1.5 hover:bg-[var(--muted)] rounded" title="Add emoji">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                      <line x1="9" y1="9" x2="9.01" y2="9"/>
                      <line x1="15" y1="9" x2="15.01" y2="9"/>
                    </svg>
                  </button>
                  <button className="p-1.5 hover:bg-[var(--muted)] rounded" title="Add link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between p-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
            <button
              onClick={() => setShowMeetingComposer(false)}
              className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMeeting}
              disabled={!meetingTitle || !meetingDate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingMeetingId ? 'Update Meeting' : 'Create Meeting'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCampaignModal = () => {
    const entityOptions = [
      { value: 'company', label: 'Company' },
      { value: 'contact', label: 'Contact' },
      { value: 'job', label: 'Job' },
      { value: 'quote', label: 'Quote' },
    ];

    const fieldOptionsByEntity: Record<string, Array<{ value: string; label: string }>> = {
      company: [
        { value: 'city', label: 'City' },
        { value: 'state', label: 'State' },
        { value: 'industry', label: 'Industry' },
        { value: 'hasBeenContacted', label: 'Has Been Contacted' },
        { value: 'lastContactDate', label: 'Last Contact Date' },
      ],
      contact: [
        { value: 'role', label: 'Role' },
        { value: 'job', label: 'Associated Job' },
        { value: 'importSource', label: 'Import Source' },
        { value: 'subscribed', label: 'Newsletter Subscribed' },
        { value: 'lastContactDate', label: 'Last Contact Date' },
      ],
      job: [
        { value: 'status', label: 'Status' },
        { value: 'value', label: 'Value' },
        { value: 'gc', label: 'General Contractor' },
        { value: 'createdDate', label: 'Created Date' },
      ],
      quote: [
        { value: 'status', label: 'Status' },
        { value: 'expirationDate', label: 'Expiration Date' },
        { value: 'value', label: 'Value' },
        { value: 'daysSinceSent', label: 'Days Since Sent' },
      ],
    };

    const operatorOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Does not equal' },
      { value: 'contains', label: 'Contains' },
      { value: 'greater_than', label: 'Greater than' },
      { value: 'less_than', label: 'Less than' },
      { value: 'is_past', label: 'Is past' },
      { value: 'within_miles', label: 'Within X miles of' },
      { value: 'associated_with', label: 'Associated with' },
    ];

    const handleCloseCampaignModal = () => {
      setShowCampaignModal(false);
      setSelectedWorkflowTemplate(null);
    };

    const handleCreateCampaign = () => {
      // Here you would create the campaign
      console.log('Creating campaign:', {
        name: campaignName,
        listType: campaignListType,
        entity: campaignEntity,
        field: campaignField,
        operator: campaignOperator,
        value: campaignValue,
        conditions: campaignConditions,
        subject: campaignSubject,
        body: campaignBody,
      });

      // Update the workflow template with the configured email template
      if (selectedWorkflowTemplate) {
        setSelectedWorkflowTemplate({
          ...selectedWorkflowTemplate,
          emailTemplate: {
            subject: campaignSubject,
            body: campaignBody,
          },
        });
      }

      // Close modal and navigate to campaign compose view
      setShowCampaignModal(false);
      setViewMode('campaign-compose');
    };

    const addCondition = () => {
      setCampaignConditions([...campaignConditions, { field: '', operator: '', value: '' }]);
    };

    const removeCondition = (index: number) => {
      setCampaignConditions(campaignConditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index: number, key: 'field' | 'operator' | 'value', value: string) => {
      const updated = [...campaignConditions];
      updated[index] = { ...updated[index], [key]: value };
      setCampaignConditions(updated);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={handleCloseCampaignModal} />
        <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">Campaign Configuration</h2>
              {selectedWorkflowTemplate && selectedWorkflowTemplate.id !== 'custom' && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  Template: {selectedWorkflowTemplate.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseCampaignModal}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Q1 Product Launch"
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Recipient List Type */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[var(--foreground)]">Recipient List Type</label>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                  </svg>
                  Generate with AI
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCampaignListType('static')}
                  className={`p-4 border-2 rounded-xl text-center transition-all ${
                    campaignListType === 'static'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className={`font-medium ${campaignListType === 'static' ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                    Static List
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">Manually select recipients</div>
                </button>
                <button
                  onClick={() => setCampaignListType('criteria')}
                  className={`p-4 border-2 rounded-xl text-center transition-all ${
                    campaignListType === 'criteria'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className={`font-medium ${campaignListType === 'criteria' ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                    Criteria-Based
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">Filter by conditions</div>
                </button>
                <button
                  onClick={() => setCampaignListType('dynamic')}
                  className={`p-4 border-2 rounded-xl text-center transition-all ${
                    campaignListType === 'dynamic'
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <div className={`font-medium ${campaignListType === 'dynamic' ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                    Dynamic Rules
                  </div>
                  <div className="text-sm text-[var(--muted-foreground)] mt-1">Auto-updating list</div>
                </button>
              </div>
            </div>

            {/* Static List Builder */}
            {campaignListType === 'static' && (
              <div className="border border-[var(--border)] rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-medium text-[var(--foreground)]">Select Recipients</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Manually select contacts to include in this campaign.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      type="text"
                      value={staticListSearch}
                      onChange={(e) => setStaticListSearch(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <select
                    value={staticListCompanyFilter}
                    onChange={(e) => setStaticListCompanyFilter(e.target.value)}
                    className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[160px]"
                  >
                    <option value="">All Companies</option>
                    <option value="BuilderCo Construction">BuilderCo Construction</option>
                    <option value="Delta Mechanical">Delta Mechanical</option>
                    <option value="Skyline Architects">Skyline Architects</option>
                    <option value="Precision Electric">Precision Electric</option>
                    <option value="GreenBuild Solutions">GreenBuild Solutions</option>
                  </select>
                  <select
                    value={staticListRoleFilter}
                    onChange={(e) => setStaticListRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[140px]"
                  >
                    <option value="">All Roles</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Lead Engineer">Lead Engineer</option>
                    <option value="Senior Architect">Senior Architect</option>
                    <option value="Sales Director">Sales Director</option>
                    <option value="Sustainability Manager">Sustainability Manager</option>
                  </select>
                </div>

                {/* Select All / Clear */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const allIds = mockContacts
                          .filter(c => {
                            const matchesSearch = !staticListSearch ||
                              c.name.toLowerCase().includes(staticListSearch.toLowerCase()) ||
                              c.email.toLowerCase().includes(staticListSearch.toLowerCase());
                            const matchesCompany = !staticListCompanyFilter || c.company === staticListCompanyFilter;
                            const matchesRole = !staticListRoleFilter || c.role === staticListRoleFilter;
                            return matchesSearch && matchesCompany && matchesRole;
                          })
                          .map(c => c.id);
                        setSelectedStaticContacts(new Set(allIds));
                      }}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-[var(--muted-foreground)]">|</span>
                    <button
                      onClick={() => setSelectedStaticContacts(new Set())}
                      className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {selectedStaticContacts.size} selected
                  </span>
                </div>

                {/* Contact List */}
                <div className="max-h-[250px] overflow-y-auto space-y-1">
                  {mockContacts
                    .filter(contact => {
                      const matchesSearch = !staticListSearch ||
                        contact.name.toLowerCase().includes(staticListSearch.toLowerCase()) ||
                        contact.email.toLowerCase().includes(staticListSearch.toLowerCase());
                      const matchesCompany = !staticListCompanyFilter || contact.company === staticListCompanyFilter;
                      const matchesRole = !staticListRoleFilter || contact.role === staticListRoleFilter;
                      return matchesSearch && matchesCompany && matchesRole;
                    })
                    .map(contact => (
                      <label
                        key={contact.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedStaticContacts.has(contact.id)
                            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                            : 'hover:bg-[var(--muted)] border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStaticContacts.has(contact.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedStaticContacts);
                            if (e.target.checked) {
                              newSelected.add(contact.id);
                            } else {
                              newSelected.delete(contact.id);
                            }
                            setSelectedStaticContacts(newSelected);
                          }}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--foreground)] truncate">{contact.name}</div>
                          <div className="text-sm text-[var(--muted-foreground)] truncate">{contact.email}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm text-[var(--foreground)]">{contact.company}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">{contact.role}</div>
                        </div>
                      </label>
                    ))}
                  {mockContacts.filter(contact => {
                    const matchesSearch = !staticListSearch ||
                      contact.name.toLowerCase().includes(staticListSearch.toLowerCase()) ||
                      contact.email.toLowerCase().includes(staticListSearch.toLowerCase());
                    const matchesCompany = !staticListCompanyFilter || contact.company === staticListCompanyFilter;
                    const matchesRole = !staticListRoleFilter || contact.role === staticListRoleFilter;
                    return matchesSearch && matchesCompany && matchesRole;
                  }).length === 0 && (
                    <div className="text-center py-8 text-[var(--muted-foreground)]">
                      No contacts match your filters
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Criteria Builder (show for criteria and dynamic types) */}
            {(campaignListType === 'criteria' || campaignListType === 'dynamic') && (
              <div className="border border-[var(--border)] rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="font-medium text-[var(--foreground)]">Define Criteria</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    {campaignListType === 'criteria'
                      ? 'The list will be generated once when the campaign is created, based on the criteria below.'
                      : 'The list will automatically update as records match the criteria below.'}
                  </p>
                </div>

                {/* Main condition row */}
                <div className="border border-[var(--border)] rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <select
                      value={campaignEntity}
                      onChange={(e) => {
                        setCampaignEntity(e.target.value);
                        setCampaignField('');
                      }}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[140px]"
                    >
                      <option value="">Select entity...</option>
                      {entityOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <select
                      value={campaignField}
                      onChange={(e) => setCampaignField(e.target.value)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[140px]"
                      disabled={!campaignEntity}
                    >
                      <option value="">Select field...</option>
                      {campaignEntity && fieldOptionsByEntity[campaignEntity]?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <select
                      value={campaignOperator}
                      onChange={(e) => setCampaignOperator(e.target.value)}
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[120px]"
                      disabled={!campaignField}
                    >
                      <option value="">Operator...</option>
                      {operatorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={campaignValue}
                      onChange={(e) => setCampaignValue(e.target.value)}
                      placeholder="Value..."
                      className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] flex-1 min-w-[120px]"
                      disabled={!campaignOperator}
                    />
                  </div>

                  {/* Additional AND conditions */}
                  {campaignConditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="text-sm text-[var(--muted-foreground)] font-medium">AND</span>
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[140px]"
                      >
                        <option value="">Select field...</option>
                        {campaignEntity && fieldOptionsByEntity[campaignEntity]?.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-w-[120px]"
                      >
                        <option value="">Operator...</option>
                        {operatorOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Value..."
                        className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] flex-1 min-w-[120px]"
                      />
                      <button
                        onClick={() => removeCondition(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addCondition}
                    className="mt-3 text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span className="text-lg">+</span> Add AND condition
                  </button>
                </div>

                {/* Add OR group button */}
                <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  <span className="text-lg">+</span> Add OR condition group
                </button>
              </div>
            )}

            {/* Email Subject */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Email Subject</label>
              <input
                type="text"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-4 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Email Body */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Email Body</label>
              <textarea
                value={campaignBody}
                onChange={(e) => setCampaignBody(e.target.value)}
                placeholder="Enter base email content... AI will personalize for each recipient."
                rows={8}
                className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Available variables: {'{firstName}'}, {'{lastName}'}, {'{companyName}'}, {'{city}'}, {'{jobName}'}, {'{quoteNumber}'}, {'{senderName}'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[var(--border)] flex items-center justify-between flex-shrink-0 bg-[var(--card)]">
            <button
              onClick={handleCloseCampaignModal}
              className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Save as Draft
              </button>
              <button
                onClick={handleCreateCampaign}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPromptModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowPromptModal(false)} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Generate Email with Prompt</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Tell the AI what you want in the email, and it will generate content based on your prompt and the contact's context.
        </p>
        <textarea
          value={generationPrompt}
          onChange={(e) => setGenerationPrompt(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none mb-4"
          placeholder="e.g., Ask about the status of their quote and if they need any changes"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowPromptModal(false)}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAutoGenerateWithPrompt}
            disabled={!generationPrompt.trim()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );

  const renderJobModal = () => {
    if (!selectedJob) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowJobModal(false)} />
        <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{selectedJob.name}</h2>
            <button
              onClick={() => setShowJobModal(false)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">Status</label>
                <p className="font-medium text-[var(--foreground)]">{selectedJob.status}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">Value</label>
                <p className="font-medium text-[var(--foreground)]">{selectedJob.value}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">General Contractor</label>
                <p className="font-medium text-[var(--foreground)]">{selectedJob.gc}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">Electrical Contractor</label>
                <p className="font-medium text-[var(--foreground)]">{selectedJob.ec}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => setShowJobModal(false)}
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuoteModal = () => {
    if (!selectedQuote) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuoteModal(false)} />
        <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{selectedQuote.name}</h2>
            <button
              onClick={() => setShowQuoteModal(false)}
              className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">Stage</label>
                <p className="font-medium text-[var(--foreground)]">{selectedQuote.stage}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">Value</label>
                <p className="font-medium text-[var(--foreground)]">{selectedQuote.value}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--muted-foreground)]">Expiration Date</label>
                <p className="font-medium text-[var(--foreground)]">{new Date(selectedQuote.expirationDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => setShowQuoteModal(false)}
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFollowUpModal = () => {
    const email = followUpEmailId ? emails.find(e => e.id === followUpEmailId) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calendar helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const daysInMonth = getDaysInMonth(calendarMonth.year, calendarMonth.month);
    const firstDay = getFirstDayOfMonth(calendarMonth.year, calendarMonth.month);
    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }

    const formatPresetLabel = (days: number) => {
      if (days === 1) return '1 day';
      if (days === 7) return '1 week';
      if (days === 14) return '2 weeks';
      if (days === 21) return '3 weeks';
      if (days === 30) return '1 month';
      return `${days} days`;
    };

    const isDateSelected = (day: number) => {
      if (!followUpDate) return false;
      const selectedDate = new Date(followUpDate);
      return selectedDate.getFullYear() === calendarMonth.year &&
             selectedDate.getMonth() === calendarMonth.month &&
             selectedDate.getDate() === day;
    };

    const isDateInPast = (day: number) => {
      const date = new Date(calendarMonth.year, calendarMonth.month, day);
      return date < today;
    };

    const handleDayClick = (day: number) => {
      if (isDateInPast(day)) return;
      const date = new Date(calendarMonth.year, calendarMonth.month, day);
      const dateStr = date.toISOString().split('T')[0];
      handleSelectFollowUpDate(dateStr);
    };

    // Settings panel
    if (showFollowUpSettings) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFollowUpModal(false)}>
          <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFollowUpSettings(false)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">Follow-up Settings</h3>
              </div>
              <button
                onClick={() => setShowFollowUpModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Dismiss on Reply Default */}
              <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--foreground)]">Dismiss on reply</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Auto-remove follow-up when replied</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followUpSettings.dismissOnReplyDefault}
                    onChange={(e) => setFollowUpSettings(prev => ({ ...prev, dismissOnReplyDefault: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* One-Click Saving */}
              <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--foreground)]">One-click saving</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Save immediately when clicking a date</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followUpSettings.oneClickSave}
                    onChange={(e) => setFollowUpSettings(prev => ({ ...prev, oneClickSave: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              {/* Preset Days */}
              <div className="p-3 border border-[var(--border)] rounded-lg">
                <p className="font-medium text-[var(--foreground)] mb-3">Quick follow-up presets</p>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">Customize the days shown as quick options</p>
                <div className="space-y-2">
                  {followUpSettings.presetDays.map((days, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={days}
                        onChange={(e) => {
                          const newDays = [...followUpSettings.presetDays];
                          newDays[index] = parseInt(e.target.value) || 1;
                          setFollowUpSettings(prev => ({ ...prev, presetDays: newDays }));
                        }}
                        className="w-20 px-2 py-1 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
                      />
                      <span className="text-sm text-[var(--muted-foreground)]">days</span>
                      {followUpSettings.presetDays.length > 1 && (
                        <button
                          onClick={() => {
                            const newDays = followUpSettings.presetDays.filter((_, i) => i !== index);
                            setFollowUpSettings(prev => ({ ...prev, presetDays: newDays }));
                          }}
                          className="p-1 text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {followUpSettings.presetDays.length < 6 && (
                    <button
                      onClick={() => {
                        setFollowUpSettings(prev => ({ ...prev, presetDays: [...prev.presetDays, 7] }));
                      }}
                      className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Add preset
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border)]">
              <button
                onClick={() => setShowFollowUpSettings(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Main follow-up modal
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFollowUpModal(false)}>
        <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Set Follow-up</h3>
            <button
              onClick={() => setShowFollowUpModal(false)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Email info */}
            {email && (
              <div className="p-3 bg-[var(--muted)] rounded-lg">
                <p className="text-sm text-[var(--muted-foreground)]">Email from</p>
                <p className="font-medium text-[var(--foreground)]">{email.from.name}</p>
                <p className="text-sm text-[var(--muted-foreground)] truncate">{email.subject}</p>
              </div>
            )}

            {/* Quick presets */}
            <div>
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Quick follow-up</p>
              <div className="flex flex-wrap gap-2">
                {followUpSettings.presetDays.map((days) => (
                  <button
                    key={days}
                    onClick={() => handleQuickFollowUp(days)}
                    className="px-3 py-1.5 text-sm bg-[var(--muted)] hover:bg-[var(--border)] text-[var(--foreground)] rounded-lg transition-colors"
                  >
                    {formatPresetLabel(days)}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline Calendar */}
            <div className="border border-[var(--border)] rounded-lg p-3">
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth(prev => {
                    if (prev.month === 0) return { year: prev.year - 1, month: 11 };
                    return { ...prev, month: prev.month - 1 };
                  })}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <span className="font-medium text-[var(--foreground)]">
                  {monthNames[calendarMonth.month]} {calendarMonth.year}
                </span>
                <button
                  onClick={() => setCalendarMonth(prev => {
                    if (prev.month === 11) return { year: prev.year + 1, month: 0 };
                    return { ...prev, month: prev.month + 1 };
                  })}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs text-[var(--muted-foreground)] py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day !== null ? (
                      <button
                        onClick={() => handleDayClick(day)}
                        disabled={isDateInPast(day)}
                        className={`w-full h-full rounded-lg text-sm transition-colors ${
                          isDateSelected(day)
                            ? 'bg-[var(--primary)] text-white font-medium'
                            : isDateInPast(day)
                              ? 'text-[var(--muted-foreground)]/40 cursor-not-allowed'
                              : 'hover:bg-[var(--muted)] text-[var(--foreground)]'
                        }`}
                      >
                        {day}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Dismiss on reply checkbox */}
            <div className="flex items-center gap-3 p-3 bg-[var(--muted)] rounded-lg">
              <input
                type="checkbox"
                id="dismissOnReply"
                checked={followUpDismissOnReply}
                onChange={(e) => setFollowUpDismissOnReply(e.target.checked)}
                className="w-5 h-5 accent-[var(--primary)]"
              />
              <label htmlFor="dismissOnReply" className="cursor-pointer flex-1">
                <p className="font-medium text-[var(--foreground)]">Dismiss on reply</p>
              </label>
            </div>

            {/* Notes field - expandable */}
            <div
              className={`border border-[var(--border)] rounded-lg transition-all ${followUpNotesExpanded ? 'bg-[var(--background)]' : 'bg-[var(--muted)] cursor-pointer hover:bg-[var(--border)]'}`}
              onClick={() => !followUpNotesExpanded && setFollowUpNotesExpanded(true)}
            >
              {followUpNotesExpanded ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[var(--foreground)]">Note</p>
                    {!followUpNotes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFollowUpNotesExpanded(false);
                        }}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Add a note for this follow-up..."
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                  <span className="text-sm text-[var(--muted-foreground)]">Add a note...</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
            {/* Settings button */}
            <button
              onClick={() => setShowFollowUpSettings(true)}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="Follow-up settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>

            <div className="flex items-center gap-2">
              {email?.followUp && (
                <button
                  onClick={(e) => {
                    handleRemoveFollowUp(followUpEmailId!, e as unknown as React.MouseEvent);
                    setShowFollowUpModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
              <button
                onClick={handleSetFollowUp}
                disabled={!followUpDate}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
              >
                {email?.followUp ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Filter spec sheets based on search
  const filteredSpecSheets = useMemo(() => {
    if (!specSheetSearch.trim()) return mockSpecSheets;
    const query = specSheetSearch.toLowerCase();
    return mockSpecSheets.filter(sheet =>
      sheet.displayName.toLowerCase().includes(query) ||
      sheet.manufacturer.toLowerCase().includes(query) ||
      sheet.tags.some(tag => tag.toLowerCase().includes(query)) ||
      sheet.categories.some(cat => cat.toLowerCase().includes(query))
    );
  }, [specSheetSearch]);

  // Handle attaching spec sheets
  const handleAttachSpecSheets = () => {
    const newAttachments: Attachment[] = selectedSpecSheets.map(sheet => ({
      id: `spec-${sheet.id}-${Date.now()}`,
      name: sheet.displayName,
      size: formatFileSize(sheet.fileSize),
      type: 'application/pdf',
    }));
    setComposeAttachments(prev => [...prev, ...newAttachments]);
    setSelectedSpecSheets([]);
    setSpecSheetSearch('');
    setShowSpecSheetsModal(false);
  };

  // Toggle spec sheet selection
  const toggleSpecSheetSelection = (sheet: SpecSheet) => {
    setSelectedSpecSheets(prev => {
      const isSelected = prev.some(s => s.id === sheet.id);
      if (isSelected) {
        return prev.filter(s => s.id !== sheet.id);
      } else {
        return [...prev, sheet];
      }
    });
  };

  const renderSpecSheetsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => {
        setShowSpecSheetsModal(false);
        setSpecSheetSearch('');
        setSelectedSpecSheets([]);
      }} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Attach Spec Sheets</h2>
          <button
            onClick={() => {
              setShowSpecSheetsModal(false);
              setSpecSheetSearch('');
              setSelectedSpecSheets([]);
            }}
            className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={specSheetSearch}
              onChange={(e) => setSpecSheetSearch(e.target.value)}
              placeholder="Search spec sheets by name, manufacturer, or tags..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          {selectedSpecSheets.length > 0 && (
            <div className="mt-2 text-sm text-[var(--primary)]">
              {selectedSpecSheets.length} spec sheet{selectedSpecSheets.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Spec Sheets List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSpecSheets.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted-foreground)]">
              No spec sheets found matching your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSpecSheets.map(sheet => {
                const isSelected = selectedSpecSheets.some(s => s.id === sheet.id);
                return (
                  <div
                    key={sheet.id}
                    onClick={() => toggleSpecSheetSelection(sheet)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border)]'
                      }`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                          </svg>
                          <span className="font-medium text-[var(--foreground)] truncate">{sheet.displayName}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span>{sheet.manufacturer}</span>
                          <span>•</span>
                          <span>{formatFileSize(sheet.fileSize)}</span>
                          <span>•</span>
                          <span>{sheet.pageCount} page{sheet.pageCount !== 1 ? 's' : ''}</span>
                        </div>
                        {sheet.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {sheet.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 text-xs bg-[var(--muted)] text-[var(--muted-foreground)] rounded">
                                {tag}
                              </span>
                            ))}
                            {sheet.tags.length > 4 && (
                              <span className="px-1.5 py-0.5 text-xs text-[var(--muted-foreground)]">
                                +{sheet.tags.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            onClick={() => {
              setShowSpecSheetsModal(false);
              setSpecSheetSearch('');
              setSelectedSpecSheets([]);
            }}
            className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAttachSpecSheets}
            disabled={selectedSpecSheets.length === 0}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Attach {selectedSpecSheets.length > 0 ? `(${selectedSpecSheets.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );

  const renderOpenCatalogModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowOpenCatalogModal(false)} />
      <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
            </svg>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">Opening Open Catalog</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          Please wait while we open the Open Catalog for you to browse and select products...
        </p>
        <div className="flex items-center justify-center gap-2 text-[var(--muted-foreground)]">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
        <button
          onClick={() => setShowOpenCatalogModal(false)}
          className="mt-6 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderIngestionRulesModal = () => {
    const conditionTypeLabels: Record<IngestionRuleCondition['type'], string> = {
      sender: 'Sender email',
      senderDomain: 'Sender domain',
      recipient: 'Recipient',
      subjectContains: 'Subject contains',
      bodyContains: 'Body contains',
      hasAttachment: 'Has attachment',
    };

    const actionLabels: Record<IngestionRule['action'], string> = {
      process: 'Process by AI',
      skip: 'Skip processing',
      file: 'Auto-file to category',
    };

    // Editing/Creating a rule
    if (editingRule || isCreatingRule) {
      const rule = editingRule || {
        id: `rule-${Date.now()}`,
        name: '',
        enabled: true,
        conditions: [{ type: 'sender' as const, value: '' }],
        action: 'process' as const,
      };

      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setEditingRule(null); setIsCreatingRule(false); }}>
          <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingRule(null); setIsCreatingRule(false); }}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {isCreatingRule ? 'Create Rule' : 'Edit Rule'}
                </h3>
              </div>
              <button
                onClick={() => { setEditingRule(null); setIsCreatingRule(false); setShowIngestionRulesModal(false); }}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Rule Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Rule Name</label>
                <input
                  type="text"
                  value={rule.name}
                  onChange={(e) => {
                    if (isCreatingRule) {
                      setEditingRule({ ...rule, name: e.target.value });
                      setIsCreatingRule(false);
                    } else {
                      setEditingRule({ ...rule, name: e.target.value });
                    }
                  }}
                  placeholder="e.g., Process vendor emails"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>

              {/* Conditions */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Conditions</label>
                <div className="space-y-2">
                  {rule.conditions.map((condition, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-[var(--muted)] rounded-lg">
                      <select
                        value={condition.type}
                        onChange={(e) => {
                          const newConditions = [...rule.conditions];
                          const newType = e.target.value as IngestionRuleCondition['type'];
                          if (newType === 'hasAttachment') {
                            newConditions[idx] = { type: newType, value: true };
                          } else {
                            newConditions[idx] = { type: newType, value: '' };
                          }
                          setEditingRule({ ...rule, conditions: newConditions });
                        }}
                        className="px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                      >
                        <option value="sender">Sender email</option>
                        <option value="senderDomain">Sender domain</option>
                        <option value="recipient">Recipient</option>
                        <option value="subjectContains">Subject contains</option>
                        <option value="bodyContains">Body contains</option>
                        <option value="hasAttachment">Has attachment</option>
                      </select>
                      {condition.type === 'hasAttachment' ? (
                        <select
                          value={condition.value ? 'yes' : 'no'}
                          onChange={(e) => {
                            const newConditions = [...rule.conditions];
                            newConditions[idx] = { type: 'hasAttachment', value: e.target.value === 'yes' };
                            setEditingRule({ ...rule, conditions: newConditions });
                          }}
                          className="flex-1 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={condition.value as string}
                          onChange={(e) => {
                            const newConditions = [...rule.conditions];
                            newConditions[idx] = { ...condition, value: e.target.value } as IngestionRuleCondition;
                            setEditingRule({ ...rule, conditions: newConditions });
                          }}
                          placeholder={condition.type === 'senderDomain' ? 'example.com' : 'Enter value...'}
                          className="flex-1 px-2 py-1.5 border border-[var(--border)] rounded bg-[var(--background)] text-sm"
                        />
                      )}
                      {rule.conditions.length > 1 && (
                        <button
                          onClick={() => {
                            const newConditions = rule.conditions.filter((_, i) => i !== idx);
                            setEditingRule({ ...rule, conditions: newConditions });
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setEditingRule({
                      ...rule,
                      conditions: [...rule.conditions, { type: 'sender', value: '' }],
                    });
                  }}
                  className="mt-2 text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Add condition
                </button>
              </div>

              {/* Action */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Action</label>
                <div className="space-y-2">
                  {(['process', 'skip', 'file'] as const).map((action) => (
                    <label
                      key={action}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        rule.action === action
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        checked={rule.action === action}
                        onChange={() => setEditingRule({ ...rule, action })}
                        className="accent-[var(--primary)]"
                      />
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{actionLabels[action]}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {action === 'process' && 'Automatically process matching emails with AI'}
                          {action === 'skip' && 'Skip AI processing for matching emails'}
                          {action === 'file' && 'Automatically file to a specific category'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Category Selection (only if action is 'file') */}
              {rule.action === 'file' && (
                <div className="space-y-3 p-3 bg-[var(--muted)] rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Category</label>
                    <select
                      value={rule.fileCategory || ''}
                      onChange={(e) => setEditingRule({ ...rule, fileCategory: e.target.value, fileSubcategory: '' })}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                    >
                      <option value="">Select category...</option>
                      {fileCategories.map(cat => (
                        <option key={cat.category} value={cat.category}>{cat.category}</option>
                      ))}
                    </select>
                  </div>
                  {rule.fileCategory && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Subcategory</label>
                      <select
                        value={rule.fileSubcategory || ''}
                        onChange={(e) => setEditingRule({ ...rule, fileSubcategory: e.target.value })}
                        className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)]"
                      >
                        <option value="">Select subcategory...</option>
                        {fileCategories.find(c => c.category === rule.fileCategory)?.subcategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                onClick={() => { setEditingRule(null); setIsCreatingRule(false); }}
                className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingRule) {
                    if (isCreatingRule || !ingestionRules.find(r => r.id === editingRule.id)) {
                      setIngestionRules(prev => [...prev, editingRule]);
                    } else {
                      setIngestionRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
                    }
                    setEditingRule(null);
                    setIsCreatingRule(false);
                  }
                }}
                disabled={!rule.name || rule.conditions.some(c => c.type !== 'hasAttachment' && !c.value)}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingRule ? 'Create Rule' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Main rules list
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowIngestionRulesModal(false)}>
        <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Ingestion Rules</h3>
            <button
              onClick={() => setShowIngestionRulesModal(false)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Create rules to automatically process, skip, or file emails based on sender, content, or attachments.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4">
            {ingestionRules.length === 0 ? (
              <div className="text-center py-8 text-[var(--muted-foreground)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 opacity-50">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                </svg>
                <p>No ingestion rules yet</p>
                <p className="text-sm">Create a rule to automate email processing</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ingestionRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${rule.enabled ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                            {rule.name}
                          </span>
                          {!rule.enabled && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">Disabled</span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                          <p>
                            <span className="font-medium">If:</span>{' '}
                            {rule.conditions.map((c, i) => (
                              <span key={i}>
                                {i > 0 && ' AND '}
                                {conditionTypeLabels[c.type]} {c.type === 'hasAttachment' ? (c.value ? '= Yes' : '= No') : `= "${c.value}"`}
                              </span>
                            ))}
                          </p>
                          <p>
                            <span className="font-medium">Then:</span> {actionLabels[rule.action]}
                            {rule.action === 'file' && rule.fileCategory && ` → ${rule.fileCategory}${rule.fileSubcategory ? ' > ' + rule.fileSubcategory : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) => {
                              setIngestionRules(prev => prev.map(r =>
                                r.id === rule.id ? { ...r, enabled: e.target.checked } : r
                              ));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                        </label>
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded"
                          title="Edit rule"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setIngestionRules(prev => prev.filter(r => r.id !== rule.id));
                          }}
                          className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 rounded"
                          title="Delete rule"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[var(--border)]">
            <button
              onClick={() => {
                setIsCreatingRule(true);
                setEditingRule(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create New Rule
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFileModal = () => {
    const email = fileEmailId ? emails.find(e => e.id === fileEmailId) : null;
    const selectedCategoryData = fileCategories.find(c => c.category === fileCategory);

    // Settings panel
    if (showFileSettings) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFileModal(false)}>
          <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFileSettings(false)}
                  className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-[var(--foreground)]">File Settings</h3>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Auto-file on Click */}
              <div className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--foreground)]">Auto-file on click</p>
                  <p className="text-sm text-[var(--muted-foreground)]">Instantly file with suggested values</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fileSettings.autoFileOnClick}
                    onChange={(e) => setFileSettings(prev => ({ ...prev, autoFileOnClick: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary)]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>

              <p className="text-xs text-[var(--muted-foreground)]">
                When enabled, clicking the File button will immediately file the email using the AI-suggested category and subcategory without showing this dialog.
              </p>

              {/* Ingestion Rules */}
              <div className="border-t border-[var(--border)] pt-4">
                <button
                  onClick={() => {
                    setShowFileSettings(false);
                    setShowFileModal(false);
                    setShowIngestionRulesModal(true);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg hover:bg-[var(--muted)]/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
                    </svg>
                    <div className="text-left">
                      <p className="font-medium text-[var(--foreground)]">Ingestion Rules</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{ingestionRules.filter(r => r.enabled).length} active rules</p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main file modal
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFileModal(false)}>
        <div className="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">File Email</h3>
            <button
              onClick={() => setShowFileModal(false)}
              className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Email info */}
            {email && (
              <div className="p-3 bg-[var(--muted)] rounded-lg">
                <p className="text-sm font-medium text-[var(--foreground)] line-clamp-1">{email.subject}</p>
                <p className="text-xs text-[var(--muted-foreground)]">From: {email.from.name}</p>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {fileCategories.map(cat => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      setFileCategory(cat.category);
                      setFileSubcategories([cat.subcategories[0]]);
                    }}
                    className={`p-2 text-sm rounded-lg border transition-colors text-left ${
                      fileCategory === cat.category
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory Selection */}
            {selectedCategoryData && (
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Subcategory</label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryData.subcategories.map(sub => (
                    <button
                      key={sub}
                      onClick={() => {
                        if (fileSubcategories.includes(sub)) {
                          setFileSubcategories(fileSubcategories.filter(s => s !== sub));
                        } else {
                          setFileSubcategories([...fileSubcategories, sub]);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        fileSubcategories.includes(sub)
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {fileTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => setFileTags(fileTags.filter(t => t !== tag))}
                      className="hover:text-blue-900"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                ))}
                {fileTags.length === 0 && (
                  <span className="text-xs text-[var(--muted-foreground)]">No tags</span>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-[var(--muted)] rounded-lg">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Will be filed as:</p>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {fileCategory}{fileSubcategories.length > 0 ? ` > ${fileSubcategories.join(', ')}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-[var(--border)]">
            {/* Settings button */}
            <button
              onClick={() => setShowFileSettings(true)}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-colors"
              title="File settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>

            <div className="flex items-center gap-2">
              {email?.filed && (
                <button
                  onClick={(e) => {
                    handleRemoveFile(fileEmailId!, e as unknown as React.MouseEvent);
                    setShowFileModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
              <button
                onClick={handleFileEmail}
                disabled={!fileCategory}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition-colors disabled:opacity-50"
              >
                {email?.filed ? 'Update' : 'File'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <main className="flex-1 overflow-hidden bg-[var(--background)] flex">
      {(viewMode === 'list' || viewMode === 'spreadsheet') && renderEmailList()}
      {viewMode === 'email' && renderEmailView()}
      {viewMode === 'meeting' && renderMeetingView()}
      {viewMode === 'compose' && renderComposeView()}
      {viewMode === 'workflow-select' && (
        <WorkflowSelector
          onSelectWorkflow={handleSelectWorkflow}
          onBack={handleBackFromWorkflowSelector}
        />
      )}
      {viewMode === 'campaign-compose' && selectedWorkflowTemplate && (
        <CampaignCompose
          onBack={handleBackFromCampaign}
          initialWorkflowType={selectedWorkflowTemplate.id as any}
          workflowTemplate={selectedWorkflowTemplate}
        />
      )}

      {/* Modals */}
      {showCampaignModal && renderCampaignModal()}
      {showToneStylesModal && renderToneStylesModal()}
      {showTemplatesModal && renderTemplatesModal()}
      {showPromptModal && renderPromptModal()}
      {showJobModal && renderJobModal()}
      {showQuoteModal && renderQuoteModal()}
      {showFollowUpModal && renderFollowUpModal()}
      {showFileModal && renderFileModal()}
      {showIngestionRulesModal && renderIngestionRulesModal()}
      {showAllFlowsModal && renderAllFlowsModal()}
      {showMeetingComposer && renderMeetingComposer()}
      {showSpecSheetsModal && renderSpecSheetsModal()}
      {showOpenCatalogModal && renderOpenCatalogModal()}
    </main>
  );
}

'use client';

import React, { useState, useMemo } from 'react';

// ============================================
// TYPES
// ============================================

type WorkflowType =
  | 'city-visit'
  | 'event-attendees'
  | 'job-contacts'
  | 'overdue-quotes'
  | 'quote-followup'
  | 'hubspot-import'
  | 'custom';

type TouchpointType = 'EMAIL' | 'INCOMING_EMAIL' | 'CALL' | 'MEETING' | 'NOTE';

type Touchpoint = {
  id: string;
  type: TouchpointType;
  date: string;
  subject: string;
  preview: string;
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
  role?: string;
  phone?: string;
  company?: string;
};

type ContactContext = {
  contact: Contact;
  recentActivity: Activity[];
  notes: Note[];
  tasks: Task[];
  jobs: Job[];
  quotes: Quote[];
};

type Deal = {
  id: string;
  name: string;
  amount: number;
  stage: string;
  pipeline: string;
  lastTouchpoint: string;
  daysAgo: number;
  contacts: Contact[];
  touchpoints: Touchpoint[];
  selected: boolean;
  draftCreated: boolean;
  contactContext?: ContactContext;
};

type Campaign = {
  id: string;
  name: string;
  workflowType: WorkflowType;
  date: string;
  deals: Deal[];
  totalSelected: number;
  totalDraftsCreated: number;
};

// ============================================
// MOCK DATA BY WORKFLOW TYPE
// ============================================

const getMockDataForWorkflow = (workflowType: WorkflowType): Campaign => {
  switch (workflowType) {
    case 'city-visit':
      return {
        id: 'camp-city',
        name: 'Chicago Trip - 6 companies - 12/15/2025',
        workflowType: 'city-visit',
        date: '2025-12-15',
        deals: [
          {
            id: 'd1',
            name: 'Acme Corporation',
            amount: 52000,
            stage: 'Proposal',
            pipeline: 'Sales Pipeline',
            lastTouchpoint: '11/20/2025',
            daysAgo: 17,
            contacts: [
              { id: 'c1', name: 'John Smith', email: 'john.smith@acme-example.com', role: 'VP Sales', phone: '(555) 123-4567', company: 'Acme Corporation' },
              { id: 'c2', name: 'Jane Doe', email: 'jane.doe@acme-example.com', role: 'Procurement', phone: '(555) 234-5678', company: 'Acme Corporation' },
            ],
            touchpoints: [
              { id: 't1', type: 'EMAIL', date: '2025-11-20T10:30:00Z', subject: 'Following up on our proposal', preview: 'Hi John, wanted to check in on the proposal we sent last week. Let me know if you have any questions.' },
              { id: 't2', type: 'CALL', date: '2025-11-15T14:00:00Z', subject: 'Discovery Call', preview: 'Discussed their needs for Q1. They are looking at a 3-month implementation timeline.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'John Smith', email: 'john.smith@acme-example.com', role: 'VP Sales', phone: '(555) 123-4567', company: 'Acme Corporation' },
              recentActivity: [
                { id: 'a1', type: 'call', description: 'Discussed project timeline for Chicago renovation', date: '2025-11-20' },
                { id: 'a2', type: 'email', description: 'Sent updated proposal', date: '2025-11-18' },
                { id: 'a3', type: 'meeting', description: 'Site visit at Acme offices', date: '2025-11-15' },
              ],
              notes: [
                { id: 'n1', title: 'Budget Concerns', content: 'John mentioned budget constraints for Q2. Need to propose cost-effective alternatives.', date: '2025-11-20' },
                { id: 'n2', title: 'Preferred Timeline', content: 'Acme prefers starting in March to align with their fiscal year.', date: '2025-11-10' },
              ],
              tasks: [
                { id: 't1', title: 'Send revised quote', dueDate: '2025-12-10', status: 'pending' },
                { id: 't2', title: 'Schedule follow-up call', dueDate: '2025-12-05', status: 'completed' },
              ],
              jobs: [
                { id: 'j1', name: 'Acme Chicago Office', status: 'Bidding', value: '$52,000', gc: 'Acme Corporation', ec: 'FlowConnect' },
              ],
              quotes: [
                { id: 'q1', name: 'Chicago Office - Lighting Package', stage: 'Sent', value: '$52,000', expirationDate: '2025-12-30' },
              ],
            },
          },
          {
            id: 'd2',
            name: 'Globex Industries',
            amount: 38000,
            stage: 'Negotiation',
            pipeline: 'Sales Pipeline',
            lastTouchpoint: '11/18/2025',
            daysAgo: 19,
            contacts: [
              { id: 'c3', name: 'Bob Wilson', email: 'bob.wilson@globex-example.com', role: 'Director', phone: '(555) 345-6789', company: 'Globex Industries' },
            ],
            touchpoints: [
              { id: 't3', type: 'MEETING', date: '2025-11-18T09:00:00Z', subject: 'On-site Demo', preview: 'Completed product demo with their team. Very positive feedback on the dashboard features.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c3', name: 'Bob Wilson', email: 'bob.wilson@globex-example.com', role: 'Director', phone: '(555) 345-6789', company: 'Globex Industries' },
              recentActivity: [
                { id: 'a4', type: 'meeting', description: 'Product demo at Globex', date: '2025-11-18' },
                { id: 'a5', type: 'email', description: 'Sent pricing information', date: '2025-11-15' },
              ],
              notes: [
                { id: 'n3', title: 'Competitor Evaluation', content: 'Bob mentioned they are also evaluating two other vendors. Price is a key factor.', date: '2025-11-18' },
              ],
              tasks: [
                { id: 't3', title: 'Prepare competitive analysis', dueDate: '2025-12-08', status: 'pending' },
              ],
              jobs: [
                { id: 'j2', name: 'Globex Warehouse Upgrade', status: 'Active', value: '$38,000', gc: 'Globex Industries', ec: 'FlowConnect' },
              ],
              quotes: [
                { id: 'q2', name: 'Warehouse LED Upgrade', stage: 'Review', value: '$38,000', expirationDate: '2025-12-20' },
              ],
            },
          },
          {
            id: 'd3',
            name: 'Initech LLC',
            amount: 24000,
            stage: 'Qualification',
            pipeline: 'Sales Pipeline',
            lastTouchpoint: '11/10/2025',
            daysAgo: 27,
            contacts: [
              { id: 'c4', name: 'Peter Gibbons', email: 'peter.g@initech-example.com', role: 'Manager', phone: '(555) 456-7890', company: 'Initech LLC' },
              { id: 'c5', name: 'Michael Bolton', email: 'm.bolton@initech-example.com', role: 'Engineer', phone: '(555) 567-8901', company: 'Initech LLC' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c4', name: 'Peter Gibbons', email: 'peter.g@initech-example.com', role: 'Manager', phone: '(555) 456-7890', company: 'Initech LLC' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd4',
            name: 'Umbrella Corp',
            amount: 67000,
            stage: 'Discovery',
            pipeline: 'Sales Pipeline',
            lastTouchpoint: '11/22/2025',
            daysAgo: 15,
            contacts: [
              { id: 'c6', name: 'Alice Johnson', email: 'a.johnson@umbrella-example.com', role: 'CEO', phone: '(555) 678-9012', company: 'Umbrella Corp' },
            ],
            touchpoints: [
              { id: 't4', type: 'INCOMING_EMAIL', date: '2025-11-22T16:00:00Z', subject: 'Re: Partnership Inquiry', preview: 'Thanks for reaching out. We would be interested in learning more about your solutions.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c6', name: 'Alice Johnson', email: 'a.johnson@umbrella-example.com', role: 'CEO', phone: '(555) 678-9012', company: 'Umbrella Corp' },
              recentActivity: [
                { id: 'a6', type: 'email', description: 'Received inquiry response', date: '2025-11-22' },
              ],
              notes: [
                { id: 'n4', title: 'Initial Interest', content: 'Alice expressed interest in our enterprise solutions. Schedule discovery call.', date: '2025-11-22' },
              ],
              tasks: [
                { id: 't4', title: 'Schedule discovery call', dueDate: '2025-12-15', status: 'pending' },
              ],
              jobs: [],
              quotes: [],
            },
          },
        ],
        totalSelected: 4,
        totalDraftsCreated: 0,
      };

    case 'event-attendees':
      return {
        id: 'camp-event',
        name: 'TechConf 2025 Attendees - 8 contacts',
        workflowType: 'event-attendees',
        date: '2025-12-07',
        deals: [
          {
            id: 'd1',
            name: 'Wayne Enterprises',
            amount: 125000,
            stage: 'Interested',
            pipeline: 'Event Pipeline',
            lastTouchpoint: '12/01/2025',
            daysAgo: 6,
            contacts: [
              { id: 'c1', name: 'Bruce Wayne', email: 'bruce@wayne-example.com', role: 'CEO', phone: '(555) 111-2222', company: 'Wayne Enterprises' },
              { id: 'c2', name: 'Lucius Fox', email: 'lucius@wayne-example.com', role: 'CTO', phone: '(555) 222-3333', company: 'Wayne Enterprises' },
            ],
            touchpoints: [
              { id: 't1', type: 'MEETING', date: '2025-12-01T11:00:00Z', subject: 'Booth Visit at TechConf', preview: 'Met at booth, discussed enterprise security solutions. Very interested in demo.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'Bruce Wayne', email: 'bruce@wayne-example.com', role: 'CEO', phone: '(555) 111-2222', company: 'Wayne Enterprises' },
              recentActivity: [
                { id: 'a1', type: 'meeting', description: 'Met at TechConf 2025 booth', date: '2025-12-01' },
              ],
              notes: [
                { id: 'n1', title: 'TechConf Notes', content: 'Bruce showed strong interest in enterprise security. Schedule demo next week.', date: '2025-12-01' },
              ],
              tasks: [
                { id: 't1', title: 'Send demo scheduling link', dueDate: '2025-12-10', status: 'pending' },
              ],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd2',
            name: 'Stark Industries',
            amount: 200000,
            stage: 'Demo Scheduled',
            pipeline: 'Event Pipeline',
            lastTouchpoint: '12/02/2025',
            daysAgo: 5,
            contacts: [
              { id: 'c3', name: 'Tony Stark', email: 'tony@stark-example.com', role: 'Founder', phone: '(555) 333-4444', company: 'Stark Industries' },
              { id: 'c4', name: 'Pepper Potts', email: 'pepper@stark-example.com', role: 'COO', phone: '(555) 444-5555', company: 'Stark Industries' },
            ],
            touchpoints: [
              { id: 't2', type: 'NOTE', date: '2025-12-02T15:30:00Z', subject: 'Conference Notes', preview: 'Exchanged cards at networking event. They are evaluating 3 vendors for Q1 decision.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c3', name: 'Tony Stark', email: 'tony@stark-example.com', role: 'Founder', phone: '(555) 333-4444', company: 'Stark Industries' },
              recentActivity: [
                { id: 'a2', type: 'note', description: 'Met at TechConf networking event', date: '2025-12-02' },
              ],
              notes: [
                { id: 'n2', title: 'Evaluation Timeline', content: 'Tony mentioned they plan to make a decision by end of Q1. Evaluating 3 vendors total.', date: '2025-12-02' },
              ],
              tasks: [
                { id: 't2', title: 'Prepare competitive positioning doc', dueDate: '2025-12-15', status: 'pending' },
              ],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd3',
            name: 'Oscorp',
            amount: 75000,
            stage: 'Follow-up',
            pipeline: 'Event Pipeline',
            lastTouchpoint: '12/01/2025',
            daysAgo: 6,
            contacts: [
              { id: 'c5', name: 'Norman Osborn', email: 'norman@oscorp-example.com', role: 'President', phone: '(555) 555-6666', company: 'Oscorp' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c5', name: 'Norman Osborn', email: 'norman@oscorp-example.com', role: 'President', phone: '(555) 555-6666', company: 'Oscorp' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
        ],
        totalSelected: 3,
        totalDraftsCreated: 0,
      };

    case 'job-contacts':
      return {
        id: 'camp-job',
        name: 'Downtown Office Renovation - All Contacts',
        workflowType: 'job-contacts',
        date: '2025-12-07',
        deals: [
          {
            id: 'd1',
            name: 'General Contractor - ABC Builders',
            amount: 0,
            stage: 'Active',
            pipeline: 'Project Contacts',
            lastTouchpoint: '12/05/2025',
            daysAgo: 2,
            contacts: [
              { id: 'c1', name: 'Mike Builder', email: 'mike@abc-builders-example.com', role: 'Project Manager', phone: '(555) 777-8888', company: 'ABC Builders' },
              { id: 'c2', name: 'Sarah Construct', email: 'sarah@abc-builders-example.com', role: 'Site Lead', phone: '(555) 888-9999', company: 'ABC Builders' },
            ],
            touchpoints: [
              { id: 't1', type: 'EMAIL', date: '2025-12-05T09:00:00Z', subject: 'Schedule Update', preview: 'Confirming the installation schedule for next week. Please review attached timeline.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'Mike Builder', email: 'mike@abc-builders-example.com', role: 'Project Manager', phone: '(555) 777-8888', company: 'ABC Builders' },
              recentActivity: [
                { id: 'a1', type: 'email', description: 'Sent schedule update', date: '2025-12-05' },
                { id: 'a2', type: 'call', description: 'Discussed installation timeline', date: '2025-12-03' },
              ],
              notes: [
                { id: 'n1', title: 'Installation Schedule', content: 'Mike confirmed installation window for Dec 15-20. Coordinate with electrical team.', date: '2025-12-05' },
              ],
              tasks: [
                { id: 't1', title: 'Confirm crew availability', dueDate: '2025-12-10', status: 'pending' },
              ],
              jobs: [
                { id: 'j1', name: 'Downtown Office Renovation', status: 'Active', value: '$450,000', gc: 'ABC Builders', ec: 'FlowConnect' },
              ],
              quotes: [],
            },
          },
          {
            id: 'd2',
            name: 'Architect - Design Partners',
            amount: 0,
            stage: 'Active',
            pipeline: 'Project Contacts',
            lastTouchpoint: '12/03/2025',
            daysAgo: 4,
            contacts: [
              { id: 'c3', name: 'Amy Architect', email: 'amy@design-partners-example.com', role: 'Lead Architect', phone: '(555) 999-0000', company: 'Design Partners' },
            ],
            touchpoints: [
              { id: 't2', type: 'CALL', date: '2025-12-03T14:00:00Z', subject: 'Design Review', preview: 'Reviewed final lighting specs. Minor adjustments needed in conference room layout.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c3', name: 'Amy Architect', email: 'amy@design-partners-example.com', role: 'Lead Architect', phone: '(555) 999-0000', company: 'Design Partners' },
              recentActivity: [
                { id: 'a3', type: 'call', description: 'Design review call', date: '2025-12-03' },
              ],
              notes: [
                { id: 'n2', title: 'Design Changes', content: 'Amy requested minor adjustments to conference room lighting layout. Update drawings.', date: '2025-12-03' },
              ],
              tasks: [
                { id: 't2', title: 'Update conference room drawings', dueDate: '2025-12-08', status: 'pending' },
              ],
              jobs: [
                { id: 'j1', name: 'Downtown Office Renovation', status: 'Active', value: '$450,000', gc: 'ABC Builders', ec: 'FlowConnect' },
              ],
              quotes: [],
            },
          },
          {
            id: 'd3',
            name: 'Owner - Client Corp',
            amount: 0,
            stage: 'Active',
            pipeline: 'Project Contacts',
            lastTouchpoint: '11/28/2025',
            daysAgo: 9,
            contacts: [
              { id: 'c4', name: 'Tom Owner', email: 'tom@client-corp-example.com', role: 'Facilities Director', phone: '(555) 000-1111', company: 'Client Corp' },
              { id: 'c5', name: 'Lisa Manager', email: 'lisa@client-corp-example.com', role: 'Project Coordinator', phone: '(555) 111-0000', company: 'Client Corp' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c4', name: 'Tom Owner', email: 'tom@client-corp-example.com', role: 'Facilities Director', phone: '(555) 000-1111', company: 'Client Corp' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [
                { id: 'j1', name: 'Downtown Office Renovation', status: 'Active', value: '$450,000', gc: 'ABC Builders', ec: 'FlowConnect' },
              ],
              quotes: [],
            },
          },
        ],
        totalSelected: 3,
        totalDraftsCreated: 0,
      };

    case 'overdue-quotes':
      return {
        id: 'camp-overdue',
        name: 'Overdue Quotes - 5 quotes past expiration',
        workflowType: 'overdue-quotes',
        date: '2025-12-07',
        deals: [
          {
            id: 'd1',
            name: 'Quote #1234 - Sunrise Properties',
            amount: 45000,
            stage: 'Expired 14 days',
            pipeline: 'Quotes',
            lastTouchpoint: '11/15/2025',
            daysAgo: 22,
            contacts: [
              { id: 'c1', name: 'David Sunrise', email: 'david@sunrise-example.com', role: 'Owner', phone: '(555) 222-1111', company: 'Sunrise Properties' },
            ],
            touchpoints: [
              { id: 't1', type: 'EMAIL', date: '2025-11-15T10:00:00Z', subject: 'Quote #1234 - Lighting Package', preview: 'Please find attached our quote for the lobby renovation project. Valid until Nov 23.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'David Sunrise', email: 'david@sunrise-example.com', role: 'Owner', phone: '(555) 222-1111', company: 'Sunrise Properties' },
              recentActivity: [
                { id: 'a1', type: 'email', description: 'Sent quote #1234', date: '2025-11-15' },
              ],
              notes: [
                { id: 'n1', title: 'Quote Follow-up', content: 'David was traveling during quote validity period. Follow up now that he is back.', date: '2025-11-25' },
              ],
              tasks: [
                { id: 't1', title: 'Follow up on expired quote', dueDate: '2025-12-08', status: 'pending' },
              ],
              jobs: [],
              quotes: [
                { id: 'q1', name: 'Lobby Renovation Lighting', stage: 'Expired', value: '$45,000', expirationDate: '2025-11-23' },
              ],
            },
          },
          {
            id: 'd2',
            name: 'Quote #1235 - Mountain View Hotel',
            amount: 78000,
            stage: 'Expired 7 days',
            pipeline: 'Quotes',
            lastTouchpoint: '11/20/2025',
            daysAgo: 17,
            contacts: [
              { id: 'c2', name: 'Helen Mountain', email: 'helen@mountainview-example.com', role: 'GM', phone: '(555) 333-2222', company: 'Mountain View Hotel' },
              { id: 'c3', name: 'George Peak', email: 'george@mountainview-example.com', role: 'Maintenance Dir', phone: '(555) 444-3333', company: 'Mountain View Hotel' },
            ],
            touchpoints: [
              { id: 't2', type: 'INCOMING_EMAIL', date: '2025-11-20T14:00:00Z', subject: 'Re: Quote Request', preview: 'We are still reviewing internally. Will get back to you soon.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c2', name: 'Helen Mountain', email: 'helen@mountainview-example.com', role: 'GM', phone: '(555) 333-2222', company: 'Mountain View Hotel' },
              recentActivity: [
                { id: 'a2', type: 'email', description: 'Received review update', date: '2025-11-20' },
              ],
              notes: [
                { id: 'n2', title: 'Internal Review', content: 'Helen mentioned internal budget review in progress. Decision expected after holidays.', date: '2025-11-20' },
              ],
              tasks: [],
              jobs: [],
              quotes: [
                { id: 'q2', name: 'Hotel Ballroom Lighting', stage: 'Expired', value: '$78,000', expirationDate: '2025-11-30' },
              ],
            },
          },
          {
            id: 'd3',
            name: 'Quote #1236 - City Plaza Mall',
            amount: 156000,
            stage: 'Expired 21 days',
            pipeline: 'Quotes',
            lastTouchpoint: '11/08/2025',
            daysAgo: 29,
            contacts: [
              { id: 'c4', name: 'Frank Plaza', email: 'frank@cityplaza-example.com', role: 'Operations', phone: '(555) 555-4444', company: 'City Plaza Mall' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c4', name: 'Frank Plaza', email: 'frank@cityplaza-example.com', role: 'Operations', phone: '(555) 555-4444', company: 'City Plaza Mall' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [
                { id: 'q3', name: 'Mall Common Area Upgrade', stage: 'Expired', value: '$156,000', expirationDate: '2025-11-16' },
              ],
            },
          },
        ],
        totalSelected: 3,
        totalDraftsCreated: 0,
      };

    case 'quote-followup':
      return {
        id: 'camp-followup',
        name: 'Quote Follow-ups - Pending Response',
        workflowType: 'quote-followup',
        date: '2025-12-07',
        deals: [
          {
            id: 'd1',
            name: 'Quote #1240 - Green Valley School',
            amount: 92000,
            stage: 'Sent - 10 days',
            pipeline: 'Active Quotes',
            lastTouchpoint: '11/27/2025',
            daysAgo: 10,
            contacts: [
              { id: 'c1', name: 'Principal Green', email: 'principal@greenvalley-example.edu', role: 'Principal', phone: '(555) 666-5555', company: 'Green Valley School' },
              { id: 'c2', name: 'Budget Officer', email: 'budget@greenvalley-example.edu', role: 'Finance', phone: '(555) 777-6666', company: 'Green Valley School' },
            ],
            touchpoints: [
              { id: 't1', type: 'EMAIL', date: '2025-11-27T09:00:00Z', subject: 'Quote for Gymnasium Lighting', preview: 'Attached is our comprehensive quote for the gymnasium lighting upgrade project.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'Principal Green', email: 'principal@greenvalley-example.edu', role: 'Principal', phone: '(555) 666-5555', company: 'Green Valley School' },
              recentActivity: [
                { id: 'a1', type: 'email', description: 'Sent gymnasium lighting quote', date: '2025-11-27' },
              ],
              notes: [
                { id: 'n1', title: 'School Board Approval', content: 'Principal mentioned quote needs school board approval. Meeting scheduled for Dec 15.', date: '2025-11-27' },
              ],
              tasks: [
                { id: 't1', title: 'Follow up after board meeting', dueDate: '2025-12-16', status: 'pending' },
              ],
              jobs: [],
              quotes: [
                { id: 'q1', name: 'Gymnasium Lighting Upgrade', stage: 'Sent', value: '$92,000', expirationDate: '2025-12-27' },
              ],
            },
          },
          {
            id: 'd2',
            name: 'Quote #1241 - Harbor Medical Center',
            amount: 234000,
            stage: 'Viewed - 5 days',
            pipeline: 'Active Quotes',
            lastTouchpoint: '12/02/2025',
            daysAgo: 5,
            contacts: [
              { id: 'c3', name: 'Dr. Harbor', email: 'dr.harbor@harbormed-example.com', role: 'Administrator', phone: '(555) 888-7777', company: 'Harbor Medical Center' },
            ],
            touchpoints: [
              { id: 't2', type: 'NOTE', date: '2025-12-02T11:00:00Z', subject: 'Quote Viewed', preview: 'Client opened and viewed the quote PDF. No response yet.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c3', name: 'Dr. Harbor', email: 'dr.harbor@harbormed-example.com', role: 'Administrator', phone: '(555) 888-7777', company: 'Harbor Medical Center' },
              recentActivity: [
                { id: 'a2', type: 'note', description: 'Quote viewed notification', date: '2025-12-02' },
              ],
              notes: [
                { id: 'n2', title: 'Quote Engagement', content: 'Dr. Harbor viewed the quote multiple times. Good sign of interest.', date: '2025-12-02' },
              ],
              tasks: [
                { id: 't2', title: 'Call to discuss quote', dueDate: '2025-12-09', status: 'pending' },
              ],
              jobs: [],
              quotes: [
                { id: 'q2', name: 'Medical Center Lighting', stage: 'Viewed', value: '$234,000', expirationDate: '2026-01-02' },
              ],
            },
          },
          {
            id: 'd3',
            name: 'Quote #1242 - Riverfront Condos',
            amount: 67000,
            stage: 'Sent - 8 days',
            pipeline: 'Active Quotes',
            lastTouchpoint: '11/29/2025',
            daysAgo: 8,
            contacts: [
              { id: 'c4', name: 'River Manager', email: 'manager@riverfront-example.com', role: 'Property Mgr', phone: '(555) 999-8888', company: 'Riverfront Condos' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c4', name: 'River Manager', email: 'manager@riverfront-example.com', role: 'Property Mgr', phone: '(555) 999-8888', company: 'Riverfront Condos' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [
                { id: 'q3', name: 'Condo Common Area Lighting', stage: 'Sent', value: '$67,000', expirationDate: '2025-12-29' },
              ],
            },
          },
        ],
        totalSelected: 3,
        totalDraftsCreated: 0,
      };

    case 'hubspot-import':
      return {
        id: 'camp-import',
        name: 'CRM Import - 5 new companies - 12/07/2025',
        workflowType: 'hubspot-import',
        date: '2025-12-07',
        deals: [
          {
            id: 'd1',
            name: 'NewCo Enterprises',
            amount: 0,
            stage: 'New Lead',
            pipeline: 'Inbound',
            lastTouchpoint: 'Never',
            daysAgo: 0,
            contacts: [
              { id: 'c1', name: 'Alex NewCo', email: 'alex@newco-example.com', role: 'Founder', phone: '(555) 000-9999', company: 'NewCo Enterprises' },
              { id: 'c2', name: 'Sam Partner', email: 'sam@newco-example.com', role: 'Co-Founder', phone: '(555) 111-8888', company: 'NewCo Enterprises' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'Alex NewCo', email: 'alex@newco-example.com', role: 'Founder', phone: '(555) 000-9999', company: 'NewCo Enterprises' },
              recentActivity: [],
              notes: [
                { id: 'n1', title: 'Import Source', content: 'Imported from HubSpot CRM. Company showed interest via website form.', date: '2025-12-07' },
              ],
              tasks: [
                { id: 't1', title: 'Send introduction email', dueDate: '2025-12-08', status: 'pending' },
              ],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd2',
            name: 'FreshStart Inc',
            amount: 0,
            stage: 'New Lead',
            pipeline: 'Inbound',
            lastTouchpoint: 'Never',
            daysAgo: 0,
            contacts: [
              { id: 'c3', name: 'Chris Fresh', email: 'chris@freshstart-example.com', role: 'CEO', phone: '(555) 222-7777', company: 'FreshStart Inc' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c3', name: 'Chris Fresh', email: 'chris@freshstart-example.com', role: 'CEO', phone: '(555) 222-7777', company: 'FreshStart Inc' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd3',
            name: 'BlueSky Solutions',
            amount: 0,
            stage: 'New Lead',
            pipeline: 'Inbound',
            lastTouchpoint: 'Never',
            daysAgo: 0,
            contacts: [
              { id: 'c4', name: 'Sky Blue', email: 'sky@bluesky-example.com', role: 'Director', phone: '(555) 333-6666', company: 'BlueSky Solutions' },
              { id: 'c5', name: 'Cloud Walker', email: 'cloud@bluesky-example.com', role: 'Manager', phone: '(555) 444-5555', company: 'BlueSky Solutions' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c4', name: 'Sky Blue', email: 'sky@bluesky-example.com', role: 'Director', phone: '(555) 333-6666', company: 'BlueSky Solutions' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd4',
            name: 'Pinnacle Group',
            amount: 0,
            stage: 'New Lead',
            pipeline: 'Inbound',
            lastTouchpoint: 'Never',
            daysAgo: 0,
            contacts: [
              { id: 'c6', name: 'Peak Pinnacle', email: 'peak@pinnacle-example.com', role: 'President', phone: '(555) 555-4444', company: 'Pinnacle Group' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c6', name: 'Peak Pinnacle', email: 'peak@pinnacle-example.com', role: 'President', phone: '(555) 555-4444', company: 'Pinnacle Group' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd5',
            name: 'Horizon Dynamics',
            amount: 0,
            stage: 'New Lead',
            pipeline: 'Inbound',
            lastTouchpoint: 'Never',
            daysAgo: 0,
            contacts: [
              { id: 'c7', name: 'Dawn Horizon', email: 'dawn@horizon-example.com', role: 'VP Sales', phone: '(555) 666-3333', company: 'Horizon Dynamics' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c7', name: 'Dawn Horizon', email: 'dawn@horizon-example.com', role: 'VP Sales', phone: '(555) 666-3333', company: 'Horizon Dynamics' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
        ],
        totalSelected: 5,
        totalDraftsCreated: 0,
      };

    case 'custom':
    default:
      return {
        id: 'camp-custom',
        name: 'Custom Campaign - 12/07/2025',
        workflowType: 'custom',
        date: '2025-12-07',
        deals: [
          {
            id: 'd1',
            name: 'Sample Company A',
            amount: 50000,
            stage: 'In Progress',
            pipeline: 'Custom',
            lastTouchpoint: '12/01/2025',
            daysAgo: 6,
            contacts: [
              { id: 'c1', name: 'Contact One', email: 'contact1@sample-a-example.com', role: 'Manager', phone: '(555) 777-2222', company: 'Sample Company A' },
            ],
            touchpoints: [
              { id: 't1', type: 'EMAIL', date: '2025-12-01T10:00:00Z', subject: 'Initial Outreach', preview: 'Hello, reaching out to discuss potential partnership opportunities.' },
            ],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c1', name: 'Contact One', email: 'contact1@sample-a-example.com', role: 'Manager', phone: '(555) 777-2222', company: 'Sample Company A' },
              recentActivity: [
                { id: 'a1', type: 'email', description: 'Sent initial outreach', date: '2025-12-01' },
              ],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
          {
            id: 'd2',
            name: 'Sample Company B',
            amount: 35000,
            stage: 'In Progress',
            pipeline: 'Custom',
            lastTouchpoint: '11/28/2025',
            daysAgo: 9,
            contacts: [
              { id: 'c2', name: 'Contact Two', email: 'contact2@sample-b-example.com', role: 'Director', phone: '(555) 888-1111', company: 'Sample Company B' },
            ],
            touchpoints: [],
            selected: true,
            draftCreated: false,
            contactContext: {
              contact: { id: 'c2', name: 'Contact Two', email: 'contact2@sample-b-example.com', role: 'Director', phone: '(555) 888-1111', company: 'Sample Company B' },
              recentActivity: [],
              notes: [],
              tasks: [],
              jobs: [],
              quotes: [],
            },
          },
        ],
        totalSelected: 2,
        totalDraftsCreated: 0,
      };
  }
};

// ============================================
// COMPONENT
// ============================================

// Workflow template passed from parent
type WorkflowTemplate = {
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

type Props = {
  onBack: () => void;
  initialWorkflowType?: WorkflowType;
  workflowTemplate?: WorkflowTemplate;
};

// Track individual deal drafts
type DealDraft = {
  dealId: string;
  subject: string;
  body: string;
  hasCustomText: boolean; // true if user manually edited this draft
};

export default function CampaignCompose({ onBack, initialWorkflowType = 'custom', workflowTemplate }: Props) {
  // Campaign state - initialize based on workflow type
  const [campaign, setCampaign] = useState<Campaign>(() => getMockDataForWorkflow(initialWorkflowType));

  // Editable campaign name
  const [campaignName, setCampaignName] = useState(() => getMockDataForWorkflow(initialWorkflowType).name);
  const [isEditingName, setIsEditingName] = useState(false);

  // Compose mode: 'template' for group template page, 'individual' for per-contact editing
  const [composeMode, setComposeMode] = useState<'template' | 'individual'>('template');
  const [currentDealIndex, setCurrentDealIndex] = useState(0);

  // Template state (for group template page) - initialize from workflow template if provided
  const [templateSubject, setTemplateSubject] = useState(
    workflowTemplate?.emailTemplate.subject || 'Follow-up on your account'
  );
  const [templateBody, setTemplateBody] = useState(
    workflowTemplate?.emailTemplate.body || 'Hello {firstName},\n\nI wanted to follow up regarding your account with us.\n\nBest regards'
  );

  // Individual draft state - tracks custom text per deal
  const [dealDrafts, setDealDrafts] = useState<Map<string, DealDraft>>(new Map());

  // Selection state for template application
  const [selectedForTemplate, setSelectedForTemplate] = useState<Set<string>>(new Set());

  // Overwrite warning modal
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [dealsToOverwrite, setDealsToOverwrite] = useState<string[]>([]);

  // Compose state (for current individual view) - initialize from workflow template if provided
  const [subject, setSubject] = useState(
    workflowTemplate?.emailTemplate.subject || 'Follow-up on your account'
  );
  const [body, setBody] = useState(
    workflowTemplate?.emailTemplate.body || 'Hello {firstName},\n\nI wanted to follow up regarding your account with us.\n\nBest regards'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // View mode toggle (variable vs final)
  const [viewMode, setViewMode] = useState<'variable' | 'final'>('variable');
  const [showVariableTooltip, setShowVariableTooltip] = useState(false);

  // Sidebar section expansion state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['activity']));

  // Selected contact for multi-contact deals
  const [selectedContactIndex, setSelectedContactIndex] = useState(0);

  // Schedule modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Initialize selection state - by default, select deals without custom text
  React.useEffect(() => {
    const selected = new Set<string>();
    selectedDeals.forEach(deal => {
      const draft = dealDrafts.get(deal.id);
      if (!draft?.hasCustomText) {
        selected.add(deal.id);
      }
    });
    setSelectedForTemplate(selected);
  }, []);

  // Current deal
  const selectedDeals = useMemo(() => campaign.deals.filter(d => d.selected), [campaign.deals]);
  const currentDeal = selectedDeals[currentDealIndex] || null;
  const totalSelected = selectedDeals.length;

  // Get the current contact context
  const currentContact = currentDeal?.contacts[selectedContactIndex] || currentDeal?.contacts[0];
  const currentContactContext = currentDeal?.contactContext;

  // Generate firstNames variable - up to 3 names comma-separated, or "everyone" if more
  const getFirstNames = useMemo(() => {
    if (!currentDeal) return '';
    const names = currentDeal.contacts.map(c => c.name.split(' ')[0]);
    if (names.length <= 3) {
      return names.join(', ');
    }
    return 'everyone';
  }, [currentDeal]);

  // Variable definitions with descriptions
  const variableDefinitions = useMemo(() => [
    { name: 'firstName', description: 'First name of the current contact', value: currentContact?.name?.split(' ')[0] || '' },
    { name: 'lastName', description: 'Last name of the current contact', value: currentContact?.name?.split(' ').slice(1).join(' ') || '' },
    { name: 'companyName', description: 'Company name of the current contact', value: currentContact?.company || currentDeal?.name || '' },
    { name: 'firstNames', description: 'First names of all contacts (up to 3), or "everyone" if more', value: getFirstNames },
  ], [currentContact, currentDeal, getFirstNames]);

  // Substitute variables in text
  const substituteVariables = (text: string): string => {
    let result = text;
    variableDefinitions.forEach(v => {
      const regex = new RegExp(`\\{${v.name}\\}`, 'g');
      result = result.replace(regex, v.value);
    });
    return result;
  };

  // Check for unsubstituted variables (curly brackets remaining)
  const hasUnsubstitutedVariables = (text: string): boolean => {
    return /\{[^}]+\}/.test(text);
  };

  // Get the final rendered body with variables substituted
  const renderedBody = useMemo(() => substituteVariables(body), [body, variableDefinitions]);
  const renderedSubject = useMemo(() => substituteVariables(subject), [subject, variableDefinitions]);

  // Check for warnings
  const bodyHasWarning = viewMode === 'final' && hasUnsubstitutedVariables(renderedBody);
  const subjectHasWarning = viewMode === 'final' && hasUnsubstitutedVariables(renderedSubject);

  // Navigation
  const handlePrevious = () => {
    if (currentDealIndex > 0) {
      setCurrentDealIndex(currentDealIndex - 1);
      setSelectedContactIndex(0);
    }
  };

  const handleNext = () => {
    if (currentDealIndex < selectedDeals.length - 1) {
      setCurrentDealIndex(currentDealIndex + 1);
      setSelectedContactIndex(0);
    }
  };

  // Toggle sidebar sections
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Send handlers
  const handleSendNow = () => {
    if (!currentDeal) return;
    // Mark as draft created and move to next
    setCampaign(prev => ({
      ...prev,
      deals: prev.deals.map(d =>
        d.id === currentDeal.id ? { ...d, draftCreated: true } : d
      ),
    }));
    if (currentDealIndex < selectedDeals.length - 1) {
      setCurrentDealIndex(currentDealIndex + 1);
      setSelectedContactIndex(0);
    }
  };

  const handleScheduleASAP = () => {
    // Schedule for the next available time slot (e.g., 15 minutes from now)
    handleSendNow();
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = () => {
    setShowScheduleModal(false);
    handleSendNow();
  };

  const handleSaveAsTemplate = () => {
    // In a real app, this would save the template
    alert('Template saved for this workflow group!');
  };

  // Auto-generate email
  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const contactName = currentContact?.name?.split(' ')[0] || 'there';
    const companyName = currentDeal?.name || 'your company';

    setBody(`Hi ${contactName},

I hope this email finds you well! I'm reaching out regarding ${companyName} and wanted to touch base about our ongoing discussions.

I'd love to schedule some time to connect and discuss how we can help move things forward. Would you have availability this week for a quick call?

Looking forward to hearing from you.

Best regards`);
    setIsGenerating(false);
  };

  // Template application handlers
  const toggleDealSelection = (dealId: string) => {
    setSelectedForTemplate(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const handleApplyTemplate = () => {
    // Check if any selected deals have existing custom text
    const dealsWithText: string[] = [];
    selectedForTemplate.forEach(dealId => {
      const draft = dealDrafts.get(dealId);
      if (draft?.hasCustomText) {
        dealsWithText.push(dealId);
      }
    });

    if (dealsWithText.length > 0) {
      // Show warning modal
      setDealsToOverwrite(dealsWithText);
      setShowOverwriteModal(true);
    } else {
      // Apply directly
      applyTemplateToSelected();
    }
  };

  const applyTemplateToSelected = () => {
    const newDrafts = new Map(dealDrafts);
    selectedForTemplate.forEach(dealId => {
      newDrafts.set(dealId, {
        dealId,
        subject: templateSubject,
        body: templateBody,
        hasCustomText: false, // Template applied, not custom
      });
    });
    setDealDrafts(newDrafts);
    setShowOverwriteModal(false);

    // Move to individual mode
    setComposeMode('individual');
    setCurrentDealIndex(0);

    // Load first deal's draft into editor
    const firstDeal = selectedDeals[0];
    if (firstDeal) {
      const draft = newDrafts.get(firstDeal.id);
      if (draft) {
        setSubject(draft.subject);
        setBody(draft.body);
      }
    }
  };

  const handleStartIndividualMode = () => {
    setComposeMode('individual');
    setCurrentDealIndex(0);

    // Load first deal's draft or use template as default
    const firstDeal = selectedDeals[0];
    if (firstDeal) {
      const draft = dealDrafts.get(firstDeal.id);
      if (draft) {
        setSubject(draft.subject);
        setBody(draft.body);
      } else {
        setSubject(templateSubject);
        setBody(templateBody);
      }
    }
  };

  // When switching deals in individual mode, save current and load new
  const switchToDeal = (index: number) => {
    // Save current draft
    if (currentDeal) {
      setDealDrafts(prev => {
        const newDrafts = new Map(prev);
        newDrafts.set(currentDeal.id, {
          dealId: currentDeal.id,
          subject,
          body,
          hasCustomText: true,
        });
        return newDrafts;
      });
    }

    // Load new deal's draft
    const newDeal = selectedDeals[index];
    if (newDeal) {
      const draft = dealDrafts.get(newDeal.id);
      if (draft) {
        setSubject(draft.subject);
        setBody(draft.body);
      } else {
        // Use template as default
        setSubject(templateSubject);
        setBody(templateBody);
      }
    }

    setCurrentDealIndex(index);
    setSelectedContactIndex(0);
  };

  const handleBackToTemplate = () => {
    // Save current draft before going back
    if (currentDeal) {
      setDealDrafts(prev => {
        const newDrafts = new Map(prev);
        newDrafts.set(currentDeal.id, {
          dealId: currentDeal.id,
          subject,
          body,
          hasCustomText: true,
        });
        return newDrafts;
      });
    }
    setComposeMode('template');
  };

  // Get synopsis for a deal (first 50 chars of body)
  const getDealSynopsis = (dealId: string) => {
    const draft = dealDrafts.get(dealId);
    if (draft) {
      const preview = draft.body.replace(/\{[^}]+\}/g, '...').slice(0, 60);
      return preview + (draft.body.length > 60 ? '...' : '');
    }
    return 'No draft yet';
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--background)]">
      {/* TEMPLATE MODE */}
      {composeMode === 'template' ? (
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Template Compose */}
          <div className="flex-1 overflow-y-auto p-6">
            <div>
              {/* Campaign Name Header with Navigation to the right */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {/* Left: Editable Title */}
                  <div className="flex-1">
                    {isEditingName ? (
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsEditingName(false);
                          if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        autoFocus
                        className="text-xl font-semibold text-[var(--foreground)] bg-transparent border-b-2 border-[var(--primary)] focus:outline-none w-full"
                      />
                    ) : (
                      <h1
                        onClick={() => setIsEditingName(true)}
                        className="text-xl font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                        title="Click to edit"
                      >
                        {campaignName}
                      </h1>
                    )}
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Create a template for {totalSelected} recipients
                    </p>
                  </div>

                  {/* Right: Navigation */}
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm text-[var(--primary)] font-medium">
                      Template
                    </span>
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--muted-foreground)] opacity-50">
                        &lt; Previous
                      </span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        0 of {totalSelected}
                      </span>
                      <button
                        onClick={handleStartIndividualMode}
                        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      >
                        Next &gt;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Subject</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  placeholder="Email subject"
                />
              </div>

              {/* Template Variables */}
              <div className="mb-2">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Variables: {'{firstName}'}, {'{lastName}'}, {'{companyName}'}, {'{firstNames}'}
                </span>
              </div>

              {/* Body Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Message Template</label>
                <div className="flex items-center gap-1 p-2 border border-[var(--border)] border-b-0 rounded-t-lg bg-[var(--muted)]">
                  <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                    <span className="font-bold text-sm">B</span>
                  </button>
                  <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                    <span className="italic text-sm">I</span>
                  </button>
                  <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                    <span className="underline text-sm">U</span>
                  </button>
                  <div className="w-px h-4 bg-[var(--border)] mx-1" />
                  <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>
                </div>
                <textarea
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-b-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  placeholder="Write your template message..."
                />
              </div>

              {/* Save/Load Template Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={handleSaveAsTemplate}
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Template
                </button>
                <button
                  className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  Load Template
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleApplyTemplate}
                  disabled={selectedForTemplate.size === 0}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12l5 5L20 7"/>
                  </svg>
                  Apply Template ({selectedForTemplate.size} selected)
                </button>

                <button
                  className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Schedule All ASAP
                </button>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Schedule All
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Recipients List */}
          <div className="w-1/3 max-w-[400px] min-w-[300px] border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)]">Recipients</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Select which recipients to apply the template to
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {selectedDeals.map((deal, idx) => {
                const isSelected = selectedForTemplate.has(deal.id);
                const draft = dealDrafts.get(deal.id);
                const hasCustomText = draft?.hasCustomText;

                return (
                  <div
                    key={deal.id}
                    className={`p-4 hover:bg-[var(--muted)] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[var(--secondary)]' : ''
                    }`}
                    onClick={() => toggleDealSelection(deal.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[var(--primary)] border-[var(--primary)]'
                          : 'border-[var(--muted-foreground)]'
                      }`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <path d="M5 12l5 5L20 7"/>
                          </svg>
                        )}
                      </div>

                      {/* Deal info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--foreground)] truncate">{deal.name}</span>
                          {hasCustomText && (
                            <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                              Has text
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] truncate">
                          {deal.contacts.map(c => c.name).join(', ')}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2">
                          {getDealSynopsis(deal.id)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : currentDeal && currentContact ? (
        /* INDIVIDUAL MODE */
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Compose */}
          <div className="flex-1 overflow-y-auto p-6">
            <div>
              {/* Campaign Name Header with Navigation to the right */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  {/* Left: Editable Title */}
                  <div className="flex-1">
                    {isEditingName ? (
                      <input
                        type="text"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setIsEditingName(false);
                          if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        autoFocus
                        className="text-xl font-semibold text-[var(--foreground)] bg-transparent border-b-2 border-[var(--primary)] focus:outline-none w-full"
                      />
                    ) : (
                      <h1
                        onClick={() => setIsEditingName(true)}
                        className="text-xl font-semibold text-[var(--foreground)] cursor-pointer hover:text-[var(--primary)] transition-colors"
                        title="Click to edit"
                      >
                        {campaignName}
                      </h1>
                    )}
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Emailing: {currentDeal.name}
                    </p>
                  </div>

                  {/* Right: Navigation */}
                  <div className="flex items-center gap-4 ml-4">
                    <button
                      onClick={handleBackToTemplate}
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium"
                    >
                      Template
                    </button>
                    <div className="w-px h-4 bg-[var(--border)]" />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => switchToDeal(currentDealIndex - 1)}
                        disabled={currentDealIndex === 0}
                        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        &lt; Previous
                      </button>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {currentDealIndex + 1} of {totalSelected}
                      </span>
                      <button
                        onClick={() => switchToDeal(currentDealIndex + 1)}
                        disabled={currentDealIndex >= totalSelected - 1}
                        className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next &gt;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* To Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">To</label>
                <div className="flex flex-wrap gap-2 p-2 border border-[var(--border)] rounded-lg bg-[var(--card)] min-h-[40px]">
                  {currentDeal.contacts.map((contact, idx) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContactIndex(idx)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        idx === selectedContactIndex
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)]'
                      }`}
                    >
                      {contact.name} &lt;{contact.email}&gt;
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Subject</label>
                <div className="relative">
                  <input
                    type="text"
                    value={viewMode === 'variable' ? subject : renderedSubject}
                    onChange={(e) => viewMode === 'variable' && setSubject(e.target.value)}
                    readOnly={viewMode === 'final'}
                    className={`w-full px-4 py-2 border rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                      subjectHasWarning ? 'border-red-500' : 'border-[var(--border)]'
                    } ${viewMode === 'final' ? 'cursor-default' : ''}`}
                    placeholder="Email subject"
                  />
                  {subjectHasWarning && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" title="Unsubstituted variable detected">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Variables with Tooltip */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Variables: {'{firstName}'}, {'{lastName}'}, {'{companyName}'}, {'{firstNames}'}
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowVariableTooltip(!showVariableTooltip)}
                    className="p-1 hover:bg-[var(--muted)] rounded-full transition-colors text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </button>
                  {showVariableTooltip && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowVariableTooltip(false)} />
                      <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
                        <div className="text-sm font-medium text-[var(--foreground)] mb-2">Available Variables</div>
                        <div className="space-y-2">
                          {variableDefinitions.map(v => (
                            <div key={v.name} className="flex items-start gap-2">
                              <code className="px-1.5 py-0.5 bg-[var(--muted)] text-[var(--primary)] rounded text-xs font-mono whitespace-nowrap">
                                {`{${v.name}}`}
                              </code>
                              <span className="text-xs text-[var(--muted-foreground)]">{v.description}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-[var(--border)]">
                          <div className="text-xs text-[var(--muted-foreground)]">
                            <span className="font-medium">Current values:</span>
                            <div className="mt-1 space-y-1">
                              {variableDefinitions.map(v => (
                                <div key={v.name} className="flex items-center gap-2">
                                  <code className="text-[var(--primary)]">{v.name}:</code>
                                  <span className="text-[var(--foreground)]">"{v.value || '(empty)'}"</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Body Field with Toolbar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[var(--foreground)]">Message</label>
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 p-0.5 bg-[var(--muted)] rounded-lg">
                    <button
                      onClick={() => setViewMode('variable')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        viewMode === 'variable'
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      Variables
                    </button>
                    <button
                      onClick={() => setViewMode('final')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                        viewMode === 'final'
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      Final Preview
                      {bodyHasWarning && (
                        <span className="text-red-500">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simple toolbar - only show in variable mode */}
                {viewMode === 'variable' && (
                  <div className="flex items-center gap-1 p-2 border border-[var(--border)] border-b-0 rounded-t-lg bg-[var(--muted)]">
                    <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                      <span className="font-bold text-sm">B</span>
                    </button>
                    <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                      <span className="italic text-sm">I</span>
                    </button>
                    <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                      <span className="underline text-sm">U</span>
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-1" />
                    <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-1" />
                    <button className="p-1.5 hover:bg-[var(--card)] rounded transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )}

                {/* Textarea or Preview */}
                {viewMode === 'variable' ? (
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 border border-[var(--border)] rounded-b-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    placeholder="Write your message..."
                  />
                ) : (
                  <div className={`w-full px-4 py-3 border rounded-lg bg-[var(--background)] min-h-[300px] ${
                    bodyHasWarning ? 'border-red-500' : 'border-[var(--border)]'
                  }`}>
                    {bodyHasWarning && (
                      <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500 flex-shrink-0 mt-0.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <div className="text-xs text-red-700">
                          <strong>Warning:</strong> Unsubstituted variable detected. This could indicate a typo or missing data. Check your template before sending.
                        </div>
                      </div>
                    )}
                    <div className="text-[var(--foreground)] whitespace-pre-wrap">
                      {renderedBody.split(/(\{[^}]+\})/).map((part, i) => {
                        if (/^\{[^}]+\}$/.test(part)) {
                          // This is an unsubstituted variable - highlight it in red
                          return (
                            <span key={i} className="px-1 py-0.5 bg-red-100 text-red-700 rounded font-mono text-sm">
                              {part}
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Generation */}
              <div className="flex items-center gap-2 mb-6">
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
                  Auto Generate
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  onClick={handleSendNow}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  Send Now
                </button>

                <button
                  onClick={handleScheduleASAP}
                  className="px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--secondary)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Schedule ASAP
                </button>

                <button
                  onClick={handleSchedule}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Contact Context Sidebar */}
          <div className="w-1/3 max-w-[400px] min-w-[300px] border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto">
            {/* Contact selector if multiple contacts */}
            {currentDeal.contacts.length > 1 && (
              <div className="p-4 border-b border-[var(--border)]">
                <div className="flex gap-2 overflow-x-auto">
                  {currentDeal.contacts.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContactIndex(idx)}
                      className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                        selectedContactIndex === idx
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
                  {currentContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">{currentContact.name}</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">{currentContact.role}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">{currentContact.company || currentDeal.name}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            {currentContactContext && (
              <>
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
                      {currentContactContext.recentActivity.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No recent activity</p>
                      ) : (
                        currentContactContext.recentActivity.map(activity => (
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
                    <span className="font-medium text-[var(--foreground)]">Notes ({currentContactContext.notes.length})</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('notes') ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {expandedSections.has('notes') && (
                    <div className="px-4 pb-4 space-y-2">
                      {currentContactContext.notes.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No notes</p>
                      ) : (
                        currentContactContext.notes.map(note => (
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
                    <span className="font-medium text-[var(--foreground)]">Tasks ({currentContactContext.tasks.length})</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('tasks') ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {expandedSections.has('tasks') && (
                    <div className="px-4 pb-4 space-y-2">
                      {currentContactContext.tasks.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No tasks</p>
                      ) : (
                        currentContactContext.tasks.map(task => (
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
                    <span className="font-medium text-[var(--foreground)]">Jobs ({currentContactContext.jobs.length})</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('jobs') ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {expandedSections.has('jobs') && (
                    <div className="px-4 pb-4 space-y-2">
                      {currentContactContext.jobs.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No jobs</p>
                      ) : (
                        currentContactContext.jobs.map(job => (
                          <div
                            key={job.id}
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
                    <span className="font-medium text-[var(--foreground)]">Quotes ({currentContactContext.quotes.length})</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${expandedSections.has('quotes') ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {expandedSections.has('quotes') && (
                    <div className="px-4 pb-4 space-y-2">
                      {currentContactContext.quotes.length === 0 ? (
                        <p className="text-sm text-[var(--muted-foreground)]">No quotes</p>
                      ) : (
                        currentContactContext.quotes.map(quote => (
                          <div
                            key={quote.id}
                            className="p-3 bg-[var(--muted)] rounded-lg cursor-pointer hover:bg-[var(--secondary)] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-[var(--foreground)]">{quote.name}</p>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                quote.stage === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                quote.stage === 'Draft' ? 'bg-gray-100 text-gray-700' :
                                quote.stage === 'Review' ? 'bg-yellow-100 text-yellow-700' :
                                quote.stage === 'Expired' ? 'bg-red-100 text-red-700' :
                                quote.stage === 'Viewed' ? 'bg-green-100 text-green-700' :
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
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No contacts selected</h3>
            <p className="text-[var(--muted-foreground)] mb-4">Configure your workflow to select contacts</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowScheduleModal(false)} />
          <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">Schedule Email</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduleDate}
                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Warning Modal */}
      {showOverwriteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOverwriteModal(false)} />
          <div className="relative bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Overwrite Existing Text?</h3>
            </div>

            <p className="text-[var(--muted-foreground)] mb-4">
              {dealsToOverwrite.length} recipient{dealsToOverwrite.length === 1 ? '' : 's'} already {dealsToOverwrite.length === 1 ? 'has' : 'have'} custom text. Applying the template will overwrite their existing content.
            </p>

            <div className="max-h-40 overflow-y-auto mb-4 border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
              {dealsToOverwrite.map(dealId => {
                const deal = selectedDeals.find(d => d.id === dealId);
                if (!deal) return null;
                return (
                  <div key={dealId} className="p-2 text-sm">
                    <span className="font-medium text-[var(--foreground)]">{deal.name}</span>
                    <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                      {getDealSynopsis(dealId)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowOverwriteModal(false)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyTemplateToSelected}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Overwrite & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

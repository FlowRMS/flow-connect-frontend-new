/**
 * Mock Data for Campaigns and Rules
 */

import type { Contact, Campaign, Rule } from './types';

// Available contacts
export const availableContacts: Contact[] = [
  { id: 'C-001', name: 'Michael Rodriguez', email: 'mrodriguez@turnerconst.com', company: 'Turner Construction', type: 'GC' },
  { id: 'C-002', name: 'Jennifer Walsh', email: 'jwalsh@millerelectric.com', company: 'Miller Electric', type: 'EC' },
  { id: 'C-003', name: 'David Chen', email: 'd.chen@smitharch.com', company: 'Smith & Associates', type: 'Architect' },
  { id: 'C-004', name: 'Sarah Thompson', email: 'sthompson@jci.com', company: 'Johnson Controls', type: 'EC' },
  { id: 'C-005', name: 'Marcus Williams', email: 'marcus.w@henselphelps.com', company: 'Hensel Phelps', type: 'GC' },
  { id: 'C-006', name: 'Amanda Foster', email: 'afoster@summitelec.com', company: 'Summit Electric', type: 'EC' },
  { id: 'C-007', name: 'Robert Jackson', email: 'rjackson@mccarthybuilding.com', company: 'McCarthy Building', type: 'GC' },
  { id: 'C-008', name: 'Lisa Martinez', email: 'l.martinez@bayareaelec.com', company: 'Bay Area Electric', type: 'EC' },
];

// Campaign data
export const campaigns: Campaign[] = [
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

// Rule data
export const rules: Rule[] = [
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

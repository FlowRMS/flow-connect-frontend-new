/**
 * Mock Data for Rules
 * Note: Campaign mock data has been removed - campaigns now use the real API
 */

import type { Rule } from './types';

// Rule data (TODO: integrate with Rules API when available)
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

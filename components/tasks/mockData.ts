/**
 * Mock Task Data
 */

import type { Task } from './types';

export const MOCK_TASKS: Task[] = [
  {
    id: 'T-001',
    title: 'Follow up with Turner on lighting spec',
    description: 'Discuss updated lighting requirements for Downtown Plaza',
    dueDate: '2025-11-22',
    assignedTo: 'Sarah Johnson',
    taskType: 'Follow-up',
    status: 'Today',
    tags: ['Commercial', 'Lighting'],
    entities: {
      jobs: ['Downtown Plaza Renovation'],
      contacts: ['Michael Rodriguez'],
      companies: ['Turner Construction']
    },
    priority: 'Urgent',
    completed: false,
    comments: 3,
  },
  {
    id: 'T-002',
    title: 'Site visit - Riverside Medical Center',
    description: 'Walk through with PM and EC to review panel locations',
    dueDate: '2025-11-20',
    assignedTo: 'Sarah Johnson',
    taskType: 'Site Visit',
    status: 'Overdue',
    tags: ['Healthcare', 'Critical'],
    entities: {
      jobs: ['Riverside Medical Center'],
      companies: ['McCarthy Building', 'Johnson Controls']
    },
    priority: 'Urgent',
    completed: false,
    comments: 1,
  },
  {
    id: 'T-003',
    title: 'Send quote for TechCorp HQ HVAC controls',
    description: 'Prepare and send quote for HVAC control system',
    dueDate: '2025-11-25',
    assignedTo: 'Marcus Chen',
    taskType: 'General',
    status: 'Upcoming',
    tags: ['HVAC', 'Quote'],
    entities: {
      jobs: ['TechCorp HQ Expansion'],
      contacts: ['David Chen']
    },
    priority: 'No priority',
    completed: false,
    comments: 0,
  },
  {
    id: 'T-004',
    title: 'Call - Miller Electric purchasing',
    description: 'Discuss Q1 pricing and new product availability',
    dueDate: '2025-11-22',
    assignedTo: 'Marcus Chen',
    taskType: 'Call',
    status: 'Today',
    tags: ['EC', 'Pricing'],
    entities: {
      contacts: ['Jennifer Walsh'],
      companies: ['Miller Electric']
    },
    priority: 'No priority',
    completed: false,
    comments: 2,
  },
  {
    id: 'T-005',
    title: 'Waiting on factory - University Lab specs',
    description: 'Need factory response on custom panel requirements',
    dueDate: '2025-11-28',
    assignedTo: 'David Torres',
    taskType: 'Waiting',
    status: 'Waiting',
    tags: ['Education', 'Specialty'],
    entities: {
      jobs: ['University Lab Building']
    },
    priority: 'No priority',
    completed: false,
    comments: 0,
  },
  {
    id: 'T-006',
    title: 'Lunch and learn - Skanska office',
    description: 'Present new LED product line to Skanska team',
    dueDate: '2025-11-27',
    assignedTo: 'Sarah Johnson',
    taskType: 'Lunch-and-Learn',
    status: 'Upcoming',
    tags: ['Education', 'GC'],
    entities: {
      companies: ['Skanska USA']
    },
    priority: 'No priority',
    completed: false,
    comments: 1,
  },
  {
    id: 'T-007',
    title: 'Trade show prep - LightFair 2025',
    description: 'Coordinate booth setup and meeting schedule',
    dueDate: '2025-12-01',
    assignedTo: 'Marcus Chen',
    taskType: 'Trade Show',
    status: 'Upcoming',
    tags: ['Events', 'Networking'],
    priority: 'Urgent',
    completed: false,
    comments: 5,
  },
  {
    id: 'T-008',
    title: 'Meeting - McCarthy Building quarterly review',
    description: 'Review Q4 activity and Q1 opportunities',
    dueDate: '2025-11-22',
    assignedTo: 'David Torres',
    taskType: 'Meeting',
    status: 'Today',
    tags: ['GC', 'Healthcare'],
    entities: {
      companies: ['McCarthy Building'],
      contacts: ['Robert Jackson']
    },
    priority: 'Urgent',
    completed: false,
    comments: 0,
  },
  {
    id: 'T-009',
    title: 'Submit bid - Harbor View Apartments electrical',
    description: 'Final bid review and submission for electrical package',
    dueDate: '2025-11-19',
    assignedTo: 'Marcus Chen',
    taskType: 'General',
    status: 'Overdue',
    tags: ['Residential', 'Bidding'],
    entities: {
      jobs: ['Harbor View Apartments'],
      companies: ['Bay Area Electric']
    },
    priority: 'Urgent',
    completed: false,
    comments: 4,
  },
  {
    id: 'T-010',
    title: 'Update CRM notes - Prime Electric',
    description: 'Log recent conversation about upcoming projects',
    dueDate: '2025-11-23',
    assignedTo: 'David Torres',
    taskType: 'Note/Action',
    status: 'Upcoming',
    tags: ['EC', 'Follow-up'],
    entities: {
      companies: ['Prime Electric'],
      contacts: ['Rachel Kim']
    },
    priority: 'No priority',
    completed: false,
    comments: 0,
  },
];

/**
 * Mock Data for Report Scheduler
 */

import type { Report } from './types';

// Initial mock reports
export const mockReports: Report[] = [
  {
    id: 'R-001',
    name: 'Daily Tasks Due Today',
    types: ['Tasks'],
    dateFilter: 'Due Today',
    assignedTo: 'Me',
    frequency: 'Daily',
    recipients: ['sarah.johnson@company.com'],
    enabled: true,
    lastRun: '2024-11-22',
    nextRun: '2024-11-23',
  },
  {
    id: 'R-002',
    name: 'Weekly Team Activity',
    types: ['Notes', 'Tasks'],
    dateFilter: 'Created Last Week',
    assignedTo: 'My Team',
    additionalFilters: {
      companies: ['TechCorp', 'BuildCo'],
    },
    frequency: 'Weekly',
    recipients: ['sarah.johnson@company.com', 'marcus.chen@company.com'],
    enabled: true,
    lastRun: '2024-11-18',
    nextRun: '2024-11-25',
  },
  {
    id: 'R-003',
    name: 'Weekly Pre-Opportunities Review',
    types: ['Pre-Opportunities', 'Jobs'],
    dateFilter: 'Created Last Week',
    assignedTo: 'All Reps',
    additionalFilters: {
      companies: ['All'],
      contacts: ['John Smith', 'Jane Doe'],
    },
    frequency: 'Weekly',
    recipients: ['leadership@company.com'],
    enabled: false,
    nextRun: '2024-11-25',
  },
];

// Mock preview data for Notes
export const mockNotesData = [
  {
    id: 'N-001',
    author: 'Sarah Johnson',
    initials: 'SJ',
    color: 'bg-pink-500',
    title: 'Downtown Plaza - Lighting Meeting Notes',
    date: '11/21/2024',
    linkedTo: { type: 'Job', name: 'Downtown Plaza Renovation' },
    content:
      'Met with Turner Construction PM and Miller Electric to discuss lighting control requirements. Key takeaways: Need dimming on all zones, prefer wireless controls, budget is flexible for quality system. Action: Send quote for Lutron system by Friday.',
    tags: ['Meeting', 'Lighting', 'Controls'],
    mentions: ['@Turner Construction', '@Miller Electric'],
  },
  {
    id: 'N-002',
    author: 'Marcus Chen',
    initials: 'MC',
    color: 'bg-purple-500',
    title: 'BuildCo Project Timeline Discussion',
    date: '11/20/2024',
    linkedTo: { type: 'Pre-Opportunity', name: 'BuildCo Warehouse Expansion' },
    content:
      "Discussed project timeline with BuildCo team. They're targeting Q1 2025 start. Need to have preliminary proposal ready by end of month.",
    tags: [],
    mentions: [],
  },
];

// Mock preview data for Tasks
export const mockTasksData = [
  {
    id: 'T-001',
    title: 'Follow up with client on proposal',
    status: 'In Progress',
    priority: 'High',
    description:
      'Need to call TechCorp and discuss the latest proposal revisions. Make sure to address their concerns about the timeline and pricing structure. Prepare answers for their technical questions about the system integration.',
    assignedTo: 'Sarah Johnson',
    dueDate: 'Today',
    relatedTo: 'TechCorp - Job',
  },
  {
    id: 'T-002',
    title: 'Review and finalize proposal document',
    status: 'Pending',
    priority: 'Urgent',
    description:
      'Final review of the BuildCo warehouse expansion proposal. Check all pricing, verify technical specifications, and ensure all client requirements are addressed. Get sign-off from engineering team before sending.',
    assignedTo: 'Marcus Chen',
    dueDate: 'Today',
    relatedTo: '',
  },
];

// Mock preview data for Jobs
export const mockJobsData = [
  {
    id: 'J-001',
    name: 'Office Building Renovation',
    status: 'Active',
    value: '$125,000',
    gc: 'TechCorp',
    startDate: 'Last Week',
    territory: 'Downtown',
  },
];

// Mock preview data for Pre-Opportunities
export const mockPreOpportunitiesData = [
  {
    id: 'PO-001',
    name: 'New Construction Project',
    status: 'Proposal',
    estimatedValue: '$250,000',
    soldTo: 'BuildCo',
    created: 'Last Week',
    manufacturer: 'Acme Electric',
  },
];

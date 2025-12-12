'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// Meeting type (same as FlowmailContent)
type MeetingAttendee = {
  name: string;
  email: string;
  role?: string;
  company?: string;
  avatar?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'none';
};

// Meeting transcript from recording
type MeetingTranscript = {
  id: string;
  meetingId: string;
  duration: number; // in minutes
  speakers: { name: string; speakTime: number }[];
  content: TranscriptSegment[];
  recordingUrl?: string;
  generatedAt: string;
};

type TranscriptSegment = {
  timestamp: string;
  speaker: string;
  text: string;
};

// AI-generated meeting note/synopsis
type MeetingNote = {
  id: string;
  meetingId: string;
  title: string;
  synopsis: string;
  keyPoints: string[];
  actionItems: { item: string; assignee?: string; dueDate?: string }[];
  decisions: string[];
  nextSteps?: string[];
  sentiment?: 'positive' | 'neutral' | 'mixed' | 'challenging';
  generatedAt: string;
  generatedBy: 'AI';
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
  reminder: number;
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
  associatedTaskId?: string;
  followUp?: { date: string; note?: string };
  filed?: { category: string; subcategories?: string[] };
  // Post-meeting artifacts (attached after meeting ends)
  transcript?: MeetingTranscript;
  aiNote?: MeetingNote;
  isCompleted?: boolean;
};

// Task type for meeting-associated tasks
type MeetingTask = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedTo: string;
  taskType: 'Virtual Meeting' | 'In-Person Meeting';
  status: 'Today' | 'Overdue' | 'Upcoming' | 'Waiting' | 'Completed';
  tags: string[];
  entities?: {
    jobs?: string[];
    contacts?: string[];
    companies?: string[];
  };
  priority: 'No priority' | 'Urgent';
  completed: boolean;
  meetingId: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  canViewCalendar: boolean;
};

// Mock team members
const mockTeamMembers: TeamMember[] = [
  { id: 'me', name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager', department: 'Sales', canViewCalendar: true },
  { id: 'tm1', name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', department: 'Sales', canViewCalendar: true },
  { id: 'tm2', name: 'Mike Chen', email: 'mike.c@flowconnect.com', role: 'Project Manager', department: 'Operations', canViewCalendar: true },
  { id: 'tm3', name: 'Emily Rodriguez', email: 'emily.r@flowconnect.com', role: 'Estimator', department: 'Estimating', canViewCalendar: true },
  { id: 'tm4', name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director', department: 'Sales', canViewCalendar: false },
  { id: 'tm5', name: 'Lisa Thompson', email: 'lisa.t@flowconnect.com', role: 'Operations Lead', department: 'Operations', canViewCalendar: true },
];

// Mock meetings data for November and December 2025
const mockMeetings: Meeting[] = [
  // November 2025 meetings
  {
    id: 'm1',
    title: 'Monthly Pipeline Review',
    description: 'Review sales pipeline and forecast for Q4 closing.',
    date: '2025-11-03',
    startTime: '09:00',
    endTime: '10:30',
    isAllDay: false,
    location: 'Conference Room A',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/123',
    requiredAttendees: [
      { name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', responseStatus: 'accepted' },
      { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    category: 'Internal',
    priority: 'high',
    tags: ['Pipeline', 'Sales'],
    isInPerson: false,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted'
  },
  {
    id: 'm2',
    title: 'Client Call - Acme Construction',
    description: 'Follow-up call to discuss project requirements and timeline.',
    date: '2025-11-05',
    startTime: '14:00',
    endTime: '15:00',
    isAllDay: false,
    location: '',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/456',
    requiredAttendees: [
      { name: 'Tom Wilson', email: 'tom.w@acme.com', role: 'Project Manager', company: 'Acme Construction', responseStatus: 'accepted' }
    ],
    optionalAttendees: [
      { name: 'Mike Chen', email: 'mike.c@flowconnect.com', role: 'Project Manager', responseStatus: 'tentative' }
    ],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    category: 'External',
    priority: 'normal',
    tags: ['Client', 'Follow-up'],
    isInPerson: false,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted',
    associatedCompanies: ['Acme Construction']
  },
  {
    id: 'm3',
    title: 'Weekly Team Standup',
    description: 'Weekly sync to review progress and blockers.',
    date: '2025-11-10',
    startTime: '09:00',
    endTime: '09:30',
    isAllDay: false,
    location: '',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/789',
    requiredAttendees: [
      { name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', responseStatus: 'accepted' },
      { name: 'Emily Rodriguez', email: 'emily.r@flowconnect.com', role: 'Estimator', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 5,
    isRecurring: true,
    recurrencePattern: 'Weekly on Monday',
    category: 'Internal',
    priority: 'normal',
    tags: ['Weekly', 'Team'],
    isInPerson: false,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted'
  },
  {
    id: 'm4',
    title: 'Site Visit - Downtown Plaza',
    description: 'On-site walkthrough with the client to review electrical requirements.',
    date: '2025-11-12',
    startTime: '10:00',
    endTime: '12:00',
    isAllDay: false,
    location: '123 Main St, Downtown',
    isOnline: false,
    requiredAttendees: [
      { name: 'John Smith', email: 'john.smith@builderco.com', role: 'Facilities Manager', company: 'BuilderCo', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'out-of-office',
    reminder: 60,
    isRecurring: false,
    category: 'Projects',
    priority: 'high',
    tags: ['Site Visit', 'Electrical'],
    isInPerson: true,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted',
    associatedJobs: ['JOB-2024-001']
  },
  {
    id: 'm5',
    title: 'Bid Submission Deadline - City Hall',
    description: 'Final review before submitting bid for City Hall renovation project.',
    date: '2025-11-14',
    startTime: '08:00',
    endTime: '09:00',
    isAllDay: false,
    location: 'Conference Room B',
    isOnline: false,
    requiredAttendees: [
      { name: 'Emily Rodriguez', email: 'emily.r@flowconnect.com', role: 'Estimator', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 30,
    isRecurring: false,
    category: 'Documentation',
    priority: 'high',
    tags: ['Bid', 'Deadline'],
    isInPerson: true,
    organizer: { name: 'Emily Rodriguez', email: 'emily.r@flowconnect.com', role: 'Estimator' },
    responseStatus: 'accepted',
    associatedQuotes: ['Q-2024-0892']
  },
  {
    id: 'm6',
    title: 'Vendor Meeting - Lighting Supplier',
    description: 'Meet with new LED lighting supplier to discuss pricing and availability.',
    date: '2025-11-18',
    startTime: '11:00',
    endTime: '12:00',
    isAllDay: false,
    location: '',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/111',
    requiredAttendees: [
      { name: 'James Wilson', email: 'james@luxlighting.com', role: 'Sales Rep', company: 'Lux Lighting', responseStatus: 'accepted' }
    ],
    optionalAttendees: [
      { name: 'Lisa Thompson', email: 'lisa.t@flowconnect.com', role: 'Operations Lead', responseStatus: 'none' }
    ],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    category: 'External',
    priority: 'normal',
    tags: ['Vendor', 'Procurement'],
    isInPerson: false,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted'
  },
  {
    id: 'm7',
    title: 'Project Kickoff - Riverside Medical',
    description: 'Initial kickoff meeting for the Riverside Medical Center electrical installation project.',
    date: '2025-11-20',
    startTime: '13:00',
    endTime: '14:30',
    isAllDay: false,
    location: 'Riverside Medical Center',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/222',
    requiredAttendees: [
      { name: 'Dr. Sarah Chen', email: 's.chen@riverside.com', role: 'Facilities Director', company: 'Riverside Medical', responseStatus: 'accepted' },
      { name: 'Mike Chen', email: 'mike.c@flowconnect.com', role: 'Project Manager', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 30,
    isRecurring: false,
    category: 'Projects',
    priority: 'high',
    tags: ['Kickoff', 'Medical'],
    isInPerson: true,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted',
    associatedJobs: ['JOB-2024-002'],
    associatedCompanies: ['Riverside Medical Center']
  },
  {
    id: 'm8',
    title: 'Training - New CRM Features',
    description: 'Training session on new CRM features and workflows.',
    date: '2025-11-25',
    startTime: '15:00',
    endTime: '16:30',
    isAllDay: false,
    location: 'Training Room 1',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/333',
    requiredAttendees: [
      { name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', responseStatus: 'accepted' },
      { name: 'Emily Rodriguez', email: 'emily.r@flowconnect.com', role: 'Estimator', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 60,
    isRecurring: false,
    category: 'Training',
    priority: 'normal',
    tags: ['Training', 'CRM'],
    isInPerson: false,
    organizer: { name: 'IT Department', email: 'it@flowconnect.com', role: 'IT Support' },
    responseStatus: 'accepted'
  },
  // December 2025 meetings
  {
    id: 'm9',
    title: 'Q4 Forecast Review',
    description: 'Final Q4 forecast review before year-end.',
    date: '2025-12-01',
    startTime: '10:00',
    endTime: '11:30',
    isAllDay: false,
    location: 'Executive Conference Room',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/444',
    requiredAttendees: [
      { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director', responseStatus: 'accepted' },
      { name: 'Lisa Thompson', email: 'lisa.t@flowconnect.com', role: 'Operations Lead', responseStatus: 'accepted' }
    ],
    optionalAttendees: [
      { name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', responseStatus: 'tentative' }
    ],
    showAs: 'busy',
    reminder: 30,
    isRecurring: false,
    category: 'Internal',
    priority: 'high',
    tags: ['Forecast', 'Q4'],
    isInPerson: true,
    organizer: { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director' },
    responseStatus: 'accepted'
  },
  {
    id: 'm10',
    title: 'Client Meeting - Harbor Construction',
    description: 'Year-end review and planning for next year projects.',
    date: '2025-12-03',
    startTime: '14:00',
    endTime: '15:30',
    isAllDay: false,
    location: 'Harbor Construction HQ',
    isOnline: false,
    requiredAttendees: [
      { name: 'Robert Martinez', email: 'r.martinez@harborconstruction.com', role: 'VP of Operations', company: 'Harbor Construction', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 60,
    isRecurring: false,
    category: 'External',
    priority: 'high',
    tags: ['Client', 'Planning'],
    isInPerson: true,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted',
    associatedCompanies: ['Harbor Construction']
  },
  {
    id: 'm11',
    title: 'Weekly Team Standup',
    description: 'Weekly sync to review progress and blockers.',
    date: '2025-12-08',
    startTime: '09:00',
    endTime: '09:30',
    isAllDay: false,
    location: '',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/555',
    requiredAttendees: [
      { name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 5,
    isRecurring: true,
    recurrencePattern: 'Weekly on Monday',
    category: 'Internal',
    priority: 'normal',
    tags: ['Weekly', 'Team'],
    isInPerson: false,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted'
  },
  {
    id: 'm12',
    title: 'Budget Planning 2026',
    description: 'Annual budget planning session for next fiscal year.',
    date: '2025-12-09',
    startTime: '13:00',
    endTime: '16:00',
    isAllDay: false,
    location: 'Conference Room A',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/666',
    requiredAttendees: [
      { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director', responseStatus: 'accepted' },
      { name: 'Lisa Thompson', email: 'lisa.t@flowconnect.com', role: 'Operations Lead', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 60,
    isRecurring: false,
    category: 'Internal',
    priority: 'high',
    tags: ['Budget', 'Planning'],
    isInPerson: true,
    organizer: { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director' },
    responseStatus: 'accepted'
  },
  {
    id: 'm13',
    title: 'Product Demo - Smart Controls',
    description: 'Demo of new smart lighting control systems for potential project.',
    date: '2025-12-10',
    startTime: '10:00',
    endTime: '11:00',
    isAllDay: false,
    location: 'Demo Room',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/777',
    requiredAttendees: [
      { name: 'Amanda Lee', email: 'a.lee@greentech.com', role: 'Sustainability Manager', company: 'GreenTech Solutions', responseStatus: 'accepted' }
    ],
    optionalAttendees: [
      { name: 'Emily Rodriguez', email: 'emily.r@flowconnect.com', role: 'Estimator', responseStatus: 'none' }
    ],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    category: 'External',
    priority: 'normal',
    tags: ['Demo', 'Smart Controls'],
    isInPerson: true,
    organizer: { name: 'You', email: 'you@flowconnect.com', role: 'Sales Manager' },
    responseStatus: 'accepted'
  },
  {
    id: 'm14',
    title: 'Holiday Party Planning',
    description: 'Committee meeting to finalize holiday party details.',
    date: '2025-12-11',
    startTime: '12:00',
    endTime: '13:00',
    isAllDay: false,
    location: 'Break Room',
    isOnline: false,
    requiredAttendees: [
      { name: 'Sarah Johnson', email: 'sarah.j@flowconnect.com', role: 'Account Executive', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'tentative',
    reminder: 30,
    isRecurring: false,
    category: 'Internal',
    priority: 'low',
    tags: ['Social', 'Holiday'],
    isInPerson: true,
    organizer: { name: 'HR Department', email: 'hr@flowconnect.com', role: 'HR Coordinator' },
    responseStatus: 'tentative'
  },
  {
    id: 'm15',
    title: 'Year-End Review Meeting',
    description: 'Annual performance review and goal setting for next year.',
    date: '2025-12-15',
    startTime: '14:00',
    endTime: '15:00',
    isAllDay: false,
    location: 'Conference Room B',
    isOnline: false,
    requiredAttendees: [
      { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 60,
    isRecurring: false,
    category: 'Internal',
    priority: 'high',
    tags: ['Review', 'Performance'],
    isInPerson: true,
    organizer: { name: 'David Kim', email: 'david.k@flowconnect.com', role: 'Sales Director' },
    responseStatus: 'accepted'
  },
  {
    id: 'm16',
    title: 'Company Holiday Party',
    description: 'Annual company holiday celebration.',
    date: '2025-12-18',
    startTime: '17:00',
    endTime: '20:00',
    isAllDay: false,
    location: 'Grand Ballroom - Hilton Downtown',
    isOnline: false,
    requiredAttendees: [
      { name: 'All Staff', email: 'all@flowconnect.com', role: 'Team', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'out-of-office',
    reminder: 1440,
    isRecurring: false,
    category: 'Internal',
    priority: 'normal',
    tags: ['Holiday', 'Party'],
    isInPerson: true,
    organizer: { name: 'HR Department', email: 'hr@flowconnect.com', role: 'HR Coordinator' },
    responseStatus: 'accepted'
  },
  {
    id: 'm17',
    title: 'Project Status Update - Downtown Plaza',
    description: 'Weekly status update on Downtown Plaza project.',
    date: '2025-12-22',
    startTime: '11:00',
    endTime: '11:30',
    isAllDay: false,
    location: '',
    isOnline: true,
    teamsLink: 'https://teams.microsoft.com/l/meetup-join/888',
    requiredAttendees: [
      { name: 'Mike Chen', email: 'mike.c@flowconnect.com', role: 'Project Manager', responseStatus: 'accepted' }
    ],
    optionalAttendees: [],
    showAs: 'busy',
    reminder: 15,
    isRecurring: false,
    category: 'Projects',
    priority: 'normal',
    tags: ['Status', 'Project'],
    isInPerson: false,
    organizer: { name: 'Mike Chen', email: 'mike.c@flowconnect.com', role: 'Project Manager' },
    responseStatus: 'accepted',
    associatedJobs: ['JOB-2024-001'],
    associatedTaskId: 'MT-017'
  }
];

// Helper function to determine task status based on date
const getTaskStatus = (date: string): 'Today' | 'Overdue' | 'Upcoming' | 'Completed' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(date + 'T00:00:00');

  if (taskDate < today) return 'Completed'; // Past meetings are completed
  if (taskDate.getTime() === today.getTime()) return 'Today';
  return 'Upcoming';
};

// Mock meeting tasks - each meeting has an associated task for analytics tracking
const mockMeetingTasks: MeetingTask[] = mockMeetings.map((meeting, index) => ({
  id: `MT-${String(index + 1).padStart(3, '0')}`,
  title: meeting.title,
  description: `${meeting.isOnline ? 'Virtual' : 'In-person'} meeting: ${meeting.description}`,
  dueDate: meeting.date,
  assignedTo: meeting.organizer.name === 'You' ? 'Sarah Johnson' : meeting.organizer.name,
  taskType: meeting.isOnline ? 'Virtual Meeting' : 'In-Person Meeting',
  status: getTaskStatus(meeting.date),
  tags: meeting.tags || [],
  entities: {
    jobs: meeting.associatedJobs,
    companies: meeting.associatedCompanies,
  },
  priority: meeting.priority === 'high' ? 'Urgent' : 'No priority',
  completed: getTaskStatus(meeting.date) === 'Completed',
  meetingId: meeting.id,
}));

// Update meetings with their associated task IDs
mockMeetings.forEach((meeting, index) => {
  meeting.associatedTaskId = `MT-${String(index + 1).padStart(3, '0')}`;
});

// Generate transcripts and AI notes for completed meetings
const generateMeetingTranscript = (meeting: Meeting): MeetingTranscript => {
  const attendees = [meeting.organizer, ...meeting.requiredAttendees];
  const duration = (() => {
    const [startH, startM] = meeting.startTime.split(':').map(Number);
    const [endH, endM] = meeting.endTime.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  })();

  // Generate realistic transcript segments
  const segments: TranscriptSegment[] = [];
  const speakerNames = attendees.map(a => a.name);

  // Opening
  segments.push({
    timestamp: '00:00',
    speaker: meeting.organizer.name,
    text: `Good morning everyone, thanks for joining. Today we're going to discuss ${meeting.title.toLowerCase()}.`
  });

  // Middle discussion
  if (speakerNames.length > 1) {
    segments.push({
      timestamp: '00:45',
      speaker: speakerNames[1] || speakerNames[0],
      text: `Thanks for setting this up. I've reviewed the materials and have some thoughts on how we can move forward.`
    });
  }

  segments.push({
    timestamp: '05:30',
    speaker: meeting.organizer.name,
    text: `Let's go through the key items. ${meeting.description}`
  });

  if (speakerNames.length > 1) {
    segments.push({
      timestamp: '15:00',
      speaker: speakerNames[1] || speakerNames[0],
      text: `I think we should focus on the timeline first. We need to make sure we're aligned on deliverables.`
    });
  }

  segments.push({
    timestamp: `${Math.floor(duration * 0.7)}:00`,
    speaker: meeting.organizer.name,
    text: `Great discussion everyone. Let me summarize the action items before we wrap up.`
  });

  return {
    id: `TR-${meeting.id}`,
    meetingId: meeting.id,
    duration,
    speakers: attendees.map(a => ({
      name: a.name,
      speakTime: Math.floor(duration / attendees.length) + Math.floor(Math.random() * 5)
    })),
    content: segments,
    recordingUrl: meeting.isOnline ? `https://recordings.flowconnect.com/${meeting.id}` : undefined,
    generatedAt: `${meeting.date}T${meeting.endTime}:00Z`
  };
};

const generateMeetingNote = (meeting: Meeting): MeetingNote => {
  // Generate contextual AI synopsis based on meeting type
  const synopsisTemplates: Record<string, string> = {
    'Internal': `Internal team meeting focused on ${meeting.title.toLowerCase()}. The discussion covered current progress, identified blockers, and established next steps for the team.`,
    'External': `Client meeting with external stakeholders regarding ${meeting.title.toLowerCase()}. Key client requirements were discussed and expectations were aligned.`,
    'Projects': `Project-focused meeting on ${meeting.title.toLowerCase()}. Status updates were shared, timeline adjustments were discussed, and resource allocation was reviewed.`,
    'Documentation': `Documentation review meeting for ${meeting.title.toLowerCase()}. Deliverables were reviewed, feedback was collected, and revisions were planned.`,
    'Training': `Training session covering ${meeting.title.toLowerCase()}. Key concepts were presented, hands-on exercises were completed, and Q&A was addressed.`,
  };

  const actionItemTemplates = [
    { item: 'Follow up on discussed items', assignee: meeting.organizer.name, dueDate: getNextBusinessDay(meeting.date) },
    { item: 'Share meeting notes with stakeholders', assignee: meeting.organizer.name, dueDate: meeting.date },
    { item: 'Schedule follow-up meeting if needed', assignee: meeting.organizer.name },
  ];

  const keyPointsTemplates: Record<string, string[]> = {
    'Internal': [
      'Team alignment achieved on key priorities',
      'Resource constraints identified and discussed',
      'Timeline reviewed and adjustments proposed'
    ],
    'External': [
      'Client requirements clarified and documented',
      'Pricing and timeline expectations aligned',
      'Next steps agreed upon by all parties'
    ],
    'Projects': [
      'Project milestones reviewed',
      'Risk mitigation strategies discussed',
      'Budget status confirmed within parameters'
    ],
    'Documentation': [
      'Document structure approved',
      'Revision timeline established',
      'Review comments addressed'
    ],
    'Training': [
      'Key concepts successfully covered',
      'Practical exercises completed',
      'Knowledge transfer verified'
    ],
  };

  const decisionsTemplates: Record<string, string[]> = {
    'Internal': ['Proceed with current approach', 'Schedule weekly check-ins'],
    'External': ['Move forward with proposed solution', 'Finalize contract terms by end of week'],
    'Projects': ['Approved phase 2 kickoff', 'Reallocate resources as discussed'],
    'Documentation': ['Approved final document structure', 'Set review deadline'],
    'Training': ['Training objectives met', 'Schedule advanced session for next month'],
  };

  const category = meeting.category || 'Internal';

  return {
    id: `NOTE-${meeting.id}`,
    meetingId: meeting.id,
    title: `AI Synopsis: ${meeting.title}`,
    synopsis: synopsisTemplates[category] || synopsisTemplates['Internal'],
    keyPoints: keyPointsTemplates[category] || keyPointsTemplates['Internal'],
    actionItems: actionItemTemplates.slice(0, 2 + Math.floor(Math.random() * 2)),
    decisions: decisionsTemplates[category] || decisionsTemplates['Internal'],
    nextSteps: [
      'Review action items and confirm ownership',
      'Update project tracking system',
      'Communicate outcomes to relevant stakeholders'
    ],
    sentiment: meeting.priority === 'high' ? 'mixed' : 'positive',
    generatedAt: `${meeting.date}T${meeting.endTime}:30Z`,
    generatedBy: 'AI'
  };
};

// Helper to get next business day
const getNextBusinessDay = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + 1);
  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
};

// Attach transcripts and AI notes to completed (past) meetings
const today = new Date();
today.setHours(0, 0, 0, 0);

mockMeetings.forEach(meeting => {
  const meetingDate = new Date(meeting.date + 'T00:00:00');
  if (meetingDate < today) {
    // Meeting has ended - attach transcript and AI note
    meeting.isCompleted = true;
    meeting.transcript = generateMeetingTranscript(meeting);
    meeting.aiNote = generateMeetingNote(meeting);
  }
});

// Helper to get category color
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Projects': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Internal': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'External': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Documentation': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Training': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };
  return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
};

// Helper to get priority color
const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    'high': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'normal': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    'low': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  };
  return colors[priority] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
};

// Helper to get show-as color
const getShowAsColor = (showAs: Meeting['showAs']) => {
  const colors: Record<string, string> = {
    'busy': 'bg-blue-500',
    'free': 'bg-green-500',
    'tentative': 'bg-yellow-500',
    'out-of-office': 'bg-purple-500',
  };
  return colors[showAs] || 'bg-gray-500';
};

// Helper to format time in 12-hour format
const formatTime12Hour = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''} ${period}`;
};

export default function FlowCalendarContent() {
  const router = useRouter();
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>('me');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('09:00');

  // Get current week dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Get month dates (6 weeks grid)
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const dates = [];
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Format date for comparison
  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get meetings for a specific date
  const getMeetingsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return mockMeetings.filter(m => m.date === dateKey);
  };

  // Navigate calendar
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (calendarView === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Format header based on view
  const getHeaderText = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (calendarView === 'day') {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } else if (calendarView === 'week') {
      const weekDates = getWeekDates(selectedDate);
      const startMonth = weekDates[0].toLocaleDateString('en-US', { month: 'short' });
      const endMonth = weekDates[6].toLocaleDateString('en-US', { month: 'short' });
      const year = weekDates[0].getFullYear();
      if (startMonth === endMonth) {
        return `${startMonth} ${weekDates[0].getDate()} - ${weekDates[6].getDate()}, ${year}`;
      }
      return `${startMonth} ${weekDates[0].getDate()} - ${endMonth} ${weekDates[6].getDate()}, ${year}`;
    }
    return selectedDate.toLocaleDateString('en-US', options);
  };

  // Time slots for day/week view (6 AM to 8 PM in 12-hour format)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
      slots.push({
        hour24: `${hour.toString().padStart(2, '0')}:00`,
        display: formatTime12Hour(`${hour.toString().padStart(2, '0')}:00`)
      });
    }
    return slots;
  }, []);

  // Handle calendar cell click to create meeting
  const handleCalendarClick = (date: Date, hour?: number) => {
    const dateStr = formatDateKey(date);
    setNewMeetingDate(dateStr);
    if (hour !== undefined) {
      setNewMeetingTime(`${hour.toString().padStart(2, '0')}:00`);
    }
    setShowCreateMeetingModal(true);
  };

  // Handle creating a new meeting
  const handleCreateMeeting = () => {
    // Navigate to FlowMail with new meeting params
    sessionStorage.setItem('newMeetingDate', newMeetingDate);
    sessionStorage.setItem('newMeetingTime', newMeetingTime);
    sessionStorage.setItem('calendarReturnPath', '/flow-calendar');
    router.push('/flowmail?newMeeting=true');
  };

  // Get meeting position and height for time grid (adjusted for 6 AM start)
  const getMeetingStyle = (meeting: Meeting) => {
    const startHour = parseInt(meeting.startTime.split(':')[0]);
    const startMin = parseInt(meeting.startTime.split(':')[1]);
    const endHour = parseInt(meeting.endTime.split(':')[0]);
    const endMin = parseInt(meeting.endTime.split(':')[1]);

    const startOffset = (startHour - 6) * 60 + startMin;
    const duration = (endHour - startHour) * 60 + (endMin - startMin);

    return {
      top: `${(startOffset / 60) * 60}px`,
      height: `${(duration / 60) * 60 - 4}px`,
    };
  };

  // Handle meeting click
  const handleMeetingClick = (meeting: Meeting) => {
    // Store meeting data in sessionStorage to pass to FlowMail
    sessionStorage.setItem('selectedMeeting', JSON.stringify(meeting));
    sessionStorage.setItem('calendarReturnPath', '/flow-calendar');
    router.push(`/flowmail?meeting=${meeting.id}`);
  };

  // Render meeting card
  const renderMeetingCard = (meeting: Meeting, compact: boolean = false) => {
    return (
      <div
        key={meeting.id}
        onClick={() => handleMeetingClick(meeting)}
        className={`rounded-md p-2 cursor-pointer transition-all hover:opacity-90 hover:shadow-md ${getShowAsColor(meeting.showAs)} text-white`}
        style={compact ? {} : getMeetingStyle(meeting)}
      >
        <div className="flex items-start gap-1">
          {meeting.isOnline ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z"/>
              <rect x="3" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          )}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>{meeting.title}</p>
            {!compact && (
              <p className="text-xs opacity-90 truncate">{meeting.startTime} - {meeting.endTime}</p>
            )}
          </div>
        </div>
        {!compact && meeting.category && (
          <div className="mt-1">
            <span className="text-xs bg-white/20 rounded px-1">{meeting.category}</span>
          </div>
        )}
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const meetings = getMeetingsForDate(selectedDate);

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {/* Time grid */}
          <div className="relative">
            {timeSlots.map((time, index) => (
              <div key={time.hour24} className="flex border-b border-[var(--border)]" style={{ height: '60px' }}>
                <div className="w-20 flex-shrink-0 pr-2 text-right text-xs text-[var(--muted-foreground)] pt-1">
                  {time.display}
                </div>
                <div
                  className="flex-1 relative cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                  onClick={() => handleCalendarClick(selectedDate, parseInt(time.hour24.split(':')[0]))}
                >
                  {index === 0 && (
                    <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none" style={{ height: `${timeSlots.length * 60}px` }}>
                      {meetings.map(meeting => (
                        <div
                          key={meeting.id}
                          className="absolute left-1 right-1 pointer-events-auto"
                          style={getMeetingStyle(meeting)}
                        >
                          {renderMeetingCard(meeting)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const weekDates = getWeekDates(selectedDate);
    const today = formatDateKey(new Date());

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="flex border-b border-[var(--border)] sticky top-0 bg-[var(--background)] z-10">
            <div className="w-20 flex-shrink-0" />
            {weekDates.map(date => {
              const isToday = formatDateKey(date) === today;
              return (
                <div
                  key={date.toISOString()}
                  className={`flex-1 text-center py-2 border-l border-[var(--border)] ${isToday ? 'bg-[var(--primary)]/10' : ''}`}
                >
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday ? 'text-[var(--primary)]' : ''}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative">
            {timeSlots.map((slot) => (
              <div key={slot.hour24} className="flex border-b border-[var(--border)]" style={{ height: '60px' }}>
                <div className="w-20 flex-shrink-0 pr-2 text-right text-xs text-[var(--muted-foreground)] pt-1">
                  {slot.display}
                </div>
                {weekDates.map(date => {
                  const isToday = formatDateKey(date) === today;
                  return (
                    <div
                      key={date.toISOString()}
                      className={`flex-1 border-l border-[var(--border)] relative cursor-pointer hover:bg-[var(--muted)]/30 transition-colors ${isToday ? 'bg-[var(--primary)]/5' : ''}`}
                      onClick={() => handleCalendarClick(date, parseInt(slot.hour24.split(':')[0]))}
                    />
                  );
                })}
              </div>
            ))}

            {/* Meetings overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="flex h-full">
                <div className="w-20 flex-shrink-0" />
                {weekDates.map(date => {
                  const meetings = getMeetingsForDate(date);
                  return (
                    <div key={date.toISOString()} className="flex-1 relative">
                      {meetings.map(meeting => (
                        <div
                          key={meeting.id}
                          className="absolute left-1 right-1 pointer-events-auto"
                          style={getMeetingStyle(meeting)}
                        >
                          {renderMeetingCard(meeting)}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const monthDates = getMonthDates(selectedDate);
    const today = formatDateKey(new Date());
    const currentMonth = selectedDate.getMonth();

    return (
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-7 gap-px bg-[var(--border)] rounded-lg overflow-hidden">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-[var(--muted)] p-2 text-center text-sm font-medium text-[var(--muted-foreground)]">
              {day}
            </div>
          ))}

          {/* Date cells */}
          {monthDates.map(date => {
            const isToday = formatDateKey(date) === today;
            const isCurrentMonth = date.getMonth() === currentMonth;
            const meetings = getMeetingsForDate(date);

            return (
              <div
                key={date.toISOString()}
                className={`bg-[var(--background)] min-h-[100px] p-1 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors ${!isCurrentMonth ? 'opacity-40' : ''}`}
                onClick={() => handleCalendarClick(date)}
              >
                <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--primary)] text-white' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {meetings.slice(0, 3).map(meeting => (
                    <div
                      key={meeting.id}
                      onClick={(e) => { e.stopPropagation(); handleMeetingClick(meeting); }}
                      className={`text-xs p-1 rounded cursor-pointer truncate ${getShowAsColor(meeting.showAs)} text-white hover:opacity-90`}
                    >
                      {meeting.title}
                    </div>
                  ))}
                  {meetings.length > 3 && (
                    <div className="text-xs text-[var(--muted-foreground)] px-1">
                      +{meetings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedMember = mockTeamMembers.find(m => m.id === selectedTeamMember);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Calendar</h1>

          {/* Team member selector */}
          <div className="relative">
            <button
              onClick={() => setShowTeamDropdown(!showTeamDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg text-sm transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-medium">
                {selectedMember?.name.charAt(0)}
              </div>
              <span>{selectedMember?.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {showTeamDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-auto">
                <div className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase">Team Members</div>
                {mockTeamMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => {
                      if (member.canViewCalendar) {
                        setSelectedTeamMember(member.id);
                        setShowTeamDropdown(false);
                      }
                    }}
                    disabled={!member.canViewCalendar}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--muted)] transition-colors ${!member.canViewCalendar ? 'opacity-50 cursor-not-allowed' : ''} ${selectedTeamMember === member.id ? 'bg-[var(--muted)]' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-medium">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{member.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)] truncate">{member.role}</div>
                    </div>
                    {!member.canViewCalendar && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2"/>
                          <circle cx="12" cy="16" r="1"/>
                          <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </span>
                    )}
                    {selectedTeamMember === member.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)]">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View toggle & navigation */}
        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-[var(--muted)] rounded-lg">
            {(['day', 'week', 'month'] as const).map(view => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  calendarView === view
                    ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-[var(--foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate('prev')}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              onClick={() => navigate('next')}
              className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            <span className="text-sm font-medium text-[var(--foreground)] min-w-[200px]">
              {getHeaderText()}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      {calendarView === 'day' && renderDayView()}
      {calendarView === 'week' && renderWeekView()}
      {calendarView === 'month' && renderMonthView()}

      {/* Legend */}
      <div className="px-6 py-3 border-t border-[var(--border)] flex items-center gap-6">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Meeting Status:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Busy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Tentative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-xs text-[var(--muted-foreground)]">Out of Office</span>
          </div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showCreateMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Create New Meeting</h2>
              <button
                onClick={() => setShowCreateMeetingModal(false)}
                className="p-1.5 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Date Display */}
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Date</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--muted)] rounded-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className="text-sm text-[var(--foreground)]">
                    {newMeetingDate ? new Date(newMeetingDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    }) : ''}
                  </span>
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">Start Time</label>
                <select
                  value={newMeetingTime}
                  onChange={(e) => setNewMeetingTime(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {formatTime12Hour(`${hour.toString().padStart(2, '0')}:00`)}
                    </option>
                  ))}
                  {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
                    <option key={`${hour}:30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                      {formatTime12Hour(`${hour.toString().padStart(2, '0')}:30`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-[var(--primary)]/10 rounded-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--primary)] mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p className="text-xs text-[var(--muted-foreground)]">
                  You&apos;ll be taken to FlowMail to add meeting details like title, attendees, and location.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <button
                onClick={() => setShowCreateMeetingModal(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMeeting}
                className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

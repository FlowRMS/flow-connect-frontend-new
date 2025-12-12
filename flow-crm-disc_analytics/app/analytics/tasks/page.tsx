'use client';

import AnalyticsDataTable from '@/components/analytics/AnalyticsDataTable';

// Sample tasks data with specified task types
const tasksData = [
  { id: 'T-001', title: 'Follow up with Turner Construction', taskType: 'Call', status: 'Completed', dueDate: '2024-11-20', assignedTo: 'Sarah Johnson', priority: 'No priority', entity: 'Turner Construction', entityType: 'Company' },
  { id: 'T-002', title: 'Project kickoff with TechCorp', taskType: 'Meeting', status: 'Upcoming', dueDate: '2024-11-28', assignedTo: 'Mike Thompson', priority: 'Urgent', entity: 'TechCorp HQ Expansion', entityType: 'Job' },
  { id: 'T-003', title: 'Send quote to Miller Electric', taskType: 'Email', status: 'Completed', dueDate: '2024-11-19', assignedTo: 'Lisa Kim', priority: 'No priority', entity: 'Miller Electric', entityType: 'Company' },
  { id: 'T-004', title: 'Inspect Green Energy site', taskType: 'Site Visit', status: 'Today', dueDate: '2024-11-24', assignedTo: 'John Davis', priority: 'Urgent', entity: 'Green Energy Campus', entityType: 'Job' },
  { id: 'T-005', title: 'New product training session', taskType: 'Webinar', status: 'Upcoming', dueDate: '2024-12-05', assignedTo: 'Emma Roberts', priority: 'No priority', entity: 'ERMCO', entityType: 'Manufacturer' },
  { id: 'T-006', title: 'NECA Conference booth setup', taskType: 'Trade Show', status: 'Upcoming', dueDate: '2024-12-10', assignedTo: 'Sarah Johnson', priority: 'Urgent', entity: 'NECA 2024', entityType: 'Event' },
  { id: 'T-007', title: 'Check on order status', taskType: 'Call', status: 'Overdue', dueDate: '2024-11-18', assignedTo: 'Mike Thompson', priority: 'Urgent', entity: 'Siemens', entityType: 'Manufacturer' },
  { id: 'T-008', title: 'Schedule site walkthrough', taskType: 'Meeting', status: 'Waiting', dueDate: '2024-11-30', assignedTo: 'Lisa Kim', priority: 'No priority', entity: 'Harbor View Apartments', entityType: 'Job' },
  { id: 'T-009', title: 'Send updated specs', taskType: 'Email', status: 'Completed', dueDate: '2024-11-21', assignedTo: 'John Davis', priority: 'No priority', entity: 'Johnson Controls', entityType: 'Company' },
  { id: 'T-010', title: 'Hospital equipment inspection', taskType: 'Site Visit', status: 'Upcoming', dueDate: '2024-11-29', assignedTo: 'Emma Roberts', priority: 'Urgent', entity: 'City Hospital Upgrade', entityType: 'Job' },
  { id: 'T-011', title: 'Solar products demo', taskType: 'Webinar', status: 'Completed', dueDate: '2024-11-15', assignedTo: 'Sarah Johnson', priority: 'No priority', entity: 'American Electric', entityType: 'Manufacturer' },
  { id: 'T-012', title: 'LightFair preparation', taskType: 'Trade Show', status: 'Upcoming', dueDate: '2025-01-15', assignedTo: 'Mike Thompson', priority: 'No priority', entity: 'LightFair 2025', entityType: 'Event' },
  { id: 'T-013', title: 'Discuss pricing with WESCO', taskType: 'Call', status: 'Today', dueDate: '2024-11-24', assignedTo: 'Lisa Kim', priority: 'No priority', entity: 'WESCO Distribution', entityType: 'Company' },
  { id: 'T-014', title: 'Contract review meeting', taskType: 'Meeting', status: 'Upcoming', dueDate: '2024-12-02', assignedTo: 'John Davis', priority: 'Urgent', entity: 'Data Center Build-Out', entityType: 'Job' },
  { id: 'T-015', title: 'Follow up proposal email', taskType: 'Email', status: 'Today', dueDate: '2024-11-24', assignedTo: 'Emma Roberts', priority: 'No priority', entity: 'Coastal Builders', entityType: 'Company' },
  { id: 'T-016', title: 'Warehouse site measurement', taskType: 'Site Visit', status: 'Overdue', dueDate: '2024-11-17', assignedTo: 'Sarah Johnson', priority: 'Urgent', entity: 'Warehouse Distribution', entityType: 'Job' },
  { id: 'T-017', title: 'LED technology webinar', taskType: 'Webinar', status: 'Upcoming', dueDate: '2024-12-08', assignedTo: 'Mike Thompson', priority: 'No priority', entity: 'Holophane', entityType: 'Manufacturer' },
  { id: 'T-018', title: 'Electrical Expo attendance', taskType: 'Trade Show', status: 'Completed', dueDate: '2024-11-10', assignedTo: 'Lisa Kim', priority: 'No priority', entity: 'Electrical Expo 2024', entityType: 'Event' },
  { id: 'T-019', title: 'Quick check-in call', taskType: 'Call', status: 'Completed', dueDate: '2024-11-22', assignedTo: 'John Davis', priority: 'No priority', entity: 'Power Partners', entityType: 'Manufacturer' },
  { id: 'T-020', title: 'Stadium progress meeting', taskType: 'Meeting', status: 'Today', dueDate: '2024-11-24', assignedTo: 'Emma Roberts', priority: 'Urgent', entity: 'Stadium Renovation', entityType: 'Job' },
];

const columns = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'taskType', label: 'Task Type', render: (value: unknown) => {
    const taskType = value as string;
    const colors: Record<string, string> = {
      'Call': 'bg-blue-100 text-blue-700',
      'Meeting': 'bg-purple-100 text-purple-700',
      'Email': 'bg-green-100 text-green-700',
      'Site Visit': 'bg-orange-100 text-orange-700',
      'Webinar': 'bg-teal-100 text-teal-700',
      'Trade Show': 'bg-pink-100 text-pink-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[taskType] || ''}`}>
        {taskType}
      </span>
    );
  }},
  { key: 'status', label: 'Status', render: (value: unknown) => {
    const status = value as string;
    const colors: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-700',
      'Today': 'bg-yellow-100 text-yellow-700',
      'Upcoming': 'bg-blue-100 text-blue-700',
      'Overdue': 'bg-red-100 text-red-700',
      'Waiting': 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || ''}`}>
        {status}
      </span>
    );
  }},
  { key: 'dueDate', label: 'Due Date' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'priority', label: 'Priority', render: (value: unknown) => {
    const priority = value as string;
    return priority === 'Urgent' ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Urgent</span>
    ) : (
      <span className="text-[var(--muted-foreground)]">-</span>
    );
  }},
  { key: 'entity', label: 'Related Entity' },
  { key: 'entityType', label: 'Entity Type' },
];

export default function TasksDataPage() {
  return (
    <AnalyticsDataTable
      title="Tasks Data"
      description="Complete listing of all tasks including Calls, Meetings, Emails, Site Visits, Webinars, and Trade Shows"
      columns={columns}
      data={tasksData}
      recordCount={12847}
      pageSize={20}
    />
  );
}

/**
 * Contact Constants and Configurations
 */

// Predefined contact roles
export const CONTACT_ROLES = ['GC', 'EC', 'ARCHITECT', 'ENGINEER', 'DISTRIBUTOR', 'OWNER'] as const;

export type ContactRole = typeof CONTACT_ROLES[number];

// Contact type options for filtering (includes 'All')
export const CONTACT_TYPES = ['All', ...CONTACT_ROLES] as const;

// Avatar colors for contact initials
export const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-pink-500'
] as const;

// Sort options for contacts
export const CONTACT_SORT_OPTIONS = [
  { columnName: 'firstName', label: 'First Name' },
  { columnName: 'lastName', label: 'Last Name' },
  { columnName: 'email', label: 'Email' },
  { columnName: 'role', label: 'Role' },
  { columnName: 'companyName', label: 'Company' },
  { columnName: 'createdAt', label: 'Created Date' },
];

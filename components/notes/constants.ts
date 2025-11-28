/**
 * Note Constants and Configurations
 */

// Avatar color palette
export const AVATAR_COLORS = [
  'bg-orange-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-blue-500',
  'bg-pink-500'
] as const;

// Available date ranges for filtering
export const DATE_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'current-year', label: 'Current Year' },
] as const;

// Summary type options
export const SUMMARY_TYPES = [
  {
    value: 'brief',
    label: 'Brief Overview',
    description: 'High-level summary with key points',
  },
  {
    value: 'detailed',
    label: 'Detailed Analysis',
    description: 'In-depth summary with insights and trends',
  },
  {
    value: 'action-items',
    label: 'Action Items',
    description: 'Focus on next steps and tasks',
  },
] as const;

// Available tags for filtering
export const AVAILABLE_TAGS = [
  'Meeting',
  'Opportunity',
  'Site Visit',
  'Strategy',
  'Pricing',
  'Follow-up'
] as const;

// Entity types
export const ENTITY_TYPES = [
  'Job',
  'Pre-Opportunity',
  'Contact',
  'Company'
] as const;

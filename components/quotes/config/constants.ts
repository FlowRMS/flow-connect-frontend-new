// Stage configuration
export const stages = [
  { name: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { name: 'Review', color: 'bg-blue-100 text-blue-800' },
  { name: 'Sent', color: 'bg-purple-100 text-purple-800' },
  { name: 'Negotiating', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Won', color: 'bg-green-100 text-green-800' },
  { name: 'Lost', color: 'bg-red-100 text-red-800' },
  { name: 'Dormant', color: 'bg-gray-100 text-gray-600' },
] as const;

export const stageNames = ['Draft', 'Review', 'Sent', 'Negotiating', 'Won', 'Lost', 'Dormant'] as const;

// Status colors
export const statusColors: Record<string, string> = {
  Open: 'bg-blue-100 text-blue-800',
  Closed: 'bg-gray-100 text-gray-800',
  Expired: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
};

// Quote type labels
export const quoteTypeLabels: Record<string, string> = {
  NORMAL: 'Normal',
  TAG: 'Tag',
  BLANKET: 'Blanket',
  STORM: 'Storm',
};

// Price level colors
export const priceLevelColors = [
  'text-blue-600',
  'text-purple-600',
  'text-orange-600',
  'text-pink-600',
  'text-teal-600',
];

// Default price levels
export const defaultPriceLevels = [
  { id: 1, percent: 10, description: 'Standard contractor' },
  { id: 2, percent: 15, description: 'Preferred contractor' },
  { id: 3, percent: 20, description: 'List price / MSRP' },
];

// Dropdown options for filters
export const distributorOptions = [
  'Ferguson Enterprises', 'Graybar Electric', 'HD Supply', 'Rexel', 'WESCO International',
  'Consolidated Electrical', 'Border States Electric', 'Sonepar', 'CED Greentech'
];

export const builderOptions = [
  'Skanska USA', 'Turner Construction', 'McCarthy Building', 'Hensel Phelps', 'DPR Construction',
  'Whiting-Turner', 'Clark Construction', 'Holder Construction', 'Brasfield & Gorrie'
];

export const jobOptions = [
  'University Lab Building', 'Downtown Medical Center', 'Tech Campus Phase 2', 'Airport Terminal B',
  'Convention Center Expansion', 'Corporate Headquarters', 'Research Facility', 'Hospital Wing Addition'
];

// Lost reason options
export const lostReasonOptions = [
  'Price too high',
  'Lost to competitor',
  'Project cancelled',
  'Customer went with different solution',
  'Budget constraints',
  'Timeline issues',
  'Other',
];

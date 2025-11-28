/**
 * Report Scheduler Types and Interfaces
 */

// Report type enum values
export type ReportType = 'Notes' | 'Jobs' | 'Pre-Opportunities' | 'Quotes' | 'Tasks';

// Date filter options
export type DateFilter = 
  | 'Yesterday' 
  | 'Last Week' 
  | 'Due Today' 
  | 'Due This Week' 
  | 'Created Yesterday' 
  | 'Created Last Week';

// Scope options
export type AssignedTo = 'Me' | 'My Team' | 'All Reps';

// Frequency options
export type ReportFrequency = 'Daily' | 'Weekly' | 'Monthly';

// Additional filters interface
export interface AdditionalFilters {
  companies?: string[];
  contacts?: string[];
  tags?: string[];
  status?: string[];
}

// Main Report interface
export interface Report {
  id: string;
  name: string;
  types: ReportType[];
  dateFilter: DateFilter;
  assignedTo: AssignedTo;
  additionalFilters?: AdditionalFilters;
  frequency: ReportFrequency;
  recipients: string[];
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

// Tab type
export type TabType = 'reports' | 'create';

// Edit form data
export interface EditFormData {
  name?: string;
  types?: string[];
  dateFilter?: string;
  scope?: string;
  frequency?: string;
  filterCompanies?: string;
  filterContacts?: string;
  emailRecipients?: string;
}

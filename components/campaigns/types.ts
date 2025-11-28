/**
 * Campaign and Rule Types and Interfaces
 */

// Contact type
export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  type: string;
}

// Campaign type
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  status: 'Draft' | 'Scheduled' | 'Sending' | 'Completed';
  scheduledDate?: string;
  sentCount?: number;
  createdDate: string;
}

// Rule type
export interface Rule {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  status: 'Active' | 'Paused' | 'Draft';
  emailsSent: number;
  lastTriggered?: string;
  createdDate: string;
}

// Rule condition type
export interface RuleCondition {
  id: string;
  entity: 'Contact' | 'Job' | 'Company' | 'Pre-Opportunity' | 'Quote' | '';
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'days_until' | 'days_after' | '';
  value: string;
}

// Rule condition group type
export interface RuleConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

// List type for campaigns
export type ListType = 'static' | 'criteria' | 'dynamic';

// Tab type
export type TabType = 'campaigns' | 'new-campaign' | 'rules' | 'new-rule';

// Send pace type
export type SendPace = 'fast' | 'medium' | 'slow' | 'very-slow' | 'randomized';

// Communication type
export type CommunicationType = 'email' | 'notification' | 'both';

// Field configuration
export interface FieldConfig {
  value: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

// Operator configuration
export interface OperatorConfig {
  value: string;
  label: string;
}

// AI context type
export type AIContext = 'campaign' | 'rule' | null;

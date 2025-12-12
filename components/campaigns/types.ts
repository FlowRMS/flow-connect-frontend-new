/**
 * Campaign and Rule Types and Interfaces
 * Updated to align with backend API types
 */

// Import API types and re-export for backward compatibility
import type {
  CampaignStatus as APICampaignStatus,
  RecipientListType as APIRecipientListType,
  SendPace as APISendPace,
  CriteriaEntityType,
  CriteriaOperator,
  ContactSearchResult,
} from './api/campaignsApi';

// Contact type - maps to ContactSearchResult from API
export interface Contact {
  id: string;
  name: string;  // Computed from firstName + lastName
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  companyId?: string;
  type?: string;  // Maps to role
  role?: string;
  territory?: string;
  tags?: string;
}

// Convert API ContactSearchResult to our Contact type
export function mapContactSearchResultToContact(contact: ContactSearchResult): Contact {
  return {
    id: contact.id,
    name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    role: contact.role,
    type: contact.role, // Using role as type for backward compatibility
    territory: contact.territory,
    tags: contact.tags,
  };
}

// Campaign status mapping for display
export type CampaignDisplayStatus = 'Draft' | 'Scheduled' | 'Sending' | 'Completed' | 'Paused';

// Map API status to display status
export function mapCampaignStatus(status: APICampaignStatus): CampaignDisplayStatus {
  const statusMap: Record<APICampaignStatus, CampaignDisplayStatus> = {
    'DRAFT': 'Draft',
    'SCHEDULED': 'Scheduled',
    'SENDING': 'Sending',
    'COMPLETED': 'Completed',
    'PAUSED': 'Paused',
  };
  return statusMap[status] || 'Draft';
}

// Map display status to API status
export function mapDisplayStatusToAPI(status: CampaignDisplayStatus): APICampaignStatus {
  const statusMap: Record<CampaignDisplayStatus, APICampaignStatus> = {
    'Draft': 'DRAFT',
    'Scheduled': 'SCHEDULED',
    'Sending': 'SENDING',
    'Completed': 'COMPLETED',
    'Paused': 'PAUSED',
  };
  return statusMap[status] || 'DRAFT';
}

// Campaign type for list view (backward compatible)
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  recipients: number;
  status: CampaignDisplayStatus;
  scheduledDate?: string;
  sentCount?: number;
  createdDate: string;
  recipientListType?: string;
  progress?: string;
}

// Rule type (keeping existing structure)
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

// Rule condition type - Updated to support API entity types
export interface RuleCondition {
  id: string;
  entity: CriteriaEntityType | '';
  field: string;
  operator: CriteriaOperator | '';
  value: string;
}

// Rule condition group type
export interface RuleConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

// List type for campaigns - maps to RecipientListType
export type ListType = 'static' | 'criteria' | 'dynamic';

// Map ListType to API RecipientListType
export function mapListTypeToAPI(listType: ListType): APIRecipientListType {
  const map: Record<ListType, APIRecipientListType> = {
    'static': 'STATIC',
    'criteria': 'CRITERIA_BASED',
    'dynamic': 'DYNAMIC',
  };
  return map[listType];
}

// Map API RecipientListType to ListType
export function mapAPIToListType(apiType: APIRecipientListType): ListType {
  const map: Record<APIRecipientListType, ListType> = {
    'STATIC': 'static',
    'CRITERIA_BASED': 'criteria',
    'DYNAMIC': 'dynamic',
  };
  return map[apiType];
}

// Tab type
export type TabType = 'campaigns' | 'new-campaign' | 'rules' | 'new-rule' | 'edit-campaign';

// Send pace type - Maps to API SendPace
export type SendPace = 'slow' | 'medium' | 'fast';

// Map SendPace to API
export function mapSendPaceToAPI(pace: SendPace): APISendPace {
  const map: Record<SendPace, APISendPace> = {
    'slow': 'SLOW',
    'medium': 'MEDIUM',
    'fast': 'FAST',
  };
  return map[pace];
}

// Communication type
export type CommunicationType = 'email' | 'notification' | 'both';

// Field configuration
export interface FieldConfig {
  value: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  apiField?: string; // The actual field name in the API
}

// Operator configuration
export interface OperatorConfig {
  value: CriteriaOperator | string;
  label: string;
}

// AI context type
export type AIContext = 'campaign' | 'rule' | null;

// Entity type options for criteria builder (excluding TASK as per requirements)
export const ENTITY_TYPE_OPTIONS: Array<{ value: CriteriaEntityType; label: string; icon: string }> = [
  { value: 'CONTACT', label: 'Contact', icon: 'contact' },
  { value: 'JOB', label: 'Job', icon: 'job' },
  { value: 'COMPANY', label: 'Company', icon: 'company' },
];

// Operator options
export const OPERATOR_OPTIONS: OperatorConfig[] = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'NOT_EQUALS', label: 'Not Equals' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'NOT_CONTAINS', label: 'Does Not Contain' },
  { value: 'GREATER_THAN', label: 'Greater Than' },
  { value: 'LESS_THAN', label: 'Less Than' },
  { value: 'IS_NULL', label: 'Is Empty' },
  { value: 'IS_NOT_NULL', label: 'Is Not Empty' },
  { value: 'IN', label: 'Is One Of' },
  { value: 'NOT_IN', label: 'Is Not One Of' },
];

// Field configurations by entity type - Maps to actual API fields
export const ENTITY_FIELDS: Record<CriteriaEntityType, FieldConfig[]> = {
  CONTACT: [
    { value: 'first_name', label: 'First Name', type: 'select', apiField: 'firstName' },
    { value: 'last_name', label: 'Last Name', type: 'select', apiField: 'lastName' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'phone', label: 'Phone', type: 'text' },
    { value: 'role', label: 'Role', type: 'select' },
    { value: 'territory', label: 'Territory', type: 'select' },
    { value: 'tags', label: 'Tags', type: 'select' },
  ],
  JOB: [
    { value: 'job_name', label: 'Job Name', type: 'select', apiField: 'jobName' },
    { value: 'status_id', label: 'Status', type: 'select' },
    { value: 'job_type', label: 'Job Type', type: 'select', apiField: 'jobType' },
    { value: 'start_date', label: 'Start Date', type: 'date', apiField: 'startDate' },
    { value: 'end_date', label: 'End Date', type: 'date', apiField: 'endDate' },
    { value: 'tags', label: 'Tags', type: 'select' },
  ],
  COMPANY: [
    { value: 'name', label: 'Company Name', type: 'select' },
    { value: 'company_source_type', label: 'Company Type', type: 'select', apiField: 'companySourceType' },
    { value: 'website', label: 'Website', type: 'text' },
    { value: 'phone', label: 'Phone', type: 'text' },
    { value: 'tags', label: 'Tags', type: 'select' },
  ],
  TASK: [
    { value: 'title', label: 'Title', type: 'text' },
    { value: 'status', label: 'Status', type: 'select' },
    { value: 'priority', label: 'Priority', type: 'select' },
    { value: 'due_date', label: 'Due Date', type: 'date', apiField: 'dueDate' },
    { value: 'tags', label: 'Tags', type: 'select' },
  ],
};

// Get fields for an entity type
export function getFieldsForEntity(entityType: CriteriaEntityType | string): FieldConfig[] {
  if (!entityType || !(entityType in ENTITY_FIELDS)) {
    return [];
  }
  return ENTITY_FIELDS[entityType as CriteriaEntityType];
}

// Get operators for a field type
export function getOperatorsForFieldType(fieldType: string): OperatorConfig[] {
  switch (fieldType) {
    case 'text':
      return [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'CONTAINS', label: 'Contains' },
        { value: 'NOT_CONTAINS', label: 'Does Not Contain' },
        { value: 'IS_NULL', label: 'Is Empty' },
        { value: 'IS_NOT_NULL', label: 'Is Not Empty' },
      ];
    case 'number':
      return [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'GREATER_THAN', label: 'Greater Than' },
        { value: 'LESS_THAN', label: 'Less Than' },
      ];
    case 'date':
      return [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'GREATER_THAN', label: 'After' },
        { value: 'LESS_THAN', label: 'Before' },
        { value: 'IS_NULL', label: 'Is Empty' },
        { value: 'IS_NOT_NULL', label: 'Is Not Empty' },
      ];
    case 'select':
      return [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'IN', label: 'Is One Of' },
        { value: 'NOT_IN', label: 'Is Not One Of' },
        { value: 'IS_NULL', label: 'Is Empty' },
        { value: 'IS_NOT_NULL', label: 'Is Not Empty' },
      ];
    default:
      return OPERATOR_OPTIONS;
  }
}

// Status colors for campaigns
export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  'DRAFT': 'bg-gray-100 text-gray-700',
  'Draft': 'bg-gray-100 text-gray-700',
  'SCHEDULED': 'bg-yellow-100 text-yellow-700',
  'Scheduled': 'bg-yellow-100 text-yellow-700',
  'SENDING': 'bg-blue-100 text-blue-700',
  'Sending': 'bg-blue-100 text-blue-700',
  'COMPLETED': 'bg-green-100 text-green-700',
  'Completed': 'bg-green-100 text-green-700',
  'PAUSED': 'bg-orange-100 text-orange-700',
  'Paused': 'bg-orange-100 text-orange-700',
};

// Get status color class
export function getStatusColor(status: string): string {
  return CAMPAIGN_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}

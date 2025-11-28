/**
 * Pre-Opportunity Types and Interfaces
 */

// UI PreOpp type (display format)
export interface PreOpp {
  id: string;
  name: string;
  job: string;
  stage: 'Qualified' | 'Negotiation' | 'Follow-up' | 'Waiting on Factory' | 'Lost' | 'Converted';
  value: string;
  soldTo: string;
  manufacturer: string;
  dateCreated: string;
  expirationDate: string;
  owner: string;
  tags: string[];
}

// Pre-Opp Stage for Kanban
export interface PreOppStage {
  name: 'Qualified' | 'Negotiation' | 'Follow-up' | 'Waiting on Factory' | 'Lost' | 'Converted';
}

// View mode type
export type ViewMode = 'kanban' | 'list';

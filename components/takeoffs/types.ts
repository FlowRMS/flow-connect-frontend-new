/**
 * Take-Off Types and Interfaces
 */

// Take-off status types
export type TakeoffStatus = 'Classification' | 'Abridgment' | 'Parsing' | 'Complete';

// Document classification types
export type DocumentClassification = 
  | 'Fixture Schedules' 
  | 'Specifications' 
  | 'Blueprints' 
  | 'Other Docs' 
  | 'Irrelevant' 
  | '';

// View mode types
export type TakeoffViewMode = 'list' | 'detail';

// Step types for the detail flow
export type TakeoffStep = 'classification' | 'abridgment' | 'parsing';

// Main Take-off type
export interface Takeoff {
  id: string;
  title: string;
  source: string;
  createdBy: string;
  createdDate: string;
  status: TakeoffStatus;
  quoteId?: string;
}

// Document type for uploaded files
export interface TakeoffDocument {
  id: string;
  name: string;
  type: 'PDF';
  size: string;
  uploadDate: string;
  classification: DocumentClassification;
  confidence: number;
  pages: number;
  abridged: boolean;
  abridgedPages?: number;
}

// Parsed item from schedule
export interface ParsedItem {
  id: string;
  manufacturer: string;
  partNumber: string;
  description: string;
  quantity: number;
  isOurManufacturer: boolean;
  isCrossed: boolean;
  crossedManufacturer?: string;
  crossedPartNumber?: string;
  crossedDescription?: string;
}

// Abridgment report item
export interface AbridgmentReportItem {
  page: number;
  included: boolean;
  reason: string;
}

// Filter options for take-offs
export interface TakeoffFilterOption {
  id: string;
  label: string;
  type: 'text' | 'dropdown' | 'date';
}

// Document category tab
export interface DocumentCategory {
  id: DocumentClassification;
  label: string;
  count: number;
}

// Step configuration for the multi-step flow
export interface StepConfig {
  id: TakeoffStep;
  label: string;
  icon: string;
}

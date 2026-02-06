import type { IssueSeverity } from '@/lib/nemra-pos-data';

export type IssueFilterType = 'all' | 'blocking' | 'warning' | 'fyi';
export type IssueGroupByType = 'issue' | 'file' | 'entity' | 'month';

export interface SeverityConfig {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  badgeBg: string;
  headerBg: string;
}

// Base issue interface for shared components
export interface BaseIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  whyMatters: string;
  affectedRows: number;
  field?: string;
  fileName: string;
  period: string;
  sendMethod: 'file' | 'api' | 'sftp' | 'email';
  uploadedAt: string;
  exampleRows: {
    rowNumber: number;
    originalValue: string;
    fixedValue?: string;
    customerName?: string;
    catalogNumber?: string;
  }[];
}

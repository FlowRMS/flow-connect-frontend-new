'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  fetchFileValidationIssues,
  type FileValidationIssuesResponse,
  type FileValidationIssueLite,
  type ValidationIssueGroup,
} from '@/lib/validationIssuesGqlSdk';
import type { IssueSeverity } from '@/lib/nemra-pos-data';

export interface UseValidationIssuesOptions {
  /**
   * Whether to load data on mount (default: true)
   */
  loadOnMount?: boolean;
}

/**
 * Transformed issue format compatible with the existing UI components.
 * Groups individual row-level issues by title.
 */
export interface TransformedValidationIssue {
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
  // Additional fields from API
  fileId: string;
}

export interface UseValidationIssuesReturn {
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error message if any
   */
  error: string | null;
  /**
   * The raw validation issues response
   */
  data: FileValidationIssuesResponse | null;
  /**
   * Standard validation issues (blocking)
   */
  standardValidation: ValidationIssueGroup;
  /**
   * Validation warnings
   */
  validationWarning: ValidationIssueGroup;
  /**
   * All raw issues combined
   */
  allIssues: FileValidationIssueLite[];
  /**
   * Total count of all issues
   */
  totalCount: number;
  /**
   * Transformed issues grouped by title, compatible with existing UI components
   */
  transformedIssues: TransformedValidationIssue[];
  /**
   * Count of blocking issues (after grouping)
   */
  blockingCount: number;
  /**
   * Count of warning issues (after grouping)
   */
  warningCount: number;
  /**
   * Reload issues from server
   */
  reload: () => Promise<void>;
}

const emptyGroup: ValidationIssueGroup = {
  items: [],
  count: 0,
};

/**
 * Fetch the access token from the auth API
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/token');
    if (!response.ok) {
      console.warn('Failed to get access token:', response.status);
      return null;
    }
    const data = await response.json();
    return data.accessToken ?? null;
  } catch (error) {
    console.warn('Error fetching access token:', error);
    return null;
  }
}

/**
 * Transform raw API issues into grouped format for UI.
 * Groups issues by title + validationType + fileName to aggregate similar issues.
 */
function transformIssues(
  issues: FileValidationIssueLite[]
): TransformedValidationIssue[] {
  // Group issues by title + validationType + fileName
  const grouped = new Map<string, FileValidationIssueLite[]>();

  for (const issue of issues) {
    const key = `${issue.title}|${issue.validationType}|${issue.fileName}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(issue);
    } else {
      grouped.set(key, [issue]);
    }
  }

  // Transform groups into the UI-compatible format
  const transformed: TransformedValidationIssue[] = [];

  for (const [, groupIssues] of grouped) {
    const first = groupIssues[0];
    const severity: IssueSeverity =
      first.validationType === 'STANDARD_VALIDATION' ? 'blocking' : 'warning';

    // Generate a description based on the issue title
    const whyMatters = generateWhyMatters(first.title, first.columnName);

    transformed.push({
      id: first.id,
      severity,
      title: first.title,
      whyMatters,
      affectedRows: groupIssues.length,
      field: first.columnName ?? undefined,
      fileName: first.fileName,
      fileId: first.fileId,
      period: 'Current Upload', // Not available in API
      sendMethod: 'file', // Default to file
      uploadedAt: new Date().toISOString(),
      exampleRows: groupIssues.slice(0, 5).map((issue) => ({
        rowNumber: issue.rowNumber,
        originalValue: '',
        customerName: undefined,
        catalogNumber: undefined,
      })),
    });
  }

  // Sort by severity (blocking first) then by affected rows (descending)
  return transformed.sort((a, b) => {
    if (a.severity === 'blocking' && b.severity !== 'blocking') return -1;
    if (a.severity !== 'blocking' && b.severity === 'blocking') return 1;
    return b.affectedRows - a.affectedRows;
  });
}

/**
 * Generate a "why it matters" description based on the issue title
 */
function generateWhyMatters(title: string, columnName: string | null): string {
  const column = columnName ? columnName.replace(/_/g, ' ') : 'this field';

  if (title.toLowerCase().includes('zip')) {
    return `Valid ${column} is required for territory assignment.`;
  }
  if (title.toLowerCase().includes('date')) {
    return `Valid dates are required for accurate reporting.`;
  }
  if (title.toLowerCase().includes('numeric') || title.toLowerCase().includes('number')) {
    return `${column} must contain a valid number.`;
  }
  if (title.toLowerCase().includes('required') || title.toLowerCase().includes('missing')) {
    return `${column} is a required field and cannot be empty.`;
  }
  if (title.toLowerCase().includes('format')) {
    return `${column} must match the expected format.`;
  }
  if (title.toLowerCase().includes('invalid')) {
    return `The value in ${column} is not valid.`;
  }

  return `This issue needs to be resolved before processing.`;
}

/**
 * Hook for fetching and managing file validation issues.
 */
export function useValidationIssues(
  options: UseValidationIssuesOptions = {}
): UseValidationIssuesReturn {
  const { loadOnMount = true } = options;

  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FileValidationIssuesResponse | null>(null);

  const loadIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch access token for authentication
      const token = await getAccessToken();
      const response = await fetchFileValidationIssues(token ?? undefined);
      setData(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load validation issues';
      setError(message);
      console.error('useValidationIssues load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loadOnMount) {
      loadIssues();
    }
  }, [loadOnMount, loadIssues]);

  const standardValidation = data?.standardValidation ?? emptyGroup;
  const validationWarning = data?.validationWarning ?? emptyGroup;
  const allIssues = useMemo(
    () => [...standardValidation.items, ...validationWarning.items],
    [standardValidation.items, validationWarning.items]
  );
  const totalCount = standardValidation.count + validationWarning.count;

  // Transform issues for UI compatibility
  const transformedIssues = useMemo(
    () => transformIssues(allIssues),
    [allIssues]
  );

  const blockingCount = useMemo(
    () => transformedIssues.filter((i) => i.severity === 'blocking').length,
    [transformedIssues]
  );

  const warningCount = useMemo(
    () => transformedIssues.filter((i) => i.severity === 'warning').length,
    [transformedIssues]
  );

  return {
    isLoading,
    error,
    data,
    standardValidation,
    validationWarning,
    allIssues,
    totalCount,
    transformedIssues,
    blockingCount,
    warningCount,
    reload: loadIssues,
  };
}

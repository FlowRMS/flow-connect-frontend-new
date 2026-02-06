'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Loader2,
  Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  fetchFileValidationIssue,
  type FileValidationIssueDetail,
} from '@/lib/validationIssuesGqlSdk';
import { severityConfig } from './severity-config';
import type { IssueSeverity } from '@/lib/nemra-pos-data';

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

interface ValidationIssueDetailModalProps {
  issueId: string;
  onClose: () => void;
}

export function ValidationIssueDetailModal({
  issueId,
  onClose,
}: ValidationIssueDetailModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issue, setIssue] = useState<FileValidationIssueDetail | null>(null);

  const loadIssueDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch access token for authentication
      const token = await getAccessToken();
      const data = await fetchFileValidationIssue(issueId, token ?? undefined);
      setIssue(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load issue details';
      setError(message);
      console.error('Failed to load issue details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadIssueDetails();
  }, [loadIssueDetails]);

  // Parse rowData if it's a JSON string
  const parsedRowData = useMemo(() => {
    if (!issue?.rowData) return null;
    if (typeof issue.rowData === 'string') {
      try {
        return JSON.parse(issue.rowData) as Record<string, unknown>;
      } catch (err) {
        console.error('Failed to parse rowData:', err);
        return null;
      }
    }
    return issue.rowData as Record<string, unknown>;
  }, [issue?.rowData]);

  // Map validation type to severity
  const severity: IssueSeverity =
    issue?.validationType === 'STANDARD_VALIDATION' ? 'blocking' : 'warning';
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Loading State */}
        {isLoading && (
          <>
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading issue details...</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 p-6 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <>
            <div className="p-6 border-b flex items-center justify-between bg-red-50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <span className="text-red-700 font-medium">Error loading issue</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 p-6">
              <p className="text-red-600">{error}</p>
            </div>
            <div className="p-6 border-t bg-muted/30 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}

        {/* Issue Details */}
        {issue && !isLoading && !error && (
          <>
            {/* Header */}
            <div className={cn('p-6 border-b flex items-start justify-between', config.bg)}>
              <div className="flex items-start gap-4">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', config.headerBg)}>
                  <Icon className={cn('w-6 h-6', config.iconColor)} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={cn('text-xl font-semibold', config.text)}>{issue.title}</h2>
                    <Badge className={cn(config.badgeBg, config.text)}>
                      {config.sublabel}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">{issue.message}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="bg-white">
                      <FileSpreadsheet className="w-3 h-3 mr-1" />
                      {issue.fileName}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      <Hash className="w-3 h-3 mr-1" />
                      Row {issue.rowNumber}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      1 row affected
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground w-20">Row</th>
                      {Boolean(parsedRowData?.manufacturer_catalog_number) && issue.columnName !== 'manufacturer_catalog_number' && (
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Catalog #</th>
                      )}
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        <span className={config.text}>{issue.columnName}</span> (issue)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr key={issue.rowNumber} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-sm">{issue.rowNumber}</td>
                      {Boolean(parsedRowData?.manufacturer_catalog_number) && issue.columnName !== 'manufacturer_catalog_number' && (
                        <td className="py-3 px-4 text-sm font-mono">
                          {parsedRowData?.manufacturer_catalog_number ?
                            String(parsedRowData.manufacturer_catalog_number) : '—'}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-sm',
                          config.bg, config.border, 'border'
                        )}>
                          <AlertCircle className={cn('w-3 h-3', config.iconColor)} />
                          {issue.columnName && parsedRowData?.[issue.columnName] !== undefined ? (
                            String(parsedRowData[issue.columnName])
                          ) : (
                            <span className="italic text-muted-foreground">empty</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-muted/30 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

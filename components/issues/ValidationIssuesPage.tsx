'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  Briefcase,
  Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  IssueCard,
  IssueSummaryBadges,
  IssueFilterBar,
  NoIssuesState,
  NoResultsState,
  ValidationIssueDetailModal,
  type IssueFilterType,
  type IssueGroupByType,
} from '@/components/issues';
import {
  useValidationIssues,
  type TransformedValidationIssue,
} from '@/lib/hooks/useValidationIssues';

export type UserRole = 'manufacturer' | 'distributor';

interface RoleConfig {
  title: string;
  subtitle: string;
  entityLabel: string;
  entityFilterLabel: string;
  entityIcon: typeof Briefcase | typeof Factory;
  backLink: string;
  footerNote: string;
  groupByOptions: { value: IssueGroupByType; label: string }[];
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  manufacturer: {
    title: 'Send Issues',
    subtitle: 'Fix blocking items before sending data to rep firms.',
    entityLabel: 'Rep firms',
    entityFilterLabel: 'All rep firms',
    entityIcon: Briefcase,
    backLink: '/nemra-pos/manufacturer/send',
    footerNote: "Some items may be informational only and won't block sending to rep firms.",
    groupByOptions: [
      { value: 'issue', label: 'Severity' },
      { value: 'file', label: 'File' },
    ],
  },
  distributor: {
    title: 'Issues',
    subtitle: 'Fix blocking items first. Warnings are optional.',
    entityLabel: 'Files',
    entityFilterLabel: 'All files',
    entityIcon: FileSpreadsheet,
    backLink: '/nemra-pos/distributor/send',
    footerNote: 'Some items may be informational due to distributor ERP limitations.',
    groupByOptions: [
      { value: 'issue', label: 'Severity' },
      { value: 'file', label: 'File' },
    ],
  },
};

interface ValidationIssuesPageProps {
  role: UserRole;
}

export function ValidationIssuesPage({ role }: ValidationIssuesPageProps) {
  const config = roleConfigs[role];
  const EntityIcon = config.entityIcon;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<IssueFilterType>('all');
  const [groupBy, setGroupBy] = useState<IssueGroupByType>('issue');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Fetch validation issues from GraphQL
  const { isLoading, error, transformedIssues, blockingCount, warningCount } =
    useValidationIssues();

  // Derive unique files from issues
  const uniqueFiles = useMemo(
    () => [...new Set(transformedIssues.map((i) => i.fileName))],
    [transformedIssues]
  );

  // Filter issues
  const filteredIssues = useMemo(() => {
    return transformedIssues.filter((issue) => {
      const matchesSearch =
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.whyMatters.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity =
        filterSeverity === 'all' || issue.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [transformedIssues, searchQuery, filterSeverity]);

  // Group issues
  const groups = useMemo(() => {
    if (groupBy === 'issue') {
      return {
        Blocking: filteredIssues.filter((i) => i.severity === 'blocking'),
        Warnings: filteredIssues.filter((i) => i.severity === 'warning'),
      };
    } else if (groupBy === 'file') {
      return uniqueFiles.reduce(
        (acc, file) => {
          const issues = filteredIssues.filter((i) => i.fileName === file);
          if (issues.length > 0) acc[file] = issues;
          return acc;
        },
        {} as Record<string, TransformedValidationIssue[]>
      );
    }
    return {};
  }, [groupBy, filteredIssues, uniqueFiles]);

  const hasNoIssues = transformedIssues.length === 0;
  const hasNoResults = filteredIssues.length === 0 && !hasNoIssues;

  // Callbacks
  const handleFilterSeverityChange = useCallback((severity: IssueFilterType) => {
    setFilterSeverity(severity);
  }, []);

  const handleGroupByChange = useCallback((value: IssueGroupByType) => {
    setGroupBy(value);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleIssueClick = useCallback((issueId: string) => {
    setSelectedIssueId(issueId);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedIssueId(null);
  }, []);

  // Entity helpers for IssueCard
  const getEntityNames = useCallback(
    (issue: TransformedValidationIssue) => [issue.fileName],
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{config.title}</h1>
            <p className="text-muted-foreground">Loading validation issues...</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Fetching validation issues...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{config.title}</h1>
            <p className="text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h3 className="font-medium text-red-700 mb-2">Failed to load issues</h3>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{config.title}</h1>
          <p className="text-muted-foreground">{config.subtitle}</p>
        </div>
        <IssueSummaryBadges
          blockingCount={blockingCount}
          warningCount={warningCount}
          fyiCount={0}
        />
      </div>

      {/* Filter Bar */}
      <IssueFilterBar
        totalCount={transformedIssues.length}
        blockingCount={blockingCount}
        warningCount={warningCount}
        fyiCount={0}
        filterSeverity={filterSeverity}
        onFilterSeverityChange={handleFilterSeverityChange}
        groupBy={groupBy}
        onGroupByChange={handleGroupByChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        entityFilterLabel={config.entityFilterLabel}
        entityFilterValue="all"
        onEntityFilterChange={() => {}}
        entityOptions={uniqueFiles.map((f) => ({ id: f, name: f }))}
        groupByOptions={config.groupByOptions}
      />

      {/* No Issues State */}
      {hasNoIssues && !isLoading && <NoIssuesState backLink={config.backLink} />}

      {/* No Results State */}
      {hasNoResults && <NoResultsState />}

      {/* Issue Groups */}
      {!hasNoIssues && !hasNoResults && (
        <div className="space-y-6">
          {Object.entries(groups).map(([groupName, issues]) => {
            if (issues.length === 0) return null;

            const isBlockingGroup = groupName === 'Blocking';
            const isWarningGroup = groupName === 'Warnings';

            return (
              <Card key={groupName} className="overflow-hidden">
                <CardHeader
                  className={cn(
                    'py-3',
                    isBlockingGroup && 'bg-red-50',
                    isWarningGroup && 'bg-yellow-50',
                    !isBlockingGroup && !isWarningGroup && 'bg-muted/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {groupBy === 'file' && (
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                      )}
                      {isBlockingGroup && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      {isWarningGroup && (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                      <CardTitle
                        className={cn(
                          'text-base',
                          isBlockingGroup && 'text-red-700',
                          isWarningGroup && 'text-yellow-700'
                        )}
                      >
                        {groupName}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          isBlockingGroup && 'bg-red-100 text-red-700 border-red-200',
                          isWarningGroup && 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        )}
                      >
                        {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                      </Badge>
                    </div>
                    {groupBy === 'file' && issues[0] && (
                      <span className="text-sm text-muted-foreground">
                        {issues[0].period}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {issues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onClick={() => handleIssueClick(issue.id)}
                        entityIcon={EntityIcon}
                        getEntityNames={getEntityNames}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer Note */}
      <p className="text-sm text-muted-foreground pt-4">{config.footerNote}</p>

      {/* Issue Detail Modal */}
      {selectedIssueId && (
        <ValidationIssueDetailModal
          issueId={selectedIssueId}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

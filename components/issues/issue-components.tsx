'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  X,
  CheckCircle,
  Upload,
  FileSpreadsheet,
  Calendar,
  ArrowRight,
  Check,
  Edit3,
  Save,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { severityConfig } from './severity-config';
import type { BaseIssue, IssueFilterType, IssueGroupByType } from './types';
import type { IssueSeverity } from '@/lib/nemra-pos-data';

// ============================================
// Summary Badges
// ============================================

interface IssueSummaryBadgesProps {
  blockingCount: number;
  warningCount: number;
  fyiCount: number;
}

export function IssueSummaryBadges({ blockingCount, warningCount, fyiCount }: IssueSummaryBadgesProps) {
  return (
    <div className="flex gap-2">
      <Badge className={cn('px-3 py-1', blockingCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
        {blockingCount} blocking
      </Badge>
      <Badge className={cn('px-3 py-1', warningCount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600')}>
        {warningCount} warnings
      </Badge>
      <Badge className="px-3 py-1 bg-slate-100 text-slate-600">
        {fyiCount} FYI
      </Badge>
    </div>
  );
}

// ============================================
// Filter Bar
// ============================================

interface IssueFilterBarProps {
  totalCount: number;
  blockingCount: number;
  warningCount: number;
  fyiCount: number;
  filterSeverity: IssueFilterType;
  onFilterSeverityChange: (severity: IssueFilterType) => void;
  groupBy: IssueGroupByType;
  onGroupByChange: (groupBy: IssueGroupByType) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  entityFilterLabel: string;
  entityFilterValue: string;
  onEntityFilterChange: (value: string) => void;
  entityOptions: { id: string; name: string }[];
  groupByOptions: { value: IssueGroupByType; label: string }[];
}

export function IssueFilterBar({
  totalCount,
  blockingCount,
  warningCount,
  fyiCount,
  filterSeverity,
  onFilterSeverityChange,
  groupBy,
  onGroupByChange,
  searchQuery,
  onSearchChange,
  entityFilterLabel,
  entityFilterValue,
  onEntityFilterChange,
  entityOptions,
  groupByOptions,
}: IssueFilterBarProps) {
  const getSeverityCount = (severity: IssueFilterType) => {
    if (severity === 'all') return totalCount;
    if (severity === 'blocking') return blockingCount;
    if (severity === 'warning') return warningCount;
    return fyiCount;
  };
  const groupByLabelMap = useMemo(() => {
    const map = new Map<IssueGroupByType, string>();
    groupByOptions.forEach((opt) => map.set(opt.value, opt.label));
    return map;
  }, [groupByOptions]);
  const groupBySelectValue = groupByLabelMap.get(groupBy) ?? groupBy;
  const handleGroupBySelectChange = (value: string) => {
    const selected = groupByOptions.find((opt) => opt.label === value || opt.value === value);
    onGroupByChange((selected?.value ?? value) as IssueGroupByType);
  };
  const entitySelectValue = entityFilterValue === 'all' ? entityFilterLabel : entityFilterValue;
  const handleEntitySelectChange = (value: string) => {
    onEntityFilterChange(value === entityFilterLabel ? 'all' : value);
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Severity Pills */}
          <div className="flex gap-1">
            {(['all', 'blocking', 'warning', 'fyi'] as IssueFilterType[]).map((severity) => (
              <Button
                key={severity}
                variant={filterSeverity === severity ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterSeverityChange(severity)}
                className={cn(
                  'bg-white',
                  filterSeverity === severity && severity === 'blocking' && 'bg-red-600 hover:bg-red-700 text-white',
                  filterSeverity === severity && severity === 'warning' && 'bg-yellow-600 hover:bg-yellow-700 text-white',
                  filterSeverity === severity && severity === 'fyi' && 'bg-slate-600 hover:bg-slate-700 text-white',
                  filterSeverity === severity && severity === 'all' && 'bg-primary'
                )}
              >
                {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                <span className="ml-1 opacity-70">({getSeverityCount(severity)})</span>
              </Button>
            ))}
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Group By */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Group by:</span>
            <Select value={groupBySelectValue} onValueChange={handleGroupBySelectChange}>
              <SelectTrigger className="w-36 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupByOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Filter */}
          <div>
            <Select value={entitySelectValue} onValueChange={handleEntitySelectChange}>
                <SelectTrigger className="w-52 bg-white">
              <SelectValue placeholder={entityFilterLabel} />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value={entityFilterLabel}>{entityFilterLabel}</SelectItem>
                {entityOptions.map((entity) => (
                    <SelectItem key={entity.id} value={entity.name}>{entity.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Empty States
// ============================================

interface NoIssuesStateProps {
  backLink: string;
  backLabel?: string;
}

export function NoIssuesState({ backLink, backLabel = 'Back to Send Data' }: NoIssuesStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
        <h3 className="font-medium text-green-700 mb-2">No issues found</h3>
        <p className="text-sm text-muted-foreground mb-4">Your data passes all validation checks.</p>
        <Button asChild>
          <Link href={backLink}>{backLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function NoResultsState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No matching issues</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// Issue Card (Row)
// ============================================

interface IssueCardProps<T extends BaseIssue> {
  issue: T;
  onClick: () => void;
  entityIcon: React.ElementType;
  getEntityNames: (issue: T) => string[];
}

export function IssueCard<T extends BaseIssue>({
  issue,
  onClick,
  entityIcon: EntityIcon,
  getEntityNames,
}: IssueCardProps<T>) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;
  const entityNames = getEntityNames(issue);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-4 text-left transition-colors hover:bg-muted/50 flex items-start gap-4'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        config.headerBg
      )}>
        <Icon className={cn('w-5 h-5', config.iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn('font-medium', config.text)}>{issue.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{issue.whyMatters}</p>
          </div>
          <Badge className={cn(config.badgeBg, config.text, 'flex-shrink-0')}>
            {config.sublabel}
          </Badge>
        </div>

        {/* Context badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className="bg-white text-xs">
            <FileSpreadsheet className="w-3 h-3 mr-1" />
            {issue.fileName}
          </Badge>
          <Badge variant="outline" className="bg-white text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {issue.period}
          </Badge>
          {entityNames.length === 1 ? (
            <Badge variant="outline" className="bg-white text-xs">
              <EntityIcon className="w-3 h-3 mr-1" />
              {entityNames[0]}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-white text-xs">
              <EntityIcon className="w-3 h-3 mr-1" />
              {entityNames.length} entities
            </Badge>
          )}
          <Badge variant="outline" className="bg-white text-xs">
            {issue.affectedRows} rows
          </Badge>
          <Badge variant="outline" className="bg-white text-xs capitalize">
            {issue.sendMethod === 'file' ? 'File upload' : issue.sendMethod.toUpperCase()}
          </Badge>
        </div>
      </div>

      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-3" />
    </button>
  );
}

// ============================================
// Issue Detail Modal
// ============================================

interface IssueDetailModalProps<T extends BaseIssue> {
  issue: T;
  onClose: () => void;
  entityIcon: React.ElementType;
  entityLabel: string;
  getEntityNames: (issue: T) => string[];
}

export function IssueDetailModal<T extends BaseIssue>({
  issue,
  onClose,
  entityIcon: EntityIcon,
  entityLabel,
  getEntityNames,
}: IssueDetailModalProps<T>) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;
  const [editedRows, setEditedRows] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = issue.sendMethod === 'file' || issue.sendMethod === 'sftp' || issue.sendMethod === 'email';
  const isApiMethod = issue.sendMethod === 'api';

  const handleSaveAndSend = useCallback(async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    onClose();
  }, [onClose]);

  const handleRowEdit = useCallback((rowNumber: number, value: string) => {
    setEditedRows(prev => ({ ...prev, [rowNumber]: value }));
  }, []);

  const allRowsFixed = issue.exampleRows.length > 0 &&
    issue.exampleRows.every(row => editedRows[row.rowNumber] && editedRows[row.rowNumber].trim() !== '');

  const entityNames = getEntityNames(issue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
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
              <p className="text-muted-foreground mt-1">{issue.whyMatters}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="bg-white">
                  <FileSpreadsheet className="w-3 h-3 mr-1" />
                  {issue.fileName}
                </Badge>
                <Badge variant="outline" className="bg-white">
                  <Calendar className="w-3 h-3 mr-1" />
                  {issue.period}
                </Badge>
                <Badge variant="outline" className="bg-white">
                  {issue.affectedRows} rows affected
                </Badge>
                <Badge variant="outline" className="bg-white capitalize">
                  {issue.sendMethod === 'file' ? (
                    <><Upload className="w-3 h-3 mr-1" /> File upload</>
                  ) : issue.sendMethod === 'api' ? (
                    <><Wifi className="w-3 h-3 mr-1" /> API</>
                  ) : (
                    <><Wifi className="w-3 h-3 mr-1" /> {issue.sendMethod.toUpperCase()}</>
                  )}
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
          {/* Entities affected */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">{entityLabel} affected</h3>
            <div className="flex flex-wrap gap-2">
              {entityNames.map((name) => (
                <Badge key={name} variant="outline" className="bg-muted/50">
                  <EntityIcon className="w-3 h-3 mr-1" />
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Data Preview with Edit */}
          {issue.exampleRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">
                  {canEdit ? 'Fix these rows' : 'Affected rows preview'}
                </h3>
                {canEdit && (
                  <p className="text-sm text-muted-foreground">
                    <Edit3 className="w-4 h-4 inline mr-1" />
                    Click to edit values directly
                  </p>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground w-20">Row</th>
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Customer</th>
                      {issue.field !== 'catalogNumber' && (
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Catalog #</th>
                      )}
                      <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                        <span className={config.text}>{issue.field}</span> (issue)
                      </th>
                      {canEdit && (
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground w-48">Fixed Value</th>
                      )}
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {issue.exampleRows.map((row) => (
                      <tr key={row.rowNumber} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono text-sm">{row.rowNumber}</td>
                        <td className="py-3 px-4 text-sm">{row.customerName || '—'}</td>
                        {issue.field !== 'catalogNumber' && (
                          <td className="py-3 px-4 text-sm font-mono">{row.catalogNumber || '—'}</td>
                        )}
                        <td className="py-3 px-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded text-sm',
                            config.bg, config.border, 'border'
                          )}>
                            <AlertCircle className={cn('w-3 h-3', config.iconColor)} />
                            {row.originalValue || <span className="italic text-muted-foreground">empty</span>}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4">
                            <Input
                              placeholder="Enter correct value"
                              value={editedRows[row.rowNumber] || ''}
                              onChange={(e) => handleRowEdit(row.rowNumber, e.target.value)}
                              className={cn(
                                'h-9',
                                editedRows[row.rowNumber] && 'border-green-500 bg-green-50'
                              )}
                            />
                          </td>
                        )}
                        <td className="py-3 px-4">
                          {editedRows[row.rowNumber] && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {issue.affectedRows > issue.exampleRows.length && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing {issue.exampleRows.length} of {issue.affectedRows} affected rows.
                  {canEdit && ' Fix all values before sending.'}
                </p>
              )}
            </div>
          )}

          {/* API Method Info */}
          {isApiMethod && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">API data source</p>
                  <p className="text-sm text-blue-700 mt-1">
                    This data was pulled from your API integration. You can edit the values here and the corrections will be applied before sending.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FYI - No edits needed */}
          {issue.severity === 'fyi' && (
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-500 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-700">Informational only</p>
                  <p className="text-sm text-slate-600 mt-1">
                    This item is for your awareness. No action is required and it won&apos;t prevent sending.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/30 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {canEdit && issue.exampleRows.length > 0 && (
              <>
                {Object.keys(editedRows).filter(k => editedRows[parseInt(k)]).length} of {issue.exampleRows.length} rows fixed
              </>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              {issue.severity === 'fyi' ? 'Close' : 'Cancel'}
            </Button>
            {issue.severity !== 'fyi' && canEdit && (
              <Button
                onClick={handleSaveAndSend}
                disabled={!allRowsFixed || isSaving}
                className={cn(
                  allRowsFixed && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {isSaving ? (
                  'Saving...'
                ) : allRowsFixed ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save fixes & continue
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Fix all rows to continue
                  </>
                )}
              </Button>
            )}
            {issue.severity !== 'fyi' && !canEdit && (
              <Button disabled>
                Contact support for API fixes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

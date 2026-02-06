'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import {
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  Clock,
  Briefcase,
  Factory,
  FileText,
  ChevronDown,
  ChevronRight,
  Upload,
  Wifi,
  Server,
  Mail,
  AlertCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SendStatus,
  SendHistoryMethod,
  SendHistoryDataType,
  DeliveryIssues,
  RepFirmDelivery,
  ManufacturerDelivery,
  ManufacturerMonthSend,
  DistributorMonthSend,
} from '@/lib/nemra-pos-data';
import {
  sendStatusConfig,
  sendMethodLabels,
  getOverallStatusFromRepFirms,
  getOverallStatusFromManufacturers,
} from '@/lib/nemra-pos-data';

// ============================================
// STATUS ICONS
// ============================================

const statusIcons = {
  sent: CheckCircle,
  sent_with_warnings: AlertTriangle,
  failed: X,
  blocked: X,
};

const sendMethodIcons = {
  file: Upload,
  api: Wifi,
  sftp: Server,
  email: Mail,
};

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface StatusBadgeProps {
  status: SendStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = sendStatusConfig[status];
  const Icon = statusIcons[status];
  return (
    <Badge className={config.className}>
      <Icon className={cn('w-3 h-3 mr-1', config.iconColor)} />
      {config.label}
    </Badge>
  );
}

// ============================================
// SEND METHOD BADGE COMPONENT
// ============================================

interface SendMethodBadgeProps {
  method: SendHistoryMethod;
}

export function SendMethodBadge({ method }: SendMethodBadgeProps) {
  const Icon = sendMethodIcons[method];
  const label = sendMethodLabels[method];
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ============================================
// DATA TYPE BADGE COMPONENT
// ============================================

interface DataTypeBadgeProps {
  dataType: SendHistoryDataType;
}

export function DataTypeBadge({ dataType }: DataTypeBadgeProps) {
  return <Badge variant="outline">{dataType}</Badge>;
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================

interface EmptyHistoryStateProps {
  sendLink: string;
  title?: string;
  description?: string;
}

export function EmptyHistoryState({
  sendLink,
  title = 'No send history yet',
  description = "When you send data, you'll see your send history here.",
}: EmptyHistoryStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button asChild>
          <Link href={sendLink}>Send data</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// NO RESULTS STATE COMPONENT
// ============================================

export function NoResultsState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium">No matching sends found</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
      </CardContent>
    </Card>
  );
}

// ============================================
// ISSUES SUMMARY COMPONENT
// ============================================

interface IssuesSummaryProps {
  issues: DeliveryIssues;
  viewIssuesLink: string;
  onLinkClick?: (e: React.MouseEvent) => void;
}

export function IssuesSummary({ issues, viewIssuesLink, onLinkClick }: IssuesSummaryProps) {
  const hasIssues = issues.blocking > 0 || issues.warnings > 0;
  if (!hasIssues) return null;

  return (
    <div className="flex items-center gap-2 mt-2 ml-7">
      {issues.blocking > 0 && (
        <span className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-3 h-3" />
          {issues.blocking} blocking
        </span>
      )}
      {issues.warnings > 0 && (
        <span className="flex items-center gap-1 text-sm text-yellow-600">
          <AlertTriangle className="w-3 h-3" />
          {issues.warnings} warnings
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-primary h-7"
        asChild
        onClick={onLinkClick}
      >
        <Link href={viewIssuesLink}>
          View Issues
          <ExternalLink className="w-3 h-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
}

// ============================================
// DELIVERY ACTIONS COMPONENT
// ============================================

interface DeliveryActionsProps {
  viewAsLabel: string;
}

export function DeliveryActions({ viewAsLabel }: DeliveryActionsProps) {
  return (
    <div className="flex items-center gap-2 mt-3 ml-7">
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Download submitted data
      </Button>
      <Button variant="outline" size="sm">
        <Eye className="w-4 h-4 mr-2" />
        View as {viewAsLabel}
      </Button>
    </div>
  );
}

// ============================================
// SENT DATE AND FILE COMPONENT
// ============================================

interface SentInfoProps {
  sentAt: string;
  fileName?: string;
}

export function SentInfo({ sentAt, fileName }: SentInfoProps) {
  return (
    <div className="flex items-center gap-4 mt-2 ml-7 text-sm text-muted-foreground">
      <span>
        Sent{' '}
        {new Date(sentAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </span>
      {fileName && (
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {fileName}
        </span>
      )}
    </div>
  );
}

// ============================================
// REP FIRM DELIVERY CARD COMPONENT
// ============================================

interface RepFirmDeliveryCardProps {
  repFirm: RepFirmDelivery;
  period: string;
}

export function RepFirmDeliveryCard({ repFirm, period }: RepFirmDeliveryCardProps) {
  const viewIssuesLink = `/nemra-pos/manufacturer/send-issues?period=${encodeURIComponent(period)}&repfirm=${encodeURIComponent(repFirm.name)}`;

  return (
    <div className="p-4 rounded-lg bg-background border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{repFirm.name}</p>
            <p className="text-sm text-muted-foreground">
              {repFirm.territories.join(', ')} • {repFirm.recordCount.toLocaleString()} records
            </p>
          </div>
        </div>
        <StatusBadge status={repFirm.status} />
      </div>
      <SentInfo sentAt={repFirm.sentAt} fileName={repFirm.fileName} />
      <IssuesSummary
        issues={repFirm.issues}
        viewIssuesLink={viewIssuesLink}
        onLinkClick={(e) => e.stopPropagation()}
      />
      <DeliveryActions viewAsLabel="rep firm" />
    </div>
  );
}

// ============================================
// MANUFACTURER DELIVERY CARD COMPONENT
// ============================================

interface ManufacturerDeliveryCardProps {
  manufacturer: ManufacturerDelivery;
  period: string;
}

export function ManufacturerDeliveryCard({ manufacturer, period }: ManufacturerDeliveryCardProps) {
  const viewIssuesLink = `/nemra-pos/distributor/issues?period=${encodeURIComponent(period)}&manufacturer=${encodeURIComponent(manufacturer.name)}`;

  return (
    <div className="p-4 rounded-lg bg-background border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Factory className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{manufacturer.name}</p>
            <p className="text-sm text-muted-foreground">
              {manufacturer.recordCount.toLocaleString()} records
            </p>
          </div>
        </div>
        <StatusBadge status={manufacturer.status} />
      </div>
      <SentInfo sentAt={manufacturer.sentAt} fileName={manufacturer.fileName} />
      <IssuesSummary
        issues={manufacturer.issues}
        viewIssuesLink={viewIssuesLink}
        onLinkClick={(e) => e.stopPropagation()}
      />
      <DeliveryActions viewAsLabel="manufacturer" />
    </div>
  );
}

// ============================================
// MANUFACTURER MONTH SEND CARD COMPONENT
// ============================================

interface ManufacturerMonthSendCardProps {
  send: ManufacturerMonthSend;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ManufacturerMonthSendCard({
  send,
  isExpanded,
  onToggle,
}: ManufacturerMonthSendCardProps) {
  const overallStatus = getOverallStatusFromRepFirms(send.repFirms);

  return (
    <Card className="overflow-hidden">
      {/* Month Header - Clickable to expand */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="font-semibold text-lg">{send.period}</span>
            </div>
            <DataTypeBadge dataType={send.dataType} />
            <SendMethodBadge method={send.sendMethod} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {send.totalRecords.toLocaleString()} records • {send.repFirms.length} rep{' '}
              {send.repFirms.length === 1 ? 'firm' : 'firms'}
            </span>
            <StatusBadge status={overallStatus} />
          </div>
        </div>
      </div>

      {/* Expanded Content - Rep Firm Details */}
      {isExpanded && (
        <div className="border-t bg-muted/20">
          <div className="p-4 space-y-3">
            {send.repFirms.map((rep) => (
              <RepFirmDeliveryCard key={rep.id} repFirm={rep} period={send.period} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================
// DISTRIBUTOR MONTH SEND CARD COMPONENT
// ============================================

interface DistributorMonthSendCardProps {
  send: DistributorMonthSend;
  isExpanded: boolean;
  onToggle: () => void;
}

export function DistributorMonthSendCard({
  send,
  isExpanded,
  onToggle,
}: DistributorMonthSendCardProps) {
  const overallStatus = getOverallStatusFromManufacturers(send.manufacturers);

  return (
    <Card className="overflow-hidden">
      {/* Month Header - Clickable to expand */}
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="font-semibold text-lg">{send.period}</span>
            </div>
            <DataTypeBadge dataType={send.dataType} />
            <SendMethodBadge method={send.sendMethod} />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {send.totalRecords.toLocaleString()} records • {send.manufacturers.length}{' '}
              {send.manufacturers.length === 1 ? 'manufacturer' : 'manufacturers'}
            </span>
            <StatusBadge status={overallStatus} />
          </div>
        </div>
      </div>

      {/* Expanded Content - Manufacturer Details */}
      {isExpanded && (
        <div className="border-t bg-muted/20">
          <div className="p-4 space-y-3">
            {send.manufacturers.map((mfr) => (
              <ManufacturerDeliveryCard key={mfr.id} manufacturer={mfr} period={send.period} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ============================================
// HISTORY FILTERS COMPONENT
// ============================================

export type HistoryDataTypeFilter = 'All types' | 'POS' | 'POT' | 'POS + POT';

interface HistoryFiltersProps {
  filterPeriod: string;
  setFilterPeriod: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterDataType: HistoryDataTypeFilter;
  setFilterDataType: (value: HistoryDataTypeFilter) => void;
  periodOptions: string[];
  // Entity filter (rep firm or manufacturer)
  entityFilterValue: string;
  setEntityFilterValue: (value: string) => void;
  entityOptions: { id: string; name: string }[];
  entityLabel: string; // "All rep firms" or "All manufacturers"
  entityPlaceholder: string; // "All rep firms" or "All manufacturers"
}

export function HistoryFilters({
  filterPeriod,
  setFilterPeriod,
  filterStatus,
  setFilterStatus,
  filterDataType,
  setFilterDataType,
  periodOptions,
  entityFilterValue,
  setEntityFilterValue,
  entityOptions,
  entityLabel,
  entityPlaceholder,
}: HistoryFiltersProps) {
  return (
    <div className="flex gap-3">
      <Select value={filterPeriod} onValueChange={setFilterPeriod}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All periods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All periods">All periods</SelectItem>
          {periodOptions.map((period) => (
            <SelectItem key={period} value={period}>
              {period}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All statuses">All statuses</SelectItem>
          <SelectItem value="Delivered">Delivered</SelectItem>
          <SelectItem value="Sent with warnings">Sent with warnings</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={entityFilterValue} onValueChange={setEntityFilterValue}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder={entityPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={entityLabel}>{entityLabel}</SelectItem>
          {entityOptions.map((entity) => (
            <SelectItem key={entity.id} value={entity.name}>
              {entity.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterDataType} onValueChange={(v) => setFilterDataType(v as HistoryDataTypeFilter)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Data type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All types">All types</SelectItem>
          <SelectItem value="POS">POS</SelectItem>
          <SelectItem value="POT">POT</SelectItem>
          <SelectItem value="POS + POT">POS + POT</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================
// HISTORY PAGE HEADER COMPONENT
// ============================================

interface HistoryPageHeaderProps {
  title: string;
  description: string;
}

export function HistoryPageHeader({ title, description }: HistoryPageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

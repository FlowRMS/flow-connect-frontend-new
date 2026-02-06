'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MonthRangePicker } from '@/components/ui/month-range-picker';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Settings,
  Send,
  Wifi,
  Mail,
  Briefcase,
  Factory,
  X,
  FileSpreadsheet,
  Play,
  Pause,
  Eye,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadExchangeFiles } from '@/lib/uploadExchangeFilesGql';
import { toast } from 'sonner';
import { searchOrganizations } from '@/lib/graphql/manufacturer';
import { getAccessToken } from '@/lib/auth';

// ============================================
// Types
// ============================================

export type SendMethod = 'file' | 'integration' | 'sftp' | 'email' | 'none';
export type IntegrationMode = 'automatic' | 'hold';
export type DataType = 'pos' | 'pot' | 'pos_pot';

export interface UploadedFile {
  file: File;
  period: string;
  dataType: DataType;
  recipients: string[];
  status: 'pending' | 'validated' | 'error';
  recordCount?: number;
  issues?: { blocking: number; warnings: number; fyi: number };
  backendFileId?: string;
}

export interface Recipient {
  id: string;
  name: string;
  territory?: string;
}

// ============================================
// Send Success Banner
// ============================================

interface SendSuccessBannerProps {
  fileCount: number;
  recipientCount: number;
  recipientLabel: string; // "rep firms" or "manufacturers"
  historyLink: string;
  dashboardLink: string;
  dashboardLabel: string;
}

export function SendSuccessBanner({
  fileCount,
  recipientCount,
  recipientLabel,
  historyLink,
  dashboardLink,
  dashboardLabel,
}: SendSuccessBannerProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-green-900">Sent successfully</h2>
            <p className="text-green-700 mt-1">
              {fileCount} {fileCount === 1 ? 'file' : 'files'} sent to {recipientCount} {recipientLabel}
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" asChild>
                <Link href={historyLink}>View send record</Link>
              </Button>
              <Button variant="ghost">Download a copy</Button>
            </div>
          </div>
        </div>
      </div>

      <Button asChild>
        <Link href={dashboardLink}>{dashboardLabel}</Link>
      </Button>
    </div>
  );
}

// ============================================
// Send Method Not Configured Card
// ============================================

interface SendMethodNotConfiguredProps {
  setupLink: string;
}

export function SendMethodNotConfigured({ setupLink }: SendMethodNotConfiguredProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-8 text-center">
        <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">Send method not configured</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set up your preferred send method to start sending data.
        </p>
        <Button asChild>
          <Link href={setupLink}>Go to Setup</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// Send Method Card
// ============================================

interface SendMethodCardProps {
  sendMethod: SendMethod;
  integrationMode: IntegrationMode;
  onIntegrationModeChange: (mode: IntegrationMode) => void;
  onUploadClick: () => void;
  fileMethodDescription?: string;
  integrationMethodDescription?: string;
}

export function SendMethodCard({
  sendMethod,
  integrationMode,
  onIntegrationModeChange,
  onUploadClick,
  fileMethodDescription = 'Upload CSV or Excel files.',
  integrationMethodDescription = 'Data pushed automatically.',
}: SendMethodCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                sendMethod === 'file'
                  ? 'bg-blue-100'
                  : sendMethod === 'integration' || sendMethod === 'sftp'
                  ? 'bg-purple-100'
                  : 'bg-orange-100'
              )}
            >
              {sendMethod === 'file' && <Upload className="w-6 h-6 text-blue-600" />}
              {(sendMethod === 'integration' || sendMethod === 'sftp') && (
                <Wifi className="w-6 h-6 text-purple-600" />
              )}
              {sendMethod === 'email' && <Mail className="w-6 h-6 text-orange-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Send method:</span>
                <span className="font-medium">
                  {sendMethod === 'file' && 'File Upload'}
                  {sendMethod === 'integration' && 'API Integration'}
                  {sendMethod === 'sftp' && 'SFTP'}
                  {sendMethod === 'email' && 'Scheduled Email'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sendMethod === 'file' && fileMethodDescription}
                {(sendMethod === 'integration' || sendMethod === 'sftp') && integrationMethodDescription}
                {sendMethod === 'email' && 'Files will be sent on your schedule.'}
              </p>
            </div>
          </div>

          {/* Mode Toggle for Integration/SFTP */}
          {(sendMethod === 'integration' || sendMethod === 'sftp') && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Button
                  size="sm"
                  variant={integrationMode === 'automatic' ? 'default' : 'ghost'}
                  onClick={() => onIntegrationModeChange('automatic')}
                  className="gap-1"
                >
                  <Play className="w-3 h-3" />
                  Automatic
                </Button>
                <Button
                  size="sm"
                  variant={integrationMode === 'hold' ? 'default' : 'ghost'}
                  onClick={() => onIntegrationModeChange('hold')}
                  className="gap-1"
                >
                  <Pause className="w-3 h-3" />
                  Hold for review
                </Button>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    <strong>Automatic:</strong> Data sends automatically each month.
                  </p>
                  <p className="mt-1">
                    <strong>Hold:</strong> Review data before sending each month.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Upload Button for File Method */}
          {sendMethod === 'file' && (
            <Button onClick={onUploadClick}>
              <Upload className="w-4 h-4 mr-2" />
              Upload files
            </Button>
          )}
        </div>

        {/* Integration Status */}
        {(sendMethod === 'integration' || sendMethod === 'sftp') && (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Connection healthy</span>
                <span className="text-sm text-muted-foreground">
                  Last sync: Dec 15, 2024 at 2:30 PM
                </span>
              </div>
              {integrationMode === 'hold' && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending review
                  </Badge>
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Review data
                  </Button>
                </div>
              )}
              {integrationMode === 'automatic' && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Auto-send enabled
                  </Badge>
                  <span className="text-sm text-muted-foreground">Next send: Jan 5, 2025</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Uploaded Files List
// ============================================

interface UploadedFilesListProps {
  files: UploadedFile[];
  expandedFile: string | null;
  onExpandFile: (fileId: string | null) => void;
  onRemoveFile: (fileId: string) => void;
  onAddMore: () => void;
  recipientIcon: 'briefcase' | 'factory';
  issuesLink: string;
  deletingFile?: string | null;
}

export function UploadedFilesList({
  files,
  expandedFile,
  onExpandFile,
  onRemoveFile,
  onAddMore,
  recipientIcon,
  issuesLink,
  deletingFile,
}: UploadedFilesListProps) {
  const RecipientIcon = recipientIcon === 'briefcase' ? Briefcase : Factory;

  return (
    <Card>
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Files to send</h3>
          <Button variant="outline" size="sm" onClick={onAddMore}>
            <Upload className="w-4 h-4 mr-1" />
            Add more
          </Button>
        </div>
      </div>
      <CardContent className="pt-0 space-y-3">
        {files.map((upload, index) => {
          const fileId = upload.backendFileId || `temp-${index}`;
          return (
            <div key={fileId} className="border rounded-lg overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                onClick={() => onExpandFile(expandedFile === fileId ? null : fileId)}
              >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">{upload.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {upload.period} &middot; {upload.dataType.toUpperCase()} &middot;{' '}
                    {upload.recipients.length}{' '}
                    {recipientIcon === 'briefcase'
                      ? upload.recipients.length === 1
                        ? 'rep firm'
                        : 'rep firms'
                      : upload.recipients.length === 1
                      ? 'manufacturer'
                      : 'manufacturers'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {upload.status === 'validated' && upload.issues && (
                  <div className="flex items-center gap-2">
                    {upload.issues.blocking > 0 ? (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {upload.issues.blocking} blocking
                      </Badge>
                    ) : upload.issues.warnings > 0 ? (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {upload.issues.warnings} warnings
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>
                )}
                {upload.recordCount && (
                  <span className="text-sm text-muted-foreground">
                    {upload.recordCount.toLocaleString()} records
                  </span>
                )}
                {expandedFile === fileId ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedFile === fileId && (
              <div className="border-t p-4 bg-muted/20 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Sending to:</p>
                  <div className="flex flex-wrap gap-2">
                    {upload.recipients.map((recipient) => (
                      <Badge key={recipient} variant="outline">
                        <RecipientIcon className="w-3 h-3 mr-1" />
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Pre-flight check */}
                {upload.issues && (
                  <div>
                    <p className="text-sm font-medium mb-2">Pre-flight check:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        className={cn(
                          'p-2 rounded text-center',
                          upload.issues.blocking > 0 ? 'bg-red-50' : 'bg-green-50'
                        )}
                      >
                        <p
                          className={cn(
                            'text-lg font-semibold',
                            upload.issues.blocking > 0 ? 'text-red-700' : 'text-green-700'
                          )}
                        >
                          {upload.issues.blocking}
                        </p>
                        <p className="text-xs text-muted-foreground">Blocking</p>
                      </div>
                      <div
                        className={cn(
                          'p-2 rounded text-center',
                          upload.issues.warnings > 0 ? 'bg-yellow-50' : 'bg-muted/50'
                        )}
                      >
                        <p
                          className={cn(
                            'text-lg font-semibold',
                            upload.issues.warnings > 0 ? 'text-yellow-700' : ''
                          )}
                        >
                          {upload.issues.warnings}
                        </p>
                        <p className="text-xs text-muted-foreground">Warnings</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-lg font-semibold">{upload.issues.fyi}</p>
                        <p className="text-xs text-muted-foreground">FYI</p>
                      </div>
                    </div>
                    {upload.issues.blocking > 0 && (
                      <Button variant="outline" size="sm" className="mt-2" asChild>
                        <Link href={issuesLink}>Review issues</Link>
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview data
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileId && onRemoveFile(fileId)}
                    disabled={deletingFile === fileId}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingFile === fileId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ============================================
// Empty Files State
// ============================================

interface EmptyFilesStateProps {
  onUploadClick: () => void;
}

export function EmptyFilesState({ onUploadClick }: EmptyFilesStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium mb-2">No files uploaded yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload POS data files to send to your partners.
        </p>
        <Button onClick={onUploadClick}>
          <Upload className="w-4 h-4 mr-2" />
          Upload files
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// Send Action Bar
// ============================================

interface SendActionBarProps {
  fileCount: number;
  totalRecords: number;
  hasBlockingIssues: boolean;
  onSendClick: () => void;
  issuesLink: string;
  isSending?: boolean;
}

export function SendActionBar({
  fileCount,
  totalRecords,
  hasBlockingIssues,
  onSendClick,
  issuesLink,
  isSending = false,
}: SendActionBarProps) {
  return (
    <div className="sticky bottom-0 bg-background border-t -mx-6 px-6 py-4 mt-6">
      <div className="flex items-center justify-between max-w-4xl">
        <div className="text-sm text-muted-foreground">
          {fileCount} {fileCount === 1 ? 'file' : 'files'} &middot;{' '}
          {totalRecords.toLocaleString()} total records
        </div>
        <div className="flex items-center gap-3">
          {hasBlockingIssues ? (
            <>
              <Button disabled>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              <span className="text-sm text-muted-foreground">Fix blocking issues to send.</span>
              <Button variant="outline" asChild>
                <Link href={issuesLink}>Review issues</Link>
              </Button>
            </>
          ) : (
            <Button onClick={onSendClick} disabled={fileCount === 0 || isSending}>
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending {fileCount === 1 ? 'file' : 'files'}...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {fileCount} {fileCount === 1 ? 'file' : 'files'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Confirm Send Modal
// ============================================

interface ConfirmSendModalProps {
  files: UploadedFile[];
  recipientCount: number;
  recipientLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSending?: boolean;
}

export function ConfirmSendModal({
  files,
  recipientCount,
  recipientLabel,
  onConfirm,
  onCancel,
  isSending = false,
}: ConfirmSendModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-2">Confirm send</h3>
        <p className="text-muted-foreground mb-4">
          Send {files.length} {files.length === 1 ? 'file' : 'files'} to {recipientCount}{' '}
          {recipientLabel}?
        </p>
        <div className="p-3 rounded-lg bg-muted/50 mb-4 space-y-1">
          {files.map((f) => (
            <div key={f.file.name} className="flex justify-between text-sm">
              <span>{f.file.name}</span>
              <span className="text-muted-foreground">{f.recordCount?.toLocaleString()} records</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Confirm send'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Upload Modal
// ============================================

interface UploadModalProps {
  recipients?: Recipient[]; // Optional - will fetch if not provided
  recipientType: 'repFirms' | 'manufacturers'; // Determines what to fetch
  recipientLabel: string; // "rep firms" or "manufacturers"
  recipientIcon: 'briefcase' | 'factory';
  title: string;
  onClose: () => void;
  onUpload: (files: UploadedFile[]) => void;
  isLoadingRecipients?: boolean; // Show loading state for recipients
}

export function UploadModal({
  recipients: recipientsProp,
  recipientType,
  recipientLabel,
  recipientIcon,
  title,
  onClose,
  onUpload,
  isLoadingRecipients: isLoadingRecipientsProp,
}: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [period, setPeriod] = useState(() => {
    // Default to current month
    const now = new Date();
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'];
    return `${months[now.getMonth()]}-${now.getFullYear()}`;
  });
  const [dataType, setDataType] = useState<DataType>('pos');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Recipient fetching state
  const [recipients, setRecipients] = useState<Recipient[]>(recipientsProp || []);
  const [isLoadingRecipientsInternal, setIsLoadingRecipientsInternal] = useState(!recipientsProp);
  const [recipientError, setRecipientError] = useState<string | null>(null);

  // Use prop value if provided, otherwise use internal state
  const isLoadingRecipients = isLoadingRecipientsProp !== undefined
    ? isLoadingRecipientsProp
    : isLoadingRecipientsInternal;

  const RecipientIcon = recipientIcon === 'briefcase' ? Briefcase : Factory;

  // Sync recipients from prop when it changes
  useEffect(() => {
    if (recipientsProp) {
      setRecipients(recipientsProp);
    }
  }, [recipientsProp]);

  // Fetch recipients when modal opens if not provided as prop
  useEffect(() => {
    const loadRecipients = async () => {
      // Skip if recipients already provided or already loaded
      if (recipientsProp || recipients.length > 0) {
        setIsLoadingRecipientsInternal(false);
        return;
      }

      setIsLoadingRecipientsInternal(true);
      setRecipientError(null);

      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const fetchedOrgs = await searchOrganizations(
          {
            searchTerm: '',
            repFirms: false,
            connected: true,
            limit: 5,
          },
          token
        );

        console.log('Fetched organizations for recipients:', fetchedOrgs);

        // Map to Recipient format
        const mappedRecipients: Recipient[] = fetchedOrgs.map((org) => ({
          id: org.id,
          name: org.name,
          territory: org.domain || undefined,
        }));

        setRecipients(mappedRecipients);
      } catch (error) {
        console.error('Failed to load recipients:', error);
        setRecipientError('Failed to load recipients. Please try again.');
        toast.error('Failed to load recipients');
      } finally {
        setIsLoadingRecipientsInternal(false);
      }
    };

    loadRecipients();
  }, [recipientType, recipientsProp, recipients.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    setIsValidating(true);

    try {
      // Get authentication token
      const token = await getAccessToken();
      if (!token) {
        toast.error('Authentication failed. Please sign in again.');
        setIsValidating(false);
        return;
      }

      // Get target organization IDs from selected recipients (selectedRecipients already contains IDs)
      const targetOrgIds = selectedRecipients;

      // Determine data type flags
      const isPos = dataType === 'pos' || dataType === 'pos_pot';
      const isPot = dataType === 'pot' || dataType === 'pos_pot';

      // Format reporting period for backend
      // Single month: "december-2024" -> "2024-12"
      // Range: "october-2024 to december-2024" -> "2024-10 to 2024-12"
      const monthMap: Record<string, string> = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12',
      };

      const formatSinglePeriod = (p: string): string => {
        const [monthStr, yearStr] = p.split('-');
        return `${yearStr}-${monthMap[monthStr]}`;
      };

      let reportingPeriod: string;
      if (period.includes(' to ')) {
        const [startPeriod, endPeriod] = period.split(' to ');
        reportingPeriod = `${formatSinglePeriod(startPeriod)} to ${formatSinglePeriod(endPeriod)}`;
      } else {
        reportingPeriod = formatSinglePeriod(period);
      }

      // Upload files
      const responses = await uploadExchangeFiles(
        {
          files: selectedFiles,
          reportingPeriod,
          isPos,
          isPot,
          targetOrgIds,
        },
        token
      );

      // Convert API responses to UploadedFile format
      // Format period for display (e.g., "december-2024" -> "December 2024")
      const monthFullNames: Record<string, string> = {
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
      };

      const formatDisplayPeriod = (p: string): string => {
        const [monthStr, yearStr] = p.split('-');
        return `${monthFullNames[monthStr]} ${yearStr}`;
      };

      let displayPeriod: string;
      if (period.includes(' to ')) {
        const [startPeriod, endPeriod] = period.split(' to ');
        displayPeriod = `${formatDisplayPeriod(startPeriod)} - ${formatDisplayPeriod(endPeriod)}`;
      } else {
        displayPeriod = formatDisplayPeriod(period);
      }

      // Get recipient names for display (selectedRecipients contains IDs)
      const selectedRecipientNames = recipients
        .filter((r) => selectedRecipients.includes(r.id))
        .map((r) => r.name);

      const uploads: UploadedFile[] = selectedFiles.map((file, index) => {
        const response = responses[index];
        return {
          file,
          period: displayPeriod,
          dataType,
          recipients: selectedRecipientNames,
          status: 'validated' as const,
          recordCount: response?.rowCount || 0,
          backendFileId: response?.id,
          issues: {
            blocking: 0,
            warnings: 0,
            fyi: 0,
          },
        };
      });

      toast.success(
        `${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'} uploaded successfully`
      );
      onUpload(uploads);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files. Please try again.');
      setIsValidating(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map((r) => r.id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <Label className="mb-2 block">Files</Label>
            <label
              className={cn(
                'block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                selectedFiles.length > 0
                  ? 'border-green-500 bg-green-50'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              {selectedFiles.length > 0 ? (
                <div>
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="font-medium">
                    {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedFiles.map((f) => f.name).join(', ')}
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">CSV, XLS, XLSX (max 50MB each)</p>
                </>
              )}
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Reporting Period */}
          <div>
            <Label className="mb-2 block">Reporting period</Label>
            <MonthRangePicker
              value={period}
              onValueChange={setPeriod}
              allowRange={true}
              placeholder="Select reporting period"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Select a single month or a range of months
            </p>
          </div>

          {/* Data Type */}
          <div>
            <Label className="mb-2 block">Data type</Label>
            <div className="flex gap-2">
              <Button
                variant={dataType === 'pos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDataType('pos')}
              >
                POS only
              </Button>
              <Button
                variant={dataType === 'pot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDataType('pot')}
              >
                POT only
              </Button>
              <Button
                variant={dataType === 'pos_pot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDataType('pos_pot')}
              >
                POS + POT
              </Button>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Send to {recipientLabel}</Label>
              {!isLoadingRecipients && !recipientError && (
                <Button variant="ghost" size="sm" onClick={toggleAllRecipients}>
                  {selectedRecipients.length === recipients.length ? 'Deselect all' : 'Select all'}
                </Button>
              )}
            </div>

            {/* Loading State */}
            {isLoadingRecipients && (
              <div className="border rounded-lg p-8 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading {recipientLabel}...</p>
              </div>
            )}

            {/* Error State */}
            {recipientError && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <p className="text-sm text-red-700">{recipientError}</p>
              </div>
            )}

            {/* Recipients List */}
            {!isLoadingRecipients && !recipientError && (
              <>
                <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                  {recipients.map((recipient) => (
                    <label
                      key={recipient.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedRecipients.includes(recipient.id)}
                        onCheckedChange={() => toggleRecipient(recipient.id)}
                      />
                      <RecipientIcon className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span>{recipient.name}</span>
                        {recipient.territory && (
                          <p className="text-xs text-muted-foreground">{recipient.territory}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedRecipients.length} of {recipients.length} selected
                </p>
              </>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              selectedFiles.length === 0 ||
              selectedRecipients.length === 0 ||
              isValidating ||
              isLoadingRecipients ||
              !!recipientError
            }
          >
            {isValidating ? (
              <>Validating...</>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & validate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

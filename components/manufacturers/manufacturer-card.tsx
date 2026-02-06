import Link from 'next/link';
import { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Factory,
  Mail,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  Settings2,
  Tags,
  CheckCircle,
  FileText,
  Upload,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManufacturerContact } from '@/lib/organizationsGqlSdk';

type InviteStatus = 'active' | 'pending' | 'expired' | 'no_invite' | 'not_on_platform';

type StatusConfig = {
  label: string;
  icon: typeof Check;
  className: string;
};

const statusConfig: Record<InviteStatus, StatusConfig> = {
  active: { label: 'Active', icon: Check, className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  no_invite: { label: 'Not Invited', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
  expired: { label: 'Expired', icon: AlertCircle, className: 'bg-red-100 text-red-700' },
  not_on_platform: { label: 'Not on Platform', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
};

type ManufacturerCardProps = {
  manufacturer: ManufacturerContact;
  onResendInvite?: (id: string) => void;
  onSendInvite?: (id: string) => void;
  onUploadAgreement?: (id: string, file: File) => void;
  isUploadingAgreement?: boolean;
  isSendingInvite?: boolean;
};

export function ManufacturerCard({ manufacturer, onResendInvite, onSendInvite, onUploadAgreement, isUploadingAgreement = false, isSendingInvite = false }: ManufacturerCardProps) {
  const status = statusConfig[manufacturer.inviteStatus];
  const StatusIcon = status.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log("manufacturer--------:", manufacturer);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadAgreement) {
      onUploadAgreement(manufacturer.id, file);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Factory className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{manufacturer.name}</p>
            <p className="text-sm text-muted-foreground">{manufacturer.domain}</p>
            {manufacturer.contactEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {manufacturer.contactFirstName || manufacturer.contactLastName
                  ? `${manufacturer.contactFirstName || ''} ${manufacturer.contactLastName || ''}`.trim() + ' - '
                  : ''
                }
                {manufacturer.contactEmail}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {manufacturer.inviteStatus === 'active' && manufacturer.lastSendDate && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Last sent: {new Date(manufacturer.lastSendDate).toLocaleDateString()}</span>
            </div>
          )}
          <Badge className={status.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          {manufacturer.inviteStatus === 'pending' && onResendInvite && (
            <Button variant="outline" size="sm" onClick={() => onResendInvite(manufacturer.id)}>
              <Mail className="w-4 h-4 mr-1" />
              Resend
            </Button>
          )}
          {manufacturer.inviteStatus === 'no_invite' && onSendInvite && (
            <Button size="sm" onClick={() => onSendInvite(manufacturer.id)} disabled={isSendingInvite}>
              {isSendingInvite ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-1" />
                  Send Invite
                </>
              )}
            </Button>
          )}
          {manufacturer.inviteStatus === 'active' && manufacturer.configuredAt && (
            <p className="text-sm text-muted-foreground">
              Since {new Date(manufacturer.configuredAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      {manufacturer.inviteStatus === 'active' && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="w-4 h-4 mr-1" />
              {manufacturer.hasCustomMappings ? 'Edit Custom Mappings' : 'Create Custom Mappings'}
            </Button>
            <Link href={`/nemra-pos/distributor/setup/routing?manufacturer=${manufacturer.id}`}>
              <Button variant="outline" size="sm">
                <Tags className="w-4 h-4 mr-1" />
                Edit Aliases
              </Button>
            </Link>
            {manufacturer.hasCustomMappings && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                Custom Mappings Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{manufacturer.agreementFileName || 'Data Sharing Agreement'}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploadingAgreement}
            />
            <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={isUploadingAgreement}>
              {isUploadingAgreement ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  {manufacturer.agreementFileName ? 'Replace Agreement' : 'Upload Agreement'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

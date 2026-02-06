import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Mail,
  Check,
  Clock,
  AlertCircle,
  Settings2,
  CheckCircle,
  FileText,
  Upload,
  Calendar,
} from 'lucide-react';
import type { ExtendedDistributorContact } from '@/lib/nemra-pos-data';

type StatusConfig = {
  label: string;
  icon: typeof Check;
  className: string;
};

const statusConfig: Record<'active' | 'pending' | 'no_invite' | 'expired', StatusConfig> = {
  active: { label: 'Active', icon: Check, className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  no_invite: { label: 'Not Invited', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
  expired: { label: 'Expired', icon: AlertCircle, className: 'bg-red-100 text-red-700' },
};

type ManufacturerDistributorCardProps = {
  distributor: ExtendedDistributorContact;
  onResendInvite?: (id: string) => void;
  onSendInvite?: (id: string) => void;
  onEditMappings?: (id: string) => void;
  onUploadAgreement?: (id: string) => void;
};

export function ManufacturerDistributorCard({
  distributor,
  onResendInvite,
  onSendInvite,
  onEditMappings,
  onUploadAgreement,
}: ManufacturerDistributorCardProps) {
  const status = statusConfig[distributor.inviteStatus];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{distributor.name}</p>
            <p className="text-sm text-muted-foreground">{distributor.domain}</p>
            {distributor.contactEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {distributor.contactFirstName || distributor.contactLastName
                  ? `${distributor.contactFirstName || ''} ${distributor.contactLastName || ''}`.trim() + ' - '
                  : ''
                }
                {distributor.contactEmail}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Last Receive Date */}
          {distributor.inviteStatus === 'active' && distributor.lastReceiveDate && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Last received: {new Date(distributor.lastReceiveDate).toLocaleDateString()}</span>
            </div>
          )}
          <Badge className={status.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          {distributor.inviteStatus === 'pending' && onResendInvite && (
            <Button variant="outline" size="sm" onClick={() => onResendInvite(distributor.id)}>
              <Mail className="w-4 h-4 mr-1" />
              Resend
            </Button>
          )}
          {distributor.inviteStatus === 'no_invite' && onSendInvite && (
            <Button size="sm" onClick={() => onSendInvite(distributor.id)}>
              <Mail className="w-4 h-4 mr-1" />
              Send Invite
            </Button>
          )}
          {distributor.inviteStatus === 'active' && distributor.configuredAt && (
            <p className="text-sm text-muted-foreground">
              Since {new Date(distributor.configuredAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      {/* Custom Mappings, Aliases, and Data Sharing Agreement for active distributors */}
      {distributor.inviteStatus === 'active' && (
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onEditMappings && (
              <Button variant="outline" size="sm" onClick={() => onEditMappings(distributor.id)}>
                <Settings2 className="w-4 h-4 mr-1" />
                {distributor.hasCustomMappings ? 'Edit Custom Mappings' : 'Create Custom Mappings'}
              </Button>
            )}
            {distributor.hasCustomMappings && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                Custom Mappings Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>Data Sharing Agreement</span>
            </div>
            {onUploadAgreement && (
              <Button variant="outline" size="sm" onClick={() => onUploadAgreement(distributor.id)}>
                <Upload className="w-4 h-4 mr-1" />
                Upload Agreement
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

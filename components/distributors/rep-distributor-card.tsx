import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Factory,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RepDistributorContact } from '@/lib/nemra-pos-data';

type RepDistributorStatus = 'on_flowconnect' | 'invited' | 'not_invited';

type StatusConfig = {
  label: string;
  icon: typeof CheckCircle;
  className: string;
};

const statusConfig: Record<RepDistributorStatus, StatusConfig> = {
  on_flowconnect: { label: 'On FlowConnect', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  invited: { label: 'Invited', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  not_invited: { label: 'Not Invited', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
};

type RepDistributorCardProps = {
  distributor: RepDistributorContact;
  onFollowUp?: (id: string) => void;
  onInvite?: (id: string) => void;
  onRequestPosData?: (id: string) => void;
};

export function RepDistributorCard({
  distributor,
  onFollowUp,
  onInvite,
  onRequestPosData
}: RepDistributorCardProps) {
  const status = statusConfig[distributor.status];
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
          <Badge className={status.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          {distributor.status === 'invited' && distributor.invitedAt && (
            <span className="text-sm text-muted-foreground">
              Invited {new Date(distributor.invitedAt).toLocaleDateString()}
            </span>
          )}
          {distributor.status === 'invited' && onFollowUp && (
            <Button variant="outline" size="sm" onClick={() => onFollowUp(distributor.id)}>
              <Mail className="w-4 h-4 mr-1" />
              Follow Up
            </Button>
          )}
          {distributor.status === 'not_invited' && onInvite && (
            <Button size="sm" onClick={() => onInvite(distributor.id)}>
              <Send className="w-4 h-4 mr-1" />
              Invite to FlowConnect
            </Button>
          )}
        </div>
      </div>

      {distributor.status === 'on_flowconnect' && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {distributor.connectedManufacturers !== undefined && distributor.connectedManufacturers > 0 ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <Factory className="w-3 h-3 mr-1" />
                  Sending to {distributor.connectedManufacturers} of your manufacturers
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Factory className="w-3 h-3 mr-1" />
                  Not yet sending to your manufacturers
                </Badge>
              )}
              {distributor.totalManufacturers !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {distributor.totalManufacturers} total manufacturers on FlowConnect
                </span>
              )}
            </div>
            {(distributor.connectedManufacturers === undefined || distributor.connectedManufacturers === 0) && onRequestPosData && (
              <Button size="sm" onClick={() => onRequestPosData(distributor.id)}>
                <Send className="w-4 h-4 mr-1" />
                Request POS Data
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

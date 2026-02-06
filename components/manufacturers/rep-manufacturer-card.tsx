import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Factory,
  Mail,
  Check,
  Clock,
  X,
  AlertCircle,
  Calendar,
  Eye,
  EyeOff,
  MapPin,
  Send,
  FileCheck,
  FileText,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManufacturerContact } from '@/lib/organizationsGqlSdk';

type RepinviteStatus = 'active' | 'pending' | 'expired' | 'not_on_platform' | 'no_invite';
type DataVisibility = 'full' | 'limited' | 'none';

type inviteStatusConfig = {
  label: string;
  icon: typeof Check;
  className: string;
};

type VisibilityConfig = {
  label: string;
  icon: typeof Eye;
  className: string;
};

const inviteStatusConfig: Record<RepinviteStatus, inviteStatusConfig> = {
  active: { label: 'Reporting', icon: Check, className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  expired: { label: 'Expired', icon: X, className: 'bg-red-100 text-red-700' },
  no_invite: { label: 'Not Invited', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
  not_on_platform: { label: 'Not on Platform', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
};

const visibilityConfig: Record<DataVisibility, VisibilityConfig> = {
  full: { label: 'Full Access', icon: Eye, className: 'bg-green-100 text-green-700' },
  limited: { label: 'Limited Access', icon: EyeOff, className: 'bg-yellow-100 text-yellow-700' },
  none: { label: 'No Access', icon: Lock, className: 'bg-red-100 text-red-700' },
};

type RepManufacturerCardProps = {
  manufacturer: ManufacturerContact;
  onFollowUp?: (id: string) => void;
  onViewVisibilityDetails?: (id: string, name: string) => void;
};

export function RepManufacturerCard({ manufacturer, onFollowUp, onViewVisibilityDetails }: RepManufacturerCardProps) {
  const inviteStatus = inviteStatusConfig[manufacturer.inviteStatus as RepinviteStatus] || inviteStatusConfig.not_on_platform;
  const inviteStatusIcon = inviteStatus.icon;
  const visibility = manufacturer.dataVisibility ? visibilityConfig[manufacturer.dataVisibility as DataVisibility] : null;

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
          {manufacturer.inviteStatus === 'active' && manufacturer.lastReportedDate && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Last: {new Date(manufacturer.lastReportedDate).toLocaleDateString()}</span>
            </div>
          )}
          <Badge className={inviteStatus.className}>
            {/* <inviteStatusIcon className="w-3 h-3 mr-1" /> */}
            {inviteStatus.label}
          </Badge>
          {manufacturer.inviteStatus === 'pending' && onFollowUp && (
            <Button variant="outline" size="sm" onClick={() => onFollowUp(manufacturer.id)}>
              <Mail className="w-4 h-4 mr-1" />
              Follow Up
            </Button>
          )}
          {manufacturer.inviteStatus === 'not_on_platform' && (
            <Button size="sm" asChild>
              <Link href="/nemra-pos/rep/nudge">
                <Send className="w-4 h-4 mr-1" />
                Nudge
              </Link>
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
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {visibility && (
                <div className="flex items-center gap-2">
                  {manufacturer.dataVisibility === 'limited' && onViewVisibilityDetails ? (
                    <button
                      onClick={() => onViewVisibilityDetails(manufacturer.id, manufacturer.name)}
                      className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    >
                      <Badge variant="outline" className={cn("text-xs cursor-pointer", visibility.className)}>
                        <visibility.icon className="w-3 h-3 mr-1" />
                        {visibility.label}
                      </Badge>
                      <span className="text-xs text-primary underline">View details</span>
                    </button>
                  ) : (
                    <Badge variant="outline" className={cn("text-xs", visibility.className)}>
                      <visibility.icon className="w-3 h-3 mr-1" />
                      {visibility.label}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">POS Data Access</span>
                </div>
              )}

              {manufacturer.territories && manufacturer.territories.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{manufacturer.territories.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {manufacturer.hasDataAgreement ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <FileCheck className="w-3 h-3 mr-1" />
                    Agreement on File
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <FileText className="w-3 h-3 mr-1" />
                    No Agreement
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/nemra-pos/rep/data-grid">
                  <Eye className="w-4 h-4 mr-1" />
                  View Data
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

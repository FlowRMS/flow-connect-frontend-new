import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Mail,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  Eye,
  MapPin,
  Send,
  FileCheck,
  FileText,
  Pencil,
  Users,
} from 'lucide-react';
import type { RepFirmForManufacturer, RepFirmStatus } from '@/lib/nemra-pos-data';

type StatusConfig = {
  label: string;
  icon: typeof Check;
  className: string;
};

const statusConfig: Record<RepFirmStatus, StatusConfig> = {
  active: { label: 'Connected', icon: Check, className: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  not_connected: { label: 'Not Connected', icon: AlertCircle, className: 'bg-gray-100 text-gray-700' },
};

type RepFirmCardProps = {
  repFirm: RepFirmForManufacturer;
  territories: string[];
  repFirmColor: string;
  onEditTerritories: () => void;
  onFollowUp?: () => void;
  onInvite?: () => void;
  onViewDetails?: () => void;
};

export function RepFirmCard({
  repFirm,
  territories,
  repFirmColor,
  onEditTerritories,
  onFollowUp,
  onInvite,
  onViewDetails,
}: RepFirmCardProps) {
  const status = statusConfig[repFirm.status];
  const StatusIcon = status.icon;

  return (
    <div className="p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">{repFirm.name}</p>
            {repFirm.contactName && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {repFirm.contactName} - {repFirm.contactEmail}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {repFirm.status === 'active' && repFirm.lastDataSent && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Last: {new Date(repFirm.lastDataSent).toLocaleDateString()}</span>
            </div>
          )}
          <Badge className={status.className}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
          {repFirm.status === 'pending' && onFollowUp && (
            <Button variant="outline" size="sm" onClick={onFollowUp}>
              <Mail className="w-4 h-4 mr-1" />
              Follow Up
            </Button>
          )}
          {repFirm.status === 'not_connected' && onInvite && (
            <Button size="sm" onClick={onInvite}>
              <Send className="w-4 h-4 mr-1" />
              Invite
            </Button>
          )}
          {repFirm.status === 'active' && repFirm.connectedAt && (
            <p className="text-sm text-muted-foreground">
              Since {new Date(repFirm.connectedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Territory chips */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
            <MapPin className="w-3 h-3" />
            <span className="font-medium">States:</span>
          </div>
          {territories.length > 0 ? (
            <>
              {territories.map(state => (
                <Badge
                  key={state}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${repFirmColor}20`,
                    color: repFirmColor,
                    borderColor: repFirmColor,
                  }}
                >
                  {state}
                </Badge>
              ))}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No states assigned</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-2"
            onClick={onEditTerritories}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Additional details for active rep firms */}
      {repFirm.status === 'active' && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {repFirm.orgCount && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{repFirm.orgCount} distributors in territory</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {repFirm.hasAgreement ? (
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
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails}>
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

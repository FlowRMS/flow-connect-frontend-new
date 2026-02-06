import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Briefcase,
  Mail,
  Check,
  Plus,
  MapPin,
  CheckCircle,
  Users,
  Phone,
} from 'lucide-react';

type RepFirmDirectoryEntry = {
  id: string;
  name: string;
  territories: string[];
  contactEmail: string;
  contactName?: string;
  contactPhone?: string;
  manufacturerCount: number;
  membershipTier: 'nemra' | 'flowconnect';
};

type RepFirmDirectoryCardProps = {
  repFirm: RepFirmDirectoryEntry;
  isInYourNetwork: boolean;
  onConnect?: () => void;
};

export function RepFirmDirectoryCard({
  repFirm,
  isInYourNetwork,
  onConnect,
}: RepFirmDirectoryCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{repFirm.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {repFirm.territories.join(', ')}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1">
          {repFirm.membershipTier === 'flowconnect' && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              FlowConnect Member
            </Badge>
          )}
          {repFirm.membershipTier === 'nemra' && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              NEMRA
            </Badge>
          )}
          {repFirm.manufacturerCount > 0 && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              <Users className="w-3 h-3 mr-1" />
              {repFirm.manufacturerCount} manufacturers
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-1">Contact</p>
          <p className="text-sm font-medium truncate">{repFirm.contactName}</p>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Mail className="w-3 h-3 shrink-0" />
            {repFirm.contactEmail}
          </p>
          {repFirm.contactPhone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 shrink-0" />
              {repFirm.contactPhone}
            </p>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isInYourNetwork ? (
            <Badge className="bg-green-100 text-green-700 w-full justify-center py-1.5">
              <Check className="w-3 h-3 mr-1" />
              In Your Network
            </Badge>
          ) : (
            <Button size="sm" className="w-full" onClick={onConnect}>
              <Plus className="w-4 h-4 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

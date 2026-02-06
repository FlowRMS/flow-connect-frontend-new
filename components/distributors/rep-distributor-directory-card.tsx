import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Mail,
  CheckCircle,
  Factory,
  Plus,
  Check,
  Users,
} from 'lucide-react';

type MembershipTier = 'nemra-free' | 'nemra-paid' | 'flowconnect';
type POSContact = { name: string; email: string; phone: string };

type DistributorDirectoryEntry = {
  id: string;
  name: string;
  domain: string;
  posContacts: POSContact[];
  membershipTier: MembershipTier;
  manufacturerCount: number;
  category: string;
};

type RepDistributorDirectoryCardProps = {
  distributor: DistributorDirectoryEntry;
  isTracking: boolean;
  onAddToOutreach?: (id: string) => void;
  onViewContacts?: (name: string, contacts: POSContact[]) => void;
};

export function RepDistributorDirectoryCard({
  distributor,
  isTracking,
  onAddToOutreach,
  onViewContacts
}: RepDistributorDirectoryCardProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{distributor.name}</p>
          <p className="text-xs text-muted-foreground truncate">{distributor.domain}</p>
        </div>
      </div>

      <Badge variant="outline" className="text-xs">{distributor.category}</Badge>

      <div className="flex flex-wrap gap-1">
        {distributor.membershipTier === 'flowconnect' && (
          <Badge className="bg-green-100 text-green-700 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            FlowConnect Member
          </Badge>
        )}
        {distributor.membershipTier === 'nemra-paid' && (
          <Badge className="bg-blue-100 text-blue-700 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            NEMRA POS Paid
          </Badge>
        )}
        {distributor.membershipTier === 'nemra-free' && (
          <Badge variant="outline" className="text-muted-foreground text-xs">
            NEMRA POS Free
          </Badge>
        )}
        {distributor.manufacturerCount > 0 && (
          <Badge className="bg-purple-100 text-purple-700 text-xs">
            <Factory className="w-3 h-3 mr-1" />
            {distributor.manufacturerCount} mfrs
          </Badge>
        )}
      </div>

      <div className="pt-2 border-t">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-muted-foreground">
            POS Contact{distributor.posContacts.length > 1 ? 's' : ''}
          </p>
          {distributor.posContacts.length > 1 && onViewContacts && (
            <button
              onClick={() => onViewContacts(distributor.name, distributor.posContacts)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              {distributor.posContacts.length} contacts
            </button>
          )}
        </div>
        <p className="text-sm font-medium truncate">{distributor.posContacts[0].name}</p>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
          <Mail className="w-3 h-3 shrink-0" />
          {distributor.posContacts[0].email}
        </p>
      </div>

      <div className="pt-2">
        {isTracking ? (
          <Badge className="bg-green-100 text-green-700 w-full justify-center py-1.5">
            <Check className="w-3 h-3 mr-1" />
            Tracking
          </Badge>
        ) : (
          onAddToOutreach && (
            <Button size="sm" className="w-full" onClick={() => onAddToOutreach(distributor.id)}>
              <Plus className="w-4 h-4 mr-1" />
              Add to Outreach
            </Button>
          )
        )}
      </div>
    </div>
  );
}

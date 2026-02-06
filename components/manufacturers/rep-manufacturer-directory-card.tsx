import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Factory,
  Mail,
  Plus,
  Check,
  Users,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import type { ManufacturerDirectoryEntry, POSContact } from '@/lib/organizationsGqlSdk';

type RepManufacturerDirectoryCardProps = {
  manufacturer: ManufacturerDirectoryEntry;
  isInNetwork: boolean;
  onViewContacts?: (manufacturer: string, contacts: POSContact[]) => void;
  onRequestAccess?: (id: string) => void;
};

export function RepManufacturerDirectoryCard({
  manufacturer,
  isInNetwork,
  onViewContacts,
  onRequestAccess,
}: RepManufacturerDirectoryCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Factory className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{manufacturer.name}</p>
            <p className="text-xs text-muted-foreground truncate">{manufacturer.domain}</p>
          </div>
        </div>

        {/* Category */}
        <Badge variant="outline" className="text-xs">{manufacturer.category}</Badge>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1">
          {manufacturer.membershipTier === 'flowconnect' && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              FlowConnect Member
            </Badge>
          )}
          {manufacturer.membershipTier === 'nemra-paid' && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              NEMRA POS Paid
            </Badge>
          )}
          {manufacturer.membershipTier === 'nemra-free' && (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              NEMRA POS Free
            </Badge>
          )}
          {manufacturer.orgCount > 0 && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              <Users className="w-3 h-3 mr-1" />
              {manufacturer.orgCount} reps
            </Badge>
          )}
        </div>

        {/* Territories */}
        {/* {manufacturer.territories && manufacturer.territories.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{manufacturer.territories.join(', ')}</span>
          </div>
        )} */}

        {/* POS Contacts */}
        {/* <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">
              POS Contact{manufacturer.posContacts.length > 1 ? 's' : ''}
            </p>
            {manufacturer.posContacts.length > 1 && onViewContacts && (
              <button
                onClick={() => onViewContacts(manufacturer.name, manufacturer.posContacts)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Users className="w-3 h-3" />
                {manufacturer.posContacts.length} contacts
              </button>
            )}
          </div>
          {manufacturer.posContacts && manufacturer.posContacts.length > 0 ? (
            <>
              <p className="text-sm font-medium truncate">{manufacturer.posContacts[0].name}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Mail className="w-3 h-3 shrink-0" />
                {manufacturer.posContacts[0].email}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">No POS contacts</p>
          )}
        </div> */}

        {/* Action Button */}
        <div className="pt-2">
          {isInNetwork ? (
            <Badge className="bg-green-100 text-green-700 w-full justify-center py-1.5">
              <Check className="w-3 h-3 mr-1" />
              In Your Network
            </Badge>
          ) : (
            <Button size="sm" className="w-full" onClick={() => onRequestAccess?.(manufacturer.id)}>
              <Plus className="w-4 h-4 mr-1" />
              Request Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Mail,
  CheckCircle,
  Factory,
  Plus,
  Check,
} from 'lucide-react';
import type { DistributorDirectoryEntry } from '@/lib/nemra-pos-data';

type ManufacturerDistributorDirectoryCardProps = {
  distributor: DistributorDirectoryEntry;
  isAlreadyAdded: boolean;
  onViewContacts?: (distributor: DistributorDirectoryEntry) => void;
  onAdd?: (id: string) => void;
};

export function ManufacturerDistributorDirectoryCard({
  distributor,
  isAlreadyAdded,
  onViewContacts,
  onAdd,
}: ManufacturerDistributorDirectoryCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{distributor.name}</p>
            <p className="text-xs text-muted-foreground truncate">{distributor.domain}</p>
          </div>
        </div>

        {/* Category */}
        <Badge variant="outline" className="text-xs">{distributor.category}</Badge>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1">
          {distributor.membershipTier === 'flowconnect' && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              FlowConnect Member
            </Badge>
          )}
          {(distributor.membershipTier === 'nemra-paid' || distributor.membershipTier === 'nemra-free') && (
            <Badge className="bg-blue-100 text-blue-700 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              NEMRA POS
            </Badge>
          )}
          {distributor.manufacturerCount > 0 && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              <Factory className="w-3 h-3 mr-1" />
              {distributor.manufacturerCount}
            </Badge>
          )}
        </div>

        {/* POS Contacts */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">
              POS Contact{distributor.posContacts.length > 1 ? 's' : ''}
            </p>
            {distributor.posContacts.length > 1 && onViewContacts && (
              <button
                onClick={() => onViewContacts(distributor)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Building2 className="w-3 h-3" />
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

        {/* Action Button */}
        <div className="pt-2">
          {isAlreadyAdded ? (
            <Badge className="bg-green-100 text-green-700 w-full justify-center py-1.5">
              <Check className="w-3 h-3 mr-1" />
              Already Added
            </Badge>
          ) : (
            onAdd && (
              <Button size="sm" className="w-full" onClick={() => onAdd(distributor.id)}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

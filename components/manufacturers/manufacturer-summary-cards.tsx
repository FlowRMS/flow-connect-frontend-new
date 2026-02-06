import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, AlertCircle } from 'lucide-react';

type ManufacturerSummaryCardsProps = {
  activeCount: number;
  pendingCount: number;
  notInvitedCount: number;
  onFilterChange: (status: 'active' | 'pending' | 'no_invite') => void;
};

export function ManufacturerSummaryCards({
  activeCount,
  pendingCount,
  notInvitedCount,
  onFilterChange,
}: ManufacturerSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="cursor-pointer hover:border-green-300" onClick={() => onFilterChange('active')}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Ready to Receive</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:border-yellow-300" onClick={() => onFilterChange('pending')}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Invites</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:border-gray-300" onClick={() => onFilterChange('no_invite')}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-600">{notInvitedCount}</p>
              <p className="text-sm text-muted-foreground">Not Invited</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

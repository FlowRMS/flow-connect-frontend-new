import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, AlertCircle } from 'lucide-react';
import type { RepFirmStatus } from '@/lib/nemra-pos-data';

type RepFirmSummaryCardsProps = {
  connectedCount: number;
  pendingCount: number;
  notConnectedCount: number;
  onFilterChange: (filter: 'all' | RepFirmStatus) => void;
};

export function RepFirmSummaryCards({
  connectedCount,
  pendingCount,
  notConnectedCount,
  onFilterChange
}: RepFirmSummaryCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card
        className="cursor-pointer hover:border-green-300 transition-colors"
        onClick={() => onFilterChange('active')}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:border-yellow-300 transition-colors"
        onClick={() => onFilterChange('pending')}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:border-gray-300 transition-colors"
        onClick={() => onFilterChange('not_connected')}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-600">{notConnectedCount}</p>
              <p className="text-sm text-muted-foreground">Not Connected</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

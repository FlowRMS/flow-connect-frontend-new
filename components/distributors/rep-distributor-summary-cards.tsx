import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

type SummaryCardProps = {
  onFlowConnectCount: number;
  invitedCount: number;
  notInvitedCount: number;
  onFilterChange: (filter: 'all' | 'on_flowconnect' | 'invited' | 'not_invited') => void;
};

export function RepDistributorSummaryCards({
  onFlowConnectCount,
  invitedCount,
  notInvitedCount,
  onFilterChange
}: SummaryCardProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card
        className="cursor-pointer hover:border-green-300 transition-colors"
        onClick={() => onFilterChange('on_flowconnect')}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">{onFlowConnectCount}</p>
              <p className="text-sm text-muted-foreground">On FlowConnect</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:border-yellow-300 transition-colors"
        onClick={() => onFilterChange('invited')}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">{invitedCount}</p>
              <p className="text-sm text-muted-foreground">Invited</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      <Card
        className="cursor-pointer hover:border-gray-300 transition-colors"
        onClick={() => onFilterChange('not_invited')}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-600">{notInvitedCount}</p>
              <p className="text-sm text-muted-foreground">Not Yet Invited</p>
            </div>
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

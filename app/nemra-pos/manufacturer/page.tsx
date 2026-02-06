import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Building2,
  Briefcase,
  ArrowRight,
  Clock,
  AlertCircle,
  Calendar,
  Package,
  Truck as TruckIcon,
  Eye,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  UserPlus,
  Mail,
  Download,
  Send,
  CalendarDays,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getManufacturerDashboard } from '@/lib/gqlSdk';

type OverallStatus = 'green' | 'yellow' | 'red';

interface ActionIssue {
  id: string;
  severity: 'blocking' | 'warning';
  title: string;
  description: string;
  context: {
    source?: string;
    sourceType?: 'distributor' | 'rep';
    period?: string;
    affectedRows?: number;
    orderId?: string;
    orderValue?: number;
  };
  linkTo: string;
}

interface PendingDistributor {
  id: string;
  name: string;
  requestedAt: string;
  status: 'pending' | 'expired';
}

interface PendingRepFirm {
  id: string;
  name: string;
  territories: string[];
  requestedAt: string;
  status: 'pending' | 'awaiting_data';
}

interface Message {
  id: string;
  from: string;
  fromType: 'distributor' | 'rep';
  companyName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  read: boolean;
  fileRef?: string;
}

interface LotOrder {
  id: string;
  distributor: string;
  orderNumber: string;
  orderType: 'direct_ship' | 'project';
  productInfo: string;
  value: number;
  submittedAt: string;
}

function getOverallStatus(issues: ActionIssue[]): { status: OverallStatus; blockingCount: number; warningCount: number } {
  const blocking = issues.filter(i => i.severity === 'blocking');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (blocking.length > 0) {
    return { status: 'red', blockingCount: blocking.length, warningCount: warnings.length };
  }
  if (warnings.length > 0) {
    return { status: 'yellow', blockingCount: 0, warningCount: warnings.length };
  }
  return { status: 'green', blockingCount: 0, warningCount: 0 };
}

export default async function ManufacturerDashboard() {
  const dashboard = await getManufacturerDashboard();
  const actionIssues: ActionIssue[] = dashboard.actionIssues ?? [];
  const pendingDistributors = dashboard.pendingDistributors ?? [];
  const pendingRepFirms = dashboard.pendingRepFirms ?? [];
  const lotOrders = dashboard.lotOrders ?? [];
  const messages = dashboard.messages ?? [];

  const { status, blockingCount, warningCount } = getOverallStatus(actionIssues);
  const activeDistributors = (dashboard.distributors ?? []).filter(d => d.status === 'active' || d.status === 'forwarding');
  const activeReps = (dashboard.repFirms ?? []).filter(r => r.status === 'active');
  const unreadMessages = messages.filter(m => !m.read).length;
  const pendingLotOrders = lotOrders.length;
  const totalPendingValue = lotOrders.reduce((sum, o) => sum + (o.value || 0), 0);

  const statusConfig = {
    green: {
      label: 'All set',
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800',
      pill: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    yellow: {
      label: 'Needs attention',
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      pill: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    red: {
      label: 'Action required',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-800',
      pill: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const blockingIssues = actionIssues.filter((i: ActionIssue) => i.severity === 'blocking');
  const warningIssues = actionIssues.filter((i: ActionIssue) => i.severity === 'warning');

  return (
    <div className="w-full max-w-full space-y-4 md:space-y-6 lg:space-y-8 overflow-x-hidden">

      {/* Status Strip */}
      <div className={cn('rounded-lg md:rounded-xl border p-4 md:p-6 shadow-sm', config.bg, config.border)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-medium text-sm md:text-base', config.pill)}>
              <StatusIcon className={cn('w-4 h-4 md:w-5 md:h-5', config.iconColor)} />
              {config.label}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Last data received:</span>
              <span className="font-medium text-foreground">Dec 28, 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Data coverage:</span>
              <span className="font-medium text-foreground">92% complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* At a Glance */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg lg:text-xl font-medium">At a glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {/* Issues requiring attention */}
            <div className={cn(
              'p-3 md:p-4 rounded-lg md:rounded-xl border transition-all hover:shadow-md',
              blockingCount > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
              warningCount > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
              'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            )}>
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                {blockingCount > 0 ? (
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" />
                ) : warningCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
                )}
                <span className={cn(
                  'text-xs md:text-sm font-medium',
                  blockingCount > 0 ? 'text-red-700 dark:text-red-400' :
                  warningCount > 0 ? 'text-yellow-700 dark:text-yellow-400' :
                  'text-green-700 dark:text-green-400'
                )}>Issues</span>
              </div>
              <p className={cn(
                'text-xl md:text-2xl lg:text-3xl font-semibold',
                blockingCount > 0 ? 'text-red-900 dark:text-red-300' :
                warningCount > 0 ? 'text-yellow-900 dark:text-yellow-300' :
                'text-green-900 dark:text-green-300'
              )}>
                {blockingCount > 0 ? blockingCount : warningCount > 0 ? warningCount : 0}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                {blockingCount > 0 ? 'need action' : warningCount > 0 ? 'warnings' : 'all clear'}
              </p>
            </div>

            {/* Lot orders pending */}
            <div className={cn(
              'p-3 md:p-4 rounded-lg md:rounded-xl border transition-all hover:shadow-md',
              pendingLotOrders > 0 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-muted/50'
            )}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <TruckIcon className={cn('w-4 h-4 md:w-5 md:h-5', pendingLotOrders > 0 && 'text-amber-600 dark:text-amber-400')} />
                <span className={cn('text-xs md:text-sm', pendingLotOrders > 0 && 'text-amber-700 dark:text-amber-400 font-medium')}>Lot Orders</span>
              </div>
              <p className={cn('text-xl md:text-2xl lg:text-3xl font-semibold', pendingLotOrders > 0 && 'text-amber-900 dark:text-amber-300')}>
                {pendingLotOrders}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                {pendingLotOrders > 0 ? `$${totalPendingValue.toLocaleString()} pending` : 'none pending'}
              </p>
            </div>

            {/* Messages */}
            <div className={cn(
              'p-3 md:p-4 rounded-lg md:rounded-xl border transition-all hover:shadow-md',
              unreadMessages > 0 ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : 'bg-muted/50'
            )}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <MessageSquare className={cn('w-4 h-4 md:w-5 md:h-5', unreadMessages > 0 && 'text-blue-600 dark:text-blue-400')} />
                <span className={cn('text-xs md:text-sm', unreadMessages > 0 && 'text-blue-700 dark:text-blue-400 font-medium')}>Messages</span>
              </div>
              <p className={cn('text-xl md:text-2xl lg:text-3xl font-semibold', unreadMessages > 0 && 'text-blue-900 dark:text-blue-300')}>
                {unreadMessages}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                {unreadMessages > 0 ? 'unread' : 'all read'}
              </p>
            </div>

            {/* Distributors */}
            <div className="p-3 md:p-4 rounded-lg md:rounded-xl border bg-muted/50 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <Building2 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm">Distributors</span>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-semibold">{activeDistributors.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                {pendingDistributors.length > 0 ? `+${pendingDistributors.length} pending` : 'all active'}
              </p>
            </div>

            {/* Rep Firms */}
            <div className="p-3 md:p-4 rounded-lg md:rounded-xl border bg-muted/50 transition-all hover:shadow-md">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm">Rep Firms</span>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-semibold">{activeReps.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
                {pendingRepFirms.length > 0 ? `+${pendingRepFirms.length} pending` : 'all active'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What needs your attention */}
      {(status === 'red' || status === 'yellow') && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg lg:text-xl font-medium">What needs your attention</CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'red' && (
              <div className="space-y-3 md:space-y-4">
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  {blockingCount} {blockingCount === 1 ? 'item needs' : 'items need'} your attention.
                </p>
                <div className="space-y-2 md:space-y-3">
                  {blockingIssues.slice(0, 3).map((issue) => (
                    <Link
                      key={issue.id}
                      href={issue.linkTo}
                      className="block p-4 md:p-5 rounded-lg md:rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 md:gap-4">
                        <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-red-900 dark:text-red-300">{issue.title}</p>
                          <p className="text-xs md:text-sm text-red-700 dark:text-red-400 mt-0.5 md:mt-1">{issue.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2 md:mt-3">
                            {issue.context.source && (
                              <Badge variant="outline" className="bg-white/50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 text-xs">
                                {issue.context.sourceType === 'distributor' ? (
                                  <Building2 className="w-3 h-3 mr-1" />
                                ) : (
                                  <Briefcase className="w-3 h-3 mr-1" />
                                )}
                                {issue.context.source}
                              </Badge>
                            )}
                            {issue.context.period && (
                              <Badge variant="outline" className="bg-white/50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {issue.context.period}
                              </Badge>
                            )}
                            {issue.context.orderId && (
                              <Badge variant="outline" className="bg-white/50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 text-xs">
                                <Package className="w-3 h-3 mr-1" />
                                {issue.context.orderId}
                              </Badge>
                            )}
                            {issue.context.orderValue && (
                              <Badge variant="outline" className="bg-white/50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 text-xs">
                                ${issue.context.orderValue.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-red-400 dark:text-red-500 flex-shrink-0 self-start sm:self-center" />
                      </div>
                    </Link>
                  ))}
                </div>
                {blockingIssues.length > 3 && (
                  <Button variant="outline" asChild className="mt-2 md:mt-4 w-full sm:w-auto min-h-[44px] md:min-h-[40px]">
                    <Link href="/dashboard/apps/nemra-pos/manufacturers/send-issues">
                      View all {blockingIssues.length} issues
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {status === 'yellow' && (
              <div className="space-y-3 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-4">
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 w-fit">
                    No blockers
                  </Badge>
                  <span className="text-sm md:text-base text-muted-foreground">
                    {warningCount} {warningCount === 1 ? 'warning' : 'warnings'} to review
                  </span>
                </div>
                <div className="space-y-2 md:space-y-3">
                  {warningIssues.slice(0, 2).map((issue) => (
                    <Link
                      key={issue.id}
                      href={issue.linkTo}
                      className="block p-3 md:p-4 rounded-lg md:rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 hover:bg-yellow-100 dark:hover:bg-yellow-950/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-yellow-900 dark:text-yellow-300">{issue.title}</p>
                          <p className="text-xs md:text-sm text-yellow-700 dark:text-yellow-400 mt-0.5 md:mt-1">{issue.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 dark:text-yellow-500 flex-shrink-0 self-start sm:self-center" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Green state card */}
      {status === 'green' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <CardTitle className="text-base md:text-lg lg:text-xl font-medium">All caught up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-4 md:p-5 rounded-lg md:rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm md:text-base text-green-900 dark:text-green-300">No issues found</p>
                <p className="text-xs md:text-sm text-green-700 dark:text-green-400 mt-1">
                  All data is flowing smoothly from {activeDistributors.length} distributors to {activeReps.length} rep firms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lot Orders Section (if any pending) */}
      {pendingLotOrders > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
              <CardTitle className="text-base md:text-lg lg:text-xl font-medium flex items-center gap-2">
                <TruckIcon className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                Lot Orders Awaiting Approval
              </CardTitle>
              <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 text-xs md:text-sm">
                {pendingLotOrders} pending • ${totalPendingValue.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 md:space-y-3">
              {lotOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      {order.orderType === 'direct_ship' ? (
                        <TruckIcon className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Package className="w-5 h-5 md:w-6 md:h-6 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <p className="font-medium text-sm md:text-base truncate">{order.distributor}</p>
                        <Badge variant="outline" className="text-xs w-fit">
                          {order.orderType === 'direct_ship' ? 'Direct Ship' : 'Project'}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {order.orderNumber} • {order.productInfo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <span className="font-medium text-sm md:text-base">${order.value.toLocaleString()}</span>
                    <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-[36px] text-xs md:text-sm">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Review</span>
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 min-h-[44px] md:min-h-[36px] text-xs md:text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Approve</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {lotOrders.length > 3 && (
              <Button variant="link" asChild className="mt-2 md:mt-4 px-0 text-xs md:text-sm">
                <Link href="/dashboard/apps/nemra-pos/manufacturers/lot-orders">
                  View all {lotOrders.length} lot orders
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Connection Requests & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Connection Requests Panel */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
              <CardTitle className="text-base md:text-lg lg:text-xl font-medium flex items-center gap-2">
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                Connection Requests
              </CardTitle>
              <Badge variant="outline" className="text-xs md:text-sm w-fit">
                {pendingDistributors.length + pendingRepFirms.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {(pendingDistributors.length + pendingRepFirms.length) === 0 ? (
              <div className="text-center py-6 md:py-8">
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto text-green-500 dark:text-green-400 mb-2 md:mb-3" />
                <p className="text-sm md:text-base text-muted-foreground">All connections approved</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {pendingDistributors.map((dist) => (
                  <div key={dist.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <Building2 className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{dist.name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Requested {new Date(dist.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-[36px] text-xs md:text-sm flex-1 sm:flex-none">Review</Button>
                      <Button size="sm" className="min-h-[44px] md:min-h-[36px] text-xs md:text-sm flex-1 sm:flex-none">Connect</Button>
                    </div>
                  </div>
                ))}
                {pendingRepFirms.map((rep) => (
                  <div key={rep.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base truncate">{rep.name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {rep.territories.join(', ')} • Requested {new Date(rep.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" className="min-h-[44px] md:min-h-[36px] text-xs md:text-sm flex-1 sm:flex-none">Review</Button>
                      <Button size="sm" className="min-h-[44px] md:min-h-[36px] text-xs md:text-sm flex-1 sm:flex-none">Approve</Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-2 md:mt-4">
                  <Button variant="outline" className="flex-1 min-h-[44px] md:min-h-[40px] text-xs md:text-sm" asChild>
                    <Link href="/dashboard/apps/nemra-pos/manufacturers/setup/distributors">
                      Manage Distributors
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1 min-h-[44px] md:min-h-[40px] text-xs md:text-sm" asChild>
                    <Link href="/dashboard/apps/nemra-pos/manufacturers/setup/rep-firms">
                      Manage Rep Firms
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Panel */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
              <CardTitle className="text-base md:text-lg lg:text-xl font-medium flex items-center gap-2">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                Messages
              </CardTitle>
              {unreadMessages > 0 && (
                <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs md:text-sm">{unreadMessages} unread</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-6 md:py-8">
                <Mail className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-2 md:mb-3" />
                <p className="text-sm md:text-base text-muted-foreground">No messages</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {messages.slice(0, 3).map((msg) => (
                  <Link
                    key={msg.id}
                    href={`/dashboard/apps/nemra-pos/manufacturers/messages?id=${msg.id}`}
                    className={cn(
                      'block p-3 md:p-4 rounded-lg md:rounded-xl border transition-colors hover:bg-muted/50',
                      !msg.read && 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                    )}
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className={cn(
                        'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-medium flex-shrink-0',
                        msg.fromType === 'manufacturer' ? 'bg-primary/10 text-primary' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      )}>
                        {msg.from.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <p className={cn('font-medium text-xs md:text-sm', !msg.read && 'text-blue-900 dark:text-blue-300')}>
                            {msg.from}
                          </p>
                          <Badge variant="outline" className="text-xs py-0 w-fit">
                            {msg.fromType === 'manufacturer' ? (
                              <><Building2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />{msg.companyName}</>
                            ) : (
                              <><Briefcase className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />{msg.companyName}</>
                            )}
                          </Badge>
                        </div>
                        <p className={cn('text-xs md:text-sm', !msg.read ? 'text-blue-800 dark:text-blue-300 font-medium' : 'text-foreground')}>
                          {msg.subject}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground truncate mt-0.5 md:mt-1">{msg.preview}</p>
                      </div>
                      {!msg.read && (
                        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                ))}
                <Button variant="outline" className="w-full mt-2 md:mt-4 min-h-[44px] md:min-h-[40px] text-xs md:text-sm" asChild>
                  <Link href="/dashboard/apps/nemra-pos/manufacturers/messages">
                    View all messages
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Received */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg lg:text-xl font-medium">Recent data received</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {activeDistributors.slice(0, 4).map((dist) => (
              <Link
                key={dist.id}
                href="/dashboard/apps/nemra-pos/manufacturers/received-data"
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base truncate">{dist.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {dist.recordCount?.toLocaleString()} records • December 2024
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs md:text-sm"
                  >
                    <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />
                    Received
                  </Badge>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {dist.lastReceived && new Date(dist.lastReceived).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
          <Button variant="link" asChild className="mt-2 md:mt-4 px-0 text-xs md:text-sm">
            <Link href="/dashboard/apps/nemra-pos/manufacturers/received-data">View all received data</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Link href="/dashboard/apps/nemra-pos/manufacturers/data-coverage">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full shadow-sm">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm md:text-base">Data Coverage</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Check monthly status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/apps/nemra-pos/manufacturers/send">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full shadow-sm">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Send className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm md:text-base">Send to Reps</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Distribute data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/apps/nemra-pos/manufacturers/analytics/highlights">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full shadow-sm">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm md:text-base">Analytics</p>
                  <p className="text-xs md:text-sm text-muted-foreground">View insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/apps/nemra-pos/manufacturers/data-grid">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full shadow-sm">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Eye className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm md:text-base">Data Viewer</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Browse all records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}


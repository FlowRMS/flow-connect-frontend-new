import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Factory,
  Building2,
  FileText,
  ArrowRight,
  AlertCircle,
  DollarSign,
  Send,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Mail,
  UserPlus,
  Download,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRepDashboard } from '@/lib/gqlSdk';

type OverallStatus = 'green' | 'yellow' | 'red';

interface ActionItem {
  id: string;
  severity: 'blocking' | 'warning' | 'info';
  title: string;
  description: string;
  context: {
    manufacturer?: string;
    distributor?: string;
    month?: string;
    daysOverdue?: number;
  };
  actionLabel: string;
  linkTo: string;
}

interface Message {
  id: string;
  from: string;
  fromType: 'manufacturer' | 'distributor';
  companyName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  read: boolean;
}

function getOverallStatus(items: ActionItem[]): { status: OverallStatus; blockingCount: number; warningCount: number } {
  const blocking = items.filter(i => i.severity === 'blocking');
  const warnings = items.filter(i => i.severity === 'warning');

  if (blocking.length > 0) {
    return { status: 'red', blockingCount: blocking.length, warningCount: warnings.length };
  }
  if (warnings.length > 0) {
    return { status: 'yellow', blockingCount: 0, warningCount: warnings.length };
  }
  return { status: 'green', blockingCount: 0, warningCount: 0 };
}

export default async function RepDashboard() {
  const dashboard = await getRepDashboard();
  const stats = dashboard.stats;
  const actionItems: ActionItem[] = dashboard.actionItems ?? [];
  const messages: Message[] = dashboard.messages ?? [];
  const pendingConnections = dashboard.pendingConnections ?? [];
  const reportingManus = (dashboard.manufacturers ?? []).filter(m => m.status === 'reporting');
  const notReportingManus = (dashboard.manufacturers ?? []).filter(m => m.status !== 'reporting');

  const recentData = (dashboard.manufacturers ?? [])
    .filter(m => m.status === 'reporting')
    .flatMap(m => (m.monthsReported ?? []).slice(0, 2).map(month => ({ ...month, manu: m.name })))
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
    .slice(0, 4);

  const lastReceived = recentData[0];

  const { status, blockingCount, warningCount } = getOverallStatus(actionItems);
  const unreadMessages = messages.filter(m => !m.read).length;

  const statusConfig = {
    green: {
      label: 'All caught up',
      bg: 'bg-green-50',
      border: 'border-green-200',
      pill: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    yellow: {
      label: 'Needs attention',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      pill: 'bg-yellow-100 text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
    },
    red: {
      label: 'Action required',
      bg: 'bg-red-50',
      border: 'border-red-200',
      pill: 'bg-red-100 text-red-800',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const blockingItems = actionItems.filter(i => i.severity === 'blocking');
  const warningItems = actionItems.filter(i => i.severity === 'warning');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Status Strip */}
      <div className={cn('rounded-lg border p-4', config.bg, config.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full font-medium', config.pill)}>
              <StatusIcon className={cn('w-4 h-4', config.iconColor)} />
              {config.label}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Last data received:</span>
              <span className="font-medium text-foreground">
                {lastReceived ? new Date(lastReceived.receivedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Manufacturers reporting:</span>
              <span className="font-medium text-foreground">{reportingManus.length} of {(dashboard.manufacturers ?? []).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* At a Glance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">At a glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {/* Issues */}
            <div className={cn(
              'p-4 rounded-lg border',
              blockingCount > 0 ? 'bg-red-50 border-red-200' :
              warningCount > 0 ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200'
            )}>
              <div className="flex items-center gap-2 mb-1">
                {blockingCount > 0 ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : warningCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  blockingCount > 0 ? 'text-red-700' :
                  warningCount > 0 ? 'text-yellow-700' :
                  'text-green-700'
                )}>Action Items</span>
              </div>
              <p className={cn(
                'text-2xl font-semibold',
                blockingCount > 0 ? 'text-red-900' :
                warningCount > 0 ? 'text-yellow-900' :
                'text-green-900'
              )}>
                {blockingCount + warningCount}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {blockingCount > 0 ? `${blockingCount} urgent` : warningCount > 0 ? 'to review' : 'all clear'}
              </p>
            </div>

            {/* Partners */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Factory className="w-4 h-4" />
                <span className="text-sm">Manufacturers</span>
              </div>
              <p className="text-2xl font-semibold">{reportingManus.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notReportingManus.length > 0 ? `${notReportingManus.length} not reporting` : 'all reporting'}
              </p>
            </div>

            {/* Messages */}
            <div className={cn(
              'p-4 rounded-lg',
              unreadMessages > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'
            )}>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className={cn('w-4 h-4', unreadMessages > 0 && 'text-blue-600')} />
                <span className={cn('text-sm', unreadMessages > 0 && 'text-blue-700 font-medium')}>Messages</span>
              </div>
              <p className={cn('text-2xl font-semibold', unreadMessages > 0 && 'text-blue-900')}>
                {unreadMessages}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadMessages > 0 ? 'unread' : 'all read'}
              </p>
            </div>

            {/* Data this month */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Records (Nov)</span>
              </div>
              <p className="text-2xl font-semibold">{stats.totalRecords.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+12%</span> vs Oct
              </p>
            </div>

            {/* Revenue */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Revenue (Nov)</span>
              </div>
              <p className="text-lg font-semibold">${(stats.totalAmount / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600">+8%</span> vs Oct
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What needs your attention */}
      {(status === 'red' || status === 'yellow') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">What needs your attention</CardTitle>
          </CardHeader>
          <CardContent>
            {blockingCount > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground">
                  {blockingCount} urgent {blockingCount === 1 ? 'item' : 'items'} requiring action
                </p>
                {blockingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-red-200 bg-red-50"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-red-900">{item.title}</p>
                        <p className="text-sm text-red-700 mt-0.5">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.context.manufacturer && (
                            <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                              <Factory className="w-3 h-3 mr-1" />
                              {item.context.manufacturer}
                            </Badge>
                          )}
                          {item.context.month && (
                            <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {item.context.month}
                            </Badge>
                          )}
                          {item.context.daysOverdue && (
                            <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                              {item.context.daysOverdue} days overdue
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" className="flex-shrink-0" asChild>
                        <Link href={item.linkTo}>
                          {item.actionLabel}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {warningCount > 0 && (
              <div className="space-y-3">
                {blockingCount > 0 && (
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    {warningCount} other {warningCount === 1 ? 'item' : 'items'} to review
                  </p>
                )}
                {warningItems.slice(0, blockingCount > 0 ? 2 : 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-yellow-200 bg-yellow-50"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-yellow-900">{item.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.context.manufacturer && (
                            <span className="text-xs text-yellow-700">{item.context.manufacturer}</span>
                          )}
                          {item.context.distributor && (
                            <span className="text-xs text-yellow-700">{item.context.distributor}</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="flex-shrink-0" asChild>
                        <Link href={item.linkTo}>
                          {item.actionLabel}
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4 pt-4 border-t">
              <Button asChild>
                <Link href="/nemra-pos/rep/nudge">
                  <Send className="w-4 h-4 mr-2" />
                  Send Nudges
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/nemra-pos/rep/data-coverage">View Data Coverage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Green state */}
      {status === 'green' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">You're all set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">All manufacturers reporting</p>
                <p className="text-sm text-green-700">You're receiving data from all {reportingManus.length} manufacturers on schedule.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button asChild>
                <Link href="/nemra-pos/rep/data-grid">
                  View Data
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/nemra-pos/rep/export">Export Data</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column: Pending Connections & Messages */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pending Connections */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-muted-foreground" />
                Pending Connections
              </CardTitle>
              <Badge variant="outline">{pendingConnections.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingConnections.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">All connection requests resolved</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingConnections.map((conn) => (
                  <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      {conn.type === 'manufacturer' ? (
                        <Factory className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{conn.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Requested {new Date(conn.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Awaiting
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href="/nemra-pos/rep/manufacturers">
                    Manage connections
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                Messages
              </CardTitle>
              {unreadMessages > 0 && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">{unreadMessages} unread</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.slice(0, 3).map((msg) => (
                  <Link
                    key={msg.id}
                    href={`/nemra-pos/rep/messages?id=${msg.id}`}
                    className={cn(
                      'block p-3 rounded-lg border transition-colors hover:bg-muted/50',
                      !msg.read && 'bg-blue-50/50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                        msg.fromType === 'manufacturer' ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-700'
                      )}>
                        {msg.from.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('font-medium text-sm', !msg.read && 'text-blue-900')}>
                            {msg.from}
                          </p>
                          <Badge variant="outline" className="text-xs py-0">
                            {msg.fromType === 'manufacturer' ? (
                              <><Factory className="w-2.5 h-2.5 mr-1" />{msg.companyName}</>
                            ) : (
                              <><Building2 className="w-2.5 h-2.5 mr-1" />{msg.companyName}</>
                            )}
                          </Badge>
                        </div>
                        <p className={cn('text-sm', !msg.read ? 'text-blue-800 font-medium' : 'text-foreground')}>
                          {msg.subject}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.preview}</p>
                      </div>
                      {!msg.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href="/nemra-pos/rep/messages">
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Recent data received</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentData.map((item, i) => (
              <Link
                key={i}
                href="/nemra-pos/rep/data-grid"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.manu}</p>
                    <p className="text-sm text-muted-foreground">{item.month}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{item.recordCount.toLocaleString()} records</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
          <Button variant="link" asChild className="mt-2 px-0">
            <Link href="/nemra-pos/rep/data-coverage">View full data coverage</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Bottom CTA */}
      <div className="flex items-center justify-between pt-2">
        <Button asChild size="lg">
          <Link href="/nemra-pos/rep/data-grid">
            View All Data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/nemra-pos/rep/export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/nemra-pos/rep/nudge">
              <Send className="w-4 h-4 mr-2" />
              Send Nudges
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Factory,
  FileText,
  Send,
  AlertTriangle,
  Calendar,
  Users,
  MessageSquare,
  UserPlus,
  Mail,
} from 'lucide-react';
import { mockDataSends } from '@/lib/nemra-pos-data';
import { cn } from '@/lib/utils';
import { getDistributorDashboard } from '@/lib/gqlSdk';

type OverallStatus = 'green' | 'yellow' | 'red';

interface ActionIssue {
  id: string;
  severity: 'blocking' | 'warning';
  title: string;
  description: string;
  context: {
    fileName?: string;
    period?: string;
    manufacturer?: string;
    affectedRows: number;
  };
  linkTo: string;
}

interface PendingManufacturer {
  id: string;
  name: string;
  invitedAt?: string;
  status: 'pending' | 'expired' | 'active';
}

interface Message {
  id: string;
  from: string;
  fromType: 'manufacturer' | 'rep';
  companyName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  read: boolean;
  fileRef?: string;
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

export default async function DistributorHome() {
  const dashboard = await getDistributorDashboard();
  const stats = dashboard.distributorStats;
  const actionIssues: ActionIssue[] = dashboard.actionIssues ?? [];
  const manufacturers: PendingManufacturer[] = dashboard.manufacturers ?? [];
  const messagesList: Message[] = dashboard.messages ?? [];

  const { status, blockingCount, warningCount } = getOverallStatus(actionIssues);
  const lastSend = (stats?.recentSends && stats.recentSends.length > 0) ? stats.recentSends[0] : mockDataSends[0];
  const activeManufacturers = manufacturers.filter((m) => m.status === 'active');
  const pendingManufacturers = manufacturers.filter((m) => m.status === 'pending');
  const unreadMessages = messagesList.filter((m) => !m.read).length;

  const statusConfig = {
    green: {
      label: 'All set',
      bg: 'bg-green-50',
      border: 'border-green-200',
      pill: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-600',
    },
    yellow: {
      label: 'Needs attention soon',
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

  const blockingIssues = actionIssues.filter(i => i.severity === 'blocking');
  const warningIssues = actionIssues.filter(i => i.severity === 'warning');

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
              <span>Last successful send:</span>
              <span className="font-medium text-foreground">
                {lastSend ? new Date(lastSend.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Never'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Next scheduled send:</span>
              <span className="font-medium text-foreground">No schedule set</span>
            </div>
          </div>
        </div>
      </div>

      {/* At a Glance - More Useful Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">At a glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {/* Issues requiring attention */}
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
                )}>Issues</span>
              </div>
              <p className={cn(
                'text-2xl font-semibold',
                blockingCount > 0 ? 'text-red-900' :
                warningCount > 0 ? 'text-yellow-900' :
                'text-green-900'
              )}>
                {blockingCount > 0 ? blockingCount : warningCount > 0 ? warningCount : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {blockingCount > 0 ? 'blocking sends' : warningCount > 0 ? 'warnings' : 'all clear'}
              </p>
            </div>

            {/* Partners receiving */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Partners</span>
              </div>
              <p className="text-2xl font-semibold">{activeManufacturers.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingManufacturers.length > 0 ? `+${pendingManufacturers.length} pending` : 'all active'}
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

            {/* Last delivery */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Last delivery</span>
              </div>
              <p className="text-lg font-semibold">
                {lastSend ? new Date(lastSend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lastSend ? `${lastSend.recordCount.toLocaleString()} records` : 'no sends yet'}
              </p>
            </div>

            {/* Next scheduled */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Next scheduled</span>
              </div>
              <p className="text-lg font-semibold">Not set</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <Link href="/nemra-pos/distributor/setup/send-method" className="text-primary hover:underline">
                  Configure schedule
                </Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Card: What needs your attention */}
      {(status === 'red' || status === 'yellow') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">What needs your attention</CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'red' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  We found {blockingCount} {blockingCount === 1 ? 'item' : 'items'} that need attention before sending.
                </p>
                <div className="space-y-2">
                  {blockingIssues.slice(0, 3).map((issue) => (
                    <Link
                      key={issue.id}
                      href={issue.linkTo}
                      className="block p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-red-900">{issue.title}</p>
                          <p className="text-sm text-red-700 mt-0.5">{issue.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {issue.context.fileName && (
                              <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                {issue.context.fileName}
                              </Badge>
                            )}
                            {issue.context.period && (
                              <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                                <Calendar className="w-3 h-3 mr-1" />
                                {issue.context.period}
                              </Badge>
                            )}
                            {issue.context.manufacturer && (
                              <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                                <Factory className="w-3 h-3 mr-1" />
                                {issue.context.manufacturer}
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-white/50 text-red-800 border-red-300 text-xs">
                              {issue.context.affectedRows} rows affected
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-red-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
                {blockingIssues.length > 3 && (
                  <Button variant="outline" asChild className="mt-2">
                    <Link href="/nemra-pos/distributor/issues">
                      View all {blockingIssues.length} issues
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {status === 'yellow' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Send allowed
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {warningCount} {warningCount === 1 ? 'warning' : 'warnings'} found
                  </span>
                </div>
                <div className="space-y-2">
                  {warningIssues.slice(0, 2).map((issue) => (
                    <Link
                      key={issue.id}
                      href={issue.linkTo}
                      className="block p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-yellow-900">{issue.title}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {issue.context.fileName && (
                              <span className="text-xs text-yellow-700">{issue.context.fileName}</span>
                            )}
                            <span className="text-xs text-yellow-700">{issue.context.affectedRows} rows</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="flex gap-3 mt-4">
                  <Button asChild>
                    <Link href="/nemra-pos/distributor/send">
                      Send this period's data
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/nemra-pos/distributor/issues">Review warnings</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Green state card */}
      {status === 'green' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Ready to send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">No issues found</p>
                <p className="text-sm text-green-700">Your data is ready to send to {activeManufacturers.length} partners.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button asChild>
                <Link href="/nemra-pos/distributor/send">
                  Send this period's data
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/nemra-pos/distributor/history">View history</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Pending Manufacturers & Messages */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pending Manufacturers Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-muted-foreground" />
                Pending Manufacturers
              </CardTitle>
              <Badge variant="outline">{pendingManufacturers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingManufacturers.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">All manufacturers are connected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingManufacturers.map((mfr) => (
                  <div key={mfr.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Factory className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{mfr.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Invited {mfr.invitedAt ? new Date(mfr.invitedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {mfr.status === 'pending' ? 'Awaiting response' : 'Expired'}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2" asChild>
                  <Link href="/nemra-pos/distributor/manufacturers">
                    Manage manufacturers
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Panel */}
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
            {messagesList.length === 0 ? (
              <div className="text-center py-6">
                <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messagesList.slice(0, 3).map((msg) => (
                  <Link
                    key={msg.id}
                    href={`/nemra-pos/distributor/messages?id=${msg.id}`}
                    className={cn(
                      'block p-3 rounded-lg border transition-colors hover:bg-muted/50',
                      !msg.read && 'bg-blue-50/50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                        msg.fromType === 'manufacturer' ? 'bg-primary/10 text-primary' : 'bg-purple-100 text-purple-700'
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
                              msg.companyName
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
                  <Link href="/nemra-pos/distributor/messages">
                    View all messages
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Recent deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockDataSends.slice(0, 3).map((send) => (
              <Link
                key={send.id}
                href="/nemra-pos/distributor/history"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {send.period}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {send.recordCount.toLocaleString()} records to {send.manufacturers.length} {send.manufacturers.length === 1 ? 'partner' : 'partners'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      send.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                      send.status === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    )}
                  >
                    {send.status === 'sent' ? 'Delivered' : send.status === 'partial' ? 'Partial' : 'Failed'}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
          <Button variant="link" asChild className="mt-2 px-0">
            <Link href="/nemra-pos/distributor/history">View all history</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Bottom CTA Row */}
      <div className="flex items-center justify-between pt-2">
        <Button asChild size="lg">
          <Link href="/nemra-pos/distributor/send">
            Send this period's data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

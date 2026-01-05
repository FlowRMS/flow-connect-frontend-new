/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { workflowAPI, type WorkflowExecution } from '@/lib/flow-ai/workflow-api';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/flow-ai/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/flow-ai/ui/table';
import { Badge } from '@/components/flow-ai/ui/badge';
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'completed':
      return (
        <span className={`${base} bg-success/10 text-success border border-success/20`}>
          <CheckCircle className="w-3 h-3" />
          Success
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} bg-destructive/10 text-destructive border border-destructive/20`}>
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    case 'running':
      return (
        <span className={`${base} bg-primary/10 text-primary border border-primary/20`}>
          <Play className="w-3 h-3 animate-pulse" />
          Running
        </span>
      );
    case 'pending':
      return (
        <span className={`${base} bg-warning/10 text-warning border border-warning/20`}>
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs capitalize">
          {status}
        </Badge>
      );
  }
}

export default function WorkflowsReportingPage() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      const data = await workflowAPI.listAllExecutions({});
      setExecutions(data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
  };

  const formatDuration = (e: WorkflowExecution) => {
    if (!e.started_at || !e.completed_at)
      return e.status === 'running' ? 'In progress' : 'N/A';
    const start = new Date(e.started_at).getTime();
    const end = new Date(e.completed_at).getTime();
    const diff = end - start;
    if (diff < 1000) return `${diff} ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(2)} s`;
    return `${(diff / 60000).toFixed(2)} min`;
  };

  // Calculate statistics
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter((e) => e.status === 'completed').length;
  const failedExecutions = executions.filter((e) => e.status === 'failed').length;
  const successRate =
    totalExecutions > 0
      ? ((successfulExecutions / totalExecutions) * 100).toFixed(1)
      : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/flow-ai/workflows">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflows
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{totalExecutions}</div>
              <p className="text-sm text-muted-foreground">Total Executions</p>
            </CardContent>
          </Card>
          <Card className="flow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-success">{successfulExecutions}</div>
              <p className="text-sm text-muted-foreground">Successful</p>
            </CardContent>
          </Card>
          <Card className="flow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">{failedExecutions}</div>
              <p className="text-sm text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card className="flow-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Executions Table */}
        <Card className="flow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Workflow Reporting
              </CardTitle>
              <CardDescription>
                View recent workflow executions for this tenant, including status and
                timing.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchExecutions}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading executions...</p>
              </div>
            ) : executions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No executions found yet. Run a workflow to see it appear here.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Execution</TableHead>
                      <TableHead className="w-[140px]">Workflow</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-xs">
                          #{String(e.id).slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          #{String(e.workflow_id).slice(0, 8)}
                        </TableCell>
                        <TableCell>{getStatusBadge(e.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(e.started_at)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(e.completed_at)}
                        </TableCell>
                        <TableCell className="text-xs">{formatDuration(e)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/flow-ai/workflows/${e.workflow_id}/executions/${e.id}`}
                            >
                              View details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


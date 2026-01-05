/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Play, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { workflowAPI, type WorkflowExecution } from '@/lib/flow-ai/workflow-api';

function statusBadge(status: string) {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'completed':
      return (
        <span className={`${base} bg-success/10 text-success border border-success/20`}>
          <CheckCircle2 className="w-3 h-3" />
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

export default function WorkflowExecutionsListPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowName, setWorkflowName] = useState<string>('');

  useEffect(() => {
    void fetchData();
  }, [workflowId]);

  const fetchData = async () => {
    try {
      const [wf, exes] = await Promise.all([
        workflowAPI.getWorkflow(workflowId),
        workflowAPI.listExecutions(workflowId),
      ]);
      setWorkflowName(wf.name);
      setExecutions(exes);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load executions');
      router.push('/flow-ai/workflows');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/flow-ai/workflows/${workflowId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflow
            </Link>
          </Button>
        </div>

        <Card className="flow-card">
          <CardHeader>
            <CardTitle>Workflow Executions</CardTitle>
            <CardDescription>
              Recent runs and status for{' '}
              <span className="font-semibold text-foreground">{workflowName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No executions found for this workflow.
              </p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Execution</TableHead>
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
                        <TableCell>{statusBadge(e.status)}</TableCell>
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
                              href={`/flow-ai/workflows/${workflowId}/executions/${e.id}`}
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

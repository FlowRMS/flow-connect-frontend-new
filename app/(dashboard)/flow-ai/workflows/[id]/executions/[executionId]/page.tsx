/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { toast } from 'sonner';
import { workflowAPI, type WorkflowExecution } from '@/lib/flow-ai/workflow-api';

function statusBadge(status: string) {
  const base = 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium';
  switch (status) {
    case 'completed':
      return (
        <span className={`${base} bg-success/10 text-success border border-success/20`}>
          <CheckCircle2 className="w-4 h-4" />
          Success
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} bg-destructive/10 text-destructive border border-destructive/20`}>
          <XCircle className="w-4 h-4" />
          Failed
        </span>
      );
    case 'running':
      return (
        <span className={`${base} bg-primary/10 text-primary border border-primary/20`}>
          <Play className="w-4 h-4 animate-pulse" />
          Running
        </span>
      );
    case 'pending':
      return (
        <span className={`${base} bg-warning/10 text-warning border border-warning/20`}>
          <Clock className="w-4 h-4" />
          Pending
        </span>
      );
    default:
      return (
        <Badge variant="outline" className="text-sm capitalize">
          {status}
        </Badge>
      );
  }
}

export default function WorkflowExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const executionId = params.executionId as string;

  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchExecution();
  }, [workflowId, executionId]);

  const fetchExecution = async () => {
    try {
      const data = await workflowAPI.getExecution(executionId);
      setExecution(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load execution');
      router.push(`/flow-ai/workflows/${workflowId}/executions`);
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

  const jsonToCsv = (rows: Record<string, any>[]): string => {
    if (!rows || !rows.length) return '';
    const headers = Object.keys(rows[0] ?? {});
    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
    ];
    return csvRows.join('\n');
  };

  const downloadCsv = (filename: string, csv: string) => {
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOutput = () => {
    if (!execution?.output_data) {
      toast.error('No output data available');
      return;
    }
    const raw = execution.output_data;
    const data = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.rows)
      ? raw.rows
      : Array.isArray(raw?.result)
      ? raw.result
      : Array.isArray(raw)
      ? raw
      : [];
    if (!data.length) {
      toast.error('No tabular data to download');
      return;
    }
    const csv = jsonToCsv(data);
    downloadCsv(`execution-${executionId.slice(0, 8)}.csv`, csv);
    toast.success('Output downloaded as CSV');
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

  if (!execution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Execution not found.</p>
        </div>
      </div>
    );
  }

  const outputData = execution.output_data;
  const resultArray = Array.isArray(outputData?.data)
    ? outputData.data
    : Array.isArray(outputData?.rows)
    ? outputData.rows
    : Array.isArray(outputData?.result)
    ? outputData.result
    : Array.isArray(outputData)
    ? outputData
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/flow-ai/workflows/${workflowId}/executions`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Executions
            </Link>
          </Button>
          {resultArray.length > 0 && (
            <Button variant="outline" onClick={handleDownloadOutput}>
              <Download className="w-4 h-4 mr-2" />
              Download Output CSV
            </Button>
          )}
        </div>

        {/* Status Card */}
        <Card className="flow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  Execution #{execution.id.slice(0, 8)}
                  {statusBadge(execution.status)}
                </CardTitle>
                <CardDescription>
                  Workflow ID: {execution.workflow_id}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Started</p>
                <p className="text-sm font-medium">
                  {formatDateTime(execution.started_at)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p className="text-sm font-medium">
                  {formatDateTime(execution.completed_at)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="text-sm font-medium">{formatDuration(execution)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium">
                  {formatDateTime(execution.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {execution.error_message && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-destructive whitespace-pre-wrap">
                {execution.error_message}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Data Tabs */}
        <Card className="flow-card">
          <CardHeader>
            <CardTitle>Execution Data</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="output">
              <TabsList className="mb-4">
                <TabsTrigger value="output">Output Data</TabsTrigger>
                <TabsTrigger value="input">Input Data</TabsTrigger>
                <TabsTrigger value="logs">Execution Logs</TabsTrigger>
              </TabsList>

              <TabsContent value="output">
                {resultArray.length > 0 ? (
                  <div className="border rounded-md overflow-auto max-h-[500px] text-xs">
                    <table className="min-w-full border-collapse">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          {Object.keys(resultArray[0] ?? {}).map((key) => (
                            <th
                              key={key}
                              className="px-2 py-1 border text-left font-medium"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultArray.map((row: any, idx: number) => (
                          <tr key={idx} className="odd:bg-background even:bg-muted/40">
                            {Object.keys(resultArray[0] ?? {}).map((key) => (
                              <td key={key} className="px-2 py-1 border">
                                {String(row[key] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Raw JSON output:
                    </p>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                      {JSON.stringify(execution.output_data, null, 2) || 'No output data'}
                    </pre>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="input">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
                  {JSON.stringify(execution.input_data, null, 2) || 'No input data'}
                </pre>
              </TabsContent>

              <TabsContent value="logs">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {execution.execution_log || 'No logs available'}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

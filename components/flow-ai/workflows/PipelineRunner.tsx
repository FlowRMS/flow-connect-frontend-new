/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Loader2,
  PlayCircle,
  FileText,
  CheckCircle2,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Input } from '@/components/flow-ai/ui/input';
import { Label } from '@/components/flow-ai/ui/label';
import { useWorkflowTenant } from '@/lib/flow-ai/workflow-tenant-context';
import { workflowAPI, type Workflow, type PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';
import { convertPseudoCodeToHTML } from '@/lib/flow-ai/pseudo-code-formatter';
import { toast } from 'sonner';

type StepIndex = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<StepIndex, string> = {
  1: 'Files & Tabs (Node 1)',
  2: 'Workflow Plan (Node 2)',
  3: 'Generated Code (Node 3)',
  4: 'Execution Result (Node 4)',
};

interface PipelineRunnerProps {
  workflow?: Workflow;
  onSave?: (result: PipelineExecuteResponse) => void;
}

export function PipelineRunner({ workflow, onSave }: PipelineRunnerProps) {
  const { isAdmin } = useWorkflowTenant();
  const [prompt, setPrompt] = useState(workflow?.instruction || '');
  const [files, setFiles] = useState<File[]>([]);
  const [editedCode, setEditedCode] = useState<string>('');

  // Store fileIds after first upload (Node 1) to reuse for subsequent nodes
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [pollingExecutionId, setPollingExecutionId] = useState<string | null>(null);
  const [lastHydratedExecutionId, setLastHydratedExecutionId] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<StepIndex>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<StepIndex | 0>(0);
  const [loadingStep, setLoadingStep] = useState<StepIndex | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineExecuteResponse | null>(null);
  const [autoDownloadedCsv, setAutoDownloadedCsv] = useState(false);
  const isPolling = pollingExecutionId !== null;
  const isBusy = loadingStep !== null || isPolling;

  const canRun = useMemo(
    () => prompt.trim().length > 0 && files.length > 0,
    [prompt, files]
  );

  const mergePipelineResult = (
    prev: PipelineExecuteResponse | null,
    next: PipelineExecuteResponse
  ): PipelineExecuteResponse => {
    if (!prev) return next;
    const mergedNodes = { ...(prev.nodes ?? {}) };
    Object.entries(next.nodes ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        mergedNodes[key] = value;
      }
    });
    return {
      ...prev,
      ...next,
      nodes: mergedNodes,
      fileIds: next.fileIds ?? prev.fileIds,
      executionId: next.executionId ?? prev.executionId,
    };
  };

  const normalizePipelineResponse = (
    res: PipelineExecuteResponse
  ): PipelineExecuteResponse => {
    const rawNodes = (res as unknown as { nodes?: unknown }).nodes;
    let nodes = res.nodes ?? {};
    if (typeof rawNodes === 'string') {
      try {
        nodes = JSON.parse(rawNodes) as PipelineExecuteResponse['nodes'];
      } catch (err) {
        console.warn('Failed to parse nodes JSON string in response.', err);
        nodes = {};
      }
    }
    if (!nodes || typeof nodes !== 'object') {
      nodes = {};
    }
    return {
      ...res,
      nodes,
    };
  };

  const handleFileChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList);
    setFiles((prev) => [...prev, ...arr]);
    // Clear fileIds when files change - will need to re-upload on next Node 1 run
    setUploadedFileIds([]);
    setExecutionId(null);
    setPipelineResult(null);
    toast.success(`Added ${arr.length} file(s)`);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    // Clear fileIds when files change - will need to re-upload on next Node 1 run
    setUploadedFileIds([]);
    setExecutionId(null);
    setPipelineResult(null);
  };

  const runStep = async (step: StepIndex) => {
    if (isPolling) {
      toast.error('A pipeline execution is already running.');
      return;
    }

    if (!canRun) {
      toast.error('Please provide a prompt and at least one file.');
      return;
    }

    // For nodes 2, 3, 4: must have fileIds from a previous Node 1 run
    if (step > 1 && uploadedFileIds.length === 0) {
      toast.error('Please run Node 1 first to upload files.');
      return;
    }
    if (step > 1 && !executionId) {
      toast.error('Please run Node 1 first to initialize the execution.');
      return;
    }

    setLoadingStep(step);
    try {
      const node3Code = pipelineResult?.nodes?.node3?.code ?? '';
      const overrideCode =
        step === 4
          ? (editedCode.trim() || node3Code || '').trim()
          : '';
      const shouldOverrideCode = step === 4 && overrideCode.length > 0;
      const runAsync = step === 4;

      // Node 1: pass files to upload, nodes 2-4: pass existing fileIds
      const res = await workflowAPI.executePipeline(
        prompt.trim(),
        step === 1 ? files : undefined,
        step === 1 ? undefined : uploadedFileIds,
        step,
        shouldOverrideCode ? overrideCode : undefined,
        {
          executionId: step === 1 ? undefined : executionId ?? undefined,
          startFromNode: step,
          runAsync,
          workflowId: workflow?.id,
        }
      );

      // Store the fileIds returned from Node 1 for reuse
      if (step === 1 && res.fileIds) {
        setUploadedFileIds(res.fileIds);
      }

      if (res.executionId) {
        setExecutionId(res.executionId);
      }

      if (!res.success) {
        toast.error(res.error || `Pipeline failed at node ${step}`);
        return;
      }

      if (runAsync) {
        if (!res.executionId) {
          toast.error('Execution did not return an ID. Cannot poll for results.');
          return;
        }
        setAutoDownloadedCsv(false);
        setPollingExecutionId(res.executionId);
        setCurrentStep(step);
        toast.success('Node 4 started. Waiting for completion...');
        return;
      }

      const normalizedRes = normalizePipelineResponse(res);
      let hydratedResult = normalizedRes;
      const hydrationId = normalizedRes.executionId ?? executionId;
      if (hydrationId && step >= 2) {
        try {
          const execution = await workflowAPI.getExecution(hydrationId);
          let nodes = execution.output_data?.nodes ?? {};
          if (typeof nodes === 'string') {
            try {
              nodes = JSON.parse(nodes);
            } catch (err) {
              console.warn('Failed to parse execution nodes JSON string.', err);
              nodes = {};
            }
          }
          if (nodes && Object.keys(nodes).length > 0) {
            hydratedResult = mergePipelineResult(hydratedResult, {
              ...normalizedRes,
              nodes,
            });
            setPipelineResult((prev) =>
              mergePipelineResult(prev, { ...normalizedRes, nodes })
            );
          }
        } catch (err) {
          console.warn('Failed to hydrate pipeline nodes from execution.', err);
        }
      }

      setPipelineResult((prev) => mergePipelineResult(prev, hydratedResult));
      setMaxCompletedStep((prev) => {
        const next = step > prev ? step : prev;
        return next as StepIndex | 0;
      });

      toast.success(`Node ${step} completed successfully.`);
      setCurrentStep(step);

      if (onSave && step >= 3) {
        onSave(hydratedResult);
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to run node ${step}`);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleNext = async () => {
    const nextStep = (currentStep + 1) as StepIndex;
    if (nextStep > 4) return;
    await runStep(nextStep);
  };

  const handleRunThisStep = async () => {
    await runStep(currentStep);
  };

  const extractTabularData = (raw: any): Record<string, any>[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.rows)) return raw.rows;
    if (Array.isArray(raw?.result)) return raw.result;
    if (Array.isArray(raw?.customer_price_list)) return raw.customer_price_list;
    if (Array.isArray(raw?.preview_rows)) return raw.preview_rows;
    return [];
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

  useEffect(() => {
    if (!pollingExecutionId) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const pollExecution = async () => {
      try {
        const execution = await workflowAPI.getExecution(pollingExecutionId);
        if (cancelled) return;

        if (execution.status === 'completed' || execution.status === 'failed') {
          const output = execution.output_data ?? {};
          let nodes = output?.nodes ?? {};
          if (typeof nodes === 'string') {
            try {
              nodes = JSON.parse(nodes);
            } catch (err) {
              nodes = {};
            }
          }
          let columnMapping = output?.column_mapping ?? output?.columnMapping ?? {};
          if (typeof columnMapping === 'string') {
            try {
              columnMapping = JSON.parse(columnMapping);
            } catch (err) {
              columnMapping = {};
            }
          }

          const response: PipelineExecuteResponse = {
            success: output?.success ?? execution.status === 'completed',
            error: output?.error ?? execution.error_message ?? null,
            result: output?.result ?? null,
            nodes: nodes,
            warnings: output?.warnings ?? undefined,
            column_mapping: columnMapping,
            fileIds: uploadedFileIds,
            executionId: pollingExecutionId,
          };

          setPipelineResult((prev) => mergePipelineResult(prev, response));
          setMaxCompletedStep(4);
          setCurrentStep(4);
          setPollingExecutionId(null);

          if (execution.status === 'failed') {
            toast.error(response.error || 'Node 4 failed.');
          } else {
            toast.success('Node 4 completed successfully.');
            if (onSave) {
              onSave(response);
            }
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        setPollingExecutionId(null);
        toast.error(err.message || 'Failed to fetch execution status.');
      }
    };

    pollExecution();
    intervalId = setInterval(pollExecution, 4000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingExecutionId, uploadedFileIds, onSave]);

  useEffect(() => {
    if (!pipelineResult?.nodes?.node4 || autoDownloadedCsv) return;
    const raw = pipelineResult.nodes.node4.result;
    const data = extractTabularData(raw);
    if (!data.length) return;
    const csv = jsonToCsv(data);
    if (!csv) return;
    downloadCsv('workflow-result.csv', csv);
    setAutoDownloadedCsv(true);
    toast.success('Result CSV downloaded.');
  }, [pipelineResult, autoDownloadedCsv]);

  useEffect(() => {
    if (!executionId) return;
    if (lastHydratedExecutionId === executionId) return;
    if (pipelineResult?.nodes?.node2 && pipelineResult?.nodes?.node3) return;

    const hydrateNodes = async () => {
      try {
        const execution = await workflowAPI.getExecution(executionId);
        let nodes = execution.output_data?.nodes ?? {};
        if (typeof nodes === 'string') {
          try {
            nodes = JSON.parse(nodes);
          } catch (err) {
            console.warn('Failed to parse execution nodes JSON string.', err);
            nodes = {};
          }
        }
        if (nodes && Object.keys(nodes).length > 0) {
          setPipelineResult((prev) =>
            mergePipelineResult(prev, {
              success: true,
              nodes,
            } as PipelineExecuteResponse)
          );
        }
      } catch (err) {
        console.warn('Failed to hydrate pipeline nodes from execution.', err);
      } finally {
        setLastHydratedExecutionId(executionId);
      }
    };

    hydrateNodes();
  }, [executionId, lastHydratedExecutionId, pipelineResult]);

  const node1 = pipelineResult?.nodes?.node1;
  const node2 = pipelineResult?.nodes?.node2;
  const node3 = pipelineResult?.nodes?.node3;
  const node4 = pipelineResult?.nodes?.node4;

  const renderNode1 = () => {
    if (!node1)
      return <p className="text-sm text-muted-foreground">Run Node 1 to see file metadata and tabs.</p>;
    const filesMeta = node1.file_metadata ?? [];
    return (
      <div className="space-y-4">
        {filesMeta.map((meta: any, idx: number) => (
          <Card key={`${meta.filename}-${idx}`} className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{meta.filename}</span>
                <Badge variant={meta.was_structured ? 'default' : 'outline'}>
                  {meta.was_structured ? 'Structured' : 'Original'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Type: {meta.file_type} - Path: {meta.filepath}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Tabs defaultValue="tabs">
                <TabsList className="mb-2">
                  <TabsTrigger value="tabs" className="text-xs">
                    Tabs
                  </TabsTrigger>
                  <TabsTrigger value="raw" className="text-xs">
                    Raw JSON
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="tabs" className="space-y-2">
                  {(meta.tabs_data ?? []).map((tab: any, i: number) => (
                    <div key={`${tab.tab_name}-${i}`} className="rounded-md border border-dashed p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs">{tab.tab_name}</span>
                        {tab.error && <Badge variant="destructive">Error</Badge>}
                      </div>
                      {tab.error ? (
                        <p className="text-xs text-destructive">{tab.error}</p>
                      ) : (
                        <>
                          <p className="text-[11px] text-muted-foreground mb-1">
                            Columns: {(tab.columns ?? []).join(', ')}
                          </p>
                          <pre className="text-[11px] bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(tab.sample_rows ?? [], null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="raw">
                  <pre className="text-[11px] bg-muted p-2 rounded overflow-x-auto max-h-64">
                    {JSON.stringify(node1, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderNode2 = () => {
    if (!node2)
      return <p className="text-sm text-muted-foreground">Run Node 2 to see the workflow plan.</p>;
    return (
      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
        {JSON.stringify(node2.workflow_plan ?? node2, null, 2)}
      </pre>
    );
  };

  const renderNode3 = () => {
    if (!node3)
      return <p className="text-sm text-muted-foreground">Run Node 3 to see generated Python code.</p>;

    const codeValue = editedCode || node3.code || '';
    const pseudoCode = node3.pseudo_code || '';

    // Admin mode: show actual code (editable)
    // User mode: show pseudo code (read-only)
    if (isAdmin) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Admin Mode: You can edit this Python code. When you run Node 4, the edited version will
            be executed.
          </div>
          {pseudoCode ? (
            <Tabs defaultValue="code" className="w-full">
              <TabsList>
                <TabsTrigger value="code">Actual Code (Editable)</TabsTrigger>
                <TabsTrigger value="pseudo">Pseudo Code (Reference)</TabsTrigger>
              </TabsList>
              <TabsContent value="code">
                <Textarea
                  value={codeValue}
                  onChange={(e) => setEditedCode(e.target.value)}
                  rows={20}
                  className="font-mono text-xs bg-muted"
                />
              </TabsContent>
              <TabsContent value="pseudo">
                <div className="pseudo-code-container p-6 bg-card border rounded-lg overflow-auto max-h-[500px]">
                  <div className="pseudo-code-content">
                    <div dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Textarea
              value={codeValue}
              onChange={(e) => setEditedCode(e.target.value)}
              rows={20}
              className="font-mono text-xs bg-muted"
            />
          )}
        </div>
      );
    } else {
      // User mode: show pseudo code only (read-only)
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            User Mode: Viewing pseudo code (read-only). Switch to Admin mode to view and edit actual
            code.
          </div>
          {pseudoCode ? (
            <div className="pseudo-code-container p-6 bg-card border rounded-lg overflow-auto max-h-[500px]">
              <div className="pseudo-code-content">
                <div dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }} />
              </div>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Pseudo code not available. Please run Node 3 again or switch to Admin mode to view
                actual code.
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  const renderNode4 = () => {
    if (!node4)
      return <p className="text-sm text-muted-foreground">Run Node 4 to see execution result.</p>;
    const raw = node4.result;
    const data = extractTabularData(raw);
    const hasData = Array.isArray(data) && data.length;
    return (
      <>
        <Tabs defaultValue="table">
          <TabsList className="mb-2">
            <TabsTrigger value="table" className="text-xs">
              Table
            </TabsTrigger>
            <TabsTrigger value="json" className="text-xs">
              Raw JSON
            </TabsTrigger>
            <TabsTrigger value="log" className="text-xs">
              Logs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table">
            {Array.isArray(data) && data.length ? (
              <div className="border rounded-md overflow-auto max-h-[420px] text-xs">
                <table className="min-w-full border-collapse">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {Object.keys(data[0] ?? {}).map((key) => (
                        <th key={key} className="px-2 py-1 border text-left font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row: any, idx: number) => (
                      <tr key={idx} className="odd:bg-background even:bg-muted/40">
                        {Object.keys(data[0] ?? {}).map((key) => (
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
              <p className="text-sm text-muted-foreground">No tabular data in result.</p>
            )}
          </TabsContent>
          <TabsContent value="json">
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
              {JSON.stringify(node4.result ?? node4, null, 2)}
            </pre>
          </TabsContent>
          <TabsContent value="log">
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
              {node4.stderr || node4.stdout || 'No logs captured.'}
            </pre>
          </TabsContent>
        </Tabs>
        {hasData && (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                const csv = jsonToCsv(data);
                if (!csv) {
                  toast.error('No CSV data found.');
                  return;
                }
                downloadCsv('workflow-result.csv', csv);
              }}
            >
              Download Result CSV
            </Button>
          </div>
        )}
      </>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderNode1();
      case 2:
        return renderNode2();
      case 3:
        return renderNode3();
      case 4:
        return renderNode4();
      default:
        return null;
    }
  };

  const canGoNext = currentStep < 4 && maxCompletedStep >= currentStep;

  const stepStatus = (step: StepIndex) => {
    if (loadingStep === step || (isPolling && step === 4)) return 'loading';
    if (maxCompletedStep >= step) return 'done';
    return 'pending';
  };

  const handleStepClick = (step: StepIndex) => {
    if (step <= (maxCompletedStep || 1)) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Card className="sticky top-6 flow-card">
          <CardHeader>
            <CardTitle>Pipeline Input</CardTitle>
            <CardDescription>Prompt and files for this run</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt *</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describe what you want the workflow to do..."
              />
            </div>

            <div>
              <Label>Files *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center mt-1 hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground mb-2">
                  Upload Excel/CSV/PDF files for the pipeline to process.
                </p>
                <Input
                  id="pipeline-files"
                  type="file"
                  multiple
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={(e) => handleFileChange(e.target.files)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('pipeline-files')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              </div>
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  <Label className="text-xs">Selected Files</Label>
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between px-2 py-1 rounded bg-muted text-xs"
                    >
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(idx)}
                      >
                        x
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 space-y-2 border-t border-border">
              <Button
                type="button"
                className="w-full"
                disabled={!canRun || isBusy}
                onClick={() => runStep(1)}
              >
                {loadingStep === 1 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Node 1...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start from Node 1
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isBusy}
                onClick={handleRunThisStep}
              >
                {loadingStep === currentStep || (isPolling && currentStep === 4) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Node {currentStep}...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Node {currentStep} only
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="h-[calc(100vh-12rem)] flex flex-col flow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{STEP_TITLES[currentStep]}</span>
              <div className="flex gap-2 text-xs">
                {([1, 2, 3, 4] as StepIndex[]).map((step) => {
                  const status = stepStatus(step);
                  return (
                    <button
                      key={step}
                      type="button"
                      onClick={() => handleStepClick(step)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 border text-[11px] transition-colors ${
                        status === 'done'
                          ? 'border-success/60 text-success bg-success/10'
                          : status === 'loading'
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-muted text-muted-foreground bg-background'
                      }`}
                    >
                      {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                      <span>Node {step}</span>
                    </button>
                  );
                })}
              </div>
            </CardTitle>
            <CardDescription className="text-xs">
              Inspect each node&apos;s output, then click Next to advance the pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto mb-3 border rounded-md p-3 bg-background">
              {renderStepContent()}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Node {currentStep} of 4</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentStep === 1 || isBusy}
                  onClick={() => setCurrentStep((prev) => (prev - 1) as StepIndex)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canGoNext || isBusy}
                  onClick={handleNext}
                >
                  {loadingStep === ((currentStep + 1) as StepIndex) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Node {currentStep + 1}...
                    </>
                  ) : (
                    <>
                      Next Node
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






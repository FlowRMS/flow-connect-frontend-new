/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  PlayCircle,
  Save,
  Upload,
  FileText,
  ChevronRight,
  CheckCircle2,
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
import { Input } from '@/components/flow-ai/ui/input';
import { Label } from '@/components/flow-ai/ui/label';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { Badge } from '@/components/flow-ai/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/flow-ai/ui/dialog';
import {
  workflowAPI,
  type PipelineExecuteResponse,
} from '@/lib/flow-ai/workflow-api';
import { useWorkflowTenant } from '@/lib/flow-ai/workflow-tenant-context';
import { toast } from 'sonner';
import { convertPseudoCodeToHTML } from '@/lib/flow-ai/pseudo-code-formatter';

type StepIndex = 1 | 2 | 3 | 4;

const STEP_TITLES: Record<StepIndex, string> = {
  1: 'Files & Tabs (Node 1)',
  2: 'Workflow Plan (Node 2)',
  3: 'Generated Code (Node 3)',
  4: 'Execution Result (Node 4)',
};

export default function CreateWorkflowPage() {
  const router = useRouter();
  const { isAdmin } = useWorkflowTenant();
  const [prompt, setPrompt] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [editedCode, setEditedCode] = useState<string>('');

  const [currentStep, setCurrentStep] = useState<StepIndex>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<StepIndex | 0>(0);
  const [loadingStep, setLoadingStep] = useState<StepIndex | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineExecuteResponse | null>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[] | null>(null);
  const [autoDownloadedCsv, setAutoDownloadedCsv] = useState(false);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  const canRun = useMemo(
    () => prompt.trim().length > 0 && files.length > 0,
    [prompt, files]
  );

  const handleFileChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const arr = Array.from(fileList);
    setFiles((prev) => [...prev, ...arr]);
    toast.success(`Added ${arr.length} file(s)`);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const runStep = async (step: StepIndex) => {
    // For step 1, we need files. For steps 2-4, we need uploadedFileIds from step 1.
    if (step === 1) {
      if (!canRun) {
        toast.error('Please provide a prompt and at least one file.');
        return;
      }
    } else {
      if (!uploadedFileIds || uploadedFileIds.length === 0) {
        toast.error('Please run Node 1 first to upload files.');
        return;
      }
    }

    setLoadingStep(step);
    try {
      const shouldOverrideCode = step === 4 && editedCode.trim().length > 0;

      // For step 1: upload files (pass files, no existingFileIds)
      // For steps 2-4: reuse fileIds from step 1 (pass undefined for files, pass existingFileIds)
      const res = await workflowAPI.executePipeline(
        prompt.trim(),
        step === 1 ? files : undefined,
        step === 1 ? undefined : uploadedFileIds ?? undefined,
        step,
        shouldOverrideCode ? editedCode : undefined
      );

      // Store fileIds from step 1 for reuse in subsequent steps
      if (step === 1 && res.fileIds && res.fileIds.length > 0) {
        setUploadedFileIds(res.fileIds);
        console.log('📁 Stored fileIds for reuse:', res.fileIds);
      }

      setPipelineResult(res);

      if (!res.success) {
        toast.error(res.error || `Pipeline failed at node ${step}`);
        return;
      }

      setMaxCompletedStep((prev) => {
        const next = step > prev ? step : prev;
        return next as StepIndex | 0;
      });

      toast.success(`Node ${step} completed successfully.`);
      setCurrentStep(step);
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

  const handleSaveWorkflow = () => {
    if (!pipelineResult?.nodes?.node2 || !pipelineResult.nodes.node3) {
      toast.error('Run up to Node 3 (plan + code) before saving.');
      return;
    }

    if (!workflowName.trim()) {
      toast.error('Please enter a workflow name.');
      return;
    }

    setShowVisibilityDialog(true);
  };

  const confirmSaveWorkflow = async (isPublic: boolean) => {
    if (!pipelineResult?.nodes?.node2 || !pipelineResult.nodes.node3) return;

    setSavingVisibility(true);
    try {
      const saved = await workflowAPI.saveWorkflowFromPipeline({
        name: workflowName.trim(),
        description: description.trim() || undefined,
        instruction: prompt.trim(),
        workflowJson: pipelineResult.nodes.node2.workflow_plan,
        generatedCode: pipelineResult.nodes.node3.code,
        pseudoCode: pipelineResult.nodes.node3.pseudo_code,
        isPublic,
      });
      toast.success(
        isPublic
          ? 'Workflow saved as public. Redirecting to workflow details...'
          : 'Workflow saved as private. Redirecting to workflow details...'
      );
      router.push(`/flow-ai/workflows/${saved.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save workflow.');
    } finally {
      setSavingVisibility(false);
      setShowVisibilityDialog(false);
    }
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

  const downloadJson = (filename: string, data: any) => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if result is a product import JSON structure
  // Can be either: { products: [...] } or { output_file: "...", preview_products: [...] }
  const isProductImportJson = (data: any): boolean => {
    if (!data) return false;
    // Check for direct products array
    if (data.products && Array.isArray(data.products)) {
      const firstProduct = data.products[0];
      if (firstProduct && 'factoryPartNumber' in firstProduct) {
        return true;
      }
    }
    // Check for output_file + preview_products structure (from streaming code)
    if (data.output_file && data.preview_products && Array.isArray(data.preview_products)) {
      const firstProduct = data.preview_products[0];
      if (firstProduct && 'factoryPartNumber' in firstProduct) {
        return true;
      }
    }
    return false;
  };

  // Download JSON file from URL (for streaming output) or direct data
  const downloadProductImportJson = async (data: any) => {
    try {
      if (data.output_file) {
        // Fetch the full JSON from the output_file URL
        toast.info('Downloading full product data...');
        const response = await fetch(data.output_file);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        const jsonData = await response.json();
        downloadJson('products-import.json', jsonData);
        toast.success('Product import JSON downloaded. Go to Products > Import to upload it.');
      } else {
        // Direct download of the data object
        downloadJson('products-import.json', data);
        toast.success('Product import JSON downloaded. Go to Products > Import to upload it.');
      }
    } catch (error) {
      console.error('Failed to download product JSON:', error);
      toast.error('Failed to download JSON. Try copying from Raw JSON tab.');
    }
  };

  useEffect(() => {
    if (!pipelineResult?.nodes?.node4 || autoDownloadedCsv) return;
    const raw = pipelineResult.nodes.node4.result;
    const data = (raw?.data ?? raw?.rows ?? raw) as Record<string, any>[] | undefined;
    if (!Array.isArray(data) || !data.length) return;
    const csv = jsonToCsv(data);
    if (!csv) return;
    downloadCsv('workflow-result.csv', csv);
    setAutoDownloadedCsv(true);
    toast.success('Result CSV downloaded.');
  }, [pipelineResult, autoDownloadedCsv]);

  const node1 = pipelineResult?.nodes?.node1;
  const node2 = pipelineResult?.nodes?.node2;
  const node3 = pipelineResult?.nodes?.node3;
  const node4 = pipelineResult?.nodes?.node4;

  const renderNode1 = () => {
    if (!node1)
      return (
        <p className="text-sm text-muted-foreground">
          Run Node 1 to see file metadata and tabs.
        </p>
      );
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
                    <div
                      key={`${tab.tab_name}-${i}`}
                      className="rounded-md border border-dashed p-2"
                    >
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
      return (
        <p className="text-sm text-muted-foreground">
          Run Node 2 to see the workflow plan.
        </p>
      );
    return (
      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
        {JSON.stringify(node2.workflow_plan ?? node2, null, 2)}
      </pre>
    );
  };

  const renderNode3 = () => {
    if (!node3)
      return (
        <p className="text-sm text-muted-foreground">
          Run Node 3 to see generated Python code.
        </p>
      );

    const codeValue = editedCode || node3.code || '';
    const pseudoCode = node3.pseudo_code || '';

    if (isAdmin) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Admin Mode: You can edit this Python code. When you run Node 4, the edited
            version will be executed.
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
                    <div
                      dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }}
                    />
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
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            User Mode: Viewing pseudo code (read-only). Switch to Admin mode to view and
            edit actual code.
          </div>
          {pseudoCode ? (
            <div className="pseudo-code-container p-6 bg-card border rounded-lg overflow-auto max-h-[500px]">
              <div className="pseudo-code-content">
                <div
                  dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Pseudo code not available. Please run Node 3 again or switch to Admin mode
                to view actual code.
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  const renderNode4 = () => {
    if (!node4)
      return (
        <p className="text-sm text-muted-foreground">
          Run Node 4 to see execution result.
        </p>
      );
    const raw = node4.result;
    const data = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.rows)
      ? raw.rows
      : Array.isArray(raw?.result)
      ? raw.result
      : Array.isArray(raw)
      ? raw
      : [];
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
        {/* Download buttons */}
        <div className="mt-3 flex justify-end gap-2">
          {/* Product Import JSON download button */}
          {isProductImportJson(raw) && (
            <Button
              size="sm"
              variant="default"
              onClick={() => downloadProductImportJson(raw)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download JSON for Import
            </Button>
          )}
          {/* CSV download button (for tabular data) */}
          {hasData && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const csv = jsonToCsv(data);
                if (!csv) {
                  toast.error('No CSV data found.');
                  return;
                }
                downloadCsv('workflow-result.csv', csv);
              }}
            >
              Download CSV
            </Button>
          )}
        </div>
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
    if (loadingStep === step) return 'loading';
    if (maxCompletedStep >= step) return 'done';
    return 'pending';
  };

  const handleStepClick = (step: StepIndex) => {
    if (step <= (maxCompletedStep || 1)) {
      setCurrentStep(step);
    }
  };

  const bannerMessage = useMemo(() => {
    if (!pipelineResult) return null;
    if (!pipelineResult.success && pipelineResult.error) return pipelineResult.error;
    return null;
  }, [pipelineResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" asChild>
            <Link href="/flow-ai/workflows">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflows
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Create Workflow - 4-Node Pipeline Runner</span>
          </div>
        </div>

        {bannerMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {bannerMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-24 flow-card">
              <CardHeader>
                <CardTitle>Pipeline Input</CardTitle>
                <CardDescription>Prompt and files for this run</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workflowName">Workflow Name (for saving)</Label>
                  <Input
                    id="workflowName"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="e.g. Product Pricing Analysis"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe the workflow purpose..."
                  />
                </div>
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
                    disabled={!canRun || loadingStep !== null}
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
                    disabled={loadingStep !== null}
                    onClick={handleRunThisStep}
                  >
                    {loadingStep === currentStep ? (
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

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={
                      currentStep < 3 || !pipelineResult || loadingStep !== null
                    }
                    onClick={handleSaveWorkflow}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Workflow (from plan + code)
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
                  <div className="text-xs text-muted-foreground">
                    Node {currentStep} of 4
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentStep === 1 || loadingStep !== null}
                      onClick={() => setCurrentStep((prev) => (prev - 1) as StepIndex)}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!canGoNext || loadingStep !== null}
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
      </div>

      <Dialog open={showVisibilityDialog} onOpenChange={setShowVisibilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make this workflow public?</DialogTitle>
            <DialogDescription>
              Choose whether this workflow should appear in the public gallery for this
              tenant, or remain private under &quot;My Workflows&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={savingVisibility}
              onClick={() => confirmSaveWorkflow(false)}
            >
              Save as Private
            </Button>
            <Button
              type="button"
              disabled={savingVisibility}
              onClick={() => confirmSaveWorkflow(true)}
            >
              Save as Public
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


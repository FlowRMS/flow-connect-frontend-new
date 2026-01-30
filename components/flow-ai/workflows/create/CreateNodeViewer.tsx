'use client';

import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { convertPseudoCodeToHTML } from '@/lib/flow-ai/pseudo-code-formatter';
import { toast } from 'sonner';
import type { PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';

type StepIndex = 1 | 2 | 3 | 4;

interface CreateNodeViewerProps {
  currentStep: StepIndex;
  pipelineResult: PipelineExecuteResponse | null;
  isAdmin: boolean;
  isPolling: boolean;
  editedCode: string;
  setEditedCode: (code: string) => void;
}

export function CreateNodeViewer({
  currentStep,
  pipelineResult,
  isAdmin,
  isPolling,
  editedCode,
  setEditedCode,
}: CreateNodeViewerProps) {
  const node1 = pipelineResult?.nodes?.node1;
  const node2 = pipelineResult?.nodes?.node2;
  const node3 = pipelineResult?.nodes?.node3;
  const node4 = pipelineResult?.nodes?.node4;

  switch (currentStep) {
    case 1:
      return <Node1Content node1={node1} />;
    case 2:
      return <Node2Content node2={node2} />;
    case 3:
      return (
        <Node3Content
          node3={node3}
          isAdmin={isAdmin}
          editedCode={editedCode}
          setEditedCode={setEditedCode}
        />
      );
    case 4:
      return <Node4Content node4={node4} isPolling={isPolling} />;
    default:
      return null;
  }
}

function Node1Content({ node1 }: { node1: PipelineExecuteResponse['nodes']['node1'] | undefined }) {
  if (!node1) {
    return <p className="text-sm text-muted-foreground">Run Node 1 to see file metadata and tabs.</p>;
  }

  interface TabData {
    tab_name: string;
    error?: string;
    columns?: string[];
    sample_rows?: unknown[];
  }

  interface FileMeta {
    filename: string;
    was_structured?: boolean;
    file_type?: string;
    filepath?: string;
    tabs_data?: TabData[];
  }

  const filesMeta = (node1.file_metadata ?? []) as FileMeta[];

  return (
    <div className="space-y-4">
      {filesMeta.map((meta, idx) => (
        <Card key={`${meta.filename}-${idx}`} className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{meta.filename}</span>
              <Badge variant={meta.was_structured ? 'default' : 'outline'}>
                {meta.was_structured ? 'Structured' : 'Original'}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Type: {meta.file_type} - Path: {meta.filepath}
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <Tabs defaultValue="tabs">
              <TabsList className="mb-2">
                <TabsTrigger value="tabs" className="text-xs">Tabs</TabsTrigger>
                <TabsTrigger value="raw" className="text-xs">Raw JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="tabs" className="space-y-2">
                {(meta.tabs_data ?? []).map((tab, i) => (
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
}

function Node2Content({ node2 }: { node2: PipelineExecuteResponse['nodes']['node2'] | undefined }) {
  if (!node2) {
    return <p className="text-sm text-muted-foreground">Run Node 2 to see the workflow plan.</p>;
  }

  const node2Data = node2 as Record<string, unknown>;
  return (
    <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-words">
      {JSON.stringify(node2Data.workflow_plan ?? node2, null, 2)}
    </pre>
  );
}

interface Node3ContentProps {
  node3: PipelineExecuteResponse['nodes']['node3'] | undefined;
  isAdmin: boolean;
  editedCode: string;
  setEditedCode: (code: string) => void;
}

function Node3Content({ node3, isAdmin, editedCode, setEditedCode }: Node3ContentProps) {
  if (!node3) {
    return <p className="text-sm text-muted-foreground">Run Node 3 to see generated Python code.</p>;
  }

  const codeValue = editedCode || node3.code || '';
  const pseudoCode = node3.pseudo_code || '';

  if (isAdmin) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          Admin Mode: You can edit this Python code. When you run Node 4, the edited version will be executed.
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
              <div className="pseudo-code-container p-6 bg-card border rounded-lg">
                <div
                  className="pseudo-code-content"
                  dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }}
                />
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
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        User Mode: Viewing pseudo code (read-only). Switch to Admin mode to view and edit actual code.
      </div>
      {pseudoCode ? (
        <div className="pseudo-code-container p-6 bg-card border rounded-lg">
          <div
            className="pseudo-code-content"
            dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }}
          />
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Pseudo code not available. Please run Node 3 again or switch to Admin mode to view actual code.
          </p>
        </div>
      )}
    </div>
  );
}

function Node4Content({
  node4,
  isPolling,
}: {
  node4: PipelineExecuteResponse['nodes']['node4'] | undefined;
  isPolling: boolean;
}) {
  if (isPolling) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Processing your data...</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This process may take several minutes depending on the size of your data.
            Please do not close this tab or navigate away.
          </p>
          <p className="text-xs text-muted-foreground">
            The page will automatically update when the process is complete.
          </p>
        </div>
      </div>
    );
  }

  if (!node4) {
    return <p className="text-sm text-muted-foreground">Run Node 4 to see execution result.</p>;
  }

  const raw = node4.result;
  const extractData = (r: unknown): Record<string, unknown>[] => {
    if (!r) return [];
    if (Array.isArray(r)) return r as Record<string, unknown>[];
    const obj = r as Record<string, unknown>;
    if (Array.isArray(obj?.data)) return obj.data as Record<string, unknown>[];
    if (Array.isArray(obj?.rows)) return obj.rows as Record<string, unknown>[];
    if (Array.isArray(obj?.result)) return obj.result as Record<string, unknown>[];
    return [];
  };

  const data = extractData(raw);
  const hasData = Array.isArray(data) && data.length > 0;

  const handleDownloadCsv = () => {
    if (!hasData) return;
    const headers = Object.keys(data[0] ?? {});
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...data.map((row) => headers.map((h) => escape(row[h])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow-result.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded.');
  };

  return (
    <>
      <Tabs defaultValue="table">
        <TabsList className="mb-2">
          <TabsTrigger value="table" className="text-xs">Table</TabsTrigger>
          <TabsTrigger value="json" className="text-xs">Raw JSON</TabsTrigger>
          <TabsTrigger value="log" className="text-xs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          {hasData ? (
            <div className="border rounded-md overflow-auto max-h-[420px] text-xs">
              <table className="min-w-full border-collapse">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    {Object.keys(data[0] ?? {}).map((key) => (
                      <th key={key} className="px-2 py-1 border text-left font-medium">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx} className="odd:bg-background even:bg-muted/40">
                      {Object.keys(data[0] ?? {}).map((key) => (
                        <td key={key} className="px-2 py-1 border">{String(row[key] ?? '')}</td>
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
          <Button size="sm" variant="outline" onClick={handleDownloadCsv}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>
      )}
    </>
  );
}

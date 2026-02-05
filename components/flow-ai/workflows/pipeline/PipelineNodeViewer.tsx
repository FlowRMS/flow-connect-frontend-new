'use client';

import { Loader2, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/flow-ai/ui/tabs';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { convertPseudoCodeToHTML } from '@/lib/flow-ai/pseudo-code-formatter';
import { jsonToCsv, downloadCsv, parseNodeResult } from '@/lib/flow-ai/pipeline-utils';
import { isProductImportJson } from '@/lib/flow-ai/product-utils';
import { toast } from 'sonner';
import type { StepIndex } from '@/components/flow-ai/hooks';
import type { PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';

export interface PipelineNodeViewerProps {
  currentStep: StepIndex;
  pipelineResult: PipelineExecuteResponse | null;
  isAdmin: boolean;
  editedCode: string;
  setEditedCode: (code: string) => void;
  isNavigatingToImport: boolean;
  onNavigateToImport: (data: unknown) => void;
  onDownloadProductJson: (data: unknown) => void;
}

export function PipelineNodeViewer({
  currentStep,
  pipelineResult,
  isAdmin,
  editedCode,
  setEditedCode,
  isNavigatingToImport,
  onNavigateToImport,
  onDownloadProductJson,
}: PipelineNodeViewerProps) {
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
      return (
        <Node4Content
          node4={node4}
          isNavigatingToImport={isNavigatingToImport}
          onNavigateToImport={onNavigateToImport}
          onDownloadProductJson={onDownloadProductJson}
        />
      );
    default:
      return null;
  }
}

interface Node1ContentProps {
  node1: PipelineExecuteResponse['nodes']['node1'] | undefined;
}

function Node1Content({ node1 }: Node1ContentProps) {
  if (!node1) {
    return <p className="text-sm text-muted-foreground">Run Node 1 to see file metadata and tabs.</p>;
  }

  const filesMeta = (node1.file_metadata ?? []) as FileMetadata[];

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
                <TabsTrigger value="tabs" className="text-xs">
                  Tabs
                </TabsTrigger>
                <TabsTrigger value="raw" className="text-xs">
                  Raw JSON
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tabs" className="space-y-2">
                {(meta.tabs_data ?? []).map((tab, i) => (
                  <TabDataPreview key={`${tab.tab_name}-${i}`} tab={tab} />
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

interface FileMetadata {
  filename: string;
  was_structured?: boolean;
  file_type?: string;
  filepath?: string;
  tabs_data?: TabData[];
}

interface TabData {
  tab_name: string;
  error?: string;
  columns?: string[];
  sample_rows?: unknown[];
}

interface TabDataPreviewProps {
  tab: TabData;
}

function TabDataPreview({ tab }: TabDataPreviewProps) {
  return (
    <div className="rounded-md border border-dashed p-2">
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
  );
}

interface Node2ContentProps {
  node2: PipelineExecuteResponse['nodes']['node2'] | undefined;
}

function Node2Content({ node2 }: Node2ContentProps) {
  if (!node2) {
    return <p className="text-sm text-muted-foreground">Run Node 2 to see the workflow plan.</p>;
  }

  const node2Data = node2 as Record<string, unknown>;
  return (
    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
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

  const node3Data = node3 as Record<string, unknown>;
  const codeValue = editedCode || (node3Data.code as string) || '';
  const pseudoCode = (node3Data.pseudo_code as string) || '';

  if (isAdmin) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          Admin Mode: You can edit this Python code. When you run Node 4, the edited version will be
          executed.
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
        <div className="pseudo-code-container p-6 bg-card border rounded-lg overflow-auto max-h-[500px]">
          <div
            className="pseudo-code-content"
            dangerouslySetInnerHTML={{ __html: convertPseudoCodeToHTML(pseudoCode) }}
          />
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Pseudo code not available. Please run Node 3 again or switch to Admin mode to view actual
            code.
          </p>
        </div>
      )}
    </div>
  );
}

interface Node4ContentProps {
  node4: PipelineExecuteResponse['nodes']['node4'] | undefined;
  isNavigatingToImport: boolean;
  onNavigateToImport: (data: unknown) => void;
  onDownloadProductJson: (data: unknown) => void;
}

function Node4Content({
  node4,
  isNavigatingToImport,
  onNavigateToImport,
  onDownloadProductJson,
}: Node4ContentProps) {
  if (!node4) {
    return <p className="text-sm text-muted-foreground">Run Node 4 to see execution result.</p>;
  }

  const node4Data = node4 as Record<string, unknown>;
  const raw = parseNodeResult(node4Data.result);
  const rawObj = raw as Record<string, unknown> | unknown[] | null;

  const data = Array.isArray(rawObj)
    ? rawObj
    : Array.isArray(rawObj?.data)
    ? rawObj.data
    : Array.isArray(rawObj?.rows)
    ? rawObj.rows
    : Array.isArray(rawObj?.result)
    ? rawObj.result
    : [];

  const hasData = Array.isArray(data) && data.length > 0;
  const isProductJson = isProductImportJson(raw);

  const handleDownloadCsv = () => {
    const dataRecords = data as Record<string, unknown>[];
    const csv = jsonToCsv(dataRecords);
    if (!csv) {
      toast.error('No CSV data found.');
      return;
    }
    downloadCsv('workflow-result.csv', csv);
  };

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
          {hasData ? (
            <ResultTable data={data as Record<string, unknown>[]} />
          ) : (
            <p className="text-sm text-muted-foreground">No tabular data in result.</p>
          )}
        </TabsContent>
        <TabsContent value="json">
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
            {JSON.stringify(node4Data.result ?? node4, null, 2)}
          </pre>
        </TabsContent>
        <TabsContent value="log">
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-[420px]">
            {(node4Data.stderr as string) || (node4Data.stdout as string) || 'No logs captured.'}
          </pre>
        </TabsContent>
      </Tabs>

      <div className="mt-3 flex justify-end gap-2">
        {isProductJson && (
          <>
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onNavigateToImport(raw)}
              disabled={isNavigatingToImport}
            >
              {isNavigatingToImport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  Import Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDownloadProductJson(raw)}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </>
        )}
        {hasData && !isProductJson && (
          <Button size="sm" variant="outline" onClick={handleDownloadCsv}>
            Download CSV
          </Button>
        )}
      </div>
    </>
  );
}

interface ResultTableProps {
  data: Record<string, unknown>[];
}

function ResultTable({ data }: ResultTableProps) {
  const headers = Object.keys(data[0] ?? {});

  return (
    <div className="border rounded-md overflow-auto max-h-[420px] text-xs">
      <table className="min-w-full border-collapse">
        <thead className="bg-muted sticky top-0">
          <tr>
            {headers.map((key) => (
              <th key={key} className="px-2 py-1 border text-left font-medium">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="odd:bg-background even:bg-muted/40">
              {headers.map((key) => (
                <td key={key} className="px-2 py-1 border">
                  {String(row[key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { Loader2, PlayCircle, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Input } from '@/components/flow-ai/ui/input';
import { Label } from '@/components/flow-ai/ui/label';
import { PipelineResultPreview } from './PipelineResultPreview';
import type { StepIndex } from '@/components/flow-ai/hooks';
import { parseNodeResult } from '@/lib/flow-ai/pipeline-utils';
import type { PipelineExecuteResponse } from '@/lib/flow-ai/workflow-api';

export interface TemplateRunnerViewProps {
  files: File[];
  handleFileChange: (fileList: FileList | null) => void;
  removeFile: (index: number) => void;
  loadingStep: StepIndex | null;
  pipelineResult: PipelineExecuteResponse | null;
  isNavigatingToImport: boolean;
  isPricingTemplate?: boolean;
  onRunWithSavedCode: () => void;
  onNavigateToImport: (data: unknown) => void;
  onDownloadCsv?: (data: unknown) => void;
}

export function TemplateRunnerView({
  files,
  handleFileChange,
  removeFile,
  loadingStep,
  pipelineResult,
  isNavigatingToImport,
  isPricingTemplate = false,
  onRunWithSavedCode,
  onNavigateToImport,
  onDownloadCsv,
}: TemplateRunnerViewProps) {
  const node4 = pipelineResult?.nodes?.node4;
  const hasResults = !!node4;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Hide upload section when we have results */}
      {!hasResults && (
        <Card className="flow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Files
            </CardTitle>
            <CardDescription>
              Upload the Excel/CSV files you want to process with this workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                Drag files here or click to select
              </p>
              <Input
                id="template-files"
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('template-files')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Files
              </Button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected files</Label>
                <div className="space-y-1">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => removeFile(idx)}
                      >
                        x
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={files.length === 0 || loadingStep !== null}
              onClick={onRunWithSavedCode}
            >
              {loadingStep === 4 ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Run Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {node4 && (
        <Card className="flow-card">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineResultPreview
              nodeResult={parseNodeResult(node4.result)}
              isNavigatingToImport={isNavigatingToImport}
              onNavigateToImport={onNavigateToImport}
              onDownloadCsv={onDownloadCsv}
              isPricingTemplate={isPricingTemplate}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

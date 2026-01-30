'use client';

import { Loader2, PlayCircle, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/flow-ai/ui/card';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Input } from '@/components/flow-ai/ui/input';
import { Label } from '@/components/flow-ai/ui/label';
import type { StepIndex } from '@/components/flow-ai/hooks';

export interface PipelineInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  files: File[];
  handleFileChange: (fileList: FileList | null) => void;
  removeFile: (index: number) => void;
  canRun: boolean;
  loadingStep: StepIndex | null;
  currentStep: StepIndex;
  hasSavedCode: boolean;
  onStartFromNode1: () => void;
  onRunWithSavedCode: () => void;
  onRunThisStep: () => void;
}

export function PipelineInput({
  prompt,
  setPrompt,
  files,
  handleFileChange,
  removeFile,
  canRun,
  loadingStep,
  currentStep,
  hasSavedCode,
  onStartFromNode1,
  onRunWithSavedCode,
  onRunThisStep,
}: PipelineInputProps) {
  return (
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
            disabled={!canRun || loadingStep !== null}
            onClick={onStartFromNode1}
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

          {hasSavedCode && (
            <Button
              type="button"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!canRun || loadingStep !== null}
              onClick={onRunWithSavedCode}
            >
              {loadingStep === 4 ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Run with Saved Code
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loadingStep !== null}
            onClick={onRunThisStep}
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
        </div>
      </CardContent>
    </Card>
  );
}

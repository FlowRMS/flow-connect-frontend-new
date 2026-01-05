'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/flow-ai/ui/dialog';
import { ScrollArea } from '@/components/flow-ai/ui/scroll-area';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Button } from '@/components/flow-ai/ui/button';
import { Textarea } from '@/components/flow-ai/ui/textarea';
import { Loader2, RotateCcw, History, Info, Calendar, ShieldCheck } from 'lucide-react';
import { FieldsExtractedPane, type ExtractedField } from '@/components/flow-ai/flowrms/FieldsExtractedPane';
import { type VersionSnapshot, formatChangeTypeLabel } from '@/components/flow-ai/hooks/useVersionHistory';
import { buildExtractedFields } from '@/lib/flow-ai/extracted-field-mapper';
import { buildLineItems, buildOther, buildPrimary } from '@/lib/flow-ai/parseExtracted';
import type { PdfPreviewPaneProps } from '@/components/flow-ai/flowrms/PdfPreviewPane';
import type { CsvBeforeAfterPaneProps } from '@/components/flow-ai/flowrms/CsvBeforeAfterPane';

interface CurrentPreviewData {
  versionNumber?: number | null;
  documentLabel?: string | null;
  isCsv: boolean;
  pdfUrl?: string | null;
  presignedPdfUrl?: string | null;
  convertedDocumentUrl?: string | null;
  pages?: Array<{ markdownContent?: string }> | null;
  fields: ExtractedField[];
  lineItems: Record<string, unknown>[];
  dataSets?: Array<{ index: number; label: string; value: string }>;
  activeDataSetIndex?: number;
  onDataSetChange?: (index: number) => void;
  originalCsvData?: unknown[][] | null;
  processedCsvData?: unknown[][] | null;
}

interface VersionComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: CurrentPreviewData;
  selectedVersionNumber?: number | null;
  selectedVersion?: VersionSnapshot | null;
  loadingSnapshot: boolean;
  snapshotError?: string | null;
  onRetrySnapshot: () => void;
  onRollback: (versionNumber: number, changeDescription?: string) => Promise<void>;
  isRollbacking: boolean;
  PdfPreviewComponent: React.ComponentType<PdfPreviewPaneProps>;
  CsvPreviewComponent: React.ComponentType<CsvBeforeAfterPaneProps>;
}

const FALLBACK_MESSAGE = 'Select a version from the history list to preview its snapshot.';

export function VersionComparisonModal({
  open,
  onOpenChange,
  current,
  selectedVersionNumber,
  selectedVersion,
  loadingSnapshot,
  snapshotError,
  onRetrySnapshot,
  onRollback,
  isRollbacking,
  PdfPreviewComponent,
  CsvPreviewComponent,
}: VersionComparisonModalProps) {
  const [rollbackNotes, setRollbackNotes] = useState('');
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0);

  useEffect(() => {
    setRollbackNotes('');
    setSelectedDatasetIndex(0);
  }, [selectedVersion?.versionNumber]);

  useEffect(() => {
    setSelectedDatasetIndex((prev) => {
      const maxIndex = Math.max(0, (selectedVersion?.dataSets?.length ?? 1) - 1);
      return Math.min(prev, maxIndex);
    });
  }, [selectedVersion?.dataSets?.length]);

  const PdfPreview = PdfPreviewComponent;
  const CsvPreview = CsvPreviewComponent;

  const selectedExtracted = selectedVersion?.extractedDataSets[selectedDatasetIndex];
  const selectedPrimary = useMemo(
    () => (selectedExtracted ? buildPrimary(selectedExtracted, selectedVersion?.entityType ?? null) : []),
    [selectedExtracted, selectedVersion?.entityType]
  );
  const selectedOther = useMemo(
    () => (selectedExtracted ? buildOther(selectedExtracted, selectedVersion?.entityType ?? null) : []),
    [selectedExtracted, selectedVersion?.entityType]
  );
  const selectedFields = useMemo(
    () => buildExtractedFields(selectedPrimary, selectedOther),
    [selectedPrimary, selectedOther]
  );
  const selectedLineItems = useMemo(
    () => (selectedExtracted ? buildLineItems(selectedExtracted) : []),
    [selectedExtracted]
  );
  const selectedChangeTypeLabel = formatChangeTypeLabel(selectedVersion?.changeType);

  const currentPdfUrl = current.presignedPdfUrl ?? current.pdfUrl ?? current.convertedDocumentUrl ?? undefined;
  const currentIsCsv = current.isCsv;
  const selectedIsCsv =
    selectedVersion?.isCsv ??
    Boolean(selectedVersion?.originalCsvData || selectedVersion?.processedCsvData);
  const selectedPdfUrl = selectedVersion?.originalPresignedUrl ?? selectedVersion?.convertedDocumentUrl ?? undefined;
  const selectedPages = selectedVersion?.pages ?? null;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setRollbackNotes('');
      setSelectedDatasetIndex(0);
    }
    onOpenChange(nextOpen);
  };

  const handleRollback = async () => {
    if (!selectedVersion) return;
    await onRollback(selectedVersion.versionNumber, rollbackNotes);
  };

  const safeSelectedIndex =
    selectedVersion?.dataSets && selectedVersion.dataSets.length > 0
      ? Math.min(selectedDatasetIndex, selectedVersion.dataSets.length - 1)
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[1500px] w-[98vw] h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-2xl font-semibold flex flex-wrap items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Version Comparison
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full">
          <div className="px-6 pb-6 space-y-8">
            <div className="grid gap-6 lg:grid-cols-2 pt-4">
              <div className="space-y-4">
                <div className="sticky top-0 z-20 bg-background/90 backdrop-blur flex items-center gap-3 border rounded-2xl px-4 py-3 shadow-sm">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Current Review
                  </h4>
                  {current.versionNumber ? (
                    <Badge variant="secondary">Version {current.versionNumber}</Badge>
                  ) : null}
                  {current.documentLabel && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {current.documentLabel}
                    </Badge>
                  )}
                </div>
                <div className="rounded-2xl border bg-card p-4 min-h-[120px] space-y-1">
                  <p className="font-medium truncate">{current.documentLabel ?? 'Active document'}</p>
                  <p className="text-sm text-muted-foreground">
                    {current.versionNumber ? `Version ${current.versionNumber}` : 'Live working copy'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {current.isCsv ? 'CSV comparison view' : 'PDF + extracted fields'}
                  </p>
                </div>

                {currentIsCsv ? (
                  <div className="space-y-4 h-[140vh]">
                    <CsvPreview
                      originalCsvData={current.originalCsvData}
                      processedCsvData={current.processedCsvData}
                      fileName={current.documentLabel ?? undefined}
                      disableInteractions
                      layout="stacked"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-card p-3 h-[60vh] overflow-hidden">
                      {currentPdfUrl ? (
                        <PdfPreview
                          fileUrl={currentPdfUrl}
                          fileName={current.documentLabel ?? undefined}
                          pages={current.pages ?? undefined}
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground p-6">
                          No PDF preview available for the current version.
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border bg-card p-3 h-[60vh] overflow-hidden">
                      <FieldsExtractedPane
                        fields={current.fields}
                        lineItems={current.lineItems}
                        dataSets={current.dataSets}
                        activeDataSetIndex={current.activeDataSetIndex}
                        onDataSetChange={current.onDataSetChange}
                        disableInteractions
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="sticky top-0 z-20 bg-background/90 backdrop-blur flex items-center justify-between gap-3 border rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                      <History className="w-4 h-4 text-primary" />
                      Selected Version
                    </h4>
                    {selectedVersionNumber && (
                      <Badge variant="secondary">Version {selectedVersionNumber}</Badge>
                    )}
                    {selectedChangeTypeLabel && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {selectedChangeTypeLabel}
                      </Badge>
                    )}
                    {selectedVersion?.createdAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedVersion.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {selectedVersion && !loadingSnapshot && (
                    <Button
                      size="sm"
                      onClick={handleRollback}
                      disabled={isRollbacking}
                      className="gap-2 shrink-0"
                    >
                      {isRollbacking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rollback to {selectedVersionNumber}
                    </Button>
                  )}
                </div>
                <div className="rounded-2xl border bg-card p-4 min-h-[120px] space-y-2">
                  {selectedVersion ? (
                    <>
                      {selectedVersion.userInstruction && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Instruction</p>
                          <p className="text-sm line-clamp-2">{selectedVersion.userInstruction}</p>
                        </div>
                      )}
                      {selectedVersion.changeDescription && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Description</p>
                          <p className="text-sm line-clamp-2">{selectedVersion.changeDescription}</p>
                        </div>
                      )}
                      {!selectedVersion.userInstruction && !selectedVersion.changeDescription && (
                        <p className="text-sm text-muted-foreground">No additional details provided.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{FALLBACK_MESSAGE}</p>
                  )}
                </div>

                {snapshotError && (
                  <div className="p-4 border border-destructive/40 bg-destructive/10 rounded-lg text-sm text-destructive flex items-center justify-between gap-4">
                    <span>{snapshotError}</span>
                    <Button size="sm" variant="outline" onClick={onRetrySnapshot}>
                      Retry
                    </Button>
                  </div>
                )}

                {loadingSnapshot ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <p className="text-sm">Loading version snapshot…</p>
                  </div>
                ) : !selectedVersion ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <Info className="w-6 h-6" />
                    <p className="text-sm">{FALLBACK_MESSAGE}</p>
                  </div>
                ) : (
                  <>
                    {selectedIsCsv ? (
                      selectedVersion.originalCsvData || selectedVersion.processedCsvData ? (
                        <div className="h-[140vh]">
                          <CsvPreview
                            originalCsvData={selectedVersion.originalCsvData}
                            processedCsvData={selectedVersion.processedCsvData}
                            fileName={`Version ${selectedVersion.versionNumber}`}
                            disableInteractions
                            layout="stacked"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground p-6 border rounded-2xl bg-card">
                          CSV preview is not available for this version.
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-2xl border bg-card p-3 h-[60vh] overflow-hidden">
                          {selectedPdfUrl || currentPdfUrl ? (
                            <PdfPreview
                              fileUrl={selectedPdfUrl ?? currentPdfUrl!}
                              fileName={`Version ${selectedVersion.versionNumber}`}
                              pages={selectedPages ?? current.pages ?? undefined}
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground p-6">
                              No PDF preview available for this version.
                            </div>
                          )}
                        </div>
                        <div className="rounded-2xl border bg-card p-3 h-[60vh] overflow-hidden">
                          <FieldsExtractedPane
                            fields={selectedFields}
                            lineItems={selectedLineItems}
                            dataSets={selectedVersion.dataSets}
                            activeDataSetIndex={safeSelectedIndex}
                            onDataSetChange={setSelectedDatasetIndex}
                            disableInteractions
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {selectedVersion && !loadingSnapshot && (
              <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <h5 className="text-sm font-semibold flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-primary" />
                  Roll back to this version
                </h5>
                <Textarea
                  placeholder="Optional: describe why you're rolling back"
                  value={rollbackNotes}
                  onChange={(event) => setRollbackNotes(event.target.value)}
                />
                <div className="flex items-center justify-end gap-3">
                  <Button
                    onClick={handleRollback}
                    disabled={isRollbacking}
                    className="gap-2"
                  >
                    {isRollbacking && <Loader2 className="w-4 h-4 animate-spin" />}
                    Rollback to Version {selectedVersion.versionNumber}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}










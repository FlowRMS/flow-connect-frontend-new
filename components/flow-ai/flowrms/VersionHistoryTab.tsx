'use client';

import { History, GitBranch, RefreshCcw, MessageSquare, Hash, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { Card, CardContent, CardHeader } from '@/components/flow-ai/ui/card';
import { Badge } from '@/components/flow-ai/ui/badge';
import { VersionHistoryEntry, formatChangeTypeLabel } from '@/components/flow-ai/hooks/useVersionHistory';

interface VersionHistoryTabProps {
  items: VersionHistoryEntry[];
  loading: boolean;
  error?: string | null;
  onRefresh: () => void;
  onSelect: (entry: VersionHistoryEntry) => void;
  currentVersionNumber?: number;
  onUndoCurrent?: () => void;
  canUndoCurrent?: boolean;
  isUndoing?: boolean;
}

function formatDate(input: string) {
  try {
    return new Date(input).toLocaleString();
  } catch {
    return input;
  }
}

function parseMetadata(metadata?: string | null) {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    const entries = Object.entries(parsed);
    if (entries.length === 0) return null;
    return entries.slice(0, 3);
  } catch {
    return null;
  }
}

export function VersionHistoryTab({
  items,
  loading,
  error,
  onRefresh,
  onSelect,
  currentVersionNumber,
  onUndoCurrent,
  canUndoCurrent = false,
  isUndoing = false,
}: VersionHistoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Versioning History
          </h3>
          <p className="text-sm text-muted-foreground">
            Review every instruction, code execution, and rollback-ready version snapshot.
          </p>
        </div>
        <Button 
          variant="default" 
          size="lg" 
          onClick={onRefresh} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3"
        >
          <RefreshCcw className="w-5 h-5 mr-2" />
          Refresh History
        </Button>
      </div>

      {error && (
        <div className="p-4 border border-destructive/40 bg-destructive/10 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && !items.length ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center">
          <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No previous versions have been recorded yet. Run instructions to build history.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((entry) => {
            const isCurrent = entry.versionNumber === currentVersionNumber;
            const metadataPreview = parseMetadata(entry.metadata);
            const changeTypeLabel = formatChangeTypeLabel(entry.changeType);

            return (
              <Card key={entry.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                      Version {entry.versionNumber}
                    </Badge>
                    {changeTypeLabel && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        {changeTypeLabel}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs">
                        Current
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <History className="w-4 h-4" />
                      {formatDate(entry.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => onSelect(entry)}
                      disabled={isCurrent || loading}
                      variant={isCurrent ? 'outline' : 'default'}
                      className="gap-2"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Compare & Rollback
                    </Button>
                    {isCurrent && onUndoCurrent && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={onUndoCurrent}
                        disabled={loading || isUndoing || !canUndoCurrent}
                        className="gap-2"
                      >
                        {isUndoing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Undo to Previous
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {entry.changeDescription && (
                    <p className="text-sm text-foreground">{entry.changeDescription}</p>
                  )}

                  {entry.userInstruction && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4 mt-0.5" />
                      <span className="italic">“{entry.userInstruction}”</span>
                    </div>
                  )}

                  <div className="grid gap-2 text-xs text-muted-foreground">
                    {entry.pendingDocumentId && (
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="truncate">Pending ID: {entry.pendingDocumentId}</span>
                      </div>
                    )}
                  </div>

                  {metadataPreview && (
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/40">
                      {metadataPreview.map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-medium capitalize">{key}:</span>
                          <span className="truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}










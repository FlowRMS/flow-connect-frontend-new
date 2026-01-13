'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { Search, Sparkles, Loader2, RefreshCw, FileText, Hash, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/flow-ai/ui/dialog';
import { Input } from '@/components/flow-ai/ui/input';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { cn } from '@/lib/flow-ai/cn';
import { Q_GET_CLUSTERS } from '@/lib/flow-ai/gql';
import { toast } from 'sonner';

interface Cluster {
  id: string;
  additionalInstructions: string[];
  clusterMetadata: string | null;
  clusterName: string | null;
  createdAt: string;
  documentCount: number;
}

interface EnrichedCluster extends Cluster {
  metadata: {
    sourceName: string | null;
    sourceType: string | null;
    entityType: string | null;
  };
}

interface SelectTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (clusterId: string) => Promise<boolean> | boolean;
  isApplyingTemplate?: boolean;
}

export function SelectTemplateModal({
  open,
  onOpenChange,
  onApplyTemplate,
  isApplyingTemplate = false,
}: SelectTemplateModalProps) {
  const apolloClient = useApolloClient();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [showNoInstructionsWarning, setShowNoInstructionsWarning] = useState(false);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: Q_GET_CLUSTERS,
        fetchPolicy: 'network-only',
      });
      const payload = data as { clusters?: Cluster[] };
      setClusters(payload.clusters ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load templates.';
      toast.error('Unable to load templates', { description: message });
    } finally {
      setLoading(false);
    }
  }, [apolloClient]);

  useEffect(() => {
    if (open) {
      void fetchClusters();
    }
  }, [open, fetchClusters]);

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setSelectedClusterId(null);
      setShowNoInstructionsWarning(false);
    }
  }, [open]);

  const handleSelectCluster = useCallback((cluster: EnrichedCluster) => {
    if (cluster.additionalInstructions.length === 0) {
      setShowNoInstructionsWarning(true);
    } else {
      setSelectedClusterId(cluster.id);
    }
  }, []);

  const enrichedClusters = useMemo<EnrichedCluster[]>(() => {
    return clusters.map((cluster) => {
      let metadata: EnrichedCluster['metadata'] = {
        sourceName: null,
        sourceType: null,
        entityType: null,
      };

      if (cluster.clusterMetadata) {
        try {
          const parsed = JSON.parse(cluster.clusterMetadata) as {
            source_name?: string;
            source_type?: string;
            entity_type?: string;
          };
          metadata = {
            sourceName: parsed.source_name ?? null,
            sourceType: parsed.source_type ?? null,
            entityType: parsed.entity_type ?? null,
          };
        } catch (error) {
          console.warn('Failed to parse cluster metadata', cluster.id, error);
        }
      }

      return {
        ...cluster,
        metadata,
      };
    });
  }, [clusters]);

  const filteredClusters = useMemo(() => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return enrichedClusters;

    return enrichedClusters.filter((cluster) => {
      const matchesId = cluster.id.toLowerCase().includes(value);
      const matchesName = cluster.clusterName?.toLowerCase().includes(value);
      const matchesSource = cluster.metadata.sourceName?.toLowerCase().includes(value);
      const matchesInstructions = cluster.additionalInstructions.some((inst) =>
        inst.toLowerCase().includes(value)
      );
      return matchesId || matchesName || matchesSource || matchesInstructions;
    });
  }, [enrichedClusters, searchTerm]);

  const handleApply = useCallback(async () => {
    if (!selectedClusterId) {
      toast.error('Select a template to apply.');
      return;
    }
    const success = await Promise.resolve(onApplyTemplate(selectedClusterId));
    if (success) {
      setSelectedClusterId(null);
      onOpenChange(false);
    }
  }, [selectedClusterId, onApplyTemplate, onOpenChange]);

  const selectedCluster = useMemo(
    () => enrichedClusters.find((cluster) => cluster.id === selectedClusterId) ?? null,
    [enrichedClusters, selectedClusterId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Select Template
          </DialogTitle>
          <DialogDescription>
            Browse existing templates and apply their saved instructions to the current document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchTerm}
                placeholder="Search by template name, ID, source, or instruction"
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchClusters()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredClusters.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground border rounded-lg">
                {clusters.length === 0
                  ? 'No templates are available yet.'
                  : 'No templates match your search query.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                {filteredClusters.map((cluster) => {
                  const isSelected = cluster.id === selectedClusterId;
                  const hasNoInstructions = cluster.additionalInstructions.length === 0;
                  return (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => handleSelectCluster(cluster)}
                      className={cn(
                        'text-left border-2 rounded-xl p-4 transition-colors focus:outline-none focus-visible:ring-2 h-full',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/40'
                          : hasNoInstructions
                            ? 'border-border opacity-60 hover:border-amber-400/50'
                            : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {cluster.clusterName || 'Untitled Template'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Hash className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{cluster.id}</span>
                          </p>
                        </div>
                        <Badge variant="secondary" className="flex-shrink-0">
                          {cluster.documentCount} doc{cluster.documentCount === 1 ? '' : 's'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cluster.metadata.sourceName && (
                          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                            <FileText className="w-3 h-3 mr-1" />
                            {cluster.metadata.sourceName}
                          </Badge>
                        )}
                        {cluster.metadata.sourceType && (
                          <Badge variant="default" className="bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20">
                            {cluster.metadata.sourceType}
                          </Badge>
                        )}
                        {cluster.metadata.entityType && (
                          <Badge variant="default" className="bg-accent text-accent-foreground border-border">
                            {cluster.metadata.entityType}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Instructions
                        </p>
                        {cluster.additionalInstructions.length ? (
                          <ul className="text-sm text-foreground space-y-1">
                            {cluster.additionalInstructions.slice(0, 3).map((instruction, index) => (
                              <li key={`${cluster.id}-${index}`} className="line-clamp-2">
                                • {instruction}
                              </li>
                            ))}
                            {cluster.additionalInstructions.length > 3 && (
                              <li className="text-xs text-muted-foreground">
                                +{cluster.additionalInstructions.length - 3} more
                              </li>
                            )}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">No saved instructions</p>
                        )}
                      </div>
                      {isSelected && (
                        <p className="mt-3 text-xs text-primary font-medium">
                          Selected template will be applied to this pending document.
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-4 border-t">
          {selectedCluster ? (
            <div className="text-xs text-muted-foreground">
              Applying:
              <span className="font-medium text-foreground ml-1">
                {selectedCluster.clusterName || selectedCluster.metadata.sourceName || selectedCluster.id}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Select a template to continue.</div>
          )}
          <div className="flex gap-2 sm:flex-shrink-0">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selectedClusterId || isApplyingTemplate}
            >
              {isApplyingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Apply Template
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* No Instructions Warning Modal */}
      <Dialog open={showNoInstructionsWarning} onOpenChange={setShowNoInstructionsWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Template Has No Instructions
            </DialogTitle>
            <DialogDescription>
              This template does not have any saved instructions, so it cannot be applied to your document. Please select a different template that has instructions configured.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowNoInstructionsWarning(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}










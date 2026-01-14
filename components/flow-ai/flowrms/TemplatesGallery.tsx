'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Eye, Building2, FileText, Clock, Hash, File } from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';

interface Cluster {
  id: string;
  additionalInstructions: string[];
  clusterMetadata: string | null;
  clusterName: string | null;
  createdAt: string;
  documentCount: number;
}

interface ClusterDocument {
  id: string;
  sourceName?: string | null;
  sourceType?: string | null;
  entityType?: string | null;
}

interface TemplatesGalleryProps {
  clusters: Cluster[];
  onPreviewCluster?: (cluster: Cluster) => void;
  className?: string;
}

function formatLastUsed(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString();
}

export function TemplatesGallery({ clusters, onPreviewCluster, className }: TemplatesGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstructions, setFilterInstructions] = useState<string>('all');
  const [filterSourceType, setFilterSourceType] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterDocCount, setFilterDocCount] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Parse metadata from clusterMetadata field directly (no need to fetch documents)
  const clusterMetadata = useMemo(() => {
    const metadataMap = new Map<string, ClusterDocument>();
    
    for (const cluster of clusters) {
      if (cluster.clusterMetadata) {
        try {
          const parsed = JSON.parse(cluster.clusterMetadata);
          metadataMap.set(cluster.id, {
            id: cluster.id,
            sourceName: parsed.source_name || null,
            sourceType: parsed.source_type || null,
            entityType: parsed.entity_type || null,
          });
        } catch (error) {
          console.error(`Failed to parse metadata for cluster ${cluster.id}:`, error);
        }
      }
    }
    
    return metadataMap;
  }, [clusters]);

  // Get unique source types and entity types
  const uniqueSourceTypes = useMemo(() => {
    const types = new Set<string>();
    clusterMetadata.forEach((metadata) => {
      if (metadata.sourceType) types.add(metadata.sourceType);
    });
    return Array.from(types).sort();
  }, [clusterMetadata]);

  const uniqueEntityTypes = useMemo(() => {
    const types = new Set<string>();
    clusterMetadata.forEach((metadata) => {
      if (metadata.entityType) types.add(metadata.entityType);
    });
    return Array.from(types).sort();
  }, [clusterMetadata]);

  // Filter clusters
  const filteredClusters = useMemo(() => {
    return clusters.filter((cluster) => {
      const metadata = clusterMetadata.get(cluster.id);
      
      // Search filter
      const matchesSearch =
        cluster.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cluster.additionalInstructions.some((inst) =>
          inst.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        (metadata?.sourceName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      // Instructions filter
      const matchesInstructions =
        filterInstructions === 'all' ||
        (filterInstructions === 'with-instructions' &&
          cluster.additionalInstructions.length > 0) ||
        (filterInstructions === 'no-instructions' && cluster.additionalInstructions.length === 0);

      // Source type filter
      const matchesSourceType =
        filterSourceType === 'all' ||
        metadata?.sourceType?.toLowerCase() === filterSourceType.toLowerCase();

      // Entity type filter
      const matchesEntityType =
        filterEntityType === 'all' ||
        metadata?.entityType?.toLowerCase() === filterEntityType.toLowerCase();

      // Document count filter
      const matchesDocCount =
        filterDocCount === 'all' ||
        (filterDocCount === '1-5' && cluster.documentCount >= 1 && cluster.documentCount <= 5) ||
        (filterDocCount === '6-10' && cluster.documentCount >= 6 && cluster.documentCount <= 10) ||
        (filterDocCount === '11-20' && cluster.documentCount >= 11 && cluster.documentCount <= 20) ||
        (filterDocCount === '21+' && cluster.documentCount >= 21);

      return matchesSearch && matchesInstructions && matchesSourceType && matchesEntityType && matchesDocCount;
    });
  }, [clusters, clusterMetadata, searchTerm, filterInstructions, filterSourceType, filterEntityType, filterDocCount]);

  // Sort clusters
  const sortedClusters = useMemo(() => {
    const sorted = [...filteredClusters];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most-docs':
        sorted.sort((a, b) => b.documentCount - a.documentCount);
        break;
      case 'least-docs':
        sorted.sort((a, b) => a.documentCount - b.documentCount);
        break;
      case 'most-instructions':
        sorted.sort((a, b) => b.additionalInstructions.length - a.additionalInstructions.length);
        break;
      case 'name':
        sorted.sort((a, b) => {
          const nameA = clusterMetadata.get(a.id)?.sourceName || a.id;
          const nameB = clusterMetadata.get(b.id)?.sourceName || b.id;
          return nameA.localeCompare(nameB);
        });
        break;
    }
    
    return sorted;
  }, [filteredClusters, sortBy, clusterMetadata]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Document clusters with custom extraction instructions
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* First Row: Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID, or instructions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Sort By */}
            <div className="relative min-w-[200px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border rounded-lg bg-background text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-docs">Most Documents</option>
                <option value="least-docs">Least Documents</option>
                <option value="most-instructions">Most Instructions</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Second Row: Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Instructions Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <select
                value={filterInstructions}
                onChange={(e) => setFilterInstructions(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border rounded-lg bg-background text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="all">All Templates</option>
                <option value="with-instructions">With Instructions</option>
                <option value="no-instructions">No Instructions</option>
              </select>
            </div>

            {/* Source Type Filter */}
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <select
                value={filterSourceType}
                onChange={(e) => setFilterSourceType(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border rounded-lg bg-background text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="all">All Sources</option>
                {uniqueSourceTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="relative">
              <File className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border rounded-lg bg-background text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="all">All Entities</option>
                {uniqueEntityTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Count Filter */}
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              <select
                value={filterDocCount}
                onChange={(e) => setFilterDocCount(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border rounded-lg bg-background text-sm text-foreground appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="all">All Counts</option>
                <option value="1-5">1-5 docs</option>
                <option value="6-10">6-10 docs</option>
                <option value="11-20">11-20 docs</option>
                <option value="21+">21+ docs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count and Active Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {sortedClusters.length} of {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
          </p>
          
          {/* Clear Filters Button */}
          {(searchTerm || filterInstructions !== 'all' || filterSourceType !== 'all' || filterEntityType !== 'all' || filterDocCount !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterInstructions('all');
                setFilterSourceType('all');
                setFilterEntityType('all');
                setFilterDocCount('all');
              }}
              className="text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Clusters Grid */}
      {sortedClusters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedClusters.map((cluster) => {
            const clusterColor = '#5048E6'; // Default primary color
            const metadata = clusterMetadata.get(cluster.id);
            const clusterName = cluster.clusterName || `Template ${cluster.id.slice(0, 8)}`;
            const sourceType = metadata?.sourceType;
            const entityType = metadata?.entityType;
            
            // Capitalize first letter only
            const formattedSourceType = sourceType 
              ? sourceType.charAt(0).toUpperCase() + sourceType.slice(1).toLowerCase()
              : null;
            const formattedEntityType = entityType 
              ? entityType.charAt(0).toUpperCase() + entityType.slice(1).toLowerCase()
              : null;
            
            // Different colors based on source type
            const sourceTypeColor = sourceType?.toUpperCase() === 'FACTORY'
              ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
              : sourceType?.toUpperCase() === 'CUSTOMER'
              ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20'
              : 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';

            return (
              <div
                key={cluster.id}
                className="group border rounded-xl bg-card p-6 hover:shadow-md transition-all duration-200 relative overflow-hidden cursor-pointer"
                onClick={() => onPreviewCluster?.(cluster)}
              >
                {/* Color Accent */}
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: clusterColor }}
                />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
                        <span>
                          {clusterName}
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border bg-primary/10 text-primary border-primary/20">
                          <FileText className="w-3 h-3" />
                          <span>{cluster.documentCount} docs</span>
                        </div>
                        {formattedSourceType && (
                          <div className={cn("inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border", sourceTypeColor)}>
                            <Building2 className="w-3 h-3" />
                            <span>{formattedSourceType}</span>
                          </div>
                        )}
                        {formattedEntityType && (
                          <div className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                            <span>{formattedEntityType}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {onPreviewCluster && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewCluster(cluster);
                        }}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title="Preview cluster"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-y-1">
                    <div className="flex items-center space-x-1">
                      <Hash className="w-3 h-3" />
                      <span>{cluster.additionalInstructions.length} instructions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatLastUsed(cluster.createdAt)}</span>
                    </div>
                  </div>

                  {/* Preview Instructions */}
                  {cluster.additionalInstructions.length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md line-clamp-2">
                      {cluster.additionalInstructions[0]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No clusters found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterInstructions !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No document clusters available yet'}
          </p>
        </div>
      )}
    </div>
  );
}










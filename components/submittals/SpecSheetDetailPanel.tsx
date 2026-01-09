'use client';

import React, { useState, useMemo } from 'react';
import { specSheetCategoryLabels } from '../../lib/data/submittals-mock';
import type { SpecSheet, SpecSheetCategory, HighlightDefinition, HighlightRegion } from '../../lib/types/submittals';
import HighlightEditor from './HighlightEditor';
import {
  useHighlightVersions,
  useCreateHighlightVersion,
  useUpdateHighlightRegions,
} from './api/useSpecSheetsApi';

// Valid highlight shapes - used for runtime validation
const VALID_SHAPES = ['highlight', 'rectangle', 'circle', 'arrow', 'text', 'freehand'] as const;
type ValidShape = typeof VALID_SHAPES[number];

// Validate and normalize shape type from API
function normalizeShapeType(shapeType: string): HighlightRegion['shape'] {
  const normalized = shapeType.toLowerCase();
  if (VALID_SHAPES.includes(normalized as ValidShape)) {
    return normalized as HighlightRegion['shape'];
  }
  // Default to 'highlight' for unknown shapes
  console.warn(`Unknown shape type: ${shapeType}, defaulting to 'highlight'`);
  return 'highlight';
}

interface SpecSheetDetailPanelProps {
  specSheet: SpecSheet;
  highlightCount: number;
  onClose: () => void;
  onHighlightSave?: (catalogNumber: string, manufacturer: string, regions: HighlightRegion[]) => void;
}

export default function SpecSheetDetailPanel({ specSheet, highlightCount, onClose, onHighlightSave }: SpecSheetDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'highlights'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCategories, setEditedCategories] = useState<SpecSheetCategory[]>(specSheet.categories);

  // Highlight editor state
  const [showHighlightEditor, setShowHighlightEditor] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<HighlightDefinition | undefined>(undefined);
  const [newHighlightCatalog, setNewHighlightCatalog] = useState('');
  const [showNewHighlightForm, setShowNewHighlightForm] = useState(false);

  // API hooks for highlights
  const { data: highlightVersions = [], isLoading: isLoadingHighlights } = useHighlightVersions(specSheet.id);
  const createHighlightVersionMutation = useCreateHighlightVersion();
  const updateHighlightRegionsMutation = useUpdateHighlightRegions();

  // Transform API highlight versions to frontend HighlightDefinition format
  const highlights: HighlightDefinition[] = useMemo(() => {
    return highlightVersions.map(version => ({
      id: version.id,
      specSheetId: version.specSheetId,
      catalogNumber: version.name, // Using version name as catalog number
      manufacturer: specSheet.manufacturer,
      regions: version.regions.map(r => ({
        id: r.id,
        pageNumber: r.pageNumber,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        shape: normalizeShapeType(r.shapeType),
        color: r.color,
        annotation: r.annotation || undefined,
      })),
      createdAt: version.createdAt,
      createdBy: version.createdBy.fullName,
      updatedAt: version.createdAt, // API doesn't have separate updated timestamps
      updatedBy: version.createdBy.fullName,
    }));
  }, [highlightVersions, specSheet.manufacturer]);

  const allCategories: SpecSheetCategory[] = [
    'indoor', 'outdoor', 'sports_lighting', 'controls', 'emergency',
    'decorative', 'industrial', 'drives', 'sub_metering', 'cable_tray', 'other'
  ];

  const toggleCategory = (category: SpecSheetCategory) => {
    setEditedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleAddHighlight = () => {
    if (newHighlightCatalog.trim()) {
      setEditingHighlight(undefined);
      setShowHighlightEditor(true);
      setShowNewHighlightForm(false);
    }
  };

  const handleEditHighlight = (highlight: HighlightDefinition) => {
    setEditingHighlight(highlight);
    setNewHighlightCatalog(highlight.catalogNumber);
    setShowHighlightEditor(true);
  };

  const handleSaveHighlight = async (regions: HighlightRegion[]) => {
    const catalogNumber = editingHighlight?.catalogNumber || newHighlightCatalog;
    const manufacturer = editingHighlight?.manufacturer || specSheet.manufacturer;

    try {
      // Transform regions to API format
      const apiRegions = regions.map(r => ({
        pageNumber: r.pageNumber,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        shapeType: r.shape,
        color: r.color,
        annotation: r.annotation,
      }));

      if (editingHighlight?.id) {
        // Update existing highlight version
        await updateHighlightRegionsMutation.mutateAsync({
          versionId: editingHighlight.id,
          regions: apiRegions,
        });
      } else {
        // Create new highlight version, then update regions
        const newVersion = await createHighlightVersionMutation.mutateAsync({
          specSheetId: specSheet.id,
          name: catalogNumber,
          description: `Highlights for ${catalogNumber}`,
        });
        if (regions.length > 0) {
          await updateHighlightRegionsMutation.mutateAsync({
            versionId: newVersion.id,
            regions: apiRegions,
          });
        }
      }

      // Also call the legacy callback if provided
      onHighlightSave?.(catalogNumber, manufacturer, regions);
    } catch (error) {
      console.error('Failed to save highlight:', error);
      alert('Failed to save highlight. Please try again.');
    }

    setShowHighlightEditor(false);
    setEditingHighlight(undefined);
    setNewHighlightCatalog('');
  };

  return (
    <div className="w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold text-[var(--foreground)] truncate pr-2">Spec Sheet Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[var(--muted)] rounded transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Preview */}
      <div className="aspect-[4/3] bg-[var(--muted)] flex items-center justify-center relative border-b border-[var(--border)]">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--muted-foreground)]">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H8M10 13H8M14 13h-4M14 17H8" strokeLinecap="round"/>
        </svg>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">
            {specSheet.pageCount} pages
          </span>
          <button className="flex items-center gap-1 text-xs bg-[var(--primary)] text-white px-3 py-1.5 rounded hover:bg-[var(--primary-hover)] transition-colors">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 9-8 9 8 9 8-4 8-9 8-9-8-9-8z"/>
              <circle cx="10" cy="12" r="3"/>
            </svg>
            Preview
          </button>
        </div>
        {specSheet.needsReview && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14h.01"/>
              </svg>
              Needs Review
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab('highlights')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'highlights'
              ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          }`}
        >
          Highlights ({highlightCount})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                Name
              </label>
              <p className="text-sm font-medium text-[var(--foreground)]">{specSheet.displayName}</p>
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                Manufacturer
              </label>
              <p className="text-sm text-[var(--foreground)]">{specSheet.manufacturer}</p>
            </div>

            {/* File Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  File Size
                </label>
                <p className="text-sm text-[var(--foreground)]">{formatFileSize(specSheet.fileSize)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Pages
                </label>
                <p className="text-sm text-[var(--foreground)]">{specSheet.pageCount}</p>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Times Used
                </label>
                <p className="text-sm text-[var(--foreground)]">{specSheet.usageCount}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Highlights
                </label>
                <p className="text-sm text-[var(--foreground)]">{highlightCount}</p>
              </div>
            </div>

            {/* Upload Info */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                Uploaded
              </label>
              <p className="text-sm text-[var(--foreground)]">
                {formatDate(specSheet.uploadedAt)} by {specSheet.uploadedBy}
              </p>
            </div>

            {/* Source */}
            {specSheet.sourceUrl && (
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
                  Source URL
                </label>
                <a
                  href={specSheet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] truncate block"
                >
                  {specSheet.sourceUrl}
                </a>
              </div>
            )}

            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Categories
                </label>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  {isEditing ? 'Done' : 'Edit'}
                </button>
              </div>
              {isEditing ? (
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        editedCategories.includes(cat)
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                      }`}
                    >
                      {specSheetCategoryLabels[cat]}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {specSheet.categories.map(cat => (
                    <span key={cat} className="px-2 py-1 text-xs bg-[var(--muted)] text-[var(--foreground)] rounded">
                      {specSheetCategoryLabels[cat]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {highlights.length === 0 && !showNewHighlightForm ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--muted-foreground)]">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">No highlights defined yet</p>
                <button
                  onClick={() => setShowNewHighlightForm(true)}
                  className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  Add highlight for a part number
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* New Highlight Form */}
                {showNewHighlightForm && (
                  <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg p-3">
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">
                      Part/Catalog Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newHighlightCatalog}
                        onChange={(e) => setNewHighlightCatalog(e.target.value)}
                        placeholder="e.g. AX1-LED-40K"
                        className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddHighlight();
                          if (e.key === 'Escape') {
                            setShowNewHighlightForm(false);
                            setNewHighlightCatalog('');
                          }
                        }}
                      />
                      <button
                        onClick={handleAddHighlight}
                        disabled={!newHighlightCatalog.trim()}
                        className="px-3 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setShowNewHighlightForm(false);
                        setNewHighlightCatalog('');
                      }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-2"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* Existing Highlights */}
                {highlights.map(highlight => (
                  <HighlightItem
                    key={highlight.id}
                    highlight={highlight}
                    onEdit={() => handleEditHighlight(highlight)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button
          onClick={() => {
            setActiveTab('highlights');
            setShowNewHighlightForm(true);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Add Highlight
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M12 18v-6M9 15l3 3 3-3"/>
            </svg>
            Replace PDF
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h14M8 6V4h4v2M5 6v12a2 2 0 002 2h6a2 2 0 002-2V6"/>
            </svg>
            Delete
          </button>
        </div>
      </div>

      {/* Highlight Editor Modal */}
      {showHighlightEditor && (
        <HighlightEditor
          specSheet={specSheet}
          catalogNumber={editingHighlight?.catalogNumber || newHighlightCatalog}
          manufacturer={editingHighlight?.manufacturer || specSheet.manufacturer}
          existingHighlight={editingHighlight}
          onSave={handleSaveHighlight}
          onClose={() => {
            setShowHighlightEditor(false);
            setEditingHighlight(undefined);
            setNewHighlightCatalog('');
          }}
        />
      )}
    </div>
  );
}

// Highlight Item Component
function HighlightItem({ highlight, onEdit }: { highlight: HighlightDefinition; onEdit?: () => void }) {
  return (
    <div className="bg-[var(--muted)]/50 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">{highlight.catalogNumber}</p>
          <p className="text-xs text-[var(--muted-foreground)]">{highlight.manufacturer}</p>
        </div>
        <button
          onClick={onEdit}
          className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
          title="Edit highlight"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 13V16H7L16 7L13 4L4 13Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="16" height="16" rx="2"/>
          </svg>
          {highlight.regions.length} region{highlight.regions.length !== 1 ? 's' : ''}
        </span>
        <span>•</span>
        <span>
          Page{highlight.regions.length > 1 ? 's' : ''} {Array.from(new Set(highlight.regions.map(r => r.pageNumber))).sort((a, b) => a - b).join(', ')}
        </span>
      </div>
    </div>
  );
}

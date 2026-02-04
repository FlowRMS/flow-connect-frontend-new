import { useState, useMemo } from 'react';
import type { SpecSheet, HighlightDefinition, HighlightRegion } from '../../../lib/types/submittals';
import {
  useHighlightVersions,
  useCreateHighlightVersion,
  useUpdateHighlightRegions,
} from '../api/useSpecSheetsApi';

// Valid highlight shapes - used for runtime validation
const VALID_SHAPES = ['highlight', 'rectangle', 'circle', 'arrow', 'text', 'freehand'] as const;
type ValidShape = typeof VALID_SHAPES[number];

// Validate and normalize shape type from API
function normalizeShapeType(shapeType: string): HighlightRegion['shape'] {
  const normalized = shapeType.toLowerCase();
  if (VALID_SHAPES.includes(normalized as ValidShape)) {
    return normalized as HighlightRegion['shape'];
  }
  console.warn(`Unknown shape type: ${shapeType}, defaulting to 'highlight'`);
  return 'highlight';
}

interface UseHighlightPanelParams {
  specSheet: SpecSheet;
  onHighlightSave?: (catalogNumber: string, manufacturer: string, regions: HighlightRegion[]) => void;
}

export function useHighlightPanel({ specSheet, onHighlightSave }: UseHighlightPanelParams) {
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
      catalogNumber: version.name,
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
      updatedAt: version.createdAt,
      updatedBy: version.createdBy.fullName,
    }));
  }, [highlightVersions, specSheet.manufacturer]);

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
        await updateHighlightRegionsMutation.mutateAsync({
          versionId: editingHighlight.id,
          regions: apiRegions,
        });
      } else {
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

      onHighlightSave?.(catalogNumber, manufacturer, regions);
    } catch (error) {
      console.error('Failed to save highlight:', error);
      alert('Failed to save highlight. Please try again.');
    }

    setShowHighlightEditor(false);
    setEditingHighlight(undefined);
    setNewHighlightCatalog('');
  };

  const handleCloseEditor = () => {
    setShowHighlightEditor(false);
    setEditingHighlight(undefined);
    setNewHighlightCatalog('');
  };

  const handleCancelNewForm = () => {
    setShowNewHighlightForm(false);
    setNewHighlightCatalog('');
  };

  return {
    // State
    highlights,
    isLoadingHighlights,
    showHighlightEditor,
    editingHighlight,
    newHighlightCatalog,
    showNewHighlightForm,
    // Setters
    setNewHighlightCatalog,
    setShowNewHighlightForm,
    // Handlers
    handleAddHighlight,
    handleEditHighlight,
    handleSaveHighlight,
    handleCloseEditor,
    handleCancelNewForm,
  };
}

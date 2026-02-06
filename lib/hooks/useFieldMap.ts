'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getFieldMap,
  saveFieldMap,
  buildFieldMapInput,
  parseFieldMapResponse,
  type FieldMapResponse,
  type FieldMapType,
  type FieldMapFieldResponse,
  type CategoryConfigResponse,
  type FieldInput,
} from '@/lib/graphql/index';

export interface UseFieldMapOptions {
  /**
   * The type of field map to load (POS or POT)
   */
  mapType: FieldMapType;
  /**
   * Optional organization ID for organization-specific mappings
   */
  organizationId?: string | null;
  /**
   * Whether to load data on mount (default: true)
   */
  loadOnMount?: boolean;
}

export interface UseFieldMapReturn {
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error message if any
   */
  error: string | null;
  /**
   * Saving state
   */
  isSaving: boolean;
  /**
   * The raw field map response from the server
   */
  fieldMapData: FieldMapResponse | null;
  /**
   * Parsed field mappings as a key-value record
   */
  fieldMappings: Record<string, string>;
  /**
   * Manufacturer visibility settings
   */
  manufacturerVisibility: Record<string, boolean>;
  /**
   * Rep visibility settings
   */
  repVisibility: Record<string, boolean>;
  /**
   * Category configurations
   */
  categories: CategoryConfigResponse[];
  /**
   * Field definitions with full metadata
   */
  fields: FieldMapFieldResponse[];
  /**
   * Update a single field mapping
   */
  updateFieldMapping: (standardFieldKey: string, organizationFieldName: string) => void;
  /**
   * Update manufacturer visibility for a field
   */
  updateManufacturerVisibility: (standardFieldKey: string, visible: boolean) => void;
  /**
   * Update rep visibility for a field
   */
  updateRepVisibility: (standardFieldKey: string, visible: boolean) => void;
  /**
   * Save all current mappings to the server
   */
  save: () => Promise<boolean>;
  /**
   * Reload field map from server
   */
  reload: () => Promise<void>;
  /**
   * Check if there are unsaved changes
   */
  hasChanges: boolean;
  /**
   * Reset to last saved state
   */
  reset: () => void;
}

/**
 * Hook for managing field mapping state and GraphQL operations.
 * Handles loading, updating, and saving field mappings.
 */
export function useFieldMap(options: UseFieldMapOptions): UseFieldMapReturn {
  const { mapType, organizationId = null, loadOnMount = true } = options;

  // Loading states
  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [fieldMapData, setFieldMapData] = useState<FieldMapResponse | null>(null);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [manufacturerVisibility, setManufacturerVisibility] = useState<Record<string, boolean>>({});
  const [repVisibility, setRepVisibility] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<CategoryConfigResponse[]>([]);
  const [fields, setFields] = useState<FieldMapFieldResponse[]>([]);

  // Track original state for change detection
  const [originalMappings, setOriginalMappings] = useState<Record<string, string>>({});
  const [originalManufacturerVisibility, setOriginalManufacturerVisibility] = useState<Record<string, boolean>>({});
  const [originalRepVisibility, setOriginalRepVisibility] = useState<Record<string, boolean>>({});

  // Load field map from server
  const loadFieldMap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getFieldMap({ mapType, organizationId });

      if (response) {
        setFieldMapData(response);

        const parsed = parseFieldMapResponse(response);
        setFieldMappings(parsed.fieldMappings);
        setManufacturerVisibility(parsed.manufacturerVisibility);
        setRepVisibility(parsed.repVisibility);
        setCategories(parsed.categories);
        setFields(parsed.fields);

        // Store original state for change detection
        setOriginalMappings({ ...parsed.fieldMappings });
        setOriginalManufacturerVisibility({ ...parsed.manufacturerVisibility });
        setOriginalRepVisibility({ ...parsed.repVisibility });
      } else {
        // No field map exists yet - initialize empty state
        setFieldMapData(null);
        setFieldMappings({});
        setManufacturerVisibility({});
        setRepVisibility({});
        setCategories([]);
        setFields([]);
        setOriginalMappings({});
        setOriginalManufacturerVisibility({});
        setOriginalRepVisibility({});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load field mapping';
      setError(message);
      console.error('useFieldMap load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mapType, organizationId]);

  // Load on mount if enabled
  useEffect(() => {
    if (loadOnMount) {
      loadFieldMap();
    }
  }, [loadOnMount, loadFieldMap]);

  // Update single field mapping
  const updateFieldMapping = useCallback((standardFieldKey: string, organizationFieldName: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [standardFieldKey]: organizationFieldName,
    }));
  }, []);

  // Update manufacturer visibility
  const updateManufacturerVisibility = useCallback((standardFieldKey: string, visible: boolean) => {
    setManufacturerVisibility(prev => ({
      ...prev,
      [standardFieldKey]: visible,
    }));
  }, []);

  // Update rep visibility
  const updateRepVisibility = useCallback((standardFieldKey: string, visible: boolean) => {
    setRepVisibility(prev => ({
      ...prev,
      [standardFieldKey]: visible,
    }));
  }, []);

  // Check for unsaved changes
  const hasChanges = useCallback(() => {
    // Check field mappings
    const mappingKeys = new Set([...Object.keys(fieldMappings), ...Object.keys(originalMappings)]);
    for (const key of mappingKeys) {
      if (fieldMappings[key] !== originalMappings[key]) return true;
    }

    // Check manufacturer visibility
    const manuKeys = new Set([...Object.keys(manufacturerVisibility), ...Object.keys(originalManufacturerVisibility)]);
    for (const key of manuKeys) {
      if (manufacturerVisibility[key] !== originalManufacturerVisibility[key]) return true;
    }

    // Check rep visibility
    const repKeys = new Set([...Object.keys(repVisibility), ...Object.keys(originalRepVisibility)]);
    for (const key of repKeys) {
      if (repVisibility[key] !== originalRepVisibility[key]) return true;
    }

    return false;
  }, [fieldMappings, originalMappings, manufacturerVisibility, originalManufacturerVisibility, repVisibility, originalRepVisibility]);

  // Save field mappings
  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      // Build the input from current state
      const input = buildFieldMapInput(
        mapType,
        fieldMappings,
        { manufacturer: manufacturerVisibility, rep: repVisibility },
        organizationId
      );

      const response = await saveFieldMap(input);

      // Update state with response
      setFieldMapData(response);

      const parsed = parseFieldMapResponse(response);
      setFieldMappings(parsed.fieldMappings);
      setManufacturerVisibility(parsed.manufacturerVisibility);
      setRepVisibility(parsed.repVisibility);
      setCategories(parsed.categories);
      setFields(parsed.fields);

      // Update original state
      setOriginalMappings({ ...parsed.fieldMappings });
      setOriginalManufacturerVisibility({ ...parsed.manufacturerVisibility });
      setOriginalRepVisibility({ ...parsed.repVisibility });

      toast.success('Field mapping saved successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save field mapping';
      setError(message);
      toast.error(message);
      console.error('useFieldMap save error:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [mapType, fieldMappings, manufacturerVisibility, repVisibility, organizationId]);

  // Reset to original state
  const reset = useCallback(() => {
    setFieldMappings({ ...originalMappings });
    setManufacturerVisibility({ ...originalManufacturerVisibility });
    setRepVisibility({ ...originalRepVisibility });
  }, [originalMappings, originalManufacturerVisibility, originalRepVisibility]);

  return {
    isLoading,
    error,
    isSaving,
    fieldMapData,
    fieldMappings,
    manufacturerVisibility,
    repVisibility,
    categories,
    fields,
    updateFieldMapping,
    updateManufacturerVisibility,
    updateRepVisibility,
    save,
    reload: loadFieldMap,
    hasChanges: hasChanges(),
    reset,
  };
}

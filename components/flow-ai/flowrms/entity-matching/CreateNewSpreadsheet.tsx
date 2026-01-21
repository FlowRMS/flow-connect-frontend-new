'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Checkbox } from '@/components/flow-ai/ui/checkbox';
import { Input } from '@/components/flow-ai/ui/input';
import { Button } from '@/components/flow-ai/ui/button';
import { Badge } from '@/components/flow-ai/ui/badge';
import { Loader2, Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/flow-ai/cn';
import type { PendingEntity, PendingEntityType } from '@/components/flow-ai/types/entity-matching';
import { parseExtractedData } from '@/components/flow-ai/types/entity-matching';
import { UserSearchDropdown, UserResult } from './UserSearchDropdown';
import { EntitySearchDropdown, EntitySearchResult } from '@/components/flow-ai/flowrms/EntitySearchDropdown';

interface SpreadsheetRow {
  entity: PendingEntity;
  name: string;
  insideRepId: string | null;
  insideRepName: string | null;
  outsideRepId: string | null;
  outsideRepName: string | null;
  // For products
  partNumber?: string;
  description?: string;
  factoryId?: string | null;
  factoryName?: string | null;
}

interface CreateNewSpreadsheetProps {
  entities: PendingEntity[];
  entityType: PendingEntityType;
  onToggleSelect: (entityId: string) => void;
  onBulkCreateNew: (createExtraFields: { insideRepId?: string; outsideRepId?: string; factoryId?: string }) => void;
  onCreateSingle: (entityId: string, createExtraFields: { insideRepId?: string; outsideRepId?: string; factoryId?: string }) => void;
  onSearchInsideReps: (query: string) => Promise<UserResult[]>;
  onSearchOutsideReps: (query: string) => Promise<UserResult[]>;
  onSearchFactories?: (query: string, limit?: number) => Promise<EntitySearchResult[]>;
  isLoading?: boolean;
  loadingEntityId?: string | null;
}

// Helper to build full address from extracted data (handles nested address object)
const buildAddress = (data: Record<string, unknown> | null): string | null => {
  if (!data) return null;

  // Check if there's a nested 'address' object with address components
  const addressObj = data.address as Record<string, unknown> | undefined;
  if (addressObj && typeof addressObj === 'object') {
    const parts: string[] = [];

    // Address line 1
    if (typeof addressObj.address_line_one === 'string' && addressObj.address_line_one) {
      parts.push(addressObj.address_line_one);
    }
    // Address line 2
    if (typeof addressObj.address_line_two === 'string' && addressObj.address_line_two) {
      parts.push(addressObj.address_line_two);
    }
    // City, State ZIP
    const cityStateZip: string[] = [];
    if (typeof addressObj.city === 'string' && addressObj.city) {
      cityStateZip.push(addressObj.city);
    }
    if (typeof addressObj.state === 'string' && addressObj.state) {
      cityStateZip.push(addressObj.state);
    }
    if (typeof addressObj.zip_code === 'string' && addressObj.zip_code) {
      cityStateZip.push(addressObj.zip_code);
    }
    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '));
    }

    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  // Check for full_address at top level or in address object
  if (typeof data.full_address === 'string' && data.full_address) return data.full_address;
  if (addressObj && typeof addressObj.full_address === 'string' && addressObj.full_address) {
    return addressObj.full_address;
  }

  // Check for simple string address
  if (typeof data.address === 'string' && data.address) return data.address;

  return null;
};

export function CreateNewSpreadsheet({
  entities,
  entityType,
  onToggleSelect,
  onBulkCreateNew,
  onCreateSingle,
  onSearchInsideReps,
  onSearchOutsideReps,
  onSearchFactories,
  isLoading = false,
  loadingEntityId = null,
}: CreateNewSpreadsheetProps) {
  // State for spreadsheet rows
  const [rows, setRows] = useState<Map<string, SpreadsheetRow>>(new Map());

  // Initialize rows when entities change
  useEffect(() => {
    const newRows = new Map<string, SpreadsheetRow>();
    entities.forEach((entity) => {
      const existing = rows.get(entity.id);
      if (existing) {
        // Keep existing edits
        newRows.set(entity.id, existing);
      } else {
        // Initialize from entity data
        const extractedData = parseExtractedData(entity.extractedData);
        const getNestedValue = (obj: Record<string, unknown> | null, path: string): string => {
          if (!obj) return '';
          const parts = path.split('.');
          let current: unknown = obj;
          for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
              current = (current as Record<string, unknown>)[part];
            } else {
              return '';
            }
          }
          return typeof current === 'string' ? current : '';
        };

        let name = entity.displayName;
        let partNumber = '';
        let description = '';

        if (entityType === 'FACTORIES') {
          name = getNestedValue(extractedData, 'factory.name') || entity.displayName;
        } else if (entityType === 'CUSTOMERS') {
          name = getNestedValue(extractedData, 'sold_to_customer.name') || entity.displayName;
        } else if (entityType === 'PRODUCTS') {
          partNumber = getNestedValue(extractedData, 'factory_part_number') || entity.displayName;
          description = getNestedValue(extractedData, 'description') || '';
          name = partNumber;
        }

        newRows.set(entity.id, {
          entity,
          name,
          insideRepId: null,
          insideRepName: null,
          outsideRepId: null,
          outsideRepName: null,
          partNumber,
          description,
        });
      }
    });
    setRows(newRows);
  }, [entities, entityType]);

  // Get rep requirements based on entity type (includes factory for Products)
  const getRepRequirements = useCallback(() => {
    if (entityType === 'CUSTOMERS' || entityType === 'END_USERS') {
      return { needsOutsideRep: true, needsInsideRep: true, insideRepRequired: false, outsideRepRequired: true, needsFactory: false, factoryRequired: false };
    }
    if (entityType === 'FACTORIES') {
      return { needsOutsideRep: false, needsInsideRep: true, insideRepRequired: false, outsideRepRequired: false, needsFactory: false, factoryRequired: false };
    }
    if (entityType === 'PRODUCTS') {
      return { needsOutsideRep: false, needsInsideRep: false, insideRepRequired: false, outsideRepRequired: false, needsFactory: true, factoryRequired: true };
    }
    // Others: no reps, no factory
    return { needsOutsideRep: false, needsInsideRep: false, insideRepRequired: false, outsideRepRequired: false, needsFactory: false, factoryRequired: false };
  }, [entityType]);

  const repReqs = getRepRequirements();
  const selectedEntities = entities.filter((e) => e.selected);
  const selectedCount = selectedEntities.length;

  // Check if a single row can be created
  const canCreateRow = useCallback((entityId: string) => {
    const row = rows.get(entityId);
    if (!row) return false;

    if (repReqs.outsideRepRequired && !row.outsideRepId) {
      return false;
    }
    if (repReqs.insideRepRequired && !row.insideRepId) {
      return false;
    }
    if (repReqs.factoryRequired && !row.factoryId) {
      return false;
    }
    return true;
  }, [rows, repReqs]);

  // Handle single entity create
  const handleCreateSingle = useCallback((entityId: string) => {
    const row = rows.get(entityId);
    if (!row) return;

    onCreateSingle(entityId, {
      insideRepId: row.insideRepId || undefined,
      outsideRepId: row.outsideRepId || undefined,
      factoryId: row.factoryId || undefined,
    });
  }, [rows, onCreateSingle]);

  // Update a row
  const updateRow = useCallback((entityId: string, updates: Partial<SpreadsheetRow>) => {
    setRows((prev) => {
      const newRows = new Map(prev);
      const existing = newRows.get(entityId);
      if (existing) {
        newRows.set(entityId, { ...existing, ...updates });
      }
      return newRows;
    });
  }, []);

  // Handle bulk create
  const handleBulkCreate = useCallback(() => {
    // Get default rep/factory values from selected rows (use first selected row's values as default)
    let defaultInsideRepId: string | undefined;
    let defaultOutsideRepId: string | undefined;
    let defaultFactoryId: string | undefined;

    for (const entity of selectedEntities) {
      const row = rows.get(entity.id);
      if (row) {
        if (!defaultInsideRepId && row.insideRepId) {
          defaultInsideRepId = row.insideRepId;
        }
        if (!defaultOutsideRepId && row.outsideRepId) {
          defaultOutsideRepId = row.outsideRepId;
        }
        if (!defaultFactoryId && row.factoryId) {
          defaultFactoryId = row.factoryId;
        }
      }
    }

    onBulkCreateNew({
      insideRepId: defaultInsideRepId,
      outsideRepId: defaultOutsideRepId,
      factoryId: defaultFactoryId,
    });
  }, [selectedEntities, rows, onBulkCreateNew]);

  // Check if create is valid (all required reps/factory are set for selected entities)
  const canCreate = useCallback(() => {
    if (selectedCount === 0) return false;

    for (const entity of selectedEntities) {
      const row = rows.get(entity.id);
      if (!row) return false;

      if (repReqs.outsideRepRequired && !row.outsideRepId) {
        return false;
      }
      if (repReqs.insideRepRequired && !row.insideRepId) {
        return false;
      }
      if (repReqs.factoryRequired && !row.factoryId) {
        return false;
      }
    }
    return true;
  }, [selectedCount, selectedEntities, rows, repReqs]);

  // Filter to show only unresolved entities (those that need action)
  const displayEntities = useMemo(() => entities.filter(
    (e) =>
      e.confirmationStatus !== 'CONFIRMED' &&
      e.confirmationStatus !== 'CREATED_NEW' &&
      e.confirmationStatus !== 'REJECTED'
  ), [entities]);

  // Pagination for performance - only render a limited number of items initially
  const ITEMS_PER_PAGE = 50;
  const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

  // Reset display limit when entities change significantly
  useEffect(() => {
    setDisplayLimit(ITEMS_PER_PAGE);
  }, [entityType]);

  // Paginated entities for performance
  const paginatedEntities = useMemo(() => {
    return displayEntities.slice(0, displayLimit);
  }, [displayEntities, displayLimit]);

  const hasMoreEntities = displayEntities.length > displayLimit;
  const remainingCount = displayEntities.length - displayLimit;

  if (displayEntities.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No entities available for creation. All entities have been resolved.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between p-3 bg-primary/5 border rounded-lg">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            {selectedCount} selected
          </Badge>
          {repReqs.outsideRepRequired && (
            <span className="text-xs text-muted-foreground">* Outside Rep required</span>
          )}
          {repReqs.insideRepRequired && (
            <span className="text-xs text-muted-foreground">* Inside Rep required</span>
          )}
          {repReqs.factoryRequired && (
            <span className="text-xs text-muted-foreground">* Factory required</span>
          )}
        </div>
        <Button
          onClick={handleBulkCreate}
          disabled={!canCreate() || isLoading}
          size="sm"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Create Selected ({selectedCount})
        </Button>
      </div>

      {/* Spreadsheet as Cards for better UX with dropdowns */}
      <div className="space-y-3">
        {paginatedEntities.map((entity) => {
          const row = rows.get(entity.id);
          const isLocked =
            entity.confirmationStatus === 'CONFIRMED' ||
            entity.confirmationStatus === 'REJECTED' ||
            entity.confirmationStatus === 'CREATED_NEW';
          const extractedData = parseExtractedData(entity.extractedData);
          const entityAddress = buildAddress(extractedData);

          return (
            <div
              key={entity.id}
              className={cn(
                'border rounded-lg p-4 bg-white transition-all',
                isLocked
                  ? 'opacity-60 cursor-not-allowed bg-slate-50'
                  : `cursor-pointer ${entity.selected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-slate-50 hover:border-slate-300'}`
              )}
              onClick={(e) => {
                if (isLocked) return;
                const target = e.target as HTMLElement;
                if (
                  target.closest('button') ||
                  target.closest('[role="combobox"]') ||
                  target.closest('input') ||
                  target.tagName === 'A'
                ) {
                  return;
                }
                onToggleSelect(entity.id);
              }}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="pt-1">
                  <Checkbox
                    checked={entity.selected}
                    onCheckedChange={() => !isLocked && onToggleSelect(entity.id)}
                    disabled={isLocked}
                  />
                </div>

                {/* Entity Info (Display Name + Address) */}
                <div className="flex-shrink-0 w-[250px] space-y-1">
                  <div className="font-semibold text-sm">{entity.displayName}</div>
                  {entity.sourceLineNumbers && entity.sourceLineNumbers.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Lines: {entity.sourceLineNumbers.length > 5
                        ? `${entity.sourceLineNumbers.slice(0, 5).join(', ')}... (+${entity.sourceLineNumbers.length - 5} more)`
                        : entity.sourceLineNumbers.join(', ')
                      }
                    </div>
                  )}
                  {entityAddress && (
                    <div className="text-xs text-muted-foreground">{entityAddress}</div>
                  )}
                </div>

                {/* Editable Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Name Field */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {entityType === 'PRODUCTS' ? 'Part Number' : 'Name'}
                    </label>
                    <Input
                      value={entityType === 'PRODUCTS' ? row?.partNumber || '' : row?.name || ''}
                      onChange={(e) =>
                        updateRow(entity.id, entityType === 'PRODUCTS' ? { partNumber: e.target.value, name: e.target.value } : { name: e.target.value })
                      }
                      className="h-8 text-xs"
                      disabled={isLocked}
                    />
                  </div>

                  {/* Description (Products only) */}
                  {entityType === 'PRODUCTS' && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Input
                        value={row?.description || ''}
                        onChange={(e) => updateRow(entity.id, { description: e.target.value })}
                        className="h-8 text-xs"
                        disabled={isLocked}
                      />
                    </div>
                  )}

                  {/* Outside Rep */}
                  {repReqs.needsOutsideRep && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Outside Rep{repReqs.outsideRepRequired && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <UserSearchDropdown
                        selectedUserId={row?.outsideRepId || null}
                        selectedUserName={row?.outsideRepName || null}
                        required={repReqs.outsideRepRequired}
                        placeholder="Select..."
                        onSelect={(userId, user) =>
                          updateRow(entity.id, {
                            outsideRepId: userId,
                            outsideRepName: user?.fullName || null,
                          })
                        }
                        onSearch={onSearchOutsideReps}
                        compact
                      />
                    </div>
                  )}

                  {/* Inside Rep */}
                  {repReqs.needsInsideRep && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Inside Rep{repReqs.insideRepRequired && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <UserSearchDropdown
                        selectedUserId={row?.insideRepId || null}
                        selectedUserName={row?.insideRepName || null}
                        required={repReqs.insideRepRequired}
                        placeholder="Select..."
                        onSelect={(userId, user) =>
                          updateRow(entity.id, {
                            insideRepId: userId,
                            insideRepName: user?.fullName || null,
                          })
                        }
                        onSearch={onSearchInsideReps}
                        compact
                      />
                    </div>
                  )}

                  {/* Factory (Products only) */}
                  {repReqs.needsFactory && onSearchFactories && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Factory{repReqs.factoryRequired && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <EntitySearchDropdown
                        selectedId={row?.factoryId || null}
                        selectedName={row?.factoryName || null}
                        required={repReqs.factoryRequired}
                        placeholder="Select..."
                        onSelect={(id, result) =>
                          updateRow(entity.id, {
                            factoryId: id,
                            factoryName: result?.name || null,
                          })
                        }
                        onSearch={onSearchFactories}
                      />
                    </div>
                  )}
                </div>

                {/* Individual Create Button */}
                <div className="flex-shrink-0 flex items-center">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateSingle(entity.id);
                    }}
                    disabled={!canCreateRow(entity.id) || isLoading || loadingEntityId === entity.id || isLocked}
                    size="sm"
                    className="gap-1 whitespace-nowrap"
                  >
                    {loadingEntityId === entity.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load More Button for pagination */}
        {hasMoreEntities && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setDisplayLimit(prev => prev + ITEMS_PER_PAGE)}
              className="gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Load More ({remainingCount} remaining)
            </Button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground">
        Edit the fields above before creating new entities. Select the entities you want to create and click &quot;Create Selected&quot;.
      </p>
    </div>
  );
}










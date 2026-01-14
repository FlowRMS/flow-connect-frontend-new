'use client';

import { useState, useCallback } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/flow-ai/ui/button';
import { UserSearchDropdown, UserResult } from './UserSearchDropdown';
import { EntitySearchDropdown, EntitySearchResult } from '@/components/flow-ai/flowrms/EntitySearchDropdown';
import { CreateExtraFields } from '@/components/flow-ai/hooks/useEntityMatching';

// Rep requirements configuration (includes factory for Products)
export interface RepRequirements {
  needsOutsideRep: boolean;
  needsInsideRep: boolean;
  insideRepRequired: boolean;
  outsideRepRequired: boolean;
  needsFactory?: boolean;
  factoryRequired?: boolean;
}

interface BulkCreateNewPaneProps {
  /** Whether the pane is open */
  isOpen: boolean;
  /** Callback to close the pane */
  onClose: () => void;
  /** Number of selected entities */
  selectedCount: number;
  /** Whether the bulk action is loading */
  isLoading: boolean;
  /** Callback to execute bulk create with the rep selections */
  onConfirm: (createExtraFields?: CreateExtraFields) => void;
  /** Callback to search for inside reps */
  onSearchInsideReps: (query: string) => Promise<UserResult[]>;
  /** Callback to search for outside reps */
  onSearchOutsideReps: (query: string) => Promise<UserResult[]>;
  /** Callback to search for factories (for Products) */
  onSearchFactories?: (query: string, limit?: number) => Promise<EntitySearchResult[]>;
  /** Rep requirements for the current entity type */
  repRequirements?: RepRequirements;
}

export function BulkCreateNewPane({
  isOpen,
  onClose,
  selectedCount,
  isLoading,
  onConfirm,
  onSearchInsideReps,
  onSearchOutsideReps,
  onSearchFactories,
  repRequirements,
}: BulkCreateNewPaneProps) {
  const [insideRepId, setInsideRepId] = useState<string | null>(null);
  const [insideRepName, setInsideRepName] = useState<string | null>(null);
  const [outsideRepId, setOutsideRepId] = useState<string | null>(null);
  const [outsideRepName, setOutsideRepName] = useState<string | null>(null);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [factoryName, setFactoryName] = useState<string | null>(null);

  // Check if any rep selection is needed
  const needsAnyRep = repRequirements?.needsOutsideRep || repRequirements?.needsInsideRep;
  // Check if factory selection is needed (for Products)
  const needsFactory = repRequirements?.needsFactory;

  const handleConfirm = useCallback(() => {
    // If no rep or factory selection is needed, just confirm without extra fields
    if (!needsAnyRep && !needsFactory) {
      onConfirm(undefined);
      return;
    }

    // Validate required fields
    if (repRequirements?.outsideRepRequired && !outsideRepId) return;
    if (repRequirements?.insideRepRequired && !insideRepId) return;
    if (repRequirements?.factoryRequired && !factoryId) return;

    // Build createExtraFields
    const createExtraFields: CreateExtraFields = {};
    if (repRequirements?.needsOutsideRep && outsideRepId) {
      createExtraFields.outsideRepId = outsideRepId;
    }
    if (repRequirements?.needsInsideRep && insideRepId) {
      createExtraFields.insideRepId = insideRepId;
    }
    if (repRequirements?.needsFactory && factoryId) {
      createExtraFields.factoryId = factoryId;
    }

    // Only pass createExtraFields if it has at least one field
    onConfirm(Object.keys(createExtraFields).length > 0 ? createExtraFields : undefined);

    // Reset state after confirm
    setInsideRepId(null);
    setInsideRepName(null);
    setOutsideRepId(null);
    setOutsideRepName(null);
    setFactoryId(null);
    setFactoryName(null);
  }, [outsideRepId, insideRepId, factoryId, onConfirm, needsAnyRep, needsFactory, repRequirements]);

  const handleClose = useCallback(() => {
    // Reset state on close
    setInsideRepId(null);
    setInsideRepName(null);
    setOutsideRepId(null);
    setOutsideRepName(null);
    setFactoryId(null);
    setFactoryName(null);
    onClose();
  }, [onClose]);

  // Check if confirm button should be disabled
  const isConfirmDisabled = (() => {
    if (isLoading) return true;
    if (!repRequirements) return false;
    if (repRequirements.outsideRepRequired && !outsideRepId) return true;
    if (repRequirements.insideRepRequired && !insideRepId) return true;
    if (repRequirements.factoryRequired && !factoryId) return true;
    return false;
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Pane */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Bulk Create New Entities</h3>
            <p className="text-sm text-muted-foreground">
              Creating {selectedCount} new {selectedCount === 1 ? 'entity' : 'entities'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          {needsAnyRep
            ? `Select the representatives that will be assigned to all ${selectedCount} new ${selectedCount === 1 ? 'entity' : 'entities'}.`
            : needsFactory
            ? `Select the factory that will be assigned to all ${selectedCount} new ${selectedCount === 1 ? 'product' : 'products'}.`
            : `Confirm creation of ${selectedCount} new ${selectedCount === 1 ? 'entity' : 'entities'}.`
          }
        </p>

        {/* Rep Selection - Based on entity type requirements */}
        {needsAnyRep && repRequirements && (
          <div className="space-y-4 pt-2">
            {repRequirements.needsOutsideRep && (
              <UserSearchDropdown
                label="Outside Rep"
                selectedUserId={outsideRepId}
                selectedUserName={outsideRepName}
                required={repRequirements.outsideRepRequired}
                placeholder={repRequirements.outsideRepRequired ? "Select outside rep..." : "Select outside rep (optional)..."}
                disabled={isLoading}
                onSelect={(userId, user) => {
                  setOutsideRepId(userId);
                  setOutsideRepName(user?.fullName || null);
                }}
                onSearch={onSearchOutsideReps}
              />
            )}
            {repRequirements.needsInsideRep && (
              <UserSearchDropdown
                label="Inside Rep"
                selectedUserId={insideRepId}
                selectedUserName={insideRepName}
                required={repRequirements.insideRepRequired}
                placeholder={repRequirements.insideRepRequired ? "Select inside rep..." : "Select inside rep (optional)..."}
                disabled={isLoading}
                onSelect={(userId, user) => {
                  setInsideRepId(userId);
                  setInsideRepName(user?.fullName || null);
                }}
                onSearch={onSearchInsideReps}
              />
            )}
          </div>
        )}

        {/* Factory Selection - For Products */}
        {needsFactory && repRequirements && onSearchFactories && (
          <div className="space-y-4 pt-2">
            <EntitySearchDropdown
              label="Factory"
              selectedId={factoryId}
              selectedName={factoryName}
              required={repRequirements.factoryRequired}
              placeholder={repRequirements.factoryRequired ? "Select factory..." : "Select factory (optional)..."}
              disabled={isLoading}
              onSelect={(id, result) => {
                setFactoryId(id);
                setFactoryName(result?.name || null);
              }}
              onSearch={onSearchFactories}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create {selectedCount} {selectedCount === 1 ? 'Entity' : 'Entities'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}










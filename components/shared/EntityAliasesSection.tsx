'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/flow-ai/ui/select';
import {
  useAliasesByEntity,
  useCreateAlias,
  useUpdateAlias,
  useDeleteAlias,
  type AliasEntityType,
  type AliasSubType,
  type Alias,
} from '@/components/hooks/useAliasApi';

// ============================================================================
// Types
// ============================================================================

interface EntityAliasesSectionProps {
  entityId: string;
  entityType: AliasEntityType;
  entityName: string;
  /** Optional sub-types to show (for CUSTOMER: END_USER, SOLD_TO, BILL_TO) */
  subTypes?: AliasSubType[];
  /** Title override for the section */
  title?: string;
  /** Info text to display */
  infoText?: string;
}

interface SubTypeConfig {
  value: AliasSubType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

// ============================================================================
// Constants
// ============================================================================

const SUB_TYPE_CONFIGS: SubTypeConfig[] = [
  {
    value: 'END_USER',
    label: 'End User',
    description: 'Alternative name for end user matching',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  {
    value: 'SOLD_TO',
    label: 'Sold To',
    description: 'Alternative name used for sold-to matching',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
  },
  {
    value: 'BILL_TO',
    label: 'Bill To',
    description: 'Alternative name used for bill-to matching',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
];

// Only CUSTOMER entities use sub-types by default
const DEFAULT_CUSTOMER_SUB_TYPES: AliasSubType[] = ['END_USER', 'SOLD_TO', 'BILL_TO'];

const getSubTypeConfig = (subType: AliasSubType): SubTypeConfig | undefined => {
  return SUB_TYPE_CONFIGS.find((st) => st.value === subType);
};

// ============================================================================
// Components
// ============================================================================

function AliasItem({
  alias,
  entityType,
  onEdit,
  onDelete,
  isDeleting,
  isEditing,
  editValue,
  editSubType,
  onEditValueChange,
  onEditSubTypeChange,
  onSaveEdit,
  onCancelEdit,
  isUpdating,
  showSubType,
  subTypes,
}: {
  alias: Alias;
  entityType: AliasEntityType;
  onEdit: (alias: Alias) => void;
  onDelete: (alias: Alias) => void;
  isDeleting: boolean;
  isEditing: boolean;
  editValue: string;
  editSubType: AliasSubType;
  onEditValueChange: (value: string) => void;
  onEditSubTypeChange: (subType: AliasSubType) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isUpdating: boolean;
  showSubType?: boolean;
  subTypes?: AliasSubType[];
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const subTypeConfig = getSubTypeConfig(alias.subType);
  const showSubTypeSelector = subTypes && subTypes.length > 0;

  if (isEditing) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          {showSubTypeSelector && (
            <Select
              value={editSubType || ''}
              onValueChange={(value) => onEditSubTypeChange(value as AliasSubType)}
            >
              <SelectTrigger className="w-36 h-9 bg-white border-gray-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {subTypes?.map((st) => {
                  const config = getSubTypeConfig(st);
                  return (
                    <SelectItem key={st} value={st || ''}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            st === 'END_USER'
                              ? 'bg-blue-500'
                              : st === 'SOLD_TO'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {config?.label || st}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={onSaveEdit}
              disabled={!editValue.trim() || isUpdating}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
              title="Save changes"
            >
              {isUpdating ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              onClick={onCancelEdit}
              disabled={isUpdating}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {showSubType && subTypeConfig && (
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded ${subTypeConfig.bgColor} ${subTypeConfig.color} whitespace-nowrap`}
          >
            {subTypeConfig.label}
          </span>
        )}
        <span className="text-sm text-gray-900 font-medium truncate">{alias.alias}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-500 hidden sm:inline">
          Added {formatDate(alias.createdAt)}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(alias)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit alias"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(alias)}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Delete alias"
          >
            {isDeleting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAliasForm({
  entityType,
  subTypes,
  onSubmit,
  isSubmitting,
}: {
  entityType: AliasEntityType;
  subTypes?: AliasSubType[];
  onSubmit: (alias: string, subType?: AliasSubType) => void;
  isSubmitting: boolean;
}) {
  const [aliasValue, setAliasValue] = useState('');
  const [selectedSubType, setSelectedSubType] = useState<AliasSubType>(
    subTypes?.[0] || null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aliasValue.trim()) {
      onSubmit(aliasValue.trim(), selectedSubType);
      setAliasValue('');
    }
  };

  const showSubTypeSelector = subTypes && subTypes.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={showSubTypeSelector ? 'flex gap-4' : ''}>
        {showSubTypeSelector && (
          <div className="w-44 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alias Type
            </label>
            <Select
              value={selectedSubType || ''}
              onValueChange={(value) => setSelectedSubType(value as AliasSubType)}
            >
              <SelectTrigger className="w-full h-10 bg-white border-gray-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {subTypes.map((st) => {
                  const config = getSubTypeConfig(st);
                  return (
                    <SelectItem key={st} value={st || ''}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            st === 'END_USER'
                              ? 'bg-blue-500'
                              : st === 'SOLD_TO'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {config?.label || st}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {entityType === 'PRODUCT'
              ? 'Alternative Part Number or Description'
              : entityType === 'CUSTOMER'
              ? 'Alternative Company Name'
              : 'Alternative Manufacturer Name'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aliasValue}
              onChange={(e) => setAliasValue(e.target.value)}
              placeholder={
                entityType === 'PRODUCT'
                  ? 'Enter alternative part number or description'
                  : 'Enter alternative name'
              }
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!aliasValue.trim() || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isSubmitting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              )}
              Add Alias
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function EmptyState({ entityType }: { entityType: AliasEntityType }) {
  const getEmptyStateText = () => {
    switch (entityType) {
      case 'PRODUCT':
        return {
          title: 'No aliases defined yet',
          description: 'Add alternative part numbers or descriptions to help match this product during data imports.',
        };
      case 'CUSTOMER':
        return {
          title: 'No aliases defined yet',
          description: 'Add alternative company names to help match this customer during commission statement processing.',
        };
      case 'FACTORY':
        return {
          title: 'No aliases defined yet',
          description: 'Add alternative manufacturer names to help match this manufacturer during data imports.',
        };
    }
  };

  const text = getEmptyStateText();

  return (
    <div className="text-center py-8">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{text.title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{text.description}</p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EntityAliasesSection({
  entityId,
  entityType,
  entityName,
  subTypes,
  title,
  infoText,
}: EntityAliasesSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSubType, setEditSubType] = useState<AliasSubType>(null);

  // Determine which subTypes to use - only CUSTOMER uses sub-types by default
  // For PRODUCT and FACTORY, subTypes must be explicitly provided to enable them
  const effectiveSubTypes = subTypes || (entityType === 'CUSTOMER' ? DEFAULT_CUSTOMER_SUB_TYPES : undefined);

  // Fetch aliases for the entity
  const { data: aliases = [], isLoading, error } = useAliasesByEntity(
    entityId,
    entityType,
    undefined
  );

  // Mutations
  const createAliasMutation = useCreateAlias();
  const updateAliasMutation = useUpdateAlias();
  const deleteAliasMutation = useDeleteAlias();

  // Handlers
  const handleAddAlias = useCallback(
    async (aliasValue: string, subType?: AliasSubType) => {
      try {
        await createAliasMutation.mutateAsync({
          entityId,
          entityType,
          alias: aliasValue,
          subType,
        });
        toast.success('Alias added successfully');
      } catch (err) {
        toast.error('Failed to add alias');
        console.error('Create alias error:', err);
      }
    },
    [createAliasMutation, entityId, entityType]
  );

  const handleStartEdit = useCallback((alias: Alias) => {
    setEditingId(alias.id);
    setEditValue(alias.alias);
    setEditSubType(alias.subType);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue('');
    setEditSubType(null);
  }, []);

  const handleSaveEdit = useCallback(
    async () => {
      if (!editingId || !editValue.trim()) return;

      const alias = aliases.find((a) => a.id === editingId);
      if (!alias) return;

      try {
        await updateAliasMutation.mutateAsync({
          id: editingId,
          entityId: alias.entityId,
          entityType: alias.entityType,
          alias: editValue.trim(),
          subType: editSubType,
        });
        toast.success('Alias updated successfully');
        handleCancelEdit();
      } catch (err) {
        toast.error('Failed to update alias');
        console.error('Update alias error:', err);
      }
    },
    [editingId, editValue, editSubType, aliases, updateAliasMutation, handleCancelEdit]
  );

  const handleDeleteAlias = useCallback(
    async (alias: Alias) => {
      if (!confirm(`Are you sure you want to delete the alias "${alias.alias}"?`)) {
        return;
      }

      setDeletingId(alias.id);
      try {
        await deleteAliasMutation.mutateAsync({
          id: alias.id,
          entityId: alias.entityId,
          entityType: alias.entityType,
          subType: alias.subType,
        });
        toast.success('Alias deleted');
      } catch (err) {
        toast.error('Failed to delete alias');
        console.error('Delete alias error:', err);
      } finally {
        setDeletingId(null);
      }
    },
    [deleteAliasMutation]
  );

  // Group aliases by subType for all entity types
  const groupedAliases = effectiveSubTypes
    ? effectiveSubTypes.reduce((acc, subType) => {
        acc[subType || 'null'] = aliases.filter((a) => a.subType === subType);
        return acc;
      }, {} as Record<string, Alias[]>)
    : null;

  // Get default info text based on entity type
  const defaultInfoText =
    infoText ||
    (entityType === 'PRODUCT'
      ? 'Aliases help match products when importing data or processing commission statements. Add alternative part numbers or descriptions that should resolve to this product.'
      : entityType === 'CUSTOMER'
      ? 'Aliases help match companies when processing commission statements. Add alternative names that should resolve to this customer based on how they appear in statements.'
      : 'Aliases help match manufacturers when importing data. Add alternative names that should resolve to this manufacturer.');

  const sectionTitle = title || 'Aliases';

  const renderAliasItem = (alias: Alias, showSubTypeInItem: boolean) => (
    <AliasItem
      key={alias.id}
      alias={alias}
      entityType={entityType}
      onEdit={handleStartEdit}
      onDelete={handleDeleteAlias}
      isDeleting={deletingId === alias.id}
      isEditing={editingId === alias.id}
      editValue={editValue}
      editSubType={editSubType}
      onEditValueChange={setEditValue}
      onEditSubTypeChange={setEditSubType}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      isUpdating={updateAliasMutation.isPending}
      showSubType={showSubTypeInItem}
      subTypes={effectiveSubTypes as AliasSubType[]}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          {sectionTitle}
          {aliases.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {aliases.length}
            </span>
          )}
        </h2>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">
                Manage aliases for &quot;{entityName}&quot;
              </p>
              <p className="text-sm text-blue-700">{defaultInfoText}</p>
            </div>
          </div>
        </div>

        {/* Add Alias Form */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Alias</h3>
          <AddAliasForm
            entityType={entityType}
            subTypes={effectiveSubTypes as AliasSubType[]}
            onSubmit={handleAddAlias}
            isSubmitting={createAliasMutation.isPending}
          />
        </div>

        {/* Aliases List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Existing Aliases ({aliases.length})
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Loading aliases...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load aliases</p>
            </div>
          ) : aliases.length === 0 ? (
            <EmptyState entityType={entityType} />
          ) : groupedAliases ? (
            // Grouped view for all entity types
            <div className="space-y-6">
              {effectiveSubTypes?.map((subType) => {
                const subTypeAliases = groupedAliases[subType || 'null'] || [];
                const config = getSubTypeConfig(subType);

                return (
                  <div key={subType || 'null'}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${config?.bgColor || 'bg-gray-100'} ${config?.color || 'text-gray-700'}`}
                      >
                        {config?.label || subType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {config?.description}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {subTypeAliases.length} alias{subTypeAliases.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                    {subTypeAliases.length > 0 ? (
                      <div className="space-y-2">
                        {subTypeAliases.map((alias) => renderAliasItem(alias, false))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        No {config?.label.toLowerCase()} aliases yet
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Simple list (for PRODUCT and FACTORY without sub-types)
            <div className="space-y-2">
              {aliases.map((alias) => renderAliasItem(alias, false))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EntityAliasesSection;

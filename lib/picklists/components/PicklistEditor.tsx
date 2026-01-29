'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { usePicklist } from '../usePicklist';
import { PicklistKey, PicklistColor } from '../enums';
import { ColorPicker } from './ColorPicker';
import type { PicklistItem } from '../types';

interface PicklistEditorProps {
  picklistKey: PicklistKey;
  onHasChangesChange?: (hasChanges: boolean) => void;
  onSaveReady?: (saveFn: () => Promise<boolean>) => void;
}

interface SortableItemProps {
  item: PicklistItem;
  allowColors: boolean;
  allowDisable: boolean;
  onLabelChange: (key: string, label: string) => void;
  onColorChange: (key: string, color: PicklistColor) => void;
  onToggleEnabled: (key: string) => void;
  onDelete: (key: string) => void;
}

function SortableItem({
  item,
  allowColors,
  allowDisable,
  onLabelChange,
  onColorChange,
  onToggleEnabled,
  onDelete,
}: SortableItemProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [localLabel, setLocalLabel] = useState(item.label);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const handleLabelSave = () => {
    if (localLabel.trim() && localLabel !== item.label) {
      onLabelChange(item.key, localLabel.trim());
    }
    setIsEditingLabel(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${!item.enabled ? 'opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-[var(--muted)] p-1 rounded"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="5" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="19" r="1" fill="currentColor" />
          <circle cx="15" cy="5" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="19" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* Color Indicator / Picker */}
      {allowColors && (
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-6 h-6 rounded-full border-2 border-[var(--border)] hover:border-[var(--primary)] transition-colors"
            style={{ backgroundColor: item.color || '#6B7280' }}
          />
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-50 p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg min-w-[220px]">
              <ColorPicker
                value={item.color}
                onChange={(color) => {
                  onColorChange(item.key, color);
                  setShowColorPicker(false);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Label */}
      <div className="flex-1">
        {isEditingLabel ? (
          <input
            type="text"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSave();
              if (e.key === 'Escape') {
                setLocalLabel(item.label);
                setIsEditingLabel(false);
              }
            }}
            autoFocus
            className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        ) : (
          <button
            onClick={() => setIsEditingLabel(true)}
            className="text-sm text-left hover:text-[var(--primary)] transition-colors"
          >
            {item.label}
          </button>
        )}
      </div>

      {/* Default Badge */}
      {item.isDefault && (
        <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded">
          Default
        </span>
      )}

      {/* Enable/Disable Toggle */}
      {allowDisable && (
        <button
          onClick={() => onToggleEnabled(item.key)}
          className={`p-1 rounded transition-colors ${
            item.enabled
              ? 'text-emerald-600 hover:bg-emerald-50'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={item.enabled ? 'Disable' : 'Enable'}
        >
          {item.enabled ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </button>
      )}

      {/* Delete Button (only for custom items) */}
      {!item.isDefault && (
        <button
          onClick={() => onDelete(item.key)}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function PicklistEditor({ picklistKey, onHasChangesChange, onSaveReady }: PicklistEditorProps) {
  const { items, definition, isLoading, saveItems } = usePicklist(picklistKey);
  const [localItems, setLocalItems] = useState<PicklistItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const localItemsRef = useRef<PicklistItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Keep ref in sync with state for the save function
  useEffect(() => {
    localItemsRef.current = localItems;
  }, [localItems]);

  useEffect(() => {
    setLocalItems(items);
    setHasChanges(false);
  }, [items]);

  // Notify parent when hasChanges changes
  useEffect(() => {
    onHasChangesChange?.(hasChanges);
  }, [hasChanges, onHasChangesChange]);

  // Save function - uses ref to always have current items
  const save = useCallback(async (): Promise<boolean> => {
    const success = await saveItems(localItemsRef.current);
    if (success) {
      setHasChanges(false);
    }
    return success;
  }, [saveItems]);

  // Provide save function to parent
  useEffect(() => {
    onSaveReady?.(save);
  }, [save, onSaveReady]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !definition.allowReorder) return;

    const oldIndex = localItems.findIndex((item) => item.key === active.id);
    const newIndex = localItems.findIndex((item) => item.key === over.id);

    const reordered = arrayMove(localItems, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    setLocalItems(reordered);
    setHasChanges(true);
  };

  const handleLabelChange = (key: string, label: string) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, label } : item))
    );
    setHasChanges(true);
  };

  const handleColorChange = (key: string, color: PicklistColor) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, color } : item))
    );
    setHasChanges(true);
  };

  const handleToggleEnabled = (key: string) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item))
    );
    setHasChanges(true);
  };

  const handleDelete = (key: string) => {
    setLocalItems((prev) => prev.filter((item) => item.key !== key));
    setHasChanges(true);
  };

  const handleAddItem = () => {
    const trimmed = newItemLabel.trim();
    if (!trimmed) {
      setError('Label cannot be empty');
      return;
    }

    const newKey = trimmed.toUpperCase().replace(/\s+/g, '_');
    if (localItems.some((item) => item.key === newKey)) {
      setError('This value already exists');
      return;
    }

    const newItem: PicklistItem = {
      key: newKey,
      label: trimmed,
      sortOrder: localItems.length,
      enabled: true,
      isDefault: false,
      color: definition.allowColors ? PicklistColor.GRAY : undefined,
    };

    setLocalItems((prev) => [...prev, newItem]);
    setNewItemLabel('');
    setError(null);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-[var(--foreground)]">{definition.title}</h3>
        <p className="text-sm text-[var(--muted-foreground)]">{definition.description}</p>
        {hasChanges && (
          <p className="text-xs text-amber-600 mt-1">You have unsaved changes</p>
        )}
      </div>

      {/* Help Text */}
      {definition.helpText && (
        <p className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] p-2 rounded">
          {definition.helpText}
        </p>
      )}

      {/* Items List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map((i) => i.key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {localItems.map((item) => (
              <SortableItem
                key={item.key}
                item={item}
                allowColors={definition.allowColors}
                allowDisable={definition.allowDisable}
                onLabelChange={handleLabelChange}
                onColorChange={handleColorChange}
                onToggleEnabled={handleToggleEnabled}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add New Item */}
      {definition.allowCustomValues && (
        <div className="pt-2 border-t border-[var(--border)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemLabel}
              onChange={(e) => {
                setNewItemLabel(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddItem();
              }}
              placeholder="Add new value..."
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              onClick={handleAddItem}
              className="px-4 py-2 text-sm font-medium bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}

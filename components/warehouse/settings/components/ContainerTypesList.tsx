'use client';

import React, { useState } from 'react';
import type { ContainerType } from '../types';

interface ContainerTypesListProps {
  containers: ContainerType[];
  editingContainerId: string | null;
  draggedContainerId: string | null;
  hasChanges?: boolean;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<ContainerType>) => void;
  onDelete: (id: string) => void;
  onSave?: () => Promise<void>;
  onStartEdit: (id: string | null) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
}

export default function ContainerTypesList({
  containers,
  editingContainerId,
  draggedContainerId,
  hasChanges = false,
  onAdd,
  onUpdate,
  onDelete,
  onSave,
  onStartEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
}: ContainerTypesListProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Failed to save containers:', error);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Container Types</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Configure the container types available for packing. Drag rows to reorder how they appear in dropdowns.
            </p>
          </div>
        </div>
      </div>

      {/* Container List */}
      <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--muted)]/30 border-b border-[var(--border)] text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          <div className="col-span-1"></div>
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Dimensions (in)</div>
          <div className="col-span-2">Weight (lbs)</div>
          <div className="col-span-1"></div>
        </div>

        {/* Container Rows */}
        <div className="divide-y divide-[var(--border)]">
          {containers.map((container, index) => {
            const isEditing = editingContainerId === container.id;

            return (
              <div
                key={container.id}
                draggable={!isEditing}
                onDragStart={() => {
                  if (!isEditing) onDragStart(container.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  onDragOver(container.id);
                }}
                onDragEnd={onDragEnd}
                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-colors ${
                  draggedContainerId === container.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 opacity-50'
                    : 'hover:bg-[var(--muted)]/50'
                } ${!isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {/* Drag Handle */}
                <div className="col-span-1 flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] w-4">{index + 1}</span>
                  <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Name */}
                <div className="col-span-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={container.name}
                      onChange={(e) => onUpdate(container.id, { name: e.target.value })}
                      onBlur={() => onStartEdit(null)}
                      autoFocus
                      className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <button
                      onClick={() => onStartEdit(container.id)}
                      className="text-sm text-[var(--foreground)] hover:text-blue-600 dark:hover:text-blue-400 text-left"
                    >
                      {container.name}
                    </button>
                  )}
                </div>

                {/* Dimensions */}
                <div className="col-span-4 grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={container.length}
                    onChange={(e) => onUpdate(container.id, { length: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="L"
                  />
                  <input
                    type="number"
                    value={container.width}
                    onChange={(e) => onUpdate(container.id, { width: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="W"
                  />
                  <input
                    type="number"
                    value={container.height}
                    onChange={(e) => onUpdate(container.id, { height: parseFloat(e.target.value) || 0 })}
                    className="px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="H"
                  />
                </div>

                {/* Weight */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={container.weight}
                    onChange={(e) => onUpdate(container.id, { weight: parseFloat(e.target.value) || 0 })}
                    step="0.1"
                    className="w-full px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Delete Button */}
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => onDelete(container.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Add and Save buttons */}
        <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-between">
          <button
            onClick={onAdd}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Container Type
          </button>

          {onSave && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                hasChanges && !isSaving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

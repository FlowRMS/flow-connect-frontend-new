"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { GripVertical, RefreshCw, Save, Check } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  ColumnConfig,
  ColumnWithId,
  PinSide,
} from "@/lib/analytics/hooks/useColumnConfig";

interface ColumnConfigPopoverProps {
  columns: ColumnWithId[];
  config: ColumnConfig;
  setOrder: (ids: string[]) => void;
  toggleHidden: (id: string, hidden?: boolean) => void;
  setPin: (id: string, side: PinSide) => void;
  resetToBase: () => void;
  saveNow: () => void;
  reloadFromStorage: () => void;
  className?: string;
  triggerLabel?: string;
}

const toText = (v: unknown): string =>
  v == null ? "" : typeof v === "string" ? v : String(v);

function validateMappings(
  columns: ColumnWithId[],
  configOrder: unknown[],
  popoverRoot: HTMLElement | null
) {
  const ids = columns.map(c => String(c.id));
  const idSet = new Set<string>();
  const dups: string[] = [];
  ids.forEach(id => { if (idSet.has(id)) dups.push(id); else idSet.add(id); });

  const orderIds = configOrder.map(String);
  const missingInColumns = orderIds.filter(id => !idSet.has(id));

  // pointer-events check up the tree
  let el: HTMLElement | null = popoverRoot;
  let blockingAncestor = false;
  while (el && el.parentElement) {
    const pe = getComputedStyle(el).pointerEvents;
    if (pe === "none") { blockingAncestor = true; break; }
    el = el.parentElement;
  }

  const summary = `[ColumnConfig] columns=${ids.length}, order=${orderIds.length}, duplicates=${dups.length}, missingInColumns=${JSON.stringify(missingInColumns)}, blockingPointerEventsAncestor=${blockingAncestor}`;
  if (dups.length || missingInColumns.length || blockingAncestor) {
    console.warn(summary);
  } else {
    console.log(summary);
  }
}
export function ColumnConfigPopover({
  columns,
  config,
  setOrder,
  toggleHidden,
  setPin,
  resetToBase,
  saveNow,
  reloadFromStorage,
  className,
  triggerLabel = "Columns",
}: ColumnConfigPopoverProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const columnsById = useMemo(() => {
    const map = new Map<string, ColumnWithId>();
    columns.forEach((col) => map.set(col.id, col));
    return map;
  }, [columns]);

  // Only show columns that still exist, in the order defined by config.order
  const orderedColumns = useMemo(() => {
    return config.order
      .map((id) => columnsById.get(id))
      .filter((col): col is ColumnWithId => Boolean(col));
  }, [columnsById, config.order]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // Validation on popover open
  useEffect(() => {
    if (open) {
      validateMappings(orderedColumns, config.order, containerRef.current);
    }
  }, [open, orderedColumns, config.order]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const ids = orderedColumns.map(c => String(c.id));
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex >= 0 && newIndex >= 0) {
        setOrder(arrayMove(ids, oldIndex, newIndex));
      }
    },
    [orderedColumns, setOrder]
  );

  const handleSaveConfig = useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UX
      saveNow();
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setOpen(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  }, [saveNow]);

  return (
    <div className={`relative ${className || ""}`} ref={containerRef}>
      <button
        type="button"
        className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <GripVertical size={16} />
        {triggerLabel}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[28rem] rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700">Column Settings</h4>
            <p className="text-xs text-gray-500">
              Drag and drop rows to reorder columns, then Save to store your layout.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={orderedColumns.every(col => !config.hidden[col.id])}
                  onChange={(event) => {
                    const shouldShow = event.target.checked;
                    orderedColumns.forEach(col => {
                      toggleHidden(col.id, !shouldShow);
                    });
                  }}
                />
                {orderedColumns.every(col => !config.hidden[col.id]) ? 'Uncheck All' : 'Check All'}
              </label>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedColumns.map((c) => String(c.id))}
              strategy={verticalListSortingStrategy}
            >
              <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {orderedColumns.map((col) => {
                  const idStr = String(col.id);
                  return (
                    <SortableRow
                      key={idStr}
                      col={col}
                      isHidden={config.hidden[idStr] === true}
                      pinSide={config.pin[idStr] ?? null}
                      toggleHidden={toggleHidden}
                      setPin={setPin}
                    />
                  );
                })}

                {/* drop area at end */}
                <li className="h-2" aria-hidden />
              </ul>
            </SortableContext>
          </DndContext>

          <div className="px-4 py-3 border-t border-gray-100 flex justify-between gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              onClick={() => {
                resetToBase();
              }}
            >
              <RefreshCw size={16} />
              Reset to Base
            </button>
            <div className="flex gap-2">
              {/* <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                onClick={() => {
                  reloadFromStorage();
                }}
              >
                Load Saved
              </button> */}
              {/* <button
                type="button"
                className={`inline-flex items-center gap-2 text-sm font-medium ${
                  saveSuccess 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-blue-600 hover:text-blue-700'
                } ${isSaving ? 'opacity-75' : ''}`}
                onClick={handleSaveConfig}
                disabled={isSaving}
              >
                {saveSuccess ? (
                  <Check size={16} />
                ) : (
                  <Save size={16} className={isSaving ? 'animate-spin' : ''} />
                )}
                {saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Config'}
              </button> */}
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableRow({
  col,
  isHidden,
  pinSide,
  toggleHidden,
  setPin,
}: {
  col: ColumnWithId;
  isHidden: boolean;
  pinSide: PinSide | null;
  toggleHidden: (id: string, hidden?: boolean) => void;
  setPin: (id: string, side: PinSide) => void;
}) {
  const idStr = String(col.id);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: idStr });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    userSelect: "none",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 bg-white transition-all touch-none ${
        isDragging ? "scale-95" : "hover:bg-gray-50"
      }`}
      {...attributes}
      {...listeners}
      onMouseDownCapture={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.closest("button")) e.stopPropagation();
      }}
      onPointerDownCapture={(e) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "SELECT" || t.closest("button")) e.stopPropagation();
      }}
    >
      {/* Drag handle */}
      <span
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        aria-label="Drag handle"
      >
        <GripVertical size={16} />
      </span>

      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium text-gray-700 truncate ${
            isHidden ? "line-through text-gray-400" : ""
          }`}
          title={toText(col.name ?? col.prop ?? col.id)}
        >
          {toText(col.name)}
        </div>

        <div className="text-xs text-gray-400">
          {toText(col.prop ?? col.id)}
        </div>
      </div>

      {/* Important: prevent inputs from stealing the drag gesture */}
      <label
        className="flex items-center gap-1 text-xs text-gray-600"
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          checked={!isHidden}
          onChange={(event) => toggleHidden(idStr, !event.target.checked)}
        />
        Visible
      </label>

      <select
        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700"
        value={pinSide ?? ""}
        onChange={(event) => {
          const value = event.target.value as PinSide | "";
          setPin(idStr, value === "" ? null : value);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <option value="">No pin</option>
        <option value="left">Pin left</option>
        <option value="right">Pin right</option>
      </select>
    </li>
  );
}


"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useMemo } from "react";
import { useItemsStore } from "./useItems";

type Col = { name: string; prop: string; size?: number; columnType?: string; autoSize?: boolean; pin?: 'colPinStart' | 'colPinEnd'; options?: string[] };

type Props = {
  gridRef: React.MutableRefObject<any | null>;
  onOps: (ops: any[]) => void;
  columns: Col[];
  setColumns: (cols: Col[]) => void;
  selection: { top: number; left: number; bottom: number; right: number } | null;
};

export default function GridToolbar({ gridRef, onOps, columns, setColumns, selection }: Props) {
  const filter = useItemsStore(s => s.filterText);
  const setFilter = useItemsStore(s => s.setFilter);
  const undo = useItemsStore(s => s.undo);
  const redo = useItemsStore(s => s.redo);

  const focusedColIndex = useMemo(() => selection ? selection.left : -1, [selection]);

  const freezeLeft = useCallback(() => {
    if (focusedColIndex < 0) return;
  const next = columns.map((c, i) => i === focusedColIndex ? { ...c, pin: c.pin === 'colPinStart' ? undefined : 'colPinStart' } : c) as Col[];
  setColumns(next);
  }, [columns, focusedColIndex, setColumns]);

  const freezeRight = useCallback(() => {
    if (focusedColIndex < 0) return;
  const next = columns.map((c, i) => i === focusedColIndex ? { ...c, pin: c.pin === 'colPinEnd' ? undefined : 'colPinEnd' } : c) as Col[];
  setColumns(next);
  }, [columns, focusedColIndex, setColumns]);

  const autosizeAll = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    // trigger internal autosize by reassigning columns
    el.columns = [...columns];
  }, [gridRef, columns]);

  const fillDown = useCallback(() => {
    const sel = selection;
    if (!sel || sel.left !== sel.right || sel.top === sel.bottom) return;
    const col = columns[sel.left]?.prop;
    if (!col) return;
    const topValue = useItemsStore.getState().rows[sel.top]?.[col];
    onOps([{ type: 'grid_filldown', target: { col, fromRow: sel.top, toRow: sel.bottom }, value: topValue }]);
  }, [selection, columns, onOps]);

  return (
    <div className="flex items-center gap-2 py-2">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter..."
        className="border px-2 py-1 rounded"
      />
      <button className="border px-2 py-1 rounded" onClick={freezeLeft} disabled={focusedColIndex < 0}>Freeze Left</button>
      <button className="border px-2 py-1 rounded" onClick={freezeRight} disabled={focusedColIndex < 0}>Freeze Right</button>
      <button className="border px-2 py-1 rounded" onClick={autosizeAll}>Autosize All</button>
      <button className="border px-2 py-1 rounded" onClick={() => undo()}>Undo</button>
      <button className="border px-2 py-1 rounded" onClick={() => redo()}>Redo</button>
      <button className="border px-2 py-1 rounded" onClick={fillDown} disabled={!selection || selection.left !== selection.right || selection.top === selection.bottom}>Fill Down</button>
    </div>
  );
}







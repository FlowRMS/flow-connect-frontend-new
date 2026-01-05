"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

export type GridSelection = { top: number; left: number; bottom: number; right: number } | null;

export type GridOp =
  | { type: "grid_edit"; target: { row: number; col: string }; value: any }
  | { type: "grid_paste_matrix"; target: { row: number; col: string }; matrix: any[][]; cols?: string[] }
  | { type: "grid_delete_rows"; predicate: (row: any, idx: number) => boolean }
  | { type: "grid_add_rows"; rows: any[] }
  | { type: "grid_reorder_rows"; order: number[] }
  | { type: "grid_filldown"; target: { col: string; fromRow: number; toRow: number }; value: any };

type StoreState = {
  rows: any[];
  history: any[][];
  future: any[][];
  sortState: any | null;
  filterText: string;
  selection: GridSelection;
  applyOps: (ops: GridOp[]) => void;
  undo: () => void;
  redo: () => void;
  setFilter: (text: string) => void;
  setSelection: (sel: GridSelection) => void;
  setSortState: (s: any | null) => void;
  setRows: (rows: any[]) => void;
};

export const useItemsStore = create<StoreState>((set, get) => ({
  rows: [],
  history: [],
  future: [],
  sortState: null,
  filterText: "",
  selection: null,

  setRows: (rows) => set({ rows }),

  setFilter: (text) => set({ filterText: text }),
  setSelection: (selection) => set({ selection }),
  setSortState: (sortState) => set({ sortState }),

  applyOps: (ops) => {
    const prevRows = get().rows;
    let rows = [...prevRows.map(r => ({ ...r }))];

    for (const op of ops) {
      switch (op.type) {
        case "grid_edit": {
          const { row, col } = op.target;
          if (!rows[row]) rows[row] = {};
          rows[row] = { ...rows[row], [col]: op.value };
          break;
        }
        case "grid_paste_matrix": {
          const startRow = op.target.row;
          const colKey = op.target.col;
          const keys = op.cols && op.cols.length ? op.cols : [colKey];
          for (let r = 0; r < op.matrix.length; r++) {
            const destRow = startRow + r;
            if (!rows[destRow]) rows[destRow] = {};
            const rowCopy = { ...rows[destRow] };
            for (let c = 0; c < op.matrix[r].length; c++) {
              const key = keys[c] ?? colKey;
              rowCopy[key] = op.matrix[r][c];
            }
            rows[destRow] = rowCopy;
          }
          break;
        }
        case "grid_delete_rows": {
          rows = rows.filter((row, idx) => !op.predicate(row, idx));
          break;
        }
        case "grid_add_rows": {
          rows = [...rows, ...op.rows];
          break;
        }
        case "grid_reorder_rows": {
          const next: any[] = [];
          op.order.forEach((oldIdx, newIdx) => {
            next[newIdx] = rows[oldIdx];
          });
          rows = next.filter(Boolean);
          break;
        }
        case "grid_filldown": {
          const { col, fromRow, toRow } = op.target;
          for (let r = fromRow + 1; r <= toRow; r++) {
            if (!rows[r]) rows[r] = {};
            rows[r] = { ...rows[r], [col]: op.value };
          }
          break;
        }
      }
    }

    set((s) => ({ rows, history: [...s.history, prevRows], future: [] }));
  },

  undo: () => set((s) => {
    if (s.history.length === 0) return s;
    const prev = s.history[s.history.length - 1];
    const history = s.history.slice(0, -1);
    const future = [s.rows, ...s.future];
    return { rows: prev, history, future } as Partial<StoreState> as StoreState;
  }),

  redo: () => set((s) => {
    if (s.future.length === 0) return s;
    const next = s.future[0];
    const future = s.future.slice(1);
    const history = [...s.history, s.rows];
    return { rows: next, history, future } as Partial<StoreState> as StoreState;
  }),
}));




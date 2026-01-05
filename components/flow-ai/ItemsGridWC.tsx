"use client";

import React, { useMemo, useCallback } from "react";
import { DataGrid, type SelectionData, type DataGridContextMenuConfig } from "./DataGrid";
import { useItemsStore, type GridOp } from "./useItems";

type Col = { 
  name: string; 
  prop: string; 
  size?: number; 
  columnType?: string; 
  autoSize?: boolean; 
  pin?: 'colPinStart' | 'colPinEnd'; 
  options?: string[]; 
  sortable?: boolean; 
  filter?: boolean; 
};

type Props = {
  columns: Col[];
  rows?: Record<string, unknown>[];
  height?: number | string;
  style?: React.CSSProperties;
  onCellClick?: (rowData: Record<string, unknown>, columnProp: string, columnName: string) => void;
  onSelectionChange?: (selection: SelectionData) => void;
  onOps?: (ops: GridOp[]) => void;
  gridRef?: React.MutableRefObject<unknown | null>;
  readonly?: boolean;
  contextMenuConfig?: DataGridContextMenuConfig;
  selectionOrigin?: string;
};

export default function ItemsGridWC({ 
  columns, 
  rows, 
  height = 420, 
  style: externalStyle, 
  onCellClick,
  onSelectionChange,
  onOps,
  gridRef,
  readonly = false,
  contextMenuConfig,
  selectionOrigin,
}: Props) {
  const filterText = useItemsStore(s => s.filterText);
  const storeRows = useItemsStore(s => s.rows);
  const data = rows ?? storeRows;

  React.useEffect(() => {
    if (onOps) {
      onOps([]);
    }
  }, [onOps]);

  React.useEffect(() => {
    if (gridRef) {
      gridRef.current = { columns, rows: data };
    }
  }, [gridRef, columns, data]);

  // Transform data for filtering
  const visibleRows = useMemo(() => {
    const t = (filterText ?? "").trim().toLowerCase();
    const filtered = !t ? data : data.filter((row) => {
      return columns.some((c) => {
        const v = row[c.prop];
        return typeof v === 'string' && v.toLowerCase().includes(t);
      });
    });
    // Format numeric columns for display
    return filtered.map((r) => {
      const out: Record<string, unknown> = { ...r };
      for (const c of columns) {
        if (c.columnType === 'numeric' && typeof out[c.prop] === 'number') {
          out[c.prop] = (out[c.prop] as number).toFixed(2);
        }
      }
      return out;
    });
  }, [data, columns, filterText]);

  // Transform columns for DataGrid
  const gridColumns = useMemo(() => {
    return columns.map(col => ({
      key: col.prop,
      name: col.name,
      type: col.columnType === 'numeric' ? 'number' as const : 'text' as const,
      sortable: col.sortable !== false,
      filterable: col.filter !== false,
      width: col.size,
    }));
  }, [columns]);

  // Handle selection changes from DataGrid
  const handleSelectionChange = useCallback((selection: SelectionData) => {
    // Enhance selection data with columns information for proper reference column detection
    const enhancedSelection: SelectionData = {
      ...selection,
      data: {
        ...selection.data,
        // Add the original columns array to help prompt generation use the correct first column
        _columns: columns.map(col => ({ key: col.prop, name: col.name })),
        origin: selectionOrigin ?? selection.data.origin,
      }
    };
    
    // Call the parent's selection change handler if provided
    if (!readonly) {
      onSelectionChange?.(enhancedSelection);
    }

    // For backward compatibility with single cell clicks - ONLY call onCellClick 
    // if there's no onSelectionChange handler (to avoid double-triggering)
    if (!readonly && selection.type === 'cell' && onCellClick && !onSelectionChange && 
        selection.data.rowData && selection.data.columnKey && selection.data.columnName) {
      onCellClick(selection.data.rowData, selection.data.columnKey, selection.data.columnName);
    }
  }, [onCellClick, onSelectionChange, readonly, columns, selectionOrigin]);

  return (
    <div style={externalStyle}>
      <DataGrid
        columns={gridColumns}
        data={visibleRows}
        onSelectionChange={handleSelectionChange}
        height={height}
        enableRowSelection={!readonly}
        enableColumnSelection={!readonly}
        enableCellSelection={!readonly}
        className="border-primary/20"
        contextMenuConfig={contextMenuConfig}
      />
    </div>
  );
}







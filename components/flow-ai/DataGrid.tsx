"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/flow-ai/ui/input";
import { Button } from "@/components/flow-ai/ui/button";
import { cn } from "@/lib/flow-ai/cn";
import { useContextMenu, createEditAction, createDeleteAction, createDescribeAction, createUnmapAction } from "@/components/flow-ai/ui/context-menu";

// Helper function to format cell values, including nested objects
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // Handle nested objects (like factory, end_user, etc.)
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    
    // Try to extract a meaningful display value
    // Priority: name > address_line_one > first non-null value
    if (obj.name) {
      return String(obj.name);
    }
    
    if (obj.address && typeof obj.address === 'object') {
      const addr = obj.address as Record<string, unknown>;
      if (addr.address_line_one) {
        return String(addr.address_line_one);
      }
    }
    
    // Find first non-null, non-object value
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== null && val !== undefined && typeof val !== 'object') {
        return String(val);
      }
    }
    
    // If all else fails, show a structured representation
    return JSON.stringify(value, null, 0).slice(0, 100);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  
  return String(value);
}

export type SelectionType = 'cell' | 'row' | 'column' | 'range';
export type ActionType = 'edit' | 'delete' | 'describe' | 'unmap';

export interface SelectionData {
  type: SelectionType;
  action: ActionType;
  data: {
    // For cell selection
    rowIndex?: number;
    columnKey?: string;
    columnName?: string;
    value?: unknown;
    rowData?: Record<string, unknown>;
    
    // For multi-selection
    rows?: Array<{
      index: number;
      data: Record<string, unknown>;
    }>;
    columns?: Array<{
      key: string;
      name: string;
    }>;
    cells?: Array<{
      rowIndex: number;
      columnKey: string;
      columnName: string;
      value: unknown;
      rowData: Record<string, unknown>;
    }>;
    // Indicates the selection represents all rows in the current dataset/view
    allSelected?: boolean;
    
    // Column order information (for PDF line items to use first column as reference)
    _columns?: Array<{
      key: string;
      name: string;
    }>;
    origin?: string;
  };
}

export interface DataGridContextMenuConfig {
  cell?: ActionType[];
  row?: ActionType[];
  column?: ActionType[];
}

const DEFAULT_CONTEXT_MENU_CONFIG: Required<DataGridContextMenuConfig> = {
  cell: ['edit', 'delete'],
  row: ['edit', 'delete'],
  column: ['edit', 'delete'],
};

interface DataGridColumn {
  key: string;
  name: string;
  type?: 'text' | 'number';
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
}

interface DataGridProps {
  columns: DataGridColumn[];
  data: Record<string, unknown>[];
  onSelectionChange?: (selection: SelectionData) => void;
  height?: number | string;
  className?: string;
  enableRowSelection?: boolean;
  enableColumnSelection?: boolean;
  enableCellSelection?: boolean;
  contextMenuConfig?: DataGridContextMenuConfig;
}

export function DataGrid({
  columns,
  data,
  onSelectionChange,
  height = 400,
  className,
  enableRowSelection = true,
  enableColumnSelection = true,
  enableCellSelection = true,
  contextMenuConfig,
}: DataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const { showContextMenu } = useContextMenu();
  const resolvedContextMenu = useMemo(() => ({
    cell: contextMenuConfig?.cell ?? DEFAULT_CONTEXT_MENU_CONFIG.cell,
    row: contextMenuConfig?.row ?? DEFAULT_CONTEXT_MENU_CONFIG.row,
    column: contextMenuConfig?.column ?? DEFAULT_CONTEXT_MENU_CONFIG.column,
  }), [contextMenuConfig]);

  const buildContextMenuActions = useCallback((actionTypes: ActionType[], baseSelection: SelectionData) => {
    return actionTypes.map((actionType) => {
      const selectionForAction: SelectionData = { ...baseSelection, action: actionType };
      switch (actionType) {
        case 'describe':
          return createDescribeAction(() => onSelectionChange?.(selectionForAction));
        case 'edit':
          return createEditAction(() => onSelectionChange?.(selectionForAction));
        case 'unmap':
          return createUnmapAction(() => onSelectionChange?.(selectionForAction));
        case 'delete':
          return createDeleteAction(() => onSelectionChange?.(selectionForAction));
        default:
          return createEditAction(() => onSelectionChange?.(selectionForAction));
      }
    });
  }, [onSelectionChange]);

  // Handle cell clicks - show context menu instead of direct action
  const handleCellClick = useCallback((
    event: React.MouseEvent,
    rowIndex: number,
    columnKey: string,
    columnName: string,
    value: unknown,
    rowData: Record<string, unknown>
  ) => {
    if (!enableCellSelection) return;

    event.preventDefault();
    event.stopPropagation();

    // Clear other selections
    setSelectedColumn(null);
    setSelectedRows(new Set());
    setRowSelection({});

    const baseSelection: SelectionData = {
      type: 'cell',
      action: 'edit',
      data: {
        rowIndex,
        columnKey,
        columnName,
        value,
        rowData,
      },
    };

    const actions = buildContextMenuActions(resolvedContextMenu.cell, baseSelection);
    if (actions.length === 0) {
      return;
    }

    showContextMenu(event.clientX, event.clientY, actions);
  }, [enableCellSelection, showContextMenu, buildContextMenuActions, resolvedContextMenu.cell]);

  // Handle column header clicks for full column selection
  const handleColumnSelect = useCallback((
    event: React.MouseEvent,
    columnKey: string, 
    columnName: string
  ) => {
    if (!enableColumnSelection) return;

    event.preventDefault();
    event.stopPropagation();

    // Clear other selections
    setSelectedRows(new Set());
    setRowSelection({});
    
    // Toggle column selection
    const newSelectedColumn = selectedColumn === columnKey ? null : columnKey;
    setSelectedColumn(newSelectedColumn);

    if (newSelectedColumn) {
      const columnCells = data.map((row, index) => ({
        rowIndex: index,
        columnKey,
        columnName,
        value: row[columnKey],
        rowData: row,
      }));

      const baseSelection: SelectionData = {
        type: 'column',
        action: 'edit',
        data: {
          columns: [{ key: columnKey, name: columnName }],
          cells: columnCells,
        },
      };

      const actions = buildContextMenuActions(resolvedContextMenu.column, baseSelection);
      if (actions.length === 0) {
        return;
      }

      showContextMenu(event.clientX, event.clientY, actions);
    }
  }, [enableColumnSelection, selectedColumn, data, showContextMenu, buildContextMenuActions, resolvedContextMenu.column]);

  // Handle row number clicks for full row selection
  const handleRowSelect = useCallback((
    event: React.MouseEvent,
    rowIndex: number
  ) => {
    if (!enableRowSelection) return;

    event.preventDefault();
    event.stopPropagation();

    // Clear other selections
    setSelectedColumn(null);
    setRowSelection({});

    // Toggle row selection
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowIndex)) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
    setSelectedRows(newSelectedRows);

    if (newSelectedRows.size > 0) {
      const rowsSelection = Array.from(newSelectedRows).map((index) => ({
        index,
        data: data[index] || {},
      }));

      const baseSelection: SelectionData = {
        type: 'row',
        action: 'edit',
        data: {
          rows: rowsSelection,
        },
      };

      const actions = buildContextMenuActions(resolvedContextMenu.row, baseSelection);
      if (actions.length === 0) {
        return;
      }

      showContextMenu(event.clientX, event.clientY, actions);
    }
  }, [enableRowSelection, selectedRows, data, showContextMenu, buildContextMenuActions, resolvedContextMenu.row]);

  // Create table columns
  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const cols: ColumnDef<Record<string, unknown>>[] = [];

    // Add row number column for row selection
    if (enableRowSelection) {
      cols.push({
        id: "rowSelect",
        header: () => (
          <div
            className="px-2 py-2 text-center font-bold text-xs text-primary bg-primary/5 border border-primary/20 rounded cursor-pointer select-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Toggle select all / clear selection
              const allSelected = selectedRows.size === data.length;
              const newSelected = new Set<number>();
              if (!allSelected) {
                for (let i = 0; i < data.length; i++) newSelected.add(i);
              }
              setSelectedRows(newSelected);

              // If we have a new selection, show context menu for bulk actions
              if (newSelected.size > 0) {
                const rowsSelection = Array.from(newSelected).map(index => ({ index, data: data[index] || {} }));
                const baseSelection: SelectionData = {
                  type: 'row',
                  action: 'edit',
                  data: {
                    rows: rowsSelection,
                    allSelected: newSelected.size === data.length,
                  },
                };
                const actions = buildContextMenuActions(resolvedContextMenu.row, baseSelection);
                if (actions.length === 0) {
                  return;
                }

                // Show context menu at center of header (fallback)
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                showContextMenu(rect.left + rect.width / 2, rect.top + rect.height / 2, actions);
              }
            }}
          >
            ROW
          </div>
        ),
        cell: ({ row }) => {
          const isSelected = selectedRows.has(row.index);
          return (
            <div 
              className={cn(
                "px-2 py-2 text-center cursor-pointer transition-all duration-200 text-xs font-bold",
                "border border-input rounded hover:border-primary hover:bg-primary/10",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                  : "bg-background text-foreground hover:text-primary"
              )}
              onClick={(e) => handleRowSelect(e, row.index)}
              title={isSelected ? "Row selected - click to deselect" : "Click to select entire row"}
            >
              {row.index + 1}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 50,
      });
    }

    // Add data columns
    columns.forEach((col) => {
      cols.push({
        accessorKey: col.key,
        header: ({ column }) => {
          const canSort = col.sortable !== false;
          const canFilter = col.filterable !== false;
          const isSelected = selectedColumn === col.key;
          
          return (
            <div className={cn(
              "px-3 py-2 space-y-2 min-h-[80px]",
              isSelected && "bg-primary/5 border border-primary/20 rounded-sm"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    onClick={() => canSort && column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start w-full"
                    disabled={!canSort}
                  >
                    <span className="truncate">{col.name}</span>
                    {canSort && (
                      <div className="ml-1 flex-shrink-0">
                        {column.getIsSorted() === "desc" ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : column.getIsSorted() === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </Button>
                </div>
                {enableColumnSelection && (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 px-3 text-xs font-bold transition-all duration-200 flex-shrink-0",
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-sm border-primary" 
                        : "bg-background text-foreground border-input hover:bg-primary/10 hover:text-primary hover:border-primary"
                    )}
                    onClick={(e) => handleColumnSelect(e, col.key, col.name)}
                    title={isSelected ? "Column selected - click to deselect" : "Click to select entire column"}
                  >
                    SELECT
                  </Button>
                )}
              </div>
              {canFilter && (
                <div className="relative">
                  <Input
                    placeholder="Filter..."
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) => column.setFilterValue(event.target.value)}
                    className="h-7 text-xs"
                  />
                  {String(column.getFilterValue() ?? '') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-0 h-7 w-7 p-0"
                      onClick={() => column.setFilterValue("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        },
        cell: ({ row, getValue }) => {
          const value = getValue();
          const isColumnSelected = selectedColumn === col.key;
          const isRowSelected = selectedRows.has(row.index);
          
          return (
            <div
              className={cn(
                "px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50",
                "border-r border-muted last:border-r-0 select-text",
                isColumnSelected && "bg-primary/5",
                isRowSelected && "bg-primary/5"
              )}
              onClick={(e) => {
                if (enableCellSelection) {
                  handleCellClick(e, row.index, col.key, col.name, value, row.original);
                }
              }}
            >
              <div className="truncate font-mono text-sm">
                {col.type === 'number' && typeof value === 'number' 
                  ? value.toFixed(2) 
                  : formatCellValue(value)}
              </div>
            </div>
          );
        },
        size: col.width || 120,
        minSize: 80,
        maxSize: 400,
      });
    });

    return cols;
  }, [
    columns,
    enableRowSelection,
    enableCellSelection,
    enableColumnSelection,
    handleCellClick,
    handleRowSelect,
    handleColumnSelect,
    selectedColumn,
    selectedRows,
    data,
    showContextMenu,
    buildContextMenuActions,
    resolvedContextMenu.row,
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background shadow-sm", className)} style={{ height: containerHeight }}>
      <div className="overflow-auto h-full w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
          <thead className="sticky top-0 bg-muted/80 border-b z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left border-r border-border last:border-r-0 bg-muted/80 font-semibold"
                    style={{ width: header.getSize(), minWidth: '120px' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-background">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border hover:bg-muted/30 transition-colors",
                    row.getIsSelected() && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border-r border-border last:border-r-0 align-top min-h-[36px]"
                      style={{ width: cell.column.getSize(), minWidth: '120px' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (enableRowSelection ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}








"use client";

import React, { useMemo, memo, useCallback, useState, useRef } from "react";
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
  type ColumnSizingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/flow-ai/ui/input";
import { Button } from "@/components/flow-ai/ui/button";
import { cn } from "@/lib/flow-ai/cn";
import { useContextMenu, createEditAction, createDeleteAction } from "@/components/flow-ai/ui/context-menu";
import type { SelectionData, SelectionType, ActionType } from "./DataGrid";

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
  filterable?: boolean;
};

type CsvRow = Record<string, unknown> & {
  _changeType?: 'edited' | 'deleted' | 'added' | 'unchanged';
  _changedFields?: string[];
  _rowHash?: string;
};

type Props = {
  columns: Col[];
  rows: CsvRow[];
  onSelectionChange?: (selection: SelectionData) => void;
  height?: number | string;
  style?: React.CSSProperties;
  showChangeIndicators?: boolean;
  enableInteractions?: boolean;
  showRowNumbers?: boolean;
};

// Row height constant for virtual scrolling
const ROW_HEIGHT = 45; // Match original table row height
const HEADER_HEIGHT = 120; // Increased for better column name visibility
const OVERSCAN = 5; // Number of rows to render outside viewport
const DEFAULT_COLUMN_WIDTH = 200; // Increased default column width
const MIN_COLUMN_WIDTH = 150; // Increased minimum column width

// Memoize individual row component
const TableRow = memo(({ 
  row, 
  originalRow,
  visibleCells,
  showChangeIndicators,
  enableInteractions,
  showRowNumbers,
  selectedRows,
  selectedColumn,
  handleRowSelect,
  handleCellClick,
  columns,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
  originalRow: CsvRow;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visibleCells: any[];
  showChangeIndicators: boolean;
  enableInteractions: boolean;
  showRowNumbers: boolean;
  selectedRows: Set<number>;
  selectedColumn: string | null;
  handleRowSelect: (e: React.MouseEvent, index: number) => void;
  handleCellClick: (e: React.MouseEvent, rowIndex: number, columnKey: string, columnName: string, value: unknown, rowData: Record<string, unknown>) => void;
  columns: Col[];
}) => {
  const isDeleted = showChangeIndicators && originalRow?._changeType === 'deleted';
  const isRowAdded = showChangeIndicators && originalRow?._changeType === 'added';
  const isEdited = showChangeIndicators && originalRow?._changeType === 'edited';
  
  return (
    <tr
      className={cn(
        "border-b border-border hover:bg-muted/30 transition-colors h-11", // Fixed height
        row.getIsSelected() && "bg-primary/5 hover:bg-primary/10",
        isDeleted && "bg-red-50/70 hover:bg-red-100/70",
        isRowAdded && "bg-green-50/70 hover:bg-green-100/70",
        isEdited && "bg-yellow-50/30 hover:bg-yellow-100/30"
      )}
      style={{ height: ROW_HEIGHT }} // Explicit height
    >
      {visibleCells.map((cell: { id: string; column: { getSize: () => number; id: string; columnDef: { header?: unknown; id?: string } }; getValue: () => unknown }, cellIndex: number) => {
        if (showRowNumbers && cellIndex === 0) {
          // Row number cell
          const isSelected = selectedRows.has(row.index);
          return (
            <td
              key={cell.id}
              className="border-r border-border last:border-r-0 p-0 h-11"
              style={{ width: 60, minWidth: 60, height: ROW_HEIGHT }}
            >
              <div 
                className={cn(
                  "px-2 py-1 text-center text-xs font-bold h-full flex flex-col justify-center",
                  "border border-input rounded m-1",
                  enableInteractions && "cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/10",
                  enableInteractions && isSelected 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-background text-foreground hover:text-primary",
                  !enableInteractions && "bg-muted/50 text-muted-foreground",
                  isDeleted && "bg-red-100 border-red-300 text-red-800",
                  isRowAdded && "bg-green-100 border-green-300 text-green-800",
                  isEdited && "bg-yellow-50 border-yellow-300 text-yellow-900"
                )}
                onClick={enableInteractions ? (e) => handleRowSelect(e, row.index) : undefined}
              >
                <span>{row.index + 1}</span>
                {isDeleted && <span className="text-[8px]">DEL</span>}
                {isRowAdded && <span className="text-[8px]">NEW</span>}
                {isEdited && <span className="text-[8px]">MOD</span>}
              </div>
            </td>
          );
        }
        
        // Data cell
        const column = cell.column;
        const columnId = column.id;
        const value = cell.getValue();
        // Extract the actual column prop from the column definition
        // The column ID format is "col-{index}-{prop}" so we extract the prop part
        const columnKey = columnId.startsWith('col-') 
          ? columnId.split('-').slice(2).join('-') // Handle prop names with dashes
          : columnId;
        const isColumnSelected = selectedColumn === columnKey;
        const isRowSelected = selectedRows.has(row.index);
        const isCellEdited = showChangeIndicators && originalRow?._changeType === 'edited' && originalRow?._changedFields?.includes(columnKey);
        
        // Check if this is a newly added column
        const isColumnAdded = showChangeIndicators && 
          Array.isArray(originalRow?._addedColumns) && 
          (originalRow._addedColumns as string[]).includes(columnKey);
        
        // Cell should only be green if the row is added AND the column is not a newly added column
        const isCellAdded = isRowAdded && !isColumnAdded;
        
        return (
          <td
            key={cell.id}
            className="border-r border-border last:border-r-0 p-0 h-11"
            style={{ width: column.getSize(), minWidth: '120px', height: ROW_HEIGHT }}
          >
            <div
              className={cn(
                "px-3 py-2 transition-colors h-full flex items-center", // Use flexbox for vertical centering
                enableInteractions && "cursor-pointer hover:bg-muted/50",
                isColumnSelected && "bg-primary/5",
                isRowSelected && "bg-primary/5",
                isCellEdited && "bg-yellow-100 border-l-4 border-l-yellow-500",
                isDeleted && "bg-red-100/80 text-red-700 line-through decoration-2",
                isCellAdded && "bg-green-100/80 text-green-800 font-medium"
              )}
              onClick={enableInteractions ? (e) => {
                // Get the actual raw value from the original row data, not the processed cell value
                const actualValue = row.original[columnKey];
                // Get the column name from the original columns array instead of the processed header
                const originalColumn = columns.find(col => col.prop === columnKey);
                const actualColumnName = originalColumn?.name || columnKey;
                handleCellClick(e, row.index, columnKey, actualColumnName, actualValue, row.original);
              } : undefined}
            >
              <div className="truncate font-mono text-sm relative w-full">
                {column.columnDef.id === 'numeric' && typeof value === 'number' 
                  ? value.toFixed(2) 
                  : String(value ?? '')}
                {isCellEdited && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    ✓
                  </span>
                )}
              </div>
            </div>
          </td>
        );
      })}
    </tr>
  );
});
TableRow.displayName = 'TableRow';

// Memoize the component to prevent unnecessary re-renders with large datasets
function CsvGridWCComponent({ 
  columns, 
  rows,
  onSelectionChange,
  height = 420, 
  style: externalStyle,
  showChangeIndicators = false,
  enableInteractions = true,
  showRowNumbers = true
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const { showContextMenu } = useContextMenu();
  
  // Virtual scrolling state
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Performance optimization: detect large datasets
  const isLargeDataset = rows.length > 200;

  // Transform data for display - memoized for performance
  const transformedRows = useMemo(() => {
    // Only transform if needed, avoid unnecessary object spreading for large datasets
    const needsTransform = columns.some(col => col.columnType === 'numeric');
    
    if (!needsTransform) {
      return rows; // Return as-is if no transformation needed
    }
    
    return rows.map((row) => {
      const out: Record<string, unknown> = { ...row };
      
      // Format numeric columns for display
      for (const col of columns) {
        if (col.columnType === 'numeric' && typeof out[col.prop] === 'number') {
          out[col.prop] = (out[col.prop] as number).toFixed(2);
        }
      }
      
      return out;
    });
  }, [rows, columns]);

  // Handle cell clicks - show context menu - optimized with useCallback
  const handleCellClick = useCallback((
    event: React.MouseEvent,
    rowIndex: number,
    columnKey: string,
    columnName: string,
    value: unknown,
    rowData: Record<string, unknown>
  ) => {
    if (!enableInteractions) return;

    event.preventDefault();
    event.stopPropagation();

    // Clear other selections
    setSelectedColumn(null);
    setSelectedRows(new Set());
    setRowSelection({});

    const actions = [
      createEditAction(() => {
        // Extract all row data for intelligent primary key detection
        const allRowsData = rows.map(row => row as Record<string, unknown>);
        
        const selectionData: SelectionData = {
          type: 'cell' as SelectionType,
          action: 'edit' as ActionType,
          data: {
            rowIndex,
            columnKey,
            columnName,
            value,
            rowData,
            // Include all rows for intelligent primary key detection
            rows: allRowsData.map((data, index) => ({ index, data })),
          },
        };
        onSelectionChange?.(selectionData);
      }),
      createDeleteAction(() => {
        // Extract all row data for intelligent primary key detection
        const allRowsData = rows.map(row => row as Record<string, unknown>);
        
        const selectionData: SelectionData = {
          type: 'cell' as SelectionType,
          action: 'delete' as ActionType,
          data: {
            rowIndex,
            columnKey,
            columnName,
            value,
            rowData,
            // Include all rows for intelligent primary key detection
            rows: allRowsData.map((data, index) => ({ index, data })),
          },
        };
        onSelectionChange?.(selectionData);
      })
    ];

    showContextMenu(event.clientX, event.clientY, actions);
  }, [enableInteractions, rows, onSelectionChange, showContextMenu]);

  // Handle column header clicks for full column selection - optimized with useCallback
  const handleColumnSelect = useCallback((
    event: React.MouseEvent,
    columnKey: string, 
    columnName: string
  ) => {
    if (!enableInteractions) return;

    event.preventDefault();
    event.stopPropagation();

    // Clear other selections
    setSelectedRows(new Set());
    setRowSelection({});
    
    // Toggle column selection
    const newSelectedColumn = selectedColumn === columnKey ? null : columnKey;
    setSelectedColumn(newSelectedColumn);

    if (newSelectedColumn) {
      const actions = [
        createEditAction(() => {
          const selectionData: SelectionData = {
            type: 'column' as SelectionType,
            action: 'edit' as ActionType,
            data: {
              columns: [{ key: columnKey, name: columnName }],
              cells: transformedRows.map((row: CsvRow, index: number) => ({
                rowIndex: index,
                columnKey,
                columnName,
                value: row[columnKey],
                rowData: row,
              })),
            },
          };
          onSelectionChange?.(selectionData);
        }),
        createDeleteAction(() => {
          const selectionData: SelectionData = {
            type: 'column' as SelectionType,
            action: 'delete' as ActionType,
            data: {
              columns: [{ key: columnKey, name: columnName }],
              cells: transformedRows.map((row: CsvRow, index: number) => ({
                rowIndex: index,
                columnKey,
                columnName,
                value: row[columnKey],
                rowData: row,
              })),
            },
          };
          onSelectionChange?.(selectionData);
        })
      ];

      showContextMenu(event.clientX, event.clientY, actions);
    }
  }, [enableInteractions, selectedColumn, transformedRows, onSelectionChange, showContextMenu]);

  // Handle row number clicks for full row selection - optimized with useCallback
  const handleRowSelect = useCallback((
    event: React.MouseEvent,
    rowIndex: number
  ) => {
    if (!enableInteractions) return;

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
      const actions = [
        createEditAction(() => {
          const selectionData: SelectionData = {
            type: 'row' as SelectionType,
            action: 'edit' as ActionType,
            data: {
              rows: Array.from(newSelectedRows).map(index => ({
                index,
                data: transformedRows[index] || {},
              })),
            },
          };
          onSelectionChange?.(selectionData);
        }),
        createDeleteAction(() => {
          const selectionData: SelectionData = {
            type: 'row' as SelectionType,
            action: 'delete' as ActionType,
            data: {
              rows: Array.from(newSelectedRows).map(index => ({
                index,
                data: transformedRows[index] || {},
              })),
            },
          };
          onSelectionChange?.(selectionData);
        })
      ];

      showContextMenu(event.clientX, event.clientY, actions);
    }
  }, [enableInteractions, selectedRows, transformedRows, onSelectionChange, showContextMenu]);

  // Create table columns
  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const cols: ColumnDef<Record<string, unknown>>[] = [];

    // Add row number column conditionally
    if (showRowNumbers) {
      cols.push({
        id: "rowSelect",
        header: () => (
          <div
            className="px-2 py-2 text-center font-bold text-xs text-primary bg-primary/5 border border-primary/20 rounded cursor-pointer select-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Toggle select all / clear selection for transformed rows
              const allSelected = selectedRows.size === transformedRows.length;
              const newSelected = new Set<number>();
              if (!allSelected) {
                for (let i = 0; i < transformedRows.length; i++) newSelected.add(i);
              }
              setSelectedRows(newSelected);

              if (newSelected.size > 0) {
                const actions = [
                  createEditAction(() => {
                    const selectionData: SelectionData = {
                      type: 'row' as SelectionType,
                      action: 'edit' as ActionType,
                      data: {
                        rows: Array.from(newSelected).map(index => ({ index, data: transformedRows[index] || {} })),
                        allSelected: newSelected.size === transformedRows.length,
                      },
                    };
                    onSelectionChange?.(selectionData);
                  }),
                  createDeleteAction(() => {
                    const selectionData: SelectionData = {
                      type: 'row' as SelectionType,
                      action: 'delete' as ActionType,
                      data: {
                        rows: Array.from(newSelected).map(index => ({ index, data: transformedRows[index] || {} })),
                        allSelected: newSelected.size === transformedRows.length,
                      },
                    };
                    onSelectionChange?.(selectionData);
                  })
                ];

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
          const originalRow = rows[row.index];
          const isDeleted = showChangeIndicators && originalRow?._changeType === 'deleted';
          const isAdded = showChangeIndicators && originalRow?._changeType === 'added';
          const isEdited = showChangeIndicators && originalRow?._changeType === 'edited';
          
          return (
            <div 
              className={cn(
                "px-2 py-2 text-center text-xs font-bold",
                "border border-input rounded",
                enableInteractions && "cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/10",
                enableInteractions && isSelected 
                  ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                  : "bg-background text-foreground hover:text-primary",
                !enableInteractions && "bg-muted/50 text-muted-foreground",
                isDeleted && "bg-red-100 border-red-300 text-red-800",
                isAdded && "bg-green-100 border-green-300 text-green-800",
                isEdited && "bg-yellow-50 border-yellow-300 text-yellow-900"
              )}
              onClick={enableInteractions ? (e) => handleRowSelect(e, row.index) : undefined}
              title={
                !enableInteractions ? "Row number" :
                isDeleted ? "Row will be deleted" :
                isAdded ? "Row was added" :
                isEdited ? "Row has edited fields" :
                isSelected ? "Row selected - click to deselect" : "Click to select entire row"
              }
            >
              {row.index + 1}
              {isDeleted && <span className="block text-[10px] mt-0.5">DEL</span>}
              {isAdded && <span className="block text-[10px] mt-0.5">NEW</span>}
              {isEdited && <span className="block text-[10px] mt-0.5">MOD</span>}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 60,
      });
    }

    // Add data columns
    columns.forEach((col, colIndex) => {
      cols.push({
        id: `col-${colIndex}-${col.prop}`, // Unique ID combining index and prop name
        accessorKey: col.prop,
        header: ({ column }) => {
          const canSort = col.sortable !== false;
          const canFilter = col.filterable !== false;
          const isSelected = selectedColumn === col.prop;
          
          // Check if this column is a newly added column (check first row for _addedColumns metadata)
          const firstRow = rows[0];
          const isNewColumn = showChangeIndicators && 
            Array.isArray(firstRow?._addedColumns) && 
            (firstRow._addedColumns as string[]).includes(col.prop);
          
          return (
            <div className={cn(
              "px-3 py-2 space-y-2 min-h-[100px]",
              isSelected && "bg-primary/5 border border-primary/20 rounded-sm",
              isNewColumn && "bg-green-100 border-2 border-green-400"
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    onClick={() => canSort && column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start w-full whitespace-normal break-words"
                    disabled={!canSort}
                    title={col.name}
                  >
                    <span className="text-sm leading-tight max-w-full block">{col.name}</span>
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
                  {isNewColumn && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-600 text-white">
                        ADD
                      </span>
                    </div>
                  )}
                </div>
                {enableInteractions && (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs font-bold transition-all duration-200 flex-shrink-0 whitespace-nowrap",
                      isSelected 
                        ? "bg-primary text-primary-foreground shadow-sm border-primary" 
                        : "bg-background text-foreground border-input hover:bg-primary/10 hover:text-primary hover:border-primary"
                    )}
                    onClick={(e) => handleColumnSelect(e, col.prop, col.name)}
                    title={isSelected ? "Column selected - click to deselect" : "Click to select entire column"}
                  >
                    SELECT
                  </Button>
                )}
              </div>
              {canFilter && (
                <div className="relative">
                  <Input
                    placeholder={isLargeDataset ? "Filter (type to search)..." : "Filter..."}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) => {
                      // For large datasets, we could add debouncing here if needed
                      column.setFilterValue(event.target.value);
                    }}
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
          const isColumnSelected = selectedColumn === col.prop;
          const isRowSelected = selectedRows.has(row.index);
          const originalRow = rows[row.index];
          const isEdited = showChangeIndicators && originalRow?._changeType === 'edited' && originalRow?._changedFields?.includes(col.prop);
          const isDeleted = showChangeIndicators && originalRow?._changeType === 'deleted';
          
          // Only mark cell as added if the ROW is added, not if just the COLUMN is added
          // This ensures that cells in new columns don't get green background unless the entire row is new
          const isRowAdded = showChangeIndicators && originalRow?._changeType === 'added';
          const isColumnAdded = showChangeIndicators && 
            Array.isArray(originalRow?._addedColumns) && 
            (originalRow._addedColumns as string[]).includes(col.prop);
          
          // Cell should only be green if the row is added, NOT if only the column is added
          const isCellAdded = isRowAdded && !isColumnAdded;
          
          return (
            <div
              className={cn(
                "px-3 py-2 transition-colors border-r border-muted last:border-r-0 select-text overflow-hidden",
                enableInteractions && "cursor-pointer hover:bg-muted/50",
                isColumnSelected && "bg-primary/5",
                isRowSelected && "bg-primary/5",
                isEdited && "bg-yellow-100 border-l-4 border-l-yellow-500",
                isDeleted && "bg-red-100/80 text-red-700 line-through decoration-2",
                isCellAdded && "bg-green-100/80 text-green-800 font-medium"
              )}
              onClick={enableInteractions ? (e) => {
                handleCellClick(e, row.index, col.prop, col.name, value, row.original);
              } : undefined}
              title={
                !enableInteractions ? String(value ?? '') :
                isEdited ? `This field was edited from original: ${String(value ?? '')}` :
                isDeleted ? `This row will be deleted: ${String(value ?? '')}` :
                isCellAdded ? `This row was added: ${String(value ?? '')}` :
                isColumnAdded && !isRowAdded ? `This column was added: ${String(value ?? '')}` :
                `Click to edit this cell: ${String(value ?? '')}`
              }
            >
              <div className="font-mono text-sm relative whitespace-nowrap overflow-x-auto scrollbar-thin">
                {col.columnType === 'number' && typeof value === 'number' 
                  ? value.toFixed(2) 
                  : String(value ?? '')}
                {isEdited && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    ✓
                  </span>
                )}
              </div>
            </div>
          );
        },
        size: col.size || DEFAULT_COLUMN_WIDTH,
        minSize: MIN_COLUMN_WIDTH,
        maxSize: 600,
      });
    });

    return cols;
  }, [columns, selectedColumn, selectedRows, rows, showChangeIndicators, enableInteractions, showRowNumbers, handleCellClick, handleRowSelect, handleColumnSelect, transformedRows, onSelectionChange, showContextMenu, isLargeDataset]);

  const table = useReactTable({
    data: transformedRows,
    columns: tableColumns,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnSizing,
    },
  });

  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  // Calculate virtual scrolling range
  const tableRows = table.getRowModel().rows;
  const totalRows = tableRows.length;
  
  // For large datasets, use virtual scrolling
  const { visibleRange, paddingTop } = useMemo(() => {
    if (!isLargeDataset || totalRows === 0) {
      return {
        visibleRange: { start: 0, end: totalRows },
        paddingTop: 0,
      };
    }

    const containerHeightPx = typeof height === 'number' ? height : 420;
    const visibleRowCount = Math.ceil((containerHeightPx - HEADER_HEIGHT) / ROW_HEIGHT);
    
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(totalRows, startIndex + visibleRowCount + OVERSCAN * 2);
    
    return {
      visibleRange: { start: startIndex, end: endIndex },
      paddingTop: startIndex * ROW_HEIGHT,
    };
  }, [isLargeDataset, totalRows, scrollTop, height]);

  // Handle scroll for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isLargeDataset) {
      setScrollTop(e.currentTarget.scrollTop);
    }
  }, [isLargeDataset]);

  // Get visible rows for rendering
  const visibleRows = useMemo(() => {
    if (!isLargeDataset) {
      return tableRows;
    }
    return tableRows.slice(visibleRange.start, visibleRange.end);
  }, [isLargeDataset, tableRows, visibleRange]);

  return (
    <div style={externalStyle}>
      <div className={cn("border rounded-lg overflow-hidden bg-background shadow-sm")} style={{ height: containerHeight }}>
        <div 
          ref={scrollContainerRef}
          className="overflow-auto h-full w-full scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          onScroll={handleScroll}
        >
          <table className="w-full border-collapse" style={{ width: table.getTotalSize(), minWidth: '1200px' }}>
            <thead className="sticky top-0 bg-muted/80 border-b z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left border-r border-border last:border-r-0 bg-muted/80 font-semibold relative"
                      style={{ width: header.getSize(), minWidth: MIN_COLUMN_WIDTH }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {/* Resize handle */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none",
                          "hover:bg-primary/50 active:bg-primary",
                          header.column.getIsResizing() && "bg-primary"
                        )}
                        style={{
                          transform: header.column.getIsResizing()
                            ? `translateX(${table.getState().columnSizingInfo.deltaOffset}px)`
                            : '',
                        }}
                      />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-background">
              {isLargeDataset && paddingTop > 0 && (
                <tr style={{ height: paddingTop }}>
                  <td colSpan={columns.length + (showRowNumbers ? 1 : 0)} style={{ padding: 0, border: 'none' }} />
                </tr>
              )}
              {visibleRows.length ? (
                visibleRows.map((row) => {
                  const originalRow = rows[row.index];
                  // Use flow_index as unique key if available, otherwise fallback to row index
                  const uniqueKey = originalRow?.flow_index !== undefined 
                    ? `row-${originalRow.flow_index}-${row.index}` 
                    : `row-${row.index}`;
                  return (
                    <TableRow
                      key={uniqueKey}
                      row={row}
                      originalRow={originalRow}
                      visibleCells={row.getVisibleCells()}
                      showChangeIndicators={showChangeIndicators}
                      enableInteractions={enableInteractions}
                      showRowNumbers={showRowNumbers}
                      selectedRows={selectedRows}
                      selectedColumn={selectedColumn}
                      handleRowSelect={handleRowSelect}
                      handleCellClick={handleCellClick}
                      columns={columns}
                    />
                  );
                })
              ) : (
                <tr style={{ height: ROW_HEIGHT }}>
                  <td colSpan={columns.length + (showRowNumbers ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Export memoized version for better performance with large datasets
const CsvGridWC = memo(CsvGridWCComponent);
export default CsvGridWC;








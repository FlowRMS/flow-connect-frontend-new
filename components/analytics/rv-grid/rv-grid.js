"use client";

import { RevoGrid } from "@revolist/react-datagrid";
import { ColumnMovePlugin } from "@revolist/revogrid";
import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useMemo,
} from "react";
import DataGridSkeleton, { DataGridSkeletonPresets } from "./DataGridSkeleton";
import "./styles.css";

const DataGrid = forwardRef(function DataGrid(
  {
    columns,
    data = [],
    loading = false,
    emptyMessage = "No data available",
    loadingMessage = "Loading data...",
    height = 500,
    theme = "material",
    enableRange = true,
    enableExporting = true,
    enableGrouping = true,
    enableFiltering = false,
    _enableEditing = false,
    rowClass = "grid-row",
    onRowClick,
    onCellClick,
    onCellEdit,
    onHeaderClick,
    onExport,
    additionalProps = {},
    groupBy = [],
    // const [loadingMessage, setLoadingMessage] = useState("");
    searchable = true,
    searchPlaceholder = "Search...",
    searchColumns,
    skeletonRows = 8,
    skeletonPreset = null,
    skeletonProps = {},
    title = "",
    enableResize = true,
    canMoveColumns = false,
    onColumnsReordered,
  },
  ref
) {
  void _enableEditing;
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(data);
  const searchCols = useMemo(() => {
    if (searchColumns && Array.isArray(searchColumns)) return searchColumns;
    return columns.map((c) => c.prop);
  }, [searchColumns, columns]);

  const gridColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      sortable: false,
    }));
  }, [columns]);

  useEffect(() => {
    if (!searchable || !search) {
      setFiltered(data);
      return;
    }
    const lower = search.toLowerCase();
    setFiltered(
      data.filter((row) =>
        searchCols.some((col) => {
          const val = row[col];
          return val && String(val).toLowerCase().includes(lower);
        })
      )
    );
  }, [search, data, searchCols, searchable]);
  const gridRef = useRef(null);
  const { plugins: externalPlugins, ...restAdditionalProps } =
    additionalProps ?? {};

  const mergedPlugins = useMemo(() => {
    const normalizedExternal = Array.isArray(externalPlugins)
      ? externalPlugins.filter(Boolean)
      : [];

    if (!canMoveColumns) {
      return normalizedExternal;
    }

    return normalizedExternal.some(
      (plugin) => plugin === ColumnMovePlugin
    )
      ? normalizedExternal
      : [...normalizedExternal, ColumnMovePlugin];
  }, [externalPlugins, canMoveColumns]);

  useImperativeHandle(ref, () => ({
    doExport: async (options = {}) => {
      const gridEl = gridRef.current;
      if (!gridEl) return false;
      // Wait for plugins to be ready
      const plugins = await gridEl.getPlugins?.();
      if (plugins) {
        for (const p of plugins) {
          if (typeof p.exportFile === "function") {
            p.exportFile({ filename: options.filename || "export.csv" });
            return true;
          }
        }
      }
      return false;
    },
    // Methods for configuration management
    getColumns: () => {
      const gridEl = gridRef.current;
      return gridEl?.getColumns?.() || columns;
    },
    setColumns: (newColumns) => {
      const gridEl = gridRef.current;
      if (gridEl?.updateColumns) {
        gridEl.updateColumns(newColumns);
        return true;
      }
      return false;
    },
    getSortingState: () => {
      const gridEl = gridRef.current;
      return gridEl?.getSortingState?.() || [];
    },
    setSortingState: (sortState) => {
      const gridEl = gridRef.current;
      if (gridEl?.setSortingState) {
        gridEl.setSortingState(sortState);
        return true;
      }
      return false;
    },
    getFilterState: () => {
      const gridEl = gridRef.current;
      return gridEl?.getFilterState?.() || {};
    },
    setFilterState: (filterState) => {
      const gridEl = gridRef.current;
      if (gridEl?.setFilterState) {
        gridEl.setFilterState(filterState);
        return true;
      }
      return false;
    },
    getPivotState: () => {
      const gridEl = gridRef.current;
      return gridEl?.getPivotState?.() || null;
    },
    setPivotState: (pivotState) => {
      const gridEl = gridRef.current;
      if (gridEl?.setPivotState) {
        gridEl.setPivotState(pivotState);
        return true;
      }
      return false;
    },
    getSelectedRows: () => {
      const gridEl = gridRef.current;
      return gridEl?.getSelectedRows?.() || [];
    },
    setSelectedRows: (rows) => {
      const gridEl = gridRef.current;
      if (gridEl?.setSelectedRows) {
        gridEl.setSelectedRows(rows);
        return true;
      }
      return false;
    },
    getSelectedCells: () => {
      const gridEl = gridRef.current;
      return gridEl?.getSelectedCells?.() || [];
    },
  }));

  // Setup event handlers for the grid
  useEffect(() => {
    const handleRowClick = (e) => {
      if (onRowClick && e.detail && typeof e.detail.rowIndex === "number") {
        const { rowIndex } = e.detail;
        onRowClick(rowIndex, data[rowIndex]);
      }
    };

    const handleCellClick = (e) => {
      if (onCellClick && e.detail) {
        const { rowIndex, columnIndex } = e.detail;
        onCellClick({
          rowIndex,
          columnIndex,
          data: data[rowIndex],
        });
      }
    };

    const handleCellEditEvent = (e) => {
      if (onCellEdit && e.detail) {
        const { prop, rowIndex, model } = e.detail;
        onCellEdit({
          prop,
          rowIndex,
          model,
          data: data[rowIndex],
        });
      }
    };

    const gridElement = gridRef.current;
    if (gridElement) {
      if (onRowClick) {
        gridElement.addEventListener("rowclick", handleRowClick);
      }
      if (onCellClick) {
        gridElement.addEventListener("cellclick", handleCellClick);
      }
      if (onCellEdit) {
        gridElement.addEventListener("beforeedit", handleCellEditEvent);
        gridElement.addEventListener("afteredit", handleCellEditEvent);
      }
    }

    // Cleanup function to remove event listeners
    return () => {
      if (gridElement) {
        if (onRowClick) {
          gridElement.removeEventListener("rowclick", handleRowClick);
        }
        if (onCellClick) {
          gridElement.removeEventListener("cellclick", handleCellClick);
        }
        if (onCellEdit) {
          gridElement.removeEventListener("beforeedit", handleCellEditEvent);
          gridElement.removeEventListener("afteredit", handleCellEditEvent);
        }
      }
    };
  }, [onRowClick, onCellClick, onCellEdit, data]);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement || typeof gridElement.addEventListener !== "function") {
      return;
    }

    const preventHeaderSort = (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
      if (onHeaderClick && event?.detail) {
        const detail = event.detail;
        const column = detail.column || detail.col || detail;
        onHeaderClick(column);
      }
    };

    gridElement.addEventListener("beforeheaderclick", preventHeaderSort);

    return () => {
      gridElement.removeEventListener(
        "beforeheaderclick",
        preventHeaderSort
      );
    };
  }, [onHeaderClick, columns]);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (!gridElement || typeof gridElement.addEventListener !== "function") {
      return;
    }

    const preventCellEditing = (event) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
    };

    gridElement.addEventListener("beforeedit", preventCellEditing);

    return () => {
      gridElement.removeEventListener("beforeedit", preventCellEditing);
    };
  }, [columns]);

  useEffect(() => {
    if (!onColumnsReordered) return;
    const gridElement = gridRef.current;
    if (!gridElement) return;

    // Add a small delay to ensure the grid is fully initialized before enabling drag
    const timer = setTimeout(() => {
      const handleColumnDragEnd = async () => {
        try {
          const currentColumns = await gridElement.getColumns?.();
          if (!Array.isArray(currentColumns)) {
            return;
          }
          const nextOrder = currentColumns
            .map((col) => {
              if (typeof col.id === "string" && col.id.length > 0) {
                return col.id;
              }
              if (typeof col.prop === "string" && col.prop.length > 0) {
                return col.prop;
              }
              if (typeof col.name === "string" && col.name.length > 0) {
                return col.name;
              }
              return null;
            })
            .filter((value) => typeof value === "string");

          if (nextOrder.length) {
            onColumnsReordered(nextOrder);
          }
        } catch (error) {
          console.warn("[DataGrid] Unable to resolve column order", error);
        }
      };

      gridElement.addEventListener("columndragend", handleColumnDragEnd);
      
      // Store the cleanup function
      gridElement._cleanupColumnDrag = () => {
        gridElement.removeEventListener("columndragend", handleColumnDragEnd);
      };
    }, 100); // Small delay to ensure grid is ready

    return () => {
      clearTimeout(timer);
      if (gridElement && gridElement._cleanupColumnDrag) {
        gridElement._cleanupColumnDrag();
      }
    };
  }, [onColumnsReordered, columns]); // Add columns as dependency to reinitialize when columns change

  const containerStyle =
    typeof height === "number" ? { height: `${height}px` } : { height };

  const pinnedTopSource =
    additionalProps.pinnedTopSource &&
    Array.isArray(additionalProps.pinnedTopSource) &&
    additionalProps.pinnedTopSource.length > 0
      ? additionalProps.pinnedTopSource.map((row, idx) => ({
          ...row,
          __pinned: true,
          id: row.id || `pinned-${idx}`,
        }))
      : [];

  return (
    <div className="revogrid-wrapper bg-white py-2 rounded-xl shadow  border">
      <div className="grid-header-bar border-b flex items-center justify-between px-4 py-4">
        <div>
          {title && (
            <h2 className="text-xl font-semibold text-gray-800 mb-0">
              {title}
            </h2>
          )}
        </div>
        {searchable && (
          <div>
            <input
              type="text"
              className="grid-search-input bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring focus:ring-gray-500"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="revogrid-container" style={containerStyle}>
        {loading ? (
          <DataGridSkeleton
            rows={skeletonRows}
            columns={columns?.length || 5}
            height={height}
            title={title}
            searchable={false} // Don't show search skeleton since we have the real search bar above
            {...(skeletonPreset && DataGridSkeletonPresets[skeletonPreset])}
            {...skeletonProps}
            className="absolute inset-0"
          />
        ) : filtered.length === 0 ? (
          <div className="grid-empty-state">{emptyMessage}</div>
        ) : (
          <RevoGrid
            ref={gridRef}
            key={`grid-${columns.map(c => c.id || c.prop || c.name).join('-')}`}
            columns={gridColumns}
            source={filtered}
            theme={theme}
            resize={enableResize}
            range={enableRange}
            rowClass={rowClass}
            exporting={enableExporting}
            group={enableGrouping}
            groups={groupBy}
            editable={false}
            pinnedTopSource={pinnedTopSource}
            readonly={true}
            canMoveColumns={canMoveColumns}
            {...restAdditionalProps}
            plugins={mergedPlugins}
          />
        )}
      </div>
    </div>
  );
});
export { DataGrid };

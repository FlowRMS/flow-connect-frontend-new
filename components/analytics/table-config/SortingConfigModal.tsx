"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Save, Search } from "lucide-react";

interface SortColumn {
  prop: string;
  name: string;
  order: "asc" | "desc";
}

interface SortingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Array<{ prop: string; name: string; sortable?: boolean }>;
  currentSorting: SortColumn[];
  onApplySorting: (sorting: SortColumn[]) => void;
}

export const SortingConfigModal: React.FC<SortingConfigModalProps> = ({
  isOpen,
  onClose,
  columns,
  currentSorting,
  onApplySorting,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<SortColumn[]>([]);
  const [activePane, setActivePane] = useState<"select" | "configure">("select");
  const [selectSearchQuery, setSelectSearchQuery] = useState("");
  const [configureSearchQuery, setConfigureSearchQuery] = useState("");

  // Initialize with current sorting
  useEffect(() => {
    if (isOpen && currentSorting.length > 0) {
      setSelectedColumns(currentSorting);
      setActivePane("configure");
    } else if (isOpen) {
      setSelectedColumns([]);
      setActivePane("select");
    }
    // Reset search queries when modal opens
    if (isOpen) {
      setSelectSearchQuery("");
      setConfigureSearchQuery("");
    }
  }, [isOpen, currentSorting]);

  if (!isOpen) return null;

  const sortableColumns = columns.filter((col) => col.sortable !== false);

  // Get columns that haven't been selected yet
  const availableColumns = sortableColumns.filter(
    (col) => !selectedColumns.find((sc) => sc.prop === col.prop)
  );

  // Filter columns based on search queries
  const filteredAvailableColumns = availableColumns.filter((col) =>
    col.name.toLowerCase().includes(selectSearchQuery.toLowerCase()) ||
    col.prop.toLowerCase().includes(selectSearchQuery.toLowerCase())
  );

  const filteredSelectedColumns = selectedColumns.filter((col) =>
    col.name.toLowerCase().includes(configureSearchQuery.toLowerCase()) ||
    col.prop.toLowerCase().includes(configureSearchQuery.toLowerCase())
  );

  const handleColumnSelect = (column: { prop: string; name: string }) => {
    setSelectedColumns([
      ...selectedColumns,
      { prop: column.prop, name: column.name, order: "asc" },
    ]);
  };

  const handleColumnRemove = (prop: string) => {
    setSelectedColumns(selectedColumns.filter((col) => col.prop !== prop));
  };

  const handleOrderChange = (prop: string, order: "asc" | "desc") => {
    setSelectedColumns(
      selectedColumns.map((col) =>
        col.prop === prop ? { ...col, order } : col
      )
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newColumns = [...selectedColumns];
    [newColumns[index - 1], newColumns[index]] = [
      newColumns[index],
      newColumns[index - 1],
    ];
    setSelectedColumns(newColumns);
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedColumns.length - 1) return;
    const newColumns = [...selectedColumns];
    [newColumns[index], newColumns[index + 1]] = [
      newColumns[index + 1],
      newColumns[index],
    ];
    setSelectedColumns(newColumns);
  };

  const handleSave = () => {
    onApplySorting(selectedColumns);
    onClose();
  };

  const handleClearAll = () => {
    setSelectedColumns([]);
    onApplySorting([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configure Sorting</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activePane === "select"
                ? "Select columns to add to sorting order"
                : "Configure the sort order for selected columns"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Pane Selector */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => setActivePane("select")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activePane === "select"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            1. Select Columns ({availableColumns.length} available)
          </button>
          <button
            onClick={() => setActivePane("configure")}
            disabled={selectedColumns.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activePane === "configure"
                ? "bg-blue-600 text-white"
                : selectedColumns.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            2. Configure Order ({selectedColumns.length} selected)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activePane === "select" ? (
            // Column Selection Pane
            <div className="space-y-3">
              {/* Search Bar for Select Columns */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search columns..."
                    value={selectSearchQuery}
                    onChange={(e) => setSelectSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {selectSearchQuery && (
                    <button
                      onClick={() => setSelectSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {filteredAvailableColumns.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUpDown className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 font-medium">
                    {selectSearchQuery 
                      ? `No columns found matching "${selectSearchQuery}"`
                      : selectedColumns.length > 0
                      ? "All available columns have been added"
                      : "No sortable columns available"}
                  </p>
                  {selectedColumns.length > 0 && !selectSearchQuery && (
                    <button
                      onClick={() => setActivePane("configure")}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go to Configure Order
                    </button>
                  )}
                  {selectSearchQuery && (
                    <button
                      onClick={() => setSelectSearchQuery("")}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Tip:</strong> Click on any column below to add it to your
                      sorting configuration. You can add multiple columns to create
                      multi-level sorting.
                    </p>
                  </div>
                  {filteredAvailableColumns.map((column) => (
                    <button
                      key={column.prop}
                      onClick={() => handleColumnSelect(column)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{column.name}</div>
                        <div className="text-sm text-gray-500">{column.prop}</div>
                      </div>
                      <Plus
                        size={20}
                        className="text-gray-400 group-hover:text-blue-600 transition-colors"
                      />
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            // Sort Configuration Pane
            <div className="space-y-3">
              {/* Search Bar for Configure Order */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search sorted columns..."
                    value={configureSearchQuery}
                    onChange={(e) => setConfigureSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {configureSearchQuery && (
                    <button
                      onClick={() => setConfigureSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {selectedColumns.length === 0 ? (
                <div className="text-center py-12">
                  <ArrowUpDown className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 font-medium mb-4">
                    No columns selected for sorting
                  </p>
                  <button
                    onClick={() => setActivePane("select")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select Columns
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      <strong>Configure:</strong> Set the sort direction for each column
                      and reorder them using the arrow buttons. The table will sort by
                      the first column, then by the second, and so on.
                    </p>
                  </div>
                  {filteredSelectedColumns.length === 0 && configureSearchQuery ? (
                    <div className="text-center py-12">
                      <Search className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 font-medium mb-4">
                        No sorted columns found matching &quot;{configureSearchQuery}&quot;
                      </p>
                      <button
                        onClick={() => setConfigureSearchQuery("")}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    filteredSelectedColumns.map((column, index) => {
                      // Get the actual index in the full selectedColumns array
                      const actualIndex = selectedColumns.findIndex(col => col.prop === column.prop);
                      return (
                        <div
                          key={column.prop}
                          className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            {/* Order Badge */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                              {actualIndex + 1}
                            </div>

                            {/* Column Info */}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {column.name}
                              </div>
                              <div className="text-sm text-gray-500">{column.prop}</div>
                            </div>

                            {/* Sort Direction Toggle - Now with text labels */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOrderChange(column.prop, "asc")}
                                className={`px-4 py-2 rounded-lg border transition-all font-medium text-sm ${
                                  column.order === "asc"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                                title="Sort in ascending order"
                              >
                                Ascending
                              </button>
                              <button
                                onClick={() => handleOrderChange(column.prop, "desc")}
                                className={`px-4 py-2 rounded-lg border transition-all font-medium text-sm ${
                                  column.order === "desc"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                                title="Sort in descending order"
                              >
                                Descending
                              </button>
                            </div>

                            {/* Move Up/Down Buttons */}
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveUp(actualIndex)}
                                disabled={actualIndex === 0}
                                className={`p-1 rounded transition-colors ${
                                  actualIndex === 0
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                                title="Move up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                onClick={() => handleMoveDown(actualIndex)}
                                disabled={actualIndex === selectedColumns.length - 1}
                                className={`p-1 rounded transition-colors ${
                                  actualIndex === selectedColumns.length - 1
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                                title="Move down"
                              >
                                <ArrowDown size={16} />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleColumnRemove(column.prop)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from sorting"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex gap-2">
            {selectedColumns.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Clear All Sorting
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedColumns.length === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedColumns.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              <Save size={18} />
              Apply Sorting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useMemo, useState } from "react";
import { SavedColumnConfigEntry } from "@/lib/analytics/hooks/useColumnConfig";
import { BookmarkPlus, List, Trash2, X } from "lucide-react";

type MaybePromise<T> = T | Promise<T>;

interface DetailConfigManagerProps {
  getConfigs: () => SavedColumnConfigEntry[];
  saveConfig: (
    name: string,
    additionalState?: {
      advancedFilters?: Record<string, unknown>;
      dateRange?: { startDate?: string; endDate?: string };
      sorting?: Array<{ prop: string; order: string }>;
    }
  ) => MaybePromise<string | null>;
  loadConfig: (id: string) => MaybePromise<SavedColumnConfigEntry | null>;
  deleteConfig: (id: string) => MaybePromise<boolean>;
  setDefaultConfig?: (id: string | null) => MaybePromise<void>;
  getDefaultConfigId?: () => string | null;
  isDefaultConfig?: (id: string) => boolean;
  className?: string;
  // Additional state to save with the config
  advancedFilters?: Record<string, unknown>;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  sorting?: Array<{ prop: string; order: string }>;
  // Callbacks to restore state when loading a config
  onLoadConfig?: (config: SavedColumnConfigEntry) => void;
}

export function DetailConfigManager({
  getConfigs,
  saveConfig,
  loadConfig,
  deleteConfig,
  setDefaultConfig,
  getDefaultConfigId,
  isDefaultConfig,
  className,
  advancedFilters,
  dateRange,
  sorting,
  onLoadConfig,
}: DetailConfigManagerProps) {
  const [open, setOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const configs = useMemo(
    () => getConfigs(),
    [getConfigs, open, refreshVersion]
  );

  const handleSave = () => {
    setSaveName(`Config ${new Date().toLocaleString()}`);
    setSaveModalOpen(true);
  };

  const handleLoad = async (id: string) => {
    try {
      const entry = await loadConfig(id);
      if (entry) {
        setMessage({ type: "success", text: "Configuration applied." });
        setRefreshVersion((value) => value + 1);
        if (onLoadConfig) {
          onLoadConfig(entry);
        }
      } else {
        setMessage({ type: "error", text: "Unable to load this configuration." });
      }
    } catch (error) {
      console.error("[DetailConfigManager] Failed to load configuration", error);
      setMessage({ type: "error", text: "Unable to load this configuration." });
    }
  };

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ id, name });
  };

  const handleSetDefault = async (id: string | null) => {
    if (!setDefaultConfig) return;
    try {
      await setDefaultConfig(id);
      setMessage({
        type: "success",
        text: id ? "Set as default." : "Removed default configuration.",
      });
      setRefreshVersion((value) => value + 1);
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("[DetailConfigManager] Failed to update default config", error);
      setMessage({
        type: "error",
        text: "Unable to update default configuration.",
      });
    }
  };

  return (
    <div className={`relative ${className || ""}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <BookmarkPlus size={16} />
        Configs
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-30">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-700">
                Saved Configurations
              </h4>
              <p className="text-xs text-gray-500">
                Save, load, or delete layouts for this report.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Save
            </button>
          </div>
          {message && (
            <div
              className={`px-4 py-2 text-xs ${
                message.type === "success"
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {message.text}
            </div>
          )}
          <div className="max-h-72 overflow-y-auto">
            {configs.length === 0 ? (
              <div className="px-4 py-8 text-sm text-gray-500 flex flex-col items-center gap-2">
                <List size={18} />
                <span>No saved configurations yet.</span>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {configs.map((entry) => (
                  <li
                    key={entry.id}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {entry.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {/* Display config metadata badges */}
                      {(entry.advancedFilters || entry.dateRange || entry.sorting) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {entry.advancedFilters && Object.keys(entry.advancedFilters).length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {Object.keys(entry.advancedFilters).length} Filters
                            </span>
                          )}
                          {entry.dateRange && (entry.dateRange.startDate || entry.dateRange.endDate) && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                              Date Range
                            </span>
                          )}
                          {entry.sorting && entry.sorting.length > 0 && (
                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {entry.sorting.length} Sort{entry.sorting.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2 items-center">
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            void handleLoad(entry.id);
                          }}
                        >
                          Load
                        </button>
                        {setDefaultConfig && isDefaultConfig && (
                          <>
                            {isDefaultConfig(entry.id) ? (
                              <button
                                type="button"
                                className="text-xs text-amber-600 hover:text-amber-800"
                                onClick={() => {
                                  void handleSetDefault(null);
                                }}
                              >
                                Default
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="text-xs text-gray-500 hover:text-amber-600"
                                onClick={() => {
                                  void handleSetDefault(entry.id);
                                }}
                              >
                                Set Default
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                          onClick={() => handleDelete(entry.id, entry.name)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-right">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {saveModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800">
                Save Configuration
              </h4>
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <label className="block text-xs font-medium text-gray-600">
                Enter a name
              </label>
              <input
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Finance team view"
              />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveModalOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"
                onClick={async () => {
                  const trimmed = saveName.trim();
                  if (!trimmed) {
                    setMessage({
                      type: "error",
                      text: "Please provide a name for the configuration.",
                    });
                    return;
                  }
                  try {
                    const id = await saveConfig(trimmed, {
                      advancedFilters,
                      dateRange,
                      sorting,
                    });
                    if (id) {
                      setMessage({
                        type: "success",
                        text: "Configuration saved.",
                      });
                      setSaveModalOpen(false);
                      setRefreshVersion((value) => value + 1);
                    } else {
                      setMessage({
                        type: "error",
                        text: "Unable to save configuration.",
                      });
                    }
                  } catch (error) {
                    console.error("[DetailConfigManager] Failed to save configuration", error);
                    setMessage({
                      type: "error",
                      text: "Unable to save configuration.",
                    });
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h4 className="text-sm font-semibold text-gray-800">
                Delete Configuration
              </h4>
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-gray-700 space-y-2">
              <p>
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {deleteModal.name}
                </span>
                ?
              </p>
              <p className="text-xs text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white text-sm px-3 py-2 rounded-md hover:bg-red-700"
                onClick={async () => {
                  try {
                    const deleted = await deleteConfig(deleteModal.id);
                    if (deleted) {
                      setMessage({
                        type: "success",
                        text: "Configuration deleted.",
                      });
                      setRefreshVersion((value) => value + 1);
                    } else {
                      setMessage({
                        type: "error",
                        text: "Unable to delete configuration.",
                      });
                    }
                  } catch (error) {
                    console.error("[DetailConfigManager] Failed to delete configuration", error);
                    setMessage({
                      type: "error",
                      text: "Unable to delete configuration.",
                    });
                  }
                  setDeleteModal(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


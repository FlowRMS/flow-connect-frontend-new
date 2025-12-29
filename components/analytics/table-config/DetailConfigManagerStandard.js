"use client";

import React, { useState, useMemo } from "react";
import { StandardConfigManager } from "./StandardConfigManager";
import { List, Trash2, X } from "lucide-react";
import { toast } from "@/lib/analytics/lib/toast";

/**
 * Detail Table Configuration Manager with Standardized UI
 * 
 * Provides consistent "Save View" and "Manage Views" buttons for detail tables
 * with integrated save/load/delete modal functionality
 */
export function DetailConfigManagerStandard({
  getConfigs,
  saveConfig,
  loadConfig,
  deleteConfig,
  setDefaultConfig,
  isDefaultConfig,
  className = "",
  advancedFilters,
  dateRange,
  sorting,
  onLoadConfig,
  disabled = false,
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [message, setMessage] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const configs = useMemo(
    () => getConfigs(),
    [getConfigs, isDialogOpen, refreshVersion]
  );

  const handleSaveClick = () => {
    setSaveName(`Config ${new Date().toLocaleString()}`);
    setSaveModalOpen(true);
  };

  const handleManageClick = () => {
    setIsDialogOpen(true);
  };

  const handleLoad = async (id) => {
    try {
      const entry = await loadConfig(id);
      if (entry) {
        setMessage({ type: "success", text: "Configuration applied." });
        toast.success("View loaded", "Configuration applied successfully");
        setRefreshVersion((value) => value + 1);
        if (onLoadConfig) {
          onLoadConfig(entry);
        }
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: "error", text: "Unable to load this configuration." });
        toast.error("Failed to load", "Unable to load this configuration");
      }
    } catch (error) {
      console.error("[DetailConfigManagerStandard] Failed to load configuration", error);
      setMessage({ type: "error", text: "Unable to load this configuration." });
      toast.error("Failed to load", "Unable to load this configuration");
    }
  };

  const handleDelete = (id, name) => {
    setDeleteModal({ id, name });
  };

  const handleSetDefault = async (id) => {
    if (!setDefaultConfig) return;
    try {
      await setDefaultConfig(id);
      const successMsg = id ? "Set as default." : "Removed default configuration.";
      setMessage({
        type: "success",
        text: successMsg,
      });
      toast.success("Default updated", successMsg);
      setRefreshVersion((value) => value + 1);
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("[DetailConfigManagerStandard] Failed to update default config", error);
      setMessage({
        type: "error",
        text: "Unable to update default configuration.",
      });
      toast.error("Failed to update", "Unable to update default configuration");
    }
  };

  return (
    <>
      <StandardConfigManager
        onSaveClick={handleSaveClick}
        onManageClick={handleManageClick}
        className={className}
        disabled={disabled}
      />

      {/* Manage Views Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Manage Views
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Load, delete, or set default configurations
                </p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Message Banner */}
            {message && (
              <div
                className={`px-6 py-3 text-sm ${
                  message.type === "success"
                    ? "text-green-700 bg-green-50 border-b border-green-200"
                    : "text-red-600 bg-red-50 border-b border-red-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {configs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <List size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No saved views yet</p>
                  <p className="text-sm">Click &ldquo;Save View&rdquo; to create your first configuration</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {configs.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {entry.name}
                            </h4>
                            {setDefaultConfig && isDefaultConfig && isDefaultConfig(entry.id) && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            Saved: {new Date(entry.timestamp).toLocaleString()}
                          </p>

                          {/* Config metadata badges */}
                          {(entry.advancedFilters || entry.dateRange || entry.sorting) && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {entry.advancedFilters && Object.keys(entry.advancedFilters).length > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {Object.keys(entry.advancedFilters).length} Filters
                                </span>
                              )}
                              {entry.dateRange && (entry.dateRange.startDate || entry.dateRange.endDate) && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                  Date Range
                                </span>
                              )}
                              {entry.sorting && entry.sorting.length > 0 && (
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  {entry.sorting.length} Sort{entry.sorting.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleLoad(entry.id)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              Load
                            </button>
                            {setDefaultConfig && isDefaultConfig && (
                              <>
                                {isDefaultConfig(entry.id) ? (
                                  <button
                                    onClick={() => handleSetDefault(null)}
                                    className="text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline"
                                  >
                                    Unset Default
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSetDefault(entry.id)}
                                    className="text-xs font-medium text-gray-500 hover:text-amber-600 hover:underline"
                                  >
                                    Set as Default
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(entry.id, entry.name)}
                              className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Save View
              </h3>
              <button
                onClick={() => setSaveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration Name
                </label>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Finance team view"
                  autoFocus
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
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
                        text: "Configuration saved successfully.",
                      });
                      toast.success("View saved", `Configuration "${trimmed}" saved successfully`);
                      setSaveModalOpen(false);
                      setRefreshVersion((value) => value + 1);
                      setTimeout(() => setMessage(null), 2000);
                    } else {
                      setMessage({
                        type: "error",
                        text: "Unable to save configuration.",
                      });
                      toast.error("Failed to save", "Unable to save configuration");
                    }
                  } catch (error) {
                    console.error("[DetailConfigManagerStandard] Failed to save configuration", error);
                    setMessage({
                      type: "error",
                      text: "Unable to save configuration.",
                    });
                    toast.error("Failed to save", "Unable to save configuration");
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Configuration
              </h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
                <p className="text-sm text-gray-700">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteModal.name}</span>
                ?
              </p>
              <p className="text-xs text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const deleted = await deleteConfig(deleteModal.id);
                    if (deleted) {
                      setMessage({
                        type: "success",
                        text: "Configuration deleted successfully.",
                      });
                      toast.success("View deleted", `Configuration "${deleteModal.name}" deleted successfully`);
                      setRefreshVersion((value) => value + 1);
                      setTimeout(() => setMessage(null), 2000);
                    } else {
                      setMessage({
                        type: "error",
                        text: "Unable to delete configuration.",
                      });
                      toast.error("Failed to delete", "Unable to delete configuration");
                    }
                  } catch (error) {
                    console.error("[DetailConfigManagerStandard] Failed to delete configuration", error);
                    setMessage({
                      type: "error",
                      text: "Unable to delete configuration.",
                    });
                    toast.error("Failed to delete", "Unable to delete configuration");
                  }
                  setDeleteModal(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


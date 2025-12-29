"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, Save, Trash2, BookmarkPlus } from "lucide-react";
import { Modal, useModal } from "../ui/Modal";

/**
 * Dialog for managing dashboard configurations
 * Allows saving, loading, and deleting dashboard-specific configs
 */
export function DashboardConfigDialog({
  isOpen,
  onClose,
  configManager,
  onSaveConfig,
  onLoadConfig,
  onDeleteConfig,
  savedConfigs: externalSavedConfigs,
  initialTab = "save", // Default tab to show when dialog opens
}) {
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { modalState, hideModal, showAlert, showConfirm } = useModal();

  // Set initial view based on initialTab prop
  useEffect(() => {
    if (isOpen) {
      setShowSaveForm(initialTab === "save");
    }
  }, [isOpen, initialTab]);

  const savedConfigs = useMemo(() => {
    if (Array.isArray(externalSavedConfigs)) {
      return [...externalSavedConfigs].sort((a, b) => b.timestamp - a.timestamp);
    }

    if (!configManager) return [];

    const configs = configManager.getSavedConfigs();
    return Object.values(configs).sort((a, b) => b.timestamp - a.timestamp);
  }, [configManager, externalSavedConfigs, isOpen, refreshTrigger]);

  const handleSave = async () => {
    if (!configName.trim()) {
      showAlert("Configuration Name Required", "Please enter a configuration name", "warning");
      return;
    }

    const success = await onSaveConfig(configName, configDescription);
    if (success) {
      setConfigName("");
      setConfigDescription("");
      setShowSaveForm(false);
      // Trigger refresh to show the new config immediately
      setRefreshTrigger(prev => prev + 1);
      showAlert("Success", "Configuration saved successfully!", "success");
    }
  };

  const handleLoad = async (configId) => {
    const success = await onLoadConfig(configId);
    if (success) {
      onClose();
      showAlert("Success", "Configuration loaded successfully!", "success");
    }
  };

  const handleDeleteClick = (configId) => {
    showConfirm(
      "Delete Configuration",
      "Are you sure you want to delete this configuration? This action cannot be undone.",
      async () => {
        await onDeleteConfig(configId);
        // Trigger refresh to update the list immediately
        setRefreshTrigger(prev => prev + 1);
        showAlert("Success", "Configuration deleted successfully!", "success");
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Dashboard Configurations
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Save and manage your dashboard filter presets
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Save New Config Section */}
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full mb-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition flex items-center justify-center gap-2"
            >
              <BookmarkPlus size={18} />
              Save Current Dashboard State
            </button>
          ) : (
            <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Save Current Configuration
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuration Name *
                  </label>
                  <input
                    type="text"
                    value={configName}
                    onChange={(e) => setConfigName(e.target.value)}
                    placeholder="e.g., Q4 Sales Focus"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={configDescription}
                    onChange={(e) => setConfigDescription(e.target.value)}
                    placeholder="Add notes about this configuration..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveForm(false);
                      setConfigName("");
                      setConfigDescription("");
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Configs List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Saved Configurations ({savedConfigs.length})
            </h3>
            {savedConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No saved configurations yet.</p>
                <p className="text-xs mt-1">
                  Configure your filters and save them for quick access.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {config.name}
                        </h4>
                        {config.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {config.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Saved: {new Date(config.timestamp).toLocaleString()}
                        </p>
                        {config.dashboard && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {config.dashboard.valueType && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                {config.dashboard.valueType}
                              </span>
                            )}
                            {config.dashboard.globalFilters?.customers?.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {config.dashboard.globalFilters.customers.length} Customers
                              </span>
                            )}
                            {config.dashboard.globalFilters?.factories?.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                {config.dashboard.globalFilters.factories.length} Factories
                              </span>
                            )}
                            {config.dashboard.globalFilters?.outsideReps?.length > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                {config.dashboard.globalFilters.outsideReps.length} Reps
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleLoad(config.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md font-medium transition"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteClick(config.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Custom Modal for alerts and confirmations */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
      />
    </div>
  );
}

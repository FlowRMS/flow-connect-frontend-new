import React, { useState } from "react";
import {
  Save,
  Play,
  Trash2,
  Download,
  Upload,
  Loader2,
  Plus,
  Calendar,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Modal, useModal } from "../ui/Modal";

export const PivotConfigToolbar = ({
  savedConfigs = {},
  onSaveConfig,
  onLoadConfig,
  onDeleteConfig,
  onExportConfig,
  onImportConfig,
  loading = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [saveMode, setSaveMode] = useState("new"); // 'new' or 'overwrite'
  const [selectedConfig, setSelectedConfig] = useState("");
  const { modalState, hideModal, showAlert, showConfirm } = useModal();

  const sortedConfigs = Object.entries(savedConfigs).sort(
    ([, a], [, b]) => new Date(b.savedAt) - new Date(a.savedAt)
  );

  const handleSave = async () => {
    const configName = saveMode === "new" ? newConfigName : selectedConfig;

    if (!configName?.trim()) {
      showAlert("Configuration Name Required", "Please enter a configuration name", "warning");
      return;
    }

    try {
      await onSaveConfig(configName.trim());
      setShowSaveDialog(false);
      setNewConfigName("");
      setSelectedConfig("");
      showAlert("Success", "Configuration saved successfully!", "success");
    } catch (error) {
      console.error("Save failed:", error);
      showAlert("Save Failed", `Failed to save configuration: ${error.message}`, "error");
    }
  };

  const handleDelete = async (configName) => {
    showConfirm(
      "Delete Configuration",
      `Are you sure you want to delete "${configName}"? This action cannot be undone.`,
      async () => {
        try {
          await onDeleteConfig(configName);
          showAlert("Deleted", "Configuration deleted successfully", "success");
        } catch (error) {
          console.error("Delete failed:", error);
          showAlert("Delete Failed", `Failed to delete configuration: ${error.message}`, "error");
        }
      }
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConfigStats = (config) => {
    return {
      rows: config.rows?.length || 0,
      columns: config.columns?.length || 0,
      values: config.values?.length || 0,
    };
  };

  return (
    <Card
      className={`border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50 ${className}`}
    >
      <CardContent className="p-4">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Pivot Configurations
            </h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
              <span className="font-medium">{sortedConfigs.length}</span>
              <span>saved</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Save Button */}
            <Button
              onClick={() => setShowSaveDialog(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">Save Current</span>
            </Button>

            {/* Import/Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportConfig}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Configs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImportConfig}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">
              Save Pivot Configuration
            </h4>

            <div className="space-y-3">
              {/* Save Mode Selection */}
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="new"
                    checked={saveMode === "new"}
                    onChange={(e) => setSaveMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Save as new</span>
                </label>
                {sortedConfigs.length > 0 && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="overwrite"
                      checked={saveMode === "overwrite"}
                      onChange={(e) => setSaveMode(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Overwrite existing</span>
                  </label>
                )}
              </div>

              {/* Input Field */}
              {saveMode === "new" ? (
                <Input
                  placeholder="Enter configuration name..."
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              ) : (
                <select
                  value={selectedConfig}
                  onChange={(e) => setSelectedConfig(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select configuration to overwrite...</option>
                  {sortedConfigs.map(([name]) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewConfigName("");
                    setSelectedConfig("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Configurations List */}
        {isExpanded && sortedConfigs.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="text-xs font-medium text-gray-600 mb-2 px-1">
              Recent Configurations ({sortedConfigs.length})
            </div>

            {sortedConfigs.map(([name, config]) => {
              const stats = getConfigStats(config);

              return (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
                >
                  {/* Config Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-medium text-gray-900 truncate">
                          {name}
                        </h5>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                              {stats.rows}R
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                              {stats.columns}C
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                              {stats.values}V
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(config.savedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadConfig(name)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {isExpanded && sortedConfigs.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-3">
              No pivot configurations saved yet
            </p>
            <Button
              onClick={() => setShowSaveDialog(true)}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Save Current Configuration
            </Button>
          </div>
        )}
      </CardContent>

      {/* Custom Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
      />
    </Card>
  );
};

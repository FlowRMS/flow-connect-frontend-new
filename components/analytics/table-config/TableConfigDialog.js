"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import {
  Save,
  Download,
  Upload,
  Trash2,
  FileText,
  Calendar,
  Settings,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { Modal, useModal } from "../ui/Modal";
import { toast } from "@/lib/analytics/lib/toast";

export function TableConfigDialog({
  isOpen,
  onClose,
  configManager,
  gridRef,
  onConfigApplied,
  deleteConfig,
  loadConfig,
  saveConfig, // Function from useTableConfig hook that handles additional state
  getSavedConfigs,
  trigger,
  refreshTrigger: externalRefreshTrigger, // Receive refresh trigger from parent
  initialTab = "save", // Default tab to show when dialog opens
}) {
  const [activeTab, setActiveTab] = useState("save");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  const { modalState, hideModal, showAlert, showConfirm } = useModal();

  // Set active tab when dialog opens based on initialTab prop
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Save configuration state
  const [saveForm, setSaveForm] = useState({
    name: "",
    description: "",
    makeDefault: false,
  });

  const savedConfigs = useMemo(() => {
    if (!isOpen) return {};

    try {
      const configs =
        typeof getSavedConfigs === "function"
          ? getSavedConfigs()
          : configManager?.getSavedConfigs?.();
      return configs ? { ...configs } : {};
    } catch (error) {
      console.error("Error loading saved configurations:", error);
      return {};
    }
  }, [
    isOpen,
    getSavedConfigs,
    configManager,
    externalRefreshTrigger,
    internalRefreshTrigger,
  ]);

  useEffect(() => {
    if (isOpen) {
      loadFavorites();
    }
  }, [isOpen]);

  const loadFavorites = () => {
    try {
      const savedFavorites = localStorage.getItem("table_config_favorites");
      setFavorites(new Set(savedFavorites ? JSON.parse(savedFavorites) : []));
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites(new Set());
    }
  };

  const saveFavorites = (newFavorites) => {
    try {
      localStorage.setItem(
        "table_config_favorites",
        JSON.stringify([...newFavorites])
      );
      setFavorites(newFavorites);
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const toggleFavorite = (configId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(configId)) {
      newFavorites.delete(configId);
    } else {
      newFavorites.add(configId);
    }
    saveFavorites(newFavorites);
  };

  const handleSaveConfig = async () => {
    if (!saveForm.name.trim()) {
      showAlert("Configuration Name Required", "Please enter a configuration name", "warning");
      return;
    }

    // If saveConfig function is provided from the hook, use it (handles additional state)
    if (saveConfig) {
      const configId = await saveConfig(
        saveForm.name.trim(),
        saveForm.description.trim(),
        { makeDefault: saveForm.makeDefault }
      );
      
      if (configId) {
        if (saveForm.makeDefault) {
          toggleFavorite(configId);
        }

        setSaveForm({ name: "", description: "", makeDefault: false });
        setInternalRefreshTrigger(prev => prev + 1);
        showAlert("Success", "Configuration saved successfully!", "success");
        toast.success("View saved", `Configuration "${saveForm.name.trim()}" saved successfully`);
        setActiveTab("load");
      } else {
        showAlert("Error", "Error saving configuration", "error");
        toast.error("Failed to save", "Error saving configuration");
      }
      return;
    }

    // Fallback to old method if saveConfig not provided
    const currentConfig = await configManager.getCurrentConfig(gridRef);
    if (!currentConfig) {
      showAlert("Error", "Unable to capture current configuration", "error");
      return;
    }

    console.log("[TableConfigDialog] Saving config:", currentConfig);

    const configId = configManager.saveConfig(
      currentConfig,
      saveForm.name.trim(),
      saveForm.description.trim()
    );

    if (configId) {
      if (saveForm.makeDefault) {
        toggleFavorite(configId);
      }

      setSaveForm({ name: "", description: "", makeDefault: false });
      // Trigger refresh to show the new config immediately
      setInternalRefreshTrigger(prev => prev + 1);
      showAlert("Success", "Configuration saved successfully!", "success");
      toast.success("View saved", `Configuration "${saveForm.name.trim()}" saved successfully`);
      setActiveTab("load");
    } else {
      showAlert("Error", "Error saving configuration", "error");
      toast.error("Failed to save", "Error saving configuration");
    }
  };

  const handleLoadConfig = async (config) => {
    console.log("Loading configuration:", config);
    console.log("Grid ref:", gridRef);

    try {
      // Use the loadConfig function from the hook (if provided) to update timestamp and trigger refresh
      const success = loadConfig
        ? await loadConfig(config.id)
        : await configManager.applyConfig(config, gridRef);

      console.log("Apply config result:", success);

      if (success) {
        onConfigApplied?.(config);
        onClose();
        showAlert("Success", "Configuration applied successfully!", "success");
        toast.success("View loaded", "Configuration applied successfully");
      } else {
        console.error("Failed to apply configuration - applyConfig returned false");
        showAlert("Error", "Error applying configuration. Check console for details.", "error");
        toast.error("Failed to load", "Error applying configuration");
      }
    } catch (error) {
      console.error("Exception while applying configuration:", error);
      showAlert("Error", `Error applying configuration: ${error.message}`, "error");
      toast.error("Failed to load", "Error applying configuration");
    }
  };

  const handleDeleteConfig = async (configId) => {
    showConfirm(
      "Delete Configuration",
      "Are you sure you want to delete this configuration? This action cannot be undone.",
      async () => {
        // Use the deleteConfig function from the hook (if provided) to trigger refresh
        const success = deleteConfig
          ? await deleteConfig(configId)
          : configManager.deleteConfig(configId);

        if (success) {
          const newFavorites = new Set(favorites);
          newFavorites.delete(configId);
          saveFavorites(newFavorites);
          setInternalRefreshTrigger((prev) => prev + 1);
          showAlert("Success", "Configuration deleted successfully!", "success");
          toast.success("View deleted", "Configuration deleted successfully");
        } else {
          showAlert("Error", "Error deleting configuration", "error");
          toast.error("Failed to delete", "Error deleting configuration");
        }
      }
    );
  };

  const handleExportConfig = (config) => {
    const dataStr = configManager.exportConfig(config);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `table-config-${config.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportConfig = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = configManager.importConfig(e.target.result);
          if (config && configManager.validateConfig(config)) {
            // Generate new ID for imported config using timestamp and random hex
            const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(6)))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');
            config.id = `imported_${Date.now()}_${randomHex}`;
            config.name = `${config.name} (Imported)`;
            config.timestamp = Date.now();

            const configId = configManager.saveConfig(
              config,
              config.name,
              config.description
            );
            if (configId) {
              // Trigger refresh to show the imported config immediately
              setInternalRefreshTrigger(prev => prev + 1);
              showAlert("Success", "Configuration imported successfully!", "success");
              toast.success("View imported", "Configuration imported successfully");
            }
          } else {
            showAlert("Error", "Invalid configuration file", "error");
          }
        } catch (error) {
          showAlert("Error", "Error reading configuration file", "error");
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    event.target.value = "";
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredConfigs = Object.values(savedConfigs).filter(
    (config) =>
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const favoriteConfigs = filteredConfigs.filter((config) =>
    favorites.has(config.id)
  );
  const otherConfigs = filteredConfigs.filter(
    (config) => !favorites.has(config.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Table Configuration Manager
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "save"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("save")}
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Current
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "load"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("load")}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Load Saved ({Object.keys(savedConfigs).length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "import"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("import")}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Import/Export
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          {/* Save Tab */}
          {activeTab === "save" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Save Current Configuration
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Save your current table setup including filters, sorting,
                  pivot settings, and column arrangements.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Configuration Name *
                    </label>
                    <Input
                      value={saveForm.name}
                      onChange={(e) =>
                        setSaveForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Q4 Sales Analysis, Customer Segment View..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <Textarea
                      value={saveForm.description}
                      onChange={(e) =>
                        setSaveForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe what this configuration shows or when to use it..."
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="makeDefault"
                      checked={saveForm.makeDefault}
                      onChange={(e) =>
                        setSaveForm((prev) => ({
                          ...prev,
                          makeDefault: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="makeDefault"
                      className="text-sm text-gray-700"
                    >
                      Mark as favorite
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveConfig}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </div>
          )}

          {/* Load Tab */}
          {activeTab === "load" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search configurations..."
                  className="pl-10"
                />
              </div>

              {/* Favorites Section */}
              {favoriteConfigs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Favorite Configurations
                  </h3>
                  <div className="grid gap-3">
                    {favoriteConfigs.map((config) => (
                      <ConfigCard
                        key={config.id}
                        config={config}
                        isFavorite={true}
                        onLoad={() => handleLoadConfig(config)}
                        onDelete={() => handleDeleteConfig(config.id)}
                        onExport={() => handleExportConfig(config)}
                        onToggleFavorite={() => toggleFavorite(config.id)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Configurations */}
              {otherConfigs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {favoriteConfigs.length > 0
                      ? "Other Configurations"
                      : "Saved Configurations"}
                  </h3>
                  <div className="grid gap-3">
                    {otherConfigs.map((config) => (
                      <ConfigCard
                        key={config.id}
                        config={config}
                        isFavorite={false}
                        onLoad={() => handleLoadConfig(config)}
                        onDelete={() => handleDeleteConfig(config.id)}
                        onExport={() => handleExportConfig(config)}
                        onToggleFavorite={() => toggleFavorite(config.id)}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(savedConfigs).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">
                    No saved configurations
                  </p>
                  <p className="text-sm">
                    Save your first configuration using the &quot;Save
                    Current&quot; tab
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Import/Export Tab */}
          {activeTab === "import" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Import Section */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Import Configuration
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Import a previously exported table configuration from a
                      JSON file.
                    </p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportConfig}
                        className="hidden"
                        id="config-import"
                      />
                      <label htmlFor="config-import" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                          Click to select JSON file
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          or drag and drop
                        </p>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Export All Section */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5 text-green-600" />
                      Export All Configurations
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Export all your saved configurations as a single JSON file
                      for backup or sharing.
                    </p>
                    <Button
                      onClick={() => {
                        const allConfigs = configManager.getSavedConfigs();
                        const dataStr = JSON.stringify(allConfigs, null, 2);
                        const dataUri =
                          "data:application/json;charset=utf-8," +
                          encodeURIComponent(dataStr);
                        const linkElement = document.createElement("a");
                        linkElement.setAttribute("href", dataUri);
                        linkElement.setAttribute(
                          "download",
                          "all-table-configurations.json"
                        );
                        linkElement.click();
                      }}
                      variant="outline"
                      className="w-full"
                      disabled={Object.keys(savedConfigs).length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export All ({Object.keys(savedConfigs).length})
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">
                  📋 Import/Export Instructions
                </h4>
                <ul className="text-amber-800 text-sm space-y-1">
                  <li>
                    • Exported configurations include all filters, sorting,
                    pivot settings, and column arrangements
                  </li>
                  <li>
                    • Import configurations from other team members or different
                    environments
                  </li>
                  <li>
                    • Configuration files are in JSON format and can be
                    version-controlled
                  </li>
                  <li>
                    • Individual configurations can be exported from the
                    &quot;Load Saved&quot; tab
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Custom Modal for alerts and confirmations */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
      />
    </Dialog>
  );
}

// Individual configuration card component
function ConfigCard({
  config,
  isFavorite,
  onLoad,
  onDelete,
  onExport,
  onToggleFavorite,
  formatDate,
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{config.name}</h4>
              <button
                onClick={onToggleFavorite}
                className="text-yellow-500 hover:text-yellow-600 transition-colors"
              >
                {isFavorite ? (
                  <Star className="w-4 h-4 fill-current" />
                ) : (
                  <StarOff className="w-4 h-4" />
                )}
              </button>
            </div>
            {config.description && (
              <p className="text-gray-600 text-sm mb-2">{config.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(config.timestamp)}
              </span>
              <Badge variant="secondary" className="text-xs">
                ID: {config.id.split("_")[1]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onLoad}
            className="bg-blue-600 hover:bg-blue-700 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Load
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onExport}
            className="text-xs"
          >
            <FileText className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


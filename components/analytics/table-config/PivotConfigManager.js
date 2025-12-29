"use client";

import React, { useState } from "react";
import { StandardConfigManager } from "./StandardConfigManager";
import { TableConfigDialog } from "./TableConfigDialog";

/**
 * Pivot Table Configuration Manager with Standardized UI
 * 
 * Wraps the StandardConfigManager and TableConfigDialog to provide
 * consistent UI for pivot table configuration management
 */
export function PivotConfigManager({
  configManager,
  gridRef,
  onConfigApplied,
  deleteConfig,
  loadConfig,
  saveConfig,
  getSavedConfigs,
  refreshTrigger,
  className = "",
  disabled = false,
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialTab, setInitialTab] = useState("save");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    setInitialTab("save");
    setIsDialogOpen(true);
  };

  const handleManageClick = () => {
    setInitialTab("load");
    setIsDialogOpen(true);
  };

  return (
    <>
      <StandardConfigManager
        onSaveClick={handleSaveClick}
        onManageClick={handleManageClick}
        className={className}
        disabled={disabled}
        saving={isSaving}
      />
      
      <TableConfigDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        configManager={configManager}
        gridRef={gridRef}
        onConfigApplied={onConfigApplied}
        deleteConfig={deleteConfig}
        loadConfig={loadConfig}
        saveConfig={saveConfig}
        getSavedConfigs={getSavedConfigs}
        refreshTrigger={refreshTrigger}
        initialTab={initialTab}
      />
    </>
  );
}

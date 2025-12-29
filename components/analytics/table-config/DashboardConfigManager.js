"use client";

import React, { useState } from "react";
import { StandardConfigManager } from "./StandardConfigManager";
import { DashboardConfigDialog } from "./DashboardConfigDialog";

/**
 * Dashboard Configuration Manager with Standardized UI
 * 
 * Wraps the StandardConfigManager and DashboardConfigDialog to provide
 * consistent UI for dashboard configuration management
 */
export function DashboardConfigManager({
  savedConfigs = [],
  onSaveConfig,
  onLoadConfig,
  onDeleteConfig,
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

  const handleSaveConfig = async (name, description) => {
    setIsSaving(true);
    try {
      const result = await onSaveConfig(name, description);
      return result;
    } finally {
      setIsSaving(false);
    }
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
      
      <DashboardConfigDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        configManager={null}
        savedConfigs={savedConfigs}
        onSaveConfig={handleSaveConfig}
        onLoadConfig={onLoadConfig}
        onDeleteConfig={onDeleteConfig}
        initialTab={initialTab}
      />
    </>
  );
}

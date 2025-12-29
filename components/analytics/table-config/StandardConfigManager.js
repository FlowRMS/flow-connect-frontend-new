"use client";

import React from "react";
import { Save, Settings } from "lucide-react";
import { Button } from "../ui/button";

/**
 * StandardConfigManager - Unified configuration management UI
 * 
 * Provides consistent "Save View" and "Manage Views" buttons positioned
 * in the top-right corner for all table types (dashboard, pivot, detail)
 * 
 * @param {Object} props
 * @param {Function} props.onSaveClick - Called when "Save View" is clicked
 * @param {Function} props.onManageClick - Called when "Manage Views" is clicked
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Disable both buttons
 * @param {boolean} props.saving - Show loading state on Save button
 */
export function StandardConfigManager({
  onSaveClick,
  onManageClick,
  className = "",
  disabled = false,
  saving = false,
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        size="sm"
        onClick={onSaveClick}
        disabled={disabled || saving}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Saving..." : "Save View"}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onManageClick}
        disabled={disabled}
        className="text-sm font-medium px-4 py-2"
      >
        <Settings className="w-4 h-4 mr-2" />
        Manage Views
      </Button>
    </div>
  );
}

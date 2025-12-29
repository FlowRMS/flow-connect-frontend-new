"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Save,
  Settings,
  Download,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function TableConfigToolbar({
  onSaveConfig,
  onOpenConfigDialog,
  hasUnsavedChanges,
  autoSaveEnabled,
  toggleAutoSave,
  getSavedConfigs,
  loadConfig,
  lastSavedConfig,
  refreshTrigger, // New prop to trigger refresh when configs change
}) {
  const [isQuickSaveOpen, setIsQuickSaveOpen] = useState(false);
  const [quickSaveName, setQuickSaveName] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [recentConfigs, setRecentConfigs] = useState([]);

  // Function to refresh the configs list
  const refreshRecentConfigs = () => {
    const savedConfigs = getSavedConfigs();
    const configs = Object.values(savedConfigs)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    setRecentConfigs(configs);
  };

  useEffect(() => {
    setIsClient(true);
    refreshRecentConfigs();
  }, [getSavedConfigs]);

  // Refresh when refreshTrigger changes (e.g., after delete)
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      refreshRecentConfigs();
    }
  }, [refreshTrigger]);

  const handleQuickSave = async () => {
    if (!quickSaveName.trim()) {
      const timestamp = new Date().toLocaleString();
      setQuickSaveName(`Quick Save - ${timestamp}`);
      return;
    }

    try {
      const maybePromise = onSaveConfig?.(quickSaveName.trim());
      const configId =
        maybePromise instanceof Promise ? await maybePromise : maybePromise;

      if (configId) {
        setQuickSaveName("");
        setIsQuickSaveOpen(false);
        const savedConfigs = getSavedConfigs();
        const configs = Object.values(savedConfigs)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);
        setRecentConfigs(configs);
      }
    } catch (error) {
      console.error("Quick save failed:", error);
    }
  };

  const formatRelativeTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Unsaved</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Saved</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAutoSave}
          className={`text-xs px-2 py-1 rounded-md transition-colors ${
            autoSaveEnabled
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Clock className="w-3 h-3 inline mr-1" />
          Auto-save {autoSaveEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="h-4 w-px bg-gray-300" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="text-xs">
            <Download className="w-3 h-3 mr-1" />
            Recent ({recentConfigs.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
            Recent Configurations
          </div>
          {recentConfigs.length > 0 ? (
            <>
              {recentConfigs.map((config, index) => (
                <DropdownMenuItem
                  key={config.id}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onSelect={async () => {
                    console.log("[TableConfigToolbar] Loading config from Recent:", config.id, config.name);
                    const success = await loadConfig(config.id);
                    console.log("[TableConfigToolbar] loadConfig returned:", success);
                    if (success) {
                      alert("Configuration applied successfully!");
                    } else {
                      alert("Error applying configuration");
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {config.name}
                      </span>
                      {index === 0 && (
                        <Star className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isClient ? formatRelativeTime(config.timestamp) : new Date(config.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-center text-xs text-blue-600 py-2"
                onClick={onOpenConfigDialog}
              >
                View all configurations
              </DropdownMenuItem>
            </>
          ) : (
            <div className="p-6 text-center text-xs text-gray-500">
              No saved configurations
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Config Manager */}
      <Button
        size="sm"
        onClick={onOpenConfigDialog}
        className="text-xs bg-blue-600 hover:bg-blue-700"
      >
        <Settings className="w-3 h-3 mr-1" />
        Manage
      </Button>

      {/* Last saved info */}
      {lastSavedConfig && (
        <div className="text-xs text-gray-500 ml-auto">
          Last saved:{" "}
          <span className="font-medium">{lastSavedConfig.name}</span>
        </div>
      )}
    </div>
  );
}

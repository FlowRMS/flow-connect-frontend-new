/**
 * Configuration Export/Import Utilities
 * Handles formatting and validation of table configurations for sharing
 */

/**
 * Export configuration with metadata for sharing
 */
export function exportConfigForSharing(config, userInfo = {}) {
  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    exportedBy: userInfo.name || "Unknown User",
    tableType: "orders-pivot",
    configuration: {
      ...config,
      // Remove sensitive or user-specific data
      id: undefined,
      timestamp: undefined,
    },
    metadata: {
      description: config.description || "",
      tags: extractConfigTags(config),
      compatibility: checkCompatibility(config),
    },
  };
}

/**
 * Import and validate shared configuration
 */
export function importSharedConfig(exportedData) {
  try {
    // Validate structure
    if (!exportedData.configuration || !exportedData.version) {
      throw new Error("Invalid configuration file structure");
    }

    // Version compatibility check
    if (!isVersionCompatible(exportedData.version)) {
      console.warn("Configuration version may not be fully compatible");
    }

    // Clean and prepare configuration
    const config = {
      ...exportedData.configuration,
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      name: `${exportedData.configuration.name || "Imported Config"}`,
      description: `${
        exportedData.configuration.description || ""
      }\n\nImported from: ${exportedData.exportedBy} on ${new Date(
        exportedData.exportedAt
      ).toLocaleString()}`,
    };

    return {
      success: true,
      config,
      metadata: exportedData.metadata,
      warnings: validateConfigurationData(config),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Extract meaningful tags from configuration for categorization
 */
function extractConfigTags(config) {
  const tags = [];

  // Check for pivot usage
  if (
    config.pivot &&
    (config.pivot.rows?.length > 0 || config.pivot.columns?.length > 0)
  ) {
    tags.push("pivot");
  }

  // Check for filters
  if (config.filters && Object.keys(config.filters).length > 0) {
    tags.push("filtered");
  }

  // Check for sorting
  if (config.sorting && config.sorting.length > 0) {
    tags.push("sorted");
  }

  // Check for custom columns
  if (
    config.columns &&
    config.columns.some((col) => col.hidden || col.size !== col.defaultSize)
  ) {
    tags.push("custom-layout");
  }

  return tags;
}

/**
 * Check configuration compatibility with current system
 */
function checkCompatibility(config) {
  const compatibility = {
    level: "full", // full, partial, limited
    warnings: [],
    requiredFeatures: [],
  };

  // Check for advanced features
  if (config.pivot) {
    compatibility.requiredFeatures.push("pivot-tables");
  }

  if (config.filters) {
    compatibility.requiredFeatures.push("advanced-filtering");
  }

  // Add version-specific checks here as the system evolves

  return compatibility;
}

/**
 * Check if exported version is compatible with current system
 */
function isVersionCompatible(version) {
  const currentVersion = "1.0.0";
  const [major] = version.split(".").map(Number);
  const [currentMajor] = currentVersion.split(".").map(Number);

  // Same major version should be compatible
  return major === currentMajor;
}

/**
 * Validate configuration data and return warnings
 */
function validateConfigurationData(config) {
  const warnings = [];

  // Check for missing required fields
  if (!config.columns || config.columns.length === 0) {
    warnings.push("No column configuration found");
  }

  // Check for invalid column references
  if (config.columns) {
    const invalidColumns = config.columns.filter(
      (col) => !col.prop || !col.name
    );
    if (invalidColumns.length > 0) {
      warnings.push(`${invalidColumns.length} invalid column(s) detected`);
    }
  }

  // Check pivot configuration
  if (config.pivot) {
    if (config.pivot.rows && !Array.isArray(config.pivot.rows)) {
      warnings.push("Invalid pivot rows configuration");
    }
    if (config.pivot.columns && !Array.isArray(config.pivot.columns)) {
      warnings.push("Invalid pivot columns configuration");
    }
  }

  return warnings;
}

/**
 * Generate a shareable link for configuration (when backend is available)
 */
export function generateShareableLink(
  configId,
  baseUrl = window.location.origin
) {
  return `${baseUrl}/shared-config/${configId}`;
}

/**
 * Create a QR code for easy sharing (requires qr-code library)
 */
export async function generateQRCode(configId) {
  try {
    // This would require installing and importing a QR code library
    // const QRCode = require('qrcode');
    // const link = generateShareableLink(configId);
    // return await QRCode.toDataURL(link);

    // Placeholder for now
    return generateShareableLink(configId);
  } catch (error) {
    console.error("Error generating QR code:", error);
    return null;
  }
}

/**
 * Format configuration summary for display
 */
export function formatConfigSummary(config) {
  const summary = {
    name: config.name || "Untitled Configuration",
    description: config.description || "No description provided",
    lastModified: config.timestamp
      ? new Date(config.timestamp).toLocaleString()
      : "Unknown",
    features: [],
    stats: {},
  };

  // Analyze configuration features
  if (config.columns) {
    summary.stats.columns = config.columns.length;
    summary.stats.hiddenColumns = config.columns.filter(
      (col) => col.hidden
    ).length;
  }

  if (config.filters && Object.keys(config.filters).length > 0) {
    summary.features.push(`${Object.keys(config.filters).length} filter(s)`);
    summary.stats.filters = Object.keys(config.filters).length;
  }

  if (config.sorting && config.sorting.length > 0) {
    summary.features.push(`${config.sorting.length} sort rule(s)`);
    summary.stats.sortRules = config.sorting.length;
  }

  if (config.pivot) {
    const pivotRows = config.pivot.rows?.length || 0;
    const pivotCols = config.pivot.columns?.length || 0;
    const pivotValues = config.pivot.values?.length || 0;

    if (pivotRows + pivotCols + pivotValues > 0) {
      summary.features.push(
        `Pivot: ${pivotRows}R, ${pivotCols}C, ${pivotValues}V`
      );
      summary.stats.pivot = {
        rows: pivotRows,
        columns: pivotCols,
        values: pivotValues,
      };
    }
  }

  return summary;
}

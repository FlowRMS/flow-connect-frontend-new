/**
 * Table Configuration Manager
 * Handles saving, loading, and managing table configurations in localStorage
 * Designed to be easily extensible to backend storage in the future
 */

class TableConfigManager {
  constructor(tableId = "default") {
    this.tableId = tableId;
    this.storageKey = `table_config_${tableId}`;
    this.savedConfigsKey = `saved_configs_${tableId}`;
  }

  /**
   * Get the current configuration from the grid
   * @param {Object} gridRef - Reference to the RevoGrid instance
   * @param {Object} additionalState - Additional state like advanced filters, date ranges
   * @returns {Object} Current table configuration
   */
  async getCurrentConfig(gridRef, additionalState = {}) {
    if (!gridRef?.current) return null;

    try {
      const grid = gridRef.current;

      // Extract various configuration aspects
      const config = {
        id: this.generateConfigId(),
        timestamp: Date.now(),
        name: "", // Will be set by user
        description: "", // Will be set by user

        // Column configurations
        columns: this.extractColumnConfig(grid),

        // Sorting configuration
        sorting: this.extractSortConfig(grid),

        // Filter configuration
        filters: this.extractFilterConfig(grid),

        // Advanced filters (passed from component state)
        advancedFilters: additionalState.advancedFilters || {},

        // Date range filters
        dateRange: additionalState.dateRange || {},

        // Pivot configuration (if pivot is active)
        pivot: await this.extractPivotConfig(grid),

        // Grid display settings
        display: this.extractDisplayConfig(grid),

        // Selection and grouping
        selection: this.extractSelectionConfig(grid),

        // Dashboard-specific settings
        dashboard: additionalState.dashboard || {},

        // Table-specific sorting (for dashboard comparison tables)
        tableSorting: additionalState.tableSorting || {},
        
        // Pivot sorting (for pivot tables)
        pivotSorting: additionalState.sorting || [],
      };
      
      console.log("[TableConfigManager] getCurrentConfig - advancedFilters:", config.advancedFilters);
      console.log("[TableConfigManager] getCurrentConfig - dateRange:", config.dateRange);
      console.log("[TableConfigManager] getCurrentConfig - tableSorting:", config.tableSorting);
      console.log("[TableConfigManager] getCurrentConfig - pivotSorting:", config.pivotSorting);
      
      return config;
    } catch (error) {
      console.error("Error extracting table configuration:", error);
      return null;
    }
  }

  /**
   * Apply a configuration to the grid
   * @param {Object} config - Configuration to apply
   * @param {Object} gridRef - Reference to the RevoGrid instance
   * @param {Function} setters - Object containing state setters
   */
  async applyConfig(config, gridRef, setters = {}) {
    console.log("[TableConfigManager] Starting applyConfig");
    console.log("[TableConfigManager] Config:", config);
    console.log("[TableConfigManager] GridRef:", gridRef);
    console.log("[TableConfigManager] GridRef.current:", gridRef?.current);

    if (!config) {
      console.error("[TableConfigManager] No config provided");
      return false;
    }

    if (!gridRef?.current) {
      console.error("[TableConfigManager] No gridRef.current available");
      return false;
    }

    try {
      const grid = gridRef.current;
      console.log("[TableConfigManager] Grid element:", grid);
      console.log("[TableConfigManager] Grid methods:", Object.keys(grid));

      // Apply configurations in order
      // IMPORTANT: Apply columns FIRST, which includes their positions and sort states
      if (config.columns) {
        console.log("[TableConfigManager] Applying columns config");
        await this.applyColumnConfig(config.columns, grid, setters);
      }

      // Apply sorting if it's separate from columns (some grids may need this)
      // This will reinforce the sort if it wasn't properly applied through columns
      if (config.sorting) {
        console.log("[TableConfigManager] Applying sorting config");
        await this.applySortConfig(config.sorting, grid);
      }

      if (config.filters) {
        console.log("[TableConfigManager] Applying filters config");
        await this.applyFilterConfig(config.filters, grid);
      }

      // Apply advanced filters through setters
      if (config.advancedFilters !== undefined && setters.setAdvancedFilters) {
        console.log("[TableConfigManager] Applying advanced filters:", config.advancedFilters);
        console.log("[TableConfigManager] setAdvancedFilters exists:", typeof setters.setAdvancedFilters);
        setters.setAdvancedFilters(config.advancedFilters);
      } else {
        console.log("[TableConfigManager] NOT applying advanced filters:", {
          hasAdvancedFilters: config.advancedFilters !== undefined,
          hasFilterCount: Object.keys(config.advancedFilters || {}).length,
          hasSetter: !!setters.setAdvancedFilters
        });
      }

      // Apply date range through setters
      if (config.dateRange !== undefined && setters.setDateRange) {
        console.log("[TableConfigManager] Applying date range:", config.dateRange);
        setters.setDateRange(config.dateRange);
      }

      if (config.pivot) {
        console.log("[TableConfigManager] Applying pivot config");
        await this.applyPivotConfig(config.pivot, grid, setters);
      }

      if (config.display) {
        console.log("[TableConfigManager] Applying display config");
        await this.applyDisplayConfig(config.display, grid, setters);
      }

      if (config.selection) {
        console.log("[TableConfigManager] Applying selection config");
        await this.applySelectionConfig(config.selection, grid);
      }

      // Apply dashboard-specific settings
      if (config.dashboard && setters.setDashboardState) {
        console.log("[TableConfigManager] Applying dashboard config");
        setters.setDashboardState(config.dashboard);
      }

      // Apply table sorting configurations
      if (config.tableSorting && setters.setTableSorting) {
        console.log("[TableConfigManager] Applying table sorting config:", config.tableSorting);
        setters.setTableSorting(config.tableSorting);
      }
      
      // Apply pivot sorting configurations
      if (config.pivotSorting !== undefined && setters.setSorting) {
        console.log("[TableConfigManager] Applying pivot sorting config:", config.pivotSorting);
        setters.setSorting(config.pivotSorting);
      }

      console.log("[TableConfigManager] Configuration applied successfully");
      return true;
    } catch (error) {
      console.error("[TableConfigManager] Error applying table configuration:", error);
      return false;
    }
  }

  /**
   * Save configuration to localStorage
   * @param {Object} config - Configuration to save
   * @param {string} name - Name for the configuration
   * @param {string} description - Description for the configuration
   */
  saveConfig(config, name, description = "") {
    if (typeof window === 'undefined') return null;
    try {
      const configToSave = {
        ...config,
        name,
        description,
        id: config.id || this.generateConfigId(),
        timestamp: Date.now(),
      };

      const savedConfigs = this.getSavedConfigs();
      savedConfigs[configToSave.id] = configToSave;

      localStorage.setItem(this.savedConfigsKey, JSON.stringify(savedConfigs));

      // Also save as current config
      localStorage.setItem(this.storageKey, JSON.stringify(configToSave));

      return configToSave.id;
    } catch (error) {
      console.error("Error saving configuration:", error);
      return null;
    }
  }

  /**
   * Load configuration from localStorage
   * @param {string} configId - ID of configuration to load
   * @param {boolean} updateTimestamp - Whether to update the timestamp to mark as recently used
   */
  loadConfig(configId, updateTimestamp = true) {
    try {
      const savedConfigs = this.getSavedConfigs();
      const config = savedConfigs[configId];

      if (!config) return null;

      // Update timestamp to mark as recently used
      if (updateTimestamp) {
        config.timestamp = Date.now();
        savedConfigs[configId] = config;
        localStorage.setItem(this.savedConfigsKey, JSON.stringify(savedConfigs));
      }

      return config;
    } catch (error) {
      console.error("Error loading configuration:", error);
      return null;
    }
  }

  /**
   * Get all saved configurations
   * @returns {Object} Object containing all saved configurations
   */
  getSavedConfigs() {
    // Check if running in browser environment
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(this.savedConfigsKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error getting saved configurations:", error);
      return {};
    }
  }

  /**
   * Delete a saved configuration
   * @param {string} configId - ID of configuration to delete
   */
  deleteConfig(configId) {
    if (typeof window === 'undefined') return false;
    try {
      const savedConfigs = this.getSavedConfigs();
      delete savedConfigs[configId];
      localStorage.setItem(this.savedConfigsKey, JSON.stringify(savedConfigs));
      return true;
    } catch (error) {
      console.error("Error deleting configuration:", error);
      return false;
    }
  }

  /**
   * Get the last saved configuration
   */
  getLastConfig() {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error getting last configuration:", error);
      return null;
    }
  }

  /**
   * Auto-save current configuration
   */
  async autoSave(gridRef, additionalState = {}) {
    if (typeof window === 'undefined') return;
    const config = await this.getCurrentConfig(gridRef, additionalState);
    if (config) {
      localStorage.setItem(this.storageKey, JSON.stringify(config));
    }
  }

  // Private helper methods

  generateConfigId() {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractColumnConfig(grid) {
    try {
      // Get column definitions and their current state
      const columns = grid.getColumns?.() || [];
      return columns.map((col, index) => ({
        prop: col.prop,
        name: col.name,
        size: col.size,
        hidden: col.hidden || false,
        order: index, // Store the current position/order of the column
        columnType: col.columnType,
        sortable: col.sortable,
        filter: col.filter,
        pin: col.pin, // Store pin state (left/right)
        // Store the sort order if this column is currently sorted
        sortOrder: col.sortOrder || null, // 'asc', 'desc', or null
      }));
    } catch (error) {
      console.warn("Could not extract column config:", error);
      return [];
    }
  }

  extractSortConfig(grid) {
    try {
      // Try to extract current sorting state from the grid
      const sortingState = grid.getSortingState?.() || [];
      
      // If we have sorting state from the grid API, use it
      if (sortingState.length > 0) {
        return sortingState;
      }
      
      // Fallback: Try to get sorting from columns if available
      if (grid.getColumns) {
        const columns = grid.getColumns();
        const sortedColumns = columns
          .filter(col => col.sortOrder !== undefined && col.sortOrder !== null && col.sortOrder !== '')
          .map(col => ({
            prop: col.prop,
            order: col.sortOrder, // 'asc' or 'desc'
          }));
        
        if (sortedColumns.length > 0) {
          console.log("[TableConfigManager] Extracted sort config from columns:", sortedColumns);
          return sortedColumns;
        }
      }
      
      // No sorting found
      return [];
    } catch (error) {
      console.warn("Could not extract sort config:", error);
      return [];
    }
  }

  extractFilterConfig(grid) {
    try {
      // Extract current filter state
      return grid.getFilterState?.() || {};
    } catch (error) {
      console.warn("Could not extract filter config:", error);
      return {};
    }
  }

  async extractPivotConfig(grid) {
    try {
      // Try to get pivot config from custom method first
      if (grid.getPivotConfig && typeof grid.getPivotConfig === 'function') {
        const pivotConfig = await grid.getPivotConfig();
        console.log("[TableConfigManager] Extracted pivot config:", pivotConfig);
        return pivotConfig;
      }

      // Fallback to getPivotState
      const pivotState = grid.getPivotState?.();
      return pivotState || null;
    } catch (error) {
      console.warn("Could not extract pivot config:", error);
      return null;
    }
  }

  extractDisplayConfig(grid) {
    try {
      return {
        theme: grid.theme || "compact",
        rowHeight: grid.rowHeight || 42,
        colSize: grid.colSize || 140,
        autoSizeColumn: grid.autoSizeColumn || false,
      };
    } catch (error) {
      console.warn("Could not extract display config:", error);
      return {};
    }
  }

  extractSelectionConfig(grid) {
    try {
      return {
        selectedRows: grid.getSelectedRows?.() || [],
        selectedCells: grid.getSelectedCells?.() || [],
      };
    } catch (error) {
      console.warn("Could not extract selection config:", error);
      return {};
    }
  }

  // Apply methods
  async applyColumnConfig(columnConfig, grid, setters) {
    if (columnConfig && columnConfig.length > 0) {
      console.log("[TableConfigManager] Applying column config with sort info:", columnConfig);
      
      // Sort columns by their 'order' property to restore column positions
      const sortedColumns = [...columnConfig].sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Reconstruct the columns with all their properties
      const columnsToApply = sortedColumns.map(col => ({
        prop: col.prop,
        name: col.name,
        size: col.size,
        hidden: col.hidden,
        columnType: col.columnType,
        sortable: col.sortable,
        filter: col.filter,
        pin: col.pin,
        // Apply sort order if it exists
        sortOrder: col.sortOrder || undefined,
      }));
      
      console.log("[TableConfigManager] Columns to apply:", columnsToApply);
      
      // Apply column configuration
      grid.setColumns?.(columnsToApply);
    }
  }

  async applySortConfig(sortConfig, grid) {
    if (!sortConfig || sortConfig.length === 0) {
      console.log("[TableConfigManager] No sort config to apply");
      return;
    }
    
    console.log("[TableConfigManager] Applying sort config:", sortConfig);
    
    try {
      // Method 1: Try to apply using setSortingState (for grids that support it)
      if (grid.setSortingState && typeof grid.setSortingState === 'function') {
        console.log("[TableConfigManager] Using setSortingState");
        grid.setSortingState(sortConfig);
        return;
      }
      
      // Method 2: Apply sorting through columns by updating sortOrder property
      if (grid.getColumns && grid.setColumns) {
        console.log("[TableConfigManager] Applying sort through columns");
        const columns = grid.getColumns();
        
        // Create a map of prop to sort order for quick lookup
        const sortMap = {};
        sortConfig.forEach(sort => {
          sortMap[sort.prop] = sort.order;
        });
        
        // Update columns with sort information
        const updatedColumns = columns.map(col => {
          const sortOrder = sortMap[col.prop];
          if (sortOrder) {
            console.log(`[TableConfigManager] Setting sort ${sortOrder} on column ${col.prop}`);
            return { ...col, sortOrder };
          }
          // Clear sort order for columns not in the sort config
          return { ...col, sortOrder: undefined };
        });
        
        grid.setColumns(updatedColumns);
        
        // Wait for the grid to process the update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("[TableConfigManager] Error applying sort config:", error);
    }
  }

  async applyFilterConfig(filterConfig, grid) {
    if (filterConfig && Object.keys(filterConfig).length > 0) {
      grid.setFilterState?.(filterConfig);
    }
  }

  async applyPivotConfig(pivotConfig, grid, setters) {
    if (!pivotConfig) {
      console.warn("[TableConfigManager] No pivot config provided");
      return;
    }

    console.log("[TableConfigManager] Applying pivot config:", JSON.stringify(pivotConfig, null, 2));

    // Helper function to normalize field data
    const normalizeFields = (fields) => {
      if (!Array.isArray(fields)) return [];
      return fields.map(field => {
        // If it's already a string (field name), return it
        if (typeof field === 'string') return field;
        // If it's an object, extract the prop field
        if (field && typeof field === 'object') return field.prop;
        return null;
      }).filter(Boolean); // Remove nulls
    };

    // Group fields by their dimension if they have one
    let rows = [];
    let columns = [];
    let values = [];

    // Process all arrays and group by dimension
    const allFields = [
      ...(pivotConfig.rows || []),
      ...(pivotConfig.columns || []),
      ...(pivotConfig.values || [])
    ];

    allFields.forEach(field => {
      if (typeof field === 'object' && field.dimension) {
        const prop = field.prop;
        if (field.dimension === 'rows') {
          rows.push(prop);
        } else if (field.dimension === 'columns') {
          columns.push(prop);
        } else if (field.dimension === 'values') {
          values.push(prop);
        }
      } else {
        // No dimension info, use original location
        const normalized = typeof field === 'string' ? field : field?.prop;
        if (normalized && pivotConfig.rows?.includes(field)) {
          rows.push(normalized);
        } else if (normalized && pivotConfig.columns?.includes(field)) {
          columns.push(normalized);
        } else if (normalized && pivotConfig.values?.includes(field)) {
          values.push(normalized);
        }
      }
    });

    // If no fields were grouped by dimension, fall back to normalizing arrays directly
    if (rows.length === 0 && columns.length === 0 && values.length === 0) {
      rows = normalizeFields(pivotConfig.rows);
      columns = normalizeFields(pivotConfig.columns);
      values = normalizeFields(pivotConfig.values);
    }

    // CRITICAL FIX: Normalize values array to ensure all entries have aggregators
    // Values MUST be objects with aggregators for the pivot plugin to work
    if (values.length > 0) {
      values = values.map(value => {
        if (typeof value === 'string') {
          // String value needs to be converted to object with aggregator
          console.log("[TableConfigManager] Converting string value to object with aggregator:", value);
          return { prop: value, aggregator: 'sum' };
        } else if (value && typeof value === 'object' && value.prop) {
          // Ensure aggregator exists
          if (!value.aggregator) {
            console.log("[TableConfigManager] Adding missing aggregator for:", value.prop);
            return { ...value, aggregator: 'sum' };
          }
          return value;
        }
        // Invalid value, skip it
        console.warn("[TableConfigManager] Skipping invalid value:", value);
        return null;
      }).filter(Boolean); // Remove nulls
    }

    const corePivotState = { rows, columns, values };

    console.log("[TableConfigManager] Core pivot state to apply:", JSON.stringify(corePivotState, null, 2));

    // Try custom setPivotConfig method first
    if (grid.setPivotConfig && typeof grid.setPivotConfig === 'function') {
      console.log("[TableConfigManager] Calling grid.setPivotConfig()");
      const success = grid.setPivotConfig(corePivotState);
      console.log("[TableConfigManager] setPivotConfig result:", success);

      // Wait a bit for the grid to update
      await new Promise(resolve => setTimeout(resolve, 200));
      return;
    }

    // Fallback to setPivotState
    if (grid.setPivotState && typeof grid.setPivotState === 'function') {
      console.log("[TableConfigManager] Calling grid.setPivotState()");
      grid.setPivotState(corePivotState);

      // Wait a bit for the grid to update
      await new Promise(resolve => setTimeout(resolve, 200));
      return;
    }

    // Last fallback: use setters if provided
    if (setters.setPivotConfig) {
      console.log("[TableConfigManager] Using setters.setPivotConfig()");
      setters.setPivotConfig(corePivotState);
    }

    console.warn("[TableConfigManager] No method found to apply pivot config");
  }

  async applyDisplayConfig(displayConfig, grid, setters) {
    if (displayConfig) {
      if (setters.setGridDimensions && displayConfig.rowHeight) {
        // Apply display settings through setters if available
      }
    }
  }

  async applySelectionConfig(selectionConfig, grid) {
    if (selectionConfig) {
      if (selectionConfig.selectedRows) {
        grid.setSelectedRows?.(selectionConfig.selectedRows);
      }
    }
  }

  /**
   * Export configuration as JSON for backend storage
   */
  exportConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error importing configuration:", error);
      return null;
    }
  }

  /**
   * Validate configuration structure
   */
  validateConfig(config) {
    if (!config || typeof config !== "object") return false;

    // Basic structure validation
    const requiredFields = ["id", "timestamp"];
    return requiredFields.every((field) => config.hasOwnProperty(field));
  }

  /**
   * Get all saved configurations across all tables
   * @returns {Object} Object containing all configs grouped by table
   */
  static getAllConfigs() {
    if (typeof window === 'undefined') return {};
    
    try {
      const allConfigs = {};
      
      // Get all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Only process saved_configs keys
        if (key && key.startsWith('saved_configs_')) {
          const tableId = key.replace('saved_configs_', '');
          const configsJson = localStorage.getItem(key);
          
          if (configsJson) {
            try {
              const configs = JSON.parse(configsJson);
              allConfigs[tableId] = {
                tableId,
                configs: Object.values(configs),
              };
            } catch (err) {
              console.warn(`Failed to parse configs for ${tableId}:`, err);
            }
          }
        }
      }
      
      return allConfigs;
    } catch (error) {
      console.error("Error getting all configurations:", error);
      return {};
    }
  }

  /**
   * Delete a configuration from any table
   * @param {string} tableId - ID of the table
   * @param {string} configId - ID of configuration to delete
   */
  static deleteConfigFromTable(tableId, configId) {
    if (typeof window === 'undefined') return false;
    
    try {
      const savedConfigsKey = `saved_configs_${tableId}`;
      const savedConfigs = JSON.parse(localStorage.getItem(savedConfigsKey) || '{}');
      
      delete savedConfigs[configId];
      localStorage.setItem(savedConfigsKey, JSON.stringify(savedConfigs));
      
      return true;
    } catch (error) {
      console.error("Error deleting configuration:", error);
      return false;
    }
  }
}

export default TableConfigManager;

// Export singleton instance for orders-pivot table
export const ordersPivotConfigManager = new TableConfigManager("orders-pivot");

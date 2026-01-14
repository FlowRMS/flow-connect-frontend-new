/**
 * ID Column Hyperlink Utility for RevoGrid
 * 
 * Automatically converts ID columns in detail reports to clickable hyperlinks
 * that open in FlowRMS application
 */

// Base URL for FlowRMS entity links - uses current origin in browser
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Mapping of entity types to their URL paths in FlowRMS
 */
export const ENTITY_PATH_MAP = {
  ORDER: "cm/orders",
  QUOTE: "crm/quotes",
  INVOICE: "cm/orders", // Invoices use orders path with query param
  CHECK: "cm/commissions",
  EXPENSE: "cm/expenses",
  CREDIT: "cm/adjust",
  CUSTOMER: "core/customers",
  PRODUCT: "core/products",
  FACTORY: "core/factories",
  OPPORTUNITY: "crm/pre-opportunities",
  JOB: "crm/jobs",
  USER: "crm/users",
  SALES_REP: "crm/users",
};

/**
 * Extracts entity type from column property name
 * @param {string} prop - Column property name (e.g., "order_id", "orderId", "quoteId")
 * @returns {string|null} - Entity type or null if not an ID column
 */
export function getEntityTypeFromProp(prop) {
  if (!prop || typeof prop !== "string") return null;
  
  const normalized = prop.toLowerCase().replace(/_/g, "");
  
  // Map of pattern to entity type
  const patterns = {
    orderid: "ORDER",
    quoteid: "QUOTE",
    invoiceid: "INVOICE",
    checkid: "CHECK",
    expenseid: "EXPENSE",
    creditid: "CREDIT",
    customerid: "CUSTOMER",
    productid: "PRODUCT",
    factoryid: "FACTORY",
    opportunityid: "OPPORTUNITY",
    jobid: "JOB",
    userid: "USER",
    salesrepid: "SALES_REP",
  };
  
  for (const [pattern, entityType] of Object.entries(patterns)) {
    if (normalized.includes(pattern)) {
      return entityType;
    }
  }
  
  return null;
}

/**
 * Checks if a column should be converted to a hyperlink
 * @param {object} column - Column definition
 * @returns {boolean}
 */
export function isIdColumn(column) {
  if (!column || !column.prop) return false;
  return getEntityTypeFromProp(column.prop) !== null;
}

/**
 * Gets the order_id field name from the row (handles different naming conventions)
 * @param {object} row - Data row
 * @returns {string|null} - Order ID value or null
 */
function getOrderIdFromRow(row) {
  // Try different naming conventions
  const orderId = row.order_id || row.orderId || row.ORDER_ID;
  if (!orderId) {
    console.warn(
      "[idColumnLinks] Could not find order_id in row. Invoice links may fail. Row:",
      row
    );
    return null;
  }
  return orderId;
}

/**
 * Constructs the FlowRMS URL for a given entity type and ID
 * @param {string} entityType - Entity type (e.g., "ORDER", "QUOTE")
 * @param {string|number} id - Entity ID
 * @param {object} row - Full row data (needed for entities that require additional IDs)
 * @returns {string|null} - Full URL or null if cannot be constructed
 */
export function buildEntityUrl(entityType, id, row = {}) {
  const path = ENTITY_PATH_MAP[entityType];
  if (!path) return null;

  // Special handling for INVOICE - needs order_id
  if (entityType === "INVOICE") {
    const orderId = getOrderIdFromRow(row);
    if (!orderId) {
      // Can't build invoice URL without order_id
      console.warn(
        `[idColumnLinks] Missing order_id for invoiceId=${id}. Row data:`,
        row
      );
      return null;
    }
    return `${BASE_URL}/${path}/list/${orderId}?invoiceId=${id}`;
  }

  // Default URL pattern for other entities
  return `${BASE_URL}/${path}/list/${id}`;
}

/**
 * Creates a cell template function for ID columns
 * Returns an anchor tag that opens in a new tab
 * @param {string} entityType - Entity type
 * @returns {function} - Cell template function for RevoGrid
 */
export function createIdCellTemplate(entityType) {
  return (h, { value, model }) => {
    if (!value || value === "N/A" || value === "") {
      return h("span", { class: "text-gray-400" }, value || "—");
    }
    
    // Pass the full row (model) to buildEntityUrl for entities that need additional data
    const url = buildEntityUrl(entityType, value, model);
    if (!url) {
      // If we can't build URL (e.g., missing order_id for invoice), just show value
      return h("span", {}, value);
    }
    
    return h(
      "a",
      {
        href: url,
        target: "_blank",
        rel: "noopener noreferrer",
        class: "text-blue-600 hover:text-blue-800 hover:underline font-medium",
        style: {
          display: "inline-block",
          padding: "0",
        },
        onClick: (e) => {
          e.stopPropagation(); // Prevent row selection
        },
      },
      value
    );
  };
}

/**
 * Enhances column definitions with ID hyperlinks
 * Automatically detects ID columns and adds cell templates
 * @param {Array} columns - Array of column definitions
 * @returns {Array} - Enhanced column definitions
 */
export function enhanceColumnsWithIdLinks(columns) {
  if (!Array.isArray(columns)) return columns;
  
  return columns.map((col) => {
    if (!col || !col.prop) return col;
    
    const entityType = getEntityTypeFromProp(col.prop);
    if (!entityType) return col;
    
    // If column already has a cellTemplate, don't override it
    if (col.cellTemplate) return col;
    
    return {
      ...col,
      cellTemplate: createIdCellTemplate(entityType),
    };
  });
}

/**
 * Processes transformed data rows to ensure ID values are clean
 * Removes "N/A" or empty strings from ID fields
 * @param {Array} rows - Data rows
 * @param {Array} columns - Column definitions
 * @returns {Array} - Processed rows
 */
export function processIdFields(rows, columns) {
  if (!Array.isArray(rows) || !Array.isArray(columns)) return rows;
  
  const idProps = columns
    .filter((col) => isIdColumn(col))
    .map((col) => col.prop);
  
  if (idProps.length === 0) return rows;
  
  return rows.map((row) => {
    const processedRow = { ...row };
    idProps.forEach((prop) => {
      const value = processedRow[prop];
      if (value === "N/A" || value === "" || value === null || value === undefined) {
        processedRow[prop] = "";
      }
    });
    return processedRow;
  });
}
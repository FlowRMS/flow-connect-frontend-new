export type Extracted = {
  details?: Record<string, unknown>[];
  factory?: Record<string, unknown> | null;
  sold_to_customer?: Record<string, unknown> | null;
  bill_to_customer?: Record<string, unknown> | null;
  end_user?: Record<string, unknown> | null;
  [k: string]: unknown;
};

export type PrimaryField = {
  key: string;
  value: string;
  sourcePath?: string;
  nested?: { key: string; value: string; sourcePath?: string }[];
};

export type OtherField = {
  key: string;
  value: string;
  sourcePath: string;
};

export type LineItem = Record<string, unknown> & {
  __sourcePaths?: Record<string, string>;
};
export const LINE_ITEM_SOURCE_MAP_KEY = '__sourcePaths';

export type EntityType = "ORDERS" | "QUOTES" | "INVOICES" | "CHECKS" | "ORDER_ACKNOWLEDGEMENTS" | "DELIVERIES";

// Primary keys mapping for ORDERS entity type (default)
export const PRIMARY_KEYS_ORDERS: Record<string, string> = {
  "Order Type": "order_type",
  "Order #": "order_number",
  "Order Date": "order_date",
  "Ship Date": "ship_date",
  "Due Date": "due_date",
  "Job Name": "job_name",
  "Mark #": "mark_number",
  "Shipping Terms": "shipping_terms",
  "Payment Terms": "payment_terms",
  "Sold To Customer": "sold_to_customer",
  "Bill To Customer": "bill_to_customer",
  Factory: "factory",
};

// Primary keys mapping for QUOTES entity type
export const PRIMARY_KEYS_QUOTES: Record<string, string> = {
  "Job Name": "job_name",
  "Quote Date": "quote_date",
  "Mark #": "mark_number",
  "Quote #": "quote_number",
  "Freight Terms": "freight_terms",
  "Payment Terms": "payment_terms",
  "Expiration Date": "expiration_date",
  "Sold To Customer": "sold_to_customer",
  "Bill To Customer": "bill_to_customer",
  Factory: "factory",
};

// Primary keys mapping for INVOICES entity type
export const PRIMARY_KEYS_INVOICES: Record<string, string> = {
  "Invoice #": "invoice_number",
  "Invoice Date": "invoice_date",
  "Order #": "order.order_number",
  "Order Date": "order.order_date",
  "Invoice Amount": "invoice_amount",
  "Sold To Customer": "sold_to_customer",
  "Bill To Customer": "bill_to_customer",
  Factory: "factory",
};

// Primary keys mapping for CHECKS entity type
export const PRIMARY_KEYS_CHECKS: Record<string, string> = {
  "Check #": "check_number",
  "Check Date": "check_date",
  "Commission Month": "commission_month",
  "Post Date": "post_date",
  "Posted": "posted",
  "Factory": "factory",
};

// Primary keys mapping for ORDER_ACKNOWLEDGEMENTS entity type
export const PRIMARY_KEYS_ORDER_ACKNOWLEDGEMENTS: Record<string, string> = {
  "Ack #": "ack_number",
  "Order #": "order_number",
  "Order Date": "order_date",
  "Ship Date": "ship_date",
  "Due Date": "due_date",
  "Job Name": "job_name",
  "Mark #": "mark_number",
  "Payment Terms": "payment_terms",
  "Shipping Terms": "shipping_terms",
  "Sold To Customer": "sold_to_customer",
  "Bill To Customer": "bill_to_customer",
  "Factory": "factory",
};

// Primary keys mapping for DELIVERIES entity type (packing slips / BOL)
export const PRIMARY_KEYS_DELIVERIES: Record<string, string> = {
  "BOL / Reference #": "invoice_number",
  "Shipment Date": "invoice_date",
  "PO #": "order.order_number",
  "PO Date": "order.order_date",
  "Invoice Amount": "invoice_amount",
  "End User": "end_user",
  "Sold To Customer": "sold_to_customer",
  "Bill To Customer": "bill_to_customer",
  Factory: "factory",
};

// Default to ORDERS for backward compatibility
export const PRIMARY_KEYS: Record<string, string> = PRIMARY_KEYS_ORDERS;

// Function to get the appropriate primary keys based on entity type
export function getPrimaryKeysForEntity(entityType?: string | null): Record<string, string> {
  const normalizedType = entityType?.toUpperCase();
  
  switch (normalizedType) {
    case "QUOTES":
      return PRIMARY_KEYS_QUOTES;
    case "INVOICES":
      return PRIMARY_KEYS_INVOICES;
    case "CHECKS":
      return PRIMARY_KEYS_CHECKS;
    case "ORDER_ACKNOWLEDGEMENTS":
      return PRIMARY_KEYS_ORDER_ACKNOWLEDGEMENTS;
    case "DELIVERIES":
      return PRIMARY_KEYS_DELIVERIES;
    case "ORDERS":
    default:
      return PRIMARY_KEYS_ORDERS;
  }
}

const ADDRESS_KEYS = [
  { label: "Name", key: "name" },
  { label: "Address Line 1", key: "address_line_one" },
  { label: "Address Line 2", key: "address_line_two" },
  { label: "City", key: "city" },
  { label: "State", key: "state" },
  { label: "ZIP", key: "zip_code" },
];

export function safeParseExtracted(json: string | null | undefined): Extracted {
  try {
    if (!json) return {};
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0] as Extracted;
    }
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data[0] as Extracted;
    }
    if (parsed && typeof parsed === "object") {
      return parsed as Extracted;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * Parse extracted data that may contain multiple data sets
 * Returns an array of Extracted objects
 */
export function safeParseExtractedArray(json: string | null | undefined): Extracted[] {
  try {
    if (!json) return [{}];
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed as Extracted[];
    }
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed.data as Extracted[];
    }
    if (parsed && typeof parsed === "object") {
      return [parsed as Extracted];
    }
    return [{}];
  } catch {
    return [{}];
  }
}

/**
 * Get the identifier field key based on entity type
 * This is used to identify each data set uniquely
 */
export function getIdentifierKey(entityType?: string | null): string {
  const normalizedType = entityType?.toUpperCase();
  
  switch (normalizedType) {
    case "QUOTES":
      return "quote_number";
    case "INVOICES":
      return "invoice_number";
    case "CHECKS":
      return "check_number";
    case "ORDER_ACKNOWLEDGEMENTS":
      return "ack_number";
    case "DELIVERIES":
      return "invoice_number";
    case "ORDERS":
    default:
      return "order_number";
  }
}

/**
 * Get the identifier label based on entity type
 * This is used for display purposes in prompts
 */
export function getIdentifierLabel(entityType?: string | null): string {
  const normalizedType = entityType?.toUpperCase();
  
  switch (normalizedType) {
    case "QUOTES":
      return "Quote #";
    case "INVOICES":
      return "Invoice #";
    case "CHECKS":
      return "Check #";
    case "ORDER_ACKNOWLEDGEMENTS":
      return "Ack #";
    case "DELIVERIES":
      return "BOL / Reference #";
    case "ORDERS":
    default:
      return "Order #";
  }
}

/**
 * Get the identifier value from an Extracted object
 */
export function getIdentifierValue(extracted: Extracted, entityType?: string | null): string {
  const key = getIdentifierKey(entityType);
  const value = extracted[key];
  
  if (value === null || value === undefined || value === "") return "Unknown";
  if (typeof value === "string") return value;
  return String(value);
}

export function buildPrimary(extracted: Extracted, entityType?: string | null): PrimaryField[] {
  const primaryKeys = getPrimaryKeysForEntity(entityType);
  
  return Object.entries(primaryKeys).map(([label, key]) => {
    if (["Sold To Customer", "Bill To Customer", "Factory", "End User"].includes(label)) {
      const block = extracted[key] as Record<string, unknown> | null | undefined;
      const nested = buildAddressBlock(block, key);
      return {
        key: label,
        value: "",
        sourcePath: key,
        nested,
      };
    }

    // Handle nested paths like "order.order_number"
    let rawValue: unknown;
    if (key.includes('.')) {
      const parts = key.split('.');
      rawValue = parts.reduce((obj: unknown, part: string) => {
        if (obj && typeof obj === 'object' && part in obj) {
          return (obj as Record<string, unknown>)[part];
        }
        return undefined;
      }, extracted);
    } else {
      rawValue = extracted[key];
    }
    
    const formattedValue = formatValue(rawValue);
    
    return {
      key: label,
      value: formattedValue,
      sourcePath: key,
    };
  });
}

export function buildOther(extracted: Extracted, entityType?: string | null): OtherField[] {
  const primaryKeys = getPrimaryKeysForEntity(entityType);
  const reserved = new Set<string>([...Object.values(primaryKeys), "details"]);
  return Object.entries(extracted)
    .filter(([key, value]) => {
      if (reserved.has(key)) return false;
      if (value === null || value === undefined) return false;
      if (typeof value === "object") return false;
      return true;
    })
    .map(([key, value]) => ({
      key: toTitleCase(key),
      value: formatValue(value),
      sourcePath: key,
    }));
}

export function buildLineItems(extracted: Extracted): LineItem[] {
  if (!Array.isArray(extracted.details)) return [];
  
  // Flatten nested objects in each line item, keeping source path metadata
  return extracted.details.map((item, index) => flattenLineItem(item, '', `details.${index}`));
}

/**
 * Keys that represent nested objects which should NOT become standalone columns.
 * These keys (like 'factory', 'end_user') are parent containers whose child properties
 * (like 'factory_name', 'factory_address_line_one') should be columns instead.
 */
const NESTED_OBJECT_PARENT_KEYS = new Set([
  'factory',
  'end_user',
  'sold_to_customer',
  'bill_to_customer',
  'address',
]);

/**
 * Default fields to expand when a nested object parent is null.
 * This ensures columns are always visible even when no data exists.
 */
const NESTED_OBJECT_DEFAULTS: Record<string, string[]> = {
  end_user: ['name', 'address_line_one', 'address_line_two', 'address_city', 'address_state', 'address_zip_code'],
  factory: ['name', 'address_line_one', 'address_line_two', 'address_city', 'address_state', 'address_zip_code'],
  sold_to_customer: ['name', 'address_line_one', 'address_line_two', 'address_city', 'address_state', 'address_zip_code'],
  bill_to_customer: ['name', 'address_line_one', 'address_line_two', 'address_city', 'address_state', 'address_zip_code'],
};

/**
 * Recursively flatten a line item object, converting nested structures into dot notation
 * Example: { end_user: { name: "ABC", address: { city: "NYC" } } }
 * Becomes: { end_user_name: "ABC", end_user_address_city: "NYC" }
 */
function flattenLineItem(item: Record<string, unknown>, parentKey = '', parentPath = ''): LineItem {
  const flattened: LineItem = {};
  const sourcePaths: Record<string, string> = {};

  for (const [key, value] of Object.entries(item)) {
    // Skip internal_uuid fields - they should not be displayed in line items
    if (key === 'internal_uuid') {
      continue;
    }

    const newKey = parentKey ? `${parentKey}_${key}` : key;
    const newPath = parentPath ? `${parentPath}.${key}` : key;
    
    if (value === null || value === undefined) {
      // For nested object parents (like end_user, factory), expand their default fields
      // so columns are always visible even when no data exists
      if (NESTED_OBJECT_PARENT_KEYS.has(key) && NESTED_OBJECT_DEFAULTS[key]) {
        for (const subKey of NESTED_OBJECT_DEFAULTS[key]) {
          const expandedKey = `${newKey}_${subKey}`;
          const expandedPath = `${newPath}.${subKey.replace(/_/g, '.')}`;
          flattened[expandedKey] = null;
          sourcePaths[expandedKey] = expandedPath;
        }
        continue;
      }
      flattened[newKey] = value;
      if (!newKey.startsWith('_')) {
        sourcePaths[newKey] = newPath;
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      const nested = flattenLineItem(value as Record<string, unknown>, newKey, newPath);
      Object.entries(nested).forEach(([nestedKey, nestedValue]) => {
        if (nestedKey === LINE_ITEM_SOURCE_MAP_KEY) {
          Object.assign(sourcePaths, nestedValue as Record<string, string>);
        } else {
          flattened[nestedKey] = nestedValue;
        }
      });
    } else {
      // Keep primitive values and arrays as-is
      flattened[newKey] = value;
      if (!newKey.startsWith('_')) {
        sourcePaths[newKey] = newPath;
      }
    }
  }

  if (Object.keys(sourcePaths).length > 0) {
    flattened[LINE_ITEM_SOURCE_MAP_KEY] = sourcePaths;
  }
  
  return flattened;
}

function buildAddressBlock(block: Record<string, unknown> | null | undefined, parentKey?: string) {
  const buildPath = (suffix: string) => (parentKey ? `${parentKey}.${suffix}` : suffix);

  if (!block || typeof block !== "object") {
    return ADDRESS_KEYS.map(({ label, key }) => {
      const suffix = key === "name" ? "name" : `address.${key}`;
      return {
        key: label,
        value: "NA",
        sourcePath: buildPath(suffix),
      };
    });
  }

  // Handle both nested address structure and flat structure
  const addr =
    "address" in block && block.address && typeof block.address === "object"
      ? (block.address as Record<string, unknown>)
      : null;

  return ADDRESS_KEYS.map(({ label, key }) => {
    let value: unknown;
    let suffix = key === "name" ? "name" : `address.${key}`;
    
    if (key === "name") {
      // Name is usually at the top level
      value = block["name"];
    } else {
      // Try nested address first, then fall back to top level
      if (addr && addr[key] !== undefined && addr[key] !== null && addr[key] !== "") {
        value = addr[key];
        suffix = `address.${key}`;
      } else if (block[key] !== undefined && block[key] !== null && block[key] !== "") {
        value = block[key];
        suffix = key;
      } else {
        value = null;
      }
    }

    const formattedValue = formatValue(value);
    
    return {
      key: label,
      value: formattedValue,
      sourcePath: buildPath(suffix),
    };
  });
}

function toTitleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "NA";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}






"use client";

import { parseCsv } from "./csvParser";

const REPORT_TYPE_CONFIG = {
  ORDER_DETAIL_REPORT: {
    numericFields: new Set([
      "commission",
      "commissionDiscount",
      "detailTotal",
      "discount",
      "outsideRepSplitRate",
      "outsideRepTotalPortion",
      "outsideRepCommission",
      "quantity",
      "unitPrice",
    ]),
  },
  QUOTE_DETAIL_REPORT: {
    numericFields: new Set([
      "commission",
      "detailTotal",
      "outsideRepCommission",
      "outsideRepSplitRate",
      "outsideRepTotalPortion",
      "quantity",
      "unitPrice",
    ]),
  },
  INVOICE_DETAIL_REPORT: {
    numericFields: new Set([
      "commission",
      "outsideRepCommission",
      "outsideRepSplitRate",
      "outsideRepTotalPortion",
      "quantityOrdered",
      "quantityShipped",
      "total",
      "unitPrice",
    ]),
  },
  CHECK_DETAIL_REPORT: {
    numericFields: new Set(["commissionReceived", "expectedCommission", "invoiceAmount"]),
  },
  PRE_OPPORTUNITY_DETAIL_REPORT: {
    numericFields: new Set([
      "quantity",
      "unitPrice",
      "detailTotal",
      "detailSubtotal",
      "discountRate",
      "discount",
    ]),
  },
  JOB_DETAIL_REPORT: {
    numericFields: new Set([]),
  },
  TASK_DETAIL_REPORT: {
    numericFields: new Set([]),
  },
};

export const RAW_VALUES_KEY = "__rawValues";

function normalizeHeader(header) {
  if (!header || typeof header !== "string") {
    return "";
  }

  const trimmed = header.trim();
  if (!trimmed) return "";

  const prepared = trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z0-9]+/g, " ");

  const segments = prepared
    .split(" ")
    .filter(Boolean);

  if (segments.length === 0) return "";

  const [first, ...rest] = segments;
  const firstSegment = first.toLowerCase();
  const restSegments = rest
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return `${firstSegment}${restSegments}`;
}

const NULL_TOKEN_REGEX = /^(null|undefined)$/i;

function sanitizeNumeric(rawValue) {
  let value = rawValue.replace(/\$/g, "").replace(/,/g, "");
  const hasPercent = value.includes("%");

  value = value.replace(/%/g, "");

  if (/^\(.*\)$/.test(value)) {
    value = `-${value.slice(1, -1)}`;
  }

  if (value === "" || value === "-") {
    return null;
  }

  if (!/^[-+]?\d*(\.\d+)?$/.test(value)) {
    return null;
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }

  return hasPercent ? numeric : numeric;
}

function normalizeValue(fieldName, rawValue, config) {
  if (rawValue == null) {
    return rawValue;
  }

  if (typeof rawValue !== "string") {
    return rawValue;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return "";
  }

  if (NULL_TOKEN_REGEX.test(trimmed)) {
    return null;
  }

  if (config?.numericFields?.has(fieldName)) {
    const numeric = sanitizeNumeric(trimmed);
    return numeric ?? trimmed;
  }

  return trimmed;
}

export function parseReportCsv(reportType, csvText) {
  const { header, rows } = parseCsv(csvText);
  if (!header || header.length === 0 || rows.length === 0) {
    return [];
  }

  const config = REPORT_TYPE_CONFIG[reportType] ?? { numericFields: new Set() };
  const normalizedHeaders = header.map((column) => normalizeHeader(column));

  return rows
    .map((row) => {
      const record = {};
      const rawValues = {};
      for (let i = 0; i < normalizedHeaders.length; i += 1) {
        const key = normalizedHeaders[i];
        if (!key) continue;
        const rawValue = i < row.length ? row[i] : "";
        rawValues[key] = rawValue ?? "";
        record[key] = normalizeValue(key, rawValue, config);
      }

      Object.defineProperty(record, RAW_VALUES_KEY, {
        value: rawValues,
        enumerable: false,
        configurable: false,
        writable: false,
      });

      return record;
    })
    .filter((record) => Object.keys(record).length > 0);
}

export { REPORT_TYPE_CONFIG };

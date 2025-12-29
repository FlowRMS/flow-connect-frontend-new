export function toNumericSortValue(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") {
      return null;
    }
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

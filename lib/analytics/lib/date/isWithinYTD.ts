function normalizeToLocal(dateLike: Date | string | number): Date | null {
  if (dateLike == null) return null;
  const date = dateLike instanceof Date ? new Date(dateLike.getTime()) : new Date(dateLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Inclusive boundary; timezone-safe (treat dates as local by default)
 */
export function isWithinYTD(
  rowDate: Date | string | number,
  asOf: Date = new Date()
): boolean {
  const normalized = normalizeToLocal(rowDate);
  if (!normalized) return false;

  const asOfLocal = normalizeToLocal(asOf);
  if (!asOfLocal) return false;

  // Build cutoff using the row's year with the month/day from asOf
  const cutoff = new Date(
    normalized.getFullYear(),
    asOfLocal.getMonth(),
    asOfLocal.getDate()
  );

  // Ensure both dates are compared without time noise; zero out time to guard
  // against DST offsets when consumers pass strings with implicit UTC.
  const normalizedTime = new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate()
  ).getTime();

  const cutoffTime = new Date(
    cutoff.getFullYear(),
    cutoff.getMonth(),
    cutoff.getDate()
  ).getTime();

  if (Number.isNaN(normalizedTime) || Number.isNaN(cutoffTime)) {
    return false;
  }

  // For rows after the cutoff, exclude them from YTD calculations.
  if (normalizedTime > cutoffTime) {
    return false;
  }

  const startOfRowYearTime = new Date(
    normalized.getFullYear(),
    0,
    1
  ).getTime();

  return normalizedTime >= startOfRowYearTime && normalizedTime <= cutoffTime;
}

export default isWithinYTD;

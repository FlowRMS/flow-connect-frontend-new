import { isDateInRange, getYTDRanges } from "./ytdUtils";
import type { PercentageDiffContribution } from "./aggregators";

export type DateField = "quoteDate" | "orderDate" | "invoiceDate" | "entityDate" | "checkDateRaw";

type RowWithDateField = {
  [key: string]: string | number | Date | null | undefined;
  outsideRepCommission?: number | null;
  outsideRepTotalPortion?: number | null;
  commissions?: number | null;
  sales?: number | null;
};

/**
 * Attach YTD fields (both current and previous year) to a data row
 * Returns null for rows outside the respective YTD ranges so aggregators ignore them
 * 
 * This ensures YTD measures exactly match what users would see if they manually
 * set date filters to the YTD ranges.
 * 
 * For difference columns, we use a "signed contribution" approach:
 * - Current YTD rows get positive values
 * - Previous YTD rows get negative values
 * When summed in a pivot table: Sum(current) + Sum(-previous) = Difference
 * 
 * For percentage difference, we store an object with ytd and prevYtd values.
 * The percentageDiffAggregator sums these separately and calculates:
 * ((Sum YTD) - (Sum Previous YTD)) / (Sum Previous YTD) * 100
 * 
 * This ensures correct percentage calculation after pivot aggregation.
 * 
 * @param row - Data row to enhance with YTD fields
 * @param dateField - Name of the date field to use (quoteDate, orderDate, invoiceDate, entityDate, or checkDateRaw)
 * @param asOf - Reference date for YTD calculations (defaults to today)
 */
export function attachYtdFields<T extends RowWithDateField>(
  row: T,
  dateField: DateField,
  asOf: Date = new Date()
): T {
  const dateValue = row?.[dateField];
  const ranges = getYTDRanges(asOf);

  // Check if row falls within current YTD range
  const inCurrentYTD = dateValue != null 
    ? isDateInRange(dateValue as string | number | Date, ranges.current.start, ranges.current.end)
    : false;

  // Check if row falls within previous YTD range
  const inPreviousYTD = dateValue != null
    ? isDateInRange(dateValue as string | number | Date, ranges.previous.start, ranges.previous.end)
    : false;

  // Get base values
  const commissionValue = row?.outsideRepCommission ?? null;
  const salesValue = row?.outsideRepTotalPortion ?? null;
  
  // For commission-by-state pivot which uses 'commissions' and 'sales' fields
  const commissionsValue = row?.commissions ?? null;
  const salesFieldValue = row?.sales ?? null;

  // Calculate difference contributions using signed values
  // Current YTD gets positive, Previous YTD gets negative
  // When aggregated: Sum = CurrentTotal - PreviousTotal = Difference
  const commissionDiffContribution = inCurrentYTD 
    ? (commissionValue ?? 0) 
    : inPreviousYTD 
      ? -(commissionValue ?? 0) 
      : null;
  
  const salesDiffContribution = inCurrentYTD 
    ? (salesValue ?? 0) 
    : inPreviousYTD 
      ? -(salesValue ?? 0) 
      : null;

  // For commission-by-state specific fields
  const commissionsDiffContribution = inCurrentYTD 
    ? (commissionsValue ?? 0) 
    : inPreviousYTD 
      ? -(commissionsValue ?? 0) 
      : null;
  
  const salesStateDiffContribution = inCurrentYTD 
    ? (salesFieldValue ?? 0) 
    : inPreviousYTD 
      ? -(salesFieldValue ?? 0) 
      : null;

  // Create percentage difference contribution objects
  // These store ytd and prevYtd separately so the aggregator can sum them
  // independently and calculate the correct percentage from the totals
  const commissionPctContribution: PercentageDiffContribution | null = 
    (inCurrentYTD || inPreviousYTD) ? {
      ytd: inCurrentYTD ? (commissionValue ?? 0) : 0,
      prevYtd: inPreviousYTD ? (commissionValue ?? 0) : 0,
    } : null;

  const salesPctContribution: PercentageDiffContribution | null = 
    (inCurrentYTD || inPreviousYTD) ? {
      ytd: inCurrentYTD ? (salesValue ?? 0) : 0,
      prevYtd: inPreviousYTD ? (salesValue ?? 0) : 0,
    } : null;

  // Commission-by-state percentage contributions
  const commissionStatePctContribution: PercentageDiffContribution | null = 
    (inCurrentYTD || inPreviousYTD) ? {
      ytd: inCurrentYTD ? (commissionsValue ?? 0) : 0,
      prevYtd: inPreviousYTD ? (commissionsValue ?? 0) : 0,
    } : null;

  const salesStatePctContribution: PercentageDiffContribution | null = 
    (inCurrentYTD || inPreviousYTD) ? {
      ytd: inCurrentYTD ? (salesFieldValue ?? 0) : 0,
      prevYtd: inPreviousYTD ? (salesFieldValue ?? 0) : 0,
    } : null;

  return {
    ...row,
    // Current YTD measures (only include if within current YTD range)
    outsideRepCommissionYTD: inCurrentYTD ? commissionValue : null,
    outsideRepTotalPortionYTD: inCurrentYTD ? salesValue : null,
    
    // Previous YTD measures (only include if within previous YTD range)
    outsideRepCommissionPrevYTD: inPreviousYTD ? commissionValue : null,
    outsideRepTotalPortionPrevYTD: inPreviousYTD ? salesValue : null,
    
    // Difference fields (signed contributions for aggregation)
    // These will sum to: CurrentYTD - PreviousYTD
    commissionDiff: commissionDiffContribution !== null && commissionDiffContribution !== 0 ? commissionDiffContribution : null,
    salesDiff: salesDiffContribution !== null && salesDiffContribution !== 0 ? salesDiffContribution : null,
    
    // Percentage difference contribution objects for custom aggregator
    // The aggregator sums ytd and prevYtd separately, then calculates the percentage
    commissionDiffPct: commissionPctContribution,
    salesDiffPct: salesPctContribution,
    
    // Commission-by-state specific YTD fields
    commissionsYTD: inCurrentYTD ? commissionsValue : null,
    commissionsPrevYTD: inPreviousYTD ? commissionsValue : null,
    salesYTD: inCurrentYTD ? salesFieldValue : null,
    salesPrevYTD: inPreviousYTD ? salesFieldValue : null,
    
    // Commission-by-state difference fields
    commissionStateDiff: commissionsDiffContribution !== null && commissionsDiffContribution !== 0 ? commissionsDiffContribution : null,
    salesStateDiff: salesStateDiffContribution !== null && salesStateDiffContribution !== 0 ? salesStateDiffContribution : null,
    
    // Commission-by-state percentage contribution objects
    commissionStateDiffPct: commissionStatePctContribution,
    salesStateDiffPct: salesStatePctContribution,
  };
}

export default attachYtdFields;

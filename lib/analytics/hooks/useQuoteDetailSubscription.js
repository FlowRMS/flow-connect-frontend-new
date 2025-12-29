import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useQuoteDetailSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "QUOTE_DETAIL_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useQuoteDetailSubscription",
  });
}

import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useCheckDetailSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "CHECK_DETAIL_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useCheckDetailSubscription",
  });
}

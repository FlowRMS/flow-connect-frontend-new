import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useJobDetailSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "JOB_DETAIL_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useJobDetailSubscription",
  });
}

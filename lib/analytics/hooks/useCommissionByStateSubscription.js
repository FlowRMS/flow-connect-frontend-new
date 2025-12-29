import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useCommissionByStateSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "COMMISSION_BY_STATE_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useCommissionByStateSubscription",
  });
}

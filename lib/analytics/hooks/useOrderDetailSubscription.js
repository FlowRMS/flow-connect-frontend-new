import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useOrderDetailSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "ORDER_DETAIL_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useOrderDetailSubscription",
  });
}

import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useOrderSplitRateCommissionSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "ORDER_SPLIT_RATE_COMMISSION_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useOrderSplitRateCommissionSubscription",
  });
}

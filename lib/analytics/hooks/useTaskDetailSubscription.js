import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useTaskDetailSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "TASK_DETAIL_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useTaskDetailSubscription",
  });
}

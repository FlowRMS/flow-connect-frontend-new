import { useReportCacheSubscription } from "./useReportCacheSubscription";

export function useInvoiceDetailSubscription(limit, startDate, endDate, filterByDate) {
  return useReportCacheSubscription({
    reportType: "INVOICE_DETAIL_REPORT",
    limit,
    startDate,
    endDate,
    filterByDate,
    logPrefix: "useInvoiceDetailSubscription",
  });
}

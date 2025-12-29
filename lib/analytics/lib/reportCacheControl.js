"use client";

const REPORT_CACHE_CLEAR_EVENT = "flow-analytics:report-cache-clear";

export function triggerReportCacheClear() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(REPORT_CACHE_CLEAR_EVENT));
}

export { REPORT_CACHE_CLEAR_EVENT };

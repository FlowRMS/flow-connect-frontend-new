import { enhanceColumnsWithIdLinks } from "@/lib/analytics/utils/idColumnLinks";

const baseColumns = [
  { prop: "blanket", name: "Blanket", sortable: true, size: 90 },
  { prop: "category", name: "Category", sortable: true, size: 120 },
  { prop: "commission", name: "Commission", sortable: true, size: 120 },
  { prop: "customerTitle", name: "Customer Title", sortable: true, size: 180 },
  { prop: "customerId", name: "Customer ID", sortable: true, size: 220 },
  { prop: "detailTotal", name: "Detail Total", sortable: true, size: 120 },
  { prop: "endUser", name: "End User", sortable: true, size: 150 },
  { prop: "entryDate", name: "Entry Date", sortable: true, size: 120 },
  { prop: "expDate", name: "Exp Date", sortable: true, size: 120 },
  { prop: "factoryId", name: "Factory ID", sortable: true, size: 220 },
  { prop: "factoryPartNumber", name: "Factory Part Number", sortable: true, size: 170 },
  { prop: "factoryTitle", name: "Factory Title", sortable: true, size: 160 },
  { prop: "insideRep", name: "Inside Rep", sortable: true, size: 130 },
  { prop: "itemNumber", name: "Item Number", sortable: true, size: 120 },
  { prop: "jobName", name: "Job Name", sortable: true, size: 200 },
  { prop: "lostReason", name: "Lost Reason", sortable: true, size: 150 },
  { prop: "orderDate", name: "Order Date", sortable: true, size: 120 },
  { prop: "orderId", name: "Order ID", sortable: true, size: 220 },
  { prop: "outsideRep", name: "Outside Rep", sortable: true, size: 130 },
  { prop: "outsideRepCommission", name: "Commissions", sortable: true, size: 180 },
  { prop: "outsideRepSplitRate", name: "Outside Rep Split Rate", sortable: true, size: 170 },
  { prop: "outsideRepTotalPortion", name: "Sales", sortable: true, size: 190 },
  { prop: "quantity", name: "Quantity", sortable: true, size: 90 },
  { prop: "quoteDate", name: "Quote Date", sortable: true, size: 120 },
  { prop: "quoteId", name: "Quote ID", sortable: true, size: 220 },
  { prop: "quoteNumber", name: "Quote Number", sortable: true, size: 130 },
  { prop: "status", name: "Status", sortable: true, size: 90 },
  { prop: "unitPrice", name: "Unit Price", sortable: true, size: 100 },
];

// Enhance columns with ID hyperlinks
export const quoteDetailReportColumns = enhanceColumnsWithIdLinks(baseColumns);

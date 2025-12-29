import { enhanceColumnsWithIdLinks } from "@/lib/analytics/utils/idColumnLinks";

const baseColumns = [
  { prop: "commission", name: "Commission", sortable: true, size: 120 },
  { prop: "customerTitle", name: "Customer Title", sortable: true, size: 180 },
  { prop: "endUser", name: "End User", sortable: true, size: 150 },
  { prop: "entityDate", name: "Entity Date", sortable: true, size: 120 },
  { prop: "entryDate", name: "Entry Date", sortable: true, size: 120 },
  { prop: "factoryPartNumber", name: "Factory Part Number", sortable: true, size: 170 },
  { prop: "factoryTitle", name: "Factory Title", sortable: true, size: 160 },
  { prop: "invoiceId", name: "Invoice ID", sortable: true, size: 220 },
  { prop: "invoiceNumber", name: "Invoice Number", sortable: true, size: 140 },
  { prop: "jobName", name: "Job Name", sortable: true, size: 200 },
  { prop: "orderId", name: "Order ID", sortable: true, size: 220 },
  { prop: "orderNumber", name: "Order Number", sortable: true, size: 120 },
  { prop: "outsideRep", name: "Outside Rep", sortable: true, size: 130 },
  { prop: "outsideRepCommission", name: "Commissions", sortable: true, size: 180 },
  { prop: "outsideRepSplitRate", name: "Outside Rep Split Rate", sortable: true, size: 170 },
  { prop: "outsideRepTotalPortion", name: "Sales", sortable: true, size: 190 },
  { prop: "quantityOrdered", name: "Quantity Ordered", sortable: true, size: 140 },
  { prop: "quantityShipped", name: "Quantity Shipped", sortable: true, size: 140 },
  { prop: "status", name: "Status", sortable: true, size: 90 },
  { prop: "total", name: "Total", sortable: true, size: 100 },
  { prop: "unitPrice", name: "Unit Price", sortable: true, size: 100 },
];

// Enhance columns with ID hyperlinks
export const invoiceDetailReportColumns = enhanceColumnsWithIdLinks(baseColumns);

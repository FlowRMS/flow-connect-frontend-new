import { enhanceColumnsWithIdLinks } from "@/lib/analytics/utils/idColumnLinks";

const baseColumns = [
  { prop: "id", name: "ID", sortable: true, size: 220 },
  { prop: "orderNumber", name: "Order Number", sortable: true, size: 130 },
  { prop: "entityDate", name: "Entity Date", sortable: true, size: 120 },
  { prop: "factoryTitle", name: "Factory Title", sortable: true, size: 160 },
  { prop: "customerFor", name: "Customer For", sortable: true, size: 180 },
  { prop: "salesRep", name: "Sales Rep", sortable: true, size: 130 },
  { prop: "orderTotalCommission", name: "Order Total Commission", sortable: true, size: 180 },
  { prop: "commissionTotal", name: "Commission Total", sortable: true, size: 150 },
  { prop: "orderTotal", name: "Order Total", sortable: true, size: 120 },
];

// Enhance columns with ID hyperlinks
export const orderSplitRateCommissionDetailReportColumns = enhanceColumnsWithIdLinks(baseColumns);


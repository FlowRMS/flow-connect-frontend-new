import { enhanceColumnsWithIdLinks } from "@/lib/analytics/utils/idColumnLinks";

const baseColumns = [
  { prop: "id", name: "ID", sortable: true, size: 220 },
  { prop: "checkId", name: "Check ID", sortable: true, size: 220 },
  { prop: "checkNumber", name: "Check Number", sortable: true, size: 130 },
  { prop: "entryDate", name: "Entry Date", sortable: true, size: 120 },
  { prop: "postDate", name: "Post Date", sortable: true, size: 120 },
  { prop: "checkDate", name: "Check Date", sortable: true, size: 120 },
  { prop: "entityId", name: "Entity ID", sortable: true, size: 220 },
  { prop: "entityNumber", name: "Entity Number", sortable: true, size: 130 },
  { prop: "entityDate", name: "Entity Date", sortable: true, size: 120 },
  { prop: "entityType", name: "Entity Type", sortable: true, size: 120 },
  { prop: "orderId", name: "Order ID", sortable: true, size: 220 },
  { prop: "orderNumber", name: "Order Number", sortable: true, size: 130 },
  { prop: "customerId", name: "Customer ID", sortable: true, size: 220 },
  { prop: "companyName", name: "Company Name", sortable: true, size: 180 },
  { prop: "parentCustomerId", name: "Parent Customer ID", sortable: true, size: 220 },
  { prop: "parentCustomer", name: "Parent Customer", sortable: true, size: 180 },
  { prop: "factory", name: "Factory", sortable: true, size: 160 },
  { prop: "outsideSalesRep", name: "Outside Sales Rep", sortable: true, size: 150 },
  { prop: "outsideRepTotalPortion", name: "Sales", sortable: true, size: 180 },
  { prop: "outsideRepCommission", name: "Expected Commissions", sortable: true, size: 180 },
  { prop: "paidCommission", name: "Paid Commissions", sortable: true, size: 150 },
];

// Enhance columns with ID hyperlinks
export const checkDetailReportColumns = enhanceColumnsWithIdLinks(baseColumns);

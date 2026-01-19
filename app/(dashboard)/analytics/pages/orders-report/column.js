import { enhanceColumnsWithIdLinks } from "@/lib/analytics/utils/idColumnLinks";

const baseColumns = [
  { prop: "category", name: "Category", sortable: true, size: 120 },
  { prop: "commission", name: "Detail Total Commissions", sortable: true, size: 120 },
  {
    prop: "commissionDiscount",
    name: "Commission Discount",
    sortable: true,
    size: 150,
  },
  { prop: "customer", name: "Customer", sortable: true, size: 160 },
  { prop: "parentCustomer", name: "Parent Customer", sortable: true, size: 160 },
  { prop: "factory", name: "Factory", sortable: true, size: 140 },
  {
    prop: "outsideRepEmail",
    name: "Outside Rep Email",
    sortable: true,
    size: 200,
  },
  { prop: "customerId", name: "Customer ID", sortable: true, size: 220 },
  { prop: "detailTotal", name: "Detail Total Sales", sortable: true, size: 120 },
  { prop: "discount", name: "Discount", sortable: true, size: 90 },
  { prop: "dueDate", name: "Due Date", sortable: true, size: 120 },
  {
    prop: "daysUntilDueDate",
    name: "Days Until Due Date",
    sortable: true,
    size: 170,
  },
  { prop: "endUser", name: "End User", sortable: true, size: 150 },
  { prop: "endUserBillingAddressLineOne", name: "End User Billing Address Line 1", sortable: true, size: 220 },
  { prop: "endUserBillingAddressLineTwo", name: "End User Billing Address Line 2", sortable: true, size: 220 },
  { prop: "endUserBillingCity", name: "End User Billing City", sortable: true, size: 180 },
  { prop: "endUserBillingState", name: "End User Billing State", sortable: true, size: 180 },
  { prop: "endUserBillingZip", name: "End User Billing ZIP", sortable: true, size: 160 },
  { prop: "entryDate", name: "Entry Date", sortable: true, size: 120 },
  { prop: "factSoNumber", name: "Fact SO Number", sortable: true, size: 150 },
  { prop: "factoryId", name: "Factory ID", sortable: true, size: 220 },
  {
    prop: "factoryPartNumber",
    name: "Factory Part Number",
    sortable: true,
    size: 150,
  },
  {
    prop: "customerPartNumber",
    name: "Customer Part Number",
    sortable: true,
    size: 150,
  },
  { prop: "itemNumber", name: "Item Number", sortable: true, size: 120 },
  { prop: "jobName", name: "Job Name", sortable: true, size: 200 },
  { prop: "orderDate", name: "Order Date", sortable: true, size: 120 },
  { prop: "orderId", name: "Order ID", sortable: true, size: 220 },
  { prop: "orderNumber", name: "Order Number", sortable: true, size: 120 },
  { prop: "outsideRep", name: "Outside Rep", sortable: true, size: 130 },
  {
    prop: "outsideRepCommission",
    name: "Outside Rep Commission",
    sortable: true,
    size: 180,
  },

  {
    prop: "outsideRepSplitRate",
    name: "Outside Rep Split Rate",
    sortable: true,
    size: 170,
  },
  {
    prop: "outsideRepTotalPortion",
    name: "Outside Rep Sales",
    sortable: true,
    size: 170,
  },
  // { prop: "factoryPartNumber", name: "Product", sortable: true, size: 120 },
  { prop: "quantity", name: "Quantity", sortable: true, size: 90 },
  { prop: "quoteId", name: "Quote ID", sortable: true, size: 220 },
  { prop: "quoteNumber", name: "Quote Number", sortable: true, size: 130 },
  { prop: "shipDate", name: "Ship Date", sortable: true, size: 120 },
  { prop: "status", name: "Status", sortable: true, size: 90 },
  { prop: "unitPrice", name: "Unit Price", sortable: true, size: 100 },
];

// Enhance columns with ID hyperlinks
export const orderDetailReportColumns = enhanceColumnsWithIdLinks(baseColumns);


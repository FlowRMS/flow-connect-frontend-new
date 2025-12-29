export const orderDetailReportColumns = [
  {
    prop: "orderNumber",
    name: "Order Number",
    sortable: true,
    size: 120,
  },

  {
    prop: "customer",
    name: "Customer",
    sortable: true,
    size: 160,
  },
  {
    prop: "parentCustomer",
    name: "Parent Customer",
    sortable: true,
    size: 160,
  },
  {
    prop: "factory",
    name: "Factory",
    sortable: true,
    size: 140,
  },
  {
    prop: "orderDate",
    name: "Order Date",
    sortable: true,
    size: 120,
  },
  {
    prop: "detailTotalFmt",
    name: "Total",
    sortable: true,
    size: 100,
    cellTemplate: (h, props) => {
      const raw = props.model["detailTotal"];
      const text = props.model[props.prop];
      return h(
        "div",
        { class: { "currency-value": true, "text-right": true, "pr-3": true } },
        typeof raw === "number"
          ? `$${Number(raw).toFixed(2)}`
          : String(text ?? "")
      );
    },
  },
  {
    prop: "unitPriceFmt",
    name: "Unit Price",
    sortable: true,
    size: 100,
    // formatted string provided in data (unitPriceFmt)
  },
  {
    prop: "quantityFmt",
    name: "Quantity",
    sortable: true,
    size: 90,
    cellTemplate: (h, props) => {
      const v = props.model[props.prop];
      return h(
        "div",
        { class: { "text-right": true, "pr-3": true, "tabular-nums": true } },
        typeof v === "string" || typeof v === "number" ? v : String(v ?? "")
      );
    },
  },
  {
    prop: "status",
    name: "Status",
    sortable: true,
    size: 90,
    cellTemplate: (h, props) => {
      const status = (props.model[props.prop] || "").toString();
      const map = {
        OPEN: "bg-blue-100 text-blue-700",
        CLOSED: "bg-gray-100 text-gray-800",
        CANCELLED: "bg-red-100 text-red-700",
        SHIPPED: "bg-green-100 text-green-700",
        PENDING: "bg-amber-100 text-amber-800",
      };
      const classes =
        map[status.toUpperCase()] || "bg-gray-100 mt-3 text-gray-800";
      return h("div", { class: { flex: true, "justify-center": true } }, [
        h(
          "span",
          {
            class: {
              "px-2": true,
              "py-0.5": true,
              "rounded-full": true,
              "text-xs": true,
              "font-semibold": true,
              [classes]: true,
            },
          },
          status
        ),
      ]);
    },
  },
  {
    prop: "itemNumber",
    name: "Item Number",
    sortable: true,
    size: 90,
  },
  {
    prop: "discountFmt",
    name: "Discount",
    sortable: true,
    size: 90,
    cellTemplate: (h, props) => {
      const raw = props.model["discount"];
      const text = props.model[props.prop];
      const v =
        typeof raw === "number"
          ? raw
          : parseFloat(String(text).replace("%", ""));
      const isPositive = !isNaN(v) && v > 0;
      return h(
        "div",
        {
          class: {
            "text-right": true,
            "pr-3": true,
            [isPositive ? "text-green-600" : "text-red-600"]: true,
          },
        },
        typeof text === "string" || typeof text === "number"
          ? text
          : String(text ?? "")
      );
    },
  },
  {
    prop: "jobName",
    name: "Job Name",
    sortable: true,
    size: 200,
  },
  {
    prop: "dueDate",
    name: "Due Date",
    sortable: true,
    size: 120,
  },
  {
    prop: "shipDate",
    name: "Ship Date",
    sortable: true,
    size: 120,
  },
  {
    prop: "factSoNumber",
    name: "Fact SO Number",
    sortable: true,
    size: 150,
  },
  {
    prop: "quoteNumber",
    name: "Quote Number",
    sortable: true,
    size: 130,
  },
  {
    prop: "endUser",
    name: "End User",
    sortable: true,
    size: 150,
  },
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
  {
    prop: "category",
    name: "Category",
    sortable: true,
    size: 120,
  },
  {
    prop: "commissionFmt",
    name: "Commission",
    sortable: true,
    size: 120,
    cellTemplate: (h, props) => {
      const raw = props.model["commission"];
      const text = props.model[props.prop];
      return h(
        "div",
        { class: { "text-right": true, "pr-3": true } },
        typeof raw === "number" ? Number(raw).toFixed(2) : String(text ?? "")
      );
    },
  },
  {
    prop: "commissionDiscountFmt",
    name: "Commission Discount",
    sortable: true,
    size: 150,
    cellTemplate: (h, props) => {
      const raw = props.model["commissionDiscount"];
      const text = props.model[props.prop];
      const v =
        typeof raw === "number"
          ? raw
          : parseFloat(String(text).replace("%", ""));
      const isPositive = !isNaN(v) && v > 0;
      return h(
        "div",
        {
          class: {
            "text-right": true,
            "pr-3": true,
            [isPositive ? "text-green-600" : "text-red-600"]: true,
          },
        },
        typeof text === "string" || typeof text === "number"
          ? text
          : String(text ?? "")
      );
    },
  },
  {
    prop: "outsideRep",
    name: "Outside Rep",
    sortable: true,
    size: 130,
  },
  {
    prop: "outsideRepEmail",
    name: "Outside Rep Email",
    sortable: true,
    size: 200,
  },
  {
    prop: "outsideRepSplitRate",
    name: "Outside Rep Split Rate",
    sortable: true,
    size: 170,
  },
  {
    prop: "outsideRepCommissionFmt",
    name: "Commissions",
    sortable: true,
    size: 180,
    cellTemplate: (h, props) => {
      const raw = props.model["outsideRepCommission"];
      const text = props.model[props.prop];
      return h(
        "div",
        { class: { "text-right": true, "pr-3": true } },
        typeof raw === "number" ? Number(raw).toFixed(2) : String(text ?? "")
      );
    },
  },
];

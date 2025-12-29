const formatCurrency = (val) => {
  if (val == null || val === "") return "-";
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (!Number.isFinite(num)) return String(val);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatVarianceValue = (val) => {
  if (val == null || val === "") return "-";
  if (typeof val === "string" && val.includes("%")) return val;
  const raw =
    typeof val === "number" ? val : parseFloat(String(val).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(raw)) {
    return String(val);
  }
  return `${raw.toFixed(2)}%`;
};

const amountCell = (h, { value }) =>
  h(
    "span",
    {
      style: {
        textAlign: "right",
        display: "block",
        fontVariantNumeric: "tabular-nums",
      },
    },
    formatCurrency(value)
  );

const varianceCell = (h, { value }) => {
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  const displayValue = formatVarianceValue(value);

  let color;
  if (!Number.isFinite(num)) {
    color = "#6b7280";
  } else if (num > 10) {
    color = "#15803d";
  } else if (num > 0) {
    color = "#16a34a";
  } else if (num >= -10) {
    color = "#dc2626";
  } else {
    color = "#991b1b";
  }

  const isNegative = Number.isFinite(num) ? num < 0 : false;

  return h(
    "span",
    {
      style: {
        color,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
      },
    },
    [
      h("span", { style: { marginRight: "4px" } }, isNegative ? "▼" : "▲"),
      displayValue,
    ]
  );
};

const productNameCell = (h, { value }) =>
  h(
    "div",
    {
      style: { display: "flex", alignItems: "center" },
    },
    [
      h(
        "span",
        {
          style: {
            width: "8px",
            height: "8px",
            background: "#3b82f6",
            borderRadius: "50%",
            display: "inline-block",
            marginRight: "6px",
          },
        },
        ""
      ),
      value || "",
    ]
  );

export const productTrendsColumns = [
  {
    prop: "productName",
    name: "Product (FPN)",
    cellTemplate: productNameCell,
    size: 200,
  },
  {
    prop: "totalSales",
    name: "Total Sales",
    cellTemplate: amountCell,
    size: 140,
  },
  {
    prop: "monthlyAverage",
    name: "Monthly Avg",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "trend",
    name: "Trend",
    size: 150,
    // Custom sparkline renderer would go here
  },
];

export const factorySummaryColumns = [
  {
    prop: "factoryName",
    name: "Factory",
    cellTemplate: productNameCell,
    size: 180,
  },
  {
    prop: "totalSales",
    name: "Total Sales",
    cellTemplate: amountCell,
    size: 140,
  },
  {
    prop: "productCount",
    name: "Products",
    size: 100,
  },
  {
    prop: "variance",
    name: "YoY Change",
    cellTemplate: varianceCell,
    size: 120,
  },
];

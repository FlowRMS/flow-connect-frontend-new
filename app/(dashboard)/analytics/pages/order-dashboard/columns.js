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
    value != null ? `$${Number(value).toLocaleString()}` : "-"
  );

const varianceCell = (h, { value }) => {
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  const displayValue = formatVarianceValue(value);
  
  // Determine color based on variance ranges
  let color;
  if (!Number.isFinite(num)) {
    color = "#6b7280"; // gray for invalid values
  } else if (num > 10) {
    color = "#15803d"; // dark green for >+10%
  } else if (num > 0) {
    color = "#16a34a"; // light green for 0-10% positive
  } else if (num >= -10) {
    color = "#dc2626"; // light red for 0-10% negative
  } else {
    color = "#991b1b"; // dark red for <-10%
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

const nameCell = (h, { value }) =>
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
            background: "#2563eb",
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

export const customerColumns = [
  {
    prop: "customer",
    name: "Customer",
    cellTemplate: nameCell,
    size: 180,
  },
  {
    prop: "lastYear",
    name: "Last Year",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "thisYear",
    name: "This Year",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "variance",
    name: "Variance %",
    cellTemplate: varianceCell,
    size: 120,
  },
];

export const manufacturerColumns = [
  {
    prop: "factory",
    name: "Manufacturer",
    cellTemplate: nameCell,
    size: 180,
  },
  {
    prop: "lastYear",
    name: "Last Year",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "thisYear",
    name: "This Year",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "variance",
    name: "Variance %",
    cellTemplate: varianceCell,
    size: 120,
  },
];

export const productColumns = [
  {
    prop: "category",
    name: "Product Name",
    cellTemplate: nameCell,
    size: 180,
  },
  {
    prop: "lastYear",
    name: "Last Year",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "thisYear",
    name: "This Year",
    cellTemplate: amountCell,
    size: 120,
  },
  {
    prop: "variance",
    name: "Variance %",
    cellTemplate: varianceCell,
    size: 120,
  },
];

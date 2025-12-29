// Dummy data for development and testing

export const dummyFactories = [
  { id: "f1a2b3c4-d5e6-7890-abcd-ef1234567890", title: "Acme Manufacturing" },
  { id: "f2a3b4c5-d6e7-8901-bcde-f12345678901", title: "Beta Industries" },
  { id: "f3a4b5c6-d7e8-9012-cdef-123456789012", title: "Circuit Solutions" },
  { id: "f4a5b6c7-d8e9-0123-def0-234567890123", title: "Delta Electronics" },
  { id: "f5a6b7c8-d9e0-1234-ef01-345678901234", title: "Elite Manufacturing" },
];

// Generate monthly data for the past 36 months
const generateMonthlyData = (baseValue, variance = 0.3) => {
  const months = [];
  const now = new Date();

  for (let i = 35; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    // Add some randomness and a general upward trend
    const trendFactor = 1 + (35 - i) * 0.01; // Slight upward trend
    const randomFactor = 1 + (Math.random() - 0.5) * variance;
    const value = baseValue * trendFactor * randomFactor;

    months.push({
      label: monthLabel,
      value: value.toFixed(2),
    });
  }

  return months;
};

export const dummyAggregatedSales = {
  title: "Sales by Month",
  data: generateMonthlyData(500000, 0.4),
  metadata: {
    start_date: "2022-01-01",
    end_date: "2024-12-31",
    record_count: 36,
    total_value: "18000000.00",
  },
};

export const dummyProductTrends = {
  title: "Product Trends by Factory",
  factoryId: "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
  factoryName: "Acme Manufacturing",
  products: [
    {
      productId: "p1",
      productName: "XFRM-100KVA-480V",
      totalSales: "1250000.00",
      monthlyData: generateMonthlyData(35000, 0.3),
    },
    {
      productId: "p2",
      productName: "XFRM-75KVA-480V",
      totalSales: "980000.00",
      monthlyData: generateMonthlyData(27000, 0.35),
    },
    {
      productId: "p3",
      productName: "XFRM-50KVA-240V",
      totalSales: "875000.00",
      monthlyData: generateMonthlyData(24000, 0.25),
    },
    {
      productId: "p4",
      productName: "XFRM-25KVA-240V",
      totalSales: "720000.00",
      monthlyData: generateMonthlyData(20000, 0.4),
    },
    {
      productId: "p5",
      productName: "CTRL-PANEL-A1",
      totalSales: "650000.00",
      monthlyData: generateMonthlyData(18000, 0.3),
    },
    {
      productId: "p6",
      productName: "CTRL-PANEL-B2",
      totalSales: "580000.00",
      monthlyData: generateMonthlyData(16000, 0.35),
    },
    {
      productId: "p7",
      productName: "SWITCH-GEAR-100A",
      totalSales: "520000.00",
      monthlyData: generateMonthlyData(14500, 0.28),
    },
    {
      productId: "p8",
      productName: "SWITCH-GEAR-200A",
      totalSales: "480000.00",
      monthlyData: generateMonthlyData(13300, 0.32),
    },
    {
      productId: "p9",
      productName: "CAP-BANK-50KVAR",
      totalSales: "420000.00",
      monthlyData: generateMonthlyData(11700, 0.38),
    },
    {
      productId: "p10",
      productName: "CAP-BANK-100KVAR",
      totalSales: "380000.00",
      monthlyData: generateMonthlyData(10500, 0.3),
    },
  ],
  metadata: {
    start_date: "2022-01-01",
    end_date: "2024-12-31",
    top_n: 10,
    product_count: 10,
  },
};

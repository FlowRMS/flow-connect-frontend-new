"use client";

import {
  FileText,
  Grid,
  LayoutDashboard,
  Receipt,
  Quote,
  FileSpreadsheet,
  TrendingDown,
} from "lucide-react";

const MENU_CONFIG = [
  {
    id: "order-dashboard",
    name: "Order Dashboard",
    href: "/order-dashboard",
    Icon: LayoutDashboard,
    type: "link",
  },
  {
    id: "product-dashboard",
    name: "Product Dashboard",
    href: "/product-dashboard",
    Icon: LayoutDashboard,
    type: "link",
  },
  {
    id: "commission-gap-reports",
    name: "Commission Gap Reports",
    href: "/commission-gap-reports",
    Icon: TrendingDown,
    type: "link",
  },
  {
    id: "detail-reports",
    name: "Detail Reports",
    Icon: FileText,
    type: "group",
    children: [
      {
        id: "orders-report",
        name: "Orders Detail",
        href: "/orders-report",
        Icon: FileText,
      },
      {
        id: "check-detail",
        name: "Check Detail",
        href: "/check-detail",
        Icon: Receipt,
      },
      {
        id: "quote-detail",
        name: "Quote Detail",
        href: "/quote-detail",
        Icon: Quote,
      },
      // {
      //   id: "invoice-detail",
      //   name: "Invoice Detail",
      //   href: "/invoice-detail",
      //   Icon: FileSpreadsheet,
      // },
      {
        id: "order-split-rate-commission-detail",
        name: "Order Split Rate Report",
        href: "/order-split-rate-commission-detail",
        Icon: Receipt,
      },
    ],
  },
  {
    id: "pivots",
    name: "Pivots",
    Icon: Grid,
    type: "group",
    children: [
      {
        id: "order-pivot",
        name: "Order Pivot",
        href: "/orders-pivot",
        Icon: Grid,
      },
      {
        id: "check-pivot",
        name: "Check Pivot",
        href: "/check-pivot",
        Icon: Grid,
      },
      {
        id: "quote-pivot",
        name: "Quote Pivot",
        href: "/quote-pivot",
        Icon: Grid,
      },
      // {
      //   id: "invoice-pivot",
      //   name: "Invoice Pivot",
      //   href: "/invoice-pivot",
      //   Icon: Grid,
      // },
      {
        id: "commission-by-state-pivot",
        name: "Commission by State",
        href: "/commission-by-state-pivot",
        Icon: Grid,
      },
    ],
  },
];

export const menuItems = MENU_CONFIG;
export default menuItems;

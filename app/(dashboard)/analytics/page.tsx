"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPage() {
  useEffect(() => {
    // Redirect to order-dashboard on client side
    window.location.href = "/analytics/order-dashboard";
  }, []);

  // Also attempt server-side redirect
  redirect("/analytics/order-dashboard");
  
  return null;
}


"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        className: "toast-message",
        style: {
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        },
        success: {
          style: {
            border: "1px solid #10b981",
            background: "#f0fdf4",
          },
          icon: "✓",
        },
        error: {
          style: {
            border: "1px solid #ef4444",
            background: "#fef2f2",
          },
          icon: "✕",
        },
        warning: {
          style: {
            border: "1px solid #f59e0b",
            background: "#fffbeb",
          },
          icon: "⚠",
        },
        info: {
          style: {
            border: "1px solid #3b82f6",
            background: "#eff6ff",
          },
          icon: "ℹ",
        },
      }}
      richColors
      closeButton
      duration={3000}
    />
  );
}

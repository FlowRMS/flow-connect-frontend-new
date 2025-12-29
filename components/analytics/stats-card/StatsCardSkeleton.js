"use client";

import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { cn } from "@/lib/analytics/lib/cn";

const StatsCardSkeleton = ({
  className,
  showIcon = true,
  showTrend = true,
  // variant = "default",
}) => {
  return (
    <SkeletonTheme baseColor="#f1f5f9" highlightColor="#f8fafc" duration={1.2}>
      <div
        className={cn("bg-white rounded-lg border p-6 shadow-sm", className)}
      >
        <div className="flex items-center justify-between space-y-0 pb-2">
          <div className="flex-1">
            <Skeleton height={16} width={120} />
          </div>
          {showIcon && (
            <div className="h-4 w-4">
              <Skeleton circle height={16} width={16} />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline space-x-2">
            <Skeleton height={28} width={80} />
            {showTrend && <Skeleton height={14} width={40} />}
          </div>
          <Skeleton height={12} width={140} />
        </div>
      </div>
    </SkeletonTheme>
  );
};

const DashboardCardsSkeleton = ({ count = 4, className }) => {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <StatsCardSkeleton
          key={index}
          showIcon={true}
          showTrend={index % 2 === 0} // Deterministic pattern to avoid hydration mismatch
        />
      ))}
    </div>
  );
};

export { StatsCardSkeleton, DashboardCardsSkeleton };


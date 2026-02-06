import React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg bg-card border border-border shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-3", className)}>{children}</div>;
}

export function CardTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function CardContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-2", className)}>{children}</div>;
} 

export default Card;

import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
}

const variants = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
};

export function Badge({ variant = "default", className, children, ...rest }: BadgeProps) {
  const base = "inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium";
  const variantClass = variants[variant] || variants.default;
  return (
    <span className={cn(base, variantClass, className)} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
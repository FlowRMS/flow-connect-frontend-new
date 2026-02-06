import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "link" | "outline";
  asChild?: boolean; // If true, render children directly (useful with next/link)
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function Button({ variant = "default", asChild, size = "default", className, children, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none";
  const sizeStyles =
    size === "sm" ? "px-2.5 py-1.5 text-sm" : size === "lg" ? "px-4 py-3 text-base" : size === "icon" ? "p-2 w-9 h-9" : "px-3 py-2 text-sm"; 

  const variantClass =
    variant === "ghost"
      ? "bg-transparent hover:bg-muted"
      : variant === "outline"
      ? "border border-border bg-transparent"
      : variant === "link"
      ? "bg-transparent underline text-primary"
      : "bg-primary text-white hover:bg-primary-hover";

  const classes = cn(base, sizeStyles, variantClass, className);

  if (asChild && React.isValidElement(children)) {
    // Clone child (e.g., next/link) and merge classes. Use any casts for compatibility.
    return React.cloneElement(children as React.ReactElement, ({
      className: cn((children as any)?.props?.className, classes),
    } as any));
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

export default Button;

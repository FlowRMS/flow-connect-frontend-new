import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export function Label({ className, children, ...rest }: LabelProps) {
  return (
    <label className={cn("text-sm font-medium text-muted-foreground", className)} {...rest}>
      {children}
    </label>
  );
}

export default Label;

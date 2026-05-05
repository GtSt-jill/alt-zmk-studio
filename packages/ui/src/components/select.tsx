import * as React from "react";
import { cn } from "../utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

import * as React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "neo-input h-11 w-full rounded-2xl px-4 py-2 text-sm text-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/40",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export { Select };

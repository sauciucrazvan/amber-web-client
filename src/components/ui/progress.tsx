import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: number | null;
  indeterminate?: boolean;
  intent?: "default" | "success" | "destructive";
};

function Progress({
  className,
  value,
  indeterminate = false,
  intent = "default",
  ...props
}: ProgressProps) {
  const isDeterminate = typeof value === "number" && !Number.isNaN(value);

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={
        isDeterminate ? Math.max(0, Math.min(100, value ?? 0)) : undefined
      }
      className={cn(
        "bg-muted relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all",
          intent === "destructive" && "bg-destructive",
          intent === "success" && "bg-emerald-500",
          intent === "default" && "bg-primary",
          indeterminate &&
            "absolute inset-y-0 left-0 w-1/3 animate-[amber-bar-sweep_1.15s_ease-in-out_infinite]",
        )}
        style={
          indeterminate
            ? undefined
            : {
                width: `${isDeterminate ? Math.max(0, Math.min(100, value)) : 0}%`,
              }
        }
      />
    </div>
  );
}

export { Progress };

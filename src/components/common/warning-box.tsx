import { TriangleAlert } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function WarningBox({ children }: Props) {
  return (
    <div className="rounded-md border border-amber-600 text-amber-600 bg-amber-600/5 dark:border-amber-400 dark:text-amber-400 dark:bg-amber-400/5 px-3 py-2">
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-4 shrink-0" />
        <p className="text-xs">{children}</p>
      </div>
    </div>
  );
}

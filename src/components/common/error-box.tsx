import { ShieldAlert } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function ErrorBox({ children }: Props) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 mt-2">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 shrink-0 text-destructive" />
        <p className="text-xs text-destructive">{children}</p>
      </div>
    </div>
  );
}

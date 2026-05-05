import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  const amberLogoSrc = `${import.meta.env.BASE_URL}amber.png`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-8">
        <img
          src={amberLogoSrc}
          alt="Amber logo"
          width={64}
          height={64}
          draggable={false}
          className="opacity-90"
        />
        <Spinner className="text-muted-foreground size-6" />
      </div>
    </div>
  );
}

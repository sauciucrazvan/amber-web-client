import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiUrl } from "@/config";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

export default function RequestData({ children }: Props) {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/account/v1/request/data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json().catch(() => null);
      setError(data?.detail);

      if (res.ok) {
        toast.success(t("settings.account.data.toast"));
        setOpen(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occured");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form className="w-full">
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] min-h-25 overflow-hidden sm:max-w-125 flex flex-col gap-4 p-0">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6">
              <DialogHeader>
                <DialogTitle>{t("settings.account.data.title")}</DialogTitle>
                <DialogDescription>
                  {t("settings.account.data.description")}
                </DialogDescription>
              </DialogHeader>
              {/* content */}
              {error && (
                <p className="wrap-break-word text-red-500">{t(error)}</p>
              )}
            </div>

            <section className="mt-auto w-full flex flex-wrap items-center justify-end gap-1 border-t bg-muted/50 px-4 py-3 sm:px-6 sm:py-4">
              <Button
                variant="outline"
                className="cursor-pointer"
                type="button"
                onClick={() => setOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                {t("settings.account.data.action")}
              </Button>
            </section>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}

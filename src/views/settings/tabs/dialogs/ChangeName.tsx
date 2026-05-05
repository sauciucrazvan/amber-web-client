import { useAuth } from "@/auth/AuthContext";
import ErrorBox from "@/components/common/error-box";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/config";
import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

export default function ChangeName({ children }: Props) {
  const { t, i18n } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/account/v1/modify/fullname"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          new_full_name: fullName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const detail = data?.detail;

        if (typeof detail === "string") {
          throw new Error(detail);
        }

        if (detail && typeof detail === "object") {
          const message = (detail as { message?: unknown }).message;
          const rd = (detail as { remaining_days?: unknown }).remaining_days;

          if (typeof rd === "number") setRemainingDays(rd);
          if (typeof message === "string") throw new Error(message);
        }

        throw new Error(`Request failed (${res.status})`);
      }

      toast.success(t("settings.account.name.updated"));
      setOpen(false);
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
          <DialogContent className="sm:max-w-125 min-h-50 max-h-75 flex flex-col gap-4 p-0">
            <div className="flex flex-1 flex-col gap-4 px-6 pt-6">
              <DialogHeader>
                <DialogTitle>{t("settings.account.name.title")}</DialogTitle>
                <DialogDescription>
                  {t("settings.account.name.description")}
                </DialogDescription>
              </DialogHeader>
              {/* content */}
              <Input
                placeholder={t("register.fullnamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSubmit();
                  }
                }}
              />

              {error && (
                <ErrorBox>
                  {i18n.exists(error) ? (
                    <Trans
                      i18nKey={error}
                      values={{ days: remainingDays ?? 0 }}
                      components={{ time: <span /> }}
                    />
                  ) : remainingDays !== null ? (
                    `${error} (${remainingDays} days)`
                  ) : (
                    error
                  )}
                </ErrorBox>
              )}
            </div>

            <section className="mt-auto w-full flex items-center justify-end gap-1 border-t bg-muted/50 px-6 py-4">
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
                {t("common.submit")}
              </Button>
            </section>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}

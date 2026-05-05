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
import { Separator } from "@/components/ui/separator";
import { apiUrl } from "@/config";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  children?: React.ReactNode;
}

export default function ChangePassword({ children }: Props) {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(0);

  const onSubmit = async () => {
    setError(null);

    if (stage === 0) {
      setStage(1);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl("/account/v1/modify/password"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });

      const data = await res.json().catch(() => null);
      setError(data?.detail);

      if (res.ok) {
        toast.success(t("settings.account.password.updated"));
        setOpen(false);
        setStage(0);
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
          <DialogTrigger asChild>
            {children ?? (
              <Button variant="link" className="cursor-pointer">
                {t("settings.account.password.title")}
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] min-h-50 overflow-hidden sm:max-w-125 flex flex-col gap-4 p-0">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6">
              <DialogHeader>
                <DialogTitle>
                  {t("settings.account.password.title")}
                </DialogTitle>
                <DialogDescription>
                  {t("settings.account.password.description")}
                </DialogDescription>
              </DialogHeader>
              {/* content */}
              {stage == 0 && (
                <section className="flex flex-col items-start justify-start gap-2 w-full">
                  <Input
                    placeholder={t(
                      "settings.account.password.current_password",
                    )}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />
                </section>
              )}

              {stage == 1 && (
                <section className="flex flex-col items-start justify-start gap-2 w-full">
                  <Input
                    placeholder={t("settings.account.password.new_password")}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />

                  <Input
                    placeholder={t(
                      "settings.account.password.new_password_confirmation",
                    )}
                    type="password"
                    value={newPasswordConfirmation}
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />
                </section>
              )}

              {error && <ErrorBox>{t(error)}</ErrorBox>}
            </div>

            <section className="mt-auto w-full flex flex-wrap items-center gap-2 border-t bg-muted/50 px-4 py-3 sm:px-6 sm:py-4">
              <div className="inline-flex shrink-0 items-center gap-1 text-2xl cursor-default text-muted-foreground">
                <div className={stage >= 0 ? "text-foreground" : undefined}>
                  •
                </div>
                <div className={stage >= 1 ? "text-foreground" : undefined}>
                  •
                </div>
              </div>
              <Separator
                orientation="vertical"
                className="hidden h-6 sm:block"
              />
              <div className="ml-auto inline-flex w-full flex-wrap justify-end gap-1 sm:w-auto">
                {stage == 0 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                {stage == 1 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setStage(0)}
                  >
                    {t("login.recovery.action.back")}
                  </Button>
                )}
                <Button
                  variant="default"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                  type="button"
                  onClick={onSubmit}
                >
                  {stage == 1
                    ? t("common.submit")
                    : t("login.recovery.action.next")}
                </Button>
              </div>
            </section>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/config";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [stage, setStage] = useState(0);
  const { t } = useTranslation();

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      switch (stage) {
        case 0: {
          const res = await fetch(apiUrl("/account/v1/recovery/request"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: username,
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            const detail = data?.detail;
            if (res.status === 429) {
              throw new Error(detail || "common.errors.too_many_requests");
            }

            throw new Error(detail);
          }

          toast.success(t("login.recovery.sent"));
          setStage(1);
          break;
        }
        case 1: {
          setStage(2);
          break;
        }
        case 2: {
          const res = await fetch(apiUrl("/account/v1/recovery/reset"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: username,
              code: code,
              new_password: newPassword,
              new_password_confirmation: newPasswordConfirmation,
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            const detail = data?.detail;
            if (res.status === 429) {
              throw new Error(detail || "common.errors.too_many_requests");
            }

            throw new Error(detail);
          }

          toast.success(t("login.recovery.success"));
          setOpen(false);
          setStage(0);

          setUsername("");
          setNewPassword("");
          setNewPasswordConfirmation("");
          setCode("");
          break;
        }
        default: {
          setStage(0);
          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occured");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form>
          <DialogTrigger asChild>
            <Button
              data-slot="field-description"
              variant={"link"}
              className="mt-2 cursor-pointer text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center"
            >
              {t("login.forgotPassword")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col items-start justify-start">
            <DialogHeader>
              <DialogTitle>{t("login.recovery.title")}</DialogTitle>
              <DialogDescription>
                {t("login.recovery.description")}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            {stage == 0 && (
              <>
                <Label>{t("login.recovery.username")}</Label>
                <Input
                  placeholder={t("login.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </>
            )}

            {stage == 1 && (
              <>
                <Label>{t("login.recovery.code")}</Label>
                <InputOTP value={code} onChange={setCode} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </>
            )}
            {stage == 2 && (
              <>
                <Label>{t("login.recovery.password")}</Label>
                <Input
                  placeholder={t("settings.account.password.new_password")}
                  type={"password"}
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
                  type={"password"}
                  value={newPasswordConfirmation}
                  onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                  disabled={isSubmitting}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </>
            )}

            {error && <p className="text-red-500">{t(error)}</p>}

            <section className="w-full inline-flex items-center justify-between gap-1">
              <div className="inline-flex items-center gap-1 w-full text-2xl cursor-default text-muted-foreground">
                <div className={stage >= 0 ? "text-foreground" : undefined}>
                  •
                </div>
                <div className={stage >= 1 ? "text-foreground" : undefined}>
                  •
                </div>
                <div className={stage >= 2 ? "text-foreground" : undefined}>
                  •
                </div>
              </div>
              <div className="w-full inline-flex justify-end gap-1">
                {stage == 0 ||
                  (stage == 1 && (
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      type="button"
                      onClick={() => setOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                  ))}
                {stage > 1 && (
                  <>
                    <Button
                      variant="outline"
                      className="cursor-pointer"
                      type="button"
                      onClick={() => setStage(Math.max(1, stage - 1))}
                    >
                      {t("login.recovery.action.back")}
                    </Button>
                  </>
                )}
                <Button
                  variant="default"
                  className="cursor-pointer"
                  disabled={isSubmitting || (stage === 1 && code.length !== 6)}
                  type="button"
                  onClick={onSubmit}
                >
                  {stage == 2
                    ? t("login.recovery.action.finish")
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

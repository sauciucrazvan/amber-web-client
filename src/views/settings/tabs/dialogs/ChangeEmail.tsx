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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiUrl } from "@/config";
import React from "react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  children?: React.ReactNode;
}

export default function ChangeEmail({ children }: Props) {
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [stage, setStage] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      switch (stage) {
        case 0: {
          const res = await fetch(apiUrl("/account/v1/modify/email/request"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              new_email: email,
              password: password,
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

          toast.success(t("settings.account.email.verify_sent"));
          setStage(1);
          break;
        }
        case 1: {
          if (isConfirmed) {
            setStage(2);
            break;
          }

          const res = await fetch(apiUrl("/account/v1/modify/email/confirm"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              code: confirmCode,
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

          setIsConfirmed(true);
          setStage(2);
          break;
        }
        case 2: {
          const res = await fetch(apiUrl("/account/v1/modify/email/verify"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              code: verifyCode,
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

          toast.success(t("settings.account.email.updated"));

          setOpen(false);
          setStage(0);
          setIsConfirmed(false);

          setEmail("");
          setPassword("");
          setConfirmCode("");
          setVerifyCode("");
          break;
        }
        default: {
          setStage(0);
          setIsConfirmed(false);
          break;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occured");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  const descriptionKey =
    stage == 0
      ? "settings.account.email.request_description"
      : stage == 1
        ? "settings.account.email.confirm_description"
        : "settings.account.email.verify_description";

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form className="w-full">
          <DialogTrigger asChild>
            {children ?? (
              <Button variant="link" className="cursor-pointer">
                {t("settings.account.email.title")}
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] min-h-25 overflow-hidden sm:max-w-125 flex flex-col gap-4 p-0">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-6 pt-6">
              <DialogHeader>
                <DialogTitle>{t("settings.account.email.title")}</DialogTitle>
                <DialogDescription>
                  <Trans
                    i18nKey={descriptionKey}
                    values={{ email }}
                    components={{ b: <b /> }}
                  />
                </DialogDescription>
              </DialogHeader>
              {stage == 0 && (
                <>
                  <Label>{t("register.emailPlaceholder")}</Label>
                  <Input
                    placeholder={t("register.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />

                  <Input
                    placeholder={t("login.passwordPlaceholder")}
                    type={"password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <Label>{t("settings.account.email.confirm_code")}</Label>
                  <InputOTP
                    className="w-full min-w-0 justify-center"
                    maxLength={6}
                    value={confirmCode}
                    onChange={setConfirmCode}
                    disabled={isSubmitting}
                    inputMode="numeric"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  >
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
                  <Label>{t("settings.account.email.verify_code")}</Label>
                  <InputOTP
                    className="w-full min-w-0 justify-center"
                    maxLength={6}
                    value={verifyCode}
                    onChange={setVerifyCode}
                    disabled={isSubmitting}
                    inputMode="numeric"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  >
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
                <div className={stage >= 2 ? "text-foreground" : undefined}>
                  •
                </div>
              </div>
              <Separator
                orientation="vertical"
                className="hidden h-6 sm:block"
              />
              <div className="ml-auto inline-flex w-full flex-wrap justify-end gap-1 sm:w-auto">
                {stage <= 1 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                )}
                {stage > 1 && (
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setStage(Math.max(1, stage - 1))}
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

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { apiUrl } from "@/config";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface VerifyAccountProps {
  children?: React.ReactNode;
}

export default function VerifyAccount({ children }: VerifyAccountProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [code, setCode] = useState("");

  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAuth();

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      switch (stage) {
        case 0: {
          const res = await fetch(apiUrl("/auth/v1/verify/request"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            const detail = data?.detail;
            if (res.status === 429) {
              throw new Error(detail || "common.errors.too_many_requests");
            }

            throw new Error(detail);
          }

          toast.success(t("register.verify.email_sent"));
          setStage(1);
          break;
        }
        case 1: {
          const res = await fetch(apiUrl("/auth/v1/verify"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              verify_code: code,
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

          toast.success(t("register.verify.success"));

          setStage(0);
          setCode("");
          setOpen(false);
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

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent className="sm:max-w-125 min-h-25 max-h-100 flex flex-col gap-4 p-0">
          <div className="flex flex-1 flex-col gap-4 px-6 pt-6">
            <DialogHeader>
              <DialogTitle>{t("register.verify.title")}</DialogTitle>
              <DialogDescription>
                {t(
                  stage == 0
                    ? "register.verify.description.step_one"
                    : "register.verify.description.step_two",
                )}
              </DialogDescription>
            </DialogHeader>
            {/* content */}
            {stage == 1 && (
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
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
            )}

            {error && <p className="text-red-500">{t(error)}</p>}
          </div>

          <section className="mt-auto w-full flex items-center justify-between gap-4 border-t bg-muted/50 px-6 py-4">
            <div className="inline-flex items-center gap-1 w-full text-2xl cursor-default text-muted-foreground">
              <div className={stage >= 0 ? "text-foreground" : undefined}>
                •
              </div>
              <div className={stage >= 1 ? "text-foreground" : undefined}>
                •
              </div>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="w-full inline-flex justify-end gap-1">
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
                <>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    type="button"
                    onClick={() => setStage(Math.max(0, stage - 1))}
                  >
                    {t("register.verify.action.back")}
                  </Button>
                </>
              )}
              <Button
                variant="default"
                className="cursor-pointer"
                disabled={isSubmitting}
                type="button"
                onClick={onSubmit}
              >
                {stage == 1
                  ? t("register.verify.action.finish")
                  : t("register.verify.action.next")}
              </Button>
            </div>
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}

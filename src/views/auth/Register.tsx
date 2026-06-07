import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/auth/AuthContext";
import { AtSign } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import Settings from "../settings/Settings";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import React from "react";
import Autoplay from "embla-carousel-autoplay";
import TermsView from "./dialogs/legal/Terms";
import PrivacyView from "./dialogs/legal/Privacy";
import ErrorBox from "@/components/common/error-box";

interface ApiErrorItem {
  error: string;
  field: string;
}

export default function RegisterView() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  // Destructure registerMutation directly from useAuth context
  const { register, registerMutation } = useAuth() as any;

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setFallbackError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register({
        username,
        password,
        fullName,
        email: email.trim() ? email.trim() : undefined,
      });
      setLocation("/");
      toast.success(t("register.greeting"));
    } catch (e: any) {
      // Pull directly from SWR's raw error state instance linked to the fetcher execution
      const swrRawError = registerMutation?.error;
      let targetData =
        swrRawError?.body || swrRawError?.response?.data || swrRawError || e;

      if (typeof targetData === "string") {
        try {
          targetData = JSON.parse(targetData);
        } catch (_) {}
      }

      const errorsArray: ApiErrorItem[] | undefined =
        targetData?.detail?.errors || targetData?.errors;

      if (errorsArray && Array.isArray(errorsArray)) {
        const mappedErrors: Record<string, string> = {};
        errorsArray.forEach((err) => {
          mappedErrors[err.field] = err.error;
        });
        setFieldErrors(mappedErrors);
      } else {
        setFallbackError(
          e instanceof Error ? e.message : "Registration failed",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true }),
  );

  return (
    <>
      <section className="flex h-full w-full gap-0 border-t">
        <section className="hidden w-[50%] bg-primary/5 md:flex flex-col items-center justify-center border-border border-r">
          <Carousel
            plugins={[plugin.current]}
            className="w-full max-w-40 md:max-w-xs"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <img
                      src={"slides/" + index + ".png"}
                      className="rounded-[2px]"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
        <section className="w-full bg-background flex flex-col items-start justify-start p-4 border-border md:w-[50%]">
          <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
            {t("register.loginPrompt")}
            <a
              className="text-primary hover:underline cursor-pointer"
              onClick={() => setLocation("/login")}
            >
              {t("register.loginLink")}
            </a>
          </div>

          <div className="flex flex-col w-full h-full justify-center items-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("register.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("register.subtitle")}
            </p>

            <div className="w-75 mt-4 flex flex-col gap-2">
              <div
                data-invalid={fieldErrors.username ? true : undefined}
                className="flex flex-col gap-1"
              >
                {fieldErrors.username && (
                  <label
                    htmlFor="username"
                    className="text-destructive text-[11px] font-normal leading-none tracking-wide pl-0.5 mb-0.5"
                  >
                    {t(fieldErrors.username)}
                  </label>
                )}
                <InputGroup>
                  <InputGroupInput
                    id="username"
                    placeholder={t("register.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={fieldErrors.username ? true : undefined}
                    className={
                      fieldErrors.username
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />
                  <InputGroupAddon>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          variant="ghost"
                          aria-label={t("common.help")}
                          size="icon-xs"
                        >
                          <AtSign />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("register.usernameHint")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div
                data-invalid={fieldErrors.full_name ? true : undefined}
                className="flex flex-col gap-1"
              >
                {fieldErrors.full_name && (
                  <label
                    htmlFor="full_name"
                    className="text-destructive text-[11px] font-normal leading-none tracking-wide pl-0.5 mb-0.5"
                  >
                    {t(fieldErrors.full_name)}
                  </label>
                )}
                <Input
                  id="full_name"
                  placeholder={t("register.fullnamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={fieldErrors.full_name ? true : undefined}
                  className={
                    fieldErrors.full_name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </div>

              <div
                data-invalid={fieldErrors.email ? true : undefined}
                className="flex flex-col gap-1"
              >
                {fieldErrors.email && (
                  <label
                    htmlFor="email"
                    className="text-destructive text-[11px] font-normal leading-none tracking-wide pl-0.5 mb-0.5"
                  >
                    {t(fieldErrors.email)}
                  </label>
                )}
                <Input
                  id="email"
                  placeholder={t("register.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={fieldErrors.email ? true : undefined}
                  className={
                    fieldErrors.email
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </div>

              <div
                data-invalid={fieldErrors.password ? true : undefined}
                className="flex flex-col gap-1"
              >
                {fieldErrors.password && (
                  <label
                    htmlFor="password"
                    className="text-destructive text-[11px] font-normal leading-none tracking-wide pl-0.5 mb-0.5"
                  >
                    {t(fieldErrors.password)}
                  </label>
                )}
                <Input
                  id="password"
                  placeholder={t("register.passwordPlaceholder")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={fieldErrors.password ? true : undefined}
                  className={
                    fieldErrors.password
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      onSubmit();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 mt-4 w-75">
              {fallbackError ? <ErrorBox>{t(fallbackError)}</ErrorBox> : null}

              <Button
                className="cursor-pointer"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {t("register.createAccount")}
              </Button>

              <p
                data-slot="field-description"
                className="text-muted-foreground text-sm leading-normal font-normal [[data-variant=legend]+&amp;]:-mt-1.5 [&amp;&gt;a:hover]:text-primary [&amp;&gt;a]:underline [&amp;&gt;a]:underline-offset-4 px-6 text-center"
              >
                <Trans
                  i18nKey="register.terms"
                  components={{
                    terms: <TermsView />,
                    privacy: <PrivacyView />,
                  }}
                />
              </p>
            </div>
          </div>

          <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
            <Settings minimalViews={true} />
          </div>
        </section>
      </section>
    </>
  );
}

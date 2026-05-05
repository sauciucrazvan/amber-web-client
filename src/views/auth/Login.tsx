import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/AuthContext";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import Settings from "../settings/Settings";
import { toast } from "sonner";
import ForgotPassword from "./dialogs/ForgotPassword";
import React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import ErrorBox from "@/components/common/error-box";

export default function LoginView() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      setLocation("/");
      toast.success(t("login.greeting"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
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
        {/* Application Info */}
        <section className="w-[50%] bg-primary/5 flex flex-col items-center justify-center border-border border-r">
          <Carousel
            plugins={[plugin.current]}
            className="w-full max-w-40 sm:max-w-xs"
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
        <section className="w-[50%] bg-background flex flex-col items-start justify-start p-4 border-border">
          {/* Register */}
          <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
            {t("login.registerPrompt")}
            <a
              className="text-primary hover:underline cursor-pointer"
              onClick={() => setLocation("/register")}
            >
              {t("login.registerLink")}
            </a>
          </div>

          {/* Register */}
          <div className="flex flex-col w-full h-full justify-center items-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("login.title")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("login.subtitle")}
            </p>

            <div className="w-75 mt-4 flex flex-col gap-2">
              {/* Username */}
              <Input
                placeholder={t("login.usernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSubmit();
                  }
                }}
              />

              {/* Password */}
              <Input
                placeholder={t("login.passwordPlaceholder")}
                type={"password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSubmit();
                  }
                }}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4 mt-4 w-75">
              {error ? <ErrorBox>{t(error)}</ErrorBox> : null}

              {/* Login */}
              <Button
                className="cursor-pointer"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {t("login.signIn")}
              </Button>
            </div>

            <ForgotPassword />
          </div>

          {/* Settings */}
          <div className="text-muted-foreground flex w-full justify-end items-center gap-1">
            <Settings minimalViews={true} />
          </div>
        </section>
      </section>
    </>
  );
}

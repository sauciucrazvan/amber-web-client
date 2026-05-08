import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeAppLanguage,
  supportedLanguages,
  type SupportedLanguage,
} from "@/i18n";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function GeneralTab() {
  const { t, i18n } = useTranslation();

  const activeLanguage = useMemo<SupportedLanguage>(() => {
    const base = (i18n.resolvedLanguage ?? i18n.language ?? "en")
      .toLowerCase()
      .split("-")[0];

    return supportedLanguages.includes(base as SupportedLanguage)
      ? (base as SupportedLanguage)
      : "en";
  }, [i18n.language, i18n.resolvedLanguage]);

  const languageOptions = supportedLanguages
    .map((code) => ({
      code,
      label: t(`settings.general.language.options.${code}`),
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );

  return (
    <div className="flex min-h-0 h-full w-full flex-col">
      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">
            {t("settings.general.language.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.general.language.description")}
          </p>
        </div>

        <Select
          value={activeLanguage}
          onValueChange={(value) => {
            const next = supportedLanguages.includes(value as SupportedLanguage)
              ? (value as SupportedLanguage)
              : "en";
            void changeAppLanguage(next);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((opt) => (
              <SelectItem key={opt.code} value={opt.code}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col items-center text-center gap-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Download className="size-5" />
        </div>
        <div className="items-center">
          <div className="text-center font-bold text-sm">
            {t("downloadClient.title")}
          </div>
          <div className="text-center text-xs text-muted-foreground">
            {t("downloadClient.description")}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{t("downloadClient.meta.windows")}</span>
          <span
            className="h-1 w-1 rounded-full bg-muted-foreground/60"
            aria-hidden="true"
          />
          <span>{t("downloadClient.meta.size")}</span>
          <span
            className="h-1 w-1 rounded-full bg-muted-foreground/60"
            aria-hidden="true"
          />
          <span>{t("downloadClient.meta.updates")}</span>
        </div>
        <div className="w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <a
              href={
                "https://github.com/sauciucrazvan/amber-desktop-client/releases/latest"
              }
              target="_blank"
              rel="noreferrer"
            >
              {t("downloadClient.action.download")}
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("downloadClient.note")}
        </p>
      </div>

      <div className="mt-auto w-full pt-4 text-left text-xs text-muted-foreground">
        <a
          className="hover:text-primary underline-offset-4 hover:underline"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open(
              "https://github.com/sauciucrazvan/amber",
              "_blank",
              "noopener,noreferrer",
            );
          }}
          role="button"
          tabIndex={0}
        >
          {t("settings.general.help.action")}
        </a>
        <span className="px-2">•</span>
        <a
          className="hover:text-primary underline-offset-4 hover:underline"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open(
              "https://github.com/sauciucrazvan/amber/issues",
              "_blank",
              "noopener,noreferrer",
            );
          }}
          target="_blank"
          rel="noreferrer"
        >
          {t("settings.general.feedback.action")}
        </a>
      </div>
    </div>
  );
}

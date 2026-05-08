import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function Titlebar() {
  const { t } = useTranslation();

  return (
    <header className="bg-sidebar text-sidebar-foreground flex h-10 shrink-0 items-center justify-between px-3 select-none">
      <img
        src={`${import.meta.env.BASE_URL}amber.png`}
        alt="Amber logo"
        className="size-5"
        draggable={false}
      />

      <a
        className="text-center text-sm inline-flex items-center gap-0.5 hover:gap-1 hover:text-muted-foreground transition ease-in-out duration-300"
        href={
          "https://github.com/sauciucrazvan/amber-desktop-client/releases/latest"
        }
        target="_blank"
        rel="noreferrer"
      >
        {t("downloadClient.title")}

        <ArrowRight />
      </a>

      <div></div>
    </header>
  );
}

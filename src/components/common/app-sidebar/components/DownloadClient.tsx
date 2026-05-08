import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DownloadClient() {
  const { t } = useTranslation();
  const downloadUrl =
    "https://github.com/sauciucrazvan/amber-desktop-client/releases/latest";

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-none text-muted-foreground flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer rounded-lg"
          >
            <Download />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center gap-5">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Download className="size-5" />
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-center">
                {t("downloadClient.title")}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t("downloadClient.description")}
              </DialogDescription>
            </DialogHeader>
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
            <DialogFooter className="w-full flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <a href={downloadUrl} target="_blank" rel="noreferrer">
                  {t("downloadClient.action.download")}
                </a>
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" className="cursor-pointer">
                  {t("downloadClient.action.dismiss")}
                </Button>
              </DialogClose>
            </DialogFooter>
            <p className="text-xs text-muted-foreground">
              {t("downloadClient.note")}
            </p>
          </div>
        </DialogContent>
      </form>
    </Dialog>
  );
}

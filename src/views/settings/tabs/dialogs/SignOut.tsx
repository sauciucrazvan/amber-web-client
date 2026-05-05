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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Props {
  children: React.ReactNode;
}

export default function SignOut({ children }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form className="w-full">
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] min-h-40 overflow-hidden sm:max-w-125 flex flex-col gap-4 p-0">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6">
            <DialogHeader>
              <DialogTitle>{t("settings.account.signOut.title")}</DialogTitle>
              <DialogDescription>
                {t("settings.account.signOut.description")}
              </DialogDescription>
            </DialogHeader>
          </div>
          <section className="mt-auto w-full flex flex-wrap items-center justify-end gap-1 border-t bg-muted/50 px-4 py-3 sm:px-6 sm:py-4">
            <Button
              variant="outline"
              className="cursor-pointer"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              type="button"
              onClick={() => {
                logout();
                setLocation("/login");
                toast.success(t("settings.account.signOut.toast"));
              }}
            >
              {t("settings.account.signOut.action")}
            </Button>
          </section>
        </DialogContent>
      </form>
    </Dialog>
  );
}

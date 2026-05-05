import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, KeyRound, Mail, Trash2, UserRound } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ChangeEmail from "./ChangeEmail";
import ChangeName from "./ChangeName";
import ChangePassword from "./ChangePassword";
import DeleteAccount from "./DeleteAccount";

interface Props {
  children?: React.ReactNode;
}

export default function ManageAccountData({ children }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const rowClassName =
    "group w-full min-w-0 cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/70";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="w-full cursor-pointer" variant="outline">
            {t("settings.account.manage.title", "Manage account details")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden sm:max-w-125 p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-5 pt-5">
            <DialogHeader>
              <DialogTitle>
                {t("settings.account.manage.title", "Manage account details")}
              </DialogTitle>
              <DialogDescription>
                {t(
                  "settings.account.manage.description",
                  "Update your display name, email, and password from one place.",
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 p-1.5 shadow-sm">
              <ChangeName>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <UserRound className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("settings.account.name.title")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </ChangeName>

              <Separator className="my-1" />

              <ChangeEmail>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("settings.account.email.title")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </ChangeEmail>

              <Separator className="my-1" />

              <ChangePassword>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <KeyRound className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("settings.account.password.title")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </ChangePassword>

              <Separator className="my-1" />

              <DeleteAccount>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <Trash2 className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("settings.account.delete.title")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </DeleteAccount>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

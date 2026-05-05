import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddContact from "@/views/dialogs/AddContact";
import { Compass, Send, Sidebar, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function GetStarted() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto w-full max-w-sm cursor-pointer justify-start gap-3 rounded-xl px-4 py-3 text-left"
        >
          <Compass className="size-5 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-sm font-medium">
              {t("homepage.get_started", "Get Started")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t(
                "homepage.conversation.get_started_description",
                "Three quick steps to begin your first conversation.",
              )}
            </div>
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-1">
          <DialogTitle>{t("homepage.get_started", "Get Started")}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t(
              "homepage.conversation.get_started_description",
              "Three quick steps to begin your first conversation.",
            )}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              1
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {t("homepage.conversation.add_contacts")}
                </span>
                <AddContact>
                  <button
                    type="button"
                    className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    title={t("contacts.add.title")}
                  >
                    <UserRoundPlus className="size-4" />
                  </button>
                </AddContact>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(
                  "homepage.conversation.add_contacts_hint",
                  "Open the add-contact flow to invite someone by username.",
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {t("homepage.conversation.select")}
                </span>
                <Sidebar className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(
                  "homepage.conversation.select_hint",
                  "Choose a contact from the sidebar to open the chat.",
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {t("homepage.conversation.message")}
                </span>
                <Send className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(
                  "homepage.conversation.message_hint",
                  "Type your message and send it when you're ready.",
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

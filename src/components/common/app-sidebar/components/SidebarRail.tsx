import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UserAvatar from "@/components/common/user-avatar";
import MyProfile from "@/views/dialogs/MyProfile";
import {
  Inbox,
  MessageCircle,
  Phone,
  UserRoundPlus,
  Settings as SettingsIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { AccountMe } from "../types";
import { Button } from "@/components/ui/button";
import AddContact from "@/views/dialogs/AddContact";
import Settings from "@/views/settings/Settings";
import { Separator } from "@/components/ui/separator";

type SidebarRailProps = {
  railPaddingClass: string;
  tooltipSide: "left" | "right";
  requestCount: number;
  account: AccountMe | null;
  isAccountLoading: boolean;
  t: TFunction;
};

export default function SidebarRail({
  railPaddingClass,
  tooltipSide,
  requestCount,
  account,
  isAccountLoading,
  t,
}: SidebarRailProps) {
  return (
    <div className={`flex h-full w-12 flex-col ${railPaddingClass}`}>
      <div className="flex flex-col gap-2 justify-center items-center pt-1">
        <TabsList className="h-auto w-fit flex-col items-center justify-start gap-1 p-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <TabsTrigger
                  value="contacts"
                  aria-label={t("contacts.title")}
                  className="flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                >
                  <MessageCircle className="size-4" />
                  <span className="sr-only">{t("contacts.title")}</span>
                </TabsTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide} className="px-2 py-1 text-xs">
              {t("contacts.title")}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <TabsTrigger
                  value="call-history"
                  aria-label={t("calls.history.title", "Call history")}
                  className="flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                >
                  <Phone className="size-4" />
                  <span className="sr-only">
                    {t("calls.history.title", "Call history")}
                  </span>
                </TabsTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide} className="px-2 py-1 text-xs">
              {t("calls.history.title", "Call history")}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <TabsTrigger
                  value="requests"
                  aria-label={t("contacts.requests", "Requests")}
                  className="relative flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer"
                >
                  <Inbox className="size-4" />
                  {requestCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-medium">
                      {requestCount > 9 ? "9+" : requestCount}
                    </span>
                  )}
                  <span className="sr-only">
                    {t("contacts.requests", "Requests")}
                  </span>
                </TabsTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side={tooltipSide} className="px-2 py-1 text-xs">
              {t("contacts.requests.title", "Requests")}
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <div className="w-fit">
          <Tooltip>
            <AddContact>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  aria-label={t("contacts.add.title", "Add contact")}
                  className="border-none text-muted-foreground flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer rounded-lg"
                >
                  <UserRoundPlus className="size-4" />
                  <span className="sr-only">
                    {t("contacts.add.title", "Add contact")}
                  </span>
                </Button>
              </TooltipTrigger>
            </AddContact>
            <TooltipContent side={tooltipSide} className="px-2 py-1 text-xs">
              {t("contacts.add.title", "Add contact")}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="mt-auto flex flex-col w-full items-center justify-center py-2 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Settings
                minimalViews={false}
                trigger={
                  <Button
                    variant="outline"
                    aria-label={t("settings.title")}
                    className="border-none text-muted-foreground flex-none h-9 w-9 shrink-0 flex-col items-center gap-0.5 justify-center p-0 cursor-pointer rounded-lg"
                  >
                    <SettingsIcon className="size-4" />
                    <span className="sr-only">{t("settings.title")}</span>
                  </Button>
                }
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} className="px-2 py-1 text-xs">
            {t("settings.title")}
          </TooltipContent>
        </Tooltip>
        <Separator orientation="horizontal" />
        <MyProfile
          trigger={
            <section className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md p-0 transition ease-in-out duration-300 hover:bg-background">
              <UserAvatar
                full_name={account?.full_name}
                username={account?.username}
                avatarUrl={account?.avatar_url}
                isLoading={isAccountLoading}
                size="sm"
              />
            </section>
          }
        />
      </div>
    </div>
  );
}

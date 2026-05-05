import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Info, Paintbrush, SettingsIcon, User, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppearanceTab from "./tabs/AppearanceTab";
import AccountTab from "./tabs/AccountTab";
import GeneralTab from "./tabs/GeneralTab";
import AboutTab from "./tabs/AboutTab";
import DevicesTab from "./tabs/DevicesTab";

interface SettingsProps {
  minimalViews: boolean;
  trigger?: React.ReactNode;
}

export default function Settings(props: SettingsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  const sections = useMemo(
    () => [
      {
        id: "general",
        label: t("settings.tabs.general"),
        icon: SettingsIcon,
        content: <GeneralTab />,
      },
      {
        id: "appearance",
        label: t("settings.tabs.appearance"),
        icon: Paintbrush,
        content: <AppearanceTab />,
      },
      {
        id: "devices",
        label: t("settings.tabs.devices"),
        icon: Video,
        content: <DevicesTab />,
      },
      {
        id: "account",
        label: t("settings.tabs.account"),
        icon: User,
        content: <AccountTab />,
        disabled: props.minimalViews,
      },
      {
        id: "about",
        label: t("settings.tabs.about"),
        icon: Info,
        content: <AboutTab />,
      },
    ],
    [props.minimalViews, t],
  );

  const currentSection =
    sections.find((section) => section.id === activeSection) ?? sections[0];

  useEffect(() => {
    if (!currentSection?.disabled) return;
    setActiveSection("general");
  }, [currentSection]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey) return;
      if (event.key !== ",") return;
      if (event.repeat) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tagName === "input" ||
        tagName === "textarea" ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isTypingTarget) return;

      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <form>
          <DialogTrigger asChild>
            {props.trigger ? (
              props.trigger
            ) : (
              <Button variant="ghost" className="cursor-pointer">
                <SettingsIcon />
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="flex h-[75dvh] max-h-[75dvh] overflow-hidden p-0 sm:max-w-160">
            <DialogHeader className="sr-only">
              <DialogTitle>{t("settings.title")}</DialogTitle>
              <DialogDescription>{t("settings.description")}</DialogDescription>
            </DialogHeader>
            <SidebarProvider
              className="items-start h-full min-h-0 flex-1"
              style={{ "--sidebar-width": "12rem" } as React.CSSProperties}
            >
              <Sidebar collapsible="none" className="hidden md:flex">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {sections.map((section) => (
                          <SidebarMenuItem key={section.id}>
                            <SidebarMenuButton
                              size="default"
                              onClick={() =>
                                !section.disabled &&
                                setActiveSection(section.id)
                              }
                              isActive={section.id === currentSection?.id}
                              disabled={section.disabled}
                              tooltip={section.label}
                              className="cursor-pointer"
                            >
                              <section.icon />
                              <span>{section.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-14 shrink-0 items-center px-4">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <span>{t("settings.title")}</span>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentSection?.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </header>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
                  {currentSection?.content}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}

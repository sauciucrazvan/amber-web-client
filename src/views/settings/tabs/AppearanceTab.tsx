import { useTheme } from "@/components/theme/theme";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const fontOptions = useMemo(
    () => [
      { value: "80", label: "0.8x" },
      { value: "90", label: "0.9x" },
      {
        value: "100",
        label: `1.0x ${t("settings.appearance.scaling.defaultSuffix")}`,
      },
      { value: "120", label: "1.2x" },
      { value: "150", label: "1.5x" },
      { value: "200", label: "2x" },
    ],
    [t],
  );

  const [sidebarPos, setSidebarPos] = useState<string>(
    () => localStorage.getItem("amber.sidebarPos") ?? "left",
  );
  const [fontScale, setFontScale] = useState<string>(
    () => localStorage.getItem("amber.fontScale") ?? "100",
  );

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem("amber.fontScale", fontScale);
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem("amber.sidebarPos", sidebarPos);
  }, [sidebarPos]);

  return (
    <>
      {/* Theme */}
      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">
            {t("settings.appearance.theme.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.appearance.theme.description")}
          </p>
        </div>

        <Tabs defaultValue={theme}>
          <TabsList>
            <TabsTrigger
              className="cursor-pointer"
              value="dark"
              onClick={() => {
                setTheme("dark");
                localStorage.setItem("amber.theme", "dark");
              }}
            >
              <Moon className="text-purple-400" size="12" />
            </TabsTrigger>

            <TabsTrigger
              className="cursor-pointer"
              value="light"
              onClick={() => {
                setTheme("light");
                localStorage.setItem("amber.theme", "light");
              }}
            >
              <Sun className="text-yellow-400" size="12" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator className="mt-4" />

      {/* Scaling */}
      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">
            {t("settings.appearance.scaling.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.appearance.scaling.description")}
          </p>
        </div>

        <Select value={fontScale} onValueChange={setFontScale}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="100%" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>
                {t("settings.appearance.scaling.label")}
              </SelectLabel>
              {fontOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Sidebar position */}
      <div className="flex flex-row items-center justify-between gap-1 mt-2">
        <div>
          <h3 className="text-sm font-semibold text-primary">
            {t("settings.appearance.sidebarPosition.title")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.appearance.sidebarPosition.description")}
          </p>
        </div>

        <Select
          value={sidebarPos}
          onValueChange={(value) => (
            setSidebarPos(value),
            window.location.reload()
          )}
        >
          <SelectTrigger className="w-45">
            <SelectValue
              placeholder={t(
                "settings.appearance.sidebarPosition.options.left",
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>
                {t("settings.appearance.sidebarPosition.label")}
              </SelectLabel>
              <SelectItem value={"left"}>
                {t("settings.appearance.sidebarPosition.options.left")}
              </SelectItem>
              <SelectItem value={"right"}>
                {t("settings.appearance.sidebarPosition.options.right")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

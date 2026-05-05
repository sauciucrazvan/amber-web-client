import { BUILD_LABEL, BUILD_VERSION } from "@/build-info";
import { useTranslation } from "react-i18next";

const APP_NAME = "Amber";

export default function AboutTab() {
  const { t } = useTranslation();
  const majorVersion = BUILD_VERSION.split(".")[0] ?? BUILD_VERSION;

  return (
    <>
      <section className="mt-3 mx-auto flex flex-row w-full max-w-md items-center gap-2 text-start">
        <img
          src={`${import.meta.env.BASE_URL}amber.png`}
          alt={"Amber Logo"}
          className="size-14 shrink-0 rounded-xl"
          draggable={false}
        />

        <div>
          <h3 className="text-lg font-semibold">{`${APP_NAME} ${majorVersion}`}</h3>
          <p className="text-xs text-muted-foreground">{BUILD_LABEL}</p>
        </div>
      </section>

      <section className="my-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-sm font-semibold">
            {t("settings.about.tabs.data_for_nerds")}
          </h1>

          <section className="w-full flex flex-col gap-2 text-sm rounded-md border p-3 mt-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.buildNumber")}
              </span>
              <span>{BUILD_VERSION}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("settings.about.platform")}
              </span>
              <span>{navigator.platform}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Browser</span>
              <span className="truncate" title={navigator.userAgent}>
                {navigator.userAgent}
              </span>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

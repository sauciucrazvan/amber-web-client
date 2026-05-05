import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import ro from "@/locales/ro.json";
import de from "@/locales/de.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";
import zh from "@/locales/zh.json";
import ja from "@/locales/ja.json";
import it from "@/locales/it.json";

export const LANGUAGE_STORAGE_KEY = "amber.language";

export const supportedLanguages = ["en", "ro", "de", "fr", "es", "zh", "ja", "it"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

function normalizeToSupportedLanguage(language: string | undefined | null): SupportedLanguage {
    const base = (language ?? "").toLowerCase().split("-")[0];
    const candidate = base === "zh" ? "zh" : base;
    if (supportedLanguages.includes(candidate as SupportedLanguage)) {
        return candidate as SupportedLanguage;
    }
    return "en";
}

export function getStoredLanguage(): SupportedLanguage | undefined {
    if (typeof window === "undefined") {
        return undefined;
    }

    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (supportedLanguages.includes(stored as SupportedLanguage)) {
        return stored as SupportedLanguage;
    }

    return undefined;
}

export function setStoredLanguage(language: SupportedLanguage) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getInitialLanguage(): SupportedLanguage {
    const stored = getStoredLanguage();
    if (stored) {
        return stored;
    }

    const fromList = typeof navigator !== "undefined" ? navigator.languages?.[0] : undefined;
    const fromSingle = typeof navigator !== "undefined" ? navigator.language : undefined;
    return normalizeToSupportedLanguage(fromList ?? fromSingle);
}

void i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ro: { translation: ro },
            de: { translation: de },
            fr: { translation: fr },
            es: { translation: es },
            zh: { translation: zh },
            ja: { translation: ja },
            it: { translation: it },
        },
        lng: getInitialLanguage(),
        fallbackLng: "en",
        supportedLngs: [...supportedLanguages],
        interpolation: {
            escapeValue: false,
        },
    })
    .then(() => {
        const current = normalizeToSupportedLanguage(i18n.resolvedLanguage);
        setStoredLanguage(current);
    });

i18n.on("languageChanged", (lng) => {
    const current = normalizeToSupportedLanguage(lng);
    setStoredLanguage(current);
});

export async function changeAppLanguage(language: SupportedLanguage) {
    setStoredLanguage(language);
    await i18n.changeLanguage(language);
}

export default i18n;

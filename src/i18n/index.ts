import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import de from "./locales/de.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import hi from "./locales/hi.json";
import it from "./locales/it.json";
import nl from "./locales/nl.json";
import pl from "./locales/pl.json";

// English is the source, and every other language is translated from it. Add a language here, in LANGUAGES, and as a
// file in locales/ with the same keys as en.json (locales.test.ts checks).
export const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  nl: { translation: nl },
  pl: { translation: pl },
  hi: { translation: hi },
} as const;

export type Language = keyof typeof resources;

// Each in its own language, so people can find theirs whatever the app is showing
export const LANGUAGES: Record<Language, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  hi: "हिन्दी",
};

// Where a language picked in the app is kept, which the detector reads first
export const STORAGE_KEY = "i18nextLng";

// The page's language and text direction follow the app's, for screen readers and right-to-left languages. The one
// shown, rather than the one asked for, which falls back to English when it has no translation.
i18n.on("languageChanged", (lng: string) => {
  if (typeof document === "undefined") return;
  const shown: string = i18n.resolvedLanguage ?? lng;
  document.documentElement.lang = shown;
  document.documentElement.dir = i18n.dir(shown);
});

// Synchronous, as every language is bundled, so text is ready before the first render and in code outside React
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: Object.keys(resources),
    // "es-MX" uses "es"
    load: "languageOnly",
    // A language picked in the app wins over the browser's. Nothing is saved until then, so the app follows a change
    // to the phone's language.
    detection: { order: ["localStorage", "navigator"], lookupLocalStorage: STORAGE_KEY, caches: [] },
    // Tests check the English text, whatever the machine's language
    ...(import.meta.env.MODE === "test" ? { lng: "en" } : {}),
    // React escapes text already
    interpolation: { escapeValue: false },
    initAsync: false,
  });

// Switches language and remembers it. Storage can be unavailable (e.g. blocked site data), when the choice lasts
// until the page closes.
export const setLanguage = (language: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not saved, but still switched
  }
  void i18n.changeLanguage(language);
};

export default i18n;

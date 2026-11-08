import "i18next";
import type en from "./locales/en.json";

// Types t() from the English strings, so a missing or misspelt key fails tsc
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}

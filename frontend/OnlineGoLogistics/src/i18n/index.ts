import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./en";
import hi from "./hi";
import mr from "./mr";

const LANGUAGE_KEY = "user-language";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

// Language detection and storage persistence
const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!savedLanguage) {
    const locales = Localization.getLocales();
    const systemLanguage = locales[0]?.languageCode || "en";
    savedLanguage = resources[systemLanguage as keyof typeof resources] ? systemLanguage : "en";
  }

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: "v3",
      resources,
      lng: savedLanguage,
      fallbackLng: "en",
      interpolation: {
        escapeValue: false
      }
    } as any);
};

initI18n();

export default i18n;

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import en from "./en";
import hi from "./hi";
import mr from "./mr";

const LANGUAGE_KEY = "user-language";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

// Initialize i18n synchronously with default language
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  } as any);

// Language detection and storage persistence safely in client environment
const initI18n = async () => {
  try {
    // If evaluating in Node/SSR environment where window is undefined on web, skip AsyncStorage
    if (typeof window === "undefined" && Platform.OS === "web") {
      return;
    }

    let savedLanguage: string | null = null;
    try {
      savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (e) {
      // Ignore storage errors on initial load
    }

    if (!savedLanguage) {
      const locales = Localization.getLocales();
      const systemLanguage = locales[0]?.languageCode || "en";
      savedLanguage = resources[systemLanguage as keyof typeof resources] ? systemLanguage : "en";
    }

    if (savedLanguage && savedLanguage !== i18n.language) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.warn("Failed to load saved language:", error);
  }
};

initI18n();

export default i18n;

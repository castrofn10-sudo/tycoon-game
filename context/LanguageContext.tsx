import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  LANGUAGES,
  TRANSLATIONS,
  Translations,
  Language,
} from "@/constants/i18n";

const LANGUAGE_STORAGE_KEY = "@tycoon_game_language";

type LanguageContextType = {
  currentLanguage: Language;
  t: Translations;
  setLanguage: (code: string) => void;
  languages: Language[];
};

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: LANGUAGES[0],
  t: TRANSLATIONS["pt"],
  setLanguage: () => {},
  languages: LANGUAGES,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [langCode, setLangCode] = useState<string>("pt");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      if (saved && TRANSLATIONS[saved]) {
        setLangCode(saved);
      }
    });
  }, []);

  const setLanguage = useCallback((code: string) => {
    setLangCode(code);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  }, []);

  const currentLanguage =
    LANGUAGES.find((l) => l.code === langCode) ?? LANGUAGES[0];
  const t = TRANSLATIONS[langCode] ?? TRANSLATIONS["pt"];

  return (
    <LanguageContext.Provider
      value={{ currentLanguage, t, setLanguage, languages: LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

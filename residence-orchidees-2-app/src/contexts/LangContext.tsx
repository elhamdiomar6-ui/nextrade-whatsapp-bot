"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { type Lang, translations, type Translations } from "@/lib/i18n";

type LangContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  isRtl: boolean;
};

const LangContext = createContext<LangContextType>({
  lang: "fr",
  setLang: () => {},
  t: translations.fr,
  isRtl: false,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");

  return (
    <LangContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        isRtl: lang === "ar",
      }}
    >
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

import React, { createContext, useContext, useMemo, useState } from 'react';

type Language = 'bn' | 'en';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage: () => setLanguage(prev => (prev === 'en' ? 'bn' : 'en')) }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

export function tr(language: Language, en: string, bn: string) {
  return language === 'bn' ? bn : en;
}

export type { Language };

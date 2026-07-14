import { useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

export function translateText(text: string, language: Language): string {
  if (!text) return '';

  // Handle newlines as language separators (often Urdu first, then English)
  if (text.includes('\n')) {
    const parts = text.split('\n');
    if (parts.length === 2) {
      const hasUrdu = /[\u0600-\u06FF]/.test(text);
      if (hasUrdu) {
        return language === 'ur' ? parts[0].trim() : parts[1].trim();
      }
    }
  }

  // Handle slashes with spaces (e.g., "Properties / جائیدادیں")
  if (text.includes(' / ')) {
    const parts = text.split(' / ');
    return language === 'ur' ? parts[1]?.trim() || parts[0]?.trim() : parts[0]?.trim();
  }

  // Handle slashes without spaces (e.g., "Properties/جائیدادیں")
  if (text.includes('/') && !text.includes('://') && !text.startsWith('/')) {
    const hasUrdu = /[\u0600-\u06FF]/.test(text);
    if (hasUrdu) {
      const parts = text.split('/');
      return language === 'ur' ? parts[1]?.trim() || parts[0]?.trim() : parts[0]?.trim();
    }
  }

  return text;
}

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('rm_language') as Language) || 'ur';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (text: string): string => {
    return translateText(text, language);
  };

  const setLanguage = (lang: Language) => {
    localStorage.setItem('rm_language', lang);
    setLanguageState(lang);
  };

  return { language, setLanguage, t };
}

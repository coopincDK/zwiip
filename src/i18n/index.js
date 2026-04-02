import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import en from './translations/en';
import da from './translations/da';
import de from './translations/de';
import es from './translations/es';
import fr from './translations/fr';
import pt from './translations/pt';
import it from './translations/it';
import nl from './translations/nl';
import sv from './translations/sv';
import nb from './translations/nb';
import ja from './translations/ja';
import ko from './translations/ko';
import zh from './translations/zh';
import ar from './translations/ar';
import hi from './translations/hi';

const STORAGE_KEY = '@zwiip_language';

const translations = { en, da, de, es, fr, pt, it, nl, sv, nb, ja, ko, zh, ar, hi };

export const LANGUAGES = [
  { code: 'auto', label: 'Auto (system)' },
  { code: 'en', label: 'English' },
  { code: 'da', label: 'Dansk' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'nb', label: 'Norsk' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
];

function getDeviceLanguage() {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const code = locales[0].languageCode;
      // Map Norwegian variants
      if (code === 'no' || code === 'nn') return 'nb';
      return code;
    }
  } catch (e) {}
  return 'en';
}

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [override, setOverride] = useState('auto');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v) setOverride(v);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const setLanguage = useCallback(async (code) => {
    setOverride(code);
    try { await AsyncStorage.setItem(STORAGE_KEY, code); } catch (e) {}
  }, []);

  const deviceLang = getDeviceLanguage();
  const activeLang = override === 'auto' ? deviceLang : override;
  const strings = translations[activeLang] || translations.en;

  // t('key') or t('key', { count: 5 })
  const t = useCallback((key, params) => {
    let str = strings[key];
    if (str === undefined) {
      // Fallback to English
      str = en[key];
    }
    if (str === undefined) return key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  }, [strings]);

  if (!loaded) return null;

  return (
    <I18nContext.Provider value={{ t, language: activeLang, override, setLanguage, deviceLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

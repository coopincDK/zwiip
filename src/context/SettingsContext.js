import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { E } from '../constants/emoji';

const SettingsContext = createContext();

const STORAGE_KEY = '@zwiip_settings';

// Action types
export const ACTIONS = {
  DELETE: 'delete',
  KEEP: 'keep',
  ALBUM: 'album',
  SKIP: 'skip',
};

const DEFAULT_SETTINGS = {
  swipeLeft: { action: ACTIONS.DELETE, label: 'Slet', emoji: E.trash, albumName: '' },
  swipeRight: { action: ACTIONS.KEEP, label: 'Gem', emoji: E.heart, albumName: '' },
  swipeUp: { action: ACTIONS.SKIP, label: 'Spring over', emoji: E.skip, albumName: '' },
  swipeDown: { action: ACTIONS.SKIP, label: 'Spring over', emoji: E.skip, albumName: '' },
  skipAlbumPhotos: true,  // skip photos already sorted into albums
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Save settings (uses functional update to avoid stale closures)
  const updateSettings = useCallback(async (newSettings) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const updateDirection = useCallback(async (direction, config) => {
    setSettings(prev => {
      const newSettings = { ...prev, [direction]: { ...prev[direction], ...config } };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)).catch(() => {});
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Failed to reset settings:', e);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{
      settings,
      isLoaded,
      updateSettings,
      updateDirection,
      resetSettings,
      ACTIONS,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}

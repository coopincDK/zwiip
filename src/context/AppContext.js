import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';

const AppContext = createContext();
const LIFETIME_KEY = '@zwiip_lifetime_stats';
const PROCESSED_KEY = '@zwiip_processed_ids';

const initialLifetime = {
  totalReviewed: 0,
  totalKept: 0,
  totalTrashed: 0,
  totalDeleted: 0,
  mbFreed: 0,
  sessionsCompleted: 0,
  bestChallengeScore: 0,
  firstUsed: null,
  lastUsed: null,
  streakDays: 0,
  lastStreakDate: null,
};

const initialState = {
  kept: [],
  trashed: [],
  undoStack: [],
  sessionStats: { reviewed: 0, kept: 0, trashed: 0, startTime: null },
  lifetimeStats: { ...initialLifetime },
  currentIndex: 0,
  lifetimeLoaded: false,
  processedIds: new Set(),   // Persistent: all IDs ever swiped
  processedLoaded: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_LIFETIME': {
      return { ...state, lifetimeStats: { ...initialLifetime, ...action.payload }, lifetimeLoaded: true };
    }

    case 'LOAD_PROCESSED': {
      return { ...state, processedIds: new Set(action.payload), processedLoaded: true };
    }

    case 'KEEP_PHOTO': {
      const photo = action.payload;
      if (!photo || !photo.id) return state;
      const newProcessed = new Set(state.processedIds);
      newProcessed.add(photo.id);
      return {
        ...state,
        kept: [...state.kept, photo],
        undoStack: [...state.undoStack, { action: 'keep', photo }],
        processedIds: newProcessed,
        sessionStats: {
          ...state.sessionStats,
          reviewed: state.sessionStats.reviewed + 1,
          kept: state.sessionStats.kept + 1,
          startTime: state.sessionStats.startTime || Date.now(),
        },
        lifetimeStats: {
          ...state.lifetimeStats,
          totalReviewed: state.lifetimeStats.totalReviewed + 1,
          totalKept: state.lifetimeStats.totalKept + 1,
          lastUsed: Date.now(),
        },
        currentIndex: state.currentIndex + 1,
      };
    }

    case 'TRASH_PHOTO': {
      const photo = action.payload;
      if (!photo || !photo.id) return state;
      const newProcessed = new Set(state.processedIds);
      newProcessed.add(photo.id);
      return {
        ...state,
        trashed: [...state.trashed, photo],
        undoStack: [...state.undoStack, { action: 'trash', photo }],
        processedIds: newProcessed,
        sessionStats: {
          ...state.sessionStats,
          reviewed: state.sessionStats.reviewed + 1,
          trashed: state.sessionStats.trashed + 1,
          startTime: state.sessionStats.startTime || Date.now(),
        },
        lifetimeStats: {
          ...state.lifetimeStats,
          totalReviewed: state.lifetimeStats.totalReviewed + 1,
          totalTrashed: state.lifetimeStats.totalTrashed + 1,
          mbFreed: state.lifetimeStats.mbFreed + ((photo.fileSize || 0) / (1024 * 1024)),
          lastUsed: Date.now(),
        },
        currentIndex: state.currentIndex + 1,
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const lastAction = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);
      let newKept = state.kept;
      let newTrashed = state.trashed;
      let keptDelta = 0, trashedDelta = 0;

      const newProcessed = new Set(state.processedIds);
      newProcessed.delete(lastAction.photo.id);

      if (lastAction.action === 'keep') {
        newKept = state.kept.filter(p => p.id !== lastAction.photo.id);
        keptDelta = -1;
      } else {
        newTrashed = state.trashed.filter(p => p.id !== lastAction.photo.id);
        trashedDelta = -1;
      }

      return {
        ...state,
        kept: newKept,
        trashed: newTrashed,
        undoStack: newUndoStack,
        processedIds: newProcessed,
        sessionStats: {
          ...state.sessionStats,
          reviewed: state.sessionStats.reviewed - 1,
          kept: state.sessionStats.kept + keptDelta,
          trashed: state.sessionStats.trashed + trashedDelta,
        },
        lifetimeStats: {
          ...state.lifetimeStats,
          totalReviewed: state.lifetimeStats.totalReviewed - 1,
          totalKept: state.lifetimeStats.totalKept + keptDelta,
          totalTrashed: state.lifetimeStats.totalTrashed + trashedDelta,
        },
        currentIndex: state.currentIndex - 1,
      };
    }

    case 'PHOTOS_DELETED': {
      const { count, totalBytes } = action.payload;
      return {
        ...state,
        lifetimeStats: {
          ...state.lifetimeStats,
          totalDeleted: state.lifetimeStats.totalDeleted + count,
          mbFreed: state.lifetimeStats.mbFreed + (totalBytes / (1024 * 1024)),
        },
      };
    }

    case 'CHALLENGE_COMPLETE': {
      const score = action.payload;
      return {
        ...state,
        lifetimeStats: {
          ...state.lifetimeStats,
          bestChallengeScore: Math.max(state.lifetimeStats.bestChallengeScore, score),
        },
      };
    }

    case 'REMOVE_FROM_TRASH': {
      return { ...state, trashed: state.trashed.filter(p => p.id !== action.payload) };
    }

    case 'CLEAR_TRASH': {
      return { ...state, trashed: [] };
    }

    case 'RESTORE_FROM_TRASH': {
      const photo = state.trashed.find(p => p.id === action.payload);
      if (!photo) return state;
      return {
        ...state,
        trashed: state.trashed.filter(p => p.id !== action.payload),
        kept: [...state.kept, photo],
      };
    }

    case 'SET_CURRENT_INDEX': {
      return { ...state, currentIndex: action.payload };
    }

    case 'RESET_SESSION': {
      return {
        ...state,
        sessionStats: { reviewed: 0, kept: 0, trashed: 0, startTime: null },
        lifetimeStats: {
          ...state.lifetimeStats,
          sessionsCompleted: state.lifetimeStats.sessionsCompleted + 1,
        },
        undoStack: [],
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimer = useRef(null);

  // Load lifetime stats on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LIFETIME_KEY);
        if (raw) {
          dispatch({ type: 'LOAD_LIFETIME', payload: JSON.parse(raw) });
        } else {
          const fresh = { ...initialLifetime, firstUsed: Date.now(), lastUsed: Date.now() };
          await AsyncStorage.setItem(LIFETIME_KEY, JSON.stringify(fresh));
          dispatch({ type: 'LOAD_LIFETIME', payload: fresh });
        }
      } catch (e) {
        dispatch({ type: 'LOAD_LIFETIME', payload: initialLifetime });
      }
    })();
  }, []);

  // Load processed IDs on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROCESSED_KEY);
        if (raw) {
          dispatch({ type: 'LOAD_PROCESSED', payload: JSON.parse(raw) });
        } else {
          dispatch({ type: 'LOAD_PROCESSED', payload: [] });
        }
      } catch (e) {
        dispatch({ type: 'LOAD_PROCESSED', payload: [] });
      }
    })();
  }, []);

  // Persist processed IDs (debounced to avoid hammering storage)
  useEffect(() => {
    if (!state.processedLoaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const arr = Array.from(state.processedIds);
      AsyncStorage.setItem(PROCESSED_KEY, JSON.stringify(arr)).catch(() => {});
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state.processedIds, state.processedLoaded]);

  // Persist lifetime stats whenever they change
  useEffect(() => {
    if (!state.lifetimeLoaded) return;
    const today = new Date().toISOString().split('T')[0];
    let stats = { ...state.lifetimeStats };
    if (stats.lastStreakDate !== today && stats.totalReviewed > 0) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastStreakDate === yesterday) {
        stats.streakDays = (stats.streakDays || 0) + 1;
      } else if (stats.lastStreakDate !== today) {
        stats.streakDays = 1;
      }
      stats.lastStreakDate = today;
    }
    AsyncStorage.setItem(LIFETIME_KEY, JSON.stringify(stats)).catch(() => {});
  }, [state.lifetimeStats, state.lifetimeLoaded]);

  const keepPhoto = useCallback((photo) => dispatch({ type: 'KEEP_PHOTO', payload: photo }), []);
  const trashPhoto = useCallback(async (photo) => {
    // Fetch fileSize if missing
    let enriched = photo;
    if (!photo.fileSize) {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(photo.id);
        enriched = { ...photo, fileSize: info.fileSize || 0 };
      } catch (e) {}
    }
    dispatch({ type: 'TRASH_PHOTO', payload: enriched });
  }, []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const removeFromTrash = useCallback((photoId) => dispatch({ type: 'REMOVE_FROM_TRASH', payload: photoId }), []);
  const clearTrash = useCallback(() => dispatch({ type: 'CLEAR_TRASH' }), []);
  const restoreFromTrash = useCallback((photoId) => dispatch({ type: 'RESTORE_FROM_TRASH', payload: photoId }), []);
  const resetSession = useCallback(() => dispatch({ type: 'RESET_SESSION' }), []);
  const recordDeletion = useCallback((count, totalBytes) => dispatch({ type: 'PHOTOS_DELETED', payload: { count, totalBytes } }), []);
  const recordChallengeScore = useCallback((score) => dispatch({ type: 'CHALLENGE_COMPLETE', payload: score }), []);

  return (
    <AppContext.Provider value={{
      ...state,
      keepPhoto, trashPhoto, undo,
      removeFromTrash, clearTrash, restoreFromTrash,
      resetSession, recordDeletion, recordChallengeScore,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

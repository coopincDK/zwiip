import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { scheduleDailyReminders } from '../../src/services/notifications';
import * as MediaLibrary from 'expo-media-library';
import SwipeCard from '../../src/components/SwipeCard';
import ActionButton from '../../src/components/ActionButton';
import EmptyState from '../../src/components/EmptyState';
import ChallengeMode from '../../src/components/ChallengeMode';
import SmartCategories from '../../src/components/SmartCategories';
import Onboarding from '../../src/components/Onboarding';
import QuickAlbumSelect from '../../src/components/QuickAlbumSelect';
import AlbumPicker from '../../src/components/AlbumPicker';
import { useApp } from '../../src/context/AppContext';
import { useI18n } from '../../src/i18n';
import { useSettings, ACTIONS } from '../../src/context/SettingsContext';
import { usePhotoLibrary } from '../../src/hooks/usePhotoLibrary';
import { useAlbumManager } from '../../src/hooks/useAlbumManager';
import { useAlbumFilter } from '../../src/hooks/useAlbumFilter';
import { COLORS, SPACING } from '../../src/constants/theme';
import { E } from '../../src/constants/emoji';
import { Image as RNImage } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@zwiip_onboarded';

export default function SwipeScreen() {
  const {
    keepPhoto, trashPhoto, undo, undoStack,
    sessionStats, currentIndex, resetSession,
    kept, trashed, processedIds, processedLoaded,
  } = useApp();

  const { t } = useI18n();
  const { settings } = useSettings();
  const { addToAlbum } = useAlbumManager();
  const { isInAlbum, loadAlbumData, loaded: albumFilterLoaded, getAlbumPhotos } = useAlbumFilter();

  const {
    photos, hasPermission, isLoading, hasMore,
    totalCount, loadMore, requestPermission, enrichPhoto,
  } = usePhotoLibrary();

  // Load album filter data when permission granted
  useEffect(() => {
    if (hasPermission && settings.skipAlbumPhotos && !albumFilterLoaded) {
      loadAlbumData();
    }
  }, [hasPermission, settings.skipAlbumPhotos, albumFilterLoaded]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [category, setCategory] = useState('all');
  const [challengeActive, setChallengeActive] = useState(false);
  const [quickSelectVisible, setQuickSelectVisible] = useState(false);
  const [quickSelectDirection, setQuickSelectDirection] = useState('up');
  const [memoryPhotos, setMemoryPhotos] = useState([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [albumPickerVisible, setAlbumPickerVisible] = useState(false);
  const [selectedAlbumName, setSelectedAlbumName] = useState('');
  const [undoToast, setUndoToast] = useState(false);
  const undoToastTimer = React.useRef(null);

  // Schedule notifications on load
  useEffect(() => {
    if (hasPermission && photos.length > 0) {
      const unsorted = photos.length - processedIds.size;
      scheduleDailyReminders({ unsortedCount: unsorted, t }).catch(() => {});
    }
  }, [hasPermission, photos.length > 0]);

  // Load Memory Lane: ~50 random photos per year, skip current year
  useEffect(() => {
    if (category !== 'memory' || memoryPhotos.length > 0 || memoryLoading) return;
    setMemoryLoading(true);
    (async () => {
      try {
        const mapAsset = (a) => ({
          id: a.id, uri: a.uri, filename: a.filename,
          width: a.width, height: a.height,
          fileSize: a.fileSize || 0, creationTime: a.creationTime,
        });
        const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
        const currentYear = new Date().getFullYear();

        // Fetch ALL photos (paginated) — oldest first
        const allPhotos = [];
        let cursor = null;
        let hasMore = true;
        while (hasMore) {
          const opts = { first: 500, mediaType: MediaLibrary.MediaType.photo, sortBy: [[MediaLibrary.SortBy.creationTime, true]] };
          if (cursor) opts.after = cursor;
          const result = await MediaLibrary.getAssetsAsync(opts);
          for (const a of result.assets) {
            const year = a.creationTime ? new Date(a.creationTime).getFullYear() : 0;
            if (year >= currentYear) continue; // Skip current year
            allPhotos.push({ ...mapAsset(a), _year: year });
          }
          cursor = result.endCursor;
          hasMore = result.hasNextPage;
          // Early exit if we hit current year photos (they're sorted ascending)
          if (result.assets.length > 0) {
            const lastYear = new Date(result.assets[result.assets.length - 1].creationTime).getFullYear();
            if (lastYear >= currentYear) break;
          }
        }

        // Group by year
        const byYear = {};
        for (const p of allPhotos) {
          if (!byYear[p._year]) byYear[p._year] = [];
          byYear[p._year].push(p);
        }

        // Pick ~50 random from each year, shuffle within year
        const PER_YEAR = 50;
        const yearKeys = Object.keys(byYear).sort((a, b) => Number(a) - Number(b)); // oldest first
        const yearBuckets = yearKeys.map(year => {
          const bucket = byYear[year];
          shuffle(bucket);
          return { year: Number(year), photos: bucket.slice(0, PER_YEAR) };
        });

        // Interleave: round-robin across years (oldest year gets first pick)
        const result = [];
        let round = 0;
        let added = true;
        while (added) {
          added = false;
          for (const bucket of yearBuckets) {
            if (round < bucket.photos.length) {
              result.push(bucket.photos[round]);
              added = true;
            }
          }
          round++;
        }

        setMemoryPhotos(result);
      } catch (e) { console.warn('Memory Lane load error:', e); }
      setMemoryLoading(false);
    })();
  }, [category]);

  // Reset memory photos when switching away
  useEffect(() => {
    if (category !== 'memory') setMemoryPhotos([]);
  }, [category]);

  // Check onboarding status
  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!done) setShowOnboarding(true);
      setOnboardingChecked(true);
    })();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // processedIds comes from AppContext (persisted to AsyncStorage)

  // Filter photos by category AND skip already-processed
  const availablePhotos = React.useMemo(() => {
    let filtered;
    switch (category) {
      case 'screenshots':
        filtered = photos.filter(p =>
          p.filename && (
            p.filename.toLowerCase().includes('screenshot') ||
            p.filename.toLowerCase().includes('screen shot') ||
            p.filename.toLowerCase().startsWith('img_') && p.width > p.height * 1.5
          )
        );
        break;
      case 'recent':
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        filtered = photos.filter(p => p.creationTime && p.creationTime > oneMonthAgo);
        break;
      case 'oldest':
        filtered = [...photos].sort((a, b) => (a.creationTime || 0) - (b.creationTime || 0));
        break;
      case 'largest':
        filtered = [...photos].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
        break;
      case 'memory': {
        filtered = memoryPhotos;
        break;
      }
      case 'album': {
        filtered = albumPhotos;
        break;
      }
      default:
        filtered = photos;
    }
    // Remove already kept/trashed photos
    let available = filtered.filter(p => !processedIds.has(p.id));
    // Optionally skip photos already in albums
    if (settings.skipAlbumPhotos && albumFilterLoaded && category !== 'album') {
      available = available.filter(p => !isInAlbum(p.id));
    }
    return available;
  }, [photos, category, processedIds]);

  const currentPhoto = availablePhotos[0];
  const nextPhoto = availablePhotos[1];

  // Enrich current photo with fileSize in background (non-blocking)
  const [enrichedSize, setEnrichedSize] = useState({});
  useEffect(() => {
    if (!currentPhoto || currentPhoto.fileSize > 0) return;
    if (enrichedSize[currentPhoto.id]) return;
    let cancelled = false;
    enrichPhoto(currentPhoto).then(p => {
      if (!cancelled && p.fileSize > 0) {
        setEnrichedSize(prev => ({ ...prev, [p.id]: p.fileSize }));
      }
    });
    return () => { cancelled = true; };
  }, [currentPhoto?.id]);
  const [challengeShowResult, setChallengeShowResult] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);

  // Load more photos when running low
  useEffect(() => {
    if (availablePhotos.length < 5 && hasMore && !isLoading) {
      loadMore();
    }
  }, [availablePhotos.length, hasMore, isLoading]);

  // Swipe cooldown
  const lastSwipeTime = React.useRef(0);
  const swipeCooldownMs = (settings.swipeCooldown || 0) * 1000;
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimer = React.useRef(null);
  const countdownInterval = React.useRef(null);
  const isSwipeAllowed = useCallback(() => {
    if (swipeCooldownMs <= 0) return true;
    return !cooldownActive;
  }, [swipeCooldownMs, cooldownActive]);

  const startCooldown = useCallback(() => {
    if (swipeCooldownMs <= 0) return;
    setCooldownActive(true);
    setCooldownRemaining(swipeCooldownMs);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCooldownRemaining(prev => {
        const next = prev - 16;
        if (next <= 0) { clearInterval(countdownInterval.current); return 0; }
        return next;
      });
    }, 16);
    cooldownTimer.current = setTimeout(() => {
      setCooldownActive(false);
      setCooldownRemaining(0);
      clearInterval(countdownInterval.current);
    }, swipeCooldownMs);
  }, [swipeCooldownMs]);

  // Swipe action handler
  const handleSwipeAction = useCallback(async (photo, directionKey) => {
    const config = settings[directionKey];
    if (!config) return;

    switch (config.action) {
      case ACTIONS.DELETE:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        trashPhoto(photo);
        // Show undo toast
        setUndoToast(true);
        if (undoToastTimer.current) clearTimeout(undoToastTimer.current);
        undoToastTimer.current = setTimeout(() => setUndoToast(false), 3000);
        break;
      case ACTIONS.KEEP:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        keepPhoto(photo);
        break;
      case ACTIONS.ALBUM:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (config.albumName) await addToAlbum(photo.id, config.albumName);
        keepPhoto(photo);
        break;
      case ACTIONS.SKIP:
        keepPhoto(photo);
        break;
    }
    startCooldown();
  }, [settings, trashPhoto, keepPhoto, addToAlbum, startCooldown]);

  const handleSwipeLeft = useCallback((photo) => handleSwipeAction(photo, 'swipeLeft'), [handleSwipeAction]);
  const handleSwipeRight = useCallback((photo) => handleSwipeAction(photo, 'swipeRight'), [handleSwipeAction]);

  const hasUpAction = settings.swipeUp.action !== ACTIONS.SKIP;
  const hasDownAction = settings.swipeDown.action !== ACTIONS.SKIP;

  const handleSwipeUp = useCallback((photo) => {
    if (hasUpAction) handleSwipeAction(photo, 'swipeUp');
    else { setQuickSelectDirection('up'); setQuickSelectVisible(true); }
  }, [hasUpAction, handleSwipeAction]);

  const handleSwipeDown = useCallback((photo) => {
    if (hasDownAction) handleSwipeAction(photo, 'swipeDown');
    else { setQuickSelectDirection('down'); setQuickSelectVisible(true); }
  }, [hasDownAction, handleSwipeAction]);

  const handleUndo = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setUndoToast(false);
    undo();
  }, [undo]);

  const getLabel = (config) => {
    if (config.action === ACTIONS.ALBUM) return config.albumName || 'Album';
    return config.label;
  };

  // Onboarding
  if (!onboardingChecked) return null;
  if (showOnboarding) return <Onboarding onComplete={completeOnboarding} />;

  // Permission
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={"🔒"}
          title={t('permission_title')}
          subtitle={t('permission_subtitle')}
          actionLabel={t('permission_button')}
          onAction={requestPermission}
        />
      </SafeAreaView>
    );
  }

  // Loading
  if (hasPermission === null || (isLoading && photos.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('loading_photos')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // All done
  if (!currentPhoto && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          svgType="all-sorted"
          icon={"🎉"}
          title={t('all_done_title')}
          subtitle={t('all_done_subtitle', { count: sessionStats.reviewed })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <RNImage source={require('../../assets/zwiip-logo.png')} style={styles.headerLogo} resizeMode="contain" />
        <ChallengeMode
          isActive={challengeActive}
          onStart={() => { setChallengeActive(true); setChallengeShowResult(false); resetSession(); }}
          onEnd={() => setChallengeActive(false)}
          onShowResultChange={setChallengeShowResult}
          sessionStats={sessionStats}
          trashCount={sessionStats.trashed}
        />
      </View>

      {/* Smart categories */}
      {!challengeActive && (
        <View>
          <SmartCategories
            currentCategory={category}
            albumName={selectedAlbumName}
            onSelectCategory={(cat) => {
              if (cat === 'album') {
                setAlbumPickerVisible(true);
              } else {
                setCategory(cat);
              }
            }}
          />
          <AlbumPicker
            visible={albumPickerVisible}
            currentValue={selectedAlbumName}
            onSelect={async (albumTitle) => {
              setSelectedAlbumName(albumTitle);
              setAlbumPickerVisible(false);
              setCategory('album');
              const photos = await getAlbumPhotos(albumTitle);
              setAlbumPhotos(photos);
            }}
            onClose={() => setAlbumPickerVisible(false)}
          />
        </View>
      )}

      {/* Card area - always rendered for flex:1 layout */}
      <View style={styles.cardContainer}>
      {!challengeShowResult && <>
        {/* Stats overlay - top */}
        <View style={styles.statsOverlay}>
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>{"❤️"}</Text>
              <Text style={styles.statValue}>{sessionStats.kept}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>{"📸"}</Text>
              <Text style={styles.statValue}>{sessionStats.reviewed}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>{"🗑️"}</Text>
              <Text style={styles.statValue}>{sessionStats.trashed}</Text>
            </View>
            <View style={styles.counter}>
              <Text style={styles.counterText}>{currentIndex + 1}/{totalCount}</Text>
            </View>
          </View>
        </View>

        {!currentPhoto && isLoading && (
          <View style={styles.skeletonCard}>
            <ActivityIndicator size="small" color={COLORS.textDim} />
          </View>
        )}
        {nextPhoto && (
          <SwipeCard
            key={`next-${nextPhoto.id}`}
            photo={nextPhoto}
            isTop={false}
          />
        )}
        {currentPhoto && (
          <SwipeCard
            key={`top-${currentPhoto.id}`}
            photo={currentPhoto.fileSize ? currentPhoto : { ...currentPhoto, fileSize: enrichedSize[currentPhoto.id] || 0 }}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onSwipeUp={handleSwipeUp}
            onSwipeDown={handleSwipeDown}
            onTap={() => !cooldownActive && setFocusMode(true)}
            isTop={true}
            isSwipeAllowed={isSwipeAllowed}
          />
        )}

        {/* Action buttons overlay - bottom of card */}
        <View style={styles.actionsOverlay}>
          <ActionButton imageKey="delete" color={COLORS.delete} size={62}
            onPress={() => currentPhoto && handleSwipeLeft(currentPhoto)} />
          <ActionButton imageKey="undo" color={COLORS.undo} size={61}
            disabled={undoStack.length === 0} onPress={handleUndo} />
          <ActionButton imageKey="keep" color={COLORS.keep} size={62}
            onPress={() => currentPhoto && handleSwipeRight(currentPhoto)} />
        </View>
      </>}
      </View>

      {/* Undo toast */}
      {cooldownActive && swipeCooldownMs > 0 && cooldownRemaining > 0 && (
        <View style={[styles.cooldownOverlay, { opacity: cooldownRemaining < 1000 ? cooldownRemaining / 1000 : 1 }]} pointerEvents="none">
          <View style={styles.cooldownBadge}>
            <Text style={styles.cooldownTitle}>Zwiip Safe</Text>
            <Text style={styles.cooldownTimer}>{(cooldownRemaining / 1000).toFixed(1)}s</Text>
          </View>
        </View>
      )}

      {undoToast && undoStack.length > 0 && (
        <TouchableOpacity style={styles.undoToast} onPress={handleUndo} activeOpacity={0.8}>
          <Text style={styles.undoToastText}>{t('trash_trashed_toast')}</Text>
          <Text style={styles.undoToastBtn}>{t('trash_undo_btn')}</Text>
        </TouchableOpacity>
      )}

      {/* Focus Mode - fullscreen swiping */}
      {focusMode && currentPhoto && (
        <Modal visible animationType="fade" statusBarTranslucent>
          <View style={styles.focusContainer}>
            <SwipeCard
              key={`focus-${currentPhoto.id}`}
              photo={currentPhoto.fileSize ? currentPhoto : { ...currentPhoto, fileSize: enrichedSize[currentPhoto.id] || 0 }}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
              onSwipeDown={handleSwipeDown}
              isTop={true}
              fullscreen={true}
              onTap={() => setFocusMode(false)}
              isSwipeAllowed={isSwipeAllowed}
            />
            <TouchableOpacity style={styles.focusClose} onPress={() => setFocusMode(false)} activeOpacity={0.7}>
              <Text style={styles.focusCloseText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.focusStats}>
              <Text style={styles.focusStatsText}>❤️ {sessionStats.kept}   🗑️ {sessionStats.trashed}   {currentIndex + 1}/{totalCount}</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Quick album select */}
      <QuickAlbumSelect
        visible={quickSelectVisible}
        direction={quickSelectDirection}
        onDismiss={() => setQuickSelectVisible(false)}
        onGoToSettings={() => {
          setQuickSelectVisible(false);
          const { router } = require('expo-router');
          router.push('/settings');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: 2, paddingBottom: 2,
  },
  headerLogo: { width: 120, height: 40 },
  statsBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statIcon: { fontSize: 11 },
  statValue: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  counter: { backgroundColor: COLORS.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  counterText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  statsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: 'rgba(10,10,26,0.65)', paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardContainer: { flex: 1 },
  actionsOverlay: { position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 38 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  focusContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  focusClose: {
    position: 'absolute', top: 60, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  focusCloseText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  focusStats: {
    position: 'absolute', top: 62, left: 20, zIndex: 10,
  },
  focusStatsText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  loadingText: { color: COLORS.textSecondary, fontSize: 16 },
  skeletonCard: {
    position: 'absolute', top: 0, left: 16, right: 16, bottom: 0,
    backgroundColor: COLORS.surface, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  cooldownOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 30,
  },
  cooldownBadge: {
    backgroundColor: 'rgba(108,92,231,0.9)',
    paddingHorizontal: 28, paddingVertical: 16,
    borderRadius: 24, alignItems: 'center',
  },
  cooldownTitle: {
    color: '#fff', fontSize: 18, fontWeight: '800',
  },
  cooldownTimer: {
    color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 4,
  },
  undoToast: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: COLORS.surface, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 20,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, zIndex: 50,
  },
  undoToastText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  undoToastBtn: { color: COLORS.primary, fontSize: 15, fontWeight: '800' },
});

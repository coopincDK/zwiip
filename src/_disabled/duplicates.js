import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { findDuplicateGroups, findBurstGroups, findFilenameDuplicates } from '../../src/utils/duplicates';
import { computeDHash, findSimilarByHash } from '../../src/utils/dhash';
import EmptyState from '../../src/components/EmptyState';
import DuplicateReview from '../../src/components/DuplicateReview';
import { COLORS, SPACING } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 3) / 4;

const SCAN_OPTIONS = [
  { key: 100, label: '100' },
  { key: 250, label: '250' },
  { key: 500, label: '500' },
  { key: 1000, label: '1000' },
  { key: 2000, label: '2000' },
];

const PERIOD_OPTIONS = [
  { key: 'all', label: 'Altid', ms: null },
  { key: '1y', label: '1 år', ms: 365 * 24 * 60 * 60 * 1000 },
  { key: '6m', label: '6 mdr', ms: 180 * 24 * 60 * 60 * 1000 },
  { key: '3m', label: '3 mdr', ms: 90 * 24 * 60 * 60 * 1000 },
  { key: '1m', label: '1 mdr', ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function DuplicatesScreen() {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [burstGroups, setBurstGroups] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [scanLimit, setScanLimit] = useState(500);
  const [period, setPeriod] = useState('all');
  const [hashProgress, setHashProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState('');
  const [reviewGroup, setReviewGroup] = useState(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    setScannedCount(0);

    try {
      let allPhotos = [];
      let endCursor = null;
      let hasMore = true;
      const periodMs = PERIOD_OPTIONS.find(p => p.key === period)?.ms;
      const cutoff = periodMs ? Date.now() - periodMs : 0;

      while (hasMore && allPhotos.length < scanLimit) {
        const options = {
          first: Math.min(100, scanLimit - allPhotos.length),
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [MediaLibrary.SortBy.creationTime],
        };
        if (endCursor) options.after = endCursor;

        const result = await MediaLibrary.getAssetsAsync(options);
        // Fetch real file info for accurate fileSize
        let newPhotos = [];
        for (const a of result.assets) {
          let fileSize = a.fileSize || 0;
          if (fileSize === 0) {
            try {
              const info = await MediaLibrary.getAssetInfoAsync(a.id);
              fileSize = info.fileSize || 0;
            } catch (e) { /* skip */ }
          }
          newPhotos.push({
            id: a.id, uri: a.uri, filename: a.filename,
            width: a.width, height: a.height,
            fileSize, creationTime: a.creationTime,
          });
        }

        // Filter by period
        if (cutoff > 0) {
          newPhotos = newPhotos.filter(p => p.creationTime && p.creationTime > cutoff);
        }

        allPhotos = [...allPhotos, ...newPhotos];
        setScannedCount(allPhotos.length);
        endCursor = result.endCursor;
        hasMore = result.hasNextPage;

        // Stop early if we've gone past the period
        if (cutoff > 0 && result.assets.length > 0) {
          const oldest = result.assets[result.assets.length - 1];
          if (oldest.creationTime && oldest.creationTime < cutoff) break;
        }
      }

      // Phase 1: Metadata-based detection
      setScanPhase('Analyserer metadata...');
      const dupes = findDuplicateGroups(allPhotos);
      const bursts = findBurstGroups(allPhotos);
      const filenameDupes = findFilenameDuplicates(allPhotos);

      // Phase 2: Perceptual hash (dHash)
      setScanPhase('Beregner visuelle fingerprints...');
      const hashEntries = [];
      for (let i = 0; i < allPhotos.length; i++) {
        setHashProgress(Math.round((i / allPhotos.length) * 100));
        const hash = await computeDHash(allPhotos[i].uri, allPhotos[i].id);
        if (hash) {
          hashEntries.push({ ...allPhotos[i], hash });
        }
      }
      setHashProgress(100);
      const similarGroups = findSimilarByHash(hashEntries, 10);

      // Merge all results, deduplicate
      setScanPhase('Samler resultater...');
      const seenIds = new Set();
      const allFound = [];
      for (const group of [...dupes, ...filenameDupes, ...similarGroups, ...bursts]) {
        const unique = group.photos.filter(p => !seenIds.has(p.id));
        if (unique.length >= 2) {
          allFound.push({ ...group, photos: unique, count: unique.length });
          unique.forEach(p => seenIds.add(p.id));
        }
      }
      setDuplicateGroups(allFound.filter(g => g.type !== 'burst'));
      setBurstGroups(allFound.filter(g => g.type === 'burst'));
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setScanning(false);
      setHasScanned(true);
    }
  }, [scanLimit, period]);

  const handleDeleteDuplicates = (group) => {
    const toDelete = group.photos.slice(1);
    Alert.alert(
      'Slet dubletter?',
      `Beholder den ældste og sletter ${toDelete.length} stk.`,
      [
        { text: 'Annullér', style: 'cancel' },
        { text: `Slet ${toDelete.length}`, style: 'destructive', onPress: async () => {
          await MediaLibrary.deleteAssetsAsync(toDelete.map(p => p.id));
          setDuplicateGroups(prev => prev.filter(g => g.key !== group.key));
        }},
      ]
    );
  };

  const allGroups = [...duplicateGroups, ...burstGroups];

  // Scan settings + start screen
  if (!hasScanned) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollableHeader />
        {scanning ? (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.scanningText}>{scanPhase || `Scanner ${scannedCount} billeder...`}</Text>
            {hashProgress > 0 && hashProgress < 100 && (
              <View style={styles.hashProgressContainer}>
                <View style={styles.hashProgressBg}>
                  <View style={[styles.hashProgressFill, { width: `${hashProgress}%` }]} />
                </View>
                <Text style={styles.hashProgressText}>{hashProgress}% fingerprints beregnet</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingTitle}>{'🔢 Antal billeder at scanne'}</Text>
            <View style={styles.optionRow}>
              {SCAN_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.optionBtn, scanLimit === opt.key && styles.optionBtnActive]}
                  onPress={() => setScanLimit(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, scanLimit === opt.key && styles.optionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.settingTitle}>{'📅 Periode'}</Text>
            <View style={styles.optionRow}>
              {PERIOD_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.optionBtn, period === opt.key && styles.optionBtnActive]}
                  onPress={() => setPeriod(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, period === opt.key && styles.optionTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.scanBtn} onPress={runScan} activeOpacity={0.7}>
              <Text style={styles.scanBtnText}>{'🔍 Start scanning'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // No results
  if (allGroups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollableHeader />
        <EmptyState
          svgType="no-duplicates"
          icon="✨"
          title="Ingen dubletter fundet!"
          subtitle="Dit fotobibliotek ser rent ud."
          actionLabel="Scan igen"
          onAction={() => setHasScanned(false)}
        />
      </SafeAreaView>
    );
  }

  // Results
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{'🔍 Dubletter'}</Text>
          <Text style={styles.subtitle}>{allGroups.length} grupper fundet</Text>
        </View>
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setHasScanned(false)} activeOpacity={0.7}>
          <Text style={styles.rescanBtnText}>{'🔄'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={allGroups}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: group }) => (
          <TouchableOpacity style={styles.groupCard} onPress={() => setReviewGroup(group)} activeOpacity={0.7}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupTitle}>
                {group.type === 'burst' ? '⚡ Burst-serie' : group.type === 'similar' ? '👁 Visuelt ens' : '🔄 Duplikat'}
              </Text>
              <Text style={styles.groupCount}>{group.count} billeder ›</Text>
            </View>
            <FlatList
              data={group.photos.slice(0, 6)}
              keyExtractor={(p) => p.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbList}
              scrollEnabled={false}
              renderItem={({ item: photo, index }) => (
                <View style={styles.thumbWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
                  {index === 0 && (
                    <View style={styles.keepBadge}><Text style={styles.keepBadgeText}>Behold</Text></View>
                  )}
                </View>
              )}
            />
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tryk for at gennemse og vælge</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Full review modal */}
      {reviewGroup && (
        <DuplicateReview
          group={reviewGroup}
          onDelete={async (idsToDelete) => {
            await MediaLibrary.deleteAssetsAsync(idsToDelete);
            // Remove deleted photos from groups
            const deleted = new Set(idsToDelete);
            setDuplicateGroups(prev => prev.map(g => ({
              ...g,
              photos: g.photos.filter(p => !deleted.has(p.id)),
              count: g.photos.filter(p => !deleted.has(p.id)).length,
            })).filter(g => g.count >= 2));
            setBurstGroups(prev => prev.map(g => ({
              ...g,
              photos: g.photos.filter(p => !deleted.has(p.id)),
              count: g.photos.filter(p => !deleted.has(p.id)).length,
            })).filter(g => g.count >= 2));
            setReviewGroup(null);
          }}
          onClose={() => setReviewGroup(null)}
        />
      )}
    </SafeAreaView>
  );
}

function ScrollableHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{'🔍 Dubletter'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  rescanBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  rescanBtnText: { fontSize: 20 },
  settingsContainer: { padding: SPACING.lg, gap: SPACING.lg },
  settingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '20' },
  optionText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.primary },
  scanBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: SPACING.md },
  scanBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  scanningContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  scanningText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100, gap: SPACING.md },
  groupCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.md },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  groupTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  groupCount: { fontSize: 13, color: COLORS.textSecondary },
  thumbList: { gap: SPACING.sm, marginBottom: SPACING.sm },
  thumbWrapper: { position: 'relative' },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 10 },
  keepBadge: { position: 'absolute', bottom: 4, left: 4, right: 4, backgroundColor: COLORS.keep, borderRadius: 6, paddingVertical: 2, alignItems: 'center' },
  keepBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  deleteGroupBtn: { backgroundColor: 'rgba(255,23,68,0.15)', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  deleteGroupText: { color: COLORS.delete, fontSize: 14, fontWeight: '700' },
  tapHint: { paddingVertical: 10, alignItems: 'center' },
  tapHintText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  hashProgressContainer: { width: '80%', alignItems: 'center', gap: 8 },
  hashProgressBg: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, overflow: 'hidden', width: '100%' },
  hashProgressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  hashProgressText: { color: COLORS.textSecondary, fontSize: 12 },
});

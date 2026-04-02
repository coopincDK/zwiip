import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLS = 3;
const THUMB_GAP = 4;
const THUMB_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - THUMB_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function DuplicateReview({ group, onDelete, onClose }) {
  // Track which photos to KEEP (first one auto-selected)
  const [keepIds, setKeepIds] = useState(new Set([group.photos[0]?.id]));
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const toDelete = group.photos.filter(p => !keepIds.has(p.id));
  const toKeep = group.photos.filter(p => keepIds.has(p.id));

  const toggleKeep = (id) => {
    setKeepIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Don't allow deselecting the last one
        if (next.size <= 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = () => {
    Alert.alert(
      `Slet ${toDelete.length} dubletter?`,
      `Beholder ${toKeep.length} og sletter ${toDelete.length} billeder.`,
      [
        { text: 'Annulér', style: 'cancel' },
        {
          text: `Slet ${toDelete.length}`,
          style: 'destructive',
          onPress: () => onDelete(toDelete.map(p => p.id)),
        },
      ]
    );
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}-${d.getFullYear()}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{group.count} billeder</Text>
            <Text style={styles.headerSub}>
              Tryk for at vælge hvad du vil beholde
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.keepCount}>✅ {toKeep.length}</Text>
            <Text style={styles.deleteCount}>🗑 {toDelete.length}</Text>
          </View>
        </View>

        {/* Photo grid */}
        <FlatList
          data={group.photos}
          keyExtractor={(p) => p.id}
          numColumns={GRID_COLS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item, index }) => {
            const isKept = keepIds.has(item.id);
            const isFirst = index === 0;
            return (
              <TouchableOpacity
                style={[styles.thumb, isKept && styles.thumbKept]}
                onPress={() => toggleKeep(item.id)}
                onLongPress={() => setPreviewPhoto(item)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbImage}
                  contentFit="cover"
                />
                {/* Keep/delete badge */}
                <View style={[styles.badge, isKept ? styles.badgeKeep : styles.badgeDelete]}>
                  <Text style={styles.badgeText}>{isKept ? '✅' : '🗑'}</Text>
                </View>
                {/* First = suggested */}
                {isFirst && (
                  <View style={styles.suggestedBadge}>
                    <Text style={styles.suggestedText}>Ældste</Text>
                  </View>
                )}
                {/* Photo info */}
                <View style={styles.thumbInfo}>
                  <Text style={styles.thumbDate}>{formatDate(item.creationTime)}</Text>
                  <Text style={styles.thumbSize}>{formatSize(item.fileSize)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Beholder {toKeep.length} · Sletter {toDelete.length}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.deleteBtn, toDelete.length === 0 && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={toDelete.length === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteBtnText}>
              Slet {toDelete.length} dubletter
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full preview modal */}
        {previewPhoto && (
          <Modal visible transparent animationType="fade">
            <TouchableOpacity
              style={styles.previewOverlay}
              onPress={() => setPreviewPhoto(null)}
              activeOpacity={1}
            >
              <Image
                source={{ uri: previewPhoto.uri }}
                style={styles.previewImage}
                contentFit="contain"
              />
              <Text style={styles.previewDate}>
                {formatDate(previewPhoto.creationTime)} · {formatSize(previewPhoto.fileSize)}
                {previewPhoto.width && ` · ${previewPhoto.width}×${previewPhoto.height}`}
              </Text>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.surface,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: COLORS.text },
  headerCenter: { flex: 1, marginLeft: SPACING.md },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  keepCount: { fontSize: 13, color: COLORS.keep, fontWeight: '700' },
  deleteCount: { fontSize: 13, color: COLORS.delete, fontWeight: '700', marginTop: 2 },
  grid: { padding: SPACING.lg, paddingBottom: 160 },
  gridRow: { gap: THUMB_GAP, marginBottom: THUMB_GAP },
  thumb: {
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12,
    overflow: 'hidden', borderWidth: 3, borderColor: 'transparent',
  },
  thumbKept: { borderColor: COLORS.keep },
  thumbImage: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeKeep: { backgroundColor: COLORS.keep + '90' },
  badgeDelete: { backgroundColor: COLORS.delete + '90' },
  badgeText: { fontSize: 14 },
  suggestedBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: COLORS.primary + 'CC', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  suggestedText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  thumbInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 4,
  },
  thumbDate: { fontSize: 9, color: '#ccc' },
  thumbSize: { fontSize: 9, color: '#999' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.tabBar, borderTopWidth: 1, borderTopColor: COLORS.surface,
    padding: SPACING.lg, paddingBottom: 40,
  },
  summary: { alignItems: 'center', marginBottom: SPACING.sm },
  summaryText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: COLORS.delete, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  deleteBtnDisabled: { backgroundColor: COLORS.surfaceLight, opacity: 0.5 },
  deleteBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewImage: { width: SCREEN_WIDTH - 40, height: SCREEN_WIDTH - 40 },
  previewDate: {
    color: '#aaa', fontSize: 14, marginTop: SPACING.md, textAlign: 'center',
  },
});

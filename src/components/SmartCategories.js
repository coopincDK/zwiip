import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { E } from '../constants/emoji';
import { useI18n } from '../i18n';

const CATEGORIES = [
  { key: 'all', emoji: E.camera, labelKey: 'cat_all' },
  { key: 'memory', emoji: E.sparkle, labelKey: 'cat_memory' },
  { key: 'album', emoji: E.folder, labelKey: 'cat_album' },
  { key: 'screenshots', emoji: E.phone, labelKey: 'cat_screenshots' },
  { key: 'recent', emoji: E.clock, labelKey: 'cat_recent' },
  { key: 'oldest', emoji: E.calendar, labelKey: 'cat_oldest' },
  { key: 'largest', emoji: E.disk, labelKey: 'cat_largest' },
];

export default function SmartCategories({ onSelectCategory, currentCategory, albumName }) {
  const { t } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[styles.pill, currentCategory === cat.key && styles.pillActive]}
          onPress={() => onSelectCategory(cat.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{cat.emoji}</Text>
          <Text style={[styles.label, currentCategory === cat.key && styles.labelActive]}>
            {cat.key === 'album' && albumName ? albumName : t(cat.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.md, gap: 6, paddingVertical: 0, height: 30 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  pillActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  emoji: { fontSize: 13 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  labelActive: { color: COLORS.primary },
});

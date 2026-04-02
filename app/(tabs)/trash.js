import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useApp } from '../../src/context/AppContext';
import { usePhotoLibrary } from '../../src/hooks/usePhotoLibrary';
import EmptyState from '../../src/components/EmptyState';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3;

export default function TrashScreen() {
  const { t } = useI18n();
  const { trashed, restoreFromTrash, clearTrash, recordDeletion } = useApp();
  const { deletePhotos } = usePhotoLibrary();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = () => {
    Alert.alert(
      t('trash_confirm_title'),
      t('trash_confirm_msg', { count: trashed.length }),
      [
        { text: t('trash_cancel'), style: 'cancel' },
        {
          text: t('trash_confirm', { count: trashed.length }),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const ids = trashed.map(p => p.id);
            const totalBytes = trashed.reduce((sum, p) => sum + (p.fileSize || 0), 0);
            const count = ids.length;
            const success = await deletePhotos(ids);
            if (success) {
              recordDeletion(count, totalBytes);
              clearTrash();
            }
            setIsDeleting(false);
          },
        },
      ]
    );
  };

  const handleRestore = (photoId) => {
    Alert.alert(
      t('trash_restore_title'),
      t('trash_restore_msg'),
      [
        { text: t('trash_cancel'), style: 'cancel' },
        {
          text: t('trash_restore_btn'),
          onPress: () => restoreFromTrash(photoId),
        },
      ]
    );
  };

  if (trashed.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('trash_title')}</Text>
        </View>
        <EmptyState
          svgType="trash-empty"
          icon="✨"
          title={t('trash_empty_title')}
          subtitle={t('trash_empty_subtitle')}
        />
      </SafeAreaView>
    );
  }

  const totalSize = trashed.reduce((sum, p) => sum + (p.fileSize || 0), 0);
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('trash_title')}</Text>
        <Text style={styles.subtitle}>
          {t('trash_subtitle', { count: trashed.length, size: sizeMB })}
        </Text>
      </View>

      {/* Info banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          {t('trash_hint')}
        </Text>
      </View>

      <FlatList
        data={trashed}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleRestore(item.id)}
            activeOpacity={0.7}
            style={styles.thumbContainer}
          >
            <Image
              source={{ uri: item.uri }}
              style={styles.thumb}
              contentFit="cover"
              recyclingKey={item.id}
            />
          </TouchableOpacity>
        )}
      />

      {/* Delete all button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAll}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? t('trash_deleting') : t('trash_delete_btn', { count: trashed.length })}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  banner: {
    backgroundColor: COLORS.keep + '18',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.keep + '40',
  },
  bannerText: {
    color: COLORS.keep,
    fontSize: 15,
    fontWeight: '700',
  },
  grid: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  gridRow: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  thumbContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 20,
    backgroundColor: COLORS.background,
  },
  deleteButton: {
    backgroundColor: COLORS.delete,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});

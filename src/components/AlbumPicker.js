import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { COLORS, SPACING } from '../constants/theme';
import { E } from '../constants/emoji';
import { useI18n } from '../i18n';

export default function AlbumPicker({ visible, onSelect, onClose, currentValue }) {
  const { t } = useI18n();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => { if (visible) { setSearch(''); setShowSearch(false); loadAlbums(); } }, [visible]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const result = await MediaLibrary.getAlbumsAsync();
      setAlbums(result.filter(a => a.title && a.title.trim()).sort((a, b) => a.title.localeCompare(b.title)));
    } catch (e) {} finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return albums;
    const q = search.toLowerCase();
    return albums.filter(a => a.title.toLowerCase().includes(q));
  }, [albums, search]);

  const exactMatch = useMemo(() => {
    if (!search.trim()) return true;
    return albums.some(a => a.title.toLowerCase() === search.toLowerCase().trim());
  }, [albums, search]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('album_title')}</Text>
            <View style={{flexDirection:'row', gap: 8}}>
              <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.closeBtn}><Text style={styles.closeBtnText}>{E.search}</Text></TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>{E.cross}</Text></TouchableOpacity>
            </View>
          </View>
          {/* Search - only shows when creating new */}
          {showSearch && (
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>{E.search}</Text>
              <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder={t('album_search')} placeholderTextColor={COLORS.textDim} autoCapitalize="words" autoFocus />
            </View>
          )}
          {loading ? (
            <View style={styles.loadingContainer}><ActivityIndicator color={COLORS.primary} /><Text style={styles.loadingText}>{t('album_loading')}</Text></View>
          ) : (
            <>
              {search.trim() && !exactMatch && (
                <TouchableOpacity style={styles.createNewBtn} onPress={() => { onSelect(search.trim()); onClose(); }} activeOpacity={0.7}>
                  <Text style={styles.createNewIcon}>{E.plus}</Text>
                  <View><Text style={styles.createNewText}>{t('album_create')}</Text><Text style={styles.createNewName}>"{search.trim()}"</Text></View>
                </TouchableOpacity>
              )}
              <FlatList data={filtered}
                ListFooterComponent={
                  <TouchableOpacity style={styles.createNewBtn} onPress={() => setShowSearch(true)} activeOpacity={0.7}>
                    <Text style={styles.createNewIcon}>{E.plus}</Text>
                    <Text style={styles.createNewText}>{t('album_create')}</Text>
                  </TouchableOpacity>
                } keyExtractor={i => i.id} style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled"
                ListEmptyComponent={!search.trim() ? <View style={styles.emptyState}><Text style={styles.emptyIcon}>{E.openFolder}</Text><Text style={styles.emptyText}>{t('album_empty')}</Text><Text style={styles.emptySubtext}>{t('album_empty_hint')}</Text></View> : null}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.albumItem, currentValue === item.title && styles.albumItemActive]} onPress={() => { onSelect(item.title); onClose(); }} activeOpacity={0.7}>
                    <View style={styles.albumInfo}>
                      <Text style={styles.albumIcon}>{E.folder}</Text>
                      <View><Text style={[styles.albumTitle, currentValue === item.title && styles.albumTitleActive]}>{item.title}</Text><Text style={styles.albumCount}>{item.assetCount} {item.assetCount !== 1 ? t('album_photos') : t('album_photo')}</Text></View>
                    </View>
                    {currentValue === item.title && <Text style={styles.checkmark}>{E.check}</Text>}
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', minHeight: '50%', paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: COLORS.textSecondary, fontSize: 18 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: SPACING.lg, marginBottom: SPACING.md, borderRadius: 12, paddingHorizontal: 14 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, color: COLORS.text, fontSize: 16 },
  loadingContainer: { padding: SPACING.xl, alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  createNewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.keep + '15', marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, padding: SPACING.md, borderRadius: 12, borderWidth: 1, borderColor: COLORS.keep + '40', borderStyle: 'dashed', gap: 12 },
  createNewIcon: { fontSize: 20 }, createNewText: { fontSize: 14, fontWeight: '600', color: COLORS.keep }, createNewName: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  list: { flex: 1 }, listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 20 },
  albumItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: SPACING.sm },
  albumItemActive: { borderWidth: 2, borderColor: COLORS.keep },
  albumInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  albumIcon: { fontSize: 24 }, albumTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text }, albumTitleActive: { color: COLORS.keep },
  albumCount: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }, checkmark: { fontSize: 18, color: COLORS.keep, fontWeight: '800' },
  emptyState: { padding: SPACING.xl, alignItems: 'center' }, emptyIcon: { fontSize: 40, marginBottom: SPACING.sm }, emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.text }, emptySubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
});

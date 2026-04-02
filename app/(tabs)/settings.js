import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings, ACTIONS } from '../../src/context/SettingsContext';
import AlbumPicker from '../../src/components/AlbumPicker';
import { COLORS, SPACING } from '../../src/constants/theme';
import { E } from '../../src/constants/emoji';
import { useI18n, LANGUAGES } from '../../src/i18n';
import { useRouter } from 'expo-router';
import { isNotificationsEnabled, setNotificationsEnabled } from '../../src/services/notifications';

function DirectionConfig({ direction, config, onUpdate, t }) {
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);

  const ACTION_OPTIONS = [
    { key: ACTIONS.DELETE, label: t('action_delete'), emoji: E.trash, color: COLORS.delete },
    { key: ACTIONS.KEEP, label: t('action_keep'), emoji: E.heart, color: COLORS.keep },
    { key: ACTIONS.ALBUM, label: t('action_album'), emoji: E.folder, color: COLORS.undo },
    { key: ACTIONS.SKIP, label: t('action_inactive'), emoji: E.skip, color: COLORS.textDim },
  ];

  const handleActionSelect = (actionKey) => {
    if (actionKey === ACTIONS.ALBUM) { setShowAlbumPicker(true); return; }
    const option = ACTION_OPTIONS.find(o => o.key === actionKey);
    onUpdate(direction.key, { action: actionKey, label: option.label, emoji: option.emoji, albumName: '' });
  };

  const handleAlbumSelect = (albumName) => {
    onUpdate(direction.key, { action: ACTIONS.ALBUM, label: albumName, emoji: E.folder, albumName });
  };

  return (
    <View style={styles.directionCard}>
      <Text style={styles.directionLabel}>{direction.label}</Text>
      <View style={styles.actionButtons}>
        {ACTION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.actionBtn, config.action === option.key && { backgroundColor: option.color + '30', borderColor: option.color }]}
            onPress={() => handleActionSelect(option.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionEmoji}>{option.emoji}</Text>
            <Text style={[styles.actionLabel, config.action === option.key && { color: option.color }]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {config.action === ACTIONS.ALBUM && (
        <TouchableOpacity style={styles.albumDisplay} onPress={() => setShowAlbumPicker(true)} activeOpacity={0.7}>
          <Text style={styles.albumDisplayIcon}>{E.folder}</Text>
          <View style={styles.albumDisplayInfo}>
            <Text style={styles.albumDisplayName}>{config.albumName || t('settings_pick_album')}</Text>
            <Text style={styles.albumDisplayHint}>{t('settings_tap_change')}</Text>
          </View>
          <Text style={styles.albumDisplayArrow}>{'\u203A'}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.currentSetting}>
        <Text style={styles.currentSettingText}>
          {direction.arrow + ' = ' + config.emoji + ' ' + (config.action === ACTIONS.ALBUM ? (config.albumName || t('settings_album_inline')) : config.label)}
        </Text>
      </View>
      <AlbumPicker visible={showAlbumPicker} onSelect={handleAlbumSelect} onClose={() => setShowAlbumPicker(false)} currentValue={config.albumName} />
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, updateDirection, resetSettings } = useSettings();
  const { t, language, override, setLanguage } = useI18n();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [notifsOn, setNotifsOn] = useState(true);

  React.useEffect(() => {
    isNotificationsEnabled().then(setNotifsOn);
  }, []);

  const DIRECTIONS = [
    { key: 'swipeLeft', label: t('dir_left'), arrow: '\u2190' },
    { key: 'swipeRight', label: t('dir_right'), arrow: '\u2192' },
    { key: 'swipeUp', label: t('dir_up'), arrow: '\u2191' },
    { key: 'swipeDown', label: t('dir_down'), arrow: '\u2193' },
  ];

  const getLabel = (config) => config.action === ACTIONS.ALBUM ? (config.albumName || t('action_album')) : config.label;
  const currentLang = LANGUAGES.find(l => l.code === override) || LANGUAGES[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('settings_title')}</Text>
        <Text style={styles.subtitle}>{t('settings_subtitle')}</Text>

        {/* Visual preview */}
        <View style={styles.previewCard}>
          <View style={styles.previewGrid}>
            <View style={styles.previewRow}>
              <View style={styles.previewEmpty} />
              <View style={[styles.previewItem, settings.swipeUp.action === ACTIONS.SKIP && styles.previewInactive]}>
                <Text style={styles.previewArrow}>{'\u2191'}</Text>
                <Text style={styles.previewEmoji}>{settings.swipeUp.emoji}</Text>
                <Text style={styles.previewLabel} numberOfLines={1}>{getLabel(settings.swipeUp)}</Text>
              </View>
              <View style={styles.previewEmpty} />
            </View>
            <View style={styles.previewRow}>
              <View style={[styles.previewItem, settings.swipeLeft.action === ACTIONS.SKIP && styles.previewInactive]}>
                <Text style={styles.previewArrow}>{'\u2190'}</Text>
                <Text style={styles.previewEmoji}>{settings.swipeLeft.emoji}</Text>
                <Text style={styles.previewLabel} numberOfLines={1}>{getLabel(settings.swipeLeft)}</Text>
              </View>
              <View style={styles.previewCenter}><Text style={styles.previewCenterEmoji}>{E.camera}</Text></View>
              <View style={[styles.previewItem, settings.swipeRight.action === ACTIONS.SKIP && styles.previewInactive]}>
                <Text style={styles.previewArrow}>{'\u2192'}</Text>
                <Text style={styles.previewEmoji}>{settings.swipeRight.emoji}</Text>
                <Text style={styles.previewLabel} numberOfLines={1}>{getLabel(settings.swipeRight)}</Text>
              </View>
            </View>
            <View style={styles.previewRow}>
              <View style={styles.previewEmpty} />
              <View style={[styles.previewItem, settings.swipeDown.action === ACTIONS.SKIP && styles.previewInactive]}>
                <Text style={styles.previewArrow}>{'\u2193'}</Text>
                <Text style={styles.previewEmoji}>{settings.swipeDown.emoji}</Text>
                <Text style={styles.previewLabel} numberOfLines={1}>{getLabel(settings.swipeDown)}</Text>
              </View>
              <View style={styles.previewEmpty} />
            </View>
          </View>
        </View>

        {DIRECTIONS.map((dir) => (
          <DirectionConfig key={dir.key} direction={dir} config={settings[dir.key]} onUpdate={updateDirection} t={t} />
        ))}

        {/* Skip album photos toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>{E.folder} {t('settings_skip_sorted')}</Text>
            <Text style={styles.toggleDesc}>{t('settings_skip_desc')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, settings.skipAlbumPhotos && styles.toggleOn]}
            onPress={() => updateSettings({ skipAlbumPhotos: !settings.skipAlbumPhotos })}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleKnob, settings.skipAlbumPhotos && styles.toggleKnobOn]} />
          </TouchableOpacity>
        </View>

        {/* Notifications toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>{t('settings_notifications')}</Text>
            <Text style={styles.toggleDesc}>{notifsOn ? t('settings_notif_on') : t('settings_notif_off')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, notifsOn && styles.toggleOn]}
            onPress={async () => {
              const next = !notifsOn;
              setNotifsOn(next);
              await setNotificationsEnabled(next);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleKnob, notifsOn && styles.toggleKnobOn]} />
          </TouchableOpacity>
        </View>

        {/* Language picker */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>{t('settings_language')}</Text>
            <Text style={styles.toggleDesc}>{currentLang.label}</Text>
          </View>
          <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker(!showLangPicker)} activeOpacity={0.7}>
            <Text style={styles.langBtnText}>{'\u203A'}</Text>
          </TouchableOpacity>
        </View>
        {showLangPicker && (
          <View style={styles.langList}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langItem, override === lang.code && styles.langItemActive]}
                onPress={() => { setLanguage(lang.code); setShowLangPicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.langItemText, override === lang.code && styles.langItemTextActive]}>{lang.label}</Text>
                {override === lang.code && <Text style={styles.langCheck}>{'\u2713'}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.tutorialBtn} onPress={async () => {
          await AsyncStorage.removeItem('@zwiip_onboarded');
          // Force reload by navigating
          Alert.alert(t('settings_tutorial_title'), t('settings_tutorial_msg'), [
            { text: 'OK', onPress: () => {} },
          ]);
        }} activeOpacity={0.7}>
          <Text style={styles.tutorialBtnText}>{t('settings_tutorial')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={() => {
          Alert.alert(t('settings_reset_title'), t('settings_reset_msg'), [
            { text: t('settings_cancel'), style: 'cancel' },
            { text: t('settings_reset_confirm'), style: 'destructive', onPress: resetSettings },
          ]);
        }} activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>{t('settings_reset')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg },
  previewCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.lg },
  previewGrid: { gap: 4 },
  previewRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  previewItem: { width: 90, height: 65, backgroundColor: COLORS.surfaceLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 4 },
  previewInactive: { opacity: 0.3 },
  previewEmpty: { width: 90, height: 65 },
  previewCenter: { width: 90, height: 65, backgroundColor: COLORS.primary + '20', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary + '40' },
  previewCenterEmoji: { fontSize: 26 },
  previewArrow: { fontSize: 11, color: COLORS.textDim },
  previewEmoji: { fontSize: 17 },
  previewLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 1 },
  directionCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md },
  directionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  actionButtons: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderWidth: 2, borderColor: 'transparent' },
  actionEmoji: { fontSize: 18 },
  actionLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
  albumDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surfaceLight, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.sm, gap: 12, borderWidth: 1, borderColor: COLORS.undo + '30' },
  albumDisplayIcon: { fontSize: 24 },
  albumDisplayInfo: { flex: 1 },
  albumDisplayName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  albumDisplayHint: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  albumDisplayArrow: { fontSize: 22, color: COLORS.textDim },
  currentSetting: { backgroundColor: COLORS.surfaceLight, borderRadius: 8, padding: 8, alignItems: 'center' },
  currentSettingText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  toggleCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  toggleDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, lineHeight: 16 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: COLORS.surfaceLight, justifyContent: 'center', padding: 3 },
  toggleOn: { backgroundColor: COLORS.keep },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  langBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  langBtnText: { fontSize: 22, color: COLORS.textSecondary },
  langList: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.sm, marginBottom: SPACING.md, marginTop: -SPACING.sm },
  langItem: { paddingVertical: 12, paddingHorizontal: SPACING.md, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  langItemActive: { backgroundColor: COLORS.primary + '20' },
  langItemText: { fontSize: 15, color: COLORS.text },
  langItemTextActive: { color: COLORS.primary, fontWeight: '700' },
  langCheck: { color: COLORS.primary, fontSize: 18, fontWeight: '700' },
  tutorialBtn: { backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: SPACING.md },
  tutorialBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  resetBtn: { backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: SPACING.sm },
  resetBtnText: { color: COLORS.delete, fontSize: 15, fontWeight: '600' },
});

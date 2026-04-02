import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function QuickAlbumSelect({ visible, direction, onDismiss, onGoToSettings }) {
  const isUp = direction === 'up';
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{isUp ? '⬆️' : '⬇️'}</Text>
          <Text style={styles.title}>{`Swipe ${isUp ? 'op' : 'ned'} er ikke opsat`}</Text>
          <Text style={styles.subtitle}>{`Gå til Indstillinger for at vælge hvilken mappe swipe ${isUp ? '↑' : '↓'} skal sortere til.`}</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={onGoToSettings} activeOpacity={0.7}>
            <Text style={styles.settingsBtnText}>{'⚙️ Gå til Indstillinger'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss}><Text style={styles.dismissText}>Luk</Text></TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: SPACING.xl, alignItems: 'center', width: '100%' },
  emoji: { fontSize: 48, marginBottom: SPACING.md },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  settingsBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, marginBottom: SPACING.md },
  settingsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dismissText: { color: COLORS.textDim, fontSize: 14, fontWeight: '500' },
});

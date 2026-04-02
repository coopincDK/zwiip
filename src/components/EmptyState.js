import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

const IMAGES = {
  'all-sorted': require('../../assets/empty/all-sorted.png'),
  'no-duplicates': require('../../assets/empty/no-duplicates.png'),
  'trash-empty': require('../../assets/empty/trash-empty.png'),
};

export default function EmptyState({ icon, svgType, title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      {svgType && IMAGES[svgType] ? (
        <Image source={IMAGES[svgType]} style={styles.image} resizeMode="contain" />
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  image: { width: 180, height: 180, marginBottom: SPACING.lg },
  icon: { fontSize: 72, marginBottom: SPACING.lg },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
  button: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

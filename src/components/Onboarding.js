import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useI18n } from '../i18n';

const PAGE_IMAGES = [
  require('../../assets/onboarding/step-1-welcome.png'),
  require('../../assets/onboarding/step-2-swipe.png'),
  require('../../assets/onboarding/step-3-features.png'),
  require('../../assets/onboarding/step-4-ready.png'),
];

export default function Onboarding({ onComplete }) {
  const { t } = useI18n();
  const [page, setPage] = useState(0);

  const PAGES = [
    {
      image: PAGE_IMAGES[0],
      title: t('onb_welcome'),
      subtitle: t('onb_welcome_sub'),
    },
    {
      image: PAGE_IMAGES[1],
      title: t('onb_swipe'),
      subtitle: t('onb_swipe_sub'),
    },
    {
      image: PAGE_IMAGES[2],
      title: t('onb_safe'),
      subtitle: null,
      highlight: t('onb_safe_highlight'),
      bullets: [
        t('onb_safe_1'),
        t('onb_safe_2'),
        t('onb_safe_3'),
        t('onb_safe_4'),
      ],
    },
    {
      image: PAGE_IMAGES[3],
      title: t('onb_ready'),
      subtitle: t('onb_ready_sub'),
    },
  ];

  const current = PAGES[page];
  const isLast = page === PAGES.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={current.image} style={styles.illustration} resizeMode="contain" />
        <Text style={styles.title}>{current.title}</Text>
        {current.subtitle && <Text style={styles.subtitle}>{current.subtitle}</Text>}
        {current.highlight && (
          <View style={styles.hlBox}>
            <Text style={styles.hlText}>{current.highlight}</Text>
          </View>
        )}
        {current.bullets && (
          <View style={styles.bullets}>
            {current.bullets.map((b, i) => <Text key={i} style={styles.bullet}>{b}</Text>)}
          </View>
        )}
      </View>
      <View style={styles.dots}>
        {PAGES.map((_, i) => <View key={i} style={[styles.dot, i === page && styles.dotActive]} />)}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => isLast ? onComplete() : setPage(p => p + 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.nextBtnText}>{isLast ? t('onb_go') : t('onb_next')}</Text>
        </TouchableOpacity>
        {!isLast && (
          <TouchableOpacity onPress={onComplete}>
            <Text style={styles.skipText}>{t('onb_skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: SPACING.xl },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  illustration: { width: 280, height: 220, marginBottom: SPACING.lg },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: SPACING.md },
  subtitle: { fontSize: 17, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 26 },
  hlBox: { backgroundColor: COLORS.keep + '15', borderWidth: 1, borderColor: COLORS.keep + '40', borderRadius: 16, padding: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.md },
  hlText: { fontSize: 16, fontWeight: '600', color: COLORS.keep, textAlign: 'center', lineHeight: 24 },
  bullets: { alignSelf: 'stretch', gap: 10 },
  bullet: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceLight },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  actions: { gap: 16, alignItems: 'center', paddingBottom: 20 },
  nextBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 16, width: '100%', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  skipText: { color: COLORS.textDim, fontSize: 14 },
});

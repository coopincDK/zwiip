import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StatsCard from '../../src/components/StatsCard';
import { useApp } from '../../src/context/AppContext';
import { COLORS, SPACING } from '../../src/constants/theme';
import { E } from '../../src/constants/emoji';
import { useI18n } from '../../src/i18n';

export default function StatsScreen() {
  const { t } = useI18n();
  const { sessionStats, kept, trashed, lifetimeStats } = useApp();

  // Session
  const sessionDuration = sessionStats.startTime ? Math.floor((Date.now() - sessionStats.startTime) / 1000) : 0;
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = sessionDuration % 60;
  const swipeRate = sessionDuration > 0 ? (sessionStats.reviewed / (sessionDuration / 60)).toFixed(1) : '0';
  const trashPercent = sessionStats.reviewed > 0 ? Math.round((sessionStats.trashed / sessionStats.reviewed) * 100) : 0;
  const sessionMB = (trashed.reduce((sum, p) => sum + (p.fileSize || 0), 0) / (1024 * 1024)).toFixed(1);

  // Lifetime
  const lt = lifetimeStats;
  const ltMB = lt.mbFreed.toFixed(1);
  const daysSince = lt.firstUsed ? Math.max(1, Math.ceil((Date.now() - lt.firstUsed) / 86400000)) : 0;

  // Achievements
  const B = {
    first10: require('../../assets/badges/first-10.png'),
    fifty: require('../../assets/badges/fifty-club.png'),
    hundred: require('../../assets/badges/hundred-club.png'),
    fiveHundred: require('../../assets/badges/five-hundred.png'),
    thousand: require('../../assets/badges/thousand-legend.png'),
    k2_5: require('../../assets/badges/2.5k.png'),
    k5: require('../../assets/badges/5k.png'),
    k10: require('../../assets/badges/10k.png'),
    k12_5: require('../../assets/badges/12.5k.png'),
    k25: require('../../assets/badges/25k.png'),
    k50: require('../../assets/badges/50k.png'),
    k75: require('../../assets/badges/75k.png'),
    k100: require('../../assets/badges/100k.png'),
    gbFreed: require('../../assets/badges/gb-freed.png'),
    speedDemon: require('../../assets/badges/speed-demon.png'),
    streak: require('../../assets/badges/streak-fire.png'),
  };

  const achievements = [];
  // Sorterings-milepæle
  if (lt.totalReviewed >= 10)    achievements.push({ badge: B.first10, label: t('ach_10') });
  if (lt.totalReviewed >= 50)    achievements.push({ badge: B.fifty, label: t('ach_50') });
  if (lt.totalReviewed >= 100)   achievements.push({ badge: B.hundred, label: t('ach_100') });
  if (lt.totalReviewed >= 500)   achievements.push({ badge: B.fiveHundred, label: t('ach_500') });
  if (lt.totalReviewed >= 1000)  achievements.push({ badge: B.thousand, label: t('ach_1k') });
  if (lt.totalReviewed >= 2500)  achievements.push({ badge: B.k2_5, label: t('ach_2_5k') });
  if (lt.totalReviewed >= 5000)  achievements.push({ badge: B.k5, label: t('ach_5k') });
  if (lt.totalReviewed >= 10000) achievements.push({ badge: B.k10, label: t('ach_10k') });
  if (lt.totalReviewed >= 12500) achievements.push({ badge: B.k12_5, label: t('ach_12_5k') });
  if (lt.totalReviewed >= 25000) achievements.push({ badge: B.k25, label: t('ach_25k') });
  if (lt.totalReviewed >= 50000) achievements.push({ badge: B.k50, label: t('ach_50k') });
  if (lt.totalReviewed >= 75000) achievements.push({ badge: B.k75, label: t('ach_75k') });
  if (lt.totalReviewed >= 100000) achievements.push({ badge: B.k100, label: t('ach_100k') });
  // Plads frigjort
  if (lt.mbFreed >= 100)  achievements.push({ badge: B.gbFreed, label: t('ach_100mb') });
  if (lt.mbFreed >= 1000) achievements.push({ badge: B.gbFreed, label: t('ach_1gb') });
  // Challenge & streak
  if (lt.bestChallengeScore >= 30) achievements.push({ badge: B.speedDemon, label: t('ach_speed') });
  if (lt.streakDays >= 3) achievements.push({ badge: B.streak, label: t('ach_streak', { count: lt.streakDays }) });
  if (lt.streakDays >= 7) achievements.push({ badge: B.streak, label: t('ach_week_hero') });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('stats_title')}</Text>

        {/* SESSION */}
        <Text style={styles.sectionHeader}>{t('stats_session')}</Text>
        <View style={styles.statsRow}>
          <StatsCard icon={E.camera} value={sessionStats.reviewed} label={t('stats_reviewed')} color={COLORS.primary} />
          <StatsCard icon={E.heart} value={sessionStats.kept} label={t('stats_kept')} color={COLORS.keep} />
          <StatsCard icon={E.trash} value={sessionStats.trashed} label={t('stats_trashed')} color={COLORS.delete} />
        </View>
        <View style={styles.statsRow}>
          <StatsCard icon={E.timer} value={`${minutes}:${seconds.toString().padStart(2, '0')}`} label={t('stats_time')} />
          <StatsCard icon={E.zap} value={swipeRate} label={t('stats_swipes_min')} color={COLORS.undo} />
          <StatsCard icon={E.disk} value={sessionMB} label={t('stats_mb_ready')} color={COLORS.primaryLight} />
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>{t('stats_trash_ratio')}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${trashPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{t('stats_trash_pct', { pct: trashPercent })}</Text>
        </View>

        {/* LIFETIME */}
        <Text style={styles.sectionHeader}>{E.star} {t('stats_lifetime')}</Text>
        <View style={styles.statsRow}>
          <StatsCard icon={E.camera} value={lt.totalReviewed} label={t('stats_sorted')} color={COLORS.primary} />
          <StatsCard icon={E.trash} value={lt.totalDeleted} label={t('stats_deleted')} color={COLORS.delete} />
          <StatsCard icon={E.disk} value={ltMB} label={t('stats_mb_freed')} color={COLORS.keep} />
        </View>
        <View style={styles.statsRow}>
          <StatsCard icon={E.numbers} value={lt.sessionsCompleted} label={t('stats_sessions')} />
          <StatsCard icon={E.fire} value={lt.streakDays || 0} label={t('stats_streak')} color={COLORS.undo} />
          <StatsCard icon={E.zap} value={lt.bestChallengeScore > 0 ? lt.bestChallengeScore.toFixed(1) : '-'} label={t('stats_record')} color={COLORS.primary} />
        </View>

        {daysSince > 0 && (
          <View style={styles.sinceCard}>
            <Text style={styles.sinceText}>
              {E.calendar + ' ' + (daysSince === 1 ? t('stats_since', { count: daysSince }) : t('stats_since_plural', { count: daysSince }))}
            </Text>
          </View>
        )}

        {/* ACHIEVEMENTS */}
        <Text style={styles.sectionHeader}>{t('stats_achievements')}</Text>
        {achievements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{E.target}</Text>
            <Text style={styles.emptyText}>{t('stats_first_achievement')}</Text>
          </View>
        ) : (
          <View style={styles.badgeGrid}>
            {achievements.map((a, i) => (
              <View key={i} style={styles.badge}>
                <Image source={a.badge} style={styles.badgeImage} resizeMode="contain" />
                <Text style={styles.badgeLabel}>{a.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>
            {lt.totalReviewed === 0 ? E.wave : lt.totalReviewed < 50 ? E.muscle : lt.totalReviewed < 200 ? E.fire : E.crown}
          </Text>
          <Text style={styles.motivationText}>
            {lt.totalReviewed === 0 ? t('motivation_start')
              : lt.totalReviewed < 50 ? t('motivation_good')
              : lt.totalReviewed < 200 ? t('motivation_fire')
              : t('motivation_legend')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginTop: SPACING.md, marginBottom: SPACING.sm },
  statsRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  progressSection: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.md, marginBottom: SPACING.sm },
  progressLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  progressBar: { height: 10, backgroundColor: COLORS.surfaceLight, borderRadius: 5, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: COLORS.delete, borderRadius: 5 },
  progressText: { fontSize: 12, color: COLORS.textSecondary },
  sinceCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  sinceText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  badge: { backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeImage: { width: 32, height: 32 },
  badgeLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  emptyCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md },
  emptyIcon: { fontSize: 36, marginBottom: SPACING.sm },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center' },
  motivationCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
  motivationEmoji: { fontSize: 44, marginBottom: SPACING.sm },
  motivationText: { color: COLORS.text, fontSize: 16, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
});

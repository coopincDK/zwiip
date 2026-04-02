import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Share, Image, ImageBackground, Modal } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useI18n } from '../i18n';

const TIMER_RING = require('../../assets/challenge/timer-ring.png');
const RESULT_BG = require('../../assets/challenge/result-bg.png');

const CHALLENGE_DURATION = 60;

export default function ChallengeMode({ onStart, onEnd, sessionStats, onShowResultChange }) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalStats, setFinalStats] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) { if (isRunning && timeLeft <= 0) endChallenge(); return; }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (isRunning) Animated.timing(progressAnim, { toValue: timeLeft / CHALLENGE_DURATION, duration: 1000, useNativeDriver: false }).start();
  }, [timeLeft, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft <= 30 && timeLeft > 0)
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
  }, [timeLeft, isRunning]);

  const startChallenge = () => { setTimeLeft(CHALLENGE_DURATION); setIsRunning(true); setShowResult(false); setFinalStats(null); progressAnim.setValue(1); onStart && onStart(); };

  const endChallenge = () => {
    setIsRunning(false);
    const used = CHALLENGE_DURATION - timeLeft;
    const stats = { reviewed: sessionStats.reviewed, trashed: sessionStats.trashed, kept: sessionStats.kept, timeUsed: used, swipesPerMin: used > 0 ? ((sessionStats.reviewed / (used / 60)) || 0).toFixed(1) : '0' };
    setFinalStats(stats); setShowResult(true); onShowResultChange && onShowResultChange(true); onEnd && onEnd(stats);
  };

  const shareResult = async () => {
    if (!finalStats) return;
    const min = Math.floor(finalStats.timeUsed / 60);
    const sec = (finalStats.timeUsed % 60).toString().padStart(2, '0');
    try {
      await Share.share({ message: t('challenge_share_msg', { reviewed: finalStats.reviewed, trashed: finalStats.trashed, swipesPerMin: finalStats.swipesPerMin, time: `${min}:${sec}` }) });
    } catch (e) {}
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pw = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const pc = progressAnim.interpolate({ inputRange: [0, 0.15, 0.5, 1], outputRange: [COLORS.delete, COLORS.delete, COLORS.undo, COLORS.keep] });

  // Challenge Result Screen
  if (showResult && finalStats) {
    return (
      <Modal visible animationType="fade" transparent statusBarTranslucent>
      <ImageBackground source={RESULT_BG} style={styles.resultOverlay} resizeMode="cover">
        <View style={styles.resultContent}>
          <Text style={styles.resultEmoji}>{finalStats.reviewed >= 100 ? '🏆' : finalStats.reviewed >= 50 ? '🔥' : '💪'}</Text>
          <Text style={styles.resultTitle}>{t('challenge_done')}</Text>
          <View style={styles.resultStats}>
            <View style={styles.resultStat}><Text style={styles.rsv}>{finalStats.reviewed}</Text><Text style={styles.rsl}>{t('challenge_sorted')}</Text></View>
            <View style={styles.rsd} />
            <View style={styles.resultStat}><Text style={[styles.rsv, { color: COLORS.delete }]}>{finalStats.trashed}</Text><Text style={styles.rsl}>{t('challenge_trashed')}</Text></View>
            <View style={styles.rsd} />
            <View style={styles.resultStat}><Text style={[styles.rsv, { color: COLORS.undo }]}>{finalStats.swipesPerMin}</Text><Text style={styles.rsl}>{t('challenge_swipes_min')}</Text></View>
          </View>
          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.shareBtn} onPress={shareResult}><Text style={styles.shareBtnText}>{t('challenge_share')}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={startChallenge}><Text style={styles.retryBtnText}>{t('challenge_retry')}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowResult(false); onShowResultChange && onShowResultChange(false); }}><Text style={styles.dismissText}>{t('challenge_dismiss')}</Text></TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
      </Modal>
    );
  }

  // Running Timer
  if (isRunning) {
    return (
      <View style={styles.timerContainer}>
        <View style={styles.timerRow}>
          <Image source={TIMER_RING} style={styles.timerRingIcon} resizeMode="contain" />
          <Text style={styles.timerLabel}>{t('challenge_label')}</Text>
          <Animated.Text style={[styles.timerText, { transform: [{ scale: pulseAnim }] }, timeLeft <= 30 && { color: COLORS.delete }]}>{fmt(timeLeft)}</Animated.Text>
          <TouchableOpacity onPress={endChallenge} style={styles.stopBtn}><Text style={styles.stopBtnText}>{t('challenge_stop')}</Text></TouchableOpacity>
        </View>
        <View style={styles.pbb}><Animated.View style={[styles.pbf, { width: pw, backgroundColor: pc }]} /></View>
      </View>
    );
  }

  // Start Button
  return (
    <TouchableOpacity style={styles.startBtn} onPress={startChallenge} activeOpacity={0.7}>
      <Text style={styles.startBtnEmoji}>⚡</Text>
      <View>
        <Text style={styles.startBtnText}>{t('challenge_title')}</Text>
        <Text style={styles.startBtnSub}>{t('challenge_subtitle')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  startBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + '40', gap: 5 },
  startBtnEmoji: { fontSize: 15 }, startBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary }, startBtnSub: { fontSize: 9, color: COLORS.textSecondary },

  timerContainer: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 10, marginHorizontal: SPACING.lg },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  timerRingIcon: { width: 22, height: 22 },
  timerLabel: { fontSize: 12, fontWeight: '800', color: COLORS.primary, letterSpacing: 1, flex: 1 },
  timerText: { fontSize: 26, fontWeight: '900', color: COLORS.text },
  stopBtn: { backgroundColor: COLORS.delete + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  stopBtnText: { color: COLORS.delete, fontSize: 12, fontWeight: '700' },
  pbb: { height: 5, backgroundColor: COLORS.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  pbf: { height: '100%', borderRadius: 3 },

  resultOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  resultContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: 'rgba(10,10,26,0.85)' },
  resultEmoji: { fontSize: 72, marginBottom: SPACING.md },
  resultTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: SPACING.lg },
  resultStats: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 20, padding: SPACING.lg, marginBottom: SPACING.xl },
  resultStat: { flex: 1, alignItems: 'center' },
  rsv: { fontSize: 32, fontWeight: '900', color: COLORS.text },
  rsl: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  rsd: { width: 1, backgroundColor: COLORS.surfaceLight, marginHorizontal: SPACING.sm },
  resultActions: { gap: 12, width: '100%', alignItems: 'center' },
  shareBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  retryBtn: { backgroundColor: COLORS.surface, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' },
  retryBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  dismissText: { color: COLORS.textDim, fontSize: 13, marginTop: 8 },
});

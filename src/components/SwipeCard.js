import React, { useRef, useCallback } from 'react';
import { Dimensions, StyleSheet, View, Text, Animated, PanResponder, Image as RNImage, TouchableWithoutFeedback } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { COLORS, SPACING } from '../constants/theme';

const OVERLAY_KEEP = require('../../assets/overlays/swipe-keep.png');
const OVERLAY_DELETE = require('../../assets/overlays/swipe-delete.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_H_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_V_THRESHOLD = SCREEN_HEIGHT * 0.12;

function SwipeOverlays({ pos }) {
  const rightOp = pos.x.interpolate({ inputRange: [0, SWIPE_H_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const leftOp = pos.x.interpolate({ inputRange: [-SWIPE_H_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  return (
    <>
      <Animated.View style={[styles.overlayFull, { opacity: rightOp, backgroundColor: 'rgba(76,175,80,0.25)' }]} pointerEvents="none">
        <RNImage source={OVERLAY_KEEP} style={styles.overlayImage} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={[styles.overlayFull, { opacity: leftOp, backgroundColor: 'rgba(255,23,68,0.25)' }]} pointerEvents="none">
        <RNImage source={OVERLAY_DELETE} style={styles.overlayImage} resizeMode="contain" />
      </Animated.View>
    </>
  );
}

export default function SwipeCard({
  photo,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  isTop = true,
  isSwipeAllowed,
  fullscreen = false,
  containerHeight,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  // Legacy position object for overlays (they use pos.x)
  const position = useRef({ x: translateX, y: translateY }).current;
  const didSwipe = useRef(false);
  const cbRef = useRef({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, isTop, photo, isSwipeAllowed });
  cbRef.current = { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, isTop, photo, isSwipeAllowed };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        didSwipe.current = false;
        return false;
      },
      onMoveShouldSetPanResponder: (_, g) => {
        if (!cbRef.current.isTop) return false;
        // Check cooldown before allowing swipe
        const { isSwipeAllowed: checkAllowed } = cbRef.current;
        if (checkAllowed && !checkAllowed()) return false;
        const dominated = Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10;
        if (dominated) didSwipe.current = true;
        return dominated;
      },
      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
        translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        const { onSwipeRight, onSwipeLeft, onSwipeUp, onSwipeDown, photo } = cbRef.current;
        const absX = Math.abs(gesture.dx);
        const absY = Math.abs(gesture.dy);
        const isH = absX > absY;

        const animateOut = (toX, toY, cb) => {
          Animated.parallel([
            Animated.timing(translateX, { toValue: toX, duration: 200, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: toY, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            cb(); // unmount first, then reset
            translateX.setValue(0);
            translateY.setValue(0);
          });
        };

        if (isH && gesture.dx > SWIPE_H_THRESHOLD) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateOut(SCREEN_WIDTH * 1.5, gesture.dy, () => onSwipeRight && onSwipeRight(photo));
        } else if (isH && gesture.dx < -SWIPE_H_THRESHOLD) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          animateOut(-SCREEN_WIDTH * 1.5, gesture.dy, () => onSwipeLeft && onSwipeLeft(photo));
        } else if (!isH && gesture.dy < -SWIPE_V_THRESHOLD && onSwipeUp) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateOut(gesture.dx, -SCREEN_HEIGHT, () => onSwipeUp(photo));
        } else if (!isH && gesture.dy > SWIPE_V_THRESHOLD && onSwipeDown) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateOut(gesture.dx, SCREEN_HEIGHT, () => onSwipeDown(photo));
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  const rotation = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const handleTap = useCallback(() => {
    if (didSwipe.current) return;
    const { onTap, isTop } = cbRef.current;
    if (isTop && onTap) onTap();
  }, []);

  if (!photo) return null;

  const dateStr = photo.creationTime
    ? new Date(photo.creationTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const cardStyle = fullscreen
    ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 0 }
    : containerHeight
      ? { position: 'absolute', top: 0, left: 0, right: 0, height: containerHeight, borderRadius: 18 }
      : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18 };

  return (
    <Animated.View
      style={[{
        transform: [
          { translateX },
          { translateY },
          { rotate: rotation },
        ],
        elevation: isTop ? 5 : 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: fullscreen ? 0 : 0.3, shadowRadius: 8,
      }, cardStyle]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: photo.uri }}
            style={StyleSheet.absoluteFill}
            contentFit={fullscreen ? 'contain' : 'cover'}
            transition={200}
            recyclingKey={photo.id}
          />
        </View>
      </TouchableWithoutFeedback>

      <SwipeOverlays pos={position} />

      <View style={styles.infoBar} pointerEvents="none">
        <View>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.filenameText} numberOfLines={1}>{photo.filename}</Text>
        </View>
        {photo.fileSize > 0 && (
          <Text style={styles.sizeText}>{(photo.fileSize / (1024 * 1024)).toFixed(1)} MB</Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlayFull: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  overlayImage: { width: 120, height: 120 },
  infoBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  dateText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  filenameText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  sizeText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '700' },
});

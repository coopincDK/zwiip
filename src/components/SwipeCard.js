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
  fullscreen = false,
  containerHeight,
}) {
  const position = useRef(new Animated.ValueXY()).current;
  const didSwipe = useRef(false);
  const cbRef = useRef({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, isTop, photo });
  cbRef.current = { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, isTop, photo };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        didSwipe.current = false;
        return false;
      },
      onMoveShouldSetPanResponder: (_, g) => {
        if (!cbRef.current.isTop) return false;
        const dominated = Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10;
        if (dominated) didSwipe.current = true;
        return dominated;
      },
      onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy }),
      onPanResponderRelease: (_, gesture) => {
        const { onSwipeRight, onSwipeLeft, onSwipeUp, onSwipeDown, photo } = cbRef.current;
        const absX = Math.abs(gesture.dx);
        const absY = Math.abs(gesture.dy);
        const isH = absX > absY;
        const animateOut = (toValue, cb) => {
          Animated.timing(position, { toValue, duration: 250, useNativeDriver: false }).start(() => {
            position.setValue({ x: 0, y: 0 });
            cb();
          });
        };
        if (isH && gesture.dx > SWIPE_H_THRESHOLD) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateOut({ x: SCREEN_WIDTH * 1.5, y: gesture.dy }, () => onSwipeRight && onSwipeRight(photo));
        } else if (isH && gesture.dx < -SWIPE_H_THRESHOLD) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          animateOut({ x: -SCREEN_WIDTH * 1.5, y: gesture.dy }, () => onSwipeLeft && onSwipeLeft(photo));
        } else if (!isH && gesture.dy < -SWIPE_V_THRESHOLD && onSwipeUp) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateOut({ x: gesture.dx, y: -SCREEN_HEIGHT }, () => onSwipeUp(photo));
        } else if (!isH && gesture.dy > SWIPE_V_THRESHOLD && onSwipeDown) {
          didSwipe.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          animateOut({ x: gesture.dx, y: SCREEN_HEIGHT }, () => onSwipeDown(photo));
        } else {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const rotation = position.x.interpolate({
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

  const cardW = fullscreen ? SCREEN_WIDTH : SCREEN_WIDTH - 32;

  const cardStyle = isTop ? {
    transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotation }],
  } : { transform: [{ scale: 0.95 }], opacity: 0.7 };

  return (
    <Animated.View
      style={[{
        position: fullscreen ? 'relative' : 'absolute',
        top: fullscreen ? undefined : 0,
        left: fullscreen ? undefined : 16,
        right: fullscreen ? undefined : 16,
        bottom: fullscreen ? undefined : 0,
        width: fullscreen ? SCREEN_WIDTH : undefined,
        height: fullscreen ? SCREEN_HEIGHT * 0.85 : undefined,
        borderRadius: fullscreen ? 0 : 10,
        overflow: 'hidden',
        backgroundColor: fullscreen ? '#000' : COLORS.surface,
        elevation: fullscreen ? 0 : 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
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

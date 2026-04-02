import React from 'react';
import { TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { COLORS } from '../constants/theme';

const ACTION_IMAGES = {
  delete: require('../../assets/actions/delete.png'),
  undo: require('../../assets/actions/undo.png'),
  keep: require('../../assets/actions/keep.png'),
};

export default function ActionButton({ onPress, icon, imageKey, label, color, size = 64, disabled = false }) {
  const imgSource = imageKey ? ACTION_IMAGES[imageKey] : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{ opacity: disabled ? 0.3 : 1, alignItems: 'center' }}
    >
      {imgSource ? (
        <Image source={imgSource} style={{ width: size, height: size }} resizeMode="contain" />
      ) : (
        <Text style={{ fontSize: size * 0.6, textAlign: 'center' }}>{icon}</Text>
      )}
      {label && <Text style={[styles.label, { color }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});

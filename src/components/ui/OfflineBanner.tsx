import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { theme }   = useTheme();
  const { isOnline } = useNetworkStatus();
  const translateY  = useSharedValue(-40);

  React.useEffect(() => {
    translateY.value = isOnline
      ? withTiming(-40, { duration: 350 })
      : withSpring(0, { damping: 18 });
  }, [isOnline, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, style]}>
      <Text style={styles.text}>📵 Tidak ada koneksi internet</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#F87171',
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

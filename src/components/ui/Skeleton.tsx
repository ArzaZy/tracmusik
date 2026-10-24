import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: borderRadius ?? theme.radius.md,
          backgroundColor: theme.isDark
            ? 'rgba(255,255,255,0.10)'
            : 'rgba(0,0,0,0.08)',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function TrackRowSkeleton() {
  const { theme } = useTheme();
  return (
    <Animated.View style={[styles.row, { paddingHorizontal: theme.spacing[4] }]}>
      <Skeleton width={52} height={52} borderRadius={theme.radius.sm} />
      <Animated.View style={styles.rowText}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="45%" style={{ marginTop: 6 }} />
      </Animated.View>
    </Animated.View>
  );
}

export function CardSkeleton({ size = 140 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <Animated.View style={{ marginRight: theme.spacing[3] }}>
      <Skeleton width={size} height={size} borderRadius={theme.radius.md} />
      <Skeleton height={13} width={size * 0.75} style={{ marginTop: 8 }} />
      <Skeleton height={11} width={size * 0.5} style={{ marginTop: 5 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
});

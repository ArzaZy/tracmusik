import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  AccessibilityRole,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface SpringButtonProps {
  onPress:           () => void;
  children:          React.ReactNode;
  style?:            StyleProp<ViewStyle>;
  haptic?:           'light' | 'medium' | 'none';
  scaleDown?:        number;
  disabled?:         boolean;
  accessibilityLabel?: string;
  accessibilityRole?:  AccessibilityRole;
  hitSlop?:          number;
}

export function SpringButton({
  onPress,
  children,
  style,
  haptic = 'light',
  scaleDown = 0.94,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop,
}: SpringButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleDown, { damping: 10, stiffness: 300 });
  }, [scale, scaleDown]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 250 });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (haptic === 'light')  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (haptic === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [haptic, onPress]);

  return (
    <Animated.View style={[animStyle, disabled && { opacity: 0.4 }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        hitSlop={hitSlop}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

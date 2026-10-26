import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const { theme } = useTheme();

  const logoScale   = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY       = useSharedValue(20);
  const containerOp = useSharedValue(1);

  useEffect(() => {
    // Logo pops in
    logoScale.value   = withSpring(1, { damping: 12, stiffness: 180 });
    logoOpacity.value = withTiming(1, { duration: 300 });

    // Tagline fades up
    textOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    textY.value       = withDelay(400, withSpring(0, { damping: 18 }));

    // Whole screen fades out, then calls onFinish
    containerOp.value = withDelay(
      1400,
      withTiming(0, { duration: 400 }, (done) => {
        if (done) runOnJS(onFinish)();
      }),
    );
  }, []);

  const logoStyle      = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }], opacity: logoOpacity.value }));
  const textStyle      = useAnimatedStyle(() => ({ opacity: textOpacity.value, transform: [{ translateY: textY.value }] }));
  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOp.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerStyle]}>
      <LinearGradient
        colors={[theme.colors.accent + 'CC', theme.colors.bg]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={[styles.logoCircle, { backgroundColor: '#fff' }]}>
          <Text style={styles.logoEmoji}>🎵</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>TracMusic</Text>
        <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
          Music worth listening to
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:  { justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  logoWrap:   { marginBottom: 24 },
  logoCircle: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowRadius: 24, shadowOpacity: 0.3, elevation: 12 },
  logoEmoji:  { fontSize: 52 },
  textWrap:   { alignItems: 'center', gap: 6 },
  appName:    { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  tagline:    { fontSize: 15, fontWeight: '400' },
});

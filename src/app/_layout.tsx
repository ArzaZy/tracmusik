import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { initializeProviders } from '../providers/registry';
import { useLibraryStore } from '../services/libraryStore';
import { AudioService } from '../services/audio/AudioService';
import { useAuthStore } from '../services/auth/AuthService';
import { CloudSync } from '../services/auth/CloudSync';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { AnimatedSplash } from '../components/ui/AnimatedSplash';
import '../localization';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme }   = useTheme();
  const loadLibrary = useLibraryStore(s => s.loadLibrary);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          initializeProviders(),
          loadLibrary(),
          AudioService.setup().catch(() => {}), // OK to fail in Expo Go
          useAuthStore.getState().initialize(),
        ]);
        const { user } = useAuthStore.getState();
        if (user) {
          CloudSync.setUserId(user.id);
          CloudSync.fullSync().catch(() => {});
        }
      } catch (e) {
        console.warn('[Layout] Init error:', e);
      } finally {
        SplashScreen.hideAsync();
      }
    }
    init();
    return () => { AudioService.destroy(); };
  }, [loadLibrary]);

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)"          options={{ animation: 'fade' }} />
        <Stack.Screen name="player"          options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="queue"           options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding"      options={{ animation: 'fade' }} />
        <Stack.Screen name="auth"            options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="import-playlist" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      {showSplash && (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

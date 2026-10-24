import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { initializeProviders } from '../providers/registry';
import { useLibraryStore } from '../services/libraryStore';
import '../localization';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { theme } = useTheme();
  const loadLibrary = useLibraryStore(s => s.loadLibrary);

  useEffect(() => {
    initializeProviders();
    loadLibrary().then(() => {
      SplashScreen.hideAsync();
    });
  }, [loadLibrary]);

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
        <Stack.Screen name="player"   options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

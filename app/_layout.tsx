import React from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold,
  Figtree_700Bold, Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  const [loaded] = useFonts({
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold,
    Figtree_700Bold, Figtree_800ExtraBold,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="top-up" />
          <Stack.Screen name="balance" />
          <Stack.Screen name="alerts" />
          <Stack.Screen name="subscribe" />
          <Stack.Screen name="fill/[id]" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

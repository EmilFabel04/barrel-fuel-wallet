import React from 'react';
import { Stack } from 'expo-router';
import {
  useFonts,
  Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold,
  Figtree_700Bold, Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import {
  JetBrainsMono_400Regular, JetBrainsMono_500Medium,
  JetBrainsMono_700Bold, JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { MOTION } from '../src/theme/motion';

export default function RootLayout() {
  const [loaded] = useFonts({
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold,
    Figtree_700Bold, Figtree_800ExtraBold,
    JetBrainsMono_400Regular, JetBrainsMono_500Medium,
    JetBrainsMono_700Bold, JetBrainsMono_800ExtraBold,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Set explicitly rather than left to the per-platform default, so a
            push looks the same on both. iOS's native stack already slides from
            the right; naming it makes Android match instead of cross-fading,
            and gives the two a shared duration. The back swipe is the native
            stack's own and is left alone. */}
        <Stack screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: MOTION.screen,
        }}>
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

import React from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
import { Banner } from '../src/components/Banner';
import { useWallet } from '../src/store/wallet';
import { STATIONS } from '../src/data/stations';
import { formatLitres } from '../src/lib/format';

/**
 * Mounted above the stack so an arriving fill is announced wherever the user
 * happens to be, including inside the tabs. Renders nothing until there is
 * something to announce.
 */
function ArrivalBanner() {
  const router = useRouter();
  const id = useWallet(s => s.arrivedFillId);
  const dismiss = useWallet(s => s.dismissArrival);
  const entry = useWallet(s => s.ledger.find(e => e.id === s.arrivedFillId));
  if (!id || !entry?.card) return null;
  // Prefer the resolved station's own name over the raw card descriptor, which
  // arrives shouty off the rail ('SHELL GRAYSTON').
  const name = STATIONS.find(st => st.id === entry.card!.stationId)?.name
    ?? entry.card!.merchantDescriptor;
  return (
    <Banner
      title={name}
      detail={`−${formatLitres(Math.abs(entry.deltaLitres))} L`}
      onPress={() => { dismiss(); router.push(`/fill/${id}`); }}
      onDismiss={dismiss}
    />
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold,
    Figtree_700Bold, Figtree_800ExtraBold,
    JetBrainsMono_400Regular, JetBrainsMono_500Medium,
    JetBrainsMono_700Bold, JetBrainsMono_800ExtraBold,
  });
  // The wallet is read from storage asynchronously, so the screens wait for it
  // as well as for the fonts. Painting the seed first and swapping to the
  // persisted wallet a frame later is worse than one slightly longer hold.
  const hydrated = useWallet(s => s.hasHydrated);
  if (!loaded || !hydrated) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* Set explicitly rather than left to the per-platform default, so a
            push looks the same on both. iOS's native stack already slides from
            the right; naming it makes Android match instead of cross-fading,
            and gives the two a shared duration. The back swipe is the native
            stack's own and is left alone. */}
        <View style={{ flex: 1 }}>
        <Stack screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: MOTION.screen,
        }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="top-up" />
          <Stack.Screen name="litres" />
          <Stack.Screen name="history" />
          <Stack.Screen name="alerts" />
          <Stack.Screen name="subscribe" />
          <Stack.Screen name="fill/[id]" />
        </Stack>
        <ArrivalBanner />
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

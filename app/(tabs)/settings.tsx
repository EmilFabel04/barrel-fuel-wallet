import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Row } from '../../src/components/Row';
import { Toggle } from '../../src/components/Toggle';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet, Appearance } from '../../src/store/wallet';
import { MONTHLY_CAP_LITRES } from '../../src/lib/caps';

const TOGGLE_LABELS = ['Price increase alerts', 'Weekly balance summary', 'Station promotions'];

// Dark -> Light -> System -> Dark. This row is the only in-app way to reach
// light mode (spec §6), so the cycle order matters: light sits one tap away
// from the app's default dark start state.
const NEXT: Record<Appearance, Appearance> = { dark: 'light', light: 'system', system: 'dark' };

const capitalise = (s: string): string => s[0].toUpperCase() + s.slice(1);

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const alerts = useWallet(s => s.alerts);
  const toggleAlert = useWallet(s => s.toggleAlert);
  const appearance = useWallet(s => s.appearance);
  const setAppearance = useWallet(s => s.setAppearance);
  const trialDaysLeft = useWallet(s => s.trialDaysLeft);

  return (
    <Screen insetBottom={false}>
      <ScreenHeader title="Settings" back={false} />
      <ScrollView>
        <View style={{ paddingTop: 34, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 54, height: 54, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: t.inverse }}>TM</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, letterSpacing: -0.4, color: t.text }}>Thabo Makhubela</Text>
            <Num size={12} weight="500" color={t.textMuted} style={{ marginTop: 8 }}>+27 82 441 0912 · verified</Num>
          </View>
        </View>

        <View style={{ paddingTop: 32 }}>
          <SectionLabel>Alerts</SectionLabel>
          <View style={{ marginTop: 8 }}>
            {TOGGLE_LABELS.map((label, i) => (
              <Row key={label} label={label} right={
                <Toggle on={alerts[i]} label={label} onPress={() => toggleAlert(i)} />
              } />
            ))}
          </View>
        </View>

        <View style={{ paddingTop: 28 }}>
          <SectionLabel>Account</SectionLabel>
          <View style={{ marginTop: 8 }}>
            <Row label="Subscription" value={`Trial · ${trialDaysLeft} days left`} onPress={() => router.push('/subscribe')} />
            <Row label="Payment methods" value="FNB ••4127" />
            <Row label="Linked vehicle" value="CA 418 921" />
            <Row label="Monthly cap" value={`${MONTHLY_CAP_LITRES} L`} />
            <Row label="Fuel grade" value="Petrol 95" />
            <Row
              label="Appearance"
              value={capitalise(appearance)}
              onPress={() => setAppearance(NEXT[appearance])}
            />
            <Row label="Help & FICA documents" value="→" />
          </View>
        </View>

        <View style={{ paddingTop: 24, paddingBottom: 12, gap: 14 }}>
          <Button label="SIGN OUT" variant="secondary" height={54} />
          <Num size={11} weight="500" color={t.textMuted} style={{ textAlign: 'center' }}>
            Barrel v2.4.0 · FSP 51284
          </Num>
        </View>
      </ScrollView>
    </Screen>
  );
}

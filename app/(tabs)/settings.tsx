import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Row } from '../../src/components/Row';
import { Toggle } from '../../src/components/Toggle';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { RADIUS } from '../../src/theme/tokens';
import { useWallet, Appearance } from '../../src/store/wallet';
import { useSession } from '../../src/store/session';
import { MONTHLY_TOPUP_CAP_L, WEEKLY_REDEMPTION_CAP_L } from '../../src/lib/caps';

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
  const scheduleDemoFill = useWallet(s => s.scheduleDemoFill);
  const resetDemo = useWallet(s => s.resetDemo);
  const signOut = useSession(s => s.signOut);
  const trialDaysLeft = useWallet(s => s.trialDaysLeft);
  const subscription = useWallet(s => s.subscription);
  // spec §9.3: "Subscription · Trial · 24 days left" while trialling; once
  // resolved one way or the other there's no day count to show, just the
  // state itself — this was hardcoded to the literal word "Trial" before,
  // so `active` and `lapsed` never rendered.
  const subscriptionValue = subscription === 'trial'
    ? `Trial · ${trialDaysLeft} days left`
    : capitalise(subscription);

  // scroll={false}: this screen's body is already a ScrollView.
  return (
    <Screen insetBottom={false} scroll={false}>
      <ScreenHeader title="Settings" back={false} />
      <ScrollView>
        <View style={{ paddingTop: 34, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 54, height: 54, borderRadius: RADIUS.sm, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: t.inverse }}>TM</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 20, letterSpacing: -0.4, color: t.text }}>Thabo Makhubela</Text>
            <Readout size={12} weight="500" color={t.textMuted} style={{ marginTop: 8 }}>+27 82 441 0912 · verified</Readout>
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
            <Row label="Subscription" value={subscriptionValue} onPress={() => router.push('/subscribe')} />
            <Row label="Payment methods" value="FNB ••4127" />
            <Row label="Linked vehicle" value="CA 418 921" />
            <Row label="Monthly top-up cap" value={`${MONTHLY_TOPUP_CAP_L} L`} />
            <Row label="Weekly card limit" value={`${WEEKLY_REDEMPTION_CAP_L} L`} />
            <Row label="Fuel grade" value="Petrol 95" />
            <Row
              label="Appearance"
              value={capitalise(appearance)}
              onPress={() => setAppearance(NEXT[appearance])}
            />
            <Row label="Help & FICA documents" value="→" />
          </View>
        </View>

        {/* Prototype control, not shipping UI. Deliberately labelled and
            captioned so it reads as a debug tool rather than a feature a
            reviewer could mistake for one. It lived on the Card screen, which
            put a debug button under the product's primary object; every
            prototype-only affordance now sits together, here. */}
        <View style={{ paddingTop: 28, gap: 12 }}>
          <SectionLabel>Demo — prototype only</SectionLabel>
          <Button
            label="SIMULATE AN ARRIVING FILL"
            variant="secondary"
            height={54}
            onPress={() => scheduleDemoFill(4)}
          />
          <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 16, color: t.textMuted }}>
            Records a card-rail fill at a random station four seconds from now, so you can
            watch it land. It runs the real fill path — attribution, pricing, FIFO, the
            ledger and the weekly cap. Not part of the product.
          </Text>
          <Button
            label="RESET DEMO DATA"
            variant="secondary"
            height={54}
            onPress={resetDemo}
          />
          <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 16, color: t.textMuted }}>
            The wallet is now saved between launches, so a demo that has been spent down
            stays that way. This puts the lots, the ledger, the card and the alerts back to
            the seed. Your appearance setting is kept.
          </Text>
        </View>

        <View style={{ paddingTop: 24, paddingBottom: 12, gap: 14 }}>
          <Button
            label="SIGN OUT"
            variant="secondary"
            height={54}
            // Confirmed rather than instant: wiring this control up without a
            // confirm would close one gap (an inert button) by opening another
            // (GAPS 2.5). The copy states what happens to the wallet, because
            // that is the part a user cannot guess.
            onPress={() =>
              Alert.alert(
                'Sign out?',
                'Your litres stay on this device and will be here when you sign back in.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign out', style: 'destructive', onPress: signOut },
                ],
              )
            }
          />
          <Readout size={11} weight="500" color={t.textMuted} style={{ textAlign: 'center' }}>
            Barrel v2.4.0 · FSP 51284
          </Readout>
        </View>
      </ScrollView>
    </Screen>
  );
}

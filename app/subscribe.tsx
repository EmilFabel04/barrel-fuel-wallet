import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet } from '../src/store/wallet';
import { spokenRand } from '../src/lib/format';

// spec §9.3: "R59/month, the midpoint of the R49-R79 range." A single
// source for the hero and its accessibility label, so the two can't drift.
const MONTHLY_PRICE = 59;

// spec §9.3: "a four-row included list ... price-lock on every litre, price-
// increase alerts, works at any fuel station, no markup on fuel."
const INCLUDED = [
  'Price lock on every litre you buy',
  'Price-increase alerts before they land',
  'Works at any fuel station in South Africa',
  'No markup on fuel — ever',
];

export default function Subscribe() {
  const t = useTheme();
  const router = useRouter();
  const setSubscription = useWallet(s => s.setSubscription);

  return (
    <Screen>
      <ScreenHeader title="Subscription" />

      <View style={{ paddingTop: 44 }}>
        {/* spec §10.1: grouped into one accessible node rather than three
            separate text nodes, derived from the same MONTHLY_PRICE the
            hero displays. */}
        <View accessible accessibilityLabel={`${spokenRand(MONTHLY_PRICE)} per month`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Num size={34} color={t.textMuted}>R</Num>
          <Num size={82}>{MONTHLY_PRICE}</Num>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 17, color: t.textDim }}>/ month</Text>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}>
        <Rule />
        {INCLUDED.map(line => (
          <View key={line}>
            <View style={{ paddingVertical: 17, flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 14, color: t.positiveText }}>—</Text>
              <Text style={{ flex: 1, fontFamily: 'Figtree_500Medium', fontSize: 14, lineHeight: 20, color: t.text }}>{line}</Text>
            </View>
            <Rule />
          </View>
        ))}
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 12 }}>
        <Button
          label="START 30-DAY TRIAL"
          onPress={() => { setSubscription('trial'); router.back(); }}
        />
        {/* CPA s14 doing product work (spec §9.3) — reproduced verbatim. */}
        <Text style={{ textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 12, color: t.textMuted }}>
          Cancel any time. Your litres stay yours.
        </Text>
      </View>
    </Screen>
  );
}

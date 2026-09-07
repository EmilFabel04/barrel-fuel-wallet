import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { SectionLabel } from '../src/components/SectionLabel';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { Keypad } from '../src/components/Keypad';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet, selectLitresThisMonth, selectCapRemaining } from '../src/store/wallet';
import { MONTHLY_CAP_LITRES } from '../src/lib/caps';
import { formatLitres, formatRandWhole, formatPrice } from '../src/lib/format';
import { priceOn } from '../src/data/prices';
import { TODAY } from '../src/data/seed';

// Default of R500 (not the design's R1 500) is deliberate: the seed already
// carries 105.2 L of September top-ups against the 150 L cap, leaving 44.8 L
// (~R980) of headroom. R1 500 would open this screen already disabled at
// "MONTHLY CAP REACHED", hiding the live conversion the screen exists to
// demonstrate (spec §4.2, §8.2).
export default function TopUp() {
  const t = useTheme();
  const router = useRouter();
  const [raw, setRaw] = useState('500');
  const topUp = useWallet(s => s.topUp);
  const used = useWallet(selectLitresThisMonth);
  const remaining = useWallet(selectCapRemaining);
  const subscription = useWallet(s => s.subscription);
  // spec §9.3: "A lapsed subscription greys the Top up button and shows
  // RESUME SUBSCRIPTION; it never blocks the card or the existing balance."
  // So this button alone changes — litres already bought stay fully usable,
  // and the button still routes somewhere (to resolve the lapse) rather than
  // going inert.
  const lapsed = subscription === 'lapsed';

  const price = priceOn('inland', TODAY);
  const rand = parseInt(raw || '0', 10);
  const litres = rand / price;
  const wouldExceed = litres > remaining;
  const pct = Math.min(1, used / MONTHLY_CAP_LITRES);

  return (
    <Screen>
      <ScreenHeader title="Top up" />

      <View style={{ paddingTop: 34 }}>
        <View style={{ borderWidth: 1, borderColor: t.border, height: 50, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 12, letterSpacing: 1.2, color: t.text }}>PETROL 95</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 12, color: t.textMuted }}>
            {formatLitres(used)} / {MONTHLY_CAP_LITRES} L this month
          </Text>
          <View style={{ height: 2, backgroundColor: t.hairline, marginTop: 8 }}>
            <View style={{ height: 2, width: `${pct * 100}%`, backgroundColor: pct > 0.8 ? t.accent : t.text }} />
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}>
        <SectionLabel>You pay</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
          <Num size={30} color={t.textMuted}>R</Num>
          <Num size={76}>{formatRandWhole(rand)}</Num>
          <View style={{ width: 2, height: 56, backgroundColor: t.accent }} />
        </View>
        <View style={{ marginVertical: 26 }}><Rule /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <SectionLabel>You get</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
              <Num size={46}>{formatLitres(litres)}</Num>
              <Num size={20} color={t.textDim}>L</Num>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>locked at</Text>
            <Num size={15} style={{ marginTop: 4 }}>R{formatPrice(price)}/L</Num>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12 }}>
        <Keypad value={raw} onChange={setRaw} />
        <View style={{ marginTop: 14 }}>
          {lapsed ? (
            // Greyed like Button's `disabled` look, but deliberately still
            // tappable — this is a route to resolve the lapse, not a lock.
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="RESUME SUBSCRIPTION"
              onPress={() => router.push('/subscribe')}
              style={{
                height: 58, borderRadius: 3, backgroundColor: t.surface,
                alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44,
              }}
            >
              <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 15, letterSpacing: 0.45, color: t.textMuted }}>
                RESUME SUBSCRIPTION
              </Text>
            </Pressable>
          ) : (
            <Button
              label={wouldExceed ? 'MONTHLY CAP REACHED' : rand > 0 ? `BUY ${formatLitres(litres)} L` : 'ENTER AMOUNT'}
              disabled={wouldExceed || rand <= 0}
              onPress={() => { topUp(rand); router.back(); }}
            />
          )}
        </View>
        <Text style={{ marginTop: 12, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Litres you don&apos;t use convert back to the rand you paid. No cash-out above purchase price.
        </Text>
      </View>
    </Screen>
  );
}

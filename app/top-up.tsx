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
import { RADIUS } from '../src/theme/tokens';
import { MOTION } from '../src/theme/motion';
import { useWallet, selectLitresThisMonth, selectTopUpCapRemaining } from '../src/store/wallet';
import { MONTHLY_TOPUP_CAP_L } from '../src/lib/caps';
import { formatLitres, formatRandWhole, formatPrice, spokenRand } from '../src/lib/format';
import { priceOn } from '../src/data/prices';
import { now } from '../src/lib/clock';

// The design's R1 500 default is restored. Ruling C3 had lowered it to R500
// because a 150 L monthly cap minus the seed's 105.2 L of September top-ups
// left only 44.8 L (~R980), so R1 500 opened this screen already disabled at
// "MONTHLY CAP REACHED". The cap is now 500 L (spec §8.2), leaving 394.8 L
// (~R8 630) of headroom, so that no longer happens and the workaround goes.
export default function TopUp() {
  const t = useTheme();
  const router = useRouter();
  const [raw, setRaw] = useState('1500');
  const topUp = useWallet(s => s.topUp);
  const used = useWallet(selectLitresThisMonth);
  const remaining = useWallet(selectTopUpCapRemaining);
  const subscription = useWallet(s => s.subscription);
  // spec §9.3: "A lapsed subscription greys the Top up button and shows
  // RESUME SUBSCRIPTION; it never blocks the card or the existing balance."
  // So this button alone changes — litres already bought stay fully usable,
  // and the button still routes somewhere (to resolve the lapse) rather than
  // going inert.
  const lapsed = subscription === 'lapsed';

  const price = priceOn('inland', now());
  const rand = parseInt(raw || '0', 10);
  const litres = rand / price;
  const wouldExceed = litres > remaining;
  const pct = Math.min(1, used / MONTHLY_TOPUP_CAP_L);

  return (
    <Screen>
      <ScreenHeader title="Top up" />

      <View style={{ paddingTop: 34 }}>
        <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: RADIUS.sm, height: 50, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 12, letterSpacing: 1.2, color: t.text }}>PETROL 95</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, color: t.textMuted }}>
            {formatLitres(used)} / {MONTHLY_TOPUP_CAP_L} L this month
          </Text>
          <View style={{ height: 2, borderRadius: RADIUS.xs, backgroundColor: t.hairline, marginTop: 8 }}>
            <View style={{ height: 2, borderRadius: RADIUS.xs, width: `${pct * 100}%`, backgroundColor: pct > 0.8 ? t.accent : t.text }} />
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}>
        <SectionLabel>You pay</SectionLabel>
        {/* spec §10.1: grouped into one accessible node, spelled-out label
            derived from the same `rand` value the hero displays. The accent
            bar is decorative, not part of the value being announced. */}
        <View accessible accessibilityLabel={`You pay, ${spokenRand(rand)}`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
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
            <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>locked at</Text>
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
              style={({ pressed }) => ({
                height: 58, borderRadius: RADIUS.md, backgroundColor: t.surface,
                alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44,
                opacity: pressed ? MOTION.pressOpacity : 1,
              })}
            >
              <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 15, letterSpacing: 0.45, color: t.textMuted }}>
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
        <Text style={{ marginTop: 12, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Litres you don&apos;t use convert back to the rand you paid. No cash-out above purchase price.
        </Text>
      </View>
    </Screen>
  );
}

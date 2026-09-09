import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Readout } from '../src/components/Readout';
import { SectionLabel } from '../src/components/SectionLabel';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { Keypad } from '../src/components/Keypad';
import { useTheme } from '../src/theme/ThemeProvider';
import { RADIUS } from '../src/theme/tokens';
import { MOTION } from '../src/theme/motion';
import { useWallet, selectLitresThisMonth, selectTopUpCapRemaining } from '../src/store/wallet';
import { suggestedTopUp } from '../src/lib/usage';
import { MONTHLY_TOPUP_CAP_L } from '../src/lib/caps';
import { formatLitres, formatRandWhole, formatPrice, spokenRand } from '../src/lib/format';
import { priceOn } from '../src/data/prices';
import { now } from '../src/lib/clock';

// The default amount is derived from how much fuel this wallet actually
// burns, not written down. It used to be a hardcoded '1500', which had already
// been changed once (to 500, then back) as the cap moved underneath it — a
// literal that has to be re-tuned whenever anything around it changes is a
// figure the model should be producing.
export default function TopUp() {
  const t = useTheme();
  const router = useRouter();
  const topUp = useWallet(s => s.topUp);
  const ledger = useWallet(s => s.ledger);
  const used = useWallet(selectLitresThisMonth);
  const remaining = useWallet(selectTopUpCapRemaining);
  const subscription = useWallet(s => s.subscription);
  // spec §9.3: "A lapsed subscription greys the Top up button and shows
  // RESUME SUBSCRIPTION; it never blocks the card or the existing balance."
  // So this button alone changes — litres already bought stay fully usable,
  // and the button still routes somewhere (to resolve the lapse) rather than
  // going inert.
  const lapsed = subscription === 'lapsed';

  const at = now();
  const price = priceOn('inland', at);
  const suggested = suggestedTopUp(ledger, at, price);
  // Falls back to R500 for a wallet with no fills to learn from.
  const [raw, setRaw] = useState(String(suggested || 500));
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
          <Readout size={30} color={t.textMuted}>R</Readout>
          <Readout size={76}>{formatRandWhole(rand)}</Readout>
          <View style={{ width: 2, height: 56, backgroundColor: t.accent }} />
        </View>
        {/* Only while the amount is still the suggestion. Once the user has
            typed, the app should stop explaining their own number back to them. */}
        {suggested > 0 && rand === suggested ? (
          <Text style={{ marginTop: 12, fontFamily: 'Figtree_500Medium', fontSize: 12, color: t.textMuted }}>
            About a month at your usage.
          </Text>
        ) : null}
        <View style={{ marginVertical: 26 }}><Rule /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <SectionLabel>You get</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
              <Readout size={46}>{formatLitres(litres)}</Readout>
              <Readout size={20} color={t.textDim}>L</Readout>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>locked at</Text>
            <Readout size={15} style={{ marginTop: 4 }}>R{formatPrice(price)}/L</Readout>
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

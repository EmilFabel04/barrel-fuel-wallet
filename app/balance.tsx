import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { SectionLabel } from '../src/components/SectionLabel';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet, selectBalance, selectExpiringSoon } from '../src/store/wallet';
import { round1 } from '../src/lib/round';
import { formatLitres, formatDayMonth } from '../src/lib/format';
import { now } from '../src/lib/clock';
import { DAY, expiryOf } from '../src/lib/window';
import { MOTION } from '../src/theme/motion';

export default function Balance() {
  const t = useTheme();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const soon = useWallet(selectExpiringSoon);
  const ledger = useWallet(s => s.ledger);
  const lots = useWallet(s => s.lots);

  const later = round1(balance - soon);
  const soonestExpiry = lots.length
    ? lots.map(l => l.expiresAt).sort((a, b) => a.getTime() - b.getTime())[0]
    : null;
  const rows = [...ledger].sort((a, b) => b.when.getTime() - a.when.getTime());

  // scroll={false}: the ledger below has its own ScrollView, and two on the
  // same axis fight for the gesture. The outer View bounds it, so the ledger
  // scrolls between a fixed hero and a fixed footer.
  return (
    <Screen scroll={false}>
      <ScreenHeader title="Balance" />

      <View style={{ paddingTop: 30 }}>
        {/* spec §10.1: grouped into one accessible node, spelled-out label
            derived from the same `balance` the hero displays. */}
        <View accessible accessibilityLabel={`Balance, ${formatLitres(balance)} litres`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          <Num size={74}>{formatLitres(balance)}</Num>
          <Num size={28} color={t.textDim}>L</Num>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.hairline }}>
          <View style={{ flex: 1, paddingVertical: 16 }}>
            <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: t.textMuted }}>EXPIRES WITHIN 30 DAYS</Text>
            <Num size={22} color={soon > 0 ? t.accent : t.text} style={{ marginTop: 9 }}>{formatLitres(soon)} L</Num>
          </View>
          <View style={{ width: 1, backgroundColor: t.hairline }} />
          <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 20 }}>
            <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: t.textMuted }}>LATER</Text>
            <Num size={22} style={{ marginTop: 9 }}>{formatLitres(later)} L</Num>
          </View>
        </View>

        <Text style={{ marginTop: 14, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          {soonestExpiry
            ? `Soonest expiry · ${formatDayMonth(soonestExpiry)}. Unused litres convert back to the rand you paid for them. They never expire to zero.`
            : 'Unused litres convert back to the rand you paid for them. They never expire to zero.'}
        </Text>
      </View>

      <View style={{ paddingTop: 26, flex: 1 }}>
        <SectionLabel>Ledger</SectionLabel>
        <ScrollView style={{ marginTop: 6 }}>
          {rows.map(e => {
            // Every topup ledger row carries its own 90-day expiry, derived
            // from its own purchase date (spec §8.1: "every ledger row of
            // kind topup shows expires..."). This is computed from the entry
            // itself rather than looked up on `lots`, because a fully-spent
            // lot is removed from the lots array once FIFO drains it to zero
            // (lib/lots.ts) — looking it up there would silently drop the
            // expiry date off every historical topup row that has since been
            // used, which is most of them in the seeded ledger.
            const exp = e.kind === 'topup' ? expiryOf(e.when) : null;
            // Bounded below at zero: an unbounded `< 14 * DAY` is also true for
            // anything already expired (the difference goes negative), which
            // would paint long-spent March/April top-ups in the one colour
            // this design reserves for an active warning (spec §8.1).
            const remaining = exp ? exp.getTime() - now().getTime() : null;
            const soonish = remaining !== null && remaining >= 0 && remaining < 14 * DAY;
            return (
              <Pressable
                key={e.id}
                accessibilityRole={e.kind === 'fill' ? 'button' : undefined}
                accessibilityLabel={`${e.what}, ${formatLitres(e.deltaLitres)} litres`}
                onPress={e.kind === 'fill' ? () => router.push(`/fill/${e.id}`) : undefined}
                // Only fill rows navigate, so only they respond. A top-up row
                // lighting up would promise a detail screen that doesn't exist.
                style={({ pressed }) => ({
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 16, minHeight: 44, gap: 16,
                  borderBottomWidth: 1, borderBottomColor: t.hairline,
                  borderLeftWidth: e.card?.disputed ? 2 : 0, borderLeftColor: t.accent,
                  paddingLeft: e.card?.disputed ? 10 : 0,
                  opacity: pressed && e.kind === 'fill' ? MOTION.surfaceOpacity : 1,
                })}
              >
                <View>
                  <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: t.text }}>{e.what}</Text>
                  <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, color: t.textMuted, marginTop: 7 }}>
                    {formatDayMonth(e.when)} · {e.detail}
                    {exp ? (
                      <Text style={{ color: soonish ? t.accent : t.textMuted }}>
                        {`  ·  expires ${formatDayMonth(exp)}`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Num size={15} color={e.deltaLitres > 0 ? t.positiveText : t.text}>
                    {e.deltaLitres > 0 ? '+' : '−'}{formatLitres(Math.abs(e.deltaLitres))} L
                  </Num>
                  <Num size={11} weight="500" color={t.textMuted} style={{ marginTop: 7 }}>
                    {formatLitres(e.balanceAfter)} L
                  </Num>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ paddingBottom: 12 }}>
        <Button label="TOP UP" onPress={() => router.push('/top-up')} />
      </View>
    </Screen>
  );
}

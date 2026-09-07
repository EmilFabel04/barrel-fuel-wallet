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
import { TODAY } from '../src/data/seed';

const DAY = 86_400_000;
const REDEMPTION_DAYS = 90; // spec §8.1 — matches the window seed.ts / wallet.ts apply to every lot

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

  return (
    <Screen>
      <ScreenHeader title="Balance" />

      <View style={{ paddingTop: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          <Num size={74}>{formatLitres(balance)}</Num>
          <Num size={28} color={t.textDim}>L</Num>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.hairline }}>
          <View style={{ flex: 1, paddingVertical: 16 }}>
            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: t.textMuted }}>EXPIRES WITHIN 30 DAYS</Text>
            <Num size={22} color={soon > 0 ? t.accent : t.text} style={{ marginTop: 9 }}>{formatLitres(soon)} L</Num>
          </View>
          <View style={{ width: 1, backgroundColor: t.hairline }} />
          <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 20 }}>
            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: t.textMuted }}>LATER</Text>
            <Num size={22} style={{ marginTop: 9 }}>{formatLitres(later)} L</Num>
          </View>
        </View>

        <Text style={{ marginTop: 14, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          {soonestExpiry
            ? `Soonest expiry · ${formatDayMonth(soonestExpiry)}. Unused litres convert back to the rand you paid — they never expire to zero.`
            : 'Unused litres convert back to the rand you paid — they never expire to zero.'}
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
            const exp = e.kind === 'topup' ? new Date(e.when.getTime() + REDEMPTION_DAYS * DAY) : null;
            const soonish = exp ? exp.getTime() - TODAY.getTime() < 14 * DAY : false;
            return (
              <Pressable
                key={e.id}
                accessibilityRole={e.kind === 'fill' ? 'button' : undefined}
                accessibilityLabel={`${e.what}, ${formatLitres(e.deltaLitres)} litres`}
                onPress={e.kind === 'fill' ? () => router.push(`/fill/${e.id}`) : undefined}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 16, minHeight: 44, gap: 16,
                  borderBottomWidth: 1, borderBottomColor: t.hairline,
                  borderLeftWidth: e.card?.disputed ? 2 : 0, borderLeftColor: t.accent,
                  paddingLeft: e.card?.disputed ? 10 : 0,
                }}
              >
                <View>
                  <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: t.text }}>{e.what}</Text>
                  <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: t.textMuted, marginTop: 7 }}>
                    {formatDayMonth(e.when)} · {e.detail}
                    {exp ? (
                      <Text style={{ color: soonish ? t.accent : t.textMuted }}>
                        {`  ·  expires ${formatDayMonth(exp)}`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Num size={15} color={e.deltaLitres > 0 ? t.positive : t.text}>
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

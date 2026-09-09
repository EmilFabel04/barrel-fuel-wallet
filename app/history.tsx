import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Readout } from '../src/components/Readout';
import { SectionLabel } from '../src/components/SectionLabel';
import { Chip } from '../src/components/Chip';
import { Panel } from '../src/components/Panel';
import { useTheme } from '../src/theme/ThemeProvider';
import { RADIUS } from '../src/theme/tokens';
import { MOTION } from '../src/theme/motion';
import { useWallet } from '../src/store/wallet';
import { LedgerEntry } from '../src/data/types';
import { formatLitres, formatRand, formatPrice, formatDayMonth } from '../src/lib/format';
import { round1 } from '../src/lib/round';
import { DAY, expiryOf } from '../src/lib/window';
import { now } from '../src/lib/clock';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

type Filter = 'all' | 'fill' | 'topup';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fill', label: 'Fills' },
  { key: 'topup', label: 'Top-ups' },
];

/** What a fill saved against the pump on the day it was burned. */
const savedOn = (e: LedgerEntry): number | null =>
  e.kind === 'fill' && e.card && e.buyPricePerLitre !== undefined
    ? (e.card.pricePerLitre - e.buyPricePerLitre) * e.card.litres
    : null;

export default function History() {
  const t = useTheme();
  const router = useRouter();
  const ledger = useWallet(s => s.ledger);
  const [filter, setFilter] = useState<Filter>('all');
  const at = now();

  // A referral bonus is litres coming IN, so it belongs with top-ups. Filing
  // it under Fills would be plainly wrong, and leaving it out of both would
  // make the two filters fail to account for the All list.
  const shown = ledger
    .filter(e => filter === 'all'
      || (filter === 'fill' && e.kind === 'fill')
      || (filter === 'topup' && (e.kind === 'topup' || e.kind === 'bonus')))
    .sort((a, b) => b.when.getTime() - a.when.getTime());

  const litresShown = round1(shown.reduce((s, e) => s + Math.abs(e.deltaLitres), 0));
  const savedShown = shown.reduce((s, e) => s + (savedOn(e) ?? 0), 0);

  // Keyed by year AND month: a month-only key silently merges September 2026
  // with September of any later year — the same bug monthWindow exists to fix.
  const groups: { key: string; title: string; rows: LedgerEntry[] }[] = [];
  for (const e of shown) {
    const key = `${e.when.getFullYear()}-${e.when.getMonth()}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) last.rows.push(e);
    else groups.push({ key, title: `${MONTHS[e.when.getMonth()]} ${e.when.getFullYear()}`, rows: [e] });
  }

  // scroll={false}: the list below owns its own ScrollView, and two on the
  // same axis fight for the gesture.
  return (
    <Screen scroll={false}>
      <ScreenHeader title="History" />

      <View style={{ flexDirection: 'row', gap: 7, marginTop: 14 }}>
        {FILTERS.map(f => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>

      {/* Computed across the FILTERED set, so the figures move with the chips
          rather than quoting a fixed window that the list contradicts. */}
      <Panel style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <SectionLabel>{filter === 'fill' ? 'Filled' : filter === 'topup' ? 'Bought' : 'All movement'}</SectionLabel>
          <Readout size={13} weight="700">{`${formatLitres(litresShown)} L`}</Readout>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <SectionLabel>Saved</SectionLabel>
          <Readout size={13} weight="700" color={t.positiveText}>{`R${formatRand(savedShown)}`}</Readout>
        </View>
      </Panel>

      <View style={{ flex: 1, marginTop: 16 }}>
        {shown.length === 0 ? (
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>
            {filter === 'fill' ? 'No fills yet.' : filter === 'topup' ? 'No top-ups yet.' : 'Nothing here yet.'}
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {groups.map(g => (
              <View key={g.key} style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, paddingBottom: 4 }}>
                  <SectionLabel>{g.title}</SectionLabel>
                  <SectionLabel>{`${g.rows.length} ${g.rows.length === 1 ? 'entry' : 'entries'}`}</SectionLabel>
                </View>
                {g.rows.map(e => {
                  const saved = savedOn(e);
                  // Every topup row carries its own 90-day expiry, derived from
                  // its own date. NEVER look it up on `lots`: a fully-spent lot
                  // is deleted from that array, which would silently drop the
                  // expiry off every historical top-up since used — most of them.
                  const exp = e.kind === 'topup' ? expiryOf(e.when) : null;
                  // Bounded below at zero: an unbounded `< 14 * DAY` is also
                  // true for anything already expired, which would paint
                  // long-spent March top-ups in the active-warning colour.
                  const remaining = exp ? exp.getTime() - at.getTime() : null;
                  const soonish = remaining !== null && remaining >= 0 && remaining < 14 * DAY;
                  const isFill = e.kind === 'fill';
                  return (
                    <Pressable
                      key={e.id}
                      accessibilityRole={isFill ? 'button' : undefined}
                      accessibilityLabel={
                        saved !== null
                          ? `${e.what}, ${formatLitres(Math.abs(e.deltaLitres))} litres, saved ${formatRand(saved)} rand`
                          : `${e.what}, ${formatLitres(Math.abs(e.deltaLitres))} litres`
                      }
                      // Only fill rows navigate, so only they respond. A top-up
                      // row lighting up would promise a screen that doesn't exist.
                      onPress={isFill ? () => router.push(`/fill/${e.id}`) : undefined}
                      style={({ pressed }) => ({
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        paddingVertical: 14, minHeight: 44, gap: 14,
                        borderBottomWidth: 1, borderBottomColor: t.hairline,
                        borderLeftWidth: e.card?.disputed ? 2 : 0, borderLeftColor: t.accent,
                        paddingLeft: e.card?.disputed ? 10 : 0,
                        opacity: pressed && isFill ? MOTION.surfaceOpacity : 1,
                      })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 14, color: t.text }}>{e.what}</Text>
                        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, color: t.textMuted, marginTop: 6 }}>
                          {formatDayMonth(e.when)}
                          {e.detail ? ` · ${e.detail}` : ''}
                          {e.buyPricePerLitre !== undefined ? ` · paid R${formatPrice(e.buyPricePerLitre)}/L` : ''}
                          {exp ? (
                            <Text style={{ color: soonish ? t.accentText : t.textMuted }}>
                              {` · expires ${formatDayMonth(exp)}`}
                            </Text>
                          ) : null}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Readout size={15} color={e.deltaLitres > 0 ? t.positiveText : t.text}>
                          {`${e.deltaLitres > 0 ? '+' : '−'}${formatLitres(Math.abs(e.deltaLitres))} L`}
                        </Readout>
                        {saved !== null ? (
                          // Amber fill when the fill beat the pump; an honest
                          // grey when it did not. Hiding a zero would make the
                          // screen a brochure rather than a record.
                          <View style={{
                            paddingHorizontal: 6, paddingVertical: 3, borderRadius: RADIUS.xs,
                            backgroundColor: saved > 0 ? t.accent : t.surface,
                          }}>
                            <Text style={{
                              fontFamily: 'JetBrainsMono_700Bold', fontSize: 9,
                              color: saved > 0 ? t.inverse : t.textMuted,
                            }}>{`R${formatRand(saved)}`}</Text>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

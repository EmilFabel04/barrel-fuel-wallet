import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Row } from '../../src/components/Row';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet } from '../../src/store/wallet';
import { formatLitres, formatRand, formatPrice, formatDayMonth } from '../../src/lib/format';
import { pricePointOn } from '../../src/data/prices';

export default function FillDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useWallet(s => s.ledger.find(e => e.id === id));
  const dispute = useWallet(s => s.disputeFill);

  if (!entry?.card) {
    return (
      <Screen>
        <ScreenHeader title="Fill" />
        <Text style={{ marginTop: 34, fontFamily: 'Figtree_500Medium', fontSize: 14, color: t.text }}>Not found.</Text>
      </Screen>
    );
  }
  const c = entry.card;
  // Spec §9.2 names "lots consumed" as a screen requirement — the brief's
  // sample omitted it. More than one id here is the interesting case: it's
  // why buyPricePerLitre (savings.ts) is a weighted average, not a single
  // lot's price.
  const lotsConsumed = entry.lotIds && entry.lotIds.length > 0 ? entry.lotIds.join(', ') : '—';

  // Spec §7.3/§8.4: the price that produced `c.pricePerLitre` is keyed by
  // zone AND effective date, not a single current number — so recover which
  // price point that was (the most recent one for this zone as of the fill's
  // date) to name it, rather than hardcoding the date shown. `pricePointOn`
  // is the single definition of that lookup (src/data/prices.ts); guarded
  // here rather than left to throw, since a fill screen should still render
  // if the table were ever missing an entry for this date.
  let effective;
  try {
    effective = pricePointOn(c.zone, entry.when);
  } catch {
    effective = undefined;
  }

  return (
    <Screen>
      <ScreenHeader title="Fill" />

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>How this was worked out</SectionLabel>

        <View style={{ marginTop: 22, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <Num size={34}>R{formatRand(c.randAmount)}</Num>
            <Num size={24} color={t.textMuted}>÷</Num>
            <Num size={34}>R{formatPrice(c.pricePerLitre)}</Num>
            <Num size={16} color={t.textDim}>/L</Num>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Num size={24} color={t.textMuted}>=</Num>
            <Num size={44} color={t.positiveText}>{formatLitres(c.litres)}</Num>
            <Num size={20} color={t.textDim}>L</Num>
          </View>
        </View>

        <Text style={{ marginTop: 18, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          {effective
            ? `Gauteng ${c.zone} · 95 · effective ${formatDayMonth(effective.effectiveFrom)}`
            : `Gauteng ${c.zone} · 95`}
        </Text>
      </View>

      <View style={{ marginTop: 34 }}>
        <Rule />
        <Row label="Station" value={c.merchantDescriptor} />
        <Row label="Date" value={formatDayMonth(entry.when)} />
        <Row label="Balance after" value={`${formatLitres(entry.balanceAfter)} L`} />
        <Row label="Lots consumed" value={lotsConsumed} />
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12 }}>
        <Button
          label={c.disputed ? "REPORTED — WE'LL CHECK IT" : "THIS DOESN'T MATCH MY RECEIPT"}
          variant="secondary"
          disabled={c.disputed}
          onPress={() => dispute(entry.id)}
        />
      </View>
    </Screen>
  );
}

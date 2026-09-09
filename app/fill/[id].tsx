import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Row } from '../../src/components/Row';
import { Panel } from '../../src/components/Panel';
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
  // What this fill actually saved: the pump price on the day, less the
  // weighted price of the lots FIFO drew down for it. Zero is a real answer —
  // it means these litres were bought at the pump price — and is shown as one.
  const saved = entry.buyPricePerLitre !== undefined
    ? (c.pricePerLitre - entry.buyPricePerLitre) * c.litres
    : null;

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
            <Readout size={34}>R{formatRand(c.randAmount)}</Readout>
            <Readout size={24} color={t.textMuted}>÷</Readout>
            <Readout size={34}>R{formatPrice(c.pricePerLitre)}</Readout>
            <Readout size={16} color={t.textDim}>/L</Readout>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Readout size={24} color={t.textMuted}>=</Readout>
            <Readout size={44} color={t.positiveText}>{formatLitres(c.litres)}</Readout>
            <Readout size={20} color={t.textDim}>L</Readout>
          </View>
        </View>

        <Text style={{ marginTop: 18, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          {effective
            ? `Gauteng ${c.zone} · 95 · effective ${formatDayMonth(effective.effectiveFrom)}`
            : `Gauteng ${c.zone} · 95`}
        </Text>
      </View>

      {saved !== null ? (
        <Panel label="What this fill saved" style={{ marginTop: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <Readout size={30} color={saved > 0 ? t.positiveText : t.textDim}>
              {`R${formatRand(Math.abs(saved))}`}
            </Readout>
            <Text style={{ flex: 1, fontFamily: 'Figtree_500Medium', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
              {saved > 0
                ? `you paid R${formatPrice(entry.buyPricePerLitre!)}/L, the pump was R${formatPrice(c.pricePerLitre)}/L`
                : 'these litres were bought at the pump price'}
            </Text>
          </View>
        </Panel>
      ) : null}

      <View style={{ marginTop: 30 }}>
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

import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { useTheme } from '../../src/theme/ThemeProvider';
import { RADIUS } from '../../src/theme/tokens';
import { useWallet } from '../../src/store/wallet';
import { savingsToDate, litresBelowPump, averageBuyPrice, monthlySavings } from '../../src/lib/savings';
import { formatRand, formatLitres, formatPrice, spokenRand } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';

const MAX_BAR_HEIGHT = 100;

export default function Savings() {
  const t = useTheme();
  const ledger = useWallet(s => s.ledger);
  const saved = savingsToDate(ledger);
  const below = litresBelowPump(ledger);
  const avg = averageBuyPrice(ledger);
  const pump = priceOn('inland', TODAY);

  // Controller supplement (Task 17): every figure here — hero, litres,
  // average, and the six monthly bars — is derived from the ledger, never a
  // literal. Bar height is a percentage of the largest month in the returned
  // data, and the tallest month (not necessarily September) takes `positive`.
  const monthly = monthlySavings(ledger);
  const maxRand = Math.max(0, ...monthly.map(m => m.rand));

  return (
    <Screen insetBottom={false}>
      <ScreenHeader title="Savings" back={false} />

      <View style={{ paddingTop: 40 }}>
        <SectionLabel>Saved since March</SectionLabel>
        {/* spec §10.1: grouped into one accessible node so "R" and the value
            don't announce as separate stops; label derived from the same
            `saved` value the hero displays. */}
        <View accessible accessibilityLabel={`Saved since March, ${spokenRand(Math.max(0, saved))}`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
          <Num size={34} color={t.positiveText}>R</Num>
          <Num size={82} color={t.positiveText}>{formatRand(Math.max(0, saved))}</Num>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16 }}>
          <View style={{
            width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.positiveText,
          }} />
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 15, color: t.textDim }}>
            {formatLitres(below)} L bought below the pump price
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 34 }}><Rule /></View>

      <View style={{ paddingTop: 24 }}>
        <SectionLabel>Per top-up</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 150, marginTop: 24 }}>
          {monthly.map(m => {
            // Bar height is a percentage of the largest month in the returned
            // data (max 100px, leaving room in the 150px row for the value
            // and month labels above/below it) — never a hardcoded 100.
            const barHeight = maxRand > 0 ? (Math.max(0, m.rand) / maxRand) * MAX_BAR_HEIGHT : 0;
            const isTallest = maxRand > 0 && m.rand === maxRand;
            const label = `${m.rand < 0 ? '-' : ''}R${formatRand(Math.abs(m.rand))}`;
            return (
              <View key={m.month} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <Num size={11} weight="600" color={t.textDim}>{label}</Num>
                <View style={{
                  width: '100%', height: barHeight,
                  // Top corners only: a bar sits on the chart's baseline, so
                  // rounding the bottom would lift it off its own axis.
                  borderTopLeftRadius: RADIUS.xs, borderTopRightRadius: RADIUS.xs,
                  backgroundColor: isTallest ? t.positive : t.border,
                }} />
                <Num size={10} weight="500" color={t.textMuted}>{m.month}</Num>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 15 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>Average buy price</Text>
          <Num size={15}>{`R${formatPrice(avg)}/L`}</Num>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>Pump price today</Text>
          <Num size={15}>{`R${formatPrice(pump)}/L`}</Num>
        </View>
        <Rule />
        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18.6, color: t.textMuted }}>
          Savings are the difference between what you paid per litre and the pump price on the day you fuelled.
        </Text>
      </View>
    </Screen>
  );
}

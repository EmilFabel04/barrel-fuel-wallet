import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Panel } from '../../src/components/Panel';
import { LineChart } from '../../src/components/LineChart';
import { BarChart } from '../../src/components/BarChart';
import { useTheme } from '../../src/theme/ThemeProvider';
import { RADIUS } from '../../src/theme/tokens';
import { useWallet } from '../../src/store/wallet';
import {
  savingsToDate, litresBelowPump, averageBuyPrice, monthlySavings, pumpVsBuyByMonth,
} from '../../src/lib/savings';
import { priceRise } from '../../src/lib/pricewatch';
import { formatRand, formatLitres, formatPrice, formatDayMonth, spokenRand } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { now } from '../../src/lib/clock';

function Legend({ color, label }: { color: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: RADIUS.xs, backgroundColor: color }} />
      <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 11, color: t.textDim }}>{label}</Text>
    </View>
  );
}

export default function Savings() {
  const t = useTheme();
  const ledger = useWallet(s => s.ledger);
  const at = now();
  const pump = priceOn('inland', at);

  const saved = savingsToDate(ledger);
  const below = litresBelowPump(ledger);
  const avg = averageBuyPrice(ledger);
  const series = pumpVsBuyByMonth(ledger, at);
  const rise = priceRise('inland', at);

  // Every figure is derived from the ledger, never a literal.
  const withFills = series.filter(m => m.litres > 0);
  const firstEdge = withFills.length ? withFills[0].pumpPrice - withFills[0].yourPrice : 0;
  const lastEdge = withFills.length
    ? withFills[withFills.length - 1].pumpPrice - withFills[withFills.length - 1].yourPrice
    : 0;
  const narrowing = withFills.length > 1 && lastEdge < firstEdge;

  return (
    <Screen insetBottom={false}>
      <ScreenHeader title="Savings" back={false} />

      <View style={{ paddingTop: 30 }}>
        {/* "Realised" is load-bearing: it distinguishes this from the locked-in
            figure on Your litres, which is the unrealised position on litres
            still held. The two are both honest and not interchangeable. */}
        <SectionLabel>Realised · since March</SectionLabel>
        {/* spec §10.1: grouped into one accessible node so "R" and the value
            don't announce as separate stops. */}
        <View
          accessible
          accessibilityLabel={`Realised savings since March, ${spokenRand(Math.max(0, saved))}`}
          style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}
        >
          <Readout size={30} color={t.positiveText}>R</Readout>
          <Readout size={70} color={t.positiveText}>{formatRand(Math.max(0, saved))}</Readout>
        </View>
        <Text style={{ marginTop: 12, fontFamily: 'Figtree_500Medium', fontSize: 14, color: t.textDim }}>
          {`${formatLitres(below)} L bought below the pump price`}
        </Text>
      </View>

      <Panel label="Your price vs the pump" style={{ marginTop: 22 }}>
        <LineChart
          labels={series.map(m => m.month)}
          series={[
            { key: 'pump', color: t.accent, values: series.map(m => m.pumpPrice) },
            { key: 'you', color: t.positive, values: series.map(m => m.yourPrice) },
          ]}
        />
        {/* Distinguished by colour AND a legend, never colour alone. */}
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <Legend color={t.accent} label="Pump" />
          <Legend color={t.positive} label="You paid" />
        </View>
      </Panel>

      {withFills.length > 1 ? (
        <Panel
          label={narrowing ? 'The gap is closing' : 'The gap is widening'}
          tone={narrowing ? 'accent' : 'plain'}
          style={{ marginTop: 12 }}
        >
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
            {narrowing
              ? `Your edge fell from R${formatPrice(firstEdge)}/L in ${withFills[0].month} to R${formatPrice(lastEdge)}/L in ${withFills[withFills.length - 1].month} — recent top-ups were near the pump price.`
              : `Your edge rose from R${formatPrice(firstEdge)}/L in ${withFills[0].month} to R${formatPrice(lastEdge)}/L in ${withFills[withFills.length - 1].month}.`}
            {rise && rise.deltaCents > 0 ? (
              <Text style={{ color: t.accentText, fontFamily: 'Figtree_700Bold' }}>
                {` It reopens on ${formatDayMonth(rise.effectiveFrom)}.`}
              </Text>
            ) : null}
          </Text>
        </Panel>
      ) : null}

      <View style={{ paddingTop: 24 }}>
        <SectionLabel>Saved per month</SectionLabel>
        <View style={{ marginTop: 18 }}>
          <BarChart data={monthlySavings(ledger, at).map(m => ({ label: m.month, value: m.rand }))} />
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingTop: 20, paddingBottom: 12, gap: 14 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>Average buy price</Text>
          <Readout size={14}>{`R${formatPrice(avg)}/L`}</Readout>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>Pump price today</Text>
          <Readout size={14}>{`R${formatPrice(pump)}/L`}</Readout>
        </View>
        <Rule />
        {/* Copy constraint: the 90-day window caps how much price advantage can
            be held, so nothing here may imply the savings compound. */}
        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18.6, color: t.textMuted }}>
          Savings are the difference between what you paid per litre and the pump price on the day you fuelled. Litres hold their price for 90 days — this is protection from a rise, not a return.
        </Text>
      </View>
    </Screen>
  );
}

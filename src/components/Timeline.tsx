import React from 'react';
import { Text, View } from 'react-native';
import { LotBand } from '../lib/holdings';
import { Readout } from './Readout';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { formatLitres, formatPrice, formatDayMonth } from '../lib/format';

/**
 * Every lot as a runway from today to its expiry.
 *
 * Plain Views rather than SVG: these are proportional rectangles on a shared
 * horizontal scale, which flex already expresses, and an SVG here would need
 * measured pixel widths to say the same thing.
 *
 * The scale is the FURTHEST expiry in the wallet, so the longest runway always
 * fills the axis. A fixed 90-day scale would cram a wallet of only recent lots
 * into the right-hand end.
 */
export function Timeline({
  bands, at, urgentDays = 30,
}: { bands: LotBand[]; at: Date; urgentDays?: number }) {
  const t = useTheme();

  if (bands.length === 0) {
    return (
      <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>
        No litres held. A top-up starts a new 90-day runway.
      </Text>
    );
  }

  const horizon = Math.max(...bands.map(b => b.daysLeft), 1);

  return (
    <View style={{ gap: 16 }}>
      {bands.map(b => {
        const urgent = b.daysLeft <= urgentDays;
        return (
          <View key={b.id} style={{ gap: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Readout size={11} weight="700" color={t.textMuted}>
                {`${formatDayMonth(b.purchasedAt)} · R${formatPrice(b.pricePerLitre)}/L`}
              </Readout>
              <Readout size={12} weight="700">{`${formatLitres(b.litres)} L`}</Readout>
            </View>
            <View style={{ height: 10, borderRadius: RADIUS.xs, backgroundColor: t.hairline }}>
              <View
                testID={`timeline-run-${b.id}`}
                style={{
                  width: `${(b.daysLeft / horizon) * 100}%`,
                  height: 10,
                  borderRadius: RADIUS.xs,
                  backgroundColor: urgent ? t.accent : t.border,
                }}
              />
            </View>
            <Readout size={10} weight="500" color={urgent ? t.accentText : t.textMuted}>
              {`Expires ${formatDayMonth(b.expiresAt)} · ${b.daysLeft} days`}
            </Readout>
          </View>
        );
      })}
    </View>
  );
}

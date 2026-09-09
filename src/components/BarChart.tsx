import React from 'react';
import { View } from 'react-native';
import { Readout } from './Readout';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { formatRand } from '../lib/format';

const MAX_BAR_HEIGHT = 100;

/**
 * Monthly bars. Extracted from savings.tsx, where it was inline.
 *
 * Bar height is a percentage of the largest value in the data, never a
 * hardcoded maximum, and the tallest month takes `positive` — which is not
 * necessarily the most recent one.
 */
export function BarChart({
  data, height = 150,
}: { data: { label: string; value: number }[]; height?: number }) {
  const t = useTheme();
  const max = Math.max(0, ...data.map(d => d.value));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height }}>
      {data.map(d => {
        const tallest = max > 0 && d.value === max;
        return (
          <View key={d.label} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <Readout size={11} weight="700" color={t.textDim}>
              {`${d.value < 0 ? '-' : ''}R${formatRand(Math.abs(d.value))}`}
            </Readout>
            <View
              testID={`bar-${d.label}`}
              accessibilityLabel={
                tallest
                  ? `${d.label}, R${formatRand(d.value)}, best month`
                  : `${d.label}, R${formatRand(d.value)}`
              }
              style={{
                width: '100%',
                height: max > 0 ? (Math.max(0, d.value) / max) * MAX_BAR_HEIGHT : 0,
                // Top corners only: a bar sits on the chart's baseline, so
                // rounding the bottom would lift it off its own axis.
                borderTopLeftRadius: RADIUS.xs, borderTopRightRadius: RADIUS.xs,
                backgroundColor: tallest ? t.positive : t.border,
              }}
            />
            <Readout size={10} weight="500" color={t.textMuted}>{d.label}</Readout>
          </View>
        );
      })}
    </View>
  );
}

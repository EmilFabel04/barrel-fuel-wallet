import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

const VIEW_W = 240;
const PAD_X = 8;

export type Series = { key: string; color: string; values: number[] };

/**
 * Two price series with the gap between them shaded.
 *
 * A viewBox in fixed units lets this scale to any width without measuring the
 * layout — the alternative is an onLayout round trip and a first frame drawn
 * at the wrong size.
 *
 * A zero value means "no fills that month", not "the price was zero". Dropping
 * the line to the axis there would draw a collapse that did not happen, so
 * those points are skipped and the line spans them.
 */
export function LineChart({
  series, labels, height = 96,
}: { series: Series[]; labels: string[]; height?: number }) {
  const t = useTheme();
  const n = labels.length;
  if (n === 0 || series.length === 0) return <View style={{ height }} />;

  const present = series.flatMap(s => s.values).filter(v => v > 0);
  const min = present.length ? Math.min(...present) : 0;
  const max = present.length ? Math.max(...present) : 1;
  // A little headroom either side so the extremes are not drawn on the edge.
  const pad = (max - min) * 0.25;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => PAD_X + (i * (VIEW_W - PAD_X * 2)) / Math.max(1, n - 1);
  const y = (v: number) => (hi === lo ? height / 2 : ((hi - v) / (hi - lo)) * height);

  const points = (values: number[]) =>
    values
      .map((v, i) => (v > 0 ? { x: x(i), y: y(v) } : null))
      .filter(Boolean) as { x: number; y: number }[];

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

  const a = points(series[0]?.values ?? []);
  const b = points(series[1]?.values ?? []);
  const gap =
    series.length === 2 && a.length > 1 && b.length > 1
      ? `${toPath(a)} ${b.slice().reverse().map(p => `L${p.x} ${p.y}`).join(' ')} Z`
      : null;

  return (
    <View>
      {/* preserveAspectRatio="none" is load-bearing, not decoration. The
          default ("xMidYMid meet") scales the viewBox to FIT while preserving
          its aspect ratio, so a 240x96 drawing inside a 340pt-wide container
          gets letterboxed and centred — the lines bunch in the middle of the
          axis while the month labels below still span the full width. A chart
          wants x and y scaled independently, which is exactly what "none" does. */}
      <Svg testID="chart-svg" width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${height}`} preserveAspectRatio="none">
        {/* testID is 'chart-gap', deliberately not 'line-gap' — the series
            testIDs are 'line-<key>' and a shared prefix would make any
            "how many lines are there" query silently count the fill too. */}
        {gap ? <Path testID="chart-gap" d={gap} fill={series[1].color} fillOpacity={0.16} /> : null}
        {series.map(s => {
          const pts = points(s.values);
          if (pts.length === 0) return null;
          return (
            <React.Fragment key={s.key}>
              <Path testID={`line-${s.key}`} d={toPath(pts)} stroke={s.color} strokeWidth={2} fill="none" />
              <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2.6} fill={s.color} />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map(l => (
          <Text key={l} style={{
            fontFamily: 'JetBrainsMono_700Bold', fontSize: 9,
            letterSpacing: 0.6, color: t.textMuted,
          }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

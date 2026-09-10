import { FUEL_PRICES, FUEL_PRICE_SOURCE } from '@/data/fuel-prices';

const W = 640;
const H = 260;
const PAD = { top: 16, right: 8, bottom: 32, left: 44 };

const MONO = { fontFamily: 'var(--font-mono), monospace' } as const;

export function PriceChart() {
  const values = FUEL_PRICES.map(p => p.pricePerLitre);
  const min = Math.floor(Math.min(...values) * 2) / 2;
  const max = Math.ceil(Math.max(...values) * 2) / 2;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (FUEL_PRICES.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;

  const line = FUEL_PRICES.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.pricePerLitre)}`).join(' ');

  const first = FUEL_PRICES[0];
  const last = FUEL_PRICES[FUEL_PRICES.length - 1];

  // The peak, derived from the data — never a hardcoded month or value, so a
  // future update to FUEL_PRICES moves the marker without touching this file.
  const peakValue = Math.max(...values);
  const peakIndex = values.indexOf(peakValue);
  const peak = FUEL_PRICES[peakIndex];
  const peakAnchor = peakIndex === 0 ? 'start' : peakIndex === FUEL_PRICES.length - 1 ? 'end' : 'middle';

  const monthLabel = (m: string) =>
    new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit', timeZone: 'UTC' });

  return (
    <figure style={{ margin: '32px 0 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={`${FUEL_PRICE_SOURCE.grade} in ${FUEL_PRICE_SOURCE.zone}, from R${first.pricePerLitre.toFixed(2)} in ${monthLabel(first.month)}, peaking at R${peak.pricePerLitre.toFixed(2)} in ${monthLabel(peak.month)}, to R${last.pricePerLitre.toFixed(2)} in ${monthLabel(last.month)} per litre.`}
      >
        {[min, (min + max) / 2, max].map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--hairline)" strokeWidth="1" />
            <text
              x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontSize="11"
              style={MONO}
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* The line itself: --accent-text, not vivid --accent — #FF6A00 is
            2.87:1 on white and illegal as a graphic line under the site's 3:1
            floor, while #9A3200 clears 7.42:1. */}
        <path d={line} fill="none" stroke="var(--accent-text)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Peak marker — the most eloquent figure on the page, called out
            explicitly rather than left for a reader to spot in the line. */}
        <circle cx={x(peakIndex)} cy={y(peakValue)} r={3} fill="var(--accent-text)" />
        <text
          x={x(peakIndex)} y={y(peakValue) - 12}
          textAnchor={peakAnchor}
          dominantBaseline="auto"
          fill="var(--text)" fontSize="11" fontWeight={700}
          style={MONO}
        >
          R{peakValue.toFixed(2)}
        </text>

        {/* Final data point: vivid --accent is legal as a fill, but at
            2.87:1 on white it has no defined edge of its own, so a 1.5px
            --text ring draws one — the same ink-edge rule the button uses. */}
        <circle
          cx={x(FUEL_PRICES.length - 1)} cy={y(last.pricePerLitre)}
          r={4} fill="var(--accent)" stroke="var(--text)" strokeWidth="1.5"
        />

        {(
          [
            [0, first],
            [FUEL_PRICES.length - 1, last],
          ] as [number, typeof first][]
        ).map(([i, p]) => (
          <text
            key={p.month} x={x(i)} y={H - 10}
            textAnchor={i === 0 ? 'start' : 'end'}
            fill="var(--text-muted)" fontSize="11"
            style={MONO}
          >
            {monthLabel(p.month)}
          </text>
        ))}
      </svg>

      <figcaption style={{ marginTop: 16 }}>
        <p className="label" style={{ margin: 0 }}>
          {FUEL_PRICE_SOURCE.grade} · {FUEL_PRICE_SOURCE.zone} · rand per litre
        </p>
        <p
          className="prose"
          style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)' }}
        >
          {FUEL_PRICE_SOURCE.sourceName}, retrieved {FUEL_PRICE_SOURCE.retrieved}. Cross-checked
          against the {FUEL_PRICE_SOURCE.crosscheckName}.
        </p>
      </figcaption>
    </figure>
  );
}

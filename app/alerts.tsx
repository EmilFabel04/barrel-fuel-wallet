import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { SectionLabel } from '../src/components/SectionLabel';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { BarrelMark } from '../src/components/BarrelMark';
import { useTheme, useElevation } from '../src/theme/ThemeProvider';
import { RADIUS } from '../src/theme/tokens';
import { priceOn, nextPriceChange } from '../src/data/prices';
import { now } from '../src/lib/clock';
import { formatPrice, formatLitres } from '../src/lib/format';
import { round1 } from '../src/lib/round';

const MONTHS_UPPER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// "07 OCT" — the design's own screen-title casing (spec §3.2), not
// format.ts's `formatDayMonth` (unpadded, mixed case), which is built for
// ledger rows rather than a label.
function ddMonUpper(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_UPPER[d.getMonth()]}`;
}

function ordinal(day: number): string {
  if (day % 10 === 1 && day % 100 !== 11) return `${day}st`;
  if (day % 10 === 2 && day % 100 !== 12) return `${day}nd`;
  if (day % 10 === 3 && day % 100 !== 13) return `${day}rd`;
  return `${day}th`;
}

export default function Alerts() {
  const t = useTheme();
  const cardShadow = useElevation('low');
  const router = useRouter();

  // Derived from the same pricing table the wallet ledger deducts against,
  // never hand-picked. DMPR moves petrol prices on the first Wednesday of
  // the month, which in October 2026 is the 7th — the source design's canvas
  // copy said "2nd" / "01 OCT", both Thursday/Friday, contradicting the
  // pricing service this app already ships (src/data/prices.ts, and the
  // seed's own "today" of 30 Sep 2026 was chosen to sit before that change).
  // `nextPriceChange` is shared with the Wallet screen's price-watch block
  // (app/(tabs)/index.tsx) so this lookup is written once.
  // One instant for the whole render — see the note in (tabs)/index.tsx.
  const at = now();
  const currentPrice = priceOn('inland', at);
  const nextChange = nextPriceChange('inland', at);
  // Guarded the same way index.tsx guards it: nothing here can throw if the
  // table ever has no change scheduled after now(), even though today's
  // seed always finds 7 Oct.
  const nextPrice = nextChange ? nextChange.pricePerLitre : currentPrice;
  const nextDate = nextChange ? nextChange.effectiveFrom : at;
  const deltaCents = nextChange ? Math.round((nextPrice - currentPrice) * 100) : 0;
  const nextDateLabel = nextChange ? ddMonUpper(nextDate) : '—';

  // "buys you N litres more than it will on Wednesday" — how many more
  // litres the same R2 000 buys today than it will once the price above
  // takes effect. Derived from the same price table as everything else on
  // this screen, never hand-picked: the canvas's "2.4 L saved" was off by
  // ~5x against these two prices (R2 000 / 21.87 = 91.4 L vs / 21.99 = 91.0
  // L, a 0.5 L gap, not 2.4 L). When there's no scheduled change, nextPrice
  // falls back to currentPrice above, so this naturally resolves to 0.
  const illustrativeRand = 2000;
  const litresSaved = round1(illustrativeRand / currentPrice - illustrativeRand / nextPrice);

  return (
    <Screen>
      <ScreenHeader title="Price alert" />

      <View style={{ paddingTop: 24 }}>
        <SectionLabel>Lock screen</SectionLabel>
        <View style={{ marginTop: 14, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS.md, padding: 20, ...cardShadow }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <BarrelMark size={14} />
              <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 13, letterSpacing: -0.26, color: t.text }}>BARREL</Text>
            </View>
            <Num size={11} weight="500" color={t.textMuted}>now</Num>
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 18 }}>
            <View style={{
              width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 16,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent, marginTop: 6,
            }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 25, lineHeight: 26.5, letterSpacing: -0.875, color: t.text }}>
                {`Petrol price rising ${deltaCents}c on the ${ordinal(nextDate.getDate())} — top up now`}
              </Text>
              <Text style={{ marginTop: 16, fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim, fontVariant: ['tabular-nums'] }}>
                {`R${formatPrice(currentPrice)} `}
                <Text style={{ color: t.textMuted }}>→</Text>
                {' '}
                <Text style={{ color: t.accent }}>{`R${formatPrice(nextPrice)}`}</Text>
                {' /L'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>In-app card</SectionLabel>
        <View style={{ marginTop: 14, borderWidth: 1, borderColor: t.hairline, borderRadius: RADIUS.md, padding: 22, ...cardShadow }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 11, letterSpacing: 1.54, color: t.textDim }}>
              {`PRICE ALERT · ${nextDateLabel}`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 8,
                borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent,
              }} />
              <Num size={13} color={t.accent}>{`+${deltaCents}c`}</Num>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 20 }}>
            <Num size={54}>{formatLitres(litresSaved)}</Num>
            <Num size={18} color={t.textDim}>L saved</Num>
          </View>
          <Text style={{ marginVertical: 14, fontFamily: 'Figtree_400Regular', fontSize: 13, lineHeight: 19.5, color: t.textDim }}>
            {`Topping up R2 000 before the increase buys you ${formatLitres(litresSaved)} litres more than it will on Wednesday.`}
          </Text>
          <Button label={`TOP UP BEFORE ${nextDateLabel}`} height={54} onPress={() => router.push('/top-up')} />
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 14, gap: 14 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>Alert me when 95 moves by</Text>
          <Num size={14}>≥ 10c</Num>
        </View>
      </View>
    </Screen>
  );
}

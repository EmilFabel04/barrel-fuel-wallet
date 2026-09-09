import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme, useIsLight, useElevation } from '../../src/theme/ThemeProvider';
import { DARK, RADIUS } from '../../src/theme/tokens';
import { MOTION } from '../../src/theme/motion';
import { useWallet, selectBalance, selectLastFill } from '../../src/store/wallet';
import { formatLitres, formatRand, formatPrice } from '../../src/lib/format';
import { priceOn, nextPriceChange } from '../../src/data/prices';
import { STATIONS } from '../../src/data/stations';
import { now } from '../../src/lib/clock';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "02 Oct" — zero-padded day, sentence-case month, matching this screen's
// own copy voice. Deliberately not shared with alerts.tsx's ALL-CAPS
// `ddMonUpper`: each screen formats to its own casing, same as the two
// already do for everything else on the page.
function ddMon(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
}

export default function Wallet() {
  const t = useTheme();
  // Needed below because the price-watch block is the one place light mode
  // isn't a mechanical token swap (spec §6). Sourced from ThemeProvider's own
  // light/dark computation rather than re-derived here.
  const isLight = useIsLight();
  // Only meaningful in light mode, where this block becomes a black card on a
  // white ground; in dark mode it is inline and the hook returns no shadow.
  const blockShadow = useElevation('low');
  const router = useRouter();
  const balance = useWallet(selectBalance);
  // Was hardcoded as "Shell Grayston" and "−38.0 L" — literals that happened to
  // match the seed and went stale the moment any fill was recorded (rule 5).
  // Both now come from the newest fill in the ledger.
  const lastFill = useWallet(selectLastFill);
  // Prefer the resolved station's own name over the raw card descriptor, which
  // arrives shouty and dirty off the rail ('SHELL GRAYSTON SANDTON'). Falls
  // back to the descriptor when normalisation found no match, since spec §11
  // requires an unattributed fill to still be a first-class entry.
  const lastFillName = lastFill?.card
    ? STATIONS.find(s => s.id === lastFill.card!.stationId)?.name ?? lastFill.card.merchantDescriptor
    : null;
  // One instant per render: `now()` is a function, so calling it repeatedly
  // could straddle a date boundary once it is backed by a real clock.
  const at = now();
  const price = priceOn('inland', at);
  // The preceding month's price is always readable as "the price in effect
  // the day before this month's change" — day 0 of the current month is a
  // plain JS idiom for the last day of the previous one.
  const priorPrice = priceOn('inland', new Date(at.getFullYear(), at.getMonth(), 0));
  const priceDeltaPct = ((price - priorPrice) / priorPrice) * 100;

  // The upcoming change, read from the same pricing table the wallet
  // deducts against (src/data/prices.ts) rather than transcribed from the
  // source design — the design's "2 Oct" canvas copy is a Thursday and
  // contradicts DMPR's first-Wednesday rule, which the table already gets
  // right (7 Oct). This is the exact literal that survived three fix rounds
  // on this screen because every review checked the diff against the brief,
  // not the price table.
  const nextChange = nextPriceChange('inland', at);
  const nextChangeCents = nextChange ? Math.round((nextChange.pricePerLitre - price) * 100) : null;

  return (
    <Screen insetBottom={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BarrelMark size={17} />
          <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: t.text }}>BARREL</Text>
        </View>
        <View style={{ width: 30, height: 30, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 11, color: t.textDim }}>TM</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Available fuel, ${formatLitres(balance)} litres. View balance.`}
        onPress={() => router.push('/balance')}
        // Dim only. A 92px balance hero that scales under the thumb reads as a
        // button; it is a tappable region, and the distinction is worth keeping.
        style={({ pressed }) => ({ paddingTop: 44, opacity: pressed ? MOTION.surfaceOpacity : 1 })}
      >
        <SectionLabel>Available fuel</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
          <Readout size={92}>{formatLitres(balance)}</Readout>
          <Readout size={34} color={t.textDim}>L</Readout>
        </View>
        <Text style={{ marginTop: 16, fontFamily: 'Figtree_500Medium', fontSize: 17, color: t.textDim, fontVariant: ['tabular-nums'] }}>
          R {formatRand(balance * price)}
          <Text style={{ color: t.textMuted }}>  · at today's 95</Text>
        </Text>
      </Pressable>

      {/* Spec §6: this is the one block where light mode is not a mechanical
          token swap — the source design inverts it to a black card on white.
          Dark mode is untouched (its content already renders in DARK's own
          colours); in light mode the container gains DARK's fill and the
          two elements that would otherwise flip to LIGHT.text / LIGHT.hairline
          are pinned to DARK's instead, so the card reads exactly as it does
          on the black screen. textMuted/accent are identical in both token
          sets, so they need no override. */}
      {!isLight && <View style={{ marginTop: 34 }}><Rule /></View>}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Price watch. View price alerts."
        onPress={() => router.push('/alerts')}
        style={({ pressed }) => ({
          ...(isLight
            ? { marginTop: 34, backgroundColor: DARK.bg, paddingVertical: 22, paddingHorizontal: 24, gap: 16, borderRadius: RADIUS.lg, ...blockShadow }
            : { paddingTop: 20, gap: 16 }),
          opacity: pressed ? MOTION.surfaceOpacity : 1,
        })}
      >
        <SectionLabel>Price watch · Gauteng</SectionLabel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 12, letterSpacing: 0.24, color: DARK.text }}>PETROL 95</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
              <Readout size={26} color={DARK.text}>{`R${formatPrice(price)}`}</Readout>
              <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>/L</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{
              width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent,
            }} />
            <Readout size={15} color={t.accent}>{`+${formatPrice(priceDeltaPct)}%`}</Readout>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: DARK.hairline }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>
            {nextChange ? `Next change · ${ddMon(nextChange.effectiveFrom)}` : 'No change scheduled'}
          </Text>
          {nextChange ? (
            <Readout size={14} color={t.accent}>{`+${nextChangeCents}c expected`}</Readout>
          ) : null}
        </View>
        {/* Spec §9.5, folded in here when the Stations tab was removed. This is
            the one line that explains why a station-agnostic card is possible
            at all — the price is set by regulation, not negotiated per station
            — so it belongs on the screen that already states the price rather
            than on a screen of its own. `textMuted` is identical in both token
            sets, so it needs no override inside this block's light-mode
            inversion. */}
        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Regulated — the same at every station in this zone, so your card works anywhere.
        </Text>
      </Pressable>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 12 }}>
        <Rule />
        {lastFill ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>
              {`Last fill · ${lastFillName}`}
            </Text>
            <Readout size={14}>{`−${formatLitres(Math.abs(lastFill.deltaLitres))} L`}</Readout>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button label="TOP UP" flex={1} onPress={() => router.push('/top-up')} />
          <Button label="CARD" variant="secondary" onPress={() => router.push('/card')} />
        </View>
      </View>
    </Screen>
  );
}

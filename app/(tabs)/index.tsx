import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { Panel } from '../../src/components/Panel';
import { SegmentGauge } from '../../src/components/SegmentGauge';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme } from '../../src/theme/ThemeProvider';
import { RADIUS } from '../../src/theme/tokens';
import { MOTION } from '../../src/theme/motion';
import { useWallet, selectBalance, selectLastFill } from '../../src/store/wallet';
import { formatLitres, formatRand, formatPrice, formatDayMonth } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { priceRise } from '../../src/lib/pricewatch';
import { lotBands } from '../../src/lib/holdings';
import { expiringWithin } from '../../src/lib/lots';
import { burnRate } from '../../src/lib/usage';

import { STATIONS } from '../../src/data/stations';
import { now } from '../../src/lib/clock';

/** How close an expiry has to be before the Wallet says so. */
const EXPIRY_WARNING_DAYS = 30;

export default function Wallet() {
  const t = useTheme();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const lots = useWallet(s => s.lots);
  const ledger = useWallet(s => s.ledger);
  // Was hardcoded as "Shell Grayston" and "−38.0 L" — literals that happened to
  // match the seed and went stale the moment any fill was recorded (rule 5).
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

  // Read from the same price table the wallet deducts against, never
  // transcribed. The design's "2 Oct" canvas copy was a Thursday and
  // contradicted DMPR's first-Wednesday rule; the table gets it right (7 Oct).
  // `rise` is null past the end of the table, and every branch below handles
  // that — it is the direction a real clock travels.
  const rise = priceRise('inland', at);

  const bands = lotBands(lots, at);
  // lotBands sorts by expiry, so the first band is always the soonest.
  const soonest = bands[0] ?? null;
  // The TOTAL inside the window, not the soonest lot's own share. Those
  // coincide while only one lot is ever within 30 days, which is true of this
  // seed and would have hidden the difference indefinitely.
  const expiringSoon = expiringWithin(lots, at, EXPIRY_WARNING_DAYS);
  const lotsExpiring = bands.filter(b => b.daysLeft <= EXPIRY_WARNING_DAYS).length;

  return (
    <Screen insetBottom={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BarrelMark size={17} />
          <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: t.text }}>BARREL</Text>
        </View>
        <View style={{ width: 30, height: 30, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'JetBrainsMono_700Bold', fontSize: 10, color: t.textDim }}>TM</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Available fuel, ${formatLitres(balance)} litres. View your litres.`}
        onPress={() => router.push('/litres')}
        // Dim only. A hero that scales under the thumb reads as a button; it is
        // a tappable region, and the distinction is worth keeping.
        style={({ pressed }) => ({ paddingTop: 34, opacity: pressed ? MOTION.surfaceOpacity : 1 })}
      >
        <SectionLabel>Available fuel</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
          <Readout size={78} color={t.heroInk} roll>{formatLitres(balance)}</Readout>
          <Readout size={30} color={t.textDim}>L</Readout>
        </View>
      </Pressable>

      {/* The balance split by expiry — quantity and urgency in one strip, and
          the tap target into Your litres. */}
      <View style={{ marginTop: 14 }}>
        <SegmentGauge
          bands={bands}
          onPress={() => router.push('/litres')}
          accessibilityLabel={`${formatLitres(balance)} litres, split by expiry. View your litres.`}
        />
      </View>

      <Text style={{ marginTop: 12, fontFamily: 'Figtree_500Medium', fontSize: 15, color: t.textDim, fontVariant: ['tabular-nums'] }}>
        R{formatRand(balance * price)}
        <Text style={{ color: t.textMuted }}>{"  ·  at today's 95"}</Text>
      </Text>
      <Text style={{ marginTop: 5, fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>
        {`You use about ${formatLitres(burnRate(ledger, at))} L a month`}
      </Text>
      {expiringSoon > 0 && soonest ? (
        <Text style={{ marginTop: 5, fontFamily: 'Figtree_600SemiBold', fontSize: 13, color: t.accentText }}>
          {lotsExpiring === 1
            ? `${formatLitres(expiringSoon)} L expires in ${soonest.daysLeft} days`
            : `${formatLitres(expiringSoon)} L expires within ${EXPIRY_WARNING_DAYS} days · soonest in ${soonest.daysLeft}`}
        </Text>
      ) : null}

      <Panel label="Petrol 95 · Inland" onPress={() => router.push('/alerts')} style={{ marginTop: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Readout size={26}>{`R${formatPrice(price)}`}</Readout>
          <Readout size={13} weight="700" color={t.accentText}>
            {`${priceDeltaPct >= 0 ? '▲' : '▼'} ${formatPrice(Math.abs(priceDeltaPct))}%`}
          </Readout>
        </View>
        <View style={{ height: 1, backgroundColor: t.hairline }} />
        {rise ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <SectionLabel>{`${rise.deltaCents > 0 ? 'Rises' : 'Falls'} ${formatDayMonth(rise.effectiveFrom)}`}</SectionLabel>
              <Readout size={12} weight="700" color={t.accentText}>
                {`${rise.deltaCents > 0 ? '+' : ''}${rise.deltaCents}c/L · ${rise.daysUntil} days`}
              </Readout>
            </View>
            <View style={{ height: 4, borderRadius: RADIUS.xs, backgroundColor: t.hairline }}>
              <View style={{ height: 4, borderRadius: RADIUS.xs, width: `${rise.progress * 100}%`, backgroundColor: t.accent }} />
            </View>
            {rise.deltaCents > 0 ? (
              <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, lineHeight: 18, color: t.textDim }}>
                {`Top up before then and every litre stays at R${formatPrice(price)} for 90 days.`}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, lineHeight: 18, color: t.textDim }}>
            No change scheduled.
          </Text>
        )}
        {/* Spec §9.5, folded in here when the Stations tab was removed. This is
            the one line that explains why a station-agnostic card is possible
            at all — the price is set by regulation, not negotiated per station. */}
        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 17, color: t.textMuted }}>
          Regulated — the same at every station in this zone, so your card works anywhere.
        </Text>
      </Panel>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 12 }}>
        <Rule />
        {lastFill ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Last fill, ${lastFillName}, ${formatLitres(Math.abs(lastFill.deltaLitres))} litres. View it.`}
            onPress={() => router.push(`/fill/${lastFill.id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              minHeight: 44, opacity: pressed ? MOTION.surfaceOpacity : 1,
            })}
          >
            <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>
              {`Last fill · ${lastFillName}`}
            </Text>
            <Readout size={14}>{`−${formatLitres(Math.abs(lastFill.deltaLitres))} L`}</Readout>
          </Pressable>
        ) : null}
        {/* The second slot used to be CARD, which is already tab 2 — a full
            button spent on navigation one tap away. It briefly read BEAT +Nc
            before a price rise, which was worse: it routed to /top-up, the
            same destination as the button beside it, behind a label you had to
            decode. The urgency belongs in the price panel above, which states
            it in a sentence and counts down to it. */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button label="TOP UP" flex={1} onPress={() => router.push('/top-up')} />
          <Button label="HISTORY" variant="secondary" flex={1} onPress={() => router.push('/history')} />
        </View>
      </View>
    </Screen>
  );
}

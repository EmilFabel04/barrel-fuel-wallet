import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Readout } from '../src/components/Readout';
import { SectionLabel } from '../src/components/SectionLabel';
import { Button } from '../src/components/Button';
import { Panel } from '../src/components/Panel';
import { SegmentGauge } from '../src/components/SegmentGauge';
import { Timeline } from '../src/components/Timeline';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet, selectBalance } from '../src/store/wallet';
import { formatLitres, formatRand, formatPrice, formatDayMonth } from '../src/lib/format';
import { lotBands, lockedInValue } from '../src/lib/holdings';
import { priceRise } from '../src/lib/pricewatch';
import { burnRate } from '../src/lib/usage';
import { priceOn } from '../src/data/prices';
import { now } from '../src/lib/clock';

export default function Litres() {
  const t = useTheme();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const lots = useWallet(s => s.lots);
  const ledger = useWallet(s => s.ledger);

  const at = now();
  const price = priceOn('inland', at);
  const bands = lotBands(lots, at);
  const locked = lockedInValue(lots, at, price);
  const rise = priceRise('inland', at);

  return (
    <Screen>
      <ScreenHeader title="Your litres" />

      <View style={{ paddingTop: 26 }}>
        {/* spec §10.1: grouped into one accessible node, spelled-out label
            derived from the same `balance` the hero displays. */}
        <View accessible accessibilityLabel={`Balance, ${formatLitres(balance)} litres`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          <Readout size={70} color={t.heroInk}>{formatLitres(balance)}</Readout>
          <Readout size={26} color={t.textDim}>L</Readout>
        </View>

        {/* The same strip the Wallet shows, so arriving here feels continuous. */}
        <View style={{ marginTop: 16 }}>
          <SegmentGauge bands={bands} />
        </View>

        <Text style={{ marginTop: 12, fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>
          {`R${formatRand(locked.value)} at today's R${formatPrice(price)} · about ${formatLitres(burnRate(ledger, at))} L a month`}
        </Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <SectionLabel>Every litre, and when it expires</SectionLabel>
        <View style={{ marginTop: 16 }}>
          <Timeline bands={bands} at={at} />
        </View>
      </View>

      <Panel label="Locked in" style={{ marginTop: 26 }}>
        <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
          {`Your ${formatLitres(balance)} L cost R${formatRand(locked.cost)}. At today's R${formatPrice(price)} it is worth R${formatRand(locked.value)}`}
          {locked.ahead >= 0 ? (
            <Text style={{ color: t.positiveText, fontFamily: 'Figtree_700Bold' }}>
              {` — R${formatRand(locked.ahead)} ahead.`}
            </Text>
          ) : (
            <Text style={{ color: t.accentText, fontFamily: 'Figtree_700Bold' }}>
              {` — R${formatRand(Math.abs(locked.ahead))} behind.`}
            </Text>
          )}
        </Text>
        {rise && rise.deltaCents > 0 ? (
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
            {`From ${formatDayMonth(rise.effectiveFrom)} the pump is R${formatPrice(rise.pricePerLitre)}, putting you R${formatRand(balance * rise.pricePerLitre - locked.cost)} ahead.`}
          </Text>
        ) : null}
        {/* The 90-day window caps how much price advantage anyone can hold, so
            this is price certainty rather than accumulated profit. Copy must
            never imply the savings compound. */}
        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 17, color: t.textMuted }}>
          Litres hold their price for 90 days. That is protection from a rise, not a return.
        </Text>
      </Panel>

      <Text style={{ marginTop: 20, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
        Unused litres convert back to the rand you paid for them. They never expire to zero.
      </Text>

      <View style={{ marginTop: 'auto', paddingTop: 20, paddingBottom: 12 }}>
        <Button label="TOP UP" onPress={() => router.push('/top-up')} />
      </View>
    </Screen>
  );
}

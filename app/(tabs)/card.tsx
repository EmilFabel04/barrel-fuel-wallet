import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme, useElevation } from '../../src/theme/ThemeProvider';
import { useWallet, selectBalance, selectSpendable, selectRedemptionRemaining } from '../../src/store/wallet';
import { formatLitres, formatRandWhole } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';
import { PASS, RADIUS } from '../../src/theme/tokens';
import { STATIONS } from '../../src/data/stations';
import { WEEKLY_REDEMPTION_CAP_L } from '../../src/lib/caps';

export default function Card() {
  const t = useTheme();
  // The pass is the product's primary object, so it takes the higher of the
  // two elevations. In dark mode this resolves to no shadow at all — a white
  // card on black needs none (see DARK_ELEVATION in tokens.ts).
  const passShadow = useElevation('high');
  const balance = useWallet(selectBalance);
  // What the card would actually authorise: the balance, unless the weekly
  // redemption cap (spec §8.5) is the tighter of the two. Quoting the raw
  // balance here would advertise litres the card is about to decline.
  const spendable = useWallet(selectSpendable);
  const weeklyLeft = useWallet(selectRedemptionRemaining);
  const cappedByWeek = weeklyLeft < balance;
  const frozen = useWallet(s => s.cardFrozen);
  const freeze = useWallet(s => s.freezeCard);
  const cardFill = useWallet(s => s.cardFill);
  const price = priceOn('inland', TODAY);

  // Debug-only affordance (goal §2.3, §1.1): store.cardFill is fully
  // implemented and tested but, absent this, has no UI trigger anywhere in
  // the app, so the redemption half of the core loop can't be demonstrated.
  // Picks a real station and a plausible rand amount scaled to whatever's
  // left in the wallet (20% of it, R50-R300), so repeated taps stay
  // resolvable instead of running the balance dry after one or two presses.
  // Exercises normaliseDescriptor, resolveZone, deriveLitres, FIFO
  // consumption, the ledger write and fill/[id] end to end.
  const simulateFill = () => {
    const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
    const availableRand = spendable * price;
    const amount = Math.max(50, Math.round(Math.min(300, availableRand * 0.2) / 10) * 10);
    cardFill(station.name.toUpperCase(), amount, station.zone);
  };

  return (
    <Screen insetBottom={false}>
      <ScreenHeader title="Card" back={false} />

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>Your Barrel card</SectionLabel>
        <Text style={{ marginTop: 12, fontFamily: 'Figtree_400Regular', fontSize: 13, lineHeight: 19.5, color: t.textDim }}>
          Add it to your phone wallet and tap at any fuel station in South Africa.
        </Text>
      </View>

      {/* The pass is always light-on-white — it is a physical object, not a themed
          surface (Ruling C1). Its colours come from the theme-invariant PASS group,
          never from useTheme() or raw hex. A permanent 1px PASS.strataA border
          defines its edge — the same grey the strata beneath the card already
          use, so the border reads as that edge continuing around the top and
          sides rather than as a new, unrelated line. */}
      <View style={{ marginTop: 26 }}>
        <View style={{
          backgroundColor: frozen ? PASS.bgFrozen : PASS.bg, padding: 24,
          borderWidth: 1, borderColor: PASS.hairline,
          borderRadius: RADIUS.lg, ...passShadow,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BarrelMark size={17} color={PASS.text} />
              <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: PASS.text }}>BARREL</Text>
            </View>
            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 9, letterSpacing: 1.44, color: frozen ? t.accent : PASS.muted }}>
              {frozen ? 'FROZEN' : 'FUEL PASS'}
            </Text>
          </View>

          <Text style={{ marginTop: 34, fontFamily: 'Figtree_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>BALANCE</Text>
          {/* spec §10.1: a numeric hero split across two Num nodes (value,
              unit) is announced as two separate stops by a screen reader.
              Grouped into one accessible node with a spelled-out label,
              derived from the same `balance` the display uses. */}
          <View accessible accessibilityLabel={`Balance, ${formatLitres(balance)} litres`} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 10 }}>
            <Num size={66} color={PASS.text}>{formatLitres(balance)}</Num>
            <Num size={26} color={PASS.dim}>L</Num>
          </View>
          <Text style={{ marginTop: 8, fontFamily: 'Figtree_500Medium', fontSize: 13, color: PASS.dim, fontVariant: ['tabular-nums'] }}>
            R{formatRandWhole(spendable * price)} available at today's 95
          </Text>
          {/* Only shown when the weekly cap is what's binding — in the common
              case the balance is the limit and this line would be noise. */}
          {cappedByWeek ? (
            <Text style={{ marginTop: 6, fontFamily: 'Figtree_500Medium', fontSize: 11, color: PASS.muted, fontVariant: ['tabular-nums'] }}>
              {formatLitres(weeklyLeft)} L left of your {WEEKLY_REDEMPTION_CAP_L} L weekly limit
            </Text>
          ) : null}

          <View style={{ height: 1, backgroundColor: PASS.hairline, marginTop: 22, marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>HOLDER</Text>
              <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 13, marginTop: 8, letterSpacing: 0.26, color: PASS.text }}>T. MAKHUBELA</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>CARD</Text>
              <Num size={13} color={PASS.text} style={{ marginTop: 8 }}>•••• 4127</Num>
            </View>
          </View>
        </View>
        <View style={{ height: 9, backgroundColor: PASS.strataA, marginHorizontal: 10, borderBottomLeftRadius: RADIUS.sm, borderBottomRightRadius: RADIUS.sm }} />
        <View style={{ height: 9, backgroundColor: PASS.strataB, marginHorizontal: 22, borderBottomLeftRadius: RADIUS.sm, borderBottomRightRadius: RADIUS.sm }} />
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 }}>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>Accepted at</Text>
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 13, letterSpacing: 0.26, color: t.text }}>Works at any fuel station</Text>
        </View>
        <Button label="ADD TO APPLE WALLET" variant="white" height={58} />
        <Button label="ADD TO GOOGLE PAY" variant="secondary" height={58} />
        <Button
          label={frozen ? 'UNFREEZE CARD' : 'FREEZE CARD'}
          variant="secondary"
          height={54}
          onPress={() => freeze(!frozen)}
        />

        {/* Prototype control, not shipping UI — see comment above simulateFill.
            Deliberately labelled and captioned so it reads as a debug tool,
            not a product feature a reviewer could mistake it for. */}
        <Rule margin={4} />
        <SectionLabel>Debug — prototype only</SectionLabel>
        <Button
          label="SIMULATE A FILL"
          variant="secondary"
          height={54}
          onPress={simulateFill}
        />
        <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 16, color: t.textMuted }}>
          Fakes a card-rail fill at a random station to demo the redemption half of the
          core loop end to end. Not part of the product.
        </Text>
      </View>
    </Screen>
  );
}

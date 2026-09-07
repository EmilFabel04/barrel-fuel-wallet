import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme, useIsLight } from '../../src/theme/ThemeProvider';
import { DARK } from '../../src/theme/tokens';
import { useWallet, selectBalance } from '../../src/store/wallet';
import { formatLitres, formatRand, formatPrice } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';

export default function Wallet() {
  const t = useTheme();
  // Needed below because the price-watch block is the one place light mode
  // isn't a mechanical token swap (spec §6). Sourced from ThemeProvider's own
  // light/dark computation rather than re-derived here.
  const isLight = useIsLight();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const price = priceOn('inland', TODAY);
  // The preceding month's price is always readable as "the price in effect
  // the day before this month's change" — day 0 of the current month is a
  // plain JS idiom for the last day of the previous one.
  const priorPrice = priceOn('inland', new Date(TODAY.getFullYear(), TODAY.getMonth(), 0));
  const priceDeltaPct = ((price - priorPrice) / priorPrice) * 100;

  return (
    <Screen insetBottom={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BarrelMark size={17} />
          <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: t.text }}>BARREL</Text>
        </View>
        <View style={{ width: 30, height: 30, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: t.textDim }}>TM</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Available fuel, ${formatLitres(balance)} litres. View balance.`}
        onPress={() => router.push('/balance')}
        style={{ paddingTop: 44 }}
      >
        <SectionLabel>Available fuel</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
          <Num size={92}>{formatLitres(balance)}</Num>
          <Num size={34} color={t.textDim}>L</Num>
        </View>
        <Text style={{ marginTop: 16, fontFamily: 'Outfit_500Medium', fontSize: 17, color: t.textDim, fontVariant: ['tabular-nums'] }}>
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
        style={isLight
          ? { marginTop: 34, backgroundColor: DARK.bg, paddingVertical: 22, paddingHorizontal: 24, gap: 16 }
          : { paddingTop: 20, gap: 16 }}
      >
        <SectionLabel>Price watch · Gauteng</SectionLabel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, letterSpacing: 0.24, color: DARK.text }}>PETROL 95</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
              <Num size={26} color={DARK.text}>{`R${formatPrice(price)}`}</Num>
              <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>/L</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{
              width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent,
            }} />
            <Num size={15} color={t.accent}>{`+${formatPrice(priceDeltaPct)}%`}</Num>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: DARK.hairline }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>Next change · 02 Oct</Text>
          <Num size={14} color={t.accent}>+12c expected</Num>
        </View>
      </Pressable>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 12 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textDim }}>Last fill · Shell Grayston</Text>
          <Num size={14}>−38.0 L</Num>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button label="TOP UP" flex={1} onPress={() => router.push('/top-up')} />
          <Button label="CARD" variant="secondary" onPress={() => router.push('/card')} />
        </View>
      </View>
    </Screen>
  );
}

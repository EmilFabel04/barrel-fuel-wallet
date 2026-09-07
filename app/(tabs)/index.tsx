import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet, selectBalance } from '../../src/store/wallet';
import { formatLitres, formatRand } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';

export default function Wallet() {
  const t = useTheme();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const price = priceOn('inland', TODAY);

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

      <View style={{ marginTop: 34 }}><Rule /></View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Price watch. View price alerts."
        onPress={() => router.push('/alerts')}
        style={{ paddingTop: 20, gap: 16 }}
      >
        <SectionLabel>Price watch · Gauteng</SectionLabel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, letterSpacing: 0.24, color: t.text }}>PETROL 95</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
              <Num size={26}>R21.87</Num>
              <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>/L</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{
              width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent,
            }} />
            <Num size={15} color={t.accent}>+0.55%</Num>
          </View>
        </View>
        <Rule />
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

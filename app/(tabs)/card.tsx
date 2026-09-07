import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet, selectBalance } from '../../src/store/wallet';
import { formatLitres, formatRandWhole } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';
import { PASS } from '../../src/theme/tokens';

export default function Card() {
  const t = useTheme();
  const balance = useWallet(selectBalance);
  const frozen = useWallet(s => s.cardFrozen);
  const freeze = useWallet(s => s.freezeCard);
  const price = priceOn('inland', TODAY);

  return (
    <Screen insetBottom={false}>
      <ScreenHeader title="Card" back={false} />

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>Your Barrel card</SectionLabel>
        <Text style={{ marginTop: 12, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 19.5, color: t.textDim }}>
          Add it to your phone wallet and tap at any fuel station in South Africa.
        </Text>
      </View>

      {/* The pass is always light-on-white — it is a physical object, not a themed
          surface (Ruling C1). Its colours come from the theme-invariant PASS group,
          never from useTheme() or raw hex. A permanent 1px PASS.hairline border
          defines its edge: invisible against a dark screen, but load-bearing on a
          light screen where the pass's white would otherwise fuse with a white
          screen background. */}
      <View style={{ marginTop: 26 }}>
        <View style={{
          backgroundColor: frozen ? PASS.bgFrozen : PASS.bg, padding: 24,
          borderWidth: 1, borderColor: PASS.hairline,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BarrelMark size={17} color={PASS.text} />
              <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: PASS.text }}>BARREL</Text>
            </View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>
              {frozen ? 'FROZEN' : 'FUEL PASS'}
            </Text>
          </View>

          <Text style={{ marginTop: 34, fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>BALANCE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 10 }}>
            <Num size={66} color={PASS.text}>{formatLitres(balance)}</Num>
            <Num size={26} color={PASS.dim}>L</Num>
          </View>
          <Text style={{ marginTop: 8, fontFamily: 'Outfit_500Medium', fontSize: 13, color: PASS.muted, fontVariant: ['tabular-nums'] }}>
            R{formatRandWhole(balance * price)} available · PETROL 95
          </Text>

          <View style={{ height: 1, backgroundColor: PASS.hairline, marginTop: 22, marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>HOLDER</Text>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, marginTop: 8, letterSpacing: 0.26, color: PASS.text }}>T. MAKHUBELA</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: PASS.muted }}>CARD</Text>
              <Num size={13} color={PASS.text} style={{ marginTop: 8 }}>•••• 4127</Num>
            </View>
          </View>
        </View>
        <View style={{ height: 9, backgroundColor: PASS.strataA, marginHorizontal: 10 }} />
        <View style={{ height: 9, backgroundColor: PASS.strataB, marginHorizontal: 22 }} />
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>Accepted at</Text>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 0.26, color: t.text }}>Any fuel station</Text>
        </View>
        <Button label="ADD TO APPLE WALLET" variant="white" height={58} />
        <Button label="ADD TO GOOGLE PAY" variant="secondary" height={58} />
        <Button
          label={frozen ? 'UNFREEZE CARD' : 'FREEZE CARD'}
          variant="secondary"
          height={54}
          onPress={() => freeze(!frozen)}
        />
      </View>
    </Screen>
  );
}

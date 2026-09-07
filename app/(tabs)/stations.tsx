import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { STATIONS } from '../../src/data/stations';
import { priceOn } from '../../src/data/prices';
import { formatPrice } from '../../src/lib/format';
import { TODAY } from '../../src/data/seed';

// Spec §9.5 / §4.1: regulated petrol does not vary between stations inside a
// pricing zone, so the per-station price column from the source design is
// removed. The zone price is stated once, here, and the list below carries
// no price at all. Only NEAR ME and 24 HOURS remain — v1 is petrol-only, so
// the design's DIESEL chip is dropped too.
const CHIPS = ['NEAR ME', '24 HOURS'];

export default function Stations() {
  const t = useTheme();
  const price = priceOn('inland', TODAY);

  return (
    <Screen insetBottom={false}>
      <ScreenHeader title="Stations" back={false} />

      <View style={{ paddingTop: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Num size={62}>{`R${formatPrice(price)}`}</Num>
          <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: t.textDim }}>/ L</Text>
        </View>
        <Text style={{ marginTop: 10, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1.54, color: t.textDim }}>
          PETROL 95 · GAUTENG INLAND
        </Text>
        <Text style={{ marginTop: 10, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Regulated. The same at every station in this zone — so your card works anywhere.
        </Text>

        <View style={{ marginTop: 22, height: 46, borderWidth: 1, borderColor: t.border, justifyContent: 'center', paddingHorizontal: 14 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.textMuted }}>Search suburb or brand</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {CHIPS.map((c, i) => (
            <View
              key={c}
              // Not Pressables — filtering is out of scope for v1 (see the
              // comment above), and a `button` role with no `onPress` would
              // announce these as interactive to a screen reader and then do
              // nothing. They're static labels, so they announce as such.
              accessibilityLabel={c}
              style={{
                paddingHorizontal: 13, paddingVertical: 8, minHeight: 44, justifyContent: 'center',
                backgroundColor: i === 0 ? t.text : 'transparent',
                borderWidth: i === 0 ? 0 : 1, borderColor: t.border,
              }}
            >
              <Text style={{
                fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.66,
                color: i === 0 ? t.inverse : t.textDim,
              }}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingTop: 26, flex: 1 }}>
        <Rule />
        <ScrollView>
          {STATIONS.map(s => (
            <View
              key={s.id}
              accessibilityLabel={`${s.name}, ${s.suburb}, ${s.hours}, ${s.km.toFixed(1)} kilometres away`}
              style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingVertical: 17, minHeight: 44, gap: 16,
                borderBottomWidth: 1, borderBottomColor: t.hairline,
              }}
            >
              <View>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, letterSpacing: -0.15, color: t.text }}>{s.name}</Text>
                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: t.textMuted, marginTop: 7 }}>
                  {s.suburb} · {s.hours}
                </Text>
              </View>
              <Num size={15}>{`${s.km.toFixed(1)} km`}</Num>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingBottom: 12 }}>
        <Button label="VIEW ON MAP" variant="white" />
      </View>
    </Screen>
  );
}

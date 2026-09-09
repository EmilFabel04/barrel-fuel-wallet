import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Button } from '../../src/components/Button';
import { Keypad } from '../../src/components/Keypad';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme } from '../../src/theme/ThemeProvider';
import { normalisePhone, formatAsTyped } from '../../src/lib/phone';

/**
 * The first half of the sign-in stub: a number, validated for real.
 *
 * The number is normalised here and handed to the code screen as a route
 * param, so a half-finished sign-in never reaches the session store and cannot
 * be hydrated back into on the next launch.
 */
export default function SignIn() {
  const t = useTheme();
  const router = useRouter();
  const [digits, setDigits] = useState('');
  const e164 = normalisePhone(digits);
  const typed = formatAsTyped(digits);

  return (
    <Screen>
      <View style={{ paddingTop: 56, alignItems: 'center', gap: 16 }}>
        <BarrelMark size={34} />
        <Text style={{ fontFamily: 'Figtree_800ExtraBold', fontSize: 13, letterSpacing: 2.6, color: t.text }}>
          BARREL
        </Text>
      </View>

      <View style={{ paddingTop: 52 }}>
        <SectionLabel>Mobile number</SectionLabel>
        <View
          accessible
          accessibilityLabel={digits ? `Mobile number, ${digits.split('').join(' ')}` : 'Mobile number, empty'}
          style={{ marginTop: 14 }}
        >
          <Readout size={40} color={digits ? t.text : t.textDim}>
            {typed || '082 000 0000'}
          </Readout>
        </View>
        <Text style={{ marginTop: 16, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          We&apos;ll send a six-digit code to this number. Your litres are tied to it.
        </Text>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12 }}>
        <Keypad value={digits} onChange={setDigits} maxLength={10} allowLeadingZero />
        <View style={{ marginTop: 14 }}>
          <Button
            label={e164 ? 'SEND CODE' : 'ENTER YOUR NUMBER'}
            disabled={!e164}
            onPress={() => router.push({ pathname: '/sign-in/code', params: { phone: e164 as string } })}
          />
        </View>
        <Text style={{ marginTop: 12, fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 16, color: t.textMuted }}>
          Prototype — no code is actually sent, and any six digits will be accepted.
        </Text>
      </View>
    </Screen>
  );
}

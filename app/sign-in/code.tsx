import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Readout } from '../../src/components/Readout';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Button } from '../../src/components/Button';
import { Keypad } from '../../src/components/Keypad';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useSession } from '../../src/store/session';
import { formatPhone, isCompleteCode, CODE_LENGTH } from '../../src/lib/phone';

/**
 * The second half of the stub. There is nothing to check the code against, so
 * any six digits are accepted — but the *shape* is the real one, and the screen
 * is written against `isCompleteCode` rather than a literal six, so a real
 * provider replaces the transport and leaves this intact.
 *
 * Signing in flips the guard in the root layout, which is what navigates away
 * from here. There is no `router.replace` to get out of step with.
 */
export default function SignInCode() {
  const t = useTheme();
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  const signIn = useSession(s => s.signIn);
  const [code, setCode] = useState('');

  // Reached directly, or with the param lost to a reload. There is no number to
  // confirm, so start over rather than show an unanswerable screen.
  if (!phone) return <Redirect href="/sign-in" />;

  return (
    <Screen>
      <ScreenHeader title="Confirm" />

      <View style={{ paddingTop: 44 }}>
        <SectionLabel>Code</SectionLabel>
        <View
          accessible
          accessibilityLabel={code ? `Code, ${code.split('').join(' ')}` : 'Code, empty'}
          style={{ marginTop: 14 }}
        >
          <Readout size={44} color={code ? t.text : t.textDim}>
            {code || '000000'}
          </Readout>
        </View>
        <Text style={{ marginTop: 16, fontFamily: 'Figtree_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Sent to {formatPhone(phone)}.
        </Text>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12 }}>
        <Keypad value={code} onChange={setCode} maxLength={CODE_LENGTH} allowLeadingZero />
        <View style={{ marginTop: 14 }}>
          <Button
            label={isCompleteCode(code) ? 'CONFIRM' : `ENTER ${CODE_LENGTH} DIGITS`}
            disabled={!isCompleteCode(code)}
            onPress={() => signIn(phone)}
          />
        </View>
      </View>
    </Screen>
  );
}

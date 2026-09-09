import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←'];

/**
 * Both defaults describe a rand amount, which is what this was built for: seven
 * characters is a sensible ceiling on a top-up, and a leading zero is dropped so
 * an amount never reads `042`.
 *
 * A phone number wants neither — it is ten digits and every South African mobile
 * number opens with a zero — so both are parameters rather than constants.
 */
export function Keypad({
  value,
  onChange,
  maxLength = 7,
  allowLeadingZero = false,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  allowLeadingZero?: boolean;
}) {
  const t = useTheme();
  const press = (k: string) => {
    Haptics.selectionAsync();
    if (k === '←') return onChange(value.slice(0, -1));
    const base = !allowLeadingZero && value === '0' ? '' : value;
    if (k === '00') {
      if (!allowLeadingZero && (value === '0' || value === '')) return onChange('0');
      return onChange((base + '00').slice(0, maxLength));
    }
    onChange((base + k).slice(0, maxLength));
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: t.surface, gap: 1, borderRadius: RADIUS.md, overflow: 'hidden' }}>
      {KEYS.map(k => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === '←' ? 'Delete' : k}
          onPress={() => press(k)}
          // Spec §3.1 defines `surface` as "keypad grid gaps, pressed states" —
          // the pressed colour was specified in the design system and never
          // wired up, so keys gave haptic feedback and no visual feedback.
          // Deliberately an instant swap rather than an animated fade: a key
          // held down should look held, and a keypad wants to feel immediate.
          // It also makes the pressed key match the grid lines around it, so
          // the key reads as recessed into the grid rather than tinted.
          style={({ pressed }) => ({
            width: '33%', flexGrow: 1, height: 62,
            backgroundColor: pressed ? t.surface : t.bg,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 25, color: t.text, fontVariant: ['tabular-nums'] }}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

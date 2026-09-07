import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '←'];

export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const press = (k: string) => {
    Haptics.selectionAsync();
    if (k === '←') return onChange(value.slice(0, -1));
    if (k === '00') return onChange(value === '0' || value === '' ? '0' : (value + '00').slice(0, 7));
    onChange(((value === '0' ? '' : value) + k).slice(0, 7));
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: t.surface, gap: 1 }}>
      {KEYS.map(k => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === '←' ? 'Delete' : k}
          onPress={() => press(k)}
          style={{
            width: '33%', flexGrow: 1, height: 62, backgroundColor: t.bg,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 25, color: t.text, fontVariant: ['tabular-nums'] }}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

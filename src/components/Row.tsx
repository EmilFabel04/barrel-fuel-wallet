import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Rule } from './Rule';

export function Row({
  label, value, onPress, right,
}: {
  label: string; value?: string; onPress?: () => void; right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={value ? `${label}, ${value}` : label}
        onPress={onPress}
        style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', paddingVertical: 17, minHeight: 44, gap: 16,
        }}
      >
        <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.text }}>{label}</Text>
        {right ?? (value ? (
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>{value}</Text>
        ) : null)}
      </Pressable>
      <Rule />
    </View>
  );
}

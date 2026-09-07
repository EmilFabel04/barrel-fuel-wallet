import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';

export function ScreenHeader({ title, back = true }: { title: string; back?: boolean }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingTop: 6,
    }}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 20, color: t.textMuted }}>←</Text>
        </Pressable>
      ) : <View style={{ width: 44 }} />}
      <Text style={{
        fontFamily: 'Figtree_700Bold', fontSize: 12,
        letterSpacing: 1.44, textTransform: 'uppercase', color: t.text,
      }}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

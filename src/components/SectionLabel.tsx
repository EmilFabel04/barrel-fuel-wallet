import React from 'react';
import { Platform, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const SectionLabel = ({ children }: { children: string }) => {
  const t = useTheme();
  return (
    <Text style={{
      fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
      fontSize: 10, fontWeight: '600', letterSpacing: 1.6,
      textTransform: 'uppercase', color: t.textMuted,
    }}>{children}</Text>
  );
};

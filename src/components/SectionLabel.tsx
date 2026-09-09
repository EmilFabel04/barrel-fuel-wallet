import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// One mono in the system, not two. Moving off system Menlo means `fontWeight`
// is no longer honoured here — a custom family needs the weight in its name,
// and the previous `fontWeight: '600'` was only correct BECAUSE Menlo is a
// system font. JetBrains Mono's 600 is not among the four weights loaded, so
// this takes 700.
export const SectionLabel = ({ children }: { children: string }) => {
  const t = useTheme();
  return (
    <Text style={{
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10, letterSpacing: 1.6,
      textTransform: 'uppercase', color: t.textMuted,
    }}>{children}</Text>
  );
};

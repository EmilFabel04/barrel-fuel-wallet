import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const Rule = ({ margin = 0 }: { margin?: number }) => {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.hairline, marginVertical: margin }} />;
};

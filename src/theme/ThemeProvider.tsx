import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, Tokens } from './tokens';
import { useWallet } from '../store/wallet';

const ThemeContext = createContext<Tokens>(DARK);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = useWallet(s => s.appearance);
  const system = useColorScheme();
  const isDark = appearance === 'system' ? system !== 'light' : appearance === 'dark';
  return (
    <ThemeContext.Provider value={isDark ? DARK : LIGHT}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = (): Tokens => useContext(ThemeContext);

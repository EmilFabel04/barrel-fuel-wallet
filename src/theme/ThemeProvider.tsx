import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, Tokens } from './tokens';
import { useWallet } from '../store/wallet';

// A single context carries both the resolved tokens and the light/dark
// signal that produced them, so `useIsLight()` reads the same computation
// `ThemeProvider` already did rather than re-deriving (and risking
// disagreeing with) it elsewhere — e.g. by comparing against `LIGHT`
// identity, which would silently break the moment any consumer is handed a
// derived or overridden token object instead of the module-level singleton.
type ThemeState = { tokens: Tokens; isLight: boolean };

const ThemeContext = createContext<ThemeState>({ tokens: DARK, isLight: false });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = useWallet(s => s.appearance);
  const system = useColorScheme();
  const isDark = appearance === 'system' ? system !== 'light' : appearance === 'dark';
  return (
    <ThemeContext.Provider value={{ tokens: isDark ? DARK : LIGHT, isLight: !isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): Tokens => useContext(ThemeContext).tokens;
export const useIsLight = (): boolean => useContext(ThemeContext).isLight;

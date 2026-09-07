import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

const GUTTER = 26; // spec §3.3: screen horizontal padding

export function Screen({
  children,
  scroll = true,
  insetBottom = true,
}: {
  children: React.ReactNode;
  /**
   * Scrolls by default, because a screen that cannot scroll can only clip.
   * The Card screen's content is roughly 830pt tall against about 710pt of
   * usable height on a 390x844 phone, so its debug caption — and part of the
   * button above it — were simply cut off with no way to reach them.
   *
   * `flexGrow: 1` on the content container is what makes one prop serve both
   * cases: content shorter than the viewport still fills it, so the
   * `marginTop: 'auto'` footers that seven screens use stay pinned to the
   * bottom; content taller than the viewport scrolls instead of clipping.
   * Setting the gutter on `contentContainerStyle` rather than `style` matters
   * for the same reason — on `style` it pads the scroll *viewport*, which
   * clips the content's own edges.
   *
   * Pass `scroll={false}` only when the screen manages its own ScrollView;
   * nesting two on the same axis fights for the gesture.
   */
  scroll?: boolean;
  /**
   * Pushed screens sit directly on the safe area and need the bottom inset.
   * Tab screens do not — the tab bar already clears it, and padding twice
   * leaves visible dead space the design does not have.
   */
  insetBottom?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const frame = {
    flex: 1,
    backgroundColor: t.bg,
    paddingTop: insets.top,
    paddingBottom: insetBottom ? insets.bottom : 0,
  };

  if (!scroll) {
    return (
      <View style={frame}>
        <View style={{ flex: 1, paddingHorizontal: GUTTER }}>{children}</View>
      </View>
    );
  }

  return (
    <View style={frame}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: GUTTER }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

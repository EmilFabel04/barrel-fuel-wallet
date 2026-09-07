/**
 * Motion, in one place so it can be tuned as a system rather than per screen.
 *
 * The design's character is austere and flat — two accents carrying all
 * meaning, no gradients, no blur. Motion follows that: fast, linear-ish, and
 * confirming rather than decorative. Nothing bounces, nothing overshoots. A
 * press should feel like the surface acknowledged you, not like it performed.
 *
 * Spec §12 permits React Native's own `Animated` and no other animation
 * library, so these are all drivable by it — and every value here animates
 * either `opacity` or `transform`, which are the two the native driver
 * supports. Deliberately no animated `backgroundColor` anywhere: it cannot run
 * on the native driver and would drop a press onto the JS thread.
 */
export const MOTION = {
  /** Press-in: fast enough that it lands under the finger, not after it. */
  pressIn: 90,
  /** Press-out: slightly slower, so a release reads as a settle. */
  pressOut: 140,
  /** How far a pressed button shrinks. Perceptible, not squashy. */
  pressScale: 0.975,
  /** How far a pressed button dims. */
  pressOpacity: 0.88,
  /** Large tappable surfaces (balance hero, price block) dim only — a hero
   *  that scales reads as a button, which it is not. */
  surfaceOpacity: 0.7,
  /** The Toggle knob's travel. */
  toggle: 160,
  /** Stack push/pop. Long enough to follow, short enough not to wait on. */
  screen: 220,
} as const;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession, selectIsSignedIn, SESSION_STORAGE_KEY } from '../session';
import { reviver, STORAGE_KEY } from '../persist';
import { useWallet } from '../wallet';

const initial = useSession.getState();

beforeEach(() => {
  useSession.setState(initial, true);
});

describe('useSession', () => {
  test('starts signed out', () => {
    expect(selectIsSignedIn(useSession.getState())).toBe(false);
    expect(useSession.getState().phone).toBeNull();
  });

  test('signing in stores the number in E.164 and stamps the moment', () => {
    const ok = useSession.getState().signIn('082 123 4567');

    expect(ok).toBe(true);
    expect(useSession.getState().phone).toBe('+27821234567');
    expect(useSession.getState().signedInAt).toBeInstanceOf(Date);
    expect(selectIsSignedIn(useSession.getState())).toBe(true);
  });

  // The screens validate before they get here, so this is a second line rather
  // than the first — but it means the store cannot hold a malformed number.
  test('refuses a number that is not a South African mobile', () => {
    const ok = useSession.getState().signIn('0211234567');

    expect(ok).toBe(false);
    expect(selectIsSignedIn(useSession.getState())).toBe(false);
  });

  test('signing out clears the identity', () => {
    useSession.getState().signIn('0821234567');

    useSession.getState().signOut();

    expect(selectIsSignedIn(useSession.getState())).toBe(false);
    expect(useSession.getState().phone).toBeNull();
    expect(useSession.getState().signedInAt).toBeNull();
  });
});

describe('the session and the wallet are separate', () => {
  // Resetting the demo throws away the wallet's data. It is not a sign-out, and
  // conflating them would eject the user from the app for tapping a button in
  // Settings that says nothing about signing out.
  test('resetting the demo leaves the session signed in', () => {
    useSession.getState().signIn('0821234567');

    useWallet.getState().resetDemo();

    expect(selectIsSignedIn(useSession.getState())).toBe(true);
    expect(useSession.getState().phone).toBe('+27821234567');
  });
});

describe('session persistence', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  test('writes the identity under its own key, with the date intact', async () => {
    useSession.getState().signIn('0821234567');
    await flush();

    const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    expect(raw).not.toBeNull();

    const envelope = JSON.parse(raw as string, reviver);
    expect(envelope.state.phone).toBe('+27821234567');
    expect(envelope.state.signedInAt).toBeInstanceOf(Date);
    // Hydration is a fact about this launch, not about the identity.
    expect(envelope.state).not.toHaveProperty('hasHydrated');
  });

  test('does not share a key with the wallet', async () => {
    expect(SESSION_STORAGE_KEY).not.toBe(STORAGE_KEY);
  });
});

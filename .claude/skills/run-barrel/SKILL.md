---
name: run-barrel
description: Use when running the Barrel app, checking a change visually, taking screenshots of screens, or verifying UI work — covers the web, Android and iOS paths, and what each one can and cannot prove.
---

# Running and verifying Barrel

**Why this exists.** Not one of the 295 tests renders a screen. A chart bug that bunched both
series into the middle third of the panel passed every one of them and was found only by
opening the app. **A visual change is not verified until it has been looked at.**

## Which surface proves what

| Surface | Proves | Cannot prove |
|---|---|---|
| **Web** | Layout, colour, type, charts, whole flows, both themes | Notifications, haptics, real insets, gestures |
| **Android emulator** | All of the above, plus notifications, haptics, insets, back gesture | iOS-specific rendering |
| **iOS simulator** | The same on iOS | — |

Start on web. It is by far the fastest loop. Move to a device only for what web cannot prove.

## Web

```bash
npx expo start --web --port 8082     # 8082 on purpose — leaves 8081 for the user's own Metro
```

First bundle takes ~10s. Confirm with `curl -s -o /dev/null -w "%{http_code}" http://localhost:8082`
before opening a browser — a screenshot of a half-bundled page wastes a round trip.

Then drive it with the Chrome tools: `tabs_context_mcp` → `navigate` to `http://localhost:8082`
→ `wait` 8s → `screenshot`.

**Kill the server when done.** Two Metro instances have been killed by macOS for low memory in
this project; do not leave one running.

### Phone width

The app is a phone app and stretches to whatever width it is given, so a desktop-width
screenshot hides real layout bugs. Use `resize_window` to **402x874** (iPhone 16 logical size).

**This silently fails if the Chrome window is fullscreen.** `resize_window` returns success,
but `window.innerWidth` stays at screen width. Check it rather than trusting the call:

```js
JSON.stringify({ inner: window.innerWidth, outer: window.outerWidth })
```

If `inner` is still ~1512, ask the user to take Chrome out of fullscreen (green button or
`ctrl+cmd+F`). There is no way around it from this side.

### State

Both stores persist, so the app opens where you left it — usually signed in, on the Wallet.

- Wallet data: `barrel-wallet`
- Session: `barrel-session`

On web these are `localStorage` keys. To test a cold start or the sign-in flow:

```js
localStorage.removeItem('barrel-session'); location.reload()   // sign-in flow
localStorage.clear(); location.reload()                        // full cold start
```

In-app, `Settings → RESET DEMO DATA` restores the wallet seed without touching the session.

## Android — the one surface you can both see and drive

```bash
ADB=~/Library/Android/sdk/platform-tools/adb
~/Library/Android/sdk/emulator/emulator -avd Pixel_9_Pro_API_35 -no-snapshot-load &
until [ "$($ADB shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 5; done
npx expo start --android --port 8084
```

AVDs: `Pixel_9_Pro_API_35`, `Medium_Phone_API_35`. Cold boot takes a couple of minutes, and
`adb devices` shows the device as `offline` until it finishes — wait on `sys.boot_completed`,
not on the device appearing.

Expo Go is downloaded and installed automatically on first run, which takes a few minutes more
and produces no visible progress.

**Screenshot and tap:**

```bash
$ADB exec-out screencap -p > /tmp/a.png     # then Read the file
$ADB shell input tap <x> <y>                # coordinates in FULL-RES screenshot space
$ADB shell input text "0821234567"          # only reaches real TextInputs, not the custom Keypad
```

Screenshots come back at full device resolution (1280x2856 on the Pixel 9 Pro). A `Read` of
the image reports a display size and a multiplier — multiply the coordinates you read off it
by that factor before passing them to `input tap`.

**This is the only surface that is both visible and drivable**, so any verification needing
interaction belongs here. It is also the only place to test **notifications** — and local
notifications work in Expo Go, so no development build is needed. Only remote push on Android
requires one (SDK 53+).

**First launch shows an Expo Go developer-menu dialog** over the app. Tap its **Continue**
button — unlike iOS, you can do this yourself.

**A "Cannot connect to Expo CLI" toast** means the app is pointed at a Metro instance that is
gone — usually because Metro was restarted under it. Relaunch the app rather than the server:

```bash
$ADB shell am force-stop host.exp.exponent
$ADB shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8084" host.exp.exponent
```

## iOS

```bash
xcrun simctl boot "iPhone 17 Pro" && open -a Simulator
npx expo start --ios
```

Installed: **Xcode 26.6**, **iOS 26.5** runtime. Simulators available are iPhone 17, 17e,
17 Pro, 17 Pro Max and iPhone Air.

If `xcrun simctl list runtimes` ever comes back empty, the runtime is a separate ~8.5 GB
download — `xcodebuild -downloadPlatform iOS` — and `simctl` will report devices as
*Unavailable* until it lands.

### Screenshotting the simulator — prefer this

```bash
xcrun simctl io booted screenshot /tmp/sim.png    # then Read the file
```

**This is the best verification path for anything visual.** It captures at true device
resolution (1206x2622 on the 17 Pro), so you are looking at real phone dimensions with real
safe areas — no window sizing, no Chrome, and none of the fullscreen trap above. Prefer it
over the web path whenever the question is "does this look right on a phone".

### You can see iOS, but you cannot touch it

`simctl` has no tap, swipe or type command. It can screenshot, launch, terminate and open a
URL — nothing more. So on iOS you can **look** at any screen the app happens to be on, but you
cannot navigate to one. Consequences:

- A first launch of Expo Go shows a developer-menu dialog that needs a real tap. Terminating
  and relaunching does **not** clear it. Ask the user to tap **Continue** once.
- To reach a specific screen, ask the user to navigate there, then screenshot.
- Driving iOS properly needs `idb` (`brew install idb-companion` and `pip install fb-idb`),
  which is not installed.

**So: interact on web or Android, confirm the look on iOS.** Web and the Android emulator are
both fully drivable; iOS is a camera, not a hand.

## Memory — this machine kills Metro

macOS has killed Metro for low memory **three times** in this project. Measured on
11 Sep 2026: shutting down one idle iOS simulator took system free memory from **34% to 58%**.
A simulator costs roughly a quarter of RAM on its own.

So:

- Run **one** simulator or emulator at a time, and only while actually using it.
- Shut it down the moment you are done — `xcrun simctl shutdown <device>` and quit Simulator.app.
- Never leave a Metro instance running between tasks; it is seconds to restart.
- If a background task dies with no error, suspect the memory killer before the code.

## What to check against

The seed is fixed, so these figures are a regression test you can read off the screen. If any
of them is wrong, something below the UI broke:

| | |
|---|---|
| Balance | **42.6 L** — Wallet, Card and Your litres must agree |
| Today's price | **R21.87** · inland 95, rising 7 Oct, ▲1.25% |
| Expiring | **12.0 L expires in 6 days** (6 Oct) |
| Locked in | cost R923.32 · worth R931.66 · **R8.34 ahead** |
| Savings | **R76.19** realised · May is the tallest bar, not September |
| App "today" | **30 September 2026** |

## Before claiming a visual change works

1. Look at it at **402px**, not desktop width.
2. Look at it in **both themes** — the palette has two fill/text pairs and it is easy to put a
   fill colour on text, which fails contrast. See rule 2 in `AGENTS.md`.
3. Check the figures above still read correctly on any screen you touched.
4. Read the console for errors before declaring success.

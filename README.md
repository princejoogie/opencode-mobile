# opencode mobile

Expo Router React Native client for connecting to a running opencode server from iOS, Android, or web.

## Prerequisites

- Node.js and npm.
- Xcode and an iOS simulator for local iOS development.
- A running opencode server. From the project you want to control, run `opencode serve --hostname 0.0.0.0`, then add its URL in the app, for example `http://localhost:4096` on the iOS simulator or `http://<lan-ip>:4096` on a device.

## Install

```bash
npm install
```

## Run

Start Metro for the native app:

```bash
npx expo start --dev-client --host lan
```

Build and launch the configured iOS simulator:

```bash
/opt/homebrew/bin/xcodebuildmcp simulator build-and-run
```

The XcodeBuildMCP defaults live in `.xcodebuildmcp/config.yaml` and point at `ios/opencodemobile.xcworkspace`, scheme `opencodemobile`, and the `iPhone 17 Pro` simulator.

Other package scripts:

```bash
npm run ios
npm run android
npm run web
```

## Verify

```bash
npm run lint
npx tsc --noEmit
```

After UI, JSX, native, Expo, or dependency changes, also run:

```bash
/opt/homebrew/bin/xcodebuildmcp simulator build-and-run
```

## Debugging

- `xcodebuildmcp simulator build-and-run` prints build log, runtime log, and OSLog paths for failures or runtime investigation.
- Inspect the visible accessibility tree with `/opt/homebrew/bin/xcodebuildmcp ui-automation snapshot-ui` before tapping in automated QA.
- Prefer `/opt/homebrew/bin/xcodebuildmcp ui-automation tap --id "..."` or `--label "..."`; use coordinates only when the element is visible and stable.
- Capture visual evidence with `/opt/homebrew/bin/xcodebuildmcp simulator screenshot --return-format path`; QA screenshots are kept under `.tmp/scs/`.

## Architecture Notes

- `src/app/_layout.tsx` is the Expo Router entrypoint; routes live in `src/app/`.
- `src/store/servers.tsx` persists opencode server connections with `expo-secure-store`.
- `src/lib/opencode-client.ts` creates the `@opencode-ai/sdk/v2/client` client and applies optional basic auth.
- `src/hooks/use-opencode-events.ts` streams opencode events into React Query caches keyed by `src/lib/opencode-queries.ts`.
- Project paths are encoded for routes through `src/lib/route-params.ts`; do not put raw filesystem paths directly in route params.
- Native control wrappers live in `src/components/native-control.ios.tsx`, `src/components/native-control.android.tsx`, and `src/components/native-control.tsx`.

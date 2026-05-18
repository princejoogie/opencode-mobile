# AGENTS.md

## Project Facts

- Expo Router app entrypoint is `src/app/_layout.tsx`; routes live under `src/app/` and use the `@/* -> src/*` TypeScript alias.
- Opencode API calls go through `@opencode-ai/sdk/v2/client`; do not add a mobile proxy unless the user asks.
- Server connections are stored with `expo-secure-store` in `src/store/servers.tsx`; the app expects users to add a running opencode server URL.
- Project/worktree paths are encoded with `src/lib/route-params.ts`; do not put raw filesystem paths in route params.
- Live opencode updates are merged into React Query by `src/hooks/use-opencode-events.ts`; keep query keys centralized in `src/lib/opencode-queries.ts`.
- The desktop/web reference implementation is `/Users/pjuguilon/Documents/codes/vervio/vendio/opencode`.

## Commands

- Install dependencies with `npm install`.
- Start Metro for the native build with `npx expo start --dev-client --host lan`; this is often already running in tmux pane `%3`.
- Build and launch iOS with `/opt/homebrew/bin/xcodebuildmcp simulator build-and-run`.
- XcodeBuildMCP defaults are in `.xcodebuildmcp/config.yaml`: `ios/opencodemobile.xcworkspace`, scheme `opencodemobile`, simulator `iPhone 17 Pro`.
- Verify code changes with `npm run lint` and `npx tsc --noEmit`; also run the XcodeBuildMCP build after UI, JSX, native, Expo, or dependency changes.
- Root TypeScript intentionally excludes `server/`; that directory is a separate Bun/Hono package and is not covered by root `tsc`.

## Simulator Debugging

- If using XcodeBuildMCP, use the installed XcodeBuildMCP skill before calling XcodeBuildMCP tools.
- Prefer XcodeBuildMCP over raw `simctl` or direct `xcodebuild` for simulator builds, UI automation, screenshots, and logs.
- After `simulator build-and-run`, inspect the printed build log, runtime log, or OSLog path when behavior is wrong.
- Use `/opt/homebrew/bin/xcodebuildmcp ui-automation snapshot-ui` before tapping; prefer `tap --id "..."` or `tap --label "..."` over coordinates.
- Save visual evidence from `/opt/homebrew/bin/xcodebuildmcp simulator screenshot --return-format path` into `.tmp/scs/` with numbered descriptive names.
- Track QA issues as Markdown files in `.tmp/`; move fixed issues to `.tmp/done/`.

## UI Constraints

- Keep native control behavior in `src/components/native-control.ios.tsx`, `src/components/native-control.android.tsx`, and `src/components/native-control.tsx` aligned.
- iOS native header actions can be hard to target in automation; keep stable in-content `testID`s for critical actions.
- Thread screens should open at newest messages using the inverted `FlatList` behavior.
- Assistant text should render as plain text, not inside message cards.
- Hidden thinking/tool details should disappear completely, with no fallback cards, metadata rows, or gaps.
- User messages should show only the user text inside the user bubble, without model/time metadata.

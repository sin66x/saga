# Saga – notes for Claude

Read `docs/ARCHITECTURE.md` first; for installing/using the app read `README.md`, `docs/INSTALL.md` and
`docs/CERTIFICATE.md`.

## What this is
A **web app** for learning Swedish (illustrated stories, press-and-hold dictionary, spaced repetition, SFI grammar,
quizzes). It is installed on the owner's iPhone Home Screen as a **PWA**. There is **no server and no native app**: the
owner's Linux laptop serves the built files over HTTPS once (`npm run web:serve:https`, private certificate from
`npm run cert`), the phone installs from there, and afterwards the app runs offline by itself. The owner has no Apple
Developer account and does not use Expo Go, EAS or any hosting: do not add native code, deploy scripts or hosting setup.

Under the hood it is TypeScript + React Native for Web + Expo Router + expo-sqlite (WebAssembly SQLite); Expo is only the
build toolchain (`expo export`) and is not something the owner deals with: keep it out of user-facing docs.

## Rules
- Domain logic is pure TypeScript and unit tested (`src/lib`, non-UI files in `src/features/*`). Keep it free of React
  Native / DOM imports so Jest can load it (split pure code into its own file, as `speechText.ts` vs `speech.ts`).
- Story content: edit `content/stories/<id>/`, never `src/content/bundled/generated/` (made by `npm run content:build`).
  New stories follow `docs/STORY_FORMAT.md`; `npm run content:check` must say "every word resolves".
- Historical facts must be accurate; mark fiction with `"kind": "fiction"`.
- Before finishing: `npm run check` and `npx eslint src`. After UI changes also look at the result in the browser.
- Keep the user-facing docs (README, INSTALL, CERTIFICATE) plain and step by step; the owner reads them on a phone and a
  laptop, not as a developer.

## Commands
```bash
npm run dev                     # development server in the browser (http://localhost:8081)
npm run web:build               # production build → dist/ (+ offline service worker)
npm run web:serve               # serve dist/ on http://localhost:8090 with the required headers
npm run cert                    # create/refresh the private CA + HTTPS certificate in ~/.saga-certs
npm run web:serve:https         # serve dist/ to the iPhone: https://<laptop-ip>:8443 (+ http :8090 for the CA download)
npm run check                   # typecheck + Jest + content check
```

## Web app facts that are easy to get wrong
- **Cross-origin isolation is mandatory.** expo-sqlite on the web needs `Cross-Origin-Opener-Policy: same-origin` and
  `Cross-Origin-Embedder-Policy: require-corp` (not `credentialless`: Safari doesn't support it), otherwise the database
  fails to start. `scripts/lib/webHeaders.js` is the one definition, used by the dev server and `scripts/serve-dist.ts`.
- The web build is `output: "single"`, so **`+html.tsx` is ignored**. The manifest/meta tags are injected into
  `dist/index.html` by `scripts/build-pwa.ts`, which also writes `dist/sw.js` (precache of every file, no `skipWaiting`:
  a new version activates only after the app is closed and reopened).
- **A secure context is needed** for the service worker and SQLite: HTTPS (or localhost). The certificate is ours; see
  `docs/CERTIFICATE.md`. Never commit or print anything from `~/.saga-certs` (especially `rootCA-key.pem`).
- **Speech on iOS must start synchronously inside the tap** (any `await` before `speechSynthesis.speak()` makes it
  silently drop). See `src/lib/speechWeb.ts`: unlock utterance on first touch, `navigator.audioSession.type = 'playback'`.
  The owner's "no sound" was the iPhone **silent switch**: check that first, then Settings › Voice check / Play test tone.
- react-native-web differences handled in code: `<Text>` has no long-press (press-and-hold via pointer events in
  `InteractiveText.tsx`), `Alert.alert` is a no-op (use `src/lib/dialog.ts`), there is no file system (imported stories live
  in the `story_files` table as **base64 text** – the web SQLite driver mangles binary values; files via `src/lib/files.ts`).
- A long-press opens the popover while the finger is still down; lifting it clicks the backdrop. The backdrop therefore only
  closes on a press that *started* on it (`backdropArmed` in `WordPopover.tsx`).
- `Screen` gets its bottom padding from `TabBarInsetContext`, provided by `src/app/(tabs)/_layout.tsx` (the bottom tab bar).
- The reader's `onWord` is deliberately stable (reads state through a ref) so a page turn doesn't re-render every word of the
  neighbouring pages; keep callbacks passed to `PageView`/`InteractiveText` stable.

## Working on this machine (Linux laptop)
- The dev server keeps serving stale bundles after edits (low inotify limit): `npm run dev` already starts with `--clear`.
- **Stop servers with `kill $(lsof -t -i :PORT)`.** Never `pkill -f` a server name – it can kill the calling shell.
- Browser testing without a phone: Playwright (`playwright-core`) with the Chromium in `~/.cache/ms-playwright`, scratch
  scripts outside the repo. Fake `speechSynthesis` for speech tests; `--ignore-certificate-errors-spki-list=<hash>` to trust
  the local certificate so service workers register. Real iPhone Safari behaviour must be confirmed by the owner.

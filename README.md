# Self-Healing Tests · Repair Lab

> I renamed a button. The test failed. One locator changed. The SAME assertion passed again.

A runnable locator-only proof of concept: React controls a real local Chromium / Playwright red → repair → green loop. The dark dashboard displays subprocess output, the actual unified file diff, and exit codes.

## Run locally

Requires Node.js 22+ and npm. All commands run from this directory.

```sh
npm install --cache .npm-cache
PLAYWRIGHT_BROWSERS_PATH="$PWD/.browsers" npx playwright install chromium
npm run dev
```

Open http://127.0.0.1:4210. The Express API binds to `127.0.0.1:5210`. Both ports must be free; Playwright launches its own servers for verification. Browser downloads default to the project-local `.browsers` directory. An existing compatible installation may be selected with `PLAYWRIGHT_BROWSERS_PATH`.

For read-only reuse of a locally installed Chromium, also set `PLAYWRIGHT_EXECUTABLE_PATH` to its executable and `PLAYWRIGHT_BROWSERS_PATH` to its existing cache (including ffmpeg for recording). These are shell environment variables, not automatically loaded from `.env`.

No API key is needed. `.env.example` documents this deliberately offline configuration. There is **no model integration** and `.env` keys are not consumed. The visible **LOCAL FIXTURE · HEURISTIC / NO AI** badge describes the repair method accurately. The fixture is synthetic; browser runs, DOM inspection, source edits, screenshots, recordings, and assertions are real, not replayed.

## Three-click demo

1. **Run broken test** resets `fixtures/tests/save.spec.ts` to its original source and runs it against fixture V2. The old `save-user` locator times out; the failure log identifies the missing locator.
2. **Suggest repair** opens V2 in Chromium and checks that the `Save profile` button is unique, visible, enabled, and uniquely identified by `save-profile`. The dashboard shows the exact candidate.
3. **Apply + rerun** permits only `getByTestId('save-user')` → `getByTestId('save-profile')`, writes that change, and runs Playwright again. Green means the subprocess exited zero with the original `Saved successfully` assertion intact.

Click the first button again to reset and repeat. V1 is available at http://127.0.0.1:5210/fixture/v1 and V2 at `/fixture/v2`; both save buttons update the status in the fixture DOM.

## Verification and evidence

```sh
npm run build
npm run test
npm run e2e
npm run demo
```

Unit tests reject assertion edits, skipped tests, a `body` locator, a different target file, and altered source. End-to-end tests verify both fixture versions, the red/green flow, source equality, invalid action order, and reset behavior. The demo records a real three-click browser session at 1440×810.

- `artifacts/build.log`, `test.log`, `e2e.log`, `demo.log`: actual command output.
- `artifacts/red/` and `artifacts/green/`: actual fixture subprocess logs, JSON exit status, executed source, screenshots, video, and traces.
- `artifacts/green/repair.diff`: unified diff generated from the before/after file content.
- `artifacts/playwright/`: actual dashboard demo video and screenshots; each e2e/demo command replaces this folder.
- `artifacts/verified.png`: final dashboard screenshot.
- `status.json`: final measured checks and limitations.

The red fixture's exit code 1 is an expected assertion in the demonstration, not a failed delivery check. Tests and demo use one worker because the fixture and repair state are intentionally shared. Raw artifacts, browser binaries, npm cache, and node_modules are excluded from Git.

## Scope and safety

This is **not general automatic test healing**. The heuristic supports one known rename in a local fixture. It cannot repair arbitrary tests, infer business intent, or diagnose arbitrary application failures. No LLM inference is claimed. A successful save changes local DOM state only; there is no profile database.

Only one exact source transformation in one allowlisted test file is accepted. Assertions cannot be removed or changed, generated code is never executed, and no external site or arbitrary user file can be selected. The runner has a 25-second process timeout and test timeouts. Unexpected failures do not enable repair. Backend state is in memory and supports one active flow; restarting requires beginning again. Evidence paths are reused on each flow, so copy desired evidence before another run. This local unauthenticated developer demo is not intended for public hosting. MIT licensed.

## Local acceptance result

Build, 6 unit tests, 3 end-to-end tests, and the independent 1-test demo passed. An initial e2e attempt failed before browser pages opened because the expected FFmpeg revision was absent; its output remains in `artifacts/e2e-attempt-1.log`. Installing FFmpeg inside this project resolved it. A later demo exposed a race between returning the suggestion and closing its inspection browser; the backend now closes the browser before responding. The failed recording and log remain in `artifacts/playwright-race-failure/` and `artifacts/demo-race-failure.log`. Verification reused an existing Chromium executable read-only through `PLAYWRIGHT_EXECUTABLE_PATH`; downloading a complete fresh Chromium installation was interrupted, so fresh-machine installation and other operating systems have not been validated here. No GitHub publication is performed by this project.

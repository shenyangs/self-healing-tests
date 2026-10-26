# A10 — Self-Healing Tests

Build a REAL red -> repair -> green Playwright test repair demonstration, with strict guardrail: ONLY update one broken locator in a local fixture test, NEVER change assertions to cheat. Read ./AGENTS.md.

## Setup / strict scope
- Two versions of local fixture site. V1 button has `data-testid="save-user"`; V2 renames the same semantic button to `data-testid="save-profile"`, preserving actual save behavior. Initial Playwright test expects the old test ID and has a meaningful assertion `Saved successfully`.
- `Run broken test` executes actual test against V2, captures failure output and screenshot. `Suggest repair` inspects DOM and chooses ONE supported locator edit, optionally via live LLM if `OPENAI_API_KEY` configured, else deterministic rule with prominent label 'HEURISTIC / NO AI'. Validate that replacement targets exactly one actionable element.
- `Apply + rerun` modifies only the allowlisted locator string in `fixtures/tests/save.spec.ts`, not assertions/test skip. Run Playwright again. Show real red/green exit status, concise actual diff, proof that assertion still exists. Restore/reset fixture before repeat.
- No generated code arbitrary execution, user filesystem scans or external sites.

## P0 happy path
1. Press Run -> real failing test with missing locator and error output.
2. Press Suggest -> show exact `getByTestId('save-user')` to `getByTestId('save-profile')` candidate with reason and constraints.
3. Press Apply -> actual test file patch; rerun -> green only if actual test and existing assertion pass. Show test output + Git diff.

## Must prove
- Unit test patch rejects attempts to change assertions, skip tests, replace selector with `body`, or patch outside allowlisted test file.
- E2E orchestrates break/fix flow and reads captured failure and success evidence; demo screencast and screenshot.
- README explicitly says locator-only POC, not general automatic test healing, and labels no-model heuristic correctly.

## X hook
'I renamed a button. The test failed. One locator changed. The SAME assertion passed again.' Show red output → actual one-line diff → green output.


Execute within this directory only. Run npm install, implement, then build/test/e2e/demo. Preserve real logs and status.json.

# Verification

Last verified: 2026-08-21

## Commands

The dependency-upgrade change set passed:

- `npm run check`
- `npm run lint`
- `npm test` (7 frontend/helper tests and 44 package tests)
- `npm run test:unit` (the deprecated test still passes)
- `npm run test:integration` (the adapter started successfully)
- `npm run build`
- `npm audit` (zero vulnerabilities)

The integration test can take about five minutes because it provisions a temporary ioBroker controller.

## Local browser smoke testing

A standalone static `web-dev-server` does not provide a real ioBroker adapter backend. In that setup, a 404 for `/webui.0.widgets/importWidgetFiles.js` and a generic connection `Event` are expected environment limitations and do not by themselves prove an application regression.

### Designer palette — 2026-09-16

- Verified with `npm run tsc`, `npm run lint`, and `git -c core.whitespace=cr-at-eol diff --check` (existing HTML/TypeScript files contain CRLF line endings).
- Local preview command: `./node_modules/.bin/web-dev-server --port 8099`. With the repository's development backend configuration reachable, the project tree and a saved screen loaded for visual checking of the toolbar, dock headers/tabs, property grid, and canvas controls. Cross-origin widget imports and some screen images still produced pre-existing missing-resource errors in this local setup.
- Dark-mode follow-up: `npm run test:ts` passes 12 tests, including saved/system theme precedence, manual preference persistence, accessible switch state, and blocked storage. `npm run tsc` and `npm run lint` pass. Browser checks cover dark/light Monaco rendering and Space-key activation of the theme switch.

## Blockly runtime regression — 2026-09-16

- `test/tests/blockly-runtime.test.js` executes the browser bundles selected by `runtime.html` and `www/runtime.html` in isolated VM contexts, then loads and generates a saved event with a variable. Importing Blockly's Node entry would implicitly load English messages and conceal the missing-browser-locale bug.
- Verified the test fails with the reported `RENAME_VARIABLE` error before the fix and passes afterward. `npm run check`, `npm run lint`, and `npm test` passed (9 frontend/helper tests and 44 package tests).
- Separately compiled and executed the radio event from the screen attached to forum post 1354485 using JSDOM and mocked ioBroker states/delays: all five state writes and four delays matched, including the player source update. Live media playback was not verified.
- That screen contains no `toFixed` expression and references other screens whose contents were not supplied. The numeric error remains unlocated. Runtime viewport setup, screen-viewer code, and its CSS unit converter were unchanged between v1.46.0 and v2.0.3; the reported mobile scaling difference remains unverified without the nested screens/global configuration and a reproducible device setup.

## November dependency/designer/AI work — 2026-11-10

- Passed `npm run check`, `npm run lint`, `npm run build`, `npm test` (26 frontend/helper tests + 46 package checks), and `npm run test:unit`.
- `npm run test:integration` passes four checks: adapter startup plus a local HTTP AI provider's discovery/models, multimodal/tool forwarding, and invalid-provider rejection. The provider test uses an isolated temporary ioBroker database and never contacts paid providers or the user's controller. Audit output from the harness's independently provisioned controller is distinct from the repository dependency audit.
- Repository audit: `npm audit --omit=dev` reports zero; full audit retains four low findings in the development-server chain (see `dependency-upgrade-2026-11.md`). `npm outdated` lists only the intentional TypeScript 6 compatibility pin.
- Browser fixture: run `npm run build`, start `./node_modules/.bin/web-dev-server --port 8099`, then open `/test/browser/designer-smoke.html`. It supplies deterministic ioBroker/AI responses, an example screen and a manual-edit button; it is not shipped in `www/`.
- Verified in the browser: both themes, wrapped strips, AI auto-hide/re-pin/reopen, pasted screenshot preview, simultaneous running sessions, chat persistence across reload, existing/new screen Apply, source conflict refusal and rebase recovery. A plain HTTP LAN origin also completes a turn and applies a new screen, exercising the randomUUID fallback.
- Live paid-provider quality, real ai-server installation, and a full authenticated production installation were not exercised. The configured development backend was unreachable from this environment; the fixture and isolated controller tests cover the implementation paths instead.

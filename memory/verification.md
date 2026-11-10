# Verification

Last verified: 2026-11-10

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

- Passed `npm run check`, `npm run lint`, `npm run build`, `npm test` (27 frontend/helper tests + 46 package checks), and `npm run test:unit`.
- `npm run test:integration` passes four checks: adapter startup plus a local HTTP AI provider's discovery/models, multimodal/tool forwarding, and invalid-provider rejection. The provider test uses an isolated temporary ioBroker database and never contacts paid providers or the user's controller. Audit output from the harness's independently provisioned controller is distinct from the repository dependency audit.
- Repository audit: `npm audit --omit=dev` reports zero; full audit retains four low findings in the development-server chain (see `dependency-upgrade-2026-11.md`). `npm outdated` lists only the intentional TypeScript 6 compatibility pin.
- Browser fixture: run `npm run build`, start `./node_modules/.bin/web-dev-server --port 8099`, then open `/test/browser/designer-smoke.html`. It supplies deterministic ioBroker/AI responses, an example screen and a manual-edit button; it is not shipped in `www/`.
- Verified in the browser: both themes, wrapped strips, AI auto-hide/re-pin/reopen, pasted screenshot preview, simultaneous running sessions, chat persistence across reload (before switching fixtures to temporary storage), existing/new screen Apply, source conflict refusal and rebase recovery. A plain HTTP LAN origin also completes a turn and applies a new screen, exercising the randomUUID fallback.
- Live paid-provider quality, real ai-server installation, and a full authenticated production installation were not exercised. The configured development backend was unreachable from this environment; the fixture and isolated controller tests cover the implementation paths instead.

## AI composer / docking follow-up — 2026-11-10

- Passed production build, type-checking, lint, and tests (34 frontend/helper + 46 package checks). New tests cover local AbortSignal cancellation, steering at request boundaries/final answers, queued ordering, Stop skipping tools/queued work, and speech result/permission/error handling.
- Browser fixture verified: default right-edge AI rail, accessible Close/reopen with draft intact, first-Send chat creation, right-click deletion, editable running composer, steering/queue activity, immediate Stop, and fresh-draft persistence across reload. Shape popup foreground/background and icons were inspected in light and dark themes.
- Speech UI was exercised with the opt-in simulated recognizer (`speechFixture=1`); no physical microphone was recorded. Live recognition remains dependent on browser support/permission. Fixture controls are collapsed and are not packaged in production.

## AI chat list — 2026-11-10

- Type-check, lint, compiled packaging, and tests pass (35 frontend/helper + 46 package checks). Temporary-session regression test runs without IndexedDB and verifies no fixture history is accessed.
- Browser checks cover list → conversation → Back, concurrent activity rings, unread dots and clearing on open, collapsed inline tool/proposal review, and context-menu chat actions. Test chats are now temporary; reload starts clean.
- The real development backend at the configured LAN address remains unreachable (HTTP connection timeout); browser verification uses an explicitly labelled isolated mock backend, never a replacement in the real app.

## Editor theme sweep — 2026-11-10

- Passed TypeScript compilation, lint, tests (35 frontend/helper + 46 package), packaged copy build (`npx gulp`), and whitespace checks.
- Opt-in `/test/browser/designer-smoke.html?themeReview=1` loads `test/browser/theme-review.js` controls for actual binding/history/parameter/signal/script components and floating CSS tools. All data is local test input; neither helper is shipped in `www/`.
- Browser checks in both themes: shell/toolbars/docks, AI open/close and hints, settings/collection editor, refactor, script editor Code/Visual mode, Add/Close picker actions, syntax preview, command properties, bindings, history, parameters, signal browser, box/text shadow, gradient and border-radius tools. Verified native collection dialog foreground/background, enabled complex-property buttons at full opacity, gradient Repeating label, and border-radius Close inside the 1280×720 viewport.
- Context-menu images were verified separately (light filter none; dark invert(1), disabled opacity 0.45).
- These checks exercise real components with the isolated browser fixture. Live backend/provider flows and the external ioBroker object-selector service were not verified by this sweep. Runtime screen styling is outside the editor theme changes.

## Binding IOB controls — 2026-11-10

- Passed compilation, lint, packaged copy build, and 38 frontend/helper tests (three new async picker-routing tests).
- Browser fixture verified light/dark button styling and exactly one IOB control per row after initial render, Add, Duplicate and Remove. Picker selection dispatch is covered by unit tests; no live ioBroker server selection was exercised.

## AI npm catalog / installation — 2026-11-10

- Passed compilation, lint, packaged copy build, 50 frontend/helper + 46 package checks, and five adapter integration checks. Integration tests include actual messagebox rejection of removed/unlisted/versioned npm requests, alongside startup and the local provider transport tests.
- New unit checks cover catalog/list parity and repository attribution, capability search, manifest API detail, strict input validation, install→publish completion, concurrent work, failed npm/upload recovery, import ordering and duplicate-registration prevention. Generated registration code is executed in a VM against temporary package manifests.
- `/test/browser/designer-smoke.html?packageFixture=1` explicitly enables test-only npm responses/glue. Browser verified list_packages → describe_package → add_package → list_elements, returning editorReady true without page reload. This fixture never installs real packages, contacts providers, saves screens or persists chats. It validates activation plumbing, not third-party widget behavior.
- Registry availability was checked during catalog creation. wc-json was removed per user request; Luma is retained for its forthcoming publication. Real third-party npm installation on the user's controller and paid-provider decisions were not exercised.

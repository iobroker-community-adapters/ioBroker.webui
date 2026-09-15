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

## Blockly runtime regression — 2026-09-16

- `test/tests/blockly-runtime.test.js` executes the browser bundles selected by `runtime.html` and `www/runtime.html` in isolated VM contexts, then loads and generates a saved event with a variable. Importing Blockly's Node entry would implicitly load English messages and conceal the missing-browser-locale bug.
- Verified the test fails with the reported `RENAME_VARIABLE` error before the fix and passes afterward. `npm run check`, `npm run lint`, and `npm test` passed (9 frontend/helper tests and 44 package tests).
- Separately compiled and executed the radio event from the screen attached to forum post 1354485 using JSDOM and mocked ioBroker states/delays: all five state writes and four delays matched, including the player source update. Live media playback was not verified.
- That screen contains no `toFixed` expression and references other screens whose contents were not supplied. The numeric error remains unlocated. Runtime viewport setup, screen-viewer code, and its CSS unit converter were unchanged between v1.46.0 and v2.0.3; the reported mobile scaling difference remains unverified without the nested screens/global configuration and a reproducible device setup.

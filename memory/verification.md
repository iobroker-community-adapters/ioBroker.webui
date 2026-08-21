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

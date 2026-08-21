# Project overview

Last updated: 2026-08-21

## Baseline

- Package: `iobroker.webui`, version `1.47.0` at the time of this note.
- Runtime: ESM TypeScript with Node.js `>=20`.
- Build orchestration lives in `gulpfile.mjs`.
- `dist/` and `www/` contain generated and vendored build output. Dependency upgrades and builds can therefore produce large tracked diffs under `www/node_modules/`; do not assume those changes are unrelated without checking the build inputs.

## Frontend registration constraint

Custom elements that are accessed through typed fields still need explicit side-effect imports. TypeScript erases imports used only as types, so relying on a type import does not run `customElements.define(...)`.

`src/frontend/config/IobrokerWebuiAppShell.ts` explicitly imports these registration modules:

- `IobrokerWebuiSolutionExplorer.js`
- `IobrokerWebuiEventAssignment.js`
- `IobrokerWebuiControlPropertiesEditor.js`

Missing the solution-explorer side-effect import caused the runtime failure `this._solutionExplorer.initialize is not a function` because the browser created an unupgraded element.

## Designer integration constraints

- Current designer/property-grid type-info callbacks are asynchronous.
- The visualization shell expects an `openModal(...)` implementation; `IobrokerWebuiAppShell` supplies it.
- Visualization-addons help dialogs currently request negative absolute coordinates. `IobrokerWebuiAppShell.openModal(...)` must fit requested dialog positions into the dock bounds or the Bindings Editor and Simple Script Editor help windows are created completely off-screen.
- The ioBroker bindings editor preserves the ioBroker value-type selector by reading the raw binding and rendering its custom UI.
- The custom signal selector integrates ioBroker signals through the designer's newer signal-row/input-event flow.

## XML export constraint

- Custom-control property defaults are typed JSON values. `XmlHelper.convertToXml` must use nullish presence checks rather than truthiness so `0` and `false` are exported, and `escapeXml` must stringify primitive values before escaping them. This is covered by `test/tests/xml-helper.test.js` (GitHub issue #551).

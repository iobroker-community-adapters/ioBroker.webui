# Project overview

Last updated: 2026-11-10

## Baseline

- Package: `iobroker.webui`, version `2.1.0`.
- Runtime: ESM TypeScript with Node.js `>=22.19.0` (required by the shared ioBroker AI backend).
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

## Designer color scheme — 2026-09-16

- `assets/designer-theme.css` defines the light ZPL Studio palette (white surfaces, gray-green workspace, `#47977c` accent) and a neutral charcoal-gray dark palette (no green tint, including Monaco and active dock highlights) via `data-theme="dark"`, mapped to the designer's `--wcd-*` properties. Only `index.html` loads it; keep it out of runtime pages and the shared `assets/main.css`.
- `assets/designer-theme.js` applies the saved `webui.designer.theme` preference before first paint, defaulting to the OS preference until explicitly toggled. Storage failures are non-fatal. The accessible toolbar switch animates its sun/moon icons unless reduced motion is requested.
- `src/frontend/config/DesignerTheme.ts` synchronizes Monaco (including lazily created code tabs) and extends shared designer styles for dark toolbar icons and a light native-control color scheme inside the authored canvas. Import designer classes through the package entry point: deep imports can register duplicate custom elements alongside the configured minified bundle.
- Dock colors live in `assets/dockspawn.css`, loaded inside the dock's shadow root. Selectors need the `:host` prefix to outrank the dependency's adopted stylesheets.
- Active dock headers/tabs use `--webui-dock-active` (green `#c5e3d6` in light mode, gray `#494949` in dark mode), with neutral dividers. Reserve accent indicator lines for inner editor tabs so nested dock/tab levels do not produce stacked stripes. Keep dock separator heights intact because the docking library uses them for layout.
- `IobrokerWebuiAppShell.treeStyle` applies the same colors inside the project/outline trees; the upstream outline toolbar has inline colors requiring explicit overrides. Do not edit vendored dependencies for theme changes.
- Packaged copies under `www/assets`, `www/index.html`, and `www/dist/frontend/config` must stay in sync with their source/build output.

## Docking — 2026-11-10

- `IobrokerWebuiAppShell.ready()` opts into dock-spawn-ts 4's `tabStripMode = 'wrap'` and `enableAutoHide = true` before the dock webcomponent's deferred panel initialization. Each tab strip still offers the upstream row-mode toggle and overflow list.
- Startup column widths are applied once after AI auto-hide and dock resize settle: project/outline 18%, document/style 60%, properties/events 22%. Initial sequential docking ratios are redistributed when AI is removed from the split, so changing template ratios alone does not produce reliable final widths. `applyDefaultDockWidths()` sizes the three root branches by identity; later user resizing is untouched. Verified at 1280px in both themes on 2026-11-10.
- Pin buttons collapse tool panels to edge rails; documents do not have auto-hide pins. New controls/rails/overlays inherit both designer palettes through `assets/dockspawn.css`.

## Designer 1.x integration — 2026-11-10

- Default designer services already enable the new SVG editing toolbar/shape library, layout toolbars, spacing tools, source maps, and grid/flex helpers. No duplicate registration is needed.
- `ConfigureWebcomponentDesigner.ts` explicitly enables `ClassBindingsPropertyGridExtensionProvider` (the optional visualization class-binding UI) and registers CSS parsing as a document-owned service.
- Screen Save awaits `DocumentContainer.commitPendingChanges()` so debounced source edits are committed. The existing bindings toggle now assigns its backing field correctly.
- The pre-existing designer light/dark switch continues to use `--wcd-*` tokens and Monaco theme synchronization; frontend theme regression tests pass after the major upgrades. Runtime screens retain their authored appearance.

- The AI assistant starts auto-hidden on the right rail, with an always-available toolbar command and a close/reopen lifecycle that preserves its connected content. `activateDock` can reopen an auto-hidden panel through `autoHideManager.show`. `DockManager.activeDocument` is a panel container; resolve `resolvedElementContent` before accessing the screen editor.

## Tool popup contrast — 2026-11-10

- Map `--wcd-tool-popup-background`, `--wcd-tool-popup-border-color` and `--wcd-tool-popup-title-background` to the editor palette in `assets/designer-theme.css`. The new SVG shape library has a hard-coded light fallback background but inherits the statusbar foreground; without the background token its icons/text are almost invisible in dark mode.
- Verified the drawing/shape popup in both themes, including computed shape fill matching the foreground. This is a host-token fix, not a vendored component edit.

- Context menus also need the `--wcd-context-menu-*` foreground/background/hover/disabled/divider/border/shadow mappings. Native submenu `ul[popover]` elements receive a UA CanvasText color independently of their parent: explicitly set `.context_menu ul` foreground in the editor stylesheet. Otherwise dark color-scheme can produce white text on the default light submenu surface. Browser-verified in both themes on 2026-11-10 (light #354348/#fff, dark #ececec/#212121).
- Context-menu image icons use `--webui-icon-filter`, matching toolbar assets; disabled menu images additionally use 0.45 opacity. Verified computed filters are none in light mode and invert(1) in dark mode.

## Editor-wide theme review — 2026-11-10

- `DesignerComponentTheme.ts`, imported only through editor `DesignerTheme.ts`, extends shared component styles for script editor/picker, bindings/history, parameters, event assignment, refactor and signal browser. This avoids editing vendor bundles and keeps runtime/authored-screen styles separate. Explicit button foregrounds are required: the script editor's Code button and picker's Close inherited dark-mode text over literal white surfaces.
- Standalone property grids use `--pg-*`, distinct from designer `--wcd-*`. Root mappings in `assets/designer-theme.css` cover settings, script properties, descriptions, collection dialogs and editor controls. Primary actions use separate foreground/background tokens; JSON snippets have light/dark syntax colors. Light muted text was darkened for readable hints.
- CSS tool editors retain their preview colors but use themed layer selection, action/hover colors, close hover and numeric labels. Gradient Repeating has an upstream inline light text color requiring a targeted override. Script complex-property buttons also need a targeted opacity override: upstream inserts enabled buttons at inline opacity 0.2.
- `DesignerToolWindowPosition.ts` wraps public `DraggableToolWindow.showWindow` with the existing tested `fitDialogPosition` helper, using the actual rendered dimensions and an 8px viewport margin. Upstream assumes a 260px width even for the 860px border-radius editor, otherwise placing Close off-screen at a 1280px viewport. This fits initial placement; normal dragging is retained.

## ioBroker binding picker — 2026-11-10

- The old bindings-editor IOB button (pre-row layout) became “+ Add ioBroker signal” during the designer migration. `IobrokerWebuiBindingsEditor.ts` now also augments each row with a compact IOB button beside the generic `...` picker. Generic local/property browsing is retained. Both routes use the existing official ioBroker selector; no upstream designer change is required.
- The upstream row renderer is private and rebuilds all rows on Add/Duplicate/Remove. A MutationObserver watches direct children of `#signalListContainer` and adds one IOB button per rendered row; it disconnects when the editor closes. Local adopted styles group the add actions with themed flat buttons.
- `SignalPickerHelper.ts` preselects the current input ID and dispatches the normal bubbling input event, preserving the designer's signal/name synchronization. It ignores cancellation and results for removed/rebuilt fields. Regression tests cover these async routing cases.

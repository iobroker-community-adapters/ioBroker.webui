# ioBroker web components host

Last updated: 2026-11-11 (package `@iobroker/web-components` 0.7.0, devDependency like the other browser packages)

## Design

- webui is a host of the `@iobroker/web-components` contract. Components come from `common.webComponents` of adapter instances and are served by the web adapter under `/adapter/<name>/`. `WebComponentRegistry.ts` resolves `../adapter/` against `window.iobrokerWebuiRootUrl`. The manifests are read once per page, and a module is imported only when its element is shown.
- Screens never contain the component tag directly. They contain the wrapper `<iobroker-webui-web-component adapter component theme setting-*>` (`src/frontend/runtime/IobrokerWebuiWebComponent.ts`, imported through `runtime/controls.ts` for both designer and runtime). The wrapper:
  - imports the module and creates the inner element in its shadow root;
  - sets `socket` (`iobrokerHandler.connection`), `settings`, `theme` and `editMode`;
  - maps `iob-navigate` to `Runtime.openScreen` when that screen exists.
  - Why a wrapper: no monkeypatching of `customElements.define`, lazy loading for free, and per-setting attributes bind like any attribute.
- Settings are attributes `setting-<dash-case key>`, so each one is editable and bindable (`bind-attr:setting-x`). Checkbox settings use HTML boolean-attribute semantics because webui attribute bindings write `''` for true and remove the attribute for false. Manifest defaults are written as attributes when an element is dropped from the palette, not applied later.
- Pure, DOM-free helpers live in `src/frontend/webcomponents/WebComponentHost.ts`: attribute mapping, typed settings, palette definitions, `hidden`/`disabled` expressions and designer-canvas detection. They are covered by `test/tests/web-components-host.test.js`, which imports `dist/` rather than `www/dist`: gulp deletes every `package.json` under `www/`, so bare package imports do not resolve there in Node.
- Designer services: `IobrokerWebuiWebComponentsElementsService` (palette group "ioBroker web components"; drops `editsValue` components, waits for the server for at most 15 s) and `IobrokerWebuiWebComponentPropertiesService` (property groups `component` and settings, `RefreshMode.fullOnValueChange` for `hidden`).
- `editMode` is true when the wrapper is inside `node-projects-designer-canvas` (it follows shadow hosts and iframes). The preview and the runtime get `editMode=false`.
- The inner element is created with the opener's global `document` so that detached designer windows get an upgraded element. The wrapper uses a `<style>` element instead of adopted sheets for the same reason.
- Theme: the `theme` attribute (`light` default / `dark` / `auto`) plus `--iob-*` CSS custom properties read from the computed style of the wrapper when the theme is applied. Changing the screen CSS later does not re-read them until reconnect or a theme-attribute change.
- Not implemented: `dialogs` (the base class falls back to the native `<dialog>`), `value`/`iob-change` storage, enforcing `size.noResize`, and reloading after adapter installation.

## Browser fixture

`/test/browser/designer-smoke.html?webComponentFixture=1` adds a fake `system.adapter.fixture.0` with `common.webComponents` and serves `test/browser/wc/adapter/fixture/webcomponents/`. That folder holds a state tile built on the real `IobWebComponent` base class and an `editsValue` manifest that must stay out of the palette.

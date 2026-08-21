# Dependency upgrade — August 2026

Last verified: 2026-08-21

This note describes the dependency-upgrade working state introduced in the current change set. Recheck it after future package upgrades.

## Version constraints and overrides

- Direct packages were updated to their latest compatible releases at the time of the upgrade.
- TypeScript is intentionally pinned to `~6.0.3`: `typescript-eslint@8.67.0` supports TypeScript `<6.1`, so TypeScript 7 is not currently compatible.
- ESLint 10 requires flat configuration; the repository now uses `eslint.config.js`.
- `package.json` contains security/compatibility overrides for:
  - `@alcalzone/esbuild-register` → `esbuild@0.28.2`
  - `mocha` → `diff@8.0.4` and `serialize-javascript@7.1.0`
  - `monaco-editor` → `dompurify@3.4.14`
- `npm audit` reported zero vulnerabilities after this upgrade.

## Monaco migration

- Runtime Monaco assets now come from `@node-projects/monaco-editor-esm@0.56.1`.
- The old `_patchAndMinifyMonaco.js` script and the `bundleMonaco` build step were removed. The package now supplies the required minified module.
- Version `0.56.0` declared a minified entry but did not publish it; `0.56.1` contains the required file.
- Production import maps point `monaco-editor` to `@node-projects/monaco-editor-esm/esm/vs/editor/editor.main.min.js`.
- The debug alias `a_monaco-editor` points to the readable `editor.main.js`.
- Monaco CSS is loaded from `@node-projects/monaco-editor-esm/min/vs/editor/editor.main.css`.
- `gulpfile.mjs` copies the scoped ESM package. It no longer copies the official `monaco-editor` package into `www`; that package can still exist transitively for dependencies/types.
- In the new module API, TypeScript defaults are exposed at top-level `monaco.typescript`, not `monaco.languages.typescript`. `IobrokerWebuiMonacoEditor.ts` uses the new location with a local structural type.
- Direct browser delivery must configure `globalThis.MonacoEnvironment.getWorker` before Monaco is imported. `ConfigureMonacoEnvironment.ts` routes editor and language labels to the package's native module-worker entry points; otherwise Monaco uses its bundler-oriented blob/dynamic-import fallback and the editor worker can fail to load.
- A browser smoke test verified that the module loads, TypeScript defaults exist, and an editor/model can be created with the expected content.

## Select-ID package migration

- `@iobroker/webcomponent-selectid-dialog@2.0.2` moved its runtime artifacts from `dist/` to `build/`.
- `gulpfile.mjs` copy paths and frontend imports use `build/iobrokerSelectId.es.js`, `build/selectIdHelper.js`, and `build/socket.iob.js`.

## Blockly compatibility

- `@node-projects/web-component-designer-visualization-addons@0.1.150` removes obsolete document-level Blockly stylesheet lookups. Blockly 13 injects its common and renderer styles directly into the editor shadow root; older add-on code failed with `Cannot read properties of null (reading 'innerText')` when opening a Blockly event editor.

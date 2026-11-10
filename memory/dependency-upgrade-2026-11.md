# Dependency upgrade — November 2026

Verified 2026-11-10:

- All direct dependencies use their latest published stable version except TypeScript, retained at `~6.0.3` because `typescript-eslint@8.72.2` declares `<6.1` support. Do not force TypeScript 7 through peer dependency checks.
- Designer packages move together to `1.1.8`; dock-spawn-ts to `4.5.4`, propertygrid to `3.0.0`, base-custom-webcomponent to `0.47.0`, Wunderbaum to `0.15.0`.
- Security overrides update DOMPurify to `3.4.17`, serialize-javascript to `7.1.4`, modern glob to `14.0.4`, modern minimatch to `11.0.5`, and deepmerge to `4.3.1`. Legacy glob/minimatch majors are left alone to preserve their older APIs.
- `npm audit` reports four low-severity findings in the development server chain (deepmerge and three dependants); registry latest deepmerge `4.3.1` remains affected. No moderate/high/critical findings. Avoid npm's suggested downgrade to `@web/dev-server@0.0.0`.
- Passed `npm run check`, `npm run lint`, `npm test` (12 frontend/helper + 46 package checks), and `npm run build`. Build refreshes tracked `www/` assets.

## Embedded Monaco sanitizer

- The latest `@node-projects/monaco-editor-esm@0.56.1` embeds DOMPurify 3.4.8 in both readable source and prebuilt chunks. npm audit cannot detect this embedded copy, and an override on the separate official monaco-editor dependency does not replace it.
- `npm run prepareMonaco` (`scripts/prepare-monaco.mjs`) copies the current direct DOMPurify dependency into the fork's readable sanitizer module and rebuilds its browser entry with esbuild under `esm/vs/editor/webui/`. The production import map points there; the debug alias uses the patched readable modules.
- Gulp omits obsolete hashed editor chunks and AMD JavaScript from the packaged fork. Native ESM workers and CSS remain. No 3.4.8 sanitizer remains in the packaged JavaScript.
- Passed the packaging regression test (both active bundle and debug source contain DOMPurify 3.4.17), production build, check, lint and all tests. Browser verification covers Monaco HTML split-view editing/canvas synchronization and AI Apply with the rebuilt bundle.

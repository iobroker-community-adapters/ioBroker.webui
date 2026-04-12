import gulp from 'gulp';
const { src, dest, series } = gulp;
import { deleteAsync } from 'del';
import git from 'gulp-git'
import replace from 'gulp-replace';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json'));

function copyNodeModules() {
    let runtimeModules = [
        "@iobroker/socket-client",
        "@node-projects/base-custom-webcomponent",
        "@node-projects/lean-he-esm",
        "@node-projects/node-html-parser-esm",
        "@node-projects/web-component-designer",
        "@node-projects/web-component-designer-codeview-monaco",
        "@node-projects/web-component-designer-htmlparserservice-nodehtmlparser",
        "@node-projects/css-parser",
        "@node-projects/web-component-designer-stylesheetservice-css-parser",
        "@node-projects/web-component-designer-widgets-wunderbaum",
        "@node-projects/web-component-designer-visualization-addons",
        "@node-projects/propertygrid.webcomponent",
        "@node-projects/splitview.webcomponent",
        "construct-style-sheets-polyfill",
        //"es-module-shims",
        "dock-spawn-ts",
        "esprima-next",
        "long",
        "mobile-drag-drop",
        "monaco-editor",
        //"tslib"
        //"wunderbaum",
    ]
    runtimeModules = runtimeModules.map(x => './node_modules/' + x + '/**/*')

    return src(runtimeModules, { base: './', encoding: false })
        .pipe(dest('./www'));
}

function copyNodeFiles() {
    let runtimeModules = [
        "tslib/tslib.es6.mjs",
        "es-module-shims/dist/es-module-shims.js",
        "wunderbaum/dist/wunderbaum.css",
        "wunderbaum/dist/wunderbaum.esm.min.js",
        "blockly/blockly_compressed.js",
        "blockly/blocks_compressed.js",
        "blockly/javascript_compressed.js",
        "blockly/msg/en.js",
        "@blockly/zoom-to-fit/dist/index.js",
        "toastify-js/src/toastify-es.js",
        "toastify-js/src/toastify.css",
        "dayjs/dayjs.min.js",
        "@iobroker/webcomponent-selectid-dialog/dist/iobrokerSelectId.es.js",
        "@iobroker/webcomponent-selectid-dialog/dist/selectIdHelper.js",
        "@iobroker/webcomponent-selectid-dialog/dist/socket.iob.js"
    ]

    runtimeModules = runtimeModules.map(x => './node_modules/' + x)

    return src(runtimeModules, { base: './', encoding: false })
        .pipe(dest('./www'));
}

function cleanupNodeModules() {
    let notUsed = [
        "./www/node_modules/monaco-editor/dev",
        "./www/node_modules/monaco-editor/esm",
        "./www/node_modules/monaco-editor/min-maps",
        "./www/**/*.ts",
        "!./www/node_modules/@node-projects/base-custom-webcomponent/dist/BaseCustomWebComponent.d.ts",
        "!./www/dist/frontend/common/*.d.ts",
        "!./www/node_modules/@iobroker/socket-client/dist/esm/Connection.d.ts",
        "./www/**/*.map",
        "./www/**/*.md",
        "./www/**/*.txt",
        "./www/**/*.less",
        "./www/**/*.BSD",
        "./www/**/*.cjs",
        "./www/**/cjs/**/*",
        "./www/**/LICENSE",
        "./www/**/package.json",
        "./www/**/tsconfig.json",
        "./www/**/*.bat",
        "./www/node_modules/mobile-drag-drop/**/*",
        "!./www/node_modules/mobile-drag-drop/index.js",
        "!./www/node_modules/mobile-drag-drop/default.css"
    ]

    return deleteAsync(notUsed);
}

function cleanupMonaco() {
    return deleteAsync([
        './www/node_modules/monaco-editor/min/vs/basic-languages/**/*',
        '!./www/node_modules/monaco-editor/min/vs/basic-languages/javascript',
        '!./www/node_modules/monaco-editor/min/vs/basic-languages/typescript',
        '!./www/node_modules/monaco-editor/min/vs/basic-languages/html',
        '!./www/node_modules/monaco-editor/min/vs/basic-languages/css',
        './www/node_modules/monaco-editor/min/vs/editor/*.js',
        '!./www/node_modules/monaco-editor/min/vs/editor/editor.main.js',
        '!./www/node_modules/monaco-editor/min/vs/editor/editor.main.nls.js',
    ]);
}

function copyDist() {
    return src('./dist/**/*.*')
        .pipe(dest('./www/dist'));
}

export function delAll() {
    let notUsed = [
        "./www",
        "./dist"
    ]

    return deleteAsync(notUsed);
}

function cleanupDist() {
    let notUsed = [
        "./www/dist/backend"
    ]

    return deleteAsync(notUsed);
}

function copyAssets() {
    return src('./assets/**/*.*')
        .pipe(dest('./www/assets'));
}

function copyHtml() {
    return src('./*.html')
        .pipe(dest('./www'));
}

function copyManifest() {
    return src('./manifest.json')
        .pipe(dest('./www'));
}

function copyConfigJs() {
    return src('./config/config.js')
        .pipe(dest('./www'));
}

function saveGitCommitHash(done) {
    git.revParse({ args: '--short HEAD' }, (err, hash) => {
        if (err) throw err;
        gulp.src('index.html')
            .pipe(replace('{{COMMIT_HASH}}', hash))
            .pipe(replace('{{VERSION}}', pkg.version))
            .pipe(gulp.dest('./www'));
        done();
    });
}

//git rev-parse HEAD
export default series(copyNodeModules, copyNodeFiles, copyDist, cleanupNodeModules, cleanupDist, copyAssets, copyHtml, copyManifest, copyConfigJs, cleanupMonaco, saveGitCommitHash);

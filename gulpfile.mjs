import gulp from 'gulp';
const { src, dest, series } = gulp;
import { deleteAsync } from 'del';
import git from 'gulp-git'
import replace from 'gulp-replace';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json'));

async function fixMonaco() {
    //fix for monaco editor (issue https://github.com/microsoft/monaco-editor/issues/3409)
    console.log("fix ./node_modules/monaco-editor/min/vs/editor/editor.main.js");
    fs.readFile("./node_modules/monaco-editor/min/vs/editor/editor.main.js", function (err, buf) {
        let code = buf.toString();
        let rgx = /(.)=>{this\.viewHelper\.viewDomNode\.contains\((.)\.target\)/;
        let newcode = code.replace(rgx, '$1=>{this.viewHelper.viewDomNode.contains($1.composedPath()[0])');
        if (code != newcode) {
            console.log("monaco was fixed!!");
            fs.writeFile("./node_modules/monaco-editor/min/vs/editor/editor.main.js", newcode, (err) => {
                if (err) console.log(err);
            });
        }
    });
}

function copyNodeModules() {
    let runtimeModules = [
        "@adobe/css-tools",
        "@iobroker/socket-client",
        "@node-projects/base-custom-webcomponent",
        "@node-projects/lean-he-esm",
        "@node-projects/node-html-parser-esm",
        "@node-projects/web-component-designer",
        "@node-projects/web-component-designer-codeview-monaco",
        "@node-projects/web-component-designer-htmlparserservice-nodehtmlparser",
        "@node-projects/web-component-designer-stylesheetservice-css-tools",
        "@node-projects/web-component-designer-widgets-wunderbaum",
        "@node-projects/web-component-designer-visualization-addons",
        "@node-projects/propertygrid.webcomponent",
        "@node-projects/splitview.webcomponent",
        "construct-style-sheets-polyfill",
        //"es-module-shims",
        "dock-spawn-ts",
        "esprima-next",
        "long",
        //"metro4-dist",
        "mobile-drag-drop",
        "monaco-editor",
        //"tslib"
        //"wunderbaum",
        
        "/node_modules/blockly/blockly_compressed.js",
        "/node_modules/blockly/blocks_compressed.js",
        "/node_modules/blockly/javascript_compressed.js",
        "/node_modules/blockly/msg/en.js",
        "/node_modules/@blockly/zoom-to-fit/dist/index.js",
    ]

    runtimeModules = runtimeModules.map(x => './node_modules/' + x + '/**/*')

    return src(runtimeModules, { base: './', encoding: false })
        .pipe(dest('./www'));
}

function copyNodeFiles() {
    let runtimeModules = [
        "metro4-dist/css/metro-all.min.css",
        "metro4-dist/js/metro.min.js",
        "metro4-dist/mif/metro.woff",
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
        "dayjs/dayjs.min.js"
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
export default series(fixMonaco, copyNodeModules, copyNodeFiles, copyDist, cleanupNodeModules, cleanupDist, copyAssets, copyHtml, copyManifest, copyConfigJs, cleanupMonaco, saveGitCommitHash);

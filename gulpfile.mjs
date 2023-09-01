import gulp from 'gulp';
const { src, dest, series } = gulp;
import { deleteAsync } from 'del';
import git from 'gulp-git'
import replace from 'gulp-replace';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json'));

function copyNodeModules() {
    let runtimeModules = [
        "@adobe/css-tools",
        "@iobroker/socket-client",
        "@node-projects/base-custom-webcomponent",
        "@node-projects/lean-he-esm",
        "@node-projects/node-html-parser-esm",
        "@node-projects/web-component-designer",
        "construct-style-sheets-polyfill",
        "es-module-shims",
        "dock-spawn-ts",
        "esprima-next",
        //"jquery",
        //"jquery.fancytree",
        "long",
        //"metro4-dist",
        "mobile-drag-drop",
        "monaco-editor",
        //"tslib"

        "jquery.fancytree/dist/skin-win8",
    ]

    runtimeModules = runtimeModules.map(x => './node_modules/' + x + '/**/*')

    return src(runtimeModules, { base: './' })
        .pipe(dest('./www'));
}

function copyNodeFiles() {
    let runtimeModules = [
        "metro4-dist/css/metro-all.min.css",
        "metro4-dist/js/metro.min.js",
        "metro4-dist/mif/metro.woff",
        "jquery/dist/jquery.min.js",
        "jquery.fancytree/dist/jquery.fancytree-all-deps.min.js",
        "jquery.fancytree/dist/modules/jquery.fancytree.table.js",
        "tslib/tslib.es6.mjs",
    ]

    runtimeModules = runtimeModules.map(x => './node_modules/' + x)

    return src(runtimeModules, { base: './' })
        .pipe(dest('./www'));
}

function cleanupNodeModules() {
    let notUsed = [
        "./www/node_modules/monaco-editor/dev",
        "./www/node_modules/monaco-editor/esm",
        "./www/node_modules/monaco-editor/min-maps",
        "./www/**/*.ts",
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
        "!./www/node_modules/mobile-drag-drop/index.js"
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
    ]);
}

function copyDist() {
    return src('./dist/**/*.*')
        .pipe(dest('./www/dist'));
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

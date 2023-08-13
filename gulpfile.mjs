import gulp from 'gulp';
const { src, dest, series } = gulp;
import path from 'path';
import fs from 'fs';
import { deleteAsync } from 'del';
import through2 from 'through2';

const rootPath = '/webui';

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
        "./www/**/*.d.ts",
        "./www/**/*.map"
    ]

    return deleteAsync(notUsed);
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

export default series(copyNodeModules, copyNodeFiles, cleanupNodeModules, copyDist, cleanupDist, copyAssets, copyHtml, copyManifest, copyConfigJs);

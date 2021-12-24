const { src, dest, series } = require('gulp');
const path = require('path');
const fs = require('fs');
const through2 = require('through2');
const del = require('del');

const rootPath = '/webui';

function fixJsImports() {
    return src('www/**/*.js')
        .pipe(
            through2.obj(function (file, _, cb) {
                if (file.isBuffer()) {
                    var code = file.contents.toString();

                    var checkImportRegex = RegExp('(import|export)(\\s*\\{?\\*?[\\s\\w,$]*\\}?\\s*(as)?[\\s\\w{}]*from\\s*|[\\s]*)[\'"]([^\\.\\/][\\w\\/\\-@.]*?)[\'"]', 'g');
                    var checkRelativeImportRegex = RegExp('(import|export)(\\s*\\{?\\*?[\\s\\w,$]*\\}?\\s*(as)?[\\s\\w{}]*from\\s*|[\\s]*)[\'"]([\\.\\/][\\w\\/\\-@.]*?)[\'"]', 'g');

                    var pos = 0;
                    var res = '';
                    while ((m = checkImportRegex.exec(code)) !== null) {
                        var currentValue = m[4];

                        var newValue = buildImportName(currentValue, file.dirname, file.path);
                        if (newValue != currentValue) {
                            res += code.substr(pos, m.index - pos);
                            res += m[1] + m[2] + "'" + newValue + "'";
                            pos = m.index + m[0].length;
                        }
                    }
                    res += code.substr(pos, code.length - pos);
                    code = res;

                    pos = 0;
                    res = '';
                    while ((m = checkRelativeImportRegex.exec(code)) !== null) {
                        var currentValue = m[4];
                        var newValue = buildImportName(currentValue, file.dirname, file.path);
                        if (newValue != currentValue) {
                            res += code.substr(pos, m.index - pos);
                            res += m[1] + m[2] + "'" + newValue + "'";
                            pos = m.index + m[0].length;
                        }
                    }
                    res += code.substr(pos, code.length - pos);
                    code = res;

                    file.contents = Buffer.from(code);
                }
                cb(null, file);
            }),
        )
        .pipe(dest('www/'));
}

function buildImportName(importText, dirName, path) {
    if (importText[0] == '.' || importText[0] == '/') {
        var file = buildImportFileName(importText, dirName);
        if (file != null) {
            return importText + file;
        }
        return importText;
    }
    var resFile = buildImportFileName('./' + importText);
    if (resFile != null) {
        return '/' + importText + resFile;
    }
    resFile = buildImportFileName('./node_modules/' + importText);
    if (resFile != null) {
        return rootPath + '/node_modules/' + importText + resFile;
    }
    return importText;
}

function buildImportFileName(importText, dirName = '') {
    var iPath = importText;
    if (fs.existsSync(path.join(dirName, iPath)) && !fs.lstatSync(path.join(dirName, iPath)).isDirectory()) {
        return '';
    }
    //console.log('1', path.join(dirName, iPath + '.js'))
    if (fs.existsSync(path.join(dirName, iPath + '.js'))) {
        return '.js';
    }
    if (fs.existsSync(path.join(dirName, iPath, 'index.js'))) {
        return importText.endsWith('/') ? 'index.js' : '/index.js';
    }
    if (fs.existsSync(path.join(dirName, iPath, 'package.json'))) {
        var json = JSON.parse(fs.readFileSync(path.join(dirName, iPath, 'package.json'), 'utf8'));
        if (json.module) {
            var module = json.module.toString();
            if (fs.existsSync(path.join(dirName, iPath, module)) && !fs.lstatSync(path.join(dirName, iPath, module)).isDirectory()) {
                return importText.endsWith('/') ? module : '/' + module;
            }
            if (fs.existsSync(path.join(dirName, iPath, module + '.js'))) {
                return importText.endsWith('/') ? module + '.js' : '/' + module + '.js';
            }
            if (fs.existsSync(path.join(dirName, iPath, module, 'index.js'))) {
                return importText.endsWith('/') ? module + '/index.js' : '/' + module + '/index.js';
            }
        }

        var main = json.main.toString();
        if (fs.existsSync(path.join(dirName, iPath, main)) && !fs.lstatSync(path.join(dirName, iPath, main)).isDirectory()) {
            return importText.endsWith('/') ? main : '/' + main;
        }
        if (fs.existsSync(path.join(dirName, iPath, main + '.js'))) {
            return importText.endsWith('/') ? main + '.js' : '/' + main + '.js';
        }
        if (fs.existsSync(path.join(dirName, iPath, main, 'index.js'))) {
            return importText.endsWith('/') ? main + '/index.js' : '/' + main + '/index.js';
        }
    }

    return null;
}

function copyNodeModules() {
    let runtimeModules = [
        "@iobroker/socket-client",
        "@node-projects/base-custom-webcomponent",
        "@node-projects/lean-he-esm",
        "@node-projects/node-html-parser-esm",
        "@node-projects/web-component-designer",
        "construct-style-sheets-polyfill",
        "dock-spawn-ts",
        //"jquery",
        //"jquery.fancytree",
        //"metro4-dist",
        //"tslib"
        "mobile-drag-drop",
        "monaco-editor",

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
        "tslib/tslib.es6.js",
    ]

    runtimeModules = runtimeModules.map(x => './node_modules/' + x)

    return src(runtimeModules, { base: './' })
        .pipe(dest('./www'));
}

function cleanupNodeModules() {
    let notUsed = [
        "./www/node_modules/monaco-editor/dev",
        "./www/node_modules/monaco-editor/esm",
        "./www/node_modules/monaco-editor/min-maps"
    ]

    return del(notUsed);
}

function copyDist() {
    return src('./dist/**/*.*')
        .pipe(dest('./www/dist'));
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
exports.default = series(copyNodeModules, copyNodeFiles, cleanupNodeModules, copyDist, copyAssets, copyHtml, copyManifest, copyConfigJs, fixJsImports);

const { src, dest, series } = require('gulp');
const path = require('path');
const fs = require('fs');
const through2 = require('through2');

const rootPath = '/www';

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
                        var newValue = buildImportName(currentValue, file.dirname);
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
                        var newValue = buildImportName(currentValue, file.dirname);
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
        .pipe(dest('.'));
}

function buildImportName(importText, dirName = '') {
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

function copyAssets() {
    return src('./assets/**/*')
        .pipe(dest('./www/assets'));
}

function copyCss() {
    return src('./node_modules/**/dock*.css')
        .pipe(dest('./www/node_modules'));
}

function copyCssMonaco() {
    return src('./node_modules/monaco-editor/**/*.css')
        .pipe(dest('./www/node_modules/monaco-editor'));
}

function copySvg() {
    return src('./node_modules/**/*.svg')
        .pipe(dest('./www/node_modules'));
}

function copyGif() {
    return src('./node_modules/**/*.gif')
        .pipe(dest('./www/node_modules'));
}

function copyPng() {
    return src('./node_modules/**/*.png')
        .pipe(dest('./www/node_modules'));
}

function copyJson() {
    return src('./dist/**/*.json')
        .pipe(dest('./www/dist'));
}

function copyFiles1() {
    return src(
        [
            './node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2',
            './node_modules/@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2',
        ])
        .pipe(dest('./www/webfonts'));
}

function copyFiles2() {
    return src(
        [
            './node_modules/metro4-dist/mif/metro.woff',
        ])
        .pipe(dest('./www/mif'));
}

function copyFiles3() {
    return src(
        [
            './node_modules/jquery.fancytree/dist/skin-win8/ui.fancytree.css',
        ])
        .pipe(dest('./www/node_modules/jquery.fancytree/dist/skin-win8'));
}

function copyFiles4() {
    return src(
        [
            './node_modules/@node-projects/web-component-designer/config/elements-native.json',
        ])
        .pipe(dest('./www/node_modules/@node-projects/web-component-designer/config'));
}

function copyNodeParser() {
    return src('./node_modules/@node-projects/node-html-parser-esm/dist/**/*.*')
        .pipe(dest('./www/node_modules/@node-projects/node-html-parser-esm/dist'));
}

function copyMonaco() {
    return src('./node_modules/monaco-editor/min/vs/**/*.*')
        .pipe(dest('./www/node_modules/monaco-editor/min/vs'));
}

exports.default = series(copyAssets, copyCss, copyCssMonaco, copySvg, copyPng, copyGif, copyJson, copyFiles1, copyFiles2, copyFiles3, copyFiles4, copyNodeParser, copyMonaco);

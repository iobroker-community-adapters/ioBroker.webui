const { src, dest, series } = require('gulp');
const path = require('path');
const fs = require('fs');
const del = require('del');
const through2 = require('through2');

function copyNodeModules() {
    var buffer, packages, keys;

    buffer = fs.readFileSync('./package.json');
    packages = JSON.parse(buffer.toString());
    keys = [];

    for (key in packages.dependencies) {
        keys.push('./node_modules/' + key + '/**/*');
    }

    return src(keys, { base: './' }).pipe(dest('www'));
}

function clearWww() {
    return del('./www', { force: true });
}

function copyAssets() {
    return src('./assets/**/*', { base: './' }).pipe(dest('www'));
}

function copyAndFixDist() {
    return _fixImports('./dist/**/*.js', 'www/dist');
}

function _fixImports(srcDir, destDir) {
    return src(srcDir)
        .pipe(
            through2.obj(function (file, _, cb) {
                if (file.isBuffer()) {
                    var code = file.contents.toString();

                    var checkImportRegex = RegExp('(import|export)(\\s*\\{?\\*?[\\s\\w,$]*\\}?\\s*(as)?[\\s\\w]*from\\s|[\\s]*)[\'"]([^\\.\\/][\\w\\/\\-@.]*?)[\'"]', 'g');
                    var checkRelativeImportRegex = RegExp('(import|export)(\\s*\\{?\\*?[\\s\\w,$]*\\}?\\s*(as)?[\\s\\w]*from\\s|[\\s]*)[\'"]([\\.\\/][\\w\\/\\-@.]*?)[\'"]', 'g');

                    var pos = 0;
                    var res = '';
                    while ((m = checkImportRegex.exec(code)) !== null) {
                        var currentValue = m[4];
                        var newValue = _intBuildImportName(currentValue, file.dirname);
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
                        var newValue = _intBuildImportName(currentValue, file.dirname);
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
        .pipe(dest(destDir));
}

function _intBuildImportName(importText, dirName = '') {
    if (importText[0] == '.' || importText[0] == '/') {
        var file = _intBuildImportFileName(importText, dirName);
        if (file != null) {
            return importText + file;
        }
        return importText;
    }

    var resFile = _intBuildImportFileName('./' + importText);
    if (resFile != null) {
        return '/' + importText + resFile;
    }
    resFile = _intBuildImportFileName('./node_modules/' + importText);
    if (resFile != null) {
        return '/node_modules/' + importText + resFile;
    }
    return importText;
}

function _intBuildImportFileName(importText, dirName = '') {
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

exports.default = series(clearWww, copyNodeModules, copyAndFixDist, copyAssets);

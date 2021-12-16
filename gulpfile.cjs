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
        if (json.module)
		{
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

exports.default = series(fixJsImports);

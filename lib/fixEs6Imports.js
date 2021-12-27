import path from 'path';
import fs from 'fs';

async function* getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

function buildImportName(importText, dirName, newRootPath) {
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
        return newRootPath + '/node_modules/' + importText + resFile;
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

function fixJsImports(code, dirName, newRootPath) {

    var checkImportRegex = RegExp('(import|export)(\\s*\\{?\\*?[\\s\\w,$]*\\}?\\s*(as)?[\\s\\w{}]*from\\s*|[\\s]*)[\'"]([^\\.\\/][\\w\\/\\-@.]*?)[\'"]', 'g');
    var checkRelativeImportRegex = RegExp('(import|export)(\\s*\\{?\\*?[\\s\\w,$]*\\}?\\s*(as)?[\\s\\w{}]*from\\s*|[\\s]*)[\'"]([\\.\\/][\\w\\/\\-@.]*?)[\'"]', 'g');

    var pos = 0;
    var res = '';
    while ((m = checkImportRegex.exec(code)) !== null) {
        var currentValue = m[4];

        var newValue = buildImportName(currentValue, dirname, newRootPath);
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
        var newValue = buildImportName(currentValue, dirName, newRootPath);
        if (newValue != currentValue) {
            res += code.substr(pos, m.index - pos);
            res += m[1] + m[2] + "'" + newValue + "'";
            pos = m.index + m[0].length;
        }
    }
    res += code.substr(pos, code.length - pos);
    code = res;

    return code;
}

export default async function fixJsImportsInDir(dirName, newRootPath = '') {
    for await (const f of getFiles(dirName)) {
        const data = await fs.promises.readFile(f);
        const newCode = fixJsImports(data.toString(), f, newRootPath)
        Buffer.from(newCode)
      }
}
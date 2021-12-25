import fs from 'fs';
import pathF from 'path';
import { fileURLToPath } from 'url';

const __dirname = pathF.dirname(fileURLToPath(import.meta.url));

function copyFileSync(source, target) {
    let targetFile = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = pathF.join(target, pathF.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    let files = [];

    //check if folder needs to be created or integrated
    const targetFolder = pathF.join(target, pathF.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    //copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(file => {
            const curSource = pathF.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

function deleteFolderRecursive(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            const curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

function syncWidgetSets() {

    let pack = null;
    let changed = false;
    let found;
    let name;

    

    let oldConfig = null;
    if (fs.existsSync(__dirname + '/../www/webui-widgets/config.json')) {
        oldConfig = fs.readFileSync(__dirname + '/../www/webui-widgets/config.json').toString();
    }

    if (fs.existsSync(__dirname + '/../www/webui-widgets/' + name)) {
        deleteFolderRecursive(__dirname + '/../www/webui-widgets/' + name);
    }
    
    let path = __dirname + '/../../';
    let dirs = fs.readdirSync(path);
    const sets = [];
    for (let d = 0; d < dirs.length; d++) {
        if (fs.existsSync(path + dirs[d] + '/webui-widget.json')) {
            let widgetInfo = JSON.parse(fs.readFileSync(path + dirs[d] + '/webui-widget.json').toString());
            pack = null;
            try {
                pack = JSON.parse(fs.readFileSync(path + dirs[d] + '/io-package.json').toString());
            } catch (e) {
                console.warn('Cannot parse "' + path + dirs[d] + '/io-package.json": ' + e);
            }
            sets.push({ path: path + dirs[d], name: dirs[d].toLowerCase(), pack: pack, info: widgetInfo });
        }
    }

    const widgetInfo = {};
    for (let d = 0; d < sets.length; d++) {
        if (fs.existsSync(sets[d].path + '/webui-widgets/'))
            copyFolderRecursiveSync(sets[d].path + '/webui-widgets/', __dirname + '/../www/');
        widgetInfo[sets[d].name] = sets[d].info;
    }
    let newConfig = JSON.stringify(widgetInfo)

    if (oldConfig !== newConfig) {
        fs.writeFileSync(__dirname + '/../www/webui-widgets/config.json', newConfig);
        return newConfig;
    } else {
        return false;
    }
}

export default syncWidgetSets;
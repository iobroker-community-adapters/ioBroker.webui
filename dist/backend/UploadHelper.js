import fs from 'fs';
import fsAsync from 'fs/promises';
import path from 'path';
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export class Uploadhelper {
    _adapter;
    _stoppingPromise = false;
    _lastProgressUpdate;
    _namespace;
    _stateNpm = 'state.npm';
    _ignoredFileExtensions = [
        '.npmignore',
        '.gitignore',
        '.DS_Store',
        '_socket/info.js',
        'LICENSE',
        '.ts',
        '.map',
        '.md',
        '.html',
        'package-lock.json',
        'tsconfig.json',
        '.release-it.json',
        '.yml',
        '.cjs'
    ];
    constructor(adapter, namespace) {
        this._adapter = adapter;
        this._namespace = namespace;
        //this._uploadStateObjectName = `system.adapter.${this._adapterName}.upload`;
    }
    static async upload(adapter, namespace, sourceDirectory, targetDirectory) {
        const hlp = new Uploadhelper(adapter, namespace);
        await hlp.upload(sourceDirectory, targetDirectory);
    }
    async upload(sourceDirectory, targetDirectory) {
        if (!fs.existsSync(sourceDirectory)) {
            this._adapter.log.warn(`source directory does not exist: ${sourceDirectory}`);
            return;
        }
        // Read all names with subtrees from the local directory
        const files = this.walk(sourceDirectory);
        this._adapter.setState(this._stateNpm, { val: `collect files to delete`, ack: true });
        const { filesToDelete } = await this.collectExistingFilesToDelete(targetDirectory);
        this._adapter.setState(this._stateNpm, { val: `delete ${filesToDelete.length} files`, ack: true });
        this._adapter.log.debug(`Erasing files: ${filesToDelete.length}`);
        if (this._stoppingPromise) {
            return;
        }
        // delete old files, before upload of new
        await this.eraseFiles(filesToDelete);
        this._adapter.log.debug(`Erasing done, start upload...`);
        await this.uploadInternal(files, sourceDirectory, targetDirectory);
        if (this._stoppingPromise) {
            return;
        }
    }
    async collectExistingFilesToDelete(dir) {
        let _files = [];
        let _dirs = [];
        let files;
        if (this._stoppingPromise) {
            return { filesToDelete: _files, dirs: _dirs };
        }
        try {
            files = await this._adapter.readDirAsync(this._namespace, dir);
        }
        catch {
            // ignore err
            files = [];
        }
        if (files && files.length) {
            for (const file of files) {
                if (file.file === '.' || file.file === '..') {
                    continue;
                }
                const newPath = path.join(dir, file.file);
                if (file.isDir) {
                    if (!_dirs.find(e => e.path === newPath)) {
                        _dirs.push({ adapter: this._adapter, path: newPath });
                    }
                    try {
                        const result = await this.collectExistingFilesToDelete(`${newPath}/`);
                        if (result.filesToDelete) {
                            _files = _files.concat(result.filesToDelete);
                        }
                        _dirs = _dirs.concat(result.dirs);
                    }
                    catch (err) {
                        this._adapter.log.warn(`Cannot delete folder "${this._adapter}${newPath}/": ${err.message}`);
                    }
                }
                else if (!_files.find(e => e.path === newPath)) {
                    _files.push(newPath);
                }
            }
        }
        return { filesToDelete: _files, dirs: _dirs };
    }
    async eraseFiles(files) {
        if (files && files.length) {
            for (const file of files) {
                if (this._stoppingPromise) {
                    return;
                }
                try {
                    await this._adapter.unlinkAsync(this._namespace, file);
                }
                catch (err) {
                    this._adapter.log.error(`Cannot delete file "${file}": ${err}`);
                }
            }
        }
    }
    async uploadInternal(files, sourceDirectory, targetDirectory) {
        const dirLen = sourceDirectory.length;
        for (let f = 0; f < files.length; f++) {
            const file = files[f];
            if (this._stoppingPromise) {
                return;
            }
            let attName = targetDirectory + file.substring(dirLen).replace(/\\/g, '/');
            // write upload status into log
            if (files.length - f > 100) {
                (!f || !((files.length - f - 1) % 50)) &&
                    this._adapter.setState(this._stateNpm, { val: `upload [${files.length - f - 1}/${files.length}]`, ack: true });
            }
            else if (files.length - f - 1 > 20) {
                (!f || !((files.length - f - 1) % 10)) &&
                    this._adapter.setState(this._stateNpm, { val: `upload [${files.length - f - 1}/${files.length}]`, ack: true });
            }
            else {
                this._adapter.setState(this._stateNpm, { val: `upload [${files.length - f - 1}/${files.length}]`, ack: true });
            }
            // Update upload indicator
            const now = Date.now();
            if (!this._lastProgressUpdate || now - this._lastProgressUpdate > 1000) {
                this._lastProgressUpdate = now;
            }
            try {
                await this._uploadFile(file, attName);
            }
            catch (e) {
                this._adapter.log.error(`Error: Cannot upload ${file}: ${e.message}`);
            }
        }
        return;
    }
    async _uploadFile(sourceFile, destinationFile) {
        const data = await fsAsync.readFile(sourceFile);
        await this._adapter.writeFileAsync(this._namespace, destinationFile, data);
    }
    // Read synchronous all files recursively from local directory
    walk(dir, _results) {
        const results = _results || [];
        if (this._stoppingPromise) {
            return results;
        }
        try {
            if (fs.existsSync(dir)) {
                const list = fs.readdirSync(dir);
                list.map(file => {
                    const stat = fs.statSync(`${dir}/${file}`);
                    if (stat.isDirectory()) {
                        this.walk(`${dir}/${file}`, results);
                    }
                    else {
                        if (!this._ignoredFileExtensions.some(x => file.endsWith(x))) {
                            results.push(`${dir}/${file}`);
                        }
                    }
                });
            }
        }
        catch (err) {
            console.error(err);
        }
        return results;
    }
}

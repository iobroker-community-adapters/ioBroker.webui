import utils from '@iobroker/adapter-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Uploadhelper } from './UploadHelper.js';
import { ImportmapCreator } from './ImportmapCreator.js';
const __dirname = path.normalize(path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)).toString());
const adapterName = pkg.name.split('.').pop();
class WebUi extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: adapterName,
        });
        this._instanceName = 'webui.0';
        this._npmNamespace = this._instanceName + '.widgets';
        this._stateNpm = 'state.npm';
        this.widgetsDir = __dirname + '/widgets';
        this.npmRunning = false;
        this.states = {};
        this.on('ready', this.main.bind(this));
        this.on('stateChange', this.stateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    async runUpload() {
        await Uploadhelper.upload(this, this._npmNamespace, this.widgetsDir, '');
        /*return new Promise(resolve => {
            this.log.info(`Upload ${this.name}, changes detected...`);
            const file = utils.controllerDir + '/iobroker.js';
            const child = spawn('node', [file, 'upload', this.name, 'widgets']);
            let count = 0;
            child.stdout.on('data', data => {
                count++;
                this.log.debug(data.toString().replace('\n', ''));
                !(count % 100) && this.log.info(count + ' files uploaded...');
            });

            child.stderr.on('data', data =>
                this.log.error(data.toString().replace('\n', '')));

            child.on('exit', exitCode => {
                this.log.info(`Uploaded. ${exitCode ? 'Exit - ' + exitCode : 0}`);
                resolve(exitCode);
            });
        });*/
    }
    async refreshWWW() {
        await this.runUpload();
        this.setState('webui.0.control.command', { val: 'uiReloadPackages', ack: true });
    }
    async creatWidgetsDirAndRestorePackageJsonIfneeded() {
        if (!fs.existsSync(this.widgetsDir))
            await fs.promises.mkdir(this.widgetsDir);
        if (!fs.existsSync(this.widgetsDir + '/package.json')) {
            if (await this.fileExistsAsync(this._npmNamespace, 'package.json')) {
                this.log.info(`adapter was updated, restore packages.json`);
                let data = await this.readFileAsync(this._npmNamespace, 'package.json');
                await fs.promises.writeFile(this.widgetsDir, data.file);
            }
            else {
                await fs.promises.writeFile(this.widgetsDir + '/package.json', '{}');
            }
        }
    }
    installNpm(name) {
        return new Promise(async (resolve) => {
            if (this.npmRunning) {
                this.log.info(`NPM already running`);
                resolve(null);
            }
            this.npmRunning = true;
            this.log.info(`Install NPM package (${name}), check dirs...`);
            await this.creatWidgetsDirAndRestorePackageJsonIfneeded();
            this.log.info(`Install NPM package (${name})...`);
            const child = spawn('npm', ['install', '--omit=dev', name], { cwd: __dirname + this.widgetsDir });
            child.stdout.on('data', data => {
                this.log.debug(data.toString().replace('\n', ''));
            });
            child.stderr.on('data', data => this.log.error(data.toString().replace('\n', '')));
            child.on('exit', exitCode => {
                this.log.info(`Installed NPM packge (${name}). ${exitCode ? 'Exit - ' + exitCode : 0}`);
                this.npmRunning = false;
                resolve(exitCode);
            });
        });
    }
    removeNpm(name) {
        return new Promise(async (resolve) => {
            if (this.npmRunning) {
                this.log.info(`NPM already running`);
                resolve(null);
            }
            this.npmRunning = true;
            this.log.info(`Remove NPM package (${name}), check dirs...`);
            await this.creatWidgetsDirAndRestorePackageJsonIfneeded();
            this.log.info(`Remove NPM package (${name})...`);
            const child = spawn('npm', ['remove', name], { cwd: this.widgetsDir });
            child.stdout.on('data', data => {
                this.log.debug(data.toString().replace('\n', ''));
            });
            child.stderr.on('data', data => this.log.error(data.toString().replace('\n', '')));
            child.on('exit', exitCode => {
                this.log.info(`Remove NPM packge (${name}). ${exitCode ? 'Exit - ' + exitCode : 0}`);
                this.npmRunning = false;
                resolve(exitCode);
            });
        });
    }
    async stateChange(id, state) {
        this.log.info(`stateChange: ${id}, value: ${state.val}, ack: ${state.ack}`);
        if (!id || !state)
            return;
        if (state.ack) {
            return;
        }
        this.states[id] = state.val;
        if (id === 'webui.0.control.command')
            await this.runCommand(this.states["webui.0.control.command"], this.states["webui.0.control.data"]);
        await this.setStateAsync(id, state, true);
    }
    async createImportMapAndLoaderFiles() {
        try {
            this.log.info(`create importMap...`);
            const imc = new ImportmapCreator(this, this.widgetsDir, '/' + this._npmNamespace);
            await imc.parsePackages();
            this.log.info(`importMap: ` + JSON.stringify(imc.importMap));
        }
        catch (err) {
            this.log.error(`createImportMapAndLoaderFiles(): ` + err);
        }
    }
    async runCommand(command, parameter) {
        this.log.info(`runCommand: ${command}, parameter: ${parameter}`);
        switch (command) {
            case 'addNpm':
                await this.setState(this._stateNpm, { val: 'installingPackage', ack: true });
                await this.installNpm(parameter);
                await this.setState(this._stateNpm, { val: 'createImportmap', ack: true });
                await this.createImportMapAndLoaderFiles();
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
            case 'updateNpm':
                await this.installNpm(parameter);
                await this.createImportMapAndLoaderFiles();
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
            case 'removeNpm':
                await this.setState(this._stateNpm, { val: 'removeingPackage', ack: true });
                await this.removeNpm(parameter);
                await this.setState(this._stateNpm, { val: 'createImportmap', ack: true });
                await this.createImportMapAndLoaderFiles();
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
            case 'refreshWww':
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
        }
    }
    async main() {
        this.log.info(`dirName: ` + __dirname);
        /*if (!fs.existsSync(__dirname + '/www/widgets/package.json')) {
            this.log.info(`No package.json for widgets found, look if one was uploaded.`);
            if (await this.fileExistsAsync(adapterName, 'widgets/package.json')) {
                this.log.info(`adapter was updated, restore packages.json`);
                if (!fs.existsSync(__dirname + '/www/widgets'))
                    await fs.promises.mkdir(__dirname + '/www/widgets')
                let data = await this.readFileAsync(adapterName, 'widgets/package.json')
                await fs.promises.writeFile(__dirname + '/www/widgets/package.json', data.file);
                this.log.info(`run NPM install`);
                await this.installNpm('');
                await this.createImportMapAndLoaderFiles();
                await this.refreshWWW();
            }
        }*/
        await this.subscribeStatesAsync('*', {});
        this.log.info(`adapter ready`);
    }
    onUnload() {
        this._unloaded = true;
    }
}
new WebUi();

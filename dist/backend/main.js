import { AiBackend, readSystemAiSettings } from '@iobroker/ai-core';
import * as utils from '@iobroker/adapter-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Uploadhelper } from './UploadHelper.js';
import { AiPackageService } from './AiPackageService.js';
import { ImportmapCreator } from './ImportmapCreator.js';
const __dirname = path.normalize(path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)).toString());
const adapterName = pkg.name.split('.').pop();
class WebUi extends utils.Adapter {
    ai = new AiBackend(this, {
        getSettings: async () => {
            const settings = await readSystemAiSettings(this);
            // ai-core 0.0.6's model-list path requires a credential in manager mode,
            // even for keyless local endpoints. Keep the endpoint from system.ai.
            if (settings.defaultProvider === 'custom' && !settings.credentialIds.custom)
                settings.credentialType = 'manual';
            return settings;
        },
    });
    manualPackageRunning = false;
    aiPackages = new AiPackageService({
        busy: () => this.manualPackageRunning || this.npmRunning || this._unloaded,
        installed: async () => {
            await this.creatWidgetsDirAndRestorePackageJsonIfneeded();
            const manifest = JSON.parse(await fs.promises.readFile(path.join(this.widgetsDir, 'package.json'), 'utf8'));
            return manifest.dependencies ?? {};
        },
        install: name => this.installNpm(name),
        publish: async () => { await this.createImportMapAndLoaderFiles(); await this.refreshWWW(); },
        status: async (value) => { await this.setState(this._stateNpm, { val: value, ack: true }); }
    });
    _unloaded;
    _instanceName = 'webui.0';
    _npmNamespace = this._instanceName + '.widgets';
    _dataNamespace = this._instanceName + '.data';
    _stateNpm = 'state.npm';
    _stateCommand = 'webui.0.control.command';
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: adapterName,
            uiClientSubscribe: info => this.ai.onUiClientSubscribe(info) ?? { accepted: false },
            uiClientUnsubscribe: info => this.ai.onUiClientUnsubscribe(info),
        });
        this.on('message', obj => {
            if (obj.command === 'ai:addPackage') {
                if (!obj.callback)
                    return;
                void this.aiPackages.add(obj.message?.name).then(result => this.sendTo(obj.from, obj.command, result, obj.callback), error => this.sendTo(obj.from, obj.command, { error: String(error.message ?? error) }, obj.callback));
            }
            else
                this.ai.handleMessage(obj);
        });
        this.on('ready', this.main.bind(this));
        this.on('stateChange', this.stateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }
    async runUpload() {
        await Uploadhelper.upload(this, this._npmNamespace, this.widgetsDir, '');
    }
    async refreshWWW() {
        await this.runUpload();
        this.setState(this._stateCommand, { val: 'uiReloadPackages', ack: true });
    }
    widgetsDir = __dirname + '/widgets';
    npmRunning = false;
    async creatWidgetsDirAndRestorePackageJsonIfneeded() {
        if (this._unloaded)
            return;
        if (!fs.existsSync(this.widgetsDir))
            await fs.promises.mkdir(this.widgetsDir);
        if (!fs.existsSync(this.widgetsDir + '/package.json')) {
            this.log.info(`no packages.json in widgets dir found, creating one`);
            if (await this.fileExistsAsync(this._dataNamespace, 'package.json')) {
                this.log.info(`adapter was updated, restore existing packages.json`);
                let data = await this.readFileAsync(this._dataNamespace, 'package.json');
                await fs.promises.writeFile(this.widgetsDir + '/package.json', data.file);
            }
            else {
                await fs.promises.writeFile(this.widgetsDir + '/package.json', '{}');
            }
        }
    }
    async backupPackageJson() {
        if (this._unloaded)
            return;
        if (fs.existsSync(this.widgetsDir + '/package.json')) {
            if (await this.fileExistsAsync(this._dataNamespace, 'package.json')) {
                await this.delFileAsync(this._dataNamespace, 'package.json');
            }
            let data = await fs.promises.readFile(this.widgetsDir + '/package.json');
            await this.writeFileAsync(this._dataNamespace, 'package.json', data);
        }
    }
    checkPackageName(name) {
        return /[a-z@\-_\/]/.test(name);
    }
    async installNpm(name) {
        if (!this.checkPackageName(name))
            throw new Error('Invalid NPM package name');
        if (this.npmRunning || this._unloaded)
            throw new Error('NPM is busy or the adapter is stopping');
        this.npmRunning = true;
        try {
            await this.creatWidgetsDirAndRestorePackageJsonIfneeded();
            const exitCode = await new Promise((resolve, reject) => {
                const child = spawn('npm', ['install', '--omit=dev', '--ignore-scripts', name], { cwd: this.widgetsDir, shell: process.platform == 'win32' });
                child.stdout.on('data', data => this.log.debug(data.toString().trim()));
                child.stderr.on('data', data => this.log.error(data.toString().trim()));
                child.once('error', reject);
                child.once('exit', code => resolve(code ?? -1));
            });
            await this.backupPackageJson();
            return exitCode;
        }
        finally {
            this.npmRunning = false;
        }
    }
    removeNpm(name) {
        return new Promise(async (resolve) => {
            if (!this.checkPackageName(name)) {
                this.log.error(`Invalid NPM Package Name: ${name}`);
                resolve(null);
            }
            if (this.npmRunning) {
                this.log.info(`NPM already running`);
                resolve(null);
            }
            if (this._unloaded) {
                this.log.info(`unloaded`);
                resolve(null);
            }
            this.npmRunning = true;
            this.log.info(`Remove NPM package (${name}), check dirs...`);
            await this.creatWidgetsDirAndRestorePackageJsonIfneeded();
            this.log.info(`Remove NPM package (${name})...`);
            const child = spawn('npm', ['remove', name], { cwd: this.widgetsDir, shell: process.platform == 'win32' });
            child.stdout.on('data', data => {
                this.log.debug(data.toString().replace('\n', ''));
            });
            child.stderr.on('data', data => this.log.error(data.toString().replace('\n', '')));
            child.on('exit', async (exitCode) => {
                this.log.info(`Remove NPM packge (${name}). ${exitCode ? 'Exit - ' + exitCode : ''}`);
                this.npmRunning = false;
                await this.backupPackageJson();
                resolve(exitCode);
            });
        });
    }
    states = {};
    async stateChange(id, state) {
        this.log.debug(`stateChange: ${id}, value: ${state.val}, ack: ${state.ack}`);
        if (!id || !state)
            return;
        if (state.ack) {
            return;
        }
        this.states[id] = state.val;
        if (id === this._stateCommand)
            await this.runCommand(this.states[this._stateCommand], this.states["webui.0.control.data"]);
        await this.setStateAsync(id, state, true);
    }
    async createImportMapAndLoaderFiles() {
        try {
            if (this._unloaded)
                return;
            this.log.info(`create importMap...`);
            const imc = new ImportmapCreator(this, this.widgetsDir, '/' + this._npmNamespace + '/node_modules');
            await imc.parsePackages();
            this.log.info(`importMap: ` + JSON.stringify(imc.importMap));
        }
        catch (err) {
            this.log.error(`createImportMapAndLoaderFiles(): ` + err);
            throw err;
        }
    }
    async runCommand(command, parameter) {
        const packageCommand = ['addNpm', 'updateNpm', 'removeNpm', 'createImportmap'].includes(command);
        if (packageCommand && (this.manualPackageRunning || this.aiPackages.running)) {
            this.log.warn('Another npm operation is running');
            return;
        }
        if (packageCommand)
            this.manualPackageRunning = true;
        try {
            await this.executeCommand(command, parameter);
        }
        catch (error) {
            this.log.error(String(error));
        }
        finally {
            if (packageCommand) {
                this.manualPackageRunning = false;
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
            }
        }
    }
    async executeCommand(command, parameter) {
        this.log.info(`runCommand: ${command}, parameter: ${parameter}`);
        switch (command) {
            case 'addNpm':
                await this.setState(this._stateNpm, { val: 'installing npm package "' + parameter + '"', ack: true });
                await this.installNpm(parameter);
                await this.setState(this._stateNpm, { val: 'create importmap', ack: true });
                await this.createImportMapAndLoaderFiles();
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
            case 'updateNpm':
                await this.setState(this._stateNpm, { val: 'updateing npm package "' + parameter + '"', ack: true });
                await this.installNpm(parameter + '@latest');
                await this.setState(this._stateNpm, { val: 'create importmap', ack: true });
                await this.createImportMapAndLoaderFiles();
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
            case 'removeNpm':
                await this.setState(this._stateNpm, { val: 'removeing npm package "' + parameter + '"', ack: true });
                await this.removeNpm(parameter);
                await this.setState(this._stateNpm, { val: 'create importmap', ack: true });
                await this.createImportMapAndLoaderFiles();
                await this.setState(this._stateNpm, { val: 'uploading', ack: true });
                await this.refreshWWW();
                await this.setState(this._stateNpm, { val: 'idle', ack: true });
                break;
            case 'createImportmap':
                await this.setState(this._stateNpm, { val: 'create importmap', ack: true });
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
        await this.ai.start();
        this.log.info(`dirName: ` + __dirname);
        await this.setState(this._stateNpm, { val: 'idle', ack: true });
        await this.subscribeStatesAsync('*', {});
        this.log.info(`adapter ready`);
    }
    onUnload(callback) {
        this._unloaded = true;
        void this.ai.stop().finally(callback);
    }
}
const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] === modulePath) {
    new WebUi();
}
export default function startAdapter(options) {
    return new WebUi(options);
}

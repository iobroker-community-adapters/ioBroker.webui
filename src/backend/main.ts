import utils from '@iobroker/adapter-core';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Uploadhelper } from './UploadHelper.js';

const __dirname = path.normalize(path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url)).toString());
const adapterName = pkg.name.split('.').pop();

class WebUi extends utils.Adapter {

    _unloaded: boolean;

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options?) {
        super({
            ...options,
            name: adapterName,
        });
        this.on('ready', this.main.bind(this));
        this.on('stateChange', this.stateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        // this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async runUpload() {
        await Uploadhelper.upload(this, __dirname + '/www/widgets', 'widgets');
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

    npmRunning = false;
    installNpm(name) {
        return new Promise(async resolve => {
            if (this.npmRunning) {
                this.log.info(`NPM already running`);
                resolve(null);
            }
            this.npmRunning = true;
            this.log.info(`Install NPM package (${name}), check dirs...`);
            if (!fs.existsSync(__dirname + '/www/widgets'))
                await fs.promises.mkdir(__dirname + '/www/widgets')
            if (!fs.existsSync(__dirname + '/www/widgets/package.json'))
                await fs.promises.writeFile(__dirname + '/www/widgets/package.json', '{}');
            this.log.info(`Install NPM package (${name})...`);
            const child = spawn('npm', ['install', '--omit=dev', name], { cwd: __dirname + '/www/widgets' });
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
        return new Promise(resolve => {
            if (this.npmRunning) {
                this.log.info(`NPM already running`);
                resolve(null);
            }
            this.npmRunning = true;
            this.log.info(`Install NPM package (${name})...`);
            const child = spawn('npm', ['remove', name], { cwd: __dirname + '/www/widgets' });
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

    states = {}

    async stateChange(id, state) {
        this.log.info(`stateChange: ${id}, value: ${state.val}, ack: ${state.ack}`);
        if (!id || !state) return;

        if (state.ack) {
            return;
        }

        this.states[id] = state.val;
        if (id === 'webui.0.control.command')
            await this.runCommand(this.states["webui.0.control.command"], this.states["webui.0.control.data"])
        await this.setStateAsync(id, state, true);
    }

    async runCommand(command, parameter) {
        this.log.info(`runCommand: ${command}, parameter: ${parameter}`);

        switch (command) {
            case 'addNpm':
                await this.installNpm(parameter);
                await this.refreshWWW();
                break;
            case 'updateNpm':
                await this.installNpm(parameter);
                await this.refreshWWW();
                break;
            case 'removeNpm':
                await this.removeNpm(parameter);
                await this.refreshWWW();
                break;
            case 'refreshWww':
                await this.refreshWWW();
                break;
        }
    }

    async createObjects() {

        let obj = await this.getObjectAsync('control.data');
        if (obj)
            await this.delObjectAsync('control.data');
        obj = await this.getObjectAsync('control.clientId');
        if (obj)
            await this.delObjectAsync('control.clientId');
        obj = await this.getObjectAsync('control.command');
        if (obj)
            await this.delObjectAsync('control.command');

        obj = await this.getForeignObjectAsync(`system.adapter.${adapterName}.upload`);
        if (obj)
            await this.delObjectAsync(`system.adapter.${adapterName}.upload`);

        await this.setObjectAsync('control.data',
            {
                type: 'state',
                common: {
                    name: 'data for command for webui',
                    type: 'string',
                    desc: 'additional data when running the command, needs to be set before setting the command.',
                    read: true,
                    write: true,
                    role: 'text'
                },
                native: {}
            });
        await this.setObjectAsync('control.clientIds',
            {
                type: 'state',
                common: {
                    name: 'clientIds for command for webui',
                    type: 'string',
                    desc: 'clientIds when running the command, needs to be set before setting the command. splitted by ;',
                    read: true,
                    write: true,
                    role: 'text'
                },
                native: {}
            });
        await this.setObjectAsync('control.command',
            {
                type: 'state',
                common: {
                    name: 'command for webui',
                    type: 'string',
                    desc: 'Writing this variable akt as the trigger. Instance and data must be preset before \'command\' will be written.',
                    states: {
                        addNpm: 'addNpm',
                        removeNpm: 'removeNpm',
                        updateNpm: 'updateNpm',
                        refreshWww: 'refreshWww',
                        uiReloadPackages: 'uiReloadPackages',

                        uiReload: 'uiReload',
                        uiChangeView: 'uiChangeView',
                        uiChangedView: 'uiChangedView',
                        uiOpenDialog: 'uiOpenDialog',
                        uiOpenedDialog: 'uiOpenedDialog',
                        uiPlaySound: 'uiPlaySound',
                    },
                    read: true,
                    write: true,
                    role: 'text'
                },
                native: {}
            });

        await this.setForeignObjectAsync(`system.adapter.${adapterName}.upload`, {
            //@ts-ignore
            type: 'state',
            common: {
                name: `${adapterName}.upload`,
                type: 'number',
                role: 'indicator.state',
                //@ts-ignore
                unit: '%',
                min: 0,
                max: 100,
                def: 0,
                desc: 'Upload process indicator',
                read: true,
                write: false,
            },
            native: {},
        });
    }

    async main() {
        this.log.info(`dirName: ` + __dirname);
        if (!fs.existsSync(__dirname + '/www/widgets/package.json')) {
            this.log.info(`No package.json for widgets found, look if one was uploaded.`);
            if (await this.fileExistsAsync(adapterName, 'widgets/package.json')) {
                this.log.info(`adapter was updated, restore packages.json`);
                if (!fs.existsSync(__dirname + '/www/widgets'))
                    await fs.promises.mkdir(__dirname + '/www/widgets')
                let data = await this.readFileAsync(adapterName, 'widgets/package.json')
                await fs.promises.writeFile(__dirname + '/www/widgets/package.json', data.file);
                this.log.info(`run NPM install`);
                await this.installNpm('');
            }
        }
        this.log.info(`create adapter objects`);
        await this.createObjects();
        this.log.info(`subscribe adapter states`);
        await this.subscribeStatesAsync('*', {});
        this.log.info(`adapter ready`);
    }

    onUnload() {
        this._unloaded = true;
    }
}

new WebUi();
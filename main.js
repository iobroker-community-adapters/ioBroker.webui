/**
 *
 *      iobroker vis Adapter
 *
 *      Copyright (c) 2014-2021, bluefox
 *      Copyright (c) 2014, hobbyquaker
 *
 *      CC-NC-BY 4.0 License
 *
 */
/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */

import utils from '@iobroker/adapter-core';
import webuiWidgetSync from './lib/webuiWidgetSync.js';

import fs from 'fs';
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)).toString());
const adapterName = pkg.name.split('.').pop();

const adapter = new utils.Adapter(adapterName);

adapter.on('ready', () => main());

function upload() {
    return new Promise(resolve => {
        adapter.log.info(`Upload ${adapter.name} anew, while changes detected...`);
        const file = utils.controllerDir + '/iobroker.js';
        const child = require('child_process').spawn('node', [file, 'upload', adapter.name, 'widgets']);
        let count = 0;
        child.stdout.on('data', data => {
            count++;
            adapter.log.debug(data.toString().replace('\n', ''));
            !(count % 100) && adapter.log.info(count + ' files uploaded...');
        });

        child.stderr.on('data', data =>
            adapter.log.error(data.toString().replace('\n', '')));

        child.on('exit', exitCode => {
            adapter.log.info(`Uploaded. ${exitCode ? 'Exit - ' + exitCode : 0}`);
            resolve(exitCode);
        });
    });
}

async function updateWebuiConfig() {
    let changed = !!webuiWidgetSync(false);

    // create command variable
    /*const obj = await adapter.getObjectAsync('control.command');
    if (!obj) {
        await adapter.setObjectAsync('control.command',
            {
                type: 'state',
                common: {
                    name: 'Command for webui',
                    type: 'string',
                    desc: 'Writing this variable akt as the trigger. Instance and data must be preset before \'command\' will be written. \'changedView\' will be signalled too',
                    states: {
                        changeView: 'changeView',
                        refresh: 'refresh',
                        reload: 'reload',
                        changedView: 'changedView'
                    }
                },
                native: {}
            });
    }*/

    return changed;
}

async function main() {
    const filesChanged = await updateWebuiConfig();
    if (filesChanged) {
        await upload();
    }
    adapter.stop();
}
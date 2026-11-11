import { getWebComponentSources, loadWebComponents } from '@iobroker/web-components';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { findComponent } from './WebComponentHost.js';
let loading = null;
/** Base URL that `../adapter/<name>/` is resolved against: the webui folder of the web server */
function getBaseUrl() {
    return window.iobrokerWebuiRootUrl || document.baseURI;
}
/**
 * The web components of all installed adapters (`common.webComponents`), read once per page.
 * Only the manifests are read; a module is imported when its element is shown.
 */
export function loadInstalledWebComponents() {
    loading ??= (async () => {
        await iobrokerHandler.waitForReady();
        const instances = await iobrokerHandler.connection.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.香');
        const sources = getWebComponentSources(Object.values(instances ?? {}), getBaseUrl());
        return sources.length ? await loadWebComponents(sources) : [];
    })().catch(err => {
        console.warn('Could not read the ioBroker web components', err);
        loading = null;
        return [];
    });
    return loading;
}
/** Like `loadInstalledWebComponents`, but gives up waiting after `timeout` ms (the loading goes on) */
export function loadInstalledWebComponentsWithin(timeout) {
    return Promise.race([
        loadInstalledWebComponents(),
        new Promise(resolve => setTimeout(() => resolve([]), timeout)),
    ]);
}
export async function findInstalledWebComponent(adapter, tag) {
    return findComponent(await loadInstalledWebComponents(), adapter, tag);
}
/** The language for names and labels of the manifests */
export function getWebComponentLanguage() {
    return (iobrokerHandler.language || iobrokerHandler.connection?.systemLang || 'en');
}

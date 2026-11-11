import { getWebComponentSources, loadWebComponents, type LoadedWebComponent } from '@iobroker/web-components';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { findComponent } from './WebComponentHost.js';

let loading: Promise<LoadedWebComponent[]> | null = null;

/** Base URL that `../adapter/<name>/` is resolved against: the webui folder of the web server */
function getBaseUrl(): string {
    return window.iobrokerWebuiRootUrl || document.baseURI;
}

/**
 * The web components of all installed adapters (`common.webComponents`), read once per page.
 * Only the manifests are read; a module is imported when its element is shown.
 */
export function loadInstalledWebComponents(): Promise<LoadedWebComponent[]> {
    loading ??= (async () => {
        await iobrokerHandler.waitForReady();
        const instances = await iobrokerHandler.connection.getObjectViewSystem('instance', 'system.adapter.', 'system.adapter.\u9999');
        const sources = getWebComponentSources(Object.values(instances ?? {}) as any[], getBaseUrl());
        return sources.length ? await loadWebComponents(sources) : [];
    })().catch(err => {
        console.warn('Could not read the ioBroker web components', err);
        loading = null;
        return [];
    });
    return loading;
}

/** Like `loadInstalledWebComponents`, but gives up waiting after `timeout` ms (the loading goes on) */
export function loadInstalledWebComponentsWithin(timeout: number): Promise<LoadedWebComponent[]> {
    return Promise.race([
        loadInstalledWebComponents(),
        new Promise<LoadedWebComponent[]>(resolve => setTimeout(() => resolve([]), timeout)),
    ]);
}

export async function findInstalledWebComponent(adapter: string | null, tag: string | null): Promise<LoadedWebComponent | undefined> {
    return findComponent(await loadInstalledWebComponents(), adapter, tag);
}

/** The language for names and labels of the manifests */
export function getWebComponentLanguage(): ioBroker.Languages {
    return <ioBroker.Languages>(iobrokerHandler.language || iobrokerHandler.connection?.systemLang || 'en');
}

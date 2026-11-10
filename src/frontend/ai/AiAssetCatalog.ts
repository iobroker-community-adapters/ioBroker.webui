import type { Connection } from '@iobroker/socket-client';
import { pageItems, textChunk } from './AiDocumentEditing.js';

export type AssetKind = 'image' | 'icon' | 'chart';
export interface AssetRequest { kind: AssetKind; namespace?: string; path?: string; query?: string; offset?: number; limit?: number; }
const imageFile = /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i;
export function assetPath(value = '') {
    if (typeof value !== 'string' || value.startsWith('/') || value.includes('\\') || /[\x00-\x1f]/.test(value) || value.split('/').some(part => part === '.' || part === '..' || (!part && value !== ''))) throw new Error('Use a relative asset path without empty, . or .. segments.');
    return value;
}
function cleanChart(value: unknown, depth = 0): unknown {
    if (depth > 16) return '[depth limit]';
    if (Array.isArray(value)) return value.slice(0, 1000).map(item => cleanChart(item, depth + 1));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/password|passwd|token|secret|credential|authorization|cookie|api.?key/i.test(key)).map(([key, item]) => [key, cleanChart(item, depth + 1)]));
    if (typeof value === 'string') return value.slice(0, 5000);
    return value;
}
function safeQuery(value: string) {
    const params = new URLSearchParams(value);
    for (const key of [...params.keys()]) if (/password|passwd|token|secret|credential|auth|api.?key/i.test(key)) params.delete(key);
    return params.toString();
}

/** Directories are enumerated one level at a time; only requested files are read. */
export class AiAssetCatalog {
    constructor(private readonly socket: Connection, private readonly filesNamespace: string, private readonly rootUrl: string) { }
    private url(namespace: string, path: string) { return this.rootUrl.replace(/\/$/, '') + '/' + encodeURIComponent(namespace) + '/' + path.split('/').map(encodeURIComponent).join('/'); }
    private async iconLibraries() {
        const adapters = await this.socket.getObjectViewSystem('adapter');
        return [...new Set(Object.values(adapters).filter(object => object.common?.type === 'visualization-icons' || (typeof object.common?.name === 'string' && object.common.name.startsWith('icons-')))
            .map(object => typeof object.common.name === 'string' ? object.common.name : object._id.replace(/^system\.adapter\./, '').split('.')[0]).filter(name => /^[a-z][a-z0-9-]*$/.test(name)))].sort();
    }
    private async fileLocation(request: AssetRequest) {
        const path = assetPath(request.path);
        if (request.kind === 'image') {
            if (request.namespace && request.namespace !== this.filesNamespace) throw new Error('Images must come from this webui image library.');
            return { namespace: this.filesNamespace, path: 'config/images' + (path ? '/' + path : '') };
        }
        if (request.kind !== 'icon' || !(await this.iconLibraries()).includes(request.namespace)) throw new Error('Choose an installed icon library returned by list_assets.');
        return { namespace: request.namespace, path };
    }
    private async charts(provider?: string) {
        if (provider && !['flot', 'echarts'].includes(provider)) throw new Error('Chart namespace must be flot or echarts.');
        const providers = provider ? [provider] : ['flot', 'echarts'];
        const results = await Promise.allSettled(providers.map(async namespace => {
            const objects = await this.socket.getObjectViewCustom('chart', 'chart', namespace + '.', namespace + '.\u9999');
            return Object.values(objects).map(object => ({ kind: 'chart', namespace, path: object._id, name: object.common?.name ?? object._id,
                url: namespace === 'echarts' ? this.rootUrl + 'echarts/index.html?preset=' + encodeURIComponent(object._id) : this.rootUrl + 'flot/index.html?' + safeQuery(String(object.native?.url ?? '')) }));
        }));
        return { items: results.flatMap(result => result.status === 'fulfilled' ? result.value : []), warnings: results.flatMap((result, i) => result.status === 'rejected' ? [`${providers[i]} chart view unavailable: ${String(result.reason)}`] : []) };
    }
    async list(request: AssetRequest) {
        let items: unknown[]; let warnings: string[] = [];
        if (request.kind === 'chart') { const result = await this.charts(request.namespace); items = result.items; warnings = result.warnings; }
        else if (request.kind === 'icon' && !request.namespace) items = (await this.iconLibraries()).map(namespace => ({ kind: 'icon', namespace, path: '', name: namespace, directory: true }));
        else {
            const location = await this.fileLocation(request);
            const files = await this.socket.readDir(location.namespace, location.path);
            items = files.filter(file => file.isDir || imageFile.test(file.file)).map(file => {
                const path = [request.path, file.file].filter(Boolean).join('/');
                return { kind: request.kind, namespace: location.namespace, path, name: file.file, directory: !!file.isDir, size: file.stats?.size,
                    url: file.isDir ? undefined : this.url(location.namespace, request.kind === 'image' ? 'config/images/' + path : path) };
            });
        }
        const words = (request.query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        items = items.filter(item => words.every(word => JSON.stringify(item).toLowerCase().includes(word))).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        return { ...pageItems(items, request.offset, request.limit), warnings };
    }
    async read(request: AssetRequest, includeBinary = true) {
        if (request.kind === 'chart') {
            const charts = await this.charts(request.namespace);
            const item = charts.items.find(item => item.path === request.path);
            if (!item) throw new Error('Choose a chart preset returned by list_assets.');
            const object = await this.socket.getObject(item.path);
            const config = cleanChart(Object.fromEntries(['data', 'config', 'marks', 'lines', 'url'].filter(key => key in (object?.native ?? {})).map(key => [key, key === 'url' ? safeQuery(String(object.native[key])) : object.native[key]])));
            return { ...item, imagePreviewAvailable: false, message: 'Saved chart configuration and embed URL; no raster chart renderer is exposed.', ...textChunk(JSON.stringify(config, null, 2), request.offset, request.limit) };
        }
        const location = await this.fileLocation(request);
        if (!imageFile.test(location.path)) throw new Error('Choose an image/icon file, not a directory.');
        if (!includeBinary) {
            const segments = location.path.split('/'), name = segments.pop();
            const files = await this.socket.readDir(location.namespace, segments.join('/'));
            const file = files.find(file => !file.isDir && file.file === name);
            if (!file) throw new Error('Image/icon file not found.');
            return { kind: request.kind, namespace: location.namespace, path: request.path, url: this.url(location.namespace, location.path), size: file.stats?.size };
        }
        const result = await this.socket.readFile(location.namespace, location.path, true);
        if (result.file.length > 14_000_000) throw new Error('Asset exceeds the 10 MB read limit. Choose a smaller asset.');
        return { kind: request.kind, namespace: location.namespace, path: request.path, url: this.url(location.namespace, location.path), mimeType: result.mimeType, size: Math.floor(result.file.length * 0.75), base64: result.file };
    }
}

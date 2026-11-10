interface PackageRegistration {
    widgets(module: any): void;
    addons(module: any): Promise<void>;
}
/** Refresh generated module glue without reloading the page or open documents. */
export async function loadInstalledPackages(root: string, registration: PackageRegistration, load: (url: string) => Promise<any> = url => importShim(url)) {
    const base = root.endsWith('/') ? root : root + '/';
    const revision = Date.now().toString() + '-' + Math.random().toString(36).slice(2);
    await load(base + 'importmap.js?ai=' + revision);
    registration.widgets(await load(base + 'configWidgets.js?ai=' + revision));
    await load(base + 'importWidgetFiles.js?ai=' + revision);
    await registration.addons(await load(base + 'designerAddons.js?ai=' + revision));
}

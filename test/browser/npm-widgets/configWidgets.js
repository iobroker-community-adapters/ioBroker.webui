import { WebcomponentManifestElementsService } from '@node-projects/web-component-designer';
export function registerNpmWidgets(container, registered = []) {
    if (registered.includes('vanilla-colorful')) return;
    const manifest = { schemaVersion: '1.0.0', modules: [{ path: 'importWidgetFiles.js', declarations: [{ name: 'FixturePicker', tagName: 'hex-color-picker', description: 'Test-only package activation fixture' }], exports: [{ kind: 'custom-element-definition', name: 'hex-color-picker', declaration: { name: 'FixturePicker' } }] }] };
    container.register('elementsService', new WebcomponentManifestElementsService('vanilla-colorful', '/test/browser/npm-widgets/', manifest));
}

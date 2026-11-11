import type { IElementDefinition, IElementsService } from '@node-projects/web-component-designer';
import { getElementDefinition } from '../webcomponents/WebComponentHost.js';
import { getWebComponentLanguage, loadInstalledWebComponentsWithin } from '../webcomponents/WebComponentRegistry.js';

/**
 * Palette entries for the web components of the installed adapters (`common.webComponents`).
 * Components that edit a value (`editsValue`) are left out: webui does not store such values.
 */
export class IobrokerWebuiWebComponentsElementsService implements IElementsService {
    readonly name = 'ioBroker web components';

    async getElements(): Promise<IElementDefinition[]> {
        // the palette loads its groups one by one: never let a slow server hold the others up
        const components = await loadInstalledWebComponentsWithin(15000);
        const lang = getWebComponentLanguage();
        return components
            .filter(component => !component.manifest.editsValue)
            .map(component => <IElementDefinition>getElementDefinition(component, lang));
    }
}

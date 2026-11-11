import { BaseCustomWebComponentConstructorAppend, css, html, type Disposable } from '@node-projects/base-custom-webcomponent';
import { dragDropFormatNameElementDefinition, NamedTools, type IElementDefinition, type IElementsService, type ServiceContainer } from '@node-projects/web-component-designer';

/** A visual palette backed by the same definitions used by the project tree. */
export class IobrokerWebuiComponentCatalog extends BaseCustomWebComponentConstructorAppend {
    static override template = html`
        <input id="filter" type="search" placeholder="Filter catalog" aria-label="Filter catalog">
        <div id="groups"></div>
        <p id="status" role="status"></p>`;

    static override style = css`
        :host { display: flex; flex-direction: column; height: 100%; min-height: 0;
            color: var(--webui-text, #354348); background: var(--webui-surface, #fff); font: 13px sans-serif; }
        * { box-sizing: border-box; }
        #filter { margin: 8px; padding: 7px; min-width: 0; flex: none;
            color: inherit; background: var(--webui-subtle, #f3f6f6); border: 1px solid var(--webui-border, #ccd5d5); border-radius: 4px; font: inherit; }
        #groups { overflow: auto; flex: 1; min-height: 0; padding: 0 8px 8px; }
        h2 { font-size: 13px; margin: 14px 4px 8px; color: var(--webui-muted, #607187); }
        .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
        button { min-width: 0; padding: 8px 5px; border: 1px solid var(--webui-border, #ccd5d5); border-radius: 8px;
            color: inherit; background: var(--webui-subtle, #eaf0f5); font: inherit; cursor: pointer; }
        button:hover { background: var(--webui-hover, #e0e9f0); }
        button:focus-visible, button[aria-pressed="true"] { outline: 2px solid var(--webui-accent, #47977c); outline-offset: -2px; }
        .preview { height: 64px; display: flex; justify-content: center; align-items: center; overflow: hidden; margin-bottom: 6px; pointer-events: none; }
        .preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .sample { max-width: 100%; max-height: 58px; overflow: hidden; color: #354348; background: white; color-scheme: light; }
        .fallback { font: 12px monospace; padding: 8px; border: 1px dashed currentColor; overflow-wrap: anywhere; }
        .label { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        #status { margin: 8px; }
        [hidden] { display: none !important; }
    `;

    private services = new Map<IElementsService, { section: HTMLElement; subscription?: Disposable; generation: number }>();
    private serviceContainer: ServiceContainer;
    private selected: HTMLButtonElement;
    private loading = 0;

    constructor() {
        super();
        this._getDomElement<HTMLInputElement>('filter').oninput = () => this.filter();
    }

    /** Reconcile newly installed packages without replacing existing tiles or filter text. */
    refresh(serviceContainer: ServiceContainer) {
        this.serviceContainer = serviceContainer;
        for (const service of serviceContainer.elementsServices) {
            if (this.services.has(service)) continue;
            const section = document.createElement('section');
            const heading = document.createElement('h2');
            heading.textContent = service.name;
            section.append(heading);
            this._getDomElement('groups').append(section);
            const entry = { section, generation: 0, subscription: service.onElementsChanged?.on(() => void this.load(service)) };
            this.services.set(service, entry);
            void this.load(service);
        }
    }

    private async load(service: IElementsService) {
        const entry = this.services.get(service);
        const generation = ++entry.generation;
        this.loading++;
        this.filter();
        try {
            const definitions = await service.getElements();
            if (generation !== entry.generation) return;
            entry.section.querySelector('.tiles')?.remove();
            const tiles = document.createElement('div');
            tiles.className = 'tiles';
            for (const definition of definitions) tiles.append(this.createTile(definition, service.name));
            entry.section.append(tiles);
        } catch (error) {
            console.warn('Could not load catalog group', service.name, error);
        } finally {
            this.loading--;
            this.filter();
        }
    }

    private createTile(definition: IElementDefinition, group: string) {
        const button = document.createElement('button');
        button.type = 'button';
        const name = definition.name ?? definition.tag;
        button.title = [name, definition.tag, definition.description].filter(Boolean).join('\n');
        button.dataset.search = [name, definition.tag, definition.description, group].join(' ').toLocaleLowerCase();
        button.setAttribute('aria-pressed', 'false');
        const preview = document.createElement('div');
        preview.className = 'preview';
        preview.setAttribute('aria-hidden', 'true');
        // Preview markup and icons are supplied by the installed designer element services.
        if (definition.displayHtml) {
            preview.innerHTML = definition.displayHtml;
        } else if (definition.icon) {
            const image = document.createElement('img');
            image.src = definition.icon;
            image.alt = '';
            preview.append(image);
        } else if (['span', 'input', 'button', 'select', 'textarea', 'meter', 'progress', 'div'].includes(definition.tag)) {
            const sample = document.createElement(definition.tag);
            for (const [key, value] of Object.entries(definition.defaultAttributes ?? {})) sample.setAttribute(key, value);
            sample.innerHTML = definition.defaultContent ?? '';
            Object.assign(sample.style, definition.defaultStyles ?? {});
            sample.classList.add('sample');
            if (definition.tag === 'div') { sample.style.width = '64px'; sample.style.height = '48px'; sample.style.border = '1px solid #687778'; }
            if (!sample.textContent && ['span', 'button'].includes(definition.tag)) sample.textContent = name;
            preview.append(sample);
        } else {
            const fallback = document.createElement('span');
            fallback.className = 'fallback';
            fallback.textContent = `<${definition.tag}>`;
            preview.append(fallback);
        }
        // Previews cannot receive focus or interact with runtime services via user input.
        preview.inert = true;
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = name;
        button.append(preview, label);
        button.onclick = () => {
            this.selected?.setAttribute('aria-pressed', 'false');
            this.selected = button;
            button.setAttribute('aria-pressed', 'true');
            let tool = this.serviceContainer.designerTools.get(definition.tool ?? NamedTools.DrawElementTool);
            if (typeof tool === 'function') tool = new tool(definition);
            this.serviceContainer.globalContext.tool = tool;
        };
        button.draggable = true;
        button.ondragstart = event => {
            event.dataTransfer.effectAllowed = 'copy';
            event.dataTransfer.setData(dragDropFormatNameElementDefinition, JSON.stringify(definition));
        };
        return button;
    }

    private filter() {
        const query = this._getDomElement<HTMLInputElement>('filter').value.trim().toLocaleLowerCase();
        let visible = 0;
        for (const { section } of this.services.values()) {
            let matches = 0;
            for (const button of section.querySelectorAll<HTMLButtonElement>('button[data-search]')) {
                button.hidden = !button.dataset.search.includes(query);
                if (!button.hidden) matches++;
            }
            section.hidden = !matches;
            visible += matches;
        }
        const status = this._getDomElement<HTMLElement>('status');
        status.textContent = this.loading ? 'Loading components…' : visible ? '' : 'No matching components';
        status.hidden = !status.textContent;
    }
}

customElements.define('iobroker-webui-component-catalog', IobrokerWebuiComponentCatalog);

import { importWebComponent, isSameTheme, NAVIGATE_EVENT, toWebComponentTheme, type LoadedWebComponent, type WebComponentElement, type WebComponentSettings, type WebComponentTheme } from '@iobroker/web-components';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { Runtime } from '../common/Runtime.js';
import { isInsideDesignerCanvas, readSettings, sameSettings, settingAttributePrefix, webComponentHostTag } from '../webcomponents/WebComponentHost.js';
import { findInstalledWebComponent } from '../webcomponents/WebComponentRegistry.js';

// A <style> element instead of an adopted sheet: the element may be adopted into a detached designer window.
const template = `<style>
:host { display: block; position: relative; }
#component { display: block; width: 100%; height: 100%; }
#message { box-sizing: border-box; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 4px; overflow: hidden; font: 12px sans-serif; color: #888; text-align: center; }
#message.edit { border: 1px dashed #aaa; }
#message[hidden] { display: none; }
</style><div id="message" hidden></div>`;

/** Theme fields a screen can set with CSS custom properties on or above the element */
const themeVariables: [field: keyof WebComponentTheme, variable: string][] = [
    ['primary', '--iob-primary'],
    ['primaryContrast', '--iob-primary-contrast'],
    ['secondary', '--iob-secondary'],
    ['secondaryContrast', '--iob-secondary-contrast'],
    ['background', '--iob-background'],
    ['paper', '--iob-paper'],
    ['text', '--iob-text'],
    ['textSecondary', '--iob-text-secondary'],
    ['divider', '--iob-divider'],
    ['error', '--iob-error'],
    ['warning', '--iob-warning'],
    ['info', '--iob-info'],
    ['success', '--iob-success'],
    ['fontFamily', '--iob-font-family'],
    ['fontSize', '--iob-font-size'],
    ['borderRadius', '--iob-border-radius'],
];

let screenNames: Set<string> | null = null;
let screenNamesLoading: Promise<void> | null = null;

function loadScreenNames() {
    screenNamesLoading ??= iobrokerHandler.getAllNames('screen')
        .then(names => { screenNames = new Set(names); })
        .catch(() => { screenNamesLoading = null; });
}

/**
 * Shows an ioBroker web component (`common.webComponents` of an adapter) in a screen:
 *
 * ```html
 * <iobroker-webui-web-component adapter="flow" component="flow-diagram" setting-oid="flow.0.diagrams.main" theme="dark">
 * ```
 *
 * Every setting of the manifest is an attribute `setting-<dash-case name>`; the element gets them as one typed
 * `settings` object. `theme` is `light` (default), `dark` or `auto` (follows the browser); `--iob-*` CSS custom
 * properties override single colors. In the designer canvas the component gets `editMode`.
 */
export class IobrokerWebuiWebComponent extends HTMLElement {
    #root: ShadowRoot;
    #message: HTMLDivElement;
    #inner: WebComponentElement | null = null;
    #component: LoadedWebComponent | null = null;
    #loadedKey: string | null = null;
    #failed = false;
    #loadToken = 0;
    #settings: WebComponentSettings | null = null;
    #theme: WebComponentTheme | null = null;
    #editMode = false;
    #observer = new MutationObserver(records => this.#attributesChanged(records));
    #colorScheme: MediaQueryList | null = null;
    #colorSchemeListener = () => this.#applyTheme();

    #onNavigate = (event: Event) => {
        const view = (<CustomEvent>event).detail?.view;
        // like every host: show the screen of that name if there is one, else leave the event alone
        if (this.#editMode || typeof view !== 'string' || !screenNames?.has(view))
            return;
        event.preventDefault();
        Runtime.openScreen(<any>{ screen: view });
    };

    constructor() {
        super();
        this.#root = this.attachShadow({ mode: 'open' });
        this.#root.innerHTML = template;
        this.#message = this.#root.querySelector('#message');
        this.addEventListener(NAVIGATE_EVENT, this.#onNavigate);
    }

    connectedCallback() {
        this.#observer.observe(this, { attributes: true });
        this.#editMode = isInsideDesignerCanvas(this);
        if (!this.#editMode)
            loadScreenNames();
        if (this.#key() !== this.#loadedKey || this.#failed)
            void this.#load();
        else
            this.#applyProperties();
    }

    disconnectedCallback() {
        this.#observer.disconnect();
        this.#colorScheme?.removeEventListener('change', this.#colorSchemeListener);
        this.#colorScheme = null;
    }

    #key() {
        return (this.getAttribute('adapter') ?? '') + '|' + (this.getAttribute('component') ?? '');
    }

    #attributesChanged(records: MutationRecord[]) {
        if (this.#key() !== this.#loadedKey) {
            void this.#load();
            return;
        }
        if (records.some(r => r.attributeName === 'theme'))
            this.#applyTheme();
        if (records.some(r => r.attributeName?.startsWith(settingAttributePrefix)))
            this.#applySettings();
    }

    async #load() {
        const token = ++this.#loadToken;
        const adapter = this.getAttribute('adapter');
        const tag = this.getAttribute('component');
        this.#loadedKey = this.#key();
        this.#failed = false;
        this.#inner?.remove();
        this.#inner = null;
        this.#component = null;
        this.#settings = null;
        this.#theme = null;
        if (!tag) {
            this.#showMessage(this.#editMode ? 'No web component selected' : '');
            return;
        }
        this.#showMessage('');
        try {
            const component = await findInstalledWebComponent(adapter, tag);
            if (token !== this.#loadToken)
                return;
            if (!component) {
                this.#showMessage(`<${tag}>${adapter ? ' of ' + adapter : ''} is not installed`);
                return;
            }
            await importWebComponent(component);
            if (token !== this.#loadToken)
                return;
            // The registry of the window that runs webui defines the element, also for a detached designer window.
            const inner = <WebComponentElement>document.createElement(tag);
            inner.id = 'component';
            this.#component = component;
            this.#inner = inner;
            this.#applyProperties();
            this.#root.appendChild(inner);
        } catch (err) {
            if (token !== this.#loadToken)
                return;
            this.#failed = true;
            console.warn(`Could not show the web component <${tag}>`, err);
            this.#showMessage(`<${tag}> could not be loaded`);
        }
    }

    #showMessage(text: string) {
        this.#message.textContent = text;
        this.#message.hidden = !text;
        this.#message.classList.toggle('edit', this.#editMode);
    }

    #applyProperties() {
        const inner = this.#inner;
        if (!inner)
            return;
        if (inner.editMode !== this.#editMode)
            inner.editMode = this.#editMode;
        if (inner.socket !== <any>iobrokerHandler.connection)
            inner.socket = <any>iobrokerHandler.connection;
        this.#applyTheme();
        this.#applySettings();
    }

    #applySettings() {
        if (!this.#inner || !this.#component)
            return;
        const settings = readSettings(this.#component.manifest, name => this.getAttribute(name));
        if (!sameSettings(settings, this.#settings)) {
            this.#settings = settings;
            this.#inner.settings = settings;
        }
    }

    #applyTheme() {
        if (!this.#inner)
            return;
        const mode = this.getAttribute('theme');
        if (mode === 'auto' && this.isConnected) {
            if (!this.#colorScheme) {
                this.#colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
                this.#colorScheme.addEventListener('change', this.#colorSchemeListener);
            }
        } else if (this.#colorScheme) {
            this.#colorScheme.removeEventListener('change', this.#colorSchemeListener);
            this.#colorScheme = null;
        }
        const dark = mode === 'dark' || (mode === 'auto' && !!this.#colorScheme?.matches);
        const theme = this.#readTheme(dark ? 'dark' : 'light');
        if (!this.#theme || !isSameTheme(this.#theme, theme)) {
            this.#theme = theme;
            this.#inner.theme = theme;
        }
    }

    #readTheme(type: 'light' | 'dark'): WebComponentTheme {
        const values: Record<string, string | number> = { type };
        const style = (this.ownerDocument.defaultView ?? window).getComputedStyle(this);
        for (const [field, variable] of themeVariables) {
            const value = style.getPropertyValue(variable).trim();
            if (value)
                values[field] = field === 'fontSize' || field === 'borderRadius' ? parseFloat(value) : value;
        }
        return toWebComponentTheme(values);
    }
}

if (!customElements.get(webComponentHostTag))
    customElements.define(webComponentHostTag, IobrokerWebuiWebComponent);

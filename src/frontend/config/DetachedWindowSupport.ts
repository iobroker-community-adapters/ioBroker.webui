import { DesignItem, NodeType, type IUiCommand, type IUiCommandHandler } from '@node-projects/web-component-designer';
import { SplitterDockContainer, type DockManager, type DockNode, type PanelContainer } from 'dock-spawn-ts';
import type { NewWindowParams } from 'dock-spawn-ts/lib/js/BrowserDialogHelper.js';

// Designer 1.1.8 compares nodes with their *new* window's constructors after adoption.
// Adopted nodes retain their original prototypes; DOM nodeType is realm-independent.
Object.defineProperty(DesignItem.prototype, 'nodeType', {
    configurable: true,
    get() { return this.node.nodeType === 8 ? NodeType.Comment : this.node.nodeType === 3 ? NodeType.TextNode : NodeType.Element; }
});

/** The live panel stays owned by the opener; a browser-window move is not disposal. */
export class DetachedWindowSupport {
    readonly panels = new Map<PanelContainer, Window>();
    private readonly observers = new Map<Window, MutationObserver>();
    private targetId = 0;
    private readonly roots = new WeakMap<ShadowRoot, CSSStyleSheet[]>();
    constructor(private readonly manager: DockManager, private readonly dock: HTMLElement, private readonly resolveCommands: (element: HTMLElement) => Partial<IUiCommandHandler> = element => element as HTMLElement & Partial<IUiCommandHandler>, private readonly returned?: (element: HTMLElement) => void) {
        manager.prepareElementForNewWindow = (element, params, win) => this.prepare(element, params, win);
    }
    focus(panel: PanelContainer): boolean {
        const win = this.panels.get(panel);
        if (!win || win.closed) return false;
        win.focus(); this.manager.activePanel = panel;
        return true;
    }
    private visit(element: Element, callback: (element: Element) => void) {
        callback(element);
        for (const child of element.children) this.visit(child, callback);
        if (element.shadowRoot) for (const child of element.shadowRoot.children) this.visit(child, callback);
    }
    private remember(element: Element) {
        this.visit(element, node => {
            if (node.shadowRoot?.adoptedStyleSheets.length) this.roots.set(node.shadowRoot, [...node.shadowRoot.adoptedStyleSheets]);
        });
    }
    private restore(element: Element) {
        this.visit(element, node => {
            const root = node.shadowRoot;
            if (!root) return;
            const descriptor = Object.getOwnPropertyDescriptor(ShadowRoot.prototype, 'adoptedStyleSheets');
            if (!Object.hasOwn(root, 'adoptedStyleSheets')) {
                // Constructable stylesheets belong to a document. Keep future style updates portable too.
                Object.defineProperty(root, 'adoptedStyleSheets', {
                    configurable: true,
                    get: () => descriptor.get.call(root),
                    set: (sheets: CSSStyleSheet[]) => {
                        this.roots.set(root, [...sheets]);
                        const view = root.ownerDocument.defaultView as Window & typeof globalThis;
                        const copies = sheets.map(sheet => {
                            const copy = new view.CSSStyleSheet();
                            copy.replaceSync([...sheet.cssRules].map(rule => rule.cssText).join('\n'));
                            return copy;
                        });
                        descriptor.set.call(root, copies);
                    }
                });
            }
            const observer = this.observers.get(root.ownerDocument.defaultView);
            observer?.observe(root, { childList: true, subtree: true });
            const styles = this.roots.get(root) ?? (node.constructor as typeof HTMLElement & { style?: CSSStyleSheet | CSSStyleSheet[] }).style;
            if (styles && (Array.isArray(styles) || (typeof styles === 'object' && 'cssRules' in styles))) root.adoptedStyleSheets = Array.isArray(styles) ? styles : [styles];
        });
    }
    private returnAnchor(element: HTMLElement) {
        const node = this.manager.getNodeByElement(element), parent = node?.parent;
        if (!parent) return null;
        const firstPanel = (node: DockNode): PanelContainer => {
            const panel = this.manager.getPanels().find(panel => panel === node.container);
            return panel ?? node.children.map(firstPanel).find(Boolean);
        };
        const sibling = parent.children.find(child => child !== node && firstPanel(child));
        const target = sibling && firstPanel(sibling)?.resolvedElementContent;
        if (!target) return null;
        if (!target.id) target.id = `detached-dock-target-${++this.targetId}`;
        const before = parent.children.indexOf(node) < parent.children.indexOf(sibling);
        const type = parent.container.containerType === 'vertical' ? before ? 'up' : 'down'
            : parent.container.containerType === 'horizontal' ? before ? 'left' : 'right' : 'fill';
        const ratio = parent.container instanceof SplitterDockContainer ? parent.container.getRatios()[parent.children.indexOf(node)] : 0.5;
        return { target, type, ratio };
    }
    private prepare(element: HTMLElement, params: NewWindowParams, win: Window) {
        if (!win) throw new Error('Allow pop-up windows for the editor to open a detached panel.');
        const panel = this.manager.getPanels().find(panel => panel.resolvedElementContent === element);
        if (!panel) throw new Error('Cannot detach an unknown panel.');
        panel.undockedToNewBrowserWindow = true;
        this.panels.set(panel, win);
        const source = element.ownerDocument;
        const originalStyle = element.style.cssText;
        const anchor = this.returnAnchor(element);
        const attributes = ['dock-spawn-dock-to', 'dock-spawn-dock-type', 'dock-spawn-dock-ratio'].map(name => [name, element.getAttribute(name)] as const);
        const focusPanel = () => { this.manager.activePanel = panel; };
        const closeChild = () => win.close();
        const base = win.document.createElement('base'); base.href = source.baseURI; win.document.head.append(base);
        const syncTheme = () => {
            win.document.documentElement.dataset.theme = source.documentElement.dataset.theme;
            win.document.documentElement.style.colorScheme = source.documentElement.style.colorScheme;
        };
        syncTheme(); source.defaultView.addEventListener('webui-theme-change', syncTheme);
        this.remember(element); this.restore(element);
        let returned = false;
        const returnToMain = () => {
            if (returned) return;
            returned = true;
            this.remember(element);
            this.panels.delete(panel);
            panel.undockedToNewBrowserWindow = false;
            source.defaultView.removeEventListener('webui-theme-change', syncTheme);
            observer.disconnect(); this.observers.delete(win);
            source.defaultView.removeEventListener('pagehide', closeChild);
            element.removeEventListener('pointerdown', focusPanel, true);
            element.style.cssText = originalStyle;
            element.setAttribute('dock-spawn-title', panel.title);
            if (anchor?.target.isConnected && anchor.target.ownerDocument === source) {
                element.setAttribute('dock-spawn-dock-to', anchor.target.id);
                element.setAttribute('dock-spawn-dock-type', anchor.type);
                element.setAttribute('dock-spawn-dock-ratio', String(anchor.ratio));
            }
            this.dock.append(element);
            this.restore(element);
            queueMicrotask(() => {
                for (const [name, value] of attributes) if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
                this.returned?.(element);
            });
        };
        // Keep unsaved documents/chats when their browser window is closed.
        params.newWindowClosedCallback = returnToMain;
        source.defaultView.addEventListener('pagehide', closeChild, { once: true });
        const observer = new MutationObserver(records => {
            for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) this.restore(node as Element);
        });
        this.observers.set(win, observer);
        observer.observe(win.document, { childList: true, subtree: true });
        // Drag-over data is protected by browsers. Share the opener's palette cache for drags
        // originating in a detached project tree, just as for drags from the main window.
        for (const type of ['dragstart', 'dragend']) win.addEventListener(type, event => {
            const view = source.defaultView as Window & typeof globalThis;
            view.dispatchEvent(new view.DragEvent(type, { dataTransfer: (event as DragEvent).dataTransfer }));
        }, true);
        const adopted = win.document.adoptNode.bind(win.document);
        // Parse new designer widgets in the opener's registry, then adopt the already-upgraded nodes.
        // A blank popup has no widget module registry of its own.
        const createRange = win.document.createRange.bind(win.document);
        win.document.createRange = () => {
            const range = createRange(), parse = range.createContextualFragment.bind(range);
            range.createContextualFragment = text => {
                if (range.startContainer !== win.document) return parse(text);
                const fragment = source.createRange().createContextualFragment(text);
                for (const child of fragment.children) this.remember(child);
                adopted(fragment);
                for (const child of fragment.children) this.restore(child);
                return fragment;
            };
            return range;
        };
        const createElement = win.document.createElement.bind(win.document);
        win.document.createElement = ((tag: string, options?: ElementCreationOptions) => {
            if (!source.defaultView.customElements.get(tag)) return createElement(tag, options);
            const node = source.createElement(tag, options); this.remember(node); adopted(node); this.restore(node); return node;
        }) as typeof win.document.createElement;
        win.document.adoptNode = (<T extends Node>(node: T): T => {
            if (node.nodeType === 1) this.remember(node as unknown as Element);
            const result = adopted(node);
            if (node.nodeType === 1) this.restore(node as unknown as Element);
            return result;
        });
        const wrapper = source.createElement('div');
        wrapper.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;color:var(--webui-text);background:var(--webui-surface)';
        const header = source.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 8px;border-bottom:1px solid var(--webui-border);font:12px system-ui;flex-shrink:0';
        const target = this.resolveCommands(element);
        const addButton = (text: string, click: () => void) => {
            const button = source.createElement('button'); button.textContent = text;
            button.style.cssText = 'font:inherit;color:inherit;background:var(--webui-subtle);border:1px solid var(--webui-border);border-radius:3px;padding:3px 7px;cursor:pointer';
            button.onclick = click; header.append(button);
        };
        if (target.executeCommand) for (const [label, type] of [['Save', 'save'], ['Undo', 'undo'], ['Redo', 'redo']] as const) {
            addButton(label, () => { focusPanel(); void target.executeCommand({ type: type as IUiCommand['type'] }); });
        }
        addButton('Return to main window', () => { returnToMain(); win.close(); });
        const title = source.createElement('span'); title.textContent = params.title; header.append(title);
        wrapper.append(header, element);
        win.document.addEventListener('keydown', event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && target.executeCommand) {
                event.preventDefault(); focusPanel(); void target.executeCommand({ type: 'save' as IUiCommand['type'] });
            }
        });
        queueMicrotask(() => {
            this.restore(element);
            element.style.cssText += ';position:relative;flex:1;min-height:0;width:100%;height:0';
            element.addEventListener('pointerdown', focusPanel, { capture: true });
            this.manager.activePanel = panel;
        });
        return wrapper;
    }
}

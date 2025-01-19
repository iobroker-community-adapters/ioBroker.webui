export interface ICustomControlScript {
    init?(instance: HTMLElement, shadowRoot: ShadowRoot);

    connectedCallback?(instance: HTMLElement, shadowRoot: ShadowRoot);
    disconnectedCallback?(instance: HTMLElement, shadowRoot: ShadowRoot);
}
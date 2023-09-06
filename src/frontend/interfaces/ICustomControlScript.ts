export interface ICustomControlScript {
    init?(instance: HTMLElement);

    connectedCallback?(instance: HTMLElement);
    disconnectedCallback?(instance: HTMLElement);
}
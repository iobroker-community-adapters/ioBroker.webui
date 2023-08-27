export interface IControl {
    html: string;
    style: string;
    properties: Record<string, string>;
    settings: IControlSettings;
}

export interface IControlSettings {
    width?: number;
    height?: number;
    scale?: null | 'noneNoScroll' | 'fit';
}
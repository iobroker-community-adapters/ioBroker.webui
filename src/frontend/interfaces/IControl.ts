export interface IControl {
    html: string;
    style: string;
    properties: Record<string, { type: string, values?: string[], default?: any }>;
    settings: IControlSettings;
}

export interface IControlSettings {
    width?: number;
    height?: number;
    scale?: null | 'noneNoScroll' | 'fit';
}
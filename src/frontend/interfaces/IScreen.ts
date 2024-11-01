export type propertiesRecord = Record<string, { type: string, values?: string[], default?: any, internal?: boolean }>;

export interface IScreen {
    html: string;
    style: string;
    script: string;
    properties: propertiesRecord;
    settings: IScreenSettings;
}

export interface IScreenSettings {
    width?: string;
    height?: string;
    addoptedStyles?: string[];
    stretch?: 'none' | 'fill' | 'uniform' | 'uniformToFill';
}
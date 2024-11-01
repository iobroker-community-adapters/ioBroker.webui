export interface IScreen {
    html: string;
    style: string;
    script: string;
    properties: Record<string, { type: string, values?: string[], default?: any, internal?: boolean }>;
    settings: IScreenSettings;
}

export interface IScreenSettings {
    width?: string;
    height?: string;
    addoptedStyles?: string[];
    stretch?: 'none' | 'fill' | 'uniform' | 'uniformToFill';
}
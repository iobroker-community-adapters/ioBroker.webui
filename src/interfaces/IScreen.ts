export interface IScreen {
    html: string;
    styles: string[];
    settings: IScreenSettings;
}

export interface IScreenSettings {
    width?: number;
    height?: number;
}
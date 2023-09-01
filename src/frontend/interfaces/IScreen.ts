export interface IScreen {
    html: string;
    style: string;
    settings: IScreenSettings;
}

export interface IScreenSettings {
    width?: string;
    height?: string;
    scale?: null | 'noneNoScroll' | 'fit';
}
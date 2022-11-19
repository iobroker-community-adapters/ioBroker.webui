export interface IScreen {
    html: string;
    style: string;
    settings: IScreenSettings;
}
export interface IScreenSettings {
    width?: number;
    height?: number;
    scale?: null | 'noneNoScroll' | 'fit';
}

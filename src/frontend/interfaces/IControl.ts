export interface IControl {
    html: string;
    style: string;
    properties: Record<string, { type: string, values?: string[], default?: any }>;
    settings: IControlSettings;

    //neededpackages??
}

export interface IControlSettings {
    width?: string;
    height?: string;
    /**
     * CustomControl does include Global Style in it's shadowroot
     */
    useGlobalStyle?: boolean;
}
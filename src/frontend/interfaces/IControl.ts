import { propertiesRecord } from "./IScreen.js";

export interface IControl {
    html: string;
    style: string;
    script: string;
    properties: propertiesRecord;
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
    addoptedStyles?: string[];
}
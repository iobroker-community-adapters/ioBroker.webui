import { IGlobalConfig } from "./IGlobalConfig.js";

export interface IWebUiConfig {
    globalStyle: string;
    globalScript: string;
    globalConfig: IGlobalConfig;
    fontDeclarations: string;
}
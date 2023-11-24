import { IGlobalConfig } from "./IGlobalConfig";

export interface IWebUiConfig {
    globalStyle: string;
    globalScript: string;
    globalTypeScript: string;
    globalConfig: IGlobalConfig;
    fontDeclarations: string;
}
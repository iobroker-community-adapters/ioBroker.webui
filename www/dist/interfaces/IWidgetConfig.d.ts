export interface IWidgetConfig {
    [name: string]: ISingleWidgetFileConfig;
}
export interface ISingleWidgetFileConfig {
    "version": string;
    "name": string;
    "widgets": ISingleWidget;
    "imports": string[];
}
export interface ISingleWidget {
    [name: string]: {
        properties: {
            [name: string]: {
                type: 'Number' | 'Boolean' | 'String';
            };
        };
    };
}

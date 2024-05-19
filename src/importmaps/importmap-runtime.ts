const importMapRuntime = {
    "imports": {
        "@node-projects/web-component-designer": "./node_modules/@node-projects/web-component-designer/dist/index.js",
        "@node-projects/web-component-designer/": "./node_modules/@node-projects/web-component-designer/",
        "@node-projects/base-custom-webcomponent/": "./node_modules/@node-projects/base-custom-webcomponent/",
        "@node-projects/base-custom-webcomponent": "./node_modules/@node-projects/base-custom-webcomponent/dist/index.js",
        "@node-projects/web-component-designer-visualization-addons": "./node_modules/@node-projects/web-component-designer-visualization-addons/dist/index.js",
        "@node-projects/web-component-designer-visualization-addons/": "./node_modules/@node-projects/web-component-designer-visualization-addons/",
        "@iobroker/socket-client/": "./node_modules/@iobroker/socket-client/",
        "@iobroker/socket-client": "./node_modules/@iobroker/socket-client/dist/esm/index.js",
        "tslib": "./node_modules/tslib/tslib.es6.mjs",
        "long": "./node_modules/long/index.js",
        "@adobe/css-tools": "./node_modules/@adobe/css-tools/dist/index.mjs"
    }
}
//@ts-ignore
importShim.addImportMap(importMapRuntime);
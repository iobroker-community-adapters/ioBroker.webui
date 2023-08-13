const importMapConfig = {
    "imports": {
        "jquery.fancytree/": "./node_modules/jquery.fancytree/",
        "monaco-editor/": "./node_modules/monaco-editor/",
        "@node-projects/web-component-designer": "./node_modules/@node-projects/web-component-designer/dist/index.js",
        "@node-projects/web-component-designer/": "./node_modules/@node-projects/web-component-designer/",
        "@adobe/css-tools": "./node_modules/@adobe/css-tools/dist/index.mjs",
        "dock-spawn-ts/": "./node_modules/dock-spawn-ts/",
        "@node-projects/base-custom-webcomponent/": "./node_modules/@node-projects/base-custom-webcomponent/",
        "@node-projects/base-custom-webcomponent": "./node_modules/@node-projects/base-custom-webcomponent/dist/index.js",
        "@node-projects/lean-he-esm/": "./node_modules/@node-projects/lean-he-esm/",
        "@iobroker/socket-client/": "./node_modules/@iobroker/socket-client/",
        "@iobroker/socket-client": "./node_modules/@iobroker/socket-client/dist/esm/index.js",
        "tslib": "./node_modules/tslib/tslib.es6.mjs"
    }
}
//@ts-ignore
importShim.addImportMap(importMapConfig);
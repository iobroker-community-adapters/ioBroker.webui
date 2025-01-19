"use strict";
const importMapConfig = {
    "imports": {
        "monaco-editor/": "./node_modules/monaco-editor/",
        "@node-projects/web-component-designer": "./node_modules/@node-projects/web-component-designer/dist/index.js",
        "@node-projects/web-component-designer/": "./node_modules/@node-projects/web-component-designer/",
        "@adobe/css-tools": "./node_modules/@adobe/css-tools/dist/index.mjs",
        "dock-spawn-ts/": "./node_modules/dock-spawn-ts/",
        "esprima-next": "./node_modules/esprima-next/dist/esprima.js",
        "@node-projects/base-custom-webcomponent/": "./node_modules/@node-projects/base-custom-webcomponent/",
        "@node-projects/base-custom-webcomponent": "./node_modules/@node-projects/base-custom-webcomponent/dist/index.js",
        "@node-projects/node-html-parser-esm": "./node_modules/@node-projects/node-html-parser-esm/dist/index.js",
        "@node-projects/web-component-designer-htmlparserservice-nodehtmlparser": "./node_modules/@node-projects/web-component-designer-htmlparserservice-nodehtmlparser/dist/service/htmlParserService/NodeHtmlParserService.js",
        "@node-projects/web-component-designer-htmlparserservice-nodehtmlparser/": "./node_modules/@node-projects/web-component-designer-htmlparserservice-nodehtmlparser/",
        "@node-projects/web-component-designer-codeview-monaco": "./node_modules/@node-projects/web-component-designer-codeview-monaco/dist/widgets/codeView/code-view-monaco.js",
        "@node-projects/web-component-designer-codeview-monaco/": "./node_modules/@node-projects/web-component-designer-codeview-monaco/",
        "@node-projects/web-component-designer-stylesheetservice-css-tools": "./node_modules/@node-projects/web-component-designer-stylesheetservice-css-tools/dist/service/stylesheetservice/CssToolsStylesheetService.js",
        "@node-projects/web-component-designer-stylesheetservice-css-tools/": "./node_modules/@node-projects/web-component-designer-stylesheetservice-css-tools/",
        "@node-projects/web-component-designer-widgets-wunderbaum": "./node_modules/@node-projects/web-component-designer-widgets-wunderbaum/dist/index.js",
        "@node-projects/web-component-designer-widgets-wunderbaum/": "./node_modules/@node-projects/web-component-designer-widgets-wunderbaum/",
        "@node-projects/web-component-designer-visualization-addons": "./node_modules/@node-projects/web-component-designer-visualization-addons/dist/index.js",
        "@node-projects/web-component-designer-visualization-addons/": "./node_modules/@node-projects/web-component-designer-visualization-addons/",
        "@node-projects/propertygrid.webcomponent": "./node_modules/@node-projects/propertygrid.webcomponent/dist/index.js",
        "@node-projects/propertygrid.webcomponent/": "./node_modules/@node-projects/propertygrid.webcomponent/",
        "@node-projects/splitview.webcomponent": "./node_modules/@node-projects/splitview.webcomponent/dist/index.js",
        "@node-projects/splitview.webcomponent/": "./node_modules/@node-projects/splitview.webcomponent/",
        "@node-projects/lean-he-esm/": "./node_modules/@node-projects/lean-he-esm/",
        "@iobroker/socket-client/": "./node_modules/@iobroker/socket-client/",
        "@iobroker/socket-client": "./node_modules/@iobroker/socket-client/dist/esm/index.js",
        "tslib": "./node_modules/tslib/tslib.es6.mjs",
        "long": "./node_modules/long/index.js",
        "wunderbaum": "./node_modules/wunderbaum/dist/wunderbaum.esm.min.js",
        "wunderbaum/": "./node_modules/wunderbaum/",
        "toastify-js": "./node_modules/toastify-js/src/toastify-es.js",
        "iobroker-webcomponent-object-selector/": "./node_modules/iobroker-webcomponent-object-selector/"
    }
};
//@ts-ignore
importShim.addImportMap(importMapConfig);

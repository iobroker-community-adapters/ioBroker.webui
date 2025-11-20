const importMapConfig = {
    "imports": {
        "@node-projects/base-custom-webcomponent": "./node_modules/@node-projects/base-custom-webcomponent/dist/index-min.js",
        "@node-projects/web-component-designer": "./node_modules/@node-projects/web-component-designer/dist/index-min.js",
        "@node-projects/web-component-designer-widgets-wunderbaum": "./node_modules/@node-projects/web-component-designer-widgets-wunderbaum/dist/index-min.js",
        "@node-projects/lean-he-esm": "./node_modules/@node-projects/lean-he-esm/lib/index-min.js",
        "@node-projects/node-html-parser-esm": "./node_modules/@node-projects/node-html-parser-esm/dist/index-min.js",
        "dock-spawn-ts": "./node_modules/dock-spawn-ts/lib/js/index-webcomponent-min.js",

        "a_@node-projects/base-custom-webcomponent": "./node_modules/@node-projects/base-custom-webcomponent/dist/index.js",
        "a_@node-projects/web-component-designer": "./node_modules/@node-projects/web-component-designer/dist/index.js",
        "a_@node-projects/web-component-designer-widgets-wunderbaum": "./node_modules/@node-projects/web-component-designer-widgets-wunderbaum/dist/index.js",
        "a_@node-projects/lean-he-esm": "./node_modules/@node-projects/lean-he-esm/lib/index.js",
        "a_@node-projects/node-html-parser-esm": "./node_modules/@node-projects/node-html-parser-esm/dist/index.js",
        "a_dock-spawn-ts": "./node_modules/dock-spawn-ts/lib/js/index-webcomponent.js",

        "monaco-editor/": "./node_modules/monaco-editor/",
        "@adobe/css-tools": "./node_modules/@adobe/css-tools/dist/esm/adobe-css-tools.mjs",
        "esprima-next": "./node_modules/esprima-next/dist/esprima.js",
        "@node-projects/": "./node_modules/@node-projects/",
        "@node-projects/web-component-designer-htmlparserservice-nodehtmlparser": "./node_modules/@node-projects/web-component-designer-htmlparserservice-nodehtmlparser/dist/service/htmlParserService/NodeHtmlParserService.js",
        "@node-projects/web-component-designer-codeview-monaco": "./node_modules/@node-projects/web-component-designer-codeview-monaco/dist/widgets/codeView/code-view-monaco.js",
        "@node-projects/web-component-designer-stylesheetservice-css-tools": "./node_modules/@node-projects/web-component-designer-stylesheetservice-css-tools/dist/service/stylesheetservice/CssToolsStylesheetService.js",
        "@node-projects/web-component-designer-visualization-addons": "./node_modules/@node-projects/web-component-designer-visualization-addons/dist/index.js",
        "@node-projects/propertygrid.webcomponent": "./node_modules/@node-projects/propertygrid.webcomponent/dist/index.js",
        "@node-projects/splitview.webcomponent": "./node_modules/@node-projects/splitview.webcomponent/dist/index.js",
        "@iobroker/socket-client/": "./node_modules/@iobroker/socket-client/",
        "@iobroker/socket-client": "./node_modules/@iobroker/socket-client/dist/esm/index.js",
        "tslib": "./node_modules/tslib/tslib.es6.mjs",
        "long": "./node_modules/long/index.js",
        "wunderbaum": "./node_modules/wunderbaum/dist/wunderbaum.esm.min.js",
        "wunderbaum/": "./node_modules/wunderbaum/",
        "toastify-js": "./node_modules/toastify-js/src/toastify-es.js",
        "@iobroker/webcomponent-selectid-dialog/": "./node_modules/@iobroker/webcomponent-selectid-dialog/",
    }
}
//@ts-ignore
importShim.addImportMap(importMapConfig);
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';
import { BindingsHelper } from '@node-projects/web-component-designer-visualization-addons/dist/helpers/BindingsHelper.js';
import { IobrokerWebuiScriptSystem } from '../scripting/IobrokerWebuiScriptSystem.js';
//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
await iobrokerHandler.init();
//@ts-ignore
window.appShell = {
    bindingsHelper: new BindingsHelper(iobrokerHandler),
    scriptSystem: new IobrokerWebuiScriptSystem(iobrokerHandler),
};
iobrokerHandler.changeView.on(view => {
    const viewer = document.getElementById('viewer');
    viewer.screenName = view;
});

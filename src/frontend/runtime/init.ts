import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';
import type { ScreenViewer } from './ScreenViewer.js';
import { BindingsHelper, ScriptSystem } from '@node-projects/web-component-designer-visualization-addons';

//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
await iobrokerHandler.init();

//@ts-ignore
window.appShell = {
    bindingsHelper: new BindingsHelper(iobrokerHandler),
    scriptSystem: new ScriptSystem(iobrokerHandler),
}
iobrokerHandler.changeView.on(view => {
    const viewer = <ScreenViewer>document.getElementById('viewer');
    viewer.screenName = view;
});
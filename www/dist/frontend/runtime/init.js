import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';
//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
await iobrokerHandler.init();
iobrokerHandler.changeView.on(view => {
    const viewer = document.getElementById('viewer');
    viewer.screenName = view;
});

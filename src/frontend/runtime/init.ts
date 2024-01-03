import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';
import type { ScreenViewer } from './ScreenViewer.js';

//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
await iobrokerHandler.init();
iobrokerHandler.changeView.on(view => {
    const viewer = <ScreenViewer>document.getElementById('viewer');
    viewer.screenName = view;
});
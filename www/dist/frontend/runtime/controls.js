import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';
//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
iobrokerHandler.init();
import './ScreenViewer.js';
import './SvgImage.js';

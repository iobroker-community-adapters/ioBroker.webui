import { iobrokerHandler } from '../IobrokerHandler.js';
import { LazyLoader } from '@node-projects/base-custom-webcomponent';

//@ts-ignore
await LazyLoader.LoadJavascript(window.iobrokerSocketScriptUrl);
iobrokerHandler.init();

import './ScreenViewer.js';
import '../controls/SvgImage.js';


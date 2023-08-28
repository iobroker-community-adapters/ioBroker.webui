import './ScreenViewer.js';
import './SvgImage.js';
import './HabPanelLikeMenu.js';
import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { generateCustomControl } from './CustomControls.js';
iobrokerHandler.loadAllCustomControls();
for (let name of await iobrokerHandler.getCustomControlNames()) {
    generateCustomControl(name, await iobrokerHandler.getCustomControl(name));
}

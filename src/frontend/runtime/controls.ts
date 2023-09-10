import './ScreenViewer.js';
import './HabPanelLikeMenu.js';
import './TranslateableText.js';

import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { generateCustomControl } from './CustomControls.js';

iobrokerHandler.loadAllCustomControls().then(async () => {
    for (let name of await iobrokerHandler.getCustomControlNames()) {
        iobrokerHandler.getCustomControl(name).then((ctl) => generateCustomControl(name, ctl));
    }
});

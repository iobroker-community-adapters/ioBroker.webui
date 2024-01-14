import './ScreenViewer.js';
import './HabPanelLikeMenu.js';
import './TranslateableText.js';
import '../common/Runtime.js';

//patch input for utc date...
Object.defineProperty(HTMLInputElement.prototype, "valueAsNumberLocal", {
    get() {
        const offset = new Date().getTimezoneOffset() * 60000;
        return this.valueAsNumber - offset;
    },
    set(value) {
        try {
            if (value) {
                const offset = new Date().getTimezoneOffset() * 60000;
                this.valueAsNumber = value + offset;
            } else
                this.valueAsNumber = 0;
        }
        catch (err) {
            console.warn(err);
        }
    }
});

import { iobrokerHandler } from '../common/IobrokerHandler.js';
import { generateCustomControl } from './CustomControls.js';
import { IControl } from '../interfaces/IControl.js';

iobrokerHandler.loadAllCustomControls().then(async () => {
    for (let name of await iobrokerHandler.getCustomControlNames()) {
        iobrokerHandler.getWebuiObject('control', name).then(ctl => generateCustomControl(name, <IControl>ctl));
    }
});

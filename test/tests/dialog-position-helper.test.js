import { expect } from 'chai';
import { fitDialogPosition } from '../../www/dist/frontend/helper/DialogPositionHelper.js';

describe('dialog position helper', () => {
    const bounds = { left: 10, top: 40, width: 1000, height: 700 };

    it('keeps requested coordinates when the dialog fits', () => {
        expect(fitDialogPosition(200, 100, 600, 400, bounds)).to.deep.equal({ x: 200, y: 100 });
    });

    it('moves negative help-dialog coordinates into the visible dock area', () => {
        expect(fitDialogPosition(-650, -100, 620, 620, bounds)).to.deep.equal({ x: 10, y: 40 });
    });

    it('keeps the complete dialog visible at the right and bottom edges', () => {
        expect(fitDialogPosition(900, 600, 620, 400, bounds)).to.deep.equal({ x: 390, y: 340 });
    });

    it('uses the existing default coordinates when they are omitted', () => {
        expect(fitDialogPosition(undefined, undefined, 600, 400, bounds)).to.deep.equal({ x: 100, y: 100 });
    });
});

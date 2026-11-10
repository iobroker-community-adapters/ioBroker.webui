import { expect } from 'chai';
import { pickSignalForInput } from '../../dist/frontend/helper/SignalPickerHelper.js';

function field(value = '') {
    const input = new EventTarget();
    Object.assign(input, { value, isConnected: true, ownerDocument: { defaultView: { Event } } });
    return input;
}
describe('ioBroker signal picker routing', () => {
    it('preselects the current ID and sends the result through the row input binding', async () => {
        const input = field('old.0.state'); let boundValue, events = 0;
        input.addEventListener('input', event => { expect(event.bubbles).to.equal(true); boundValue = input.value; events++; });
        expect(await pickSignalForInput(input, async selected => { expect(selected).to.equal('old.0.state'); return 'new.0.state'; })).to.equal(true);
        expect(boundValue).to.equal('new.0.state'); expect(events).to.equal(1);
    });
    it('keeps the field unchanged when the picker is cancelled', async () => {
        const input = field('keep.0.state'); let events = 0;
        input.addEventListener('input', () => events++);
        expect(await pickSignalForInput(input, async () => null)).to.equal(false);
        expect(input.value).to.equal('keep.0.state'); expect(events).to.equal(0);
    });
    it('ignores a result for a row removed or rebuilt while the picker was open', async () => {
        const input = field('old.0.state'); let finish, events = 0;
        input.addEventListener('input', () => events++);
        const result = pickSignalForInput(input, () => new Promise(resolve => { finish = resolve; }));
        input.isConnected = false; finish('new.0.state');
        expect(await result).to.equal(false); expect(input.value).to.equal('old.0.state'); expect(events).to.equal(0);
    });
});

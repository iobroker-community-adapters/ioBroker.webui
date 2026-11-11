// Test-only ioBroker web component: built on the real base class of @iobroker/web-components.
import { IobWebComponent, defineWebComponent } from '/node_modules/@iobroker/web-components/build/element.js';

class FixtureStateTile extends IobWebComponent {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = `<style>
:host { display: block; width: 100%; height: 100%; }
.tile { box-sizing: border-box; height: 100%; padding: 8px; background: var(--iob-paper); color: var(--iob-text);
    border: 1px solid var(--iob-divider); border-radius: calc(var(--iob-border-radius) * 2); font-family: var(--iob-font-family); cursor: pointer; }
.value { color: var(--iob-primary); font-size: 24px; }
.large .value { font-size: 36px; }
.info { color: var(--iob-text-secondary); font-size: 11px; }
</style><div class="tile"><div class="name"></div><div class="value"></div><div class="info"></div></div>`;
        this.shadowRoot.querySelector('.tile').addEventListener('click', () => {
            if (!this.editMode && this.settings.view)
                this.emit('iob-navigate', { view: this.settings.view });
        });
    }

    getStateIds(settings) {
        return settings.oid ? [settings.oid] : [];
    }

    render() {
        const { oid, decimals = 1, showUnit, unit = '', size } = this.settings;
        const val = oid ? this.states[oid]?.val : undefined;
        const root = this.shadowRoot;
        root.querySelector('.tile').classList.toggle('large', size === 'l');
        root.querySelector('.name').textContent = this.text(this.objects[oid]?.common?.name) || oid || 'no state';
        root.querySelector('.value').textContent = typeof val === 'number' ? val.toFixed(decimals) + (showUnit ? ' ' + unit : '') : '-';
        root.querySelector('.info').textContent = `edit=${!!this.editMode} theme=${this.theme.type} socket=${!!this.socket}`;
    }
}

defineWebComponent('fixture-state-tile', FixtureStateTile);

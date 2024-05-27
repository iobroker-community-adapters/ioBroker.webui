export class RoundPixelsDesignViewConfigButton {
    constructor() { }
    provideButtons(designerView, designerCanvas) {
        const btn = document.createElement('div');
        btn.className = 'toolbar-control';
        btn.title = 'round pixels to';
        const ip = document.createElement('input');
        ip.type = 'number';
        ip.step = '1';
        ip.min = '-1';
        ip.valueAsNumber = designerView.serviceContainer.options.roundPixelsToDecimalPlaces;
        ip.onchange = () => designerView.serviceContainer.options.roundPixelsToDecimalPlaces = ip.valueAsNumber;
        btn.appendChild(ip);
        return [btn];
    }
}
//# sourceMappingURL=RoundPixelsDesignViewConfigButton.js.map
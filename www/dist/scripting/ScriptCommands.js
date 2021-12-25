export class OpenScreen {
    type = 'openScreen';
    screen;
    relativeSignalsPath;
    openInDialog;
}
export class SetSignal {
    type = 'setSignal';
    signal;
    value;
}
export class IncreaseSignal {
    type = 'increaseSignal';
    signal;
    value;
}
export class DecreaseSignal {
    type = 'decreaseSignal';
    signal;
    value;
}
export class SetBit {
    type = 'setBit';
    signal;
    bitNumber = 0;
}
export class ClearBit {
    type = 'clearBit';
    signal;
    bitNumber = 0;
}
export class ToggleBit {
    type = 'toggleBit';
    signal;
    bitNumber = 0;
}
export class Javascript {
    type = 'javascript';
    script;
}

export class OpenScreen {
    type = 'openScreen';
    screen;
    relativeSignalsPath;
    openInDialog;
}
export class SetSignalValue {
    type = 'setSignalValue';
    signal;
    value;
}
export class IncrementSignalValue {
    type = 'incrementSignalValue';
    signal;
    value;
}
export class DecrementSignalValue {
    type = 'decrementSignalValue';
    signal;
    value;
}
export class SetBitInSignal {
    type = 'setBitInSignal';
    signal;
    bitNumber = 0;
}
export class ClearBitInSignal {
    type = 'clearBitInSignal';
    signal;
    bitNumber = 0;
}
export class ToggleBitInSignal {
    type = 'toggleBitInSignal';
    signal;
    bitNumber = 0;
}
export class Javascript {
    type = 'javascript';
    script;
}

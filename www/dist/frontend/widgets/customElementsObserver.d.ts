declare class CustomElementsObserver {
    private _newElements;
    private currentLib;
    constructor();
    setCurrentLib(name: string): void;
    finishedCurrentLib(): void;
    getElements(): Map<string, string[]>;
}
declare var customElementsObserver: CustomElementsObserver;
export default customElementsObserver;

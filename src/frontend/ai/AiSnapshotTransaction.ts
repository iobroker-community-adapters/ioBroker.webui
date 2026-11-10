import type { ITransactionItem } from '@node-projects/web-component-designer/dist/elements/services/undoService/ITransactionItem.js';

/** Both states are prepared before execution: undo/redo must remain synchronous. */
export class AiSnapshotTransaction<T> implements ITransactionItem {
    readonly title = 'Apply AI changes';
    constructor(private readonly before: T, private readonly after: T, private readonly restore: (state: T) => void) { }
    do() { this.restore(this.after); return null; }
    undo() { this.restore(this.before); return null; }
    mergeWith(_other: ITransactionItem) { return false; }
}

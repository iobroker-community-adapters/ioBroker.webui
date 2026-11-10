/** Both states are prepared before execution: undo/redo must remain synchronous. */
export class AiSnapshotTransaction {
    before;
    after;
    restore;
    title = 'Apply AI changes';
    constructor(before, after, restore) {
        this.before = before;
        this.after = after;
        this.restore = restore;
    }
    do() { this.restore(this.after); return null; }
    undo() { this.restore(this.before); return null; }
    mergeWith(_other) { return false; }
}

export class ChangeGroup {
    redoBranches;
    source;
    _contentChanges = [];
    title;
    get affectedItems() {
        let s = new Set();
        for (let u of this.undoStack)
            for (let i of u.affectedItems)
                s.add(i);
        for (let u of this.redoStack)
            for (let i of u.affectedItems)
                s.add(i);
        return [...s.values()];
    }
    commitHandler;
    abortHandler;
    constructor(title, commitHandler, abortHandler, source = 'local') {
        this.title = title;
        this.commitHandler = commitHandler;
        this.abortHandler = abortHandler;
        this.source = source;
    }
    get contentChanges() {
        return this._contentChanges.length > 0 ? this._contentChanges : null;
    }
    do() {
        let item = null;
        let changes = [];
        while (item = this.redoStack.pop()) {
            try {
                let result = item.do();
                if (result) {
                    changes.push(...result);
                }
                this.undoStack.push(item);
            }
            catch (err) {
                throw err;
            }
        }
        return changes.length > 0 ? changes : null;
    }
    undo() {
        let item = null;
        let changes = [];
        while (item = this.undoStack.pop()) {
            try {
                let result = item.undo();
                if (result) {
                    changes.push(...result);
                }
                this.redoStack.push(item);
            }
            catch (err) {
                throw err;
            }
        }
        return changes.length > 0 ? changes : null;
    }
    ;
    commit() {
        this.commitHandler(this);
    }
    abort() {
        this.abortHandler(this);
    }
    mergeWith(other) {
        return false;
    }
    addCommitedSubchangeGroup(changeGroup) {
        this.undoStack.push(changeGroup);
        this._recordContentChanges(changeGroup.contentChanges);
    }
    undoStack = [];
    redoStack = [];
    execute(item) {
        let changes = item.do();
        this._recordContentChanges(changes);
        for (let existingItem of this.undoStack) {
            if (existingItem.mergeWith(item))
                return changes;
        }
        this.undoStack.push(item);
        return changes;
    }
    _recordContentChanges(changes) {
        if (changes?.length)
            this._contentChanges.push(...changes);
    }
}
//# sourceMappingURL=ChangeGroup.js.map
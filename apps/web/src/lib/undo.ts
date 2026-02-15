export type Patch = { label: string; do: () => Promise<void> | void; undo: () => Promise<void> | void; };

export class UndoStack {
    private undoStack: Patch[] = [];
    private redoStack: Patch[] = [];
    push(p: Patch) { this.undoStack.push(p); this.redoStack = []; }
    async undo() { const p = this.undoStack.pop(); if (!p) return; await p.undo(); this.redoStack.push(p); }
    async redo() { const p = this.redoStack.pop(); if (!p) return; await p.do(); this.undoStack.push(p); }
    canUndo() { return this.undoStack.length > 0; }
    canRedo() { return this.redoStack.length > 0; }
}

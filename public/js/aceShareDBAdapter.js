class AceShareDBAdapter {
    constructor(aceDoc) {
        this.aceDoc = aceDoc
    }

    aceToQuillDelta(delta) {
        let ops = []
        // if operation is performed on 0th index skip retain
        if (delta.start.row !== 0 || delta.start.column !== 0) {
            let retainOp = {}
            const pos = this.aceDoc.positionToIndex(delta.start)
            retainOp.retain = pos
            ops.push(retainOp)
        }
        if (delta.action === 'insert') {
            let insertOp = {}
            const str = delta.lines.join('\n')
            insertOp.insert = str
            ops.push(insertOp)
        }
        else if (delta.action === 'remove') {
            let deleteOp = {}
            const len = delta.lines.join('\n').length
            deleteOp.delete = len
            ops.push(deleteOp)
        }

        console.log('acetoQuill', ops);

        return { ops }
    }

    QuillToAceDelta(ops) {
        let deltas = [];
        let pointer = 0;

        ops.forEach(operation => {
            let delta = {}

            delta.start = this.aceDoc.indexToPosition(pointer) || { row: 0, column: 0 }
            if (operation.retain)
                pointer += operation.retain
            else if (operation.insert) {
                delta.action = 'insert'
                delta.lines = operation.insert.split('\n')
                if (delta.lines.length === 1) {
                    delta.end = {
                        row: delta.start.row,
                        column: delta.start.column + operation.insert.length,
                    }
                } else {
                    delta.end = {
                        row: delta.start.row + (delta.lines.length - 1),
                        column: delta.lines[delta.lines.length - 1].length,
                    }
                }
                deltas.push(delta)
            }
            else {
                delta.action = 'remove'
                const count = operation.delete
                delta.end = this.aceDoc.indexToPosition(pointer + count)
                pointer += count
                deltas.push(delta)
            }
        })

        console.log('quillToAce', deltas)

        return deltas
    }

    applyOps(ops) {
        console.log('sharedb :', ops);
        // converts the ops provided by shareDB to Ace delta and applies them
        const deltas = this.QuillToAceDelta(ops)
        // apply the deltas
        this.aceDoc.applyDeltas(deltas)
    }
}
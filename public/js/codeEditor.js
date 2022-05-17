class CodeEditor {
    constructor(selector, doc) {
        this.selector = selector
        this.doc = doc
        this.editor = null
        this.Session = null
        this.aceDoc = null
        this.adapter = null
        this.piston = new Piston()
        this.Range = ace.require("ace/range").Range
        this.localChange = false
    }

    initializeCodeEditor(callback) {
        this.doc.subscribe((err) => {
            if (err) throw err
            this.initialiseAce(this.doc)
            callback()
        })
    }

    resizeAceEditor() {
        if (this.editor) {
            // set timeout is used to do the resizing after the animation is finished
            setTimeout(() => {
                this.editor.resize()
                this.editor.renderer.updateFull();
            }, 100)
        }
    }

    initialiseAce() {
        this.editor = ace.edit(this.selector)
        this.editor.setTheme("ace/theme/monokai")
        this.editor.session.setMode("ace/mode/javascript")
        this.editor.setOptions({
            enableMultiselect: false,
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            autoScrollEditorIntoView: true,
            indentedSoftWrap: false,
        })

        this.Session = this.editor.getSession()
        this.aceDoc = this.Session.getDocument()
        this.adapter = new AceShareDBAdapter(this.aceDoc)

        this.setContents()

        this.submitLocalChanges()

        this.listenAndupdateContent()
    }

    setContents() {
        // to prevent changes made programatically to trigger on change event
        this.localChange = true
        this.adapter.applyOps(this.doc.data.ops)
        this.localChange = false
    }

    submitLocalChanges() {
        this.Session.on("change", delta => {
            if (this.localChange) {
                // local changes so skip
                return
            }
            const op = this.adapter.aceToQuillDelta(delta)

            this.doc.whenNothingPending((err) => {
                if (err) {
                    console.log(err);
                    return
                }
                this.doc.submitOp(op)
            })
        })
    }

    listenAndupdateContent() {
        this.doc.on('op', (ops, source) => {
            if (source) {
                return
            }
            // to prevent changes made programatically to trigger on change event
            // change is a synchronus event in ace so this works
            this.localChange = true
            this.adapter.applyOps(ops.ops)
            this.localChange = false
        })
    }


    submitPresence(submissionHandler, name) {
        const Selection = this.Session.getSelection()

        Selection.on("changeCursor", () => {
            setTimeout(() => {
                const range = Selection.getRange()
                const selection = this.getSelection(range)

                if (!selection)
                    return;

                selection.name = name
                submissionHandler(selection)
            }, 0)
        })
    }

    getSelection(range) {
        const startPos = this.aceDoc.positionToIndex(range.start)
        const endPos = this.aceDoc.positionToIndex(range.end)

        return { index: startPos, length: endPos - startPos }
    }

    getSelectionRanges(start, end) {
        let selectedRanges = []

        const nLines = end.row - start.row + 1;

        if (nLines === 1) {
            selectedRanges.push(new this.Range(start.row, start.column, end.row, end.column))
            return selectedRanges
        }

        let lastColumn;
        // first line
        lastColumn = this.Session.getDocumentLastRowColumn(start)
        selectedRanges.push(new this.Range(start.row, start.column, start.row, lastColumn))

        // middle lines
        for (let i = 1; i < nLines - 1; i++) {
            lastColumn = this.Session.getDocumentLastRowColumn(start.row + i, 0)
            selectedRanges.push(new this.Range(start.row + i, 0, start.row + i, lastColumn))
        }

        // last lines
        selectedRanges.push(new this.Range(end.row, 0, end.row, end.column))

        return selectedRanges;
    }
}
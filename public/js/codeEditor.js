class CodeEditor {
    constructor(selector, doc) {
        this.selector = selector
        this.doc = doc
        this.editor = null
        this.Session = null
        this.aceDoc = null
        this.adapter = null
        this.piston = new Piston()
        this.curMgr = null
        this.selMgr = null
        this.language = 'javascript'
        this.ignorechange = false
    }

    async initializeCodeEditor(callback) {
        await this.doc.subscribe((err) => {
            if (err)
                throw err
            this.initialiseAce(this.doc)
            this.addEditorFunctionality()
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

        this.curMgr = new AceCollabExt.AceMultiCursorManager(this.Session)
        this.selMgr = new AceCollabExt.AceMultiSelectionManager(this.Session)

        this.setContents()

        this.submitLocalChanges()

        this.listenAndupdateContent()
    }

    setContents() {
        // to prevent changes made programatically to trigger on change event
        this.ignorechange = true
        this.adapter.applyOps(this.doc.data.ops)
        this.ignorechange = false
    }

    submitLocalChanges() {
        this.Session.on("change", delta => {
            if (this.ignorechange) {
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
            this.ignorechange = true
            this.adapter.applyOps(ops.ops)
            this.ignorechange = false
        })
    }


    submitPresence(localPresence, userName) {
        const Selection = this.Session.getSelection()

        Selection.on("changeCursor", () => {
            setTimeout(() => {
                const range = Selection.getRange()
                const selection = this.getSelection(range)

                if (!selection)
                    return;

                selection.name = userName

                localPresence.submit(selection, function (err) {
                    if (err) throw err
                })

            }, 0)
        })
    }

    recievePresence(id, range, color) {
        if (!range) {
            try {
                this.curMgr.removeCursor(id)
                this.selMgr.removeSelection(id)
            } catch (err) {
                console.log(err);
            }
            return
        }

        const name = range.name || 'Anonymous';

        // set cursor
        try {
            this.curMgr.addCursor(id, name, color, range.index)
        } catch (e) {
            this.curMgr.setCursor(id, range.index)
        }

        const start = this.aceDoc.indexToPosition(range.index)
        const end = this.aceDoc.indexToPosition(range.index + range.length)

        const selectedRanges = this.getSelectionRanges(start, end)

        if (!selectedRanges) return

        try {
            this.selMgr.addSelection(id, name, color, selectedRanges);
        }
        catch (e) {
            this.selMgr.setSelection(id, selectedRanges)
        }
    }

    removeUser(id) {
        try {
            this.curMgr.removeCursor(id)
            this.selMgr.removeSelection(id)
        } catch (err) {
            console.log(err);
        }
    }

    getSelection(range) {
        const startPos = this.aceDoc.positionToIndex(range.start)
        const endPos = this.aceDoc.positionToIndex(range.end)

        return { index: startPos, length: endPos - startPos }
    }

    getSelectionRanges(start, end) {
        const Range = ace.require("ace/range").Range
        let selectedRanges = []

        const nLines = end.row - start.row + 1;

        if (nLines === 1) {
            selectedRanges.push(new Range(start.row, start.column, end.row, end.column))
            return selectedRanges
        }

        let lastColumn;
        // first line
        lastColumn = this.Session.getDocumentLastRowColumn(start)
        selectedRanges.push(new Range(start.row, start.column, start.row, lastColumn))

        // middle lines
        for (let i = 1; i < nLines - 1; i++) {
            lastColumn = this.Session.getDocumentLastRowColumn(start.row + i, 0)
            selectedRanges.push(new Range(start.row + i, 0, start.row + i, lastColumn))
        }

        // last lines
        selectedRanges.push(new Range(end.row, 0, end.row, end.column))

        return selectedRanges;
    }


    addEditorFunctionality() {
        // language selection
        const modeSelector = document.querySelector('.mode-selector')
        const options = modeSelector.querySelector('.options')
        const wordWrapBtn = document.querySelector('.word-wrap-btn')
        const outputBtn = document.querySelector('.output-btn')
        const inputBtn = document.querySelector('.input-btn')
        const outputDiv = document.querySelector('.output-div')
        const inputDiv = document.querySelector('.input-div')
        const terminalBtn = document.querySelector('.terminal-open-btn')
        const terminal = document.querySelector('.terminal-container')
        const runBtn = document.querySelector('.run-code-btn')
        const spinner = document.querySelector('#terminal-spinner')

        modeSelector.addEventListener('click', (e) => {
            if (e.target && e.target.matches('.option')) {
                modeSelector.querySelector('.label').textContent = e.target.innerHTML
                const mode = e.target.getAttribute('mode')
                this.Session.setMode(`ace/mode/${mode}`)
                this.language = e.target.getAttribute('lang')

                socket.emit('language-changed', e.target.innerHTML, mode, this.language)
            }

            if (options.classList.contains('show-options')) {
                options.classList.remove('show-options')
            }
            else {
                options.classList.add('show-options')
            }
        })

        document.addEventListener('click', (e) => {
            if (!options.classList.contains('show-options'))
                return

            if (e.target && !e.target.matches('.mode-selector, .mode-selector > *, .options .options > *')) {
                options.classList.remove('show-options')
            }
        })

        // word wrap toggle
        wordWrapBtn.addEventListener('click', (e) => {
            if (e.target.classList.contains('word-wrap-active')) {
                e.target.classList.remove('word-wrap-active')
                this.editor.setOption('wrap', false)
            }
            else {
                e.target.classList.add('word-wrap-active')
                this.editor.setOption('wrap', true)
            }
        })

        // input output toggle
        outputBtn.addEventListener('click', (e) => {
            if (outputBtn.classList.contains('active-terminal-btn'))
                return

            inputBtn.classList.remove('active-terminal-btn')
            outputBtn.classList.add('active-terminal-btn')

            inputDiv.classList.remove('show-terminal')
            outputDiv.classList.add('show-terminal')
        })

        inputBtn.addEventListener('click', (e) => {
            if (inputBtn.classList.contains('active-terminal-btn'))
                return

            outputBtn.classList.remove('active-terminal-btn')
            inputBtn.classList.add('active-terminal-btn')

            outputDiv.classList.remove('show-terminal')
            inputDiv.classList.add('show-terminal')
        })


        terminalBtn.addEventListener('click', (e) => {
            if (e.target.classList.contains('terminal-active')) {
                e.target.classList.remove('terminal-active')
                terminal.classList.remove('show-terminal-container')
            }
            else {
                e.target.classList.add('terminal-active')
                terminal.classList.add('show-terminal-container')
            }

            this.resizeAceEditor()
        })

        document.querySelector('.close-terminal-btn').addEventListener('click', () => {
            terminalBtn.classList.remove('terminal-active')
            terminal.classList.remove('show-terminal-container')

            this.resizeAceEditor()
        })

        // run code
        runBtn.addEventListener('click', async () => {
            // open terminal
            terminalBtn.classList.add('terminal-active')
            terminal.classList.add('show-terminal-container')
            this.resizeAceEditor()

            spinner.classList.add('show-spinner')
            outputDiv.innerHTML = "";

            const output = await this.piston.runCode(this.language, this.editor.getValue(), inputDiv.value)

            outputDiv.innerHTML = output;
            spinner.classList.remove('show-spinner')
        })

    }

    changeLanguage(label, mode, lang) {
        const modeSelector = document.querySelector('.mode-selector')
        this.language = lang
        modeSelector.querySelector('.label').textContent = label
        this.Session.setMode(`ace/mode/${mode}`)
    }
}
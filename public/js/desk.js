const userId = new Module.ObjectID().toString()
const userName = 'chaitanya'

const textDoc = Module.connection.get('text-editor', ROOM_ID)
const textEditor = new TextEditor('#textEditor', textDoc)

const codeDoc = Module.connection.get('code-editor', ROOM_ID)
const codeEditor = new CodeEditor('codeEditor', codeDoc)

let colors = {}

// initialize snapLayout
const snapLayout = new SnapLayout('.wrapper', {
    onSetActive: taskbarStatusSet
})

// presence setup 
function initTextEditorPresence() {
    const cursors = textEditor.quill.getModule('cursors')
    const presence = textDoc.connection.getDocPresence('text-editor', ROOM_ID)

    presence.subscribe(function (error) {
        if (error) throw error
    })

    const localPresence = presence.create(userId)

    textEditor.submitPresence((range) => {
        localPresence.submit(range, function (error) {
            if (error) throw error;
        })
    }, userName)

    presence.on('receive', function (id, range) {
        colors[id] = colors[id] || Module.tinycolor.random().toHexString();
        const name = (range && range.name) || 'Anonymous';

        if (!range) {
            try {
                cursors.removeCursor(id)
            } catch (err) {
                console.log(err);
            }
            return
        }

        cursors.createCursor(id, name, colors[id]);
        cursors.moveCursor(id, range);
    })
}


function initCodeEditorPresence() {
    const presence = codeDoc.connection.getDocPresence('code-editor', ROOM_ID)

    presence.subscribe(function (error) {
        if (error) throw error
    })

    const localPresence = presence.create(userId)

    const curMgr = new AceCollabExt.AceMultiCursorManager(codeEditor.Session)
    const selMgr = new AceCollabExt.AceMultiSelectionManager(codeEditor.Session)

    codeEditor.submitPresence((range) => {
        localPresence.submit(range, function (err) {
            if (err) throw err
        })
    }, userName)

    presence.on('receive', function (id, range) {
        if (id === userId) return

        colors[id] = colors[id] || Module.tinycolor.random().toHexString();
        const name = (range && range.name) || 'Anonymous';


        if (!range) {
            try {
                curMgr.removeCursor(id)
                selMgr.removeSelection(id)
            } catch (err) {
                console.log(err);
            }
            return
        }

        // set cursor
        try {
            curMgr.addCursor(id, name, colors[id], range.index)
        } catch (e) {
            curMgr.setCursor(id, range.index)
        }

        const start = codeEditor.aceDoc.indexToPosition(range.index)
        const end = codeEditor.aceDoc.indexToPosition(range.index + range.length)

        const selectedRanges = codeEditor.getSelectionRanges(start, end)

        if (!selectedRanges) return

        try {
            selMgr.addSelection(id, name, colors[id], selectedRanges);
        }
        catch (e) {
            selMgr.setSelection(id, selectedRanges)
        }
    })
}

function codeEditorFunctionality() {
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

    let language = 'javascript'
    modeSelector.addEventListener('click', (e) => {
        if (e.target && e.target.matches('.option')) {
            modeSelector.querySelector('.label').textContent = e.target.innerHTML
            const mode = e.target.getAttribute('mode')
            codeEditor.Session.setMode(`ace/mode/${mode}`)
            language = e.target.getAttribute('lang')
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
            codeEditor.editor.setOption('wrap', false)
        }
        else {
            e.target.classList.add('word-wrap-active')
            codeEditor.editor.setOption('wrap', true)
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

        codeEditor.resizeAceEditor()
    })

    document.querySelector('.close-terminal-btn').addEventListener('click', () => {
        terminalBtn.classList.remove('terminal-active')
        terminal.classList.remove('show-terminal-container')

        codeEditor.resizeAceEditor()
    })

    // run code
    runBtn.addEventListener('click', async () => {
        // open terminal
        terminalBtn.classList.add('terminal-active')
        terminal.classList.add('show-terminal-container')
        codeEditor.resizeAceEditor()

        spinner.classList.add('show-spinner')
        outputDiv.innerHTML = "";

        const output = await codeEditor.piston.runCode(language, codeEditor.editor.getValue(), inputDiv.value)

        outputDiv.innerHTML = output;
        spinner.classList.remove('show-spinner')
    })

}


function taskbarStatusSet(activeWindow, id) {
    // id of the 
    if (activeWindow)
        document.querySelector(`#${activeWindow.id}-icon`).querySelector(".status").classList.remove("active-icon")

    document.querySelector(`#${id}-icon`).querySelector(".status").classList.add("active-icon")
}
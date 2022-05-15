const ReconnectingWebSocket = require('reconnecting-websocket')
const sharedb = require('sharedb/lib/client')
const richText = require('rich-text')
const tinycolor = require('tinycolor2')
const ObjectID = require('bson-objectid')


sharedb.types.register(richText.type)

let colors = {}

const collection = 'code-editor'
const id = ROOM_ID
const userId = new ObjectID().toString()

const socket = new ReconnectingWebSocket('ws://' + window.location.host)
const connection = new sharedb.Connection(socket)

const doc = connection.get(collection, id);

let aceEditor;

function initializeCodeEditor() {
    doc.subscribe(function (err) {
        if (err) throw err;
        aceEditor = initialiseAce(doc);
    })
}


function resizeAceEditor() {
    if (aceEditor) {
        // set timeout is used to do the resizing after the animation is finished
        setTimeout(() => {
            aceEditor.resize()
            aceEditor.renderer.updateFull();
        }, 100);
    }
}


function initialiseAce(doc) {
    const editor = ace.edit("codeEditor")
    editor.setTheme("ace/theme/monokai")
    editor.session.setMode("ace/mode/javascript")
    editor.setOptions({
        enableMultiselect: false,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        autoScrollEditorIntoView: true,
    })

    const Session = editor.getSession()
    const aceDoc = Session.getDocument()

    let localChange = false;

    // to prevent changes made programatically to trigger on change event
    localChange = true
    applyOps(aceDoc, doc.data.ops)
    localChange = false

    Session.on("change", delta => {
        if (localChange) {
            // local changes so skip
            return
        }
        const op = aceToQuillDelta(aceDoc, delta)

        doc.whenNothingPending((err) => {
            if (err) {
                console.log(err);
                return
            }
            doc.submitOp(op)
        })
    })

    doc.on('op', (ops, source) => {
        if (source) {
            return
        }
        // to prevent changes made programatically to trigger on change event
        // change is a synchronus event in ace so this works
        localChange = true
        applyOps(aceDoc, ops.ops)
        localChange = false
    })


    // multi cursor setup
    const presence = doc.connection.getDocPresence(collection, id)

    presence.subscribe(function (error) {
        if (error) throw error;
    })

    const localPresence = presence.create(userId);

    const curMgr = new AceCollabExt.AceMultiCursorManager(editor.getSession())
    const selMgr = new AceCollabExt.AceMultiSelectionManager(editor.getSession())
    const Selection = Session.getSelection()
    const Range = ace.require("ace/range").Range

    Selection.on("changeCursor", () => {
        setTimeout(() => {
            const range = Selection.getRange()
            const selection = getSelection(range)

            if (!selection)
                return;

            // range.name = nameInput.value;
            localPresence.submit(selection, function (err) {
                if (err) throw err
            });

        }, 0)
    })

    presence.on('receive', function (id, range) {
        if (id === userId) return

        colors[id] = colors[id] || tinycolor.random().toHexString();
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
            curMgr.addCursor(id, name, colors[id], range.index);
        } catch (e) {
            curMgr.setCursor(id, range.index);
        }

        const start = aceDoc.indexToPosition(range.index)
        const end = aceDoc.indexToPosition(range.index + range.length)

        const selectedRanges = getSelectionRanges(start, end)

        if (!selectedRanges) return

        try {
            selMgr.addSelection(id, name, colors[id], selectedRanges);
        }
        catch (e) {
            selMgr.setSelection(id, selectedRanges)
        }
    })

    function getSelection(range) {
        const startPos = aceDoc.positionToIndex(range.start)
        const endPos = aceDoc.positionToIndex(range.end)

        return { index: startPos, length: endPos - startPos }
    }

    function getSelectionRanges(start, end) {
        let selectedRanges = []

        const nLines = end.row - start.row + 1;

        if (nLines === 1) {
            selectedRanges.push(new Range(start.row, start.column, end.row, end.column))
            return selectedRanges
        }

        let lastColumn;
        // first line
        lastColumn = Session.getDocumentLastRowColumn(start)
        selectedRanges.push(new Range(start.row, start.column, start.row, lastColumn))

        // middle lines
        for (let i = 1; i < nLines - 1; i++) {
            lastColumn = Session.getDocumentLastRowColumn(start.row + i, 0)
            selectedRanges.push(new Range(start.row + i, 0, start.row + i, lastColumn))
        }

        // last lines
        selectedRanges.push(new Range(end.row, 0, end.row, end.column))

        return selectedRanges;
    }

    return editor
}


function aceToQuillDelta(aceDoc, delta) {
    let ops = []
    // if operation is performed on 0th index skip retain
    if (delta.start.row !== 0 || delta.start.column !== 0) {
        let retainOp = {}
        const pos = aceDoc.positionToIndex(delta.start)
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

    return { ops }
}

function QuillToAceDelta(aceDoc, ops) {
    let deltas = [];
    let pointer = 0;

    ops.forEach(operation => {
        let delta = {}

        delta.start = aceDoc.indexToPosition(pointer) || { row: 0, column: 0 }
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
            // initialize accumulater with lines.length - 1 to take '\n' into account
            const count = operation.delete
            delta.end = aceDoc.indexToPosition(pointer + count)
            pointer += count
            deltas.push(delta)
        }
    })

    return deltas
}


function applyOps(aceDoc, ops) {
    // converts the ops provided by shareDB doc 'op' event to Ace delta and applies them
    const deltas = QuillToAceDelta(aceDoc, ops)
    // apply the deltas
    aceDoc.applyDeltas(deltas)
}


module.exports = { initializeCodeEditor, resizeAceEditor }

const userId = new Module.ObjectID().toString()
const userName = 'chaitanya'

const textDoc = Module.connection.get('text-editor', ROOM_ID)
const textEditor = new TextEditor('#textEditor', textDoc)

const codeDoc = Module.connection.get('code-editor', ROOM_ID)
const codeEditor = new CodeEditor('codeEditor', codeDoc)

// initialize snapLayout
const snapLayout = new SnapLayout('.wrapper', {
    onSetActive: taskbarStatusSet
})

let colors = {}

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


function taskbarStatusSet(activeWindow, id) {
    // id of the 
    if (activeWindow)
        document.querySelector(`#${activeWindow.id}-icon`).querySelector(".status").classList.remove("active-icon")

    document.querySelector(`#${id}-icon`).querySelector(".status").classList.add("active-icon")
}
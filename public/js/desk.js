const userId = new Module.ObjectID().toString()
const userName = 'chaitanya'

const TEXT_EDITOR_COLLECTION = 'text-editor'
const CODE_EDITOR_COLLECTION = 'code-editor'

const presence = new Presence(userId, userName, ROOM_ID)

const textDoc = Module.connection.get(TEXT_EDITOR_COLLECTION, ROOM_ID)
const codeDoc = Module.connection.get(CODE_EDITOR_COLLECTION, ROOM_ID)

const textEditor = new TextEditor('#textEditor', textDoc)
const codeEditor = new CodeEditor('codeEditor', codeDoc)

// initialize snapLayout
const snapLayout = new SnapLayout('.wrapper', {
    onSetActive: taskbarStatusSet
})

function taskbarStatusSet(activeWindow, id) {
    // id of the 
    if (activeWindow)
        document.querySelector(`#${activeWindow.id}-icon`).querySelector(".status").classList.remove("active-icon")

    document.querySelector(`#${id}-icon`).querySelector(".status").classList.add("active-icon")
}
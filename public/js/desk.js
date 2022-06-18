const userId = new Module.ObjectID().toString()
const userName = 'chaitanya'
const socket = Module.io()

const TEXT_EDITOR_COLLECTION = 'text-editor'
const CODE_EDITOR_COLLECTION = 'code-editor'
const DRAWING_PAD_COLLECTION = 'drawing-pad'

const presence = new Presence(userId, userName, ROOM_ID)

const textDoc = Module.connection.get(TEXT_EDITOR_COLLECTION, ROOM_ID)
const codeDoc = Module.connection.get(CODE_EDITOR_COLLECTION, ROOM_ID)
const drawingDoc = Module.connection.get(DRAWING_PAD_COLLECTION, ROOM_ID)


const textEditor = new TextEditor('#textEditor', textDoc)
const codeEditor = new CodeEditor('codeEditor', codeDoc)
const drawingPad = new DrawingPad('canvas', drawingDoc)

// initialize snapLayout
const snapLayout = new SnapLayout('.wrapper')

// initialize components
const textEditorOptions = {
    onCreation: () => {
        textEditor.initializeTextEditor(() => {
            presence.subscribe(TEXT_EDITOR_COLLECTION, textEditor)
        })
    },
    onClose: () => {
        socket.emit('leave-text-editor', userId)
    }
}

snapLayout.createWindow("Text-Editor", textEditorOptions)

const codeEditorOptions = {
    onCreation: () => {
        codeEditor.initializeCodeEditor(() => {
            presence.subscribe(CODE_EDITOR_COLLECTION, codeEditor)
        })
    },
    onResize: () => {
        codeEditor.resizeAceEditor()
    },
    onClose: () => {
        socket.emit('leave-code-editor', userId)
    }
}

snapLayout.createWindow("Code-Editor", codeEditorOptions)

const drawingPadOptions = {
    onCreation: () => {
        drawingPad.initializeDrawingPad()
    }
}


snapLayout.createWindow("WhiteBoard", drawingPadOptions)
snapLayout.createWindow("Video-stream")



// socket events
socket.emit('join-room', ROOM_ID, userId)

socket.on('user-joined', id => {
    console.log('user-joined', id)
})

socket.on('user-disconnected', id => {
    console.log('user-disconnected', id)
})

socket.on('left-text-editor', id => {
    console.log('left text editor', id);
    textEditor.removeUser(id)
})

socket.on('left-code-editor', id => {
    console.log('left code editor', id);
    codeEditor.removeUser(id)
})

socket.on('change-language', (label, mode, lang) => {
    codeEditor.changeLanguage(label, mode, lang)
})
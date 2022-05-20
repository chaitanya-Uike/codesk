import { qs } from './utils.js'


const textEditorIcon = qs("#Text-Editor-icon")
const whiteBoardIcon = qs("#WhiteBoard-icon")
const codeEditorIcon = qs("#Code-Editor-icon")
const videoStreamIcon = qs("#Video-stream-icon")


textEditorIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["Text-Editor"]) {
        snapLayout.setActive("Text-Editor")
    }
    else {
        const options = {
            onCreation: () => {
                textEditor.initializeTextEditor(() => {
                    presence.subscribe(TEXT_EDITOR_COLLECTION, textEditor)
                })
            }
        }

        snapLayout.createWindow("Text-Editor", options)
        textEditorIcon.querySelector(".status").classList.add("open")
    }
})

whiteBoardIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["WhiteBoard"]) {
        snapLayout.setActive("WhiteBoard")
    }
    else {
        snapLayout.createWindow("WhiteBoard", "")
        whiteBoardIcon.querySelector(".status").classList.add("open")
    }
})

codeEditorIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["Code-Editor"]) {
        snapLayout.setActive("Code-Editor")
    }
    else {
        const options = {
            onCreation: () => {
                codeEditor.initializeCodeEditor(() => {
                    presence.subscribe(CODE_EDITOR_COLLECTION, codeEditor)
                })
            },
            onResize: () => {
                codeEditor.resizeAceEditor()
            }
        }

        snapLayout.createWindow("Code-Editor", options)
        codeEditorIcon.querySelector(".status").classList.add("open")
    }
})

videoStreamIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["Video-stream"]) {
        snapLayout.setActive("Video-stream")
    }
    else {
        snapLayout.createWindow("Video-stream")
        videoStreamIcon.querySelector(".status").classList.add("open")
    }
})
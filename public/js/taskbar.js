import { qs } from './utils.js'


const textEditorIcon = qs("#Text-Editor-icon")
const whiteBoardIcon = qs("#WhiteBoard-icon")
const codeEditorIcon = qs("#Code-Editor-icon")
const videoStreamIcon = qs("#Video-stream-icon")


textEditorIcon.addEventListener("click", () => {
    if (textEditorIcon.querySelector(".status").classList.contains("open")) {
        snapLayout.setActive("Text-Editor")
    }
    else {
        snapLayout.openWindow("Text-Editor")
        textEditorIcon.querySelector(".status").classList.add("open")
    }
})

whiteBoardIcon.addEventListener("click", () => {
    if (whiteBoardIcon.querySelector(".status").classList.contains("open")) {
        snapLayout.setActive("WhiteBoard")
    }
    else {
        snapLayout.openWindow("WhiteBoard")
        whiteBoardIcon.querySelector(".status").classList.add("open")
    }
})

codeEditorIcon.addEventListener("click", () => {
    if (codeEditorIcon.querySelector(".status").classList.contains("open")) {
        snapLayout.setActive("Code-Editor")
    }
    else {
        snapLayout.openWindow("Code-Editor")
        codeEditorIcon.querySelector(".status").classList.add("open")
    }
})

videoStreamIcon.addEventListener("click", () => {
    if (videoStreamIcon.querySelector(".status").classList.contains("open")) {
        snapLayout.setActive("Video-stream")
    }
    else {
        snapLayout.openWindow("Video-stream")
        videoStreamIcon.querySelector(".status").classList.add("open")
    }
})
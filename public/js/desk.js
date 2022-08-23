const submitBtn = document.getElementById("submitBtn");
const userNameInput = document.querySelector("#usernameInput");
const blurDiv = document.querySelector(".blurDiv");

const socket = Module.io();
const userId = new Module.ObjectID().toString();
const presence = new Presence(userId, "", ROOM_ID);

submitBtn.addEventListener("click", () => {
  presence.userInfo.userName = userNameInput.value;
  blurDiv.style.display = "none";
});

// submit btn animation handler

submitBtn.addEventListener("mouseenter", (e) => {
  e.target.classList.remove("submit-mouse-out");
  e.target.classList.add("submit-mouse-in");
});

submitBtn.addEventListener("mouseleave", (e) => {
  e.target.classList.remove("submit-mouse-in");
  e.target.classList.add("submit-mouse-out");
});

const wait = (delay = 0) => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

window.addEventListener("load", () => {
  wait(2000).then(() => {
    document.getElementById("main-loader").style.display = "none";
  });
});

const TEXT_EDITOR_COLLECTION = "text-editor";
const CODE_EDITOR_COLLECTION = "code-editor";
const DRAWING_PAD_COLLECTION = "drawing-pad";

// connect all the editors to shareDB docs
const textDoc = Module.connection.get(TEXT_EDITOR_COLLECTION, ROOM_ID);
const codeDoc = Module.connection.get(CODE_EDITOR_COLLECTION, ROOM_ID);
const drawingDoc = Module.connection.get(DRAWING_PAD_COLLECTION, ROOM_ID);

const textEditor = new TextEditor(
  "#textEditor",
  textDoc,
  presence,
  TEXT_EDITOR_COLLECTION
);
const codeEditor = new CodeEditor(
  "codeEditor",
  codeDoc,
  presence,
  CODE_EDITOR_COLLECTION
);
const drawingPad = new DrawingPad("canvas", drawingDoc, presence);

// initialize snapLayout
const snapLayout = new SnapLayout(".wrapper");

// initialize components
const textEditorOptions = {
  onCreation: () => {
    textEditor.initializeTextEditor();
  },
  onClose: () => {
    socket.emit("leave-text-editor", userId);
  },
};

const codeEditorOptions = {
  onCreation: () => {
    codeEditor.initializeCodeEditor();
  },
  onResize: () => {
    codeEditor.resizeAceEditor();
  },
  onClose: () => {
    socket.emit("leave-code-editor", userId);
  },
};

const drawingPadOptions = {
  onCreation: () => {
    drawingPad.initializeDrawingPad();
  },
};

snapLayout.createWindow("Text-Editor", textEditorOptions);
snapLayout.createWindow("Code-Editor", codeEditorOptions);
snapLayout.createWindow("WhiteBoard", drawingPadOptions);
snapLayout.createWindow("Video-stream");

// socket events
socket.emit("join-room", ROOM_ID, userId);

socket.on("user-joined", (id) => {
  console.log("user-joined", id);
});

socket.on("user-disconnected", (id) => {
  console.log("user-disconnected", id);
});

socket.on("left-text-editor", (id) => {
  console.log("left text editor", id);
  textEditor.removeUser(id);
});

socket.on("left-code-editor", (id) => {
  console.log("left code editor", id);
  codeEditor.removeUser(id);
});

socket.on("change-language", (label, mode, lang) => {
  codeEditor.changeLanguage(label, mode, lang);
});

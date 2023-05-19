const submitBtn = document.getElementById("submitBtn");
const userNameInput = document.querySelector("#usernameInput");
const blurDiv = document.querySelector(".blurDiv");

const socket = Module.io();
const userId = new Module.ObjectID().toString();
const presence = new Presence(userId, "", ROOM_ID);

submitBtn.addEventListener("click", () => {
  presence.userName = userNameInput.value;
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






const AGORA_APP_ID = "d7881b21fa6d41b4a803fadca983c29e";
const CHANNEL = window.location.pathname.replace("/", "");
let TOKEN;
let UID;
let audioBtn
let videoBtn
let audioIcon
let videoIcon

const client = AgoraRTC.createClient({
  mode: "rtc",
  codec: "vp8"
});

// AgoraRTC.setLogLevel(4);

let audioTrack;
let videoTrack;
let remoteUsers = {};

async function fetchCred() {
  let response = await fetch(`/getToken/${CHANNEL}`);
  let data = await response.json();

  TOKEN = data.token;
  UID = Number(data.uid);
}

async function joinAndDisplayLocalStream() {
  client.on('user-published', handleUserJoined);
  client.on('user-left', handleUserLeft);

  await fetchCred();

  await client.join(AGORA_APP_ID, CHANNEL, TOKEN, UID);

  audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  videoTrack = await AgoraRTC.createCameraVideoTrack();

  let player = `
  <div  class="video-cell" id="user-container-${UID}">
    <div class="video-element" id="user-${UID}"></div>
  </div>`;

  document.querySelector('.video-grid').insertAdjacentHTML('beforeend', player);
  videoTrack.play(`user-${UID}`);

  audioBtn.disabled = false;
  videoBtn.disabled = false;
  await delay(1);
  await client.publish([audioTrack, videoTrack]);
}

async function handleUserJoined(user, mediaType) {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`user-container-${user.uid}`)
    if (player != null) {
      player.remove();
    }

    player = `
    <div class="video-cell" id="user-container-${user.uid}">
      <div class="video-element" id="user-${user.uid}"></div>
    </div>`;

    document.querySelector('.video-grid').insertAdjacentHTML('beforeend', player);
    user.videoTrack.play(`user-${user.uid}`);

  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

async function handleUserLeft(user) {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
}

const videoChatOptions = {
  onCreation: () => {
    audioBtn = document.getElementById("audio-btn");
    videoBtn = document.getElementById("video-btn");
    audioIcon = document.getElementById("audio_icon");
    videoIcon = document.getElementById("video_icon");

    audioBtn.addEventListener("click", async () => {
      if (audioIcon.innerHTML === "mic_off") {
        audioIcon.innerHTML = "mic";
        audioBtn.style.backgroundColor = '#3be8b0';
        audioBtn.style.color = 'black';
      }
      else {
        audioIcon.innerHTML = "mic_off";
        audioBtn.style.backgroundColor = '#e22929';
        audioBtn.style.color = 'white';
      }

      // Check if audio track exists
      if (audioTrack.muted) {
        await audioTrack.setMuted(false);
      } else {
        await audioTrack.setMuted(true);
      }
    })

    videoBtn.addEventListener("click", async () => {
      if (videoTrack.enabled) {
        videoIcon.innerHTML = "videocam_off";
        videoBtn.style.backgroundColor = '#e22929';
        videoBtn.style.color = 'white';
        await videoTrack.setEnabled(false);
      } else {
        videoIcon.innerHTML = "videocam";
        videoBtn.style.backgroundColor = '#3be8b0';
        videoBtn.style.color = 'black';
        await videoTrack.setEnabled(true);
      }
    })

    joinAndDisplayLocalStream()
  }
}

snapLayout.createWindow("Text-Editor", textEditorOptions);
snapLayout.createWindow("Code-Editor", codeEditorOptions);
snapLayout.createWindow("WhiteBoard", drawingPadOptions);
snapLayout.createWindow("Video-stream", videoChatOptions);

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

function delay(n) {
  return new Promise(function (resolve) {
    setTimeout(resolve, n * 1000);
  });
}

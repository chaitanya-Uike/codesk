const env = process.env.NODE_ENV || "development";

if (env === "development") {
  require("dotenv").config();
}

const http = require("http");
const express = require("express");
const shareDB = require("sharedb");
const richText = require("rich-text");
// for shareDB we need ws
const WebSocket = require("ws");
const WebSocketJSONStream = require("@teamwork/websocket-json-stream");
const { v4: uuidv4 } = require("uuid");

// installing mongoDB adapter for shareDB
const db = require("sharedb-mongo")(process.env.MONGO_URI);

shareDB.types.register(richText.type);

const backend = new shareDB({
  db: db,
  presence: true,
  doNotForwardSendPresenceErrorsToClient: true,
});

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("node_modules/quill/dist"));
app.use(express.static("node_modules/ace-builds"));
app.use(express.json());

const server = http.createServer(app);

const connection = backend.connect();

app.get("/", function (req, res) {
  const roomId = uuidv4();
  return res.redirect(`/${roomId}`);
});

app.get("/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  // create a new text document
  const textDoc = connection.get("text-editor", roomId);
  // fetch the document state
  textDoc.fetch(function (err) {
    if (err) return res.status(500).json({ msg: err });

    // if document does not exist, create it
    if (textDoc.type === null) {
      textDoc.create(
        [
          {
            insert: "Compose an Epic...",
            attributes: { italic: true, font: "playfair" },
          },
        ],
        "rich-text"
      );
    }
  });

  // create a new code document
  const codeDoc = connection.get("code-editor", roomId);
  // fetch the document state
  codeDoc.fetch(function (err) {
    if (err) return res.status(500).json({ msg: err });

    // if document does not exist, create it
    if (codeDoc.type === null) {
      codeDoc.create([{ insert: "" }], "rich-text");
    }
  });

  // create a new drawingDoc
  const doc = connection.get("drawing-pad", roomId);
  // fetch the document state
  doc.fetch(function (err) {
    if (err) return res.status(500).json({ msg: err });

    // if document does not exist, create it
    if (doc.type === null) {
      doc.create({ canvas: [] });
    }
  });

  return res.render("desk", { roomId });
});

const io = require("socket.io")(server);
const wss = new WebSocket.Server({ server: server });

/*
    **VIMP
    to run socket.io and ws on single HTTP server we need to handle the upgrade event of our httpServer manually by removing the one added by socket.io
*/
// remove the 'upgrade' events from our httpServer
server.removeAllListeners("upgrade");
server.on("upgrade", function (req, socket, head) {
  // if request is from socket.io
  if (req.url.indexOf("socket.io") > -1) {
    io.engine.handleUpgrade(req, socket, head);
  } else {
    // if request is from wss
    wss.handleUpgrade(req, socket, head, (webSocket) => {
      wss.emit("connection", webSocket, req);
    });
  }
});

// for adding user info to the op
backend.use("afterWrite", (context, next) => {
  if (context.collection !== "drawing-pad") return;

  if (context && context.op && context.op.op)
    context.op.op.forEach((op) => {
      op.lastUpdatedBy = context.extra.source;
    });
  next();
});

wss.on("connection", (ws) => {
  const stream = new WebSocketJSONStream(ws);
  backend.listen(stream);
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);

    socket.broadcast.to(roomId).emit("user-joined", userId);

    socket.on("leave-text-editor", (id) => {
      socket.broadcast.to(roomId).emit("left-text-editor", id);
    });

    socket.on("leave-code-editor", (id) => {
      socket.broadcast.to(roomId).emit("left-code-editor", id);
    });

    socket.on("language-changed", (label, mode, lang) => {
      socket.broadcast.to(roomId).emit("change-language", label, mode, lang);
    });

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, console.log(`Server is Listening on port ${PORT}`));

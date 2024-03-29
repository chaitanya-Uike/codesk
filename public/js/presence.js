class Presence {
  constructor(userId, userName, roomId) {
    this.userId = userId;
    this.userName = userName || "Guest";
    this.roomId = roomId;
    this.colors = {};
  }

  subscribe(editor) {
    const presence = editor.doc.connection.getDocPresence(
      editor.collection,
      this.roomId
    );

    presence.subscribe(function (error) {
      if (error) throw error;
    });

    const localPresence = presence.create(this.userId);

    editor.submitPresence(localPresence);

    presence.on("receive", (id, range) => {
      this.colors[id] =
        this.colors[id] || Module.tinycolor.random().toHexString();

      editor.recievePresence(id, range, this.colors[id]);
    });
  }
}

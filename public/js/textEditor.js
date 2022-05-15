const ReconnectingWebSocket = require('reconnecting-websocket')
const sharedb = require('sharedb/lib/client')
const richText = require('rich-text')
const Quill = require('quill')
const QuillCursors = require('quill-cursors')
const tinycolor = require('tinycolor2')
const ObjectID = require('bson-objectid')

sharedb.types.register(richText.type)
Quill.register('modules/cursors', QuillCursors)

let colors = {}

const collection = 'text-editor'
const id = ROOM_ID
const presenceId = new ObjectID().toString()

const socket = new ReconnectingWebSocket('ws://' + window.location.host);
const connection = new sharedb.Connection(socket)

const doc = connection.get(collection, id);

let quill = null;

function initializeTextEditor() {
    doc.subscribe(function (err) {
        if (err) throw err;
        quill = initialiseQuill(doc);
    })
}

const Font = Quill.import("formats/font")
const Size = Quill.import('attributors/style/size');

// register fonts
Font.whitelist = [
    "arial",
    "roboto",
    "montserrat",
    "helvetica",
    "poppins",
    "merriweather",
    "playfair"
]
Quill.register(Font, true)

// register font sizes
const fontSizes = ['14px', '16px', '18px', '22px', '28px', '36px']
Size.whitelist = fontSizes;
Quill.register(Size, true);

function initialiseQuill(doc) {
    const quill = new Quill('#textEditor', {
        theme: 'snow',
        modules: {
            toolbar: '#toolbar',
            cursors: true
        },
    });

    // change the link placeholder to www.github.com
    const tooltip = quill.theme.tooltip;
    const input = tooltip.root.querySelector("input[data-link]");
    input.dataset.link = 'www.wave-editor.com';

    quill.setContents(doc.data);

    quill.on('text-change', function (delta, oldDelta, source) {
        if (source !== 'user') return;
        doc.submitOp(delta);
    });

    doc.on('op', function (op, source) {
        if (source) return;
        quill.updateContents(op);
    });

    // initializing multi cursors
    const cursors = quill.getModule('cursors');

    const presence = doc.connection.getDocPresence(collection, id);

    presence.subscribe(function (error) {
        if (error) throw error;
    });

    const localPresence = presence.create(presenceId);

    quill.on('selection-change', function (range, oldRange, source) {

        if (source !== 'user') return;

        if (!range) return;

        // range.name = nameInput.value;
        localPresence.submit(range, function (error) {
            if (error) throw error;
        });
    });

    presence.on('receive', function (id, range) {
        colors[id] = colors[id] || tinycolor.random().toHexString();
        var name = (range && range.name) || 'Anonymous';

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

    return quill
}

module.exports = { initializeTextEditor }
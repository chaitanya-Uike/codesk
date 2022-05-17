const ReconnectingWebSocket = require('reconnecting-websocket')
const sharedb = require('sharedb/lib/client')
const richText = require('rich-text')
const Quill = require('quill')
const QuillCursors = require('quill-cursors')
const tinycolor = require('tinycolor2')
const ObjectID = require('bson-objectid')

// register rich text
sharedb.types.register(richText.type)

// initializing sharedb and getting connection object
const socket = new ReconnectingWebSocket('ws://' + window.location.host);
const connection = new sharedb.Connection(socket)

// Quill setup
Quill.register('modules/cursors', QuillCursors)
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

module.exports = {
    connection,
    Quill,
    tinycolor,
    ObjectID
}
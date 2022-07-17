class TextEditor {
    constructor(selector, doc) {
        this.selector = selector
        this.doc = doc
        this.quill = null
        this.cursors = null
    }

    initializeTextEditor(callback) {
        this.doc.subscribe((err) => {
            if (err)
                throw err;
            this.initializeQuill()
            callback()
        })
    }

    initializeQuill() {
        this.quill = new Module.Quill(this.selector, {
            theme: 'snow',
            modules: {
                toolbar: '#toolbar',
                cursors: true
            },
        })

        this.cursors = this.quill.getModule('cursors')

        this.setupTooltip()

        // this.quill.setContents(this.doc.data)


        this.quill.updateContents([{ insert: 'c' }])
        this.quill.updateContents([{ insert: 'const' }, { delete: 1 }])

        this.submitLocalChanges()

        this.listenAndupdateContent()
    }

    setupTooltip() {
        // change the default link shown in quill tooltip
        const tooltip = this.quill.theme.tooltip;
        const input = tooltip.root.querySelector("input[data-link]");
        input.dataset.link = 'www.codesk.com';
    }

    submitLocalChanges() {
        // submit local changes ignore programatically made changes

        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source !== 'user')
                return
            this.doc.submitOp(delta)
        })
    }

    listenAndupdateContent() {
        this.doc.on('op', (op, source) => {
            // source is falsy if local change is made
            if (source)
                return

            this.quill.updateContents(op)
        })
    }

    submitPresence(localPresence, userName) {
        this.quill.on('selection-change', (range, oldRange, source) => {

            if (source !== 'user') return;

            if (!range) return;

            range.name = userName

            localPresence.submit(range, function (error) {
                if (error) throw error;
            })
        })
    }

    recievePresence(id, range, color) {
        // null range means that the user left, remove that users cursor
        if (!range) {
            try {
                this.cursors.removeCursor(id)
            } catch (err) {
                console.log(err)
            }
            return
        }

        const name = range.name || 'Anonymous';

        this.cursors.createCursor(id, name, color)
        this.cursors.moveCursor(id, range)
    }

    removeUser(id) {
        try {
            this.cursors.removeCursor(id)
        } catch (err) {
            console.log(err)
        }
    }
}
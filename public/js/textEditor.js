class TextEditor {
    constructor(selector, doc) {
        this.selector = selector;
        this.doc = doc
        this.quill = null
    }

    initializeTextEditor() {
        this.doc.subscribe((err) => {
            if (err) throw err;
            this.initializeQuill()
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

        this.setupTooltip()

        this.quill.setContents(this.doc.data)

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

    submitPresence(submissionHandler, name) {
        this.quill.on('selection-change', (range, oldRange, source) => {

            if (source !== 'user') return;

            if (!range) return;

            range.name = name
            submissionHandler(range)
        });
    }
}
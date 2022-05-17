class SnapLayout {
    constructor(selector, options) {

        this.wrapper = qs(selector)

        this.contents = {}

        this.getContentsFromHTML()

        this.wrapperHeight = this.wrapper.clientHeight
        this.wrapperWidth = this.wrapper.clientWidth

        this.defaultWindowWidth = options.defaultWindowWidth || 700
        this.defaultWindowHeight = options.defaultWindowHeight || 500

        this.minWindowWidth = options.minWindowWidth || 245
        this.minWindowHeight = options.minWindowHeight || 50

        this.initialPositionTop = options.initialPositionTop || this.wrapperHeight / 2 - this.defaultWindowHeight / 2
        this.initialPositionLeft = options.initialPositionLeft || this.wrapperWidth / 2 - this.defaultWindowWidth / 2

        this.xDiv = options.xDiv || 0.5
        this.yDiv = options.yDiv || 0.5

        this.windowsList = {}
        this.activeWindow

        this.snapRange = options.snapRange || {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10,
        }

        this.layout = {
            'top': null,
            'right': null,
            'bottom': null,
            'left': null,
            'top-right': null,
            'bottom-right': null,
            'bottom-left': null,
            'top-left': null,
        }

        this.onSetActive = options.onSetActive

        this.attachObserver()

        this.removeWrapperListener()
    }

    getContentsFromHTML() {
        // read the wrapper container and find elements to create windows
        const children = [...this.wrapper.children]
        children.forEach(child => {
            const id = child.id
            this.contents[id] = child.innerHTML
            child.remove()
        })
    }

    attachObserver() {

        const observer = new ResizeObserver((entries) => {
            this.wrapperHeight = entries[0].contentRect.height
            this.wrapperWidth = entries[0].contentRect.width

            this.initialPositionTop = this.wrapperHeight / 2 - this.defaultWindowHeight / 2
            this.initialPositionLeft = this.wrapperWidth / 2 - this.defaultWindowWidth / 2

            // update the snap previews
            this.updateSnapPreview()
            //  update the resizer
            this.updateLayoutResizer()
            // resize the windows
            this.resizeWindows()
            // bring windows inside the wrapper
            this.moveWindowInsideScreen()
        })

        observer.observe(this.wrapper)
    }

    createWindow(id, options) {
        /*
            options = {
                body : string describing the body of the window, if not provided will use the element with given id
                afterCreation : function(), called after creation of window
                resizer : function(), called after window is resozed
            }
        
        */
        if (options && !options.body && !this.contents[id]) {
            throw new Error('Either provide options.body or create a HTML element inside the wrapper with given id and class "sl-window"')
        }

        const div = document.createElement("div")
        div.className = "draggable-div"
        div.id = id

        let body;
        if (options && options.body)
            body = options.body
        else {
            body = this.contents[id]
        }

        div.innerHTML = `
        <div id="${id}-header" class="header">
            <div class="title">${id}</div>
            <div class="size-control">
                <div class="toggleWindow max"></div>
                <div class="close"></div>
            </div>
        </div>
        <div id="${id}-body" class="body">${body}</div>`

        div.style.width = this.defaultWindowWidth + "px"
        div.style.height = this.defaultWindowHeight + "px"

        div.style.minHeight = this.minWindowHeight + "px"
        div.style.minWidth = this.minWindowWidth + "px"

        div.style.top = this.initialPositionTop + "px"
        div.style.left = this.initialPositionLeft + "px"

        this.addDragFunc(div)
        this.addResizeFunc(div)
        this.addToggleAndCloseFunc(div)

        let window = {
            'div': div,
            'snapTo': snapPos.none,
            'snappedTo': snapPos.none,
            'maximised': false,
        }

        // resizer callback for when the window is resized
        if (options && options.resizer) {
            const observer = new ResizeObserver(options.resizer).observe(div)
        }

        div.style.zIndex = Object.keys(this.windowsList).length * 2

        this.windowsList[id] = window

        this.setActive(id)

        this.wrapper.appendChild(div)

        if (options && options.afterCreation) options.afterCreation()

    }

    addDragFunc(div) {
        let prevX, prevY, dx, dy

        const dragWindow = (e) => {

            e.preventDefault()

            // remove resizers while dragging
            qsa('.resizer').forEach(resizer => {
                resizer.style.display = ""
            })

            // bring the window to the cursor position if it's snapped
            this.pullWindow(e, this.windowsList[div.id])


            dx = e.clientX - prevX
            dy = e.clientY - prevY

            prevX = e.clientX
            prevY = e.clientY

            // use this to change the lower bound of wrapper
            let headerHeight = qs('.header').clientHeight

            // prevent the div from getting out of bounds of the wrapper
            if (div.offsetTop + dy <= this.wrapper.offsetTop + (this.wrapperHeight - headerHeight) && div.offsetTop + dy >= this.wrapper.offsetTop)
                div.style.top = (div.offsetTop + dy) + "px"
            if (div.offsetLeft + dx <= this.wrapper.offsetLeft + (this.wrapperWidth - this.defaultWindowWidth) && div.offsetLeft + dx >= this.wrapper.offsetLeft)
                div.style.left = (div.offsetLeft + dx) + "px"

            this.displaySnapPreview(this.windowsList[div.id])
        }

        const stopDragging = () => {
            this.wrapper.onmousemove = null
            this.wrapper.onmouseup = null

            // add resizers after dragging is done
            this.resetLayoutResizer()

            qs('.header', div).style.cursor = 'grab'

            if (this.windowsList[div.id].snapTo == snapPos.none)
                return

            this.removeBorderRadius(this.windowsList[div.id])
            this.snapwindow(this.windowsList[div.id], this.windowsList[div.id].snapTo)
        }

        const startDragging = (e) => {
            prevX = e.clientX
            prevY = e.clientY

            this.setActive(div.id)

            qs('.header', div).style.cursor = 'grabbing'

            this.wrapper.onmousemove = dragWindow
            this.wrapper.onmouseup = stopDragging
        }

        // drag the header to move the window
        qs('.header', div).onmousedown = startDragging
    }

    addResizeFunc(div) {
        // function to add the resize class and remove the animations while resizing
        set(div, "resizable")

        let allowResize = false

        div.addEventListener("mousemove", e => {

            let { x, y } = this.relativeCoords(e, div)

            // buffer of 10px added
            if (x >= div.clientWidth - 10 && y >= div.clientHeight - 10) {
                allowResize = true
            }
            else {
                allowResize = false
            }
        })

        div.addEventListener("mousedown", e => {
            if (allowResize) {
                // remove the animation to prevent delay while resizing
                unset(div, "animation")
                this.setActive(div.id)
            }
        })

        div.addEventListener("mouseup", e => {
            set(div, "animation")
        })
    }

    addToggleAndCloseFunc(div) {
        div.addEventListener("click", e => {

            this.setActive(div.id)

            if (e.target && e.target.matches("div.toggleWindow")) {
                set(div, "animation")

                if (this.windowsList[div.id].maximised) {
                    if (this.windowsList[div.id].snappedTo != snapPos.none) {
                        this.layout[this.windowsList[div.id].snappedTo] = this.windowsList[div.id]
                        this.snapwindow(this.windowsList[div.id], this.windowsList[div.id].snappedTo)
                    }
                    else {
                        div.style.width = this.defaultWindowWidth + "px"
                        div.style.height = this.defaultWindowHeight + "px"

                        div.style.top = this.initialPositionTop + "px";
                        div.style.left = this.initialPositionLeft + "px"

                        this.setBorderRadius(this.windowsList[div.id])
                    }

                    this.resetLayoutResizer()

                    div.querySelector(".toggleWindow").classList.add("max")
                    div.querySelector(".toggleWindow").classList.remove("min")

                    this.windowsList[div.id].maximised = false
                }
                else {

                    if (this.windowsList[div.id].snappedTo != snapPos.none)
                        this.layout[this.windowsList[div.id].snappedTo] = null
                    div.style.top = "0"
                    div.style.left = "0"
                    div.style.width = this.wrapperWidth + "px"
                    div.style.height = this.wrapperHeight + "px"

                    this.removeBorderRadius(this.windowsList[div.id])


                    div.querySelector(".toggleWindow").classList.add("min")
                    div.querySelector(".toggleWindow").classList.remove("max")

                    this.windowsList[div.id].maximised = true

                    this.resetLayoutResizer()
                }
            }


            if (e.target && e.target.matches("div.close")) {
                // free it's this.layout space
                if (this.windowsList[div.id].snappedTo != snapPos.none)
                    this.layout[this.windowsList[div.id].snappedTo] = null

                document.querySelector(`#${div.id}-icon`).querySelector(".status").classList.remove("open")

                // reduce the zindex of all windows with higher zindex
                let temp = parseInt(window.getComputedStyle(div).zIndex)
                for (let divID in this.windowsList) {
                    let zIndex = parseInt(window.getComputedStyle(this.windowsList[divID].div).zIndex)
                    if (zIndex > temp) {
                        this.windowsList[divID].div.style.zIndex = zIndex - 2
                    }
                }

                // remove from dom
                div.remove()

                // remove from windows list
                delete this.windowsList[div.id]

                this.resetLayoutResizer()
            }
        })
    }

    // By default javascript bubbles the event onto the child elements to get the correct coordinates of the parent use this function
    relativeCoords(event, div) {
        var bounds = div.getBoundingClientRect();
        var x = event.clientX - bounds.left;
        var y = event.clientY - bounds.top;
        return { x: x, y: y };
    }

    pullWindow(e, window) {
        window.div.classList.add("animation")

        // If window snapped to Top or maximised
        if (window.snappedTo != snapPos.none || window.maximised) {
            this.layout[window.snappedTo] = null
            window.div.classList.add("resizable")

            window.snappedTo = snapPos.none
            window.maximised = false
            this.resetLayoutResizer()

            // set the window to default size and pull it to the mouse click position
            window.div.style.width = this.defaultWindowWidth + "px"
            window.div.style.height = this.defaultWindowHeight + "px"

            // remove any position value 
            window.div.style.left = ""
            window.div.style.right = ""


            // if it gets out of bounds on the left side
            if (e.offsetX - this.defaultWindowWidth / 2 <= this.wrapper.offsetLeft)
                window.div.style.left = this.wrapper.offsetLeft + "px"
            // if it gets out of bounds on the right side
            else if (e.offsetX + this.defaultWindowWidth >= this.wrapperWidth)
                window.div.style.left = this.wrapperWidth - this.defaultWindowWidth + "px"
            // normal case
            else
                window.div.style.left = e.offsetX - this.defaultWindowWidth / 2 + "px"

            this.setBorderRadius(window)

            // set the toggle button to max
            window.div.querySelector(".toggleWindow").classList.remove("min")
            window.div.querySelector(".toggleWindow").classList.add("max")
        }

    }

    displaySnapPreview(Window) {
        this.hideAllPreviews()

        let x = Window.div.offsetLeft
        let y = Window.div.offsetTop
        let windowWidth = Window.div.clientWidth
        let windowHeight = Window.div.clientHeight
        let zIndex = parseInt(window.getComputedStyle(Window.div).zIndex) - 1

        let preview = null

        Window.snapTo = snapPos.none

        // top level previews
        if (y <= this.wrapper.offsetTop + this.snapRange.top) {
            // top-left
            if (x <= this.wrapper.offsetLeft + this.snapRange.left) {
                preview = document.querySelector(".snap-top-left-preview")
                Window.snapTo = snapPos.topLeft
            }
            // top-right
            else if (x + windowWidth >= this.wrapper.offsetLeft + this.wrapperWidth - this.snapRange.right) {
                preview = document.querySelector(".snap-top-right-preview")
                Window.snapTo = snapPos.topRight
            }
            // top
            else {
                preview = document.querySelector(".snap-top-preview")
                Window.snapTo = snapPos.top
            }
        }

        // bottom level previews
        else if (y + windowHeight * 0.5 >= this.wrapper.offsetTop + this.wrapperHeight - this.snapRange.bottom) {
            // bottom left
            if (x <= this.wrapper.offsetLeft + this.snapRange.left) {
                preview = document.querySelector(".snap-bottom-left-preview")
                Window.snapTo = snapPos.bottomLeft
            }
            // bottom right
            else if (x + windowWidth >= this.wrapper.offsetLeft + this.wrapperWidth - this.snapRange.right) {
                preview = document.querySelector(".snap-bottom-right-preview")
                Window.snapTo = snapPos.bottomRight
            }
            else {
                preview = document.querySelector(".snap-bottom-preview")
                Window.snapTo = snapPos.bottom
            }
        }

        // left and right
        else {
            if (x <= this.wrapper.offsetLeft + this.snapRange.left) {
                // left
                preview = document.querySelector(".snap-left-preview")
                Window.snapTo = snapPos.left
            }
            else if (x + windowWidth >= this.wrapper.offsetLeft + this.wrapperWidth - this.snapRange.right) {
                // right
                preview = document.querySelector(".snap-right-preview")
                Window.snapTo = snapPos.right
            }
        }

        if (preview) {
            preview.style.zIndex = zIndex

            if (Window.snapTo == snapPos.top)
                preview.style.height = (this.wrapperHeight * this.xDiv) + "px"
            else if (Window.snapTo == snapPos.bottom)
                preview.style.height = (this.wrapperHeight * (1 - this.xDiv)) + "px"
            else {
                if (Window.snapTo.includes("left"))
                    preview.style.width = (this.wrapperWidth * this.yDiv) + "px"
                else
                    preview.style.width = (this.wrapperWidth * (1 - this.yDiv)) + "px"
            }
        }
    }

    hideAllPreviews() {
        qs(".snap-top-preview").style.height = ""
        qs(".snap-top-left-preview").style.width = ""
        qs(".snap-top-right-preview").style.width = ""
        qs(".snap-left-preview").style.width = ""
        qs(".snap-bottom-left-preview").style.width = ""
        qs(".snap-bottom-preview").style.height = ""
        qs(".snap-bottom-right-preview").style.width = ""
        qs(".snap-right-preview").style.width = ""
    }


    setDiv(div, snapDivTo) {
        let pos = snapDivTo.split("-")
        let TRBL = { top: "", right: "", bottom: "", left: "" }

        if (pos == snapPos.none)
            return

        TRBL[pos[0]] = "0"
        if (pos.length == 2)
            TRBL[pos[1]] = "0"


        // set the position of the div
        div.style.top = TRBL['top']
        div.style.right = TRBL['right']
        div.style.bottom = TRBL['bottom']
        div.style.left = TRBL['left']

        // default size
        div.style.height = Math.max(this.wrapperHeight, this.minWindowHeight) + "px"
        div.style.width = Math.max(this.wrapperWidth, this.minWindowWidth) + "px"

        // need to subtract the border size of window
        if (snapDivTo.includes("top"))
            div.style.height = Math.max((this.wrapperHeight * this.xDiv), this.minWindowHeight) + "px"
        if (snapDivTo.includes("bottom"))
            div.style.height = Math.max((this.wrapperHeight * (1 - this.xDiv)), this.minWindowHeight) + "px"
        if (snapDivTo.includes("left"))
            div.style.width = Math.max((this.wrapperWidth * this.yDiv), this.minWindowWidth) + "px"
        if (snapDivTo.includes("right"))
            div.style.width = Math.max((this.wrapperWidth * (1 - this.yDiv)), this.minWindowWidth) + "px"
    }


    snapwindow(window, snapWindowTo) {

        this.setDiv(window.div, snapWindowTo)

        // remove the snap preview
        if (snapWindowTo == snapPos.top || snapWindowTo == snapPos.bottom)
            document.querySelector(`.snap-${snapWindowTo}-preview`).style.height = ""
        else
            document.querySelector(`.snap-${snapWindowTo}-preview`).style.width = ""

        window.snappedTo = snapWindowTo
        window.div.classList.remove("resizable")
        this.layout[snapWindowTo] = window.div
        this.resetLayoutResizer()
    }

    updateSnapPreview() {
        let update = false

        // chech if snappreviews already exists
        if (document.querySelector(".snapPreview"))
            update = true

        for (const pos in snapPos) {
            if (pos == 'none')
                continue

            let div
            if (!update) {
                div = document.createElement("div")
                div.classList.add(`snap-${snapPos[pos]}-preview`)
                div.classList.add("snapPreview")
            }
            else
                div = document.querySelector(`.snap-${snapPos[pos]}-preview`)

            this.setDiv(div, snapPos[pos], 0)

            // set the initial width/height to 0 to hide them
            if (pos == snapPos.top || pos == snapPos.bottom)
                div.style.height = 0
            else
                div.style.width = 0

            this.wrapper.appendChild(div)
        }
    }


    removeBorderRadius(window) {
        window.div.style.borderRadius = "0"
        window.div.querySelector(".header").style.borderRadius = "0"
    }

    setBorderRadius(window) {
        window.div.style.borderRadius = ""
        window.div.querySelector(".header").style.borderRadius = ""
    }

    // function to set window to active
    setActive(id) {

        if (this.activeWindow)
            this.activeWindow.querySelector(".header").classList.remove("active")

        // call the onactive callback function
        if (this.onSetActive) this.onSetActive(this.activeWindow, id)

        this.activeWindow = this.windowsList[id].div
        this.activeWindow.querySelector(".header").classList.add("active")
        document.querySelector(`#${id}-icon`).querySelector(".status").classList.add("active-icon")

        let temp = parseInt(window.getComputedStyle(this.windowsList[id].div).zIndex)
        for (let div in this.windowsList) {
            let zIndex = parseInt(window.getComputedStyle(this.windowsList[div].div).zIndex)
            if (zIndex > temp) {
                this.windowsList[div].div.style.zIndex = zIndex - 2
            }
        }
        this.windowsList[id].div.style.zIndex = (Object.keys(this.windowsList).length - 1) * 2

        // call reset resizer again to set the zindex of the resizers 
        this.resetLayoutResizer()
    }

    resizeWindows() {
        Array.from(document.querySelectorAll(".draggable-div")).forEach(div => {
            // remove width and heigth transitions while resizing
            div.classList.remove("animation")
            let window = this.windowsList[div.id]
            this.setDiv(div, window.snappedTo)
        })
    }

    updateLayoutResizer() {
        // this function is called every time windows are resized

        this.setLayoutResizer('resizer-top', (this.wrapperHeight * this.xDiv), 10, ["", "", "", (this.wrapperWidth * this.yDiv)], "e-resize")
        this.setLayoutResizer('resizer-bottom', (this.wrapperHeight * (1 - this.xDiv)), 10, ["", "", 0, (this.wrapperWidth * this.yDiv)], "e-resize")
        this.setLayoutResizer('resizer-right', 10, (this.wrapperWidth * (1 - this.yDiv)), [(this.wrapperHeight * this.xDiv), 0, "", ""], "n-resize")
        this.setLayoutResizer('resizer-left', 10, (this.wrapperWidth * (this.yDiv)), [(this.wrapperHeight * this.xDiv), "", "", ""], "n-resize")
        this.setLayoutResizer('resizer-hor', 10, this.wrapperWidth, [(this.wrapperHeight * this.xDiv), "", "", ""], "n-resize")
        this.setLayoutResizer('resizer-vert', this.wrapperHeight, 10, ["", "", "", (this.wrapperWidth * this.yDiv)], "e-resize")
    }

    setLayoutResizer(name, height, width, TRBL, cursor) {
        // function to set the width, height and position of the resizer bars

        let resizer
        let update = false
        if (document.querySelector(`.${name}`)) {
            update = true
            resizer = document.querySelector(`.${name}`)
        }

        else {
            resizer = document.createElement("div")
            resizer.classList.add("resizer")
            resizer.classList.add(name)

            this.addLayoutResizeFunc(resizer)
        }

        resizer.style.height = height + "px"
        resizer.style.width = width + "px"

        // 4 subtracted to bring them to the center
        if (TRBL[0] != "")
            resizer.style.top = TRBL[0] - 4 + "px"

        resizer.style.right = TRBL[1] + "px"
        resizer.style.bottom = TRBL[2] + "px"

        if (TRBL[3] != "")
            resizer.style.left = TRBL[3] - 4 + "px"

        resizer.style.cursor = cursor;

        if (!update)
            this.wrapper.append(resizer)
    }


    addLayoutResizeFunc(LayoutResizer) {
        let prevX, prevY, dx, dy
        let resizePos

        const resizeLayouts = (e) => {
            dx = e.clientX - prevX
            dy = e.clientY - prevY

            prevX = e.clientX
            prevY = e.clientY


            if ((this.yDiv * this.wrapperWidth) + dx >= this.minWindowWidth && (this.yDiv * this.wrapperWidth) + dx <= this.wrapperWidth - this.minWindowWidth)
                // prevent it from going beyond min values
                if (resizePos.includes('top') || resizePos.includes('bottom') || resizePos.includes('vert')) {
                    if ((this.yDiv * this.wrapperWidth) + dx >= this.minWindowWidth && (this.yDiv * this.wrapperWidth) + dx <= this.wrapperWidth - this.minWindowWidth)
                        this.yDiv = ((this.yDiv * this.wrapperWidth) + dx) / this.wrapperWidth
                }
                else {
                    if ((this.xDiv * this.wrapperHeight) + dy >= this.minWindowHeight && (this.xDiv * this.wrapperHeight) + dy <= this.wrapperHeight - this.minWindowHeight)
                        this.xDiv = ((this.xDiv * this.wrapperHeight) + dy) / this.wrapperHeight
                }

            this.updateSnapPreview()
            this.updateLayoutResizer()
            this.resizeWindows()
        }

        const stopLayoutResizing = () => {
            this.wrapper.onmousemove = null
            this.wrapper.onmouseup = null
        }

        const startLayoutResizing = (e) => {
            resizePos = LayoutResizer.classList[1]
            prevX = e.clientX
            prevY = e.clientY

            // while resizing set all the snapped windows to active
            for (const window in this.windowsList) {
                if (this.windowsList[window].snappedTo != snapPos.none) {
                    this.setActive(this.windowsList[window].div.id)
                }
            }

            this.wrapper.onmousemove = resizeLayouts
            this.wrapper.onmouseup = stopLayoutResizing
        }

        LayoutResizer.onmousedown = startLayoutResizing
    }

    resetLayoutResizer() {
        // function to display resizers when needed
        // called when a window is snapped or unsanpped
        // only display the resizers where windows are snapped

        // remove old resizers
        Array.from(document.querySelectorAll(".resizer")).forEach(resizer => {
            resizer.style.display = ""
        })


        const resizerTop = qs(".resizer-top")
        const resizerRight = qs(".resizer-right")
        const resizerBottom = qs(".resizer-bottom")
        const resizerLeft = qs(".resizer-left")
        const resizerHor = qs(".resizer-hor")
        const resizerVert = qs(".resizer-vert")


        const top = this.layout['top']
        const bottom = this.layout['bottom']
        const left = this.layout['left']
        const right = this.layout['right']
        const topLeft = this.layout['top-left']
        const topRight = this.layout['top-right']
        const bottomLeft = this.layout['bottom-left']
        const bottomRight = this.layout['bottom-right']

        // check which positions are occupied and show resizers accordingly

        // set the z-index of the resizer as the z-index of the snapped window with max zindex + 1 to prevent overlapping with unsnapped active windows

        // show resizerTop if topLeft or topRight is occupied
        if (topLeft || topRight) {
            resizerTop.style.display = "block"
            resizerTop.style.zIndex = this.getMaxZindex(topLeft, topRight) + 1
        }

        // show resizerBottom if bottomLeft or bottomRight is occupied
        if (bottomLeft || bottomRight) {
            resizerBottom.style.display = "block"
            resizerBottom.style.zIndex = this.getMaxZindex(bottomLeft, bottomRight) + 1
        }

        // show resizerLeft if topLeft or bottomLeft is occupied
        if (topLeft || bottomLeft) {
            resizerLeft.style.display = "block"
            resizerLeft.style.zIndex = this.getMaxZindex(topLeft, bottomLeft) + 1
        }

        // show resizerRight if topRight or bottomRight is occupied
        if (topRight || bottomRight) {
            resizerRight.style.display = "block"
            resizerRight.style.zIndex = this.getMaxZindex(topRight, bottomRight) + 1
        }


        /*
            show resizerVert if:
                1) topLeft and bottomLeft are occupied
                or
                2) topRight and bottomRight are occupied
                or
                3) left or right is occupied
            
            also remove top and bottom resizer
        */
        if ((topLeft && bottomLeft) || (topRight && bottomRight) || left || right) {
            resizerTop.style.display = ""
            resizerBottom.style.display = ""
            resizerVert.style.display = "block"

            let z1 = this.getMaxZindex(topLeft, bottomLeft)
            let z2 = this.getMaxZindex(topRight, bottomRight)
            let z3 = this.getMaxZindex(right, left)

            resizerVert.style.zIndex = Math.max(z1, z2, z3) + 1
        }

        /*
        show resizerHor if:
            1) topLeft and topRight are occupied
            or
            2) bottomLeft and bottomRight are occupied
            or
            3) top or bottom is occupied
    
        also remove left and right resizer
        */

        if ((topLeft && topRight) || (bottomLeft && bottomRight) || top || bottom) {
            resizerLeft.style.display = ""
            resizerRight.style.display = ""
            resizerHor.style.display = "block"

            let z1 = this.getMaxZindex(topLeft, topRight)
            let z2 = this.getMaxZindex(bottomLeft, bottomRight)
            let z3 = this.getMaxZindex(top, bottom)

            resizerHor.style.zIndex = Math.max(z1, z2, z3) + 1
        }
    }

    getMaxZindex(div1, div2) {
        let z1, z2
        if (!div1)
            z1 = -1
        else z1 = window.getComputedStyle(div1).zIndex

        if (!div2)
            z2 = -1
        else z2 = window.getComputedStyle(div2).zIndex

        return Math.max(z1, z2)
    }

    moveWindowInsideScreen() {
        for (const key in this.windowsList) {
            const window = this.windowsList[key]
            if (window.snappedTo !== snapPos.none)
                return
            if (window.div.offsetLeft >= this.wrapperWidth) {
                window.div.style.left = this.wrapperWidth - window.div.clientWidth - 2 + "px"
            }
        }
    }

    removeWrapperListener() {
        // if cursor gets outside the wrapper, stop moving the window
        this.wrapper.addEventListener('mouseleave', () => {
            this.wrapper.onmousemove = null
        })
    }

}


const snapPos = {
    none: 'none',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    topLeft: 'top-left',
    topRight: 'top-right',
    bottomLeft: 'bottom-left',
    bottomRight: 'bottom-right',
}

function qs(selector, parent = document) {
    return parent.querySelector(selector)
}

function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)]
}

function set(element, className) {
    element.classList.add(className)
}

function unset(element, className) {
    element.classList.remove(className)
}
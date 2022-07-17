class DrawingPad {
    constructor(selector, doc) {
        this.selector = selector
        this.doc = doc
        this.canvas = null
        this.pencil = null
        this.eraser = null
        this.undoStack = []
        this.undoLimit = 100
        this.redoStack = []
        this.redoLimit = 100
        // timeout used to group ops recieved in a certain interval together
        this.undoTimeOut = false
        this.opGroupingInterval = 100 //in milliseconds
        this.groupedOps = []
        this.zoomDisplayTimeout = null
        this.isPanning = false
        this.isErasing = false
        this.isDrawingRect = false
        this.isDrawingCircle = false
        this.isDrawingTriangle = false
        this.rendering = false
    }

    initializeDrawingPad(callback) {
        this.doc.subscribe((err) => {
            if (err)
                throw err;
            this.initializeCanvas()

            if (callback !== undefined)
                callback()
        })
    }

    initializeCanvas() {
        this.canvas = new fabric.Canvas(this.selector, {
            preserveObjectStacking: true,
        })

        this.pencil = new fabric.PencilBrush(this.canvas)
        this.eraser = new fabric.EraserBrush(this.canvas)

        // canvas is initially in drawing mode by deafault
        this.canvas.isDrawingMode = true
        this.setDrawingBrush('#1F1F1F', 5, 3)

        // extra canvas styling
        this.boundingBoxStyling('rgb(103, 182, 251)', 'rgb(103, 182, 251)')
        this.selectionStyling('rgba(182, 217, 247, 0.437)', '#646FD4')

        // add zooming and panning functionality
        this.addZoom()
        this.addPanning()

        // add controls and toolbar
        this.addControls()
        this.addToolbarLogic()


        // set the initial contents of the canvas
        this.setContents(this.doc.data.canvas)

        this.submitLocalChanges()

        this.listenAndUpdateContent()

        this.handlePathDrawing()
        this.handleObjectModification()
        this.handleErasion()
        this.handleShapeDrawing()

        this.canvas.on('after:render', () => {
            if (this.rendering) {
                this.rendering = false
            }
        })
    }

    setContents(content) {
        content.forEach(obj => {
            const canvasObject = this.deserialize(obj)
            this.canvas.add(canvasObject)
        })
    }

    submitLocalChanges() {
        this.canvas.on('canvas:changed', (delta) => {
            // structure of delta = { op : an op or array of ops, source : source of the delta (not required)}
            let ops = delta.op
            this.doc.submitOp(ops)

            if (delta.source && delta.source === 'undo') return

            // convert op into an array as update undoStack requires an array
            if (!Array.isArray(ops))
                ops = [ops]
            this.updateUndoStack(ops)
        })
    }

    listenAndUpdateContent() {
        this.doc.on('op', (ops, source) => {
            if (source) return;
            this.updateUndoStack(ops, true)
            this.applyOps(ops)
        })
    }

    applyOps(ops) {
        this.rendering = true
        ops.forEach(op => {
            // insert new object
            if (op.li !== undefined) {
                // eraser paths
                if (op.p[2] && op.p[2] === 'eraser') {
                    const index = op.p[1]
                    const target = this.canvas.getObjects()[index]

                    console.log('eraser li:', index, target);

                    const eraserObj = this.getFabricObject(op.li)
                    target.eraser._objects.splice(op.p[4], 0, eraserObj)
                    // need to do this so that the object rerenders with erasers effect
                    target.dirty = true
                    target.eraser.dirty = true
                }
                else {
                    const canvasObject = this.deserialize(op.li)
                    const index = op.p[1]
                    this.canvas.insertAt(canvasObject, index, false)
                }

            }
            // delete an object
            else if (op.ld !== undefined) {
                const index = op.p[1]
                const target = this.canvas.getObjects()[index]
                // for undoing erasure
                if (op.p[2] && op.p[2] === 'eraser') {
                    target.eraser._objects.splice(op.p[4], 1)
                    // need to do this so that the object rerenders with erasers effect
                    target.dirty = true
                    target.eraser.dirty = true
                } else {
                    // if the object being removed is in activeSelection then remove it from activeSelection
                    if (this.canvas.getActiveObjects().indexOf(target) !== -1) {
                        // do this only if the object being removed is in a multi-selection
                        if (this.canvas.getActiveObjects().length > 1)
                            this.canvas.getActiveObject().removeWithUpdate(target)
                    }

                    this.canvas.remove(target)
                }
            }
            // modifying a property
            else if (op.oi !== undefined && op.od !== undefined) {
                const index = op.p[1]
                const prop = op.p[2]
                const target = this.canvas.getObjects()[index]

                console.log('mod :', index, prop, target);

                let isInActiveSelection = false
                // if target is in active selection remove it from active selection and add it back again after applying changes
                // being in active selection messes up the position props
                if (this.canvas.getActiveObjects().indexOf(target) !== -1) {
                    isInActiveSelection = true
                    if (this.canvas.getActiveObjects().length > 1) {
                        this.canvas.getActiveObject().removeWithUpdate(target)
                    }
                    else {
                        this.canvas.discardActiveObject()
                    }
                }
                if (prop === 'props') {
                    // calling setCoords is important for updating the bounding box
                    target.set(op.oi).setCoords()
                }
                else
                    target.set(prop, op.oi).setCoords()

                if (isInActiveSelection) {
                    if (this.canvas.getActiveObjects().length > 0)
                        this.canvas.getActiveObject().addWithUpdate(target)
                    else
                        this.canvas.setActiveObject(target)
                }
            }
            // position change
            else if (op.lm !== undefined) {
                const idx1 = op.p[1]
                const idx2 = op.lm
                const target = this.canvas.getObjects()[idx1]

                target.moveTo(idx2)
            }
            // first time erasing
            else if (op.oi !== undefined && op.od === undefined) {
                const index = op.p[1]
                const target = this.canvas.getObjects()[index]

                console.log('first time erasing:', index, target);

                const eraserObj = { ...op.oi }
                target.eraser = this.getFabricObject(eraserObj)
                // need to do this so that the object rerenders with erasers effect
                target.dirty = true
            }
            // undoing erasure
            else if (op.od !== undefined && op.oi === undefined) {
                const index = op.p[1]
                const target = this.canvas.getObjects()[index]

                console.log('undoing erasure', index, target);

                delete target.eraser
                // need to do this so that the object rerenders with erasers effect
                target.dirty = true
            }

            this.canvas.renderAll()
        })
    }

    extendFabricObject(fabricObject) {
        // extends the fabric object to add new properties
        fabricObject.toObject = (function (toObject) {
            return function () {
                return fabric.util.object.extend(toObject.call(this), {
                    // add new Properites here
                    id: this.id
                })
            }
        })(fabricObject.toObject)

        return fabricObject
    }

    serializeFabricObject(fabricObject, compress = false) {
        // getting the required properties     
        const serializedObject = {
            ...fabricObject.toObject(),
            props: {
                left: fabricObject.left,
                top: fabricObject.top,
                height: fabricObject.height,
                width: fabricObject.width,
                scaleX: fabricObject.scaleX,
                scaleY: fabricObject.scaleY,
                angle: fabricObject.angle,
            },
            compressed: false,
        }

        // remove the individual properties from the object
        delete serializedObject['top']
        delete serializedObject['left']
        delete serializedObject['height']
        delete serializedObject['width']
        delete serializedObject['scaleX']
        delete serializedObject['scaleY']
        delete serializedObject['angle']

        if (compress) {
            serializedObject.path = this.compressStr(serializedObject.path)
            serializedObject.compressed = true
        }
        return serializedObject
    }

    deserialize(obj) {
        let deserializedObj = { ...obj }
        // spread the object
        deserializedObj.angle = obj.props.angle
        deserializedObj.top = obj.props.top
        deserializedObj.left = obj.props.left
        deserializedObj.scaleX = obj.props.scaleX
        deserializedObj.scaleY = obj.props.scaleY
        deserializedObj.height = obj.props.height
        deserializedObj.width = obj.props.width

        delete deserializedObj['props']

        if (deserializedObj.compressed)
            deserializedObj.path = this.decompressStr(deserializedObj.path)
        return this.getFabricObject(deserializedObj)
    }

    getFabricObject(object) {
        /*
            takes an object and returns a fabric object with extended properties.
            this is necessary to get the 'set' and other methods of fabric object.
        */
        let fabricObject;
        fabric.util.enlivenObjects([object], (objects) => {
            fabricObject = this.extendFabricObject(objects[0])
        })
        return fabricObject
    }

    handlePathDrawing() {
        this.canvas.on('path:created', (options) => {
            // first extend the fabric object and add an id
            let path = this.extendFabricObject(options.path)

            // if its eraser path return
            if (path.globalCompositeOperation === 'destination-out')
                return

            path.id = new Module.ObjectID().toString()
            // convert the path object to a canvas object
            path = this.getFabricObject(path)
            const op = { p: ['canvas', this.doc.data.canvas.length], li: this.serializeFabricObject(path, true) }
            this.canvas.fire('canvas:changed', { op })
        })
    }

    handleObjectModification() {
        this.canvas.on('object:modified', () => {
            const selObjects = this.canvas.getActiveObjects()
            // need to discard the activeObject or else the selected object's position and other properties will not be accurate (i.e calculated w.r.t the group and not the canvas itself)

            // get the active object before discarding it
            const activeObject = this.canvas.getActiveObject().toObject()
            this.canvas.discardActiveObject()

            let ops = selObjects.map(selObj => {
                const index = this.canvas.getObjects().indexOf(selObj)
                const newProps = {
                    angle: selObj.angle,
                    top: selObj.top,
                    left: selObj.left,
                    width: selObj.width,
                    height: selObj.height,
                    scaleX: selObj.scaleX,
                    scaleY: selObj.scaleY
                }
                return { p: ['canvas', index, 'props'], od: this.doc.data.canvas[index].props, oi: newProps }
            })
            this.canvas.fire('canvas:changed', { op: ops })

            // add the selections back
            // we need to update all the objects based on the original selection
            let sel;
            if (activeObject.objects) {
                for (let i = 0; i < selObjects.length; i++) {
                    const obj = activeObject.objects[i]
                    selObjects[i].set({
                        angle: obj.angle,
                        top: obj.top,
                        left: obj.left,
                        width: obj.width,
                        height: obj.height,
                        scaleX: obj.scaleX,
                        scaleY: obj.scaleY
                    }).setCoords()
                }

                // create a new selection object based on original selection object
                sel = new fabric.ActiveSelection(selObjects, {
                    canvas: this.canvas,
                    angle: activeObject.angle,
                    width: activeObject.width,
                    height: activeObject.height,
                    left: activeObject.left,
                    top: activeObject.top,
                    scaleX: activeObject.scaleX,
                    scaleY: activeObject.scaleY
                })
            } else {
                sel = selObjects[0]
            }
            this.canvas.setActiveObject(sel)
            this.canvas.requestRenderAll()
        })
    }

    handleErasion() {
        this.canvas.on('erasing:end', (opt) => {
            let ops = opt.targets.map((target) => {
                const index = this.canvas.getObjects().indexOf(target)
                const eraserObj = { ...target.eraser.toObject() }
                const noOfEraserPaths = eraserObj.objects.length
                // first time erasing
                if (noOfEraserPaths === 1)
                    return { p: ['canvas', index, 'eraser'], oi: eraserObj }
                else {
                    return { p: ['canvas', index, 'eraser', 'objects', noOfEraserPaths - 1], li: eraserObj.objects[noOfEraserPaths - 1] }
                }
            })
            this.canvas.fire('canvas:changed', { op: ops })
        })
    }

    handleShapeDrawing() {
        // shape drawing
        this.canvas.on('mouse:down', (o) => {
            if (!this.isDrawingRect && !this.isDrawingCircle && !this.isDrawingTriangle)
                return

            if (o.target !== null)
                return

            let pointer = this.canvas.getPointer(o.e)
            let prevX = pointer.x
            let prevY = pointer.y

            let shape;
            const props = {
                left: prevX,
                top: prevY,
                height: 0,
                width: 0,
                stroke: '#0078D7',
                fill: '#99C9EF',
                erasable: false
            }

            if (this.isDrawingRect)
                shape = this.extendFabricObject(new fabric.Rect(props))

            else if (this.isDrawingCircle)
                shape = this.extendFabricObject(new fabric.Ellipse(props))

            else if (this.isDrawingTriangle)
                shape = this.extendFabricObject(new fabric.Triangle(props))

            shape.id = new Module.ObjectID().toString()

            this.canvas.add(shape);

            const mouseMoveHandler = (o) => {
                pointer = this.canvas.getPointer(o.e)

                if (prevX > pointer.x) {
                    shape.set({ left: Math.abs(pointer.x) })
                }
                if (prevY > pointer.y) {
                    shape.set({ top: Math.abs(pointer.y) })
                }

                if (this.isDrawingCircle) {
                    shape.set({ rx: Math.abs(prevX - pointer.x) / 2 })
                    shape.set({ ry: Math.abs(prevY - pointer.y) / 2 })
                }
                else {
                    shape.set({ width: Math.abs(prevX - pointer.x) })
                    shape.set({ height: Math.abs(prevY - pointer.y) })
                }

                this.canvas.renderAll()
            }

            const mouseUpHandler = () => {
                this.canvas.off('mouse:move', mouseMoveHandler)
                this.canvas.off('mouse:up', mouseUpHandler)

                this.canvas.set('selection', true)
                this.isDrawingRect = false
                this.isDrawingCircle = false
                this.isDrawingTriangle = false

                this.canvas.setActiveObject(shape)
                this.canvas.requestRenderAll()
                const op = { p: ['canvas', this.doc.data.canvas.length], li: this.serializeFabricObject(shape, true) }
                this.canvas.fire('canvas:changed', { op })
            }

            this.canvas.on('mouse:move', mouseMoveHandler)
            this.canvas.on('mouse:up', mouseUpHandler)
        })
    }

    addZoom() {
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY
            let zoom = this.canvas.getZoom()
            zoom *= 0.999 ** delta
            if (zoom > 20) zoom = 20
            if (zoom < 0.01) zoom = 0.01
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
            opt.e.preventDefault()
            opt.e.stopPropagation()

            // show the zoom level
            const zoomLevelDisplayDiv = document.querySelector('.zoom-level-display-div ')
            zoomLevelDisplayDiv.innerHTML = `${(zoom * 100).toFixed(2)}%`
            zoomLevelDisplayDiv.style.display = 'inline-block'
            zoomLevelDisplayDiv.style.opacity = '0.5'

            if (this.zoomDisplayTimeout !== undefined) {
                clearTimeout(this.zoomDisplayTimeout)
            }
            this.zoomDisplayTimeout = setTimeout(() => {
                zoomLevelDisplayDiv.style.display = 'none'
                zoomLevelDisplayDiv.style.opacity = '0'
            }, 1500)
        })
    }

    addPanning() {
        let isDragging = false
        let lastPosX, lastPosY
        this.canvas.on('mouse:down', (opt) => {
            const evt = opt.e;
            if (this.isPanning) {
                isDragging = true;
                this.canvas.selection = false;
                lastPosX = evt.clientX;
                lastPosY = evt.clientY;
            }
        })
        this.canvas.on('mouse:move', (opt) => {
            if (isDragging) {
                const e = opt.e;
                let vpt = this.canvas.viewportTransform;
                vpt[4] += e.clientX - lastPosX;
                vpt[5] += e.clientY - lastPosY;
                this.canvas.requestRenderAll();
                lastPosX = e.clientX;
                lastPosY = e.clientY;
            }
        })
        this.canvas.on('mouse:up', () => {
            // on mouse up we want to recalculate new interaction
            // for all objects, so we call setViewportTransform
            this.canvas.setViewportTransform(this.canvas.viewportTransform)
            isDragging = false;
            this.canvas.selection = true;
        })
    }

    invertOps(ops) {
        // inverts the op so that it can be applied back on the canvas
        // takes an array of ops

        let invertedOps = ops.map(op => {
            let invertedOp;
            // inverting insertion
            if (op.li) {
                invertedOp = { p: op.p, ld: op.li }
            }
            // inverting deletion
            else if (op.ld) {
                invertedOp = { p: op.p, li: op.ld }
            }
            // inverting position change
            else if (op.lm !== undefined) {
                const from = op.lm
                const to = op.p[1]
                invertedOp = { p: ['canvas', from], lm: to }
            }
            // inverting object modification
            else if (op.oi && op.od) {
                invertedOp = { p: op.p, od: op.oi, oi: op.od }
            }
            // inverting erasure
            else if (op.oi && op.od === undefined) {
                // send copy of the object to prevent changing the original object
                invertedOp = { p: op.p, od: op.oi }
            }
            else if (op.od && op.oi === undefined) {
                // send copy of the object to prevent changing the original object
                invertedOp = { p: op.p, oi: op.od }
            }
            return Module.cloneDeep(invertedOp)
        })

        return invertedOps
    }

    updateUndoStack(ops) {
        // function to group ops based on the time they are received
        // takes an array of ops as param
        if (!this.undoTimeOut) {
            this.undoTimeOut = true
            this.groupedOps = [...this.groupedOps, ...ops]

            setTimeout(() => {
                this.undoTimeOut = false
                this.addToUndoStack(this.groupedOps)
                this.groupedOps = []
            }, this.opGroupingInterval)
        }
        else {
            this.groupedOps = [...this.groupedOps, ...ops]
        }
    }

    addToUndoStack(op) {
        if (this.undoStack.length === this.undoLimit) {
            this.undoStack = this.undoStack.slice(1)
        }
        this.undoStack.push(Module.cloneDeep(op))
    }

    removeFromUndoStack() {
        if (this.undoStack.length === 0)
            return

        return this.undoStack.pop()
    }

    addToRedoStack(op) {
        if (this.redoStack.length === this.redoLimit) {
            this.redoStack = this.redoStack.slice(1)
        }
        this.redoStack.push(Module.cloneDeep(op))
    }

    removeFromRedoStack(op) {
        if (this.redoStack.length === 0)
            return

        return this.redoStack.pop()
    }

    setDrawingBrush(color, width, decimate) {
        this.canvas.freeDrawingBrush.color = color
        this.canvas.freeDrawingBrush.width = width
        this.canvas.freeDrawingBrush.decimate = decimate
    }

    boundingBoxStyling(cornerColor, borderColor) {
        fabric.Object.prototype.set({
            transparentCorners: false,
            cornerStyle: 'circle',
            cornerColor: cornerColor,
            borderColor: borderColor,
            borderDashArray: [5, 5]
        })
    }

    selectionStyling(selectionColor, selectionBorderColor) {
        this.canvas.selectionColor = selectionColor
        this.canvas.selectionBorderColor = selectionBorderColor
        this.canvas.selectionDashArray = [5, 5]
    }

    addControls() {
        const canvasContainer = document.querySelector('#WhiteBoard-body')
        const controlsDiv = document.createElement('div')
        controlsDiv.classList.add('controls')

        controlsDiv.innerHTML = `
        <div class="controls-toolbar">
            <div id="stroke-color-picker" class="control-btn" title="stroke color">
                <i class="fa-solid fa-circle-dot"></i>
            </div>
            <div id="fill-color-picker" class="control-btn" title="fill color">
                <i class="fa-solid fa-circle"></i>
            </div>
            <div id="delete-btn" class="control-btn" title="delete shape">
                <i class="fa-solid fa-trash-can"></i>
            </div>
            <div id="more-options-btn" class="control-btn" title="more">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </div>
        </div>
        <div class="stroke-colors-div color-div">
            <i class="fa-solid fa-circle-dot" data-value="#FFC114" style="color:#FFC114"></i>
            <i class="fa-solid fa-circle-dot" data-value="#FBAE17" style="color:#FBAE17"></i>
            <i class="fa-solid fa-circle-dot" data-value="#F36323" style="color:#F36323"></i>
            <i class="fa-solid fa-circle-dot" data-value="#E3182D" style="color:#E3182D"></i>
            <i class="fa-solid fa-circle-dot" data-value="#CF1278" style="color:#CF1278"></i>
            <i class="fa-solid fa-circle-dot" data-value="#7EC400" style="color:#7EC400"></i>
            <i class="fa-solid fa-circle-dot" data-value="#00B44B" style="color:#00B44B"></i>
            <i class="fa-solid fa-circle-dot" data-value="#0078D7" style="color:#0078D7"></i>
            <i class="fa-solid fa-circle-dot" data-value="#5B318D" style="color:#5B318D"></i>
            <i class="fa-solid fa-circle-dot" data-value="#BD7CAE" style="color:#BD7CAE"></i>
            <i class="fa-solid fa-circle-dot" data-value="#B6B6B6" style="color:#B6B6B6"></i>
            <i class="fa-solid fa-circle-dot" data-value="#1F1F1F" style="color:#1F1F1F"></i>
        </div>
        <div class="fill-colors-div color-div">
        <i class="fa-solid fa-circle" data-value="#FEE15A" style="color:#FEE15A"></i>
        <i class="fa-solid fa-circle" data-value="#FCCD7A" style="color:#FCCD7A"></i>
        <i class="fa-solid fa-circle" data-value="#F9C0A0" style="color:#F9C0A0"></i>
        <i class="fa-solid fa-circle" data-value="#F18992" style="color:#F18992"></i>
        <i class="fa-solid fa-circle" data-value="#EA99C7" style="color:#EA99C7"></i>
        <i class="fa-solid fa-circle" data-value="#CBE59C" style="color:#CBE59C"></i>
        <i class="fa-solid fa-circle" data-value="#9BE0BA" style="color:#9BE0BA"></i>
        <i class="fa-solid fa-circle" data-value="#99C9EF" style="color:#99C9EF"></i>
        <i class="fa-solid fa-circle" data-value="#9FB0FA" style="color:#9FB0FA"></i>
        <i class="fa-solid fa-circle" data-value="#C7A3DA" style="color:#C7A3DA"></i>
        <i class="fa-solid fa-circle" data-value="#EBEBEB" style="color:#EBEBEB"></i>
        <i class="fa-solid fa-circle" data-value="#B6B6B6" style="color:#B6B6B6"></i>
    </div>
    <div class="more-options-div">
        <div class="position-change-btn" id="bring-to-front">Bring to front</div>
        <div class="position-change-btn" id="send-to-back">Send to back</div>
    </div>
        `
        canvasContainer.appendChild(controlsDiv)

        const strokeColorPicker = document.querySelector('#stroke-color-picker')
        const strokeColorsDiv = document.querySelector('.stroke-colors-div')
        const fillColorPicker = document.querySelector('#fill-color-picker')
        const fillColorsDiv = document.querySelector('.fill-colors-div')
        const moreOptionsBtn = document.querySelector('#more-options-btn')
        const moreOptionsDiv = document.querySelector('.more-options-div')

        const controlsDisplayHandler = () => {
            controlsDiv.classList.add('show-controls-div')

            const activeObject = this.canvas.getActiveObject()
            const controlsWidth = controlsDiv.offsetWidth
            const controlsHeight = controlsDiv.offsetHeight
            const objHeight = activeObject.height * activeObject.scaleY
            const objWidth = activeObject.width * activeObject.scaleX
            const padding = 35
            const origin = activeObject.getCenterPoint()
            const angle = activeObject.angle
            const zoom = this.canvas.getZoom()
            // to make corrections for panning
            const leftCorrection = this.canvas.viewportTransform[4]
            const topCorrection = this.canvas.viewportTransform[5]
            const canvasWrapper = document.querySelector('#WhiteBoard-body')

            // distance is calculated from center of the object to the middle points of the sides
            // for vertical sides
            const r1 = Math.sqrt(objHeight / 2 * objHeight / 2) + padding
            // for horizontal sides
            const r2 = Math.sqrt(objWidth / 2 * objWidth / 2) + padding

            // array of possible positions of control div
            // {d : radius, a : angle}
            const positions = [{ d: r1, a: 270 }, { d: r2, a: 0 }, { d: r2, a: 180 }, { d: r1, a: 90 }]

            let top, left
            let visible = false
            for (let i = 0; i < positions.length; i++) {
                let r = positions[i].d
                let phi = positions[i].a

                const theta = (angle - phi) * Math.PI / 180
                // made panning and zoom corrections
                left = ((origin.x + (leftCorrection / zoom)) + r * Math.cos(theta)) * zoom
                top = ((origin.y + (topCorrection / zoom)) + r * Math.sin(theta)) * zoom



                let omega = theta * 180 / Math.PI
                if (omega < 0) omega += 360

                // place the control div correctly
                if (omega >= 80 && omega <= 100) {
                    left = left - controlsWidth / 2

                    // to not hide the rotation stick
                    if (phi === 90) {
                        top = top + 20
                    }
                }
                else if (omega > 100 && omega < 260) {
                    left = left - controlsWidth
                    top = top - controlsHeight / 2

                    if (phi === 90) {
                        left = left - 20
                    }
                }
                else if (omega >= 260 && omega <= 280) {
                    left = left - controlsWidth / 2
                    top = top - controlsHeight

                    if (phi === 90) {
                        top = top - 20
                    }
                }
                else {
                    left = left + 10
                    top = top - controlsHeight / 2

                    if (phi === 90) {
                        left = left + 10
                    }
                }

                // 60 is taken to accomodate the toolbar
                if (!(top < 0 || left < 60 || top + controlsHeight > canvasWrapper.clientHeight || left + controlsWidth > canvasWrapper.clientWidth)) {
                    visible = true
                    break
                }
            }

            if (!visible) {
                // if cannot place anywhere place in the middle
                const center = activeObject.getCenterPoint()
                left = center.x - controlsWidth / 2
                top = center.y - controlsHeight / 2
            }

            controlsDiv.style.top = top + 'px'
            controlsDiv.style.left = left + 'px'

            // set the colors for the color pickers
            if (activeObject.type !== 'activeSelection') {
                const strokeColor = activeObject.stroke
                strokeColorPicker.querySelector('i').style.color = strokeColor

                if (strokeColorsDiv.querySelector('.color-selected'))
                    strokeColorsDiv.querySelector('.color-selected').classList.remove('color-selected')

                strokeColorsDiv.querySelector(`.fa-circle-dot[data-value="${strokeColor}"]`).classList.add('color-selected')

                // if active object is path dont show the fill color picker
                if (activeObject.type === 'path') {
                    fillColorPicker.style.display = 'none'
                }
                else {
                    fillColorPicker.style.display = 'grid'
                    const fillColor = activeObject.fill
                    fillColorPicker.querySelector('i').style.color = fillColor

                    if (fillColorsDiv.querySelector('.color-selected'))
                        fillColorsDiv.querySelector('.color-selected').classList.remove('color-selected')

                    fillColorsDiv.querySelector(`.fa-circle[data-value="${fillColor}"]`).classList.add('color-selected')
                }

            }
        }

        const controlsRemover = () => {
            controlsDiv.classList.remove('show-controls-div')
            strokeColorsDiv.style.display = 'none'
            fillColorsDiv.style.display = 'none'
            moreOptionsDiv.style.display = 'none'

            if (controlsDiv.querySelector('.selected-btn'))
                controlsDiv.querySelector('.selected-btn').classList.remove('selected-btn')
        }


        this.canvas.on('selection:created', controlsDisplayHandler)
        this.canvas.on('selection:updated', controlsDisplayHandler)

        // remove controls while modifying object
        this.canvas.on('selection:cleared', controlsRemover)
        this.canvas.on('object:moving', controlsRemover)
        this.canvas.on('object:scaling', controlsRemover)
        this.canvas.on('object:rotating', controlsRemover)
        this.canvas.on('mouse:wheel', controlsRemover)

        document.getElementById('delete-btn').addEventListener('click', () => {
            const target = this.canvas.getActiveObject()
            let index;
            let ops;
            if (target.type === 'activeSelection') {
                // discard to get accurate position values
                this.canvas.discardActiveObject()
                ops = target._objects.map(obj => {
                    index = this.canvas.getObjects().indexOf(obj)
                    this.canvas.remove(obj)
                    return { p: ['canvas', index], ld: this.serializeFabricObject(obj) }
                })
            }
            else {
                index = this.canvas.getObjects().indexOf(target)
                this.canvas.remove(target)
                ops = { p: ['canvas', index], ld: this.serializeFabricObject(target) }
            }
            this.canvas.fire('canvas:changed', { op: ops })
        })

        strokeColorPicker.addEventListener('click', () => {
            fillColorsDiv.style.display = 'none'
            strokeColorsDiv.style.display = 'grid'
            moreOptionsDiv.style.display = 'none'

            if (controlsDiv.querySelector('.selected-btn'))
                controlsDiv.querySelector('.selected-btn').classList.remove('selected-btn')

            strokeColorPicker.classList.add('selected-btn')

            controlsDisplayHandler()
        })

        fillColorPicker.addEventListener('click', () => {
            strokeColorsDiv.style.display = 'none'
            fillColorsDiv.style.display = 'grid'
            moreOptionsDiv.style.display = 'none'

            if (controlsDiv.querySelector('.selected-btn'))
                controlsDiv.querySelector('.selected-btn').classList.remove('selected-btn')

            fillColorPicker.classList.add('selected-btn')

            controlsDisplayHandler()
        })

        moreOptionsBtn.addEventListener('click', () => {
            strokeColorsDiv.style.display = 'none'
            fillColorsDiv.style.display = 'none'
            moreOptionsDiv.style.display = 'flex'

            if (controlsDiv.querySelector('.selected-btn'))
                controlsDiv.querySelector('.selected-btn').classList.remove('selected-btn')

            moreOptionsBtn.classList.add('selected-btn')

            controlsDisplayHandler()
        })

        strokeColorsDiv.addEventListener('click', (e) => {
            if (e.target && e.target.matches("i")) {
                const color = e.target.getAttribute('data-value')
                strokeColorPicker.querySelector('i').style.color = color

                // update the selected color in the stroke colors div
                if (strokeColorsDiv.querySelector('.color-selected'))
                    strokeColorsDiv.querySelector('.color-selected').classList.remove('color-selected')

                e.target.classList.add('color-selected')

                const target = this.canvas.getActiveObject()
                let index;
                let ops;
                if (target.type === 'activeSelection') {
                    ops = target._objects.map(obj => {
                        index = this.canvas.getObjects().indexOf(obj)
                        obj.set('stroke', color)
                        // submit the op
                        return { p: ['canvas', index, 'stroke'], od: this.doc.data.canvas[index].stroke, oi: color }
                    })
                }
                else {
                    index = this.canvas.getObjects().indexOf(target)
                    target.set('stroke', color)
                    // submit the op
                    ops = { p: ['canvas', index, 'stroke'], od: this.doc.data.canvas[index].stroke, oi: color }
                }
                this.canvas.fire('canvas:changed', { op: ops })
                this.canvas.renderAll()
                strokeColorsDiv.style.display = 'none'
                controlsDisplayHandler()
            }
        })

        fillColorsDiv.addEventListener('click', (e) => {
            if (e.target && e.target.matches("i")) {
                const color = e.target.getAttribute('data-value')
                fillColorPicker.querySelector('i').style.color = color

                if (fillColorsDiv.querySelector('.color-selected'))
                    fillColorsDiv.querySelector('.color-selected').classList.remove('color-selected')

                e.target.classList.add('color-selected')

                const target = this.canvas.getActiveObject()
                let index;
                let ops = [];
                if (target.type === 'activeSelection') {
                    target._objects.forEach(obj => {
                        if (obj.type === 'path')
                            return
                        index = this.canvas.getObjects().indexOf(obj)
                        obj.set('fill', color)
                        // submit the op
                        ops.push({ p: ['canvas', index, 'fill'], od: this.doc.data.canvas[index].fill, oi: color })
                    })
                }
                else if (target.type !== 'path') {
                    index = this.canvas.getObjects().indexOf(target)
                    target.set('fill', color)
                    // submit the op
                    ops = { p: ['canvas', index, 'fill'], od: this.doc.data.canvas[index].fill, oi: color }
                }
                this.canvas.fire('canvas:changed', { op: ops })
                this.canvas.renderAll()
                fillColorsDiv.style.display = 'none'
                controlsDisplayHandler()
            }
        })

        moreOptionsDiv.addEventListener('click', (e) => {
            if (e.target && e.target.matches("div.position-change-btn")) {
                const action = e.target.id
                const target = this.canvas.getActiveObject()
                let ops;
                let index

                if (target.type === 'activeSelection') {
                    let selObjects = [...target._objects]
                    ops = selObjects.map(obj => {
                        index = this.canvas.getObjects().indexOf(obj)
                        let op;

                        // remove from active selection
                        this.canvas.getActiveObject().remove(obj)

                        if (action === 'bring-to-front') {
                            obj.bringToFront()
                            // submit the op
                            op = { p: ['canvas', index], lm: this.doc.data.canvas.length - 1 }
                        }
                        else {
                            obj.sendToBack()
                            // submit the op
                            op = { p: ['canvas', index], lm: 0 }
                        }

                        // add back to active selection
                        this.canvas.getActiveObject().add(obj)

                        return op
                    })
                }
                else {
                    index = this.canvas.getObjects().indexOf(target)
                    if (action === 'bring-to-front') {
                        target.bringToFront()
                        // submit the op
                        ops = { p: ['canvas', index], lm: this.doc.data.canvas.length - 1 }
                    }
                    else {
                        target.sendToBack()
                        // submit the op
                        ops = { p: ['canvas', index], lm: 0 }
                    }
                }
                this.canvas.fire('canvas:changed', { op: ops })
                this.canvas.renderAll()
                moreOptionsDiv.style.display = 'none'
                controlsDisplayHandler()
            }
        })
    }

    addToolbarLogic() {
        const pointerBtn = document.getElementById('pointer-btn')
        const panBtn = document.getElementById('pan-btn')
        const drawModeBtn = document.getElementById('draw-mode')
        const eraserBtn = document.getElementById('eraser')
        const strokeWidthRange = document.querySelector("#stroke-Range")
        const drawRectBtn = document.getElementById('draw-rect')
        const drawCircleBtn = document.getElementById('draw-circle')
        const drawTriangleBtn = document.getElementById('draw-triangle')
        const undoBtn = document.getElementById('undo')
        const redoBtn = document.getElementById('redo')
        const editPenDiv = document.querySelector(".edit-pen-div")
        const shapeBtn = document.querySelector('#shapes-btn')
        const shapeSelectionDiv = document.querySelector('.shape-selection-div')


        pointerBtn.addEventListener('click', () => {
            this.disableToolBarOptions()
            closeToolBarDivs()
            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            pointerBtn.classList.add('toolbar-btn-selected')
        })

        panBtn.addEventListener('click', () => {
            this.disableToolBarOptions()
            this.isPanning = true

            closeToolBarDivs()
            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            panBtn.classList.add('toolbar-btn-selected')
        })

        drawModeBtn.addEventListener('click', () => {
            this.disableToolBarOptions()
            this.canvas.isDrawingMode = true;

            closeToolBarDivs()
            editPenDiv.style.display = 'flex'

            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            drawModeBtn.classList.add('toolbar-btn-selected')
        })

        editPenDiv.querySelector('#close-pen-options').addEventListener('click', () => {
            editPenDiv.style.display = 'none'
        })

        eraserBtn.addEventListener('click', () => {
            if (!this.isErasing) {
                this.canvas.freeDrawingBrush = this.eraser
                this.canvas.freeDrawingBrush.width = parseInt(strokeWidthRange.value, 10) || 1;
                this.isErasing = true
                eraserBtn.classList.add('eraser-selected')
            } else {
                const color = editPenDiv.querySelector('.stroke-color-selected').getAttribute('data-value')
                this.canvas.freeDrawingBrush = this.pencil
                const width = parseInt(strokeWidthRange.value, 10) || 1;
                this.setDrawingBrush(color, width, 3)
                this.isErasing = false
                eraserBtn.classList.remove('eraser-selected')
            }
        })

        editPenDiv.querySelector('.stroke-colors').addEventListener('click', (e) => {
            if (e.target && e.target.matches("i")) {
                const color = e.target.getAttribute('data-value')
                this.canvas.freeDrawingBrush = this.pencil
                const width = parseInt(strokeWidthRange.value, 10) || 1;
                this.setDrawingBrush(color, width, 3)

                // update the selected color in the stroke colors div
                if (editPenDiv.querySelector('.stroke-color-selected'))
                    editPenDiv.querySelector('.stroke-color-selected').classList.remove('stroke-color-selected')

                e.target.classList.add('stroke-color-selected')

                // disable eraser if it's selected
                eraserBtn.classList.remove('eraser-selected')
            }
        })

        strokeWidthRange.addEventListener("change", e => {
            this.canvas.freeDrawingBrush.width = parseInt(e.target.value, 10) || 1;
        })

        shapeBtn.addEventListener("click", () => {
            this.disableToolBarOptions()
            closeToolBarDivs()
            shapeSelectionDiv.style.display = 'flex'

            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            shapeBtn.classList.add('toolbar-btn-selected')
        })

        drawRectBtn.addEventListener('click', () => {
            this.disableToolBarOptions()
            this.canvas.set('selection', false)
            this.isDrawingRect = true

            closeToolBarDivs()
            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            pointerBtn.classList.add('toolbar-btn-selected')
        })

        drawCircleBtn.addEventListener('click', () => {

            this.disableToolBarOptions()
            this.canvas.set('selection', false)
            this.isDrawingCircle = true

            closeToolBarDivs()
            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            pointerBtn.classList.add('toolbar-btn-selected')
        })

        drawTriangleBtn.addEventListener('click', () => {
            this.disableToolBarOptions()
            this.canvas.set('selection', false)
            this.isDrawingTriangle = true

            closeToolBarDivs()
            if (document.querySelector('.toolbar-btn-selected'))
                document.querySelector('.toolbar-btn-selected').classList.remove('toolbar-btn-selected')

            pointerBtn.classList.add('toolbar-btn-selected')
        })

        undoBtn.addEventListener('click', () => {
            closeToolBarDivs()

            if (this.rendering) {
                console.log('skipped')
                return
            }

            try {
                const op = this.removeFromUndoStack()

                if (!op) return

                const invertedOps = this.invertOps(op)

                // // add source property to prevent getting added back onto the undo stack
                this.canvas.fire('canvas:changed', { op: invertedOps, source: 'undo' })
                // // apply to canvas
                console.log('invertedOp', invertedOps);
                this.applyOps(invertedOps)

                // // add the op to redo stack
                this.addToRedoStack(op)
            } catch (error) {
                console.log(error)
            }
        })

        redoBtn.addEventListener('click', () => {
            closeToolBarDivs()

            if (this.rendering) {
                console.log('skipped')
                return
            }

            try {
                const op = this.removeFromRedoStack()
                if (!op) return

                this.canvas.fire('canvas:changed', { op })

                this.applyOps(op)
            } catch (error) {
                console.log(error)
            }
        })

        const closeToolBarDivs = () => {
            shapeSelectionDiv.style.display = 'none'
            editPenDiv.style.display = 'none'
        }
    }

    disableToolBarOptions() {
        this.canvas.isDrawingMode = false
        this.isPanning = false
        this.isDrawingRect = false
        this.isDrawingCircle = false
        this.isDrawingTriangle = false
    }

    compressStr(s) {
        var dict = {};
        var data = (s + "").split("");
        var out = [];
        var currChar;
        var phrase = data[0];
        var code = 256;
        for (var i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        for (var i = 0; i < out.length; i++) {
            out[i] = String.fromCharCode(out[i]);
        }
        return out.join("");
    }

    decompressStr(s) {
        var dict = {};
        var data = (s + "").split("");
        var currChar = data[0];
        var oldPhrase = currChar;
        var out = [currChar];
        var code = 256;
        var phrase;
        for (var i = 1; i < data.length; i++) {
            var currCode = data[i].charCodeAt(0);
            if (currCode < 256) {
                phrase = data[i];
            }
            else {
                phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join("");
    }
}
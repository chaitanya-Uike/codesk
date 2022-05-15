/**!
© 2016-2019 Convergence Labs, Inc.
@version 0.4.0
@license MIT
*/
(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory(require("ace"));
    else if (typeof define === 'function' && define.amd)
        define("AceCollabExt", ["ace"], factory);
    else if (typeof exports === 'object')
        exports["AceCollabExt"] = factory(require("ace"));
    else
        root["AceCollabExt"] = factory(root["ace"]);
})(window, function (__WEBPACK_EXTERNAL_MODULE__6__) {
    return /******/ (function (modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if (installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
                /******/
            }
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
                /******/
            };
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
            /******/
        }
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function (exports, name, getter) {
/******/ 		if (!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
                /******/
            }
            /******/
        };
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function (exports) {
/******/ 		if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
                /******/
            }
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
            /******/
        };
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function (value, mode) {
/******/ 		if (mode & 1) value = __webpack_require__(value);
/******/ 		if (mode & 8) return value;
/******/ 		if ((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if (mode & 2 && typeof value != 'string') for (var key in value) __webpack_require__.d(ns, key, function (key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
            /******/
        };
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function (module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
            /******/
        };
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function (object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
        /******/
    })
/************************************************************************/
/******/([
/* 0 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            function __export(m) {
                for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
            }
            Object.defineProperty(exports, "__esModule", { value: true });
            __export(__webpack_require__(1));
            __export(__webpack_require__(3));
            __export(__webpack_require__(5));
            __export(__webpack_require__(7));
            __export(__webpack_require__(9));


            /***/
        }),
/* 1 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            const AceSelectionMarker_1 = __webpack_require__(2);
            /**
             * Implements multiple colored selections in the ace editor.  Each selection is
             * associated with a particular user. Each user is identified by a unique id
             * and has a color associated with them.  The selection manager supports block
             * selection through multiple AceRanges.
             */
            class AceMultiSelectionManager {
                /**
                 * Constructs a new AceMultiSelectionManager that is bound to a particular
                 * Ace EditSession instance.
                 *
                 * @param session
                 *   The Ace EditSession to bind to.
                 */
                constructor(session) {
                    this._selections = {};
                    this._session = session;
                }
                /**
                 * Adds a new collaborative selection.
                 *
                 * @param id
                 *   The unique system identifier for the user associated with this selection.
                 * @param label
                 *   A human readable / meaningful label / title that identifies the user.
                 * @param color
                 *   A valid css color string.
                 * @param ranges
                 *   An array of ace ranges that specify the initial selection.
                 */
                addSelection(id, label, color, ranges) {
                    if (this._selections[id] !== undefined) {
                        throw new Error("Selection with id already defined: " + id);
                    }
                    const marker = new AceSelectionMarker_1.AceSelectionMarker(this._session, id, label, color, ranges);
                    this._selections[id] = marker;
                    this._session.addDynamicMarker(marker, false);
                }
                /**
                 * Updates the selection for a particular user.
                 *
                 * @param id
                 *   The unique identifier for the user.
                 * @param ranges
                 *   The array of ranges that specify the selection.
                 */
                setSelection(id, ranges) {
                    const selection = this._getSelection(id);
                    selection.setSelection(ranges);
                }
                /**
                 * Clears the selection (but does not remove it) for the specified user.
                 * @param id
                 *   The unique identifier for the user.
                 */
                clearSelection(id) {
                    const selection = this._getSelection(id);
                    selection.setSelection(null);
                }
                /**
                 * Removes the selection for the specified user.
                 * @param id
                 *   The unique identifier for the user.
                 */
                removeSelection(id) {
                    const selection = this._selections[id];
                    if (selection === undefined) {
                        throw new Error("Selection not found: " + id);
                    }
                    // note: ace adds the id property to whatever marker you pass in.
                    this._session.removeMarker(selection.id);
                    delete this._selections[id];
                }
                /**
                 * Removes all selections.
                 */
                removeAll() {
                    Object.getOwnPropertyNames(this._selections).forEach((key) => {
                        this.removeSelection(this._selections[key].selectionId());
                    });
                }
                _getSelection(id) {
                    const selection = this._selections[id];
                    if (selection === undefined) {
                        throw new Error("Selection not found: " + id);
                    }
                    return selection;
                }
            }
            exports.AceMultiSelectionManager = AceMultiSelectionManager;


            /***/
        }),
/* 2 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            class AceSelectionMarker {
                constructor(session, selectionId, label, color, ranges) {
                    this._session = session;
                    this._label = label;
                    this._color = color;
                    this._ranges = ranges || [];
                    this._selectionId = selectionId;
                    this._id = null;
                    this._markerElement = document.createElement("div");
                }
                update(_, markerLayer, session, layerConfig) {
                    while (this._markerElement.hasChildNodes()) {
                        this._markerElement.removeChild(this._markerElement.lastChild);
                    }
                    this._ranges.forEach((range) => {
                        this._renderRange(markerLayer, session, layerConfig, range);
                    });
                    this._markerElement.remove();
                    markerLayer.elt("remote-selection", "");
                    const parentNode = markerLayer.element.childNodes[markerLayer.i - 1] || markerLayer.element.lastChild;
                    parentNode.appendChild(this._markerElement);
                }
                setSelection(ranges) {
                    if (ranges === undefined || ranges === null) {
                        this._ranges = [];
                    }
                    else if (ranges instanceof Array) {
                        this._ranges = ranges;
                    }
                    else {
                        this._ranges = [ranges];
                    }
                    this._forceSessionUpdate();
                }
                getLabel() {
                    return this._label;
                }
                selectionId() {
                    return this._selectionId;
                }
                markerId() {
                    return this._id;
                }
                _renderLine(bounds) {
                    const div = document.createElement("div");
                    div.className = "ace-multi-selection";
                    div.style.backgroundColor = this._color;
                    if (typeof bounds.height === "number") {
                        div.style.height = `${bounds.height}px`;
                    }
                    if (typeof bounds.width === "number") {
                        div.style.width = `${bounds.width}px`;
                    }
                    if (typeof bounds.top === "number") {
                        div.style.top = `${bounds.top}px`;
                    }
                    if (typeof bounds.left === "number") {
                        div.style.left = `${bounds.left}px`;
                    }
                    if (typeof bounds.bottom === "number") {
                        div.style.bottom = `${bounds.bottom}px`;
                    }
                    if (typeof bounds.right === "number") {
                        div.style.right = `${bounds.right}px`;
                    }
                    this._markerElement.append(div);
                }
                _renderRange(markerLayer, session, layerConfig, range) {
                    const screenRange = range.toScreenRange(session);
                    let height = layerConfig.lineHeight;
                    let top = markerLayer.$getTop(screenRange.start.row, layerConfig);
                    let width = 0;
                    const right = 0;
                    const left = markerLayer.$padding + screenRange.start.column * layerConfig.characterWidth;
                    if (screenRange.isMultiLine()) {
                        // Render the start line
                        this._renderLine({ height, right, top, left });
                        // from start of the last line to the selection end
                        top = markerLayer.$getTop(screenRange.end.row, layerConfig);
                        width = screenRange.end.column * layerConfig.characterWidth;
                        this._renderLine({ height, width, top, left: markerLayer.$padding });
                        // all the complete lines
                        height = (screenRange.end.row - screenRange.start.row - 1) * layerConfig.lineHeight;
                        if (height < 0) {
                            return;
                        }
                        top = markerLayer.$getTop(screenRange.start.row + 1, layerConfig);
                        this._renderLine({ height, right, top, left: markerLayer.$padding });
                    }
                    else {
                        width = (range.end.column - range.start.column) * layerConfig.characterWidth;
                        this._renderLine({ height, width, top, left });
                    }
                }
                _forceSessionUpdate() {
                    this._session._signal("changeBackMarker");
                }
            }
            exports.AceSelectionMarker = AceSelectionMarker;


            /***/
        }),
/* 3 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            const AceCursorMarker_1 = __webpack_require__(4);
            /**
             * Implements multiple colored cursors in the ace editor.  Each cursor is
             * associated with a particular user. Each user is identified by a unique id
             * and has a color associated with them.  Each cursor has a position in the
             * editor which is specified by a 2-d row and column ({row: 0, column: 10}).
             */
            class AceMultiCursorManager {
                /**
                 * Constructs a new AceMultiCursorManager that is bound to a particular
                 * Ace EditSession instance.
                 *
                 * @param session
                 *   The Ace EditSession to bind to.
                 */
                constructor(session) {
                    this._cursors = {};
                    this._session = session;
                }
                /**
                 * Adds a new collaborative selection.
                 *
                 * @param id
                 *   The unique system identifier for the user associated with this selection.
                 * @param label
                 *   A human readable / meaningful label / title that identifies the user.
                 * @param color
                 *   A valid css color string.
                 * @param position
                 *   A 2-d position or linear index indicating the location of the cursor.
                 */
                addCursor(id, label, color, position) {
                    if (this._cursors[id] !== undefined) {
                        throw new Error(`Cursor with id already defined: ${id}`);
                    }
                    const marker = new AceCursorMarker_1.AceCursorMarker(this._session, id, label, color, position);
                    this._cursors[id] = marker;
                    this._session.addDynamicMarker(marker, true);
                }
                /**
                 * Updates the selection for a particular user.
                 *
                 * @param id
                 *   The unique identifier for the user.
                 * @param position
                 *   A 2-d position or linear index indicating the location of the cursor.
                 */
                setCursor(id, position) {
                    const cursor = this._getCursor(id);
                    cursor.setPosition(position);
                }
                /**
                 * Clears the cursor (but does not remove it) for the specified user.
                 *
                 * @param id
                 *   The unique identifier for the user.
                 */
                clearCursor(id) {
                    const cursor = this._getCursor(id);
                    cursor.setPosition(null);
                }
                /**
                 * Removes the cursor for the specified user.
                 *
                 * @param id
                 *   The unique identifier for the user.
                 */
                removeCursor(id) {
                    const cursor = this._cursors[id];
                    if (cursor === undefined) {
                        throw new Error(`Cursor not found: ${id}`);
                    }
                    // Note: ace adds an id field to all added markers.
                    this._session.removeMarker(cursor.id);
                    delete this._cursors[id];
                }
                /**
                 * Removes all cursors.
                 */
                removeAll() {
                    Object.getOwnPropertyNames(this._cursors).forEach((key) => {
                        this.removeCursor(this._cursors[key].cursorId());
                    });
                }
                _getCursor(id) {
                    const cursor = this._cursors[id];
                    if (cursor === undefined) {
                        throw new Error(`Cursor not found: ${id}`);
                    }
                    return cursor;
                }
            }
            exports.AceMultiCursorManager = AceMultiCursorManager;


            /***/
        }),
/* 4 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            /**
             * Represents a marker of a remote users cursor.
             */
            class AceCursorMarker {
                /**
                 * Constructs a new AceCursorMarker
                 * @param session The Ace Editor Session to bind to.
                 * @param cursorId the unique id of this cursor.
                 * @param label The label to display over the cursor.
                 * @param color The css color of the cursor
                 * @param position The row / column coordinate of the cursor marker.
                 */
                constructor(session, cursorId, label, color, position) {
                    this._session = session;
                    this._label = label;
                    this._color = color;
                    this._position = position ? this._convertPosition(position) : null;
                    this._cursorId = cursorId;
                    this._id = null;
                    this._visible = false;
                    this._tooltipTimeout = null;
                    // Create the HTML elements
                    this._markerElement = document.createElement("div");
                    this._cursorElement = document.createElement("div");
                    this._cursorElement.className = "ace-multi-cursor";
                    this._caretElement = document.createElement("div");
                    this._caretElement.className = "ace-multi-caret";
                    this._caretElement.style.background = this._color;
                    this._caretElement.style.height = '100%';
                    this._caretElement.style.width = '100%';
                    this._cursorElement.appendChild(this._caretElement);
                    this._markerElement.append(this._cursorElement);
                    this._tooltipElement = document.createElement("div");
                    this._tooltipElement.className = "ace-multi-cursor-tooltip";
                    this._tooltipElement.id = `${cursorId}-tooltip`
                    this._tooltipElement.style.background = this._color;
                    this._tooltipElement.style.opacity = "0";
                    this._tooltipElement.innerHTML = label;
                    this._markerElement.append(this._tooltipElement);


                    // add event listener for animation
                    this._animationTimeout;
                    this._cursorElement.addEventListener('mouseover', () => {
                        this._tooltipElement.style.opacity = 1;

                        if (this._animationTimeout != undefined) {
                            clearTimeout(this._animationTimeout)
                        }
                        this._animationTimeout = setTimeout(() => {
                            this._tooltipElement.style.opacity = 0;
                        }, 5000);
                    })
                }
                /**
                 * Called by Ace to update the rendering of the marker.
                 *
                 * @param _ The html to render, represented by an array of strings.
                 * @param markerLayer The marker layer containing the cursor marker.
                 * @param __ The ace edit session.
                 * @param layerConfig
                 */
                update(_, markerLayer, __, layerConfig) {
                    if (this._position === null) {
                        return;
                    }
                    const screenPosition = this._session.documentToScreenPosition(this._position.row, this._position.column);
                    const top = markerLayer.$getTop(screenPosition.row, layerConfig);
                    const left = markerLayer.$padding + screenPosition.column * layerConfig.characterWidth;
                    const height = layerConfig.lineHeight;
                    const cursorTop = top + 2;
                    const cursorHeight = height - 3;
                    const cursorLeft = left;
                    const cursorWidth = 3;
                    this._cursorElement.style.height = `${cursorHeight}px`;
                    this._cursorElement.style.width = `${cursorWidth}px`;
                    this._cursorElement.style.top = `${cursorTop}px`;
                    this._cursorElement.style.left = `${cursorLeft}px`;
                    let toolTipTop = cursorTop - height;
                    if (toolTipTop < 2) {
                        toolTipTop = cursorTop + height - 8;
                    }
                    const toolTipLeft = cursorLeft;
                    this._tooltipElement.style.top = `${toolTipTop + 6}px`;
                    this._tooltipElement.style.left = `${toolTipLeft}px`;
                    // Remove the content node from whatever parent it might have now
                    // and add it to the new parent node.
                    this._markerElement.remove();
                    markerLayer.elt("remote-cursor", "");
                    const parentNode = markerLayer.element.childNodes[markerLayer.i - 1] || markerLayer.element.lastChild;
                    parentNode.appendChild(this._markerElement);
                }
                /**
                 * Sets the location of the cursor marker.
                 * @param position The position of cursor marker.
                 */
                setPosition(position) {
                    this._position = this._convertPosition(position);
                    this._forceSessionUpdate();
                    this._scheduleTooltipHide();
                }
                /**
                 * Sets the marker to visible / invisible.
                 *
                 * @param visible true if the marker should be displayed, false otherwise.
                 */
                setVisible(visible) {
                    const old = this._visible;
                    this._visible = visible;
                    if (old !== this._visible) {
                        this._markerElement.style.visibility = visible ? "visible" : "hidden";
                        this._forceSessionUpdate();
                    }
                }
                /**
                 * Determines if the marker should be visible.
                 *
                 * @returns true if the cursor should be visible, false otherwise.
                 */
                isVisible() {
                    return this._visible;
                }
                /**
                 * Gets the unique id of this cursor.
                 * @returns the unique id of this cursor.
                 */
                cursorId() {
                    return this._cursorId;
                }
                /**
                 * Gets the id of the marker.
                 * @returns The marker id.
                 */
                markerId() {
                    return this._id;
                }
                /**
                 * Gets the label of the marker.
                 * @returns The marker"s label.
                 */
                getLabel() {
                    return this._label;
                }
                _forceSessionUpdate() {
                    this._session._signal("changeFrontMarker");
                }
                _convertPosition(position) {
                    if (position === null) {
                        return null;
                    }
                    else if (typeof position === "number") {
                        return this._session.getDocument().indexToPosition(position, 0);
                    }
                    else if (typeof position.row === "number" && typeof position.column === "number") {
                        return position;
                    }
                    throw new Error(`Invalid position: ${position}`);
                }
                _scheduleTooltipHide() {
                    if (this._tooltipTimeout !== null) {
                        clearTimeout(this._tooltipTimeout);
                    }
                    this._tooltipTimeout = setTimeout(() => {
                        this._tooltipElement.style.opacity = "0";
                        this._tooltipTimeout = null;
                    }, 2000);
                }
            }
            exports.AceCursorMarker = AceCursorMarker;


            /***/
        }),
/* 5 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            const ace_builds_1 = __webpack_require__(6);
            /**
             * A helper class for working with Ace Ranges.
             */
            class AceRangeUtil {
                static rangeToJson(range) {
                    return {
                        start: {
                            row: range.start.row,
                            column: range.start.column
                        },
                        end: {
                            row: range.end.row,
                            column: range.end.column
                        }
                    };
                }
                static jsonToRange(range) {
                    return new ace_builds_1.Range(range.start.row, range.start.column, range.end.row, range.end.column);
                }
                static rangesToJson(ranges) {
                    return ranges.map((range) => {
                        return AceRangeUtil.rangeToJson(range);
                    });
                }
                static jsonToRanges(ranges) {
                    return ranges.map((range) => {
                        return AceRangeUtil.jsonToRange(range);
                    });
                }
                static toJson(value) {
                    if (Array.isArray(value)) {
                        return AceRangeUtil.rangesToJson(value);
                    }
                    return AceRangeUtil.rangeToJson(value);
                }
                static fromJson(value) {
                    if (Array.isArray(value)) {
                        return AceRangeUtil.jsonToRanges(value);
                    }
                    return AceRangeUtil.jsonToRange(value);
                }
            }
            exports.AceRangeUtil = AceRangeUtil;


            /***/
        }),
/* 6 */
/***/ (function (module, exports) {

            module.exports = __WEBPACK_EXTERNAL_MODULE__6__;

            /***/
        }),
/* 7 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            const AceRadarViewIndicator_1 = __webpack_require__(8);
            /**
             * Implements viewport awareness in the Ace Editor by showing where remote
             * users are scrolled too and where there cursor is in the document, even
             * if the cursor is not in view.
             */
            class AceRadarView {
                /**
                 * Constructs a new AceRadarView bound to the supplied element and editor.
                 *
                 * @param element
                 *          The HTML Element that the AceRadarView should render to.
                 * @param editor
                 *          The Ace Editor to listen to events from.
                 */
                constructor(element, editor) {
                    this._container = null;
                    if (typeof element === "string") {
                        this._container = document.getElementById(element);
                    }
                    else {
                        this._container = element;
                    }
                    this._container.style.position = "relative";
                    this._views = {};
                    this._editor = editor;
                }
                /**
                 * Add a view indicator for a new remote user.
                 *
                 * @param id
                 *          The unique id of the user.
                 * @param label
                 *          A text label to displAce for the user.
                 * @param color
                 *          The color to render the indicator with.
                 * @param viewRows
                 *          The rows the user's viewport spans.
                 * @param cursorRow
                 *          The row that the user's cursor is on.
                 */
                addView(id, label, color, viewRows, cursorRow) {
                    const indicator = new AceRadarViewIndicator_1.AceRadarViewIndicator(label, color, viewRows, cursorRow, this._editor);
                    this._container.appendChild(indicator.element());
                    indicator.update();
                    this._views[id] = indicator;
                }
                /**
                 * Determines if the AceRadarView has an indicator for this specified user.
                 *
                 * @param id
                 *          The id of the user to check for.
                 * @returns
                 *   True if the AceRadarView has an indicator for this user, false otherwise.
                 */
                hasView(id) {
                    return this._views[id] !== undefined;
                }
                /**
                 * Sets the view row span for a particular user.
                 *
                 * @param id
                 *          The id of the user to set the rows for.
                 * @param rows
                 *          The row range to set.
                 */
                setViewRows(id, rows) {
                    const indicator = this._views[id];
                    indicator.setViewRows(rows);
                }
                /**
                 * Sets the cursor row for a particular user.
                 *
                 * @param id
                 *          The id of the user to set the cursor row for.
                 * @param row
                 *          The row to set.
                 */
                setCursorRow(id, row) {
                    const indicator = this._views[id];
                    indicator.setCursorRow(row);
                }
                /**
                 * Clears the view for a particular user, causing their indicator to disapear.
                 * @param id
                 *   The id of the user to clear.
                 */
                clearView(id) {
                    const indicator = this._views[id];
                    indicator.setCursorRow(null);
                    indicator.setViewRows(null);
                }
                /**
                 * Removes the view indicator for the specified user.
                 * @param id
                 *   The id of the user to remove the view indicator for.
                 */
                removeView(id) {
                    const indicator = this._views[id];
                    indicator.dispose();
                    delete this._views[id];
                }
            }
            exports.AceRadarView = AceRadarView;


            /***/
        }),
/* 8 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            class AceRadarViewIndicator {
                constructor(label, color, viewRows, cursorRow, editor) {
                    this._label = label;
                    this._color = color;
                    this._viewRows = viewRows;
                    this._cursorRow = cursorRow;
                    this._editor = editor;
                    this._docLineCount = editor.getSession().getLength();
                    this._editorListener = () => {
                        const newLineCount = this._editor.getSession().getLength();
                        if (newLineCount !== this._docLineCount) {
                            this._docLineCount = newLineCount;
                            this.update();
                        }
                    };
                    this._editor.on("change", this._editorListener);
                    this._scrollElement = document.createElement("div");
                    this._scrollElement.className = "ace-radar-view-scroll-indicator";
                    this._scrollElement.style.borderColor = this._color;
                    this._scrollElement.style.background = this._color;
                    // todo implement a custom tooltip for consistent presentation.
                    this._scrollElement.title = this._label;
                    this._scrollElement.addEventListener("click", () => {
                        const middle = ((this._viewRows.end - this._viewRows.start) / 2) + this._viewRows.start;
                        this._editor.scrollToLine(middle, true, false, () => {
                        });
                    }, false);
                    this._cursorElement = document.createElement("div");
                    this._cursorElement.className = "ace-radar-view-cursor-indicator";
                    this._cursorElement.style.background = this._color;
                    this._cursorElement.title = this._label;
                    this._cursorElement.addEventListener("click", () => {
                        this._editor.scrollToLine(this._cursorRow, true, false, () => {
                        });
                    }, false);
                    this._wrapper = document.createElement("div");
                    this._wrapper.className = "ace-radar-view-wrapper";
                    this._wrapper.style.display = "none";
                    this._wrapper.appendChild(this._scrollElement);
                    this._wrapper.appendChild(this._cursorElement);
                }
                element() {
                    return this._wrapper;
                }
                setCursorRow(cursorRow) {
                    this._cursorRow = cursorRow;
                    this.update();
                }
                setViewRows(viewRows) {
                    this._viewRows = viewRows;
                    this.update();
                }
                update() {
                    if (!_isSet(this._viewRows) && !_isSet(this._cursorRow)) {
                        this._wrapper.style.display = "none";
                    }
                    else {
                        this._wrapper.style.display = null;
                        const maxLine = this._docLineCount - 1;
                        if (!_isSet(this._viewRows)) {
                            this._scrollElement.style.display = "none";
                        }
                        else {
                            const topPercent = Math.min(maxLine, this._viewRows.start) / maxLine * 100;
                            const bottomPercent = 100 - (Math.min(maxLine, this._viewRows.end) / maxLine * 100);
                            this._scrollElement.style.top = topPercent + "%";
                            this._scrollElement.style.bottom = bottomPercent + "%";
                            this._scrollElement.style.display = null;
                        }
                        if (!_isSet(this._cursorRow)) {
                            this._cursorElement.style.display = "none";
                        }
                        else {
                            const cursorPercent = Math.min(this._cursorRow, maxLine) / maxLine;
                            const ratio = (this._wrapper.offsetHeight - this._cursorElement.offsetHeight) / this._wrapper.offsetHeight;
                            const cursorTop = cursorPercent * ratio * 100;
                            this._cursorElement.style.top = cursorTop + "%";
                            this._cursorElement.style.display = null;
                        }
                    }
                }
                dispose() {
                    this._wrapper.parentNode.removeChild(this._wrapper);
                    this._editor.off("change", this._editorListener);
                }
            }
            exports.AceRadarViewIndicator = AceRadarViewIndicator;
            function _isSet(value) {
                return value !== undefined && value !== null;
            }


            /***/
        }),
/* 9 */
/***/ (function (module, exports, __webpack_require__) {

            "use strict";

            Object.defineProperty(exports, "__esModule", { value: true });
            class AceViewportUtil {
                static getVisibleIndexRange(editor) {
                    let firstRow = editor.getFirstVisibleRow();
                    let lastRow = editor.getLastVisibleRow();
                    if (!editor.isRowFullyVisible(firstRow)) {
                        firstRow++;
                    }
                    if (!editor.isRowFullyVisible(lastRow)) {
                        lastRow--;
                    }
                    const startPos = editor.getSession().getDocument().positionToIndex({ row: firstRow, column: 0 }, 0);
                    // todo, this should probably be the end of the row
                    const endPos = editor.getSession().getDocument().positionToIndex({ row: lastRow, column: 0 }, 0);
                    return {
                        start: startPos,
                        end: endPos
                    };
                }
                static indicesToRows(editor, startIndex, endIndex) {
                    const startRow = editor.getSession().getDocument().indexToPosition(startIndex, 0).row;
                    const endRow = editor.getSession().getDocument().indexToPosition(endIndex, 0).row;
                    return {
                        start: startRow,
                        end: endRow
                    };
                }
            }
            exports.AceViewportUtil = AceViewportUtil;


            /***/
        })
/******/]);
});
import { qs } from './utils.js'


const textEditorIcon = qs("#Text-Editor-icon")
const whiteBoardIcon = qs("#WhiteBoard-icon")
const codeEditorIcon = qs("#Code-Editor-icon")
const videoStreamIcon = qs("#Video-stream-icon")


textEditorIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["Text-Editor"]) {
        snapLayout.setActive("Text-Editor")
    }
    else {
        const options = {
            afterCreation: TextEditor.initializeTextEditor
        }
        snapLayout.createWindow("Text-Editor", textEditorBody, options)
        textEditorIcon.querySelector(".status").classList.add("open")
    }
})

whiteBoardIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["WhiteBoard"]) {
        snapLayout.setActive("WhiteBoard")
    }
    else {
        snapLayout.createWindow("WhiteBoard", "")
        whiteBoardIcon.querySelector(".status").classList.add("open")
    }
})

codeEditorIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["Code-Editor"]) {
        snapLayout.setActive("Code-Editor")
    }
    else {
        const options = {
            afterCreation: CodeEditor.initializeCodeEditor,
            resizer: CodeEditor.resizeAceEditor
        }
        snapLayout.createWindow("Code-Editor", codeEditorBody, options)
        codeEditorIcon.querySelector(".status").classList.add("open")
    }
})

videoStreamIcon.addEventListener("click", () => {
    if (snapLayout.windowsList["Video-stream"]) {
        snapLayout.setActive("Video-stream")
    }
    else {
        snapLayout.createWindow("Video-stream", "")
        videoStreamIcon.querySelector(".status").classList.add("open")
    }
})


const textEditorBody = `
<div id="toolbar-wrapper">
<div id="toolbar">
    <span class="ql-formats">
        <!-- line format -->
        <select class="ql-header">
            <option value="1">Heading</option>
            <option value="2">Subheading</option>
            <option selected="selected"></option>
        </select>

        <!-- font selection -->
        <select class="ql-font">
            <option selected value="arial">Arial</option>
            <option value="roboto">Roboto</option>
            <option value="montserrat">Montserrat</option>
            <option value="helvetica">Helvetica</option>
            <option value="poppins">Poppins</option>
            <option value="merriweather">Merriweather</option>
            <option value="playfair">Playfair</option>
        </select>

        <!-- font size -->
        <select class="ql-size">
            <option value="14px"></option>
            <option value="16px"></option>
            <option value="18px"></option>
            <option value="22px" selected="selected"></option>
            <option value="28px"></option>
            <option value="36px"></option>
        </select>
    </span>

    <span class="ql-formats">
        <!-- bold itlaic and underline buttons -->
        <button class="ql-bold" type="button">
            <svg viewBox="0 0 18 18">
                <path class="ql-stroke"
                    d="M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z">
                </path>
                <path class="ql-stroke"
                    d="M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z">
                </path>
            </svg>
        </button>
        <button class="ql-italic" type="button">
            <svg viewBox="0 0 18 18">
                <line class="ql-stroke" x1="7" x2="13" y1="4" y2="4"></line>
                <line class="ql-stroke" x1="5" x2="11" y1="14" y2="14"></line>
                <line class="ql-stroke" x1="8" x2="10" y1="14" y2="4"></line>
            </svg>
        </button>
        <button class="ql-underline" type="button">
            <svg viewBox="0 0 18 18">
                <path class="ql-stroke" d="M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3">
                </path>
                <rect class="ql-fill" height="1" rx="0.5" ry="0.5" width="12" x="3" y="15"></rect>
            </svg>
        </button>
    </span>

    <span class="ql-formats">
        <!-- numbered list -->
        <button class="ql-list ql-active" value="ordered" type="button">
            <svg viewBox="0 0 18 18">
                <line class="ql-stroke" x1="7" x2="15" y1="4" y2="4"></line>
                <line class="ql-stroke" x1="7" x2="15" y1="9" y2="9"></line>
                <line class="ql-stroke" x1="7" x2="15" y1="14" y2="14"></line>
                <line class="ql-stroke ql-thin" x1="2.5" x2="4.5" y1="5.5" y2="5.5"></line>
                <path class="ql-fill"
                    d="M3.5,6A0.5,0.5,0,0,1,3,5.5V3.085l-0.276.138A0.5,0.5,0,0,1,2.053,3c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,4,2.5v3A0.5,0.5,0,0,1,3.5,6Z">
                </path>
                <path class="ql-stroke ql-thin"
                    d="M4.5,10.5h-2c0-.234,1.85-1.076,1.85-2.234A0.959,0.959,0,0,0,2.5,8.156"></path>
                <path class="ql-stroke ql-thin"
                    d="M2.5,14.846a0.959,0.959,0,0,0,1.85-.109A0.7,0.7,0,0,0,3.75,14a0.688,0.688,0,0,0,.6-0.736,0.959,0.959,0,0,0-1.85-.109">
                </path>
            </svg>
        </button>
        <!-- bullet list -->
        <button class="ql-list" value="bullet" type="button">
            <svg viewBox="0 0 18 18">
                <line class="ql-stroke" x1="6" x2="15" y1="4" y2="4"></line>
                <line class="ql-stroke" x1="6" x2="15" y1="9" y2="9"></line>
                <line class="ql-stroke" x1="6" x2="15" y1="14" y2="14"></line>
                <line class="ql-stroke" x1="3" x2="3" y1="4" y2="4"></line>
                <line class="ql-stroke" x1="3" x2="3" y1="9" y2="9"></line>
                <line class="ql-stroke" x1="3" x2="3" y1="14" y2="14"></line>
            </svg>
        </button>

        <!-- alignment selector -->
        <select class="ql-align">
            <option label=" left" selected=""></option>
            <option label="center" value="center"></option>
            <option label="right" value="right"></option>
            <option label="justify" value="justify"></option>
        </select>
    </span>

    <span class="ql-formats">
        <!-- links -->
        <button class="ql-link" type="button">
            <svg viewBox="0 0 18 18">
                <line class="ql-stroke" x1="7" x2="11" y1="7" y2="11"></line>
                <path class="ql-even ql-stroke"
                    d="M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z">
                </path>
                <path class="ql-even ql-stroke"
                    d="M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z">
                </path>
            </svg>
        </button>
        <!-- images -->
        <button class="ql-image" type="button">
            <svg viewBox="0 0 18 18">
                <rect class="ql-stroke" height="10" width="12" x="3" y="4"></rect>
                <circle class="ql-fill" cx="6" cy="7" r="1"></circle>
                <polyline class="ql-even ql-fill" points="5 12 5 11 7 9 8 10 11 7 13 9 13 12 5 12">
                </polyline>
            </svg>
        </button>
    </span>
</div>
</div>
<div id="textEditor"></div>`

const codeEditorBody = `        
<div class="code-editor-toolbar">
    <div class="mode-selector" title="language mode">
        <span class="label">JavaScript</span>
        <svg viewBox="0 0 18 18">
            <polygon class="stroke" points="7 11 9 13 11 11 7 11"></polygon>
            <polygon class="stroke" points="7 7 9 5 11 7 7 7"></polygon>
        </svg>
        <div class="options">
            <div class="option" mode="javascript" lang="javascript">JavaScript</div>
            <div class="option" mode="c_cpp" lang="c++">C++</div>
            <div class="option" mode="java" lang="java">Java</div>
            <div class="option" mode="python" lang="python">Python</div>
            <div class="option" mode="csharp" lang="csharp">c#</div>
        </div>
    </div>
    <div class="run-code-btn">RUN</div>
</div>
<div class="editor-body">
    <div id="codeEditor"></div>
</div>
<div class="terminal-container">
<div class="terminal-header">
    <div class="output-btn terminal-btn active-terminal-btn">OUTPUT</div>
    <div class="input-btn terminal-btn">INPUT</div>
    <div class="close-terminal-btn">
    <i class="material-icons">close</i>
    </div>
</div>
<div class="output-div terminal-content show-terminal"></div>
<textarea class="input-div terminal-content" placeholder="input goes here"></textarea>
</div>
<div class="editor-footer">
    <div id="terminal-spinner" class="lds-spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>
    <div class="terminal-open-btn footer-btn">TERMINAL</div>
    <div class="word-wrap-btn footer-btn">WRAP</div>
</div>`

import './ConfigureMonacoEnvironment.js';
import { CodeViewMonaco } from '@node-projects/web-component-designer-codeview-monaco';
import { DesignerCanvas, DesignerToolbarButton } from '@node-projects/web-component-designer';
export function getMonacoTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'webui-dark' : 'vs';
}
const monaco = await CodeViewMonaco.getMonacoLib();
monaco.editor.defineTheme('webui-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
        'editor.background': '#212121',
        'editor.foreground': '#ececec',
        'editorLineNumber.foreground': '#a5a5a5',
        'editor.selectionBackground': '#404040',
        'editor.inactiveSelectionBackground': '#343434',
        'editor.lineHighlightBorder': '#383838',
        'editorCursor.foreground': '#f0f0f0'
    }
});
const updateMonacoTheme = () => monaco.editor.setTheme(getMonacoTheme());
window.addEventListener('webui-theme-change', updateMonacoTheme);
// Third-party dialogs can create editors with their own default theme.
monaco.editor.onDidCreateEditor(updateMonacoTheme);
updateMonacoTheme();
// The upstream toolbar has no icon-color token; extend its shared stylesheet.
DesignerToolbarButton.style.insertRule('img { filter: var(--webui-icon-filter, none); }', DesignerToolbarButton.style.cssRules.length);
// Authored screens keep their native control appearance and default text color.
DesignerCanvas.style.insertRule(':host { color-scheme: light; color: initial; }', DesignerCanvas.style.cssRules.length);
export class DesignerCodeView extends CodeViewMonaco {
    updateTheme = () => { this.theme = getMonacoTheme(); };
    connectedCallback() {
        this.updateTheme();
        window.addEventListener('webui-theme-change', this.updateTheme);
    }
    disconnectedCallback() {
        window.removeEventListener('webui-theme-change', this.updateTheme);
    }
}
customElements.define('iobroker-webui-code-view', DesignerCodeView);

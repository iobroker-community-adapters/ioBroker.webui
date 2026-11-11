import './ConfigureMonacoEnvironment.js';
import './DesignerComponentTheme.js';
import './DesignerToolWindowPosition.js';
import { CodeViewMonaco } from '@node-projects/web-component-designer-codeview-monaco';
import { DesignerCanvas, DesignerToolbarButton } from '@node-projects/web-component-designer';
export function getMonacoTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'webui-dark' : 'webui-light';
}
const monaco = await CodeViewMonaco.getMonacoLib();
monaco.editor.defineTheme('webui-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
        'editor.background': '#17232f',
        'editor.foreground': '#d6dfe9',
        'editorLineNumber.foreground': '#a0b1c3',
        'editor.selectionBackground': '#2c554f',
        'editor.inactiveSelectionBackground': '#23433f',
        'editor.lineHighlightBorder': '#34485b',
        'editorCursor.foreground': '#a6dfd6'
    }
});
monaco.editor.defineTheme('webui-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
        'editor.background': '#f5f7fa',
        'editor.foreground': '#334155',
        'editorLineNumber.foreground': '#607187',
        'editor.selectionBackground': '#cde5df',
        'editor.inactiveSelectionBackground': '#deeeeb',
        'editor.lineHighlightBorder': '#cbd6e2',
        'editorCursor.foreground': '#216b65'
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

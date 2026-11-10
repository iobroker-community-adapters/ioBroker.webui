import { BindingsEditor, BindingsEditorHistoric, EventAssignment, ParameterEditor, SimpleScriptCommandPicker, SimpleScriptEditor, VisualizationPropertyGrid } from '@node-projects/web-component-designer-visualization-addons';
import { BorderRadiusEditorWindow, BoxShadowEditorWindow, GradientEditorWindow, TextShadowEditorWindow, RefactorView } from '@node-projects/web-component-designer';
import { BindableObjectsBrowser } from '@node-projects/web-component-designer-widgets-wunderbaum';
// These older editor widgets have literal light surfaces and inherit the page's
// dark text/control scheme. Extend their shared sheets before instances are made.
// Keep these rules out of the authored canvas and runtime components.
const formTheme = `
    :host { color:var(--webui-text); background:var(--webui-surface); }
    button, input, select, textarea { color:var(--webui-text); background-color:var(--webui-surface); border-color:var(--webui-input-border); }
    input[type=checkbox], input[type=radio], input[type=range] { accent-color:var(--webui-accent); }
    button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline:2px solid var(--webui-accent); outline-offset:1px; }
    button:not(:disabled):hover { background-color:var(--webui-hover); }
    :host .toolbar { background:var(--webui-subtle); border-color:var(--webui-border); }
    :host .toolbar button { color:var(--webui-text); background:var(--webui-surface); border-color:var(--webui-input-border); }
    :host .toolbar button:hover:not(:disabled) { background:var(--webui-hover); border-color:var(--webui-input-border); }
    :host .toolbar button:active:not(:disabled) { background:var(--webui-pressed); }
    :host .toolbar button.primary { color:var(--webui-action-text); background:var(--webui-action-background); border-color:var(--webui-action-background); }
    :host .toolbar button.primary:hover:not(:disabled), :host .toolbar button.primary:active:not(:disabled) { background:color-mix(in srgb,var(--webui-action-background),black 12%); border-color:var(--webui-action-background); }
    :host .toolbar .hint, .note, .signal-header, .drag-handle, .cmd-title .hint { color:var(--webui-muted); }
    .cmd-title { color:var(--webui-text); border-color:var(--webui-accent); }
    .cmd { background:var(--webui-surface); }
    .cmd img, .signal-icon-btn img, .wb-icon, .wb-expander { filter:var(--webui-icon-filter,none); }
    .info-btn svg, .toolbar .icon-btn svg { fill:currentColor; }
    .bordered-section, node-projects-code-view-monaco:not([readonly]), node-projects-code-view-monaco[readonly] { border-color:var(--webui-input-border); }
    .snippet { background:var(--webui-subtle); color:var(--webui-text); border-color:var(--webui-border); }
    .cs-key { color:var(--webui-syntax-key); } .cs-str { color:var(--webui-syntax-string); }
    .cs-bool { color:var(--webui-syntax-boolean); } .cs-num { color:var(--webui-syntax-number); }
    div.wunderbaum {
        --wb-node-text-color:var(--webui-text); --wb-background-color:var(--webui-surface); --wb-border-color:var(--webui-border);
        --wb-focus-border-color:var(--webui-accent); --wb-hover-color:var(--webui-hover); --wb-hover-border-color:var(--webui-hover);
        --wb-active-color:var(--webui-pressed); --wb-active-border-color:var(--webui-accent);
        --wb-active-hover-color:var(--webui-hover); --wb-active-hover-border-color:var(--webui-accent);
        --wb-active-color-grayscale:var(--webui-selected); --wb-active-border-color-grayscale:var(--webui-border);
        --wb-active-hover-color-grayscale:var(--webui-hover); --wb-alternate-row-color:var(--webui-subtle); --wb-alternate-row-color-hover:var(--webui-hover);
    }
`;
function extend(sheet, rules) {
    sheet.replaceSync(Array.from(sheet.cssRules, rule => rule.cssText).join('\n') + rules);
}
for (const component of [BindingsEditor, BindingsEditorHistoric, EventAssignment, ParameterEditor, SimpleScriptCommandPicker, SimpleScriptEditor, RefactorView, BindableObjectsBrowser]) {
    extend(component.style, formTheme);
}
// The floating CSS editors already consume palette tokens, but their action
// button foreground and hover surfaces still use incompatible literal colors.
for (const sheet of new Set([BorderRadiusEditorWindow, BoxShadowEditorWindow, GradientEditorWindow, TextShadowEditorWindow].map(component => component.style))) {
    extend(sheet, `
        :host label:has(#ge-repeating) { color:var(--webui-text) !important; }
        :host .corner-row .val-label { color:var(--webui-muted); }
        :host .stop-actions button:hover { color:var(--webui-text); background:var(--webui-hover); }
        :host .layer-list li.selected { background:var(--webui-selected); color:var(--webui-text); }
        :host .actions button:not(.apply-btn):hover, :host .layer-buttons button:hover { background:var(--webui-hover); }
        :host .apply-btn { color:var(--webui-action-text); background:var(--webui-action-background); border-color:var(--webui-action-background); }
        :host .apply-btn:hover { background:color-mix(in srgb,var(--webui-action-background),black 12%); }
    `);
}
// SimpleScriptEditor adds these enabled actions with inline 0.2 opacity.
// Keep the buttons discoverable before hover, including keyboard navigation.
extend(VisualizationPropertyGrid.style, `
    button[title="complex property value"] { opacity:1 !important; color:var(--webui-text); background:var(--webui-surface); border:1px solid var(--webui-input-border); }
    button[title="complex property value"]:hover { background:var(--webui-hover); }
`);
extend(EventAssignment.style, `button[title="parameter"][style*="lime"] { color:#111; }`);

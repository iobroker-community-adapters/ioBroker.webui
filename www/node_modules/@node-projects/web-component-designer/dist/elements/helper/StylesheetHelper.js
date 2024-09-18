export function stylesheetFromString(window, text) {
    //@ts-ignore
    const newStylesheet = new window.CSSStyleSheet();
    newStylesheet.replaceSync(text);
    return newStylesheet;
}
export function stylesheetToString(stylesheet) {
    return Array.from(stylesheet.cssRules).map(rule => rule.cssText).join('\n');
}
//# sourceMappingURL=StylesheetHelper.js.map
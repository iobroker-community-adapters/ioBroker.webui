export function shadowrootGetSelection(shadowRoot) {
    let selection = document.getSelection();
    if (shadowRoot.getSelection)
        selection = shadowRoot.getSelection();
    else if (selection.getComposedRanges)
        selection = selection.getComposedRanges(shadowRoot);
    return selection;
}
function wrapTextNodesInSpan(range, spans) {
    function wrapNode(node) {
        const parent = node.parentNode;
        if (!parent)
            return;
        const span = document.createElement('span');
        spans.push(span);
        parent.insertBefore(span, node);
        span.appendChild(node);
    }
    function canReuseSpan(node) {
        return node instanceof HTMLSpanElement && Array.from(node.childNodes).every(x => x.nodeType === Node.TEXT_NODE);
    }
    function processNode(node) {
        switch (node.nodeType) {
            case Node.TEXT_NODE:
                wrapNode(node);
                break;
            case Node.DOCUMENT_FRAGMENT_NODE:
            case Node.ELEMENT_NODE:
                if (canReuseSpan(node)) {
                    spans.push(node);
                    break;
                }
                Array.from(node.childNodes).forEach(processNode);
                break;
        }
    }
    const fragment = range.extractContents();
    processNode(fragment);
    range.insertNode(fragment);
}
function staticRangeToRange(staticRange) {
    const range = document.createRange();
    range.setStart(staticRange.startContainer, staticRange.startOffset);
    range.setEnd(staticRange.endContainer, staticRange.endOffset);
    return range;
}
export function wrapSelectionInSpans(selection) {
    const spans = [];
    if ('getRangeAt' in selection) {
        if (!selection.rangeCount)
            return spans;
        const range = selection.getRangeAt(0);
        wrapTextNodesInSpan(range, spans);
    }
    else {
        const staticRange = selection[0];
        if (!staticRange)
            return spans;
        wrapTextNodesInSpan(staticRangeToRange(staticRange), spans);
    }
    if ('removeAllRanges' in selection && selection.removeAllRanges)
        selection.removeAllRanges();
    return spans;
}
//# sourceMappingURL=SelectionHelper.js.map
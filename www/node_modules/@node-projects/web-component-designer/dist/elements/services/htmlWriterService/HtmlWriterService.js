import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { NodeType } from '../../item/NodeType.js';
import { isEmptyTextNode, isInline, isInlineAfter } from '../../helper/ElementHelper.js';
import { AbstractHtmlWriterService } from './AbstractHtmlWriterService.js';
export class HtmlWriterService extends AbstractHtmlWriterService {
    constructor(options) {
        super(options);
    }
    _conditionalyWriteIndent(indentedTextWriter, designItem, preserveInlineWhitespace) {
        if (preserveInlineWhitespace)
            return;
        if ((designItem.element instanceof designItem.window.HTMLElement && !isInlineAfter(designItem.element)) ||
            (designItem.element.previousElementSibling instanceof designItem.window.HTMLElement && !isInline(designItem.element.previousElementSibling)) ||
            (designItem.element.previousElementSibling == null && !this._isInlineElement(designItem.element.parentElement) && (designItem.element.previousSibling == null || isEmptyTextNode(designItem.element.previousSibling))) ||
            (designItem.element instanceof designItem.window.SVGElement))
            indentedTextWriter.writeIndent();
    }
    _conditionalyWriteIndentBefore(indentedTextWriter, designItem, preserveInlineWhitespace) {
        if (preserveInlineWhitespace)
            return;
        if ((designItem.element.previousElementSibling instanceof designItem.window.HTMLElement && !isInline(designItem.element.previousElementSibling)) ||
            (designItem.element.previousElementSibling == null && !this._isInlineElement(designItem.element.parentElement) && (designItem.element.previousSibling == null || isEmptyTextNode(designItem.element.previousSibling))) ||
            (designItem.element instanceof designItem.window.SVGElement))
            indentedTextWriter.writeIndent();
    }
    _conditionalyWriteNewline(indentedTextWriter, designItem, preserveInlineWhitespace) {
        if (preserveInlineWhitespace)
            return;
        if ((designItem.element instanceof designItem.window.HTMLElement && !isInlineAfter(designItem.element)) ||
            (designItem.element.nextElementSibling instanceof designItem.window.HTMLElement && !isInline(designItem.element.nextElementSibling)) ||
            (designItem.element instanceof designItem.window.SVGElement))
            indentedTextWriter.writeNewline();
    }
    write(indentedTextWriter, designItems, rootContainerKeepInline, updatePositions = false) {
        for (const d of designItems) {
            this.internalWrite(indentedTextWriter, d, updatePositions, false);
        }
    }
    //TODO: special case for style/script nodes, keep whitespace
    internalWrite(indentedTextWriter, designItem, updatePositions, preserveInlineWhitespace) {
        let start = indentedTextWriter.position;
        let end = indentedTextWriter.position;
        const currentPreserveInlineWhitespace = preserveInlineWhitespace || this._isInlineContainer(designItem);
        if (designItem.nodeType == NodeType.TextNode) {
            if (isEmptyTextNode(designItem.element) &&
                ((designItem.element.previousSibling instanceof designItem.window.HTMLElement && !isInlineAfter(designItem.element.previousSibling)) ||
                    (designItem.element.nextSibling instanceof designItem.window.HTMLElement && !isInline(designItem.element.nextSibling)))) {
            }
            else
                this.writeTextNode(indentedTextWriter, designItem, true, true, currentPreserveInlineWhitespace);
            end = indentedTextWriter.position;
        }
        else if (designItem.nodeType == NodeType.Comment) {
            this._conditionalyWriteIndent(indentedTextWriter, designItem, currentPreserveInlineWhitespace);
            start = indentedTextWriter.position;
            indentedTextWriter.write('<!--' + designItem.content + '-->');
            end = indentedTextWriter.position;
            this._conditionalyWriteNewline(indentedTextWriter, designItem, currentPreserveInlineWhitespace);
        }
        else {
            this._conditionalyWriteIndentBefore(indentedTextWriter, designItem, currentPreserveInlineWhitespace);
            start = indentedTextWriter.position;
            indentedTextWriter.write('<' + designItem.name);
            this.writeAttributes(indentedTextWriter, designItem);
            this.writeStyles(indentedTextWriter, designItem);
            indentedTextWriter.write('>');
            let contentSingleTextNode = false;
            if (designItem.hasChildren) {
                const children = designItem.children();
                contentSingleTextNode = designItem.childCount === 1 && designItem.firstChild.nodeType === NodeType.TextNode;
                if (contentSingleTextNode) {
                    const notrim = designItem.name == 'script' || designItem.name == 'style' || designItem.name == 'pre';
                    this.writeTextNode(indentedTextWriter, designItem, false, !notrim, currentPreserveInlineWhitespace);
                }
                else {
                    if (!currentPreserveInlineWhitespace && (designItem.element instanceof designItem.window.HTMLElement && !isInlineAfter(designItem.element) || (designItem.element instanceof designItem.window.SVGElement))) {
                        indentedTextWriter.writeNewline();
                        indentedTextWriter.levelRaise();
                    }
                    for (const c of children) {
                        this.internalWrite(indentedTextWriter, c, updatePositions, currentPreserveInlineWhitespace);
                        let childSingleTextNode = c.childCount === 1 && c.firstChild.nodeType === NodeType.TextNode;
                        if (childSingleTextNode)
                            if (!indentedTextWriter.isLastCharNewline())
                                this._conditionalyWriteNewline(indentedTextWriter, c, currentPreserveInlineWhitespace);
                    }
                    if (!currentPreserveInlineWhitespace && (designItem.element instanceof designItem.window.HTMLElement && !isInlineAfter(designItem.element) || (designItem.element instanceof designItem.window.SVGElement))) {
                        indentedTextWriter.levelShrink();
                        if (!indentedTextWriter.isLastCharNewline())
                            indentedTextWriter.writeNewline();
                        indentedTextWriter.writeIndent();
                    }
                }
            }
            else if (designItem.hasContent) {
                indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
                //this._conditionalyWriteNewline(indentedTextWriter, designItem);
            }
            end = indentedTextWriter.position;
            if (!DomConverter.IsSelfClosingElement(designItem.name))
                indentedTextWriter.write('</' + designItem.name + '>');
            end = indentedTextWriter.position;
            //if (!contentSingleTextNode)
            if (!currentPreserveInlineWhitespace && !indentedTextWriter.isLastCharNewline() && (!designItem.parent || !isInlineAfter(designItem.parent.element)))
                this._conditionalyWriteNewline(indentedTextWriter, designItem, currentPreserveInlineWhitespace);
        }
        if (updatePositions && designItem.instanceServiceContainer.designItemDocumentPositionService) {
            designItem.instanceServiceContainer.designItemDocumentPositionService.setPosition(designItem, { start: start, length: end - start });
        }
    }
    writeTextNode(indentedTextWriter, designItem, indentAndNewline, trim = true, preserveInlineWhitespace = false) {
        let start = indentedTextWriter.position;
        let end = indentedTextWriter.position;
        let content = DomConverter.normalizeContentValue(designItem.content);
        if (preserveInlineWhitespace || this._hasInlineParent(designItem))
            content = this._normalizeInlineTextContent(content);
        else if (trim)
            content = content.trim();
        if (content) {
            if (indentAndNewline)
                this._conditionalyWriteIndent(indentedTextWriter, designItem, preserveInlineWhitespace);
            indentedTextWriter.write(content);
            if (indentAndNewline)
                this._conditionalyWriteNewline(indentedTextWriter, designItem, preserveInlineWhitespace);
        }
        end = indentedTextWriter.position;
        for (const d of designItem.children())
            designItem.instanceServiceContainer.designItemDocumentPositionService.setPosition(d, { start: start, length: end - start });
    }
    _hasInlineParent(designItem) {
        return designItem.parent?.element instanceof designItem.window.HTMLElement && isInline(designItem.parent.element);
    }
    _normalizeInlineTextContent(content) {
        if (!content?.trim())
            return '';
        const hasLeadingWhitespace = /^\s/.test(content);
        const hasTrailingWhitespace = /\s$/.test(content);
        const normalized = content.replaceAll(/[\t\r\n ]+/g, ' ').trim();
        return `${hasLeadingWhitespace ? ' ' : ''}${normalized}${hasTrailingWhitespace ? ' ' : ''}`;
    }
    _isInlineContainer(designItem) {
        return designItem.nodeType === NodeType.Element && designItem.element instanceof designItem.window.HTMLElement && isInline(designItem.element);
    }
    _isInlineElement(element) {
        return element instanceof HTMLElement && isInline(element);
    }
}
//# sourceMappingURL=HtmlWriterService.js.map
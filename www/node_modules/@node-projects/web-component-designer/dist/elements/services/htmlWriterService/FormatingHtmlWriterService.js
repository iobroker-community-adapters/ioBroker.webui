import { DomConverter } from '../../widgets/designerView/DomConverter.js';
import { CssCombiner } from '../../helper/CssCombiner.js';
import { NodeType } from '../../item/NodeType.js';
import { PropertiesHelper } from '../propertiesService/services/PropertiesHelper.js';
import { ElementDisplayType, getElementDisplaytype } from '../../helper/ElementHelper.js';
var ElementContainerType;
(function (ElementContainerType) {
    ElementContainerType[ElementContainerType["inline"] = 0] = "inline";
    ElementContainerType[ElementContainerType["block"] = 1] = "block";
    ElementContainerType[ElementContainerType["complex"] = 2] = "complex";
})(ElementContainerType || (ElementContainerType = {}));
// const defaultDisplayNoneContainerDisplayType: ElementContainerType = ElementContainerType.complex;
export class FormatingHtmlWriterService {
    options;
    constructor(options) {
        this.options = options ?? {};
        this.options.beautifyOutput ??= true;
        this.options.compressCssToShorthandProperties ??= true;
        this.options.writeDesignerProperties ??= true;
        this.options.parseJsonInAttributes ??= true;
        this.options.jsonWriteMode ??= 'min';
    }
    writeAttributes(writeContext, designItem) {
        if (designItem.hasAttributes) {
            for (const a of designItem.attributes()) {
                writeContext.indentedTextWriter.write(' ');
                if (typeof a[1] === 'string') {
                    if (a[1] === "")
                        writeContext.indentedTextWriter.write(a[0]);
                    else
                        writeContext.indentedTextWriter.write(a[0] + '="' + DomConverter.normalizeAttributeValue(a[1]) + '"');
                }
                else if (!a[1])
                    writeContext.indentedTextWriter.write(a[0]);
                else {
                }
            }
        }
    }
    writeStyles(writeContext, designItem) {
        if (designItem.hasStyles) {
            writeContext.indentedTextWriter.write(' style="');
            let styles = designItem.styles();
            if (writeContext.options.compressCssToShorthandProperties)
                styles = CssCombiner.combine(new Map(styles));
            for (const s of styles) {
                if (s[0]) {
                    writeContext.indentedTextWriter.write(PropertiesHelper.camelToDashCase(s[0]) + ':' + DomConverter.normalizeAttributeValue(s[1]) + ';');
                }
            }
            writeContext.indentedTextWriter.write('"');
        }
    }
    _writeTextNode(writeContext, designItem) {
        writeContext.lastElementDisplayType = ElementDisplayType.inline;
        let content = DomConverter.normalizeContentValue(designItem.content);
        if (writeContext.containerDisplayType === ElementContainerType.inline)
            content = this._normalizeInlineTextContent(content);
        else
            content = content.trim();
        if (content) {
            writeContext.indentedTextWriter.write(content);
        }
    }
    _normalizeInlineTextContent(content) {
        if (!content?.trim())
            return '';
        const hasLeadingWhitespace = /^\s/.test(content);
        const hasTrailingWhitespace = /\s$/.test(content);
        const normalized = content.replaceAll(/[\t\r\n ]+/g, ' ').trim();
        return `${hasLeadingWhitespace ? ' ' : ''}${normalized}${hasTrailingWhitespace ? ' ' : ''}`;
    }
    _writeCommentNode(writeContext, designItem) {
        writeContext.indentedTextWriter.write('<!--' + designItem.content + '-->');
    }
    _writeElementNode(writeContext, designItem) {
        //    const cs = getComputedStyle(designItem.element);
        //cs.whiteSpace === 'pre'
        //isInPre
        //is in inline?
        const currentElementDisplayType = getElementDisplaytype(designItem.element);
        writeContext.lastElementDisplayType = currentElementDisplayType;
        writeContext.indentedTextWriter.write('<' + designItem.name);
        this.writeAttributes(writeContext, designItem);
        this.writeStyles(writeContext, designItem);
        writeContext.indentedTextWriter.write('>');
        let contentSingleTextNode = false;
        if (designItem.hasChildren) {
            const children = designItem.children();
            contentSingleTextNode = designItem.childCount === 1 && designItem.firstChild.nodeType === NodeType.TextNode;
            let previousContainerDisplayType = writeContext.containerDisplayType;
            writeContext.containerDisplayType = this.getContainerType(designItem.element);
            if (contentSingleTextNode) {
                this._writeInternal(writeContext, designItem.firstChild);
            }
            else {
                if (writeContext.containerDisplayType !== ElementContainerType.inline)
                    writeContext.indentedTextWriter.levelRaise();
                this._writeDesignItemList(currentElementDisplayType, writeContext, children);
                if (writeContext.containerDisplayType !== ElementContainerType.inline)
                    writeContext.indentedTextWriter.levelShrink();
            }
            writeContext.containerDisplayType = previousContainerDisplayType;
        }
        else if (designItem.hasContent) {
            writeContext.indentedTextWriter.write(DomConverter.normalizeContentValue(designItem.content));
        }
        if (!DomConverter.IsSelfClosingElement(designItem.name)) {
            if (currentElementDisplayType === ElementDisplayType.block && designItem.hasChildren && !contentSingleTextNode) {
                this._writeNewlineAndIntend(writeContext);
            }
            //write newline & intend ???
            writeContext.indentedTextWriter.write('</' + designItem.name + '>');
            if (currentElementDisplayType !== ElementDisplayType.none) {
                writeContext.lastElementDisplayType = currentElementDisplayType;
            }
        }
    }
    _writeDesignItemList(currentElementDisplayType, writeContext, children) {
        for (const c of children) {
            if (writeContext.lastElementDisplayType == null) {
                //first entry, do nothing
            }
            else if (writeContext.containerDisplayType === ElementContainerType.inline) {
                // Inline containers are whitespace-sensitive. Do not add beautification whitespace.
            }
            else if (writeContext.containerDisplayType === ElementContainerType.complex)
                this._writeNewlineAndIntend(writeContext);
            else if (writeContext.lastElementDisplayType !== ElementDisplayType.inline /*|| currentElementDisplayType !== ElementDisplayType.inline*/)
                this._writeNewlineAndIntend(writeContext);
            this._writeInternal(writeContext, c);
        }
    }
    _writeNewlineAndIntend(writeContext) {
        writeContext.indentedTextWriter.writeNewline();
        writeContext.indentedTextWriter.writeIndent();
    }
    _writeInternal(writeContext, designItem) {
        const start = writeContext.indentedTextWriter.position;
        if (designItem.nodeType === NodeType.TextNode)
            this._writeTextNode(writeContext, designItem);
        else if (designItem.nodeType === NodeType.Comment)
            this._writeCommentNode(writeContext, designItem);
        else if (designItem.nodeType === NodeType.Element)
            this._writeElementNode(writeContext, designItem);
        if (writeContext.designItemsAssignmentList) {
            writeContext.designItemsAssignmentList.set(designItem, { start: start, length: writeContext.indentedTextWriter.position - start - 1 });
        }
    }
    getContainerType(element) {
        const display = (element.ownerDocument.defaultView ?? window).getComputedStyle(element).display;
        if (display === 'inline')
            return ElementContainerType.inline;
        if (display === 'block' || display === "inline-block" || display == '')
            return ElementContainerType.block;
        return ElementContainerType.complex;
    }
    write(indentedTextWriter, designItems, rootContainerKeepInline) {
        const context = { indentedTextWriter, options: this.options, lastElementDisplayType: null, containerDisplayType: ElementContainerType.block };
        this._writeDesignItemList(ElementDisplayType.inline, context, designItems);
    }
}
//# sourceMappingURL=FormatingHtmlWriterService.js.map
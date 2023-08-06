import Node from './node.js';
import NodeType from './type.js';
export default class CommentNode extends Node {
    rawText;
    clone() {
        return new CommentNode(this.rawText, null);
    }
    constructor(rawText, parentNode, range) {
        super(parentNode, range);
        this.rawText = rawText;
    }
    /**
     * Node Type declaration.
     * @type {Number}
     */
    nodeType = NodeType.COMMENT_NODE;
    /**
     * Get unescaped text value of current node and its children.
     * @return {string} text content
     */
    get text() {
        return this.rawText;
    }
    toString() {
        return `<!--${this.rawText}-->`;
    }
}

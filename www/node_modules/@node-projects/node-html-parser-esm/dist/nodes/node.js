import { decode } from '@node-projects/lean-he-esm';
import { encode } from '@node-projects/lean-he-esm';
/**
 * Node Class as base class for TextNode and HTMLElement.
 */
export default class Node {
    parentNode;
    childNodes = [];
    range;
    constructor(parentNode = null, range) {
        this.parentNode = parentNode;
        Object.defineProperty(this, 'range', {
            enumerable: false,
            writable: true,
            configurable: true,
            value: range ?? [-1, -1]
        });
    }
    /**
     * Remove current node
     */
    remove() {
        if (this.parentNode) {
            const children = this.parentNode.childNodes;
            this.parentNode.childNodes = children.filter((child) => {
                return this !== child;
            });
            this.parentNode = null;
        }
        return this;
    }
    get innerText() {
        return this.rawText;
    }
    get textContent() {
        return decode(this.rawText);
    }
    set textContent(val) {
        this.rawText = encode(val);
    }
}

import { DesignItem } from '../../item/DesignItem.js';
import { isFirefox } from '../../helper/Browser.js';
export class DefaultHtmlParserService {
    async parse(html, serviceContainer, instanceServiceContainer, parseSnippet) {
        let doc;
        //@ts-ignore
        if (Document.parseHTMLUnsafe && !isFirefox) {
            //@ts-ignore
            doc = Document.parseHTMLUnsafe(html);
        }
        else {
            //@ts-ignore
            doc = new DOMParser().parseFromString(html, 'text/html', { includeShadowRoots: true });
        }
        const headNodes = this.createDesignItems(doc.head.childNodes, serviceContainer, instanceServiceContainer);
        const bodyNodes = this.createDesignItems(doc.body.childNodes, serviceContainer, instanceServiceContainer);
        return [...headNodes, ...bodyNodes];
    }
    createDesignItems(elements, serviceContainer, instanceServiceContainer) {
        let res = [];
        for (let el of elements) {
            res.push(this._createDesignItemsRecursive(el, serviceContainer, instanceServiceContainer));
        }
        return res;
    }
    _createDesignItemsRecursive(node, serviceContainer, instanceServiceContainer) {
        return DesignItem.createDesignItemFromInstance(node, serviceContainer, instanceServiceContainer);
    }
}
//# sourceMappingURL=DefaultHtmlParserService.js.map
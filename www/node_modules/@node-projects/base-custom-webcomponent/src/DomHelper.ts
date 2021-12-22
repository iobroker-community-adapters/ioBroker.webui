export class DomHelper {
    static * getAllChildNodes(element: ParentNode, includeShadowDom = false, ignore?: Node[]): IterableIterator<Node> {
        if (!ignore || ignore.indexOf(<Node><any>element) < 0) {
            if (element.children) {
                for (const node of element.children) {
                    yield node;
                    if (includeShadowDom && node.shadowRoot != null) {
                        yield node.shadowRoot;
                        const childs = DomHelper.getAllChildNodes(node.shadowRoot, includeShadowDom, ignore);
                        for (const cnode of childs) {
                            yield cnode;
                        }
                    }
                    const childs = DomHelper.getAllChildNodes(node, includeShadowDom, ignore);
                    for (const cnode of childs) {
                        yield cnode;
                    }
                }
            }
            if (includeShadowDom && (<any>element).shadowRoot != null) {
                yield (<any>element).shadowRoot;
                const childs = DomHelper.getAllChildNodes((<any>element).shadowRoot, includeShadowDom);
                for (const cnode of childs) {
                    yield cnode;
                }
            }
        }
        return null;
    }

    static removeAllChildnodes(node: Node, className?: string) {
        if (!className) {
            for (let c = node.firstChild; c !== null; c = node.firstChild) {
                node.removeChild(c);
            }
        } else {
            const elements = (<HTMLElement>node).querySelectorAll('.' + className);
            for (const e of elements) {
                if (e.parentNode == node)
                    node.removeChild(e);
            }
        }
    }

    static nodeIndex(node: Node) {
        let i = 0;
        while ((node = node.previousSibling) != null)
            i++;
        return i;
    }

    static childIndex(node: Node) {
        for (let i = 0; i < node.parentElement.children.length; i++)
            if (node.parentElement.children[i] == node)
                return i;
        return -1;
    }

    static getHost(node: Node) {
        while (node.parentElement)
            node = node.parentElement;
        if ((<ShadowRoot>node).host)
            return (<ShadowRoot>node).host
        return (<ShadowRoot>node.parentNode).host;
    }

    static nodeIsChildOf(node: Node, parentNode: Node) {
        while (node.parentElement) {
            if (node.parentElement == parentNode)
                return true;
            node = node.parentElement;
        }
        return false;
    }
}
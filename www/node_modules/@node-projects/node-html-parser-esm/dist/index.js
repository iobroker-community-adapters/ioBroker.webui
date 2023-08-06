import CommentNode from './nodes/comment.js';
import HTMLElement from './nodes/html.js';
import Node from './nodes/node.js';
import TextNode from './nodes/text.js';
import NodeType from './nodes/type.js';
import baseParse from './parse.js';
import valid from './valid.js';
export { parse, HTMLElement, CommentNode, valid, Node, TextNode, NodeType };
export default function parse(data, options = {}) {
    return baseParse(data, options);
}
parse.parse = baseParse;
parse.HTMLElement = HTMLElement;
parse.CommentNode = CommentNode;
parse.valid = valid;
parse.Node = Node;
parse.TextNode = TextNode;
parse.NodeType = NodeType;

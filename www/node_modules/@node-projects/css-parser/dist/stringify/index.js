import Compiler from './compiler.js';
export default (node, options) => {
    const compiler = new Compiler(options || {});
    return compiler.compile(node);
};

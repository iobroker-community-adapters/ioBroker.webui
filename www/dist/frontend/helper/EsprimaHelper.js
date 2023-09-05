import { ExportNamedDeclaration, FunctionDeclaration } from 'esprima-next';
export async function findFunctionDeclarations(script) {
    try {
        let esprima = await import('esprima-next');
        let tree = esprima.parseModule(script);
        let f = [];
        for (let ast of tree.body) {
            if (ast instanceof ExportNamedDeclaration && ast.declaration instanceof FunctionDeclaration) {
                f.push(ast.declaration);
            }
        }
        return f;
    }
    catch (err) {
        console.error('error parsing javascript', err);
    }
    return null;
}

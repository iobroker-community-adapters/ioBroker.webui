import { ExportNamedDeclaration, FunctionDeclaration } from 'esprima-next';
export async function findExportFunctionDeclarations(script) {
    try {
        let esprima = await import('esprima-next');
        let tree = esprima.parseModule(script, { loc: true });
        let f = [];
        for (let ast of tree.body) {
            if (ast instanceof ExportNamedDeclaration && ast.declaration instanceof FunctionDeclaration) {
                f.push(ast);
            }
        }
        return f;
    }
    catch (err) {
        console.error('error parsing javascript', err);
    }
    return null;
}

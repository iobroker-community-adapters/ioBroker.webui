import * as esbuild from 'esbuild'
import path from 'node:path'
import { readFile } from 'fs/promises';

let onResolvePlugin = {
    name: 'myPlugin',
    setup(build) {
        build.onResolve({ filter: /\.gif/ }, args => {
            return { path: args.path, external: true }
        });
        build.onResolve({ filter: /\.ttf/ }, args => {
            return { path: args.path, external: true }
        });
        /*build.onResolve({ filter: /\.css/ }, async args => {
            if (args.kind === "import-statement" && args.pluginData != 'cssConstructableStylesheet') {
                const { path, resolveDir, pluginData, namespace, kind, importer } = args;
                const result = await build.resolve(path, {
                    resolveDir,
                    pluginData,
                    kind,
                    namespace,
                    pluginData: 'cssConstructableStylesheet'
                });
                return { path: result.path, pluginData: 'cssConstructableStylesheet' + importer }
            }
        });*/
    },
}

const cssConstructStylesheetPlugin = {
    name: 'css imports',
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            if (args.with.type === 'css') {
                const css = await readFile(args.path, 'utf8');
                let fixedCss = css.replaceAll('`', '\\`').replaceAll(/\\(?:[1-7][0-7]{0,2}|[0-7]{2,3})/gm, '${\'\\$&\'}');
                
                fixedCss = (await build.esbuild.transform(fixedCss, {
                    loader: 'css',
                    minify: build.initialOptions.minify,
                })).code;
                const contents = `
        let styles = new CSSStyleSheet();
        styles.replaceSync(\`${fixedCss}\`);
        export default styles`;
                return { contents, loader: 'js' };
            }
        });
    }
}
  
await esbuild.build({
    entryPoints: ['runtime.js'],
    bundle: true,
    format: 'esm',
    minify: true,
    //treeShaking: true,
    //external: ['*.css'],
    outfile: 'runtime-bundle.js',
    plugins: [cssConstructStylesheetPlugin, onResolvePlugin],
    //loader: { '.png': 'binary' },
});
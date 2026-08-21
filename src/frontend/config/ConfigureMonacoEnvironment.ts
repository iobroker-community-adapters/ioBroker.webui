const monacoVsBaseUrl = new URL(
    '../../../node_modules/@node-projects/monaco-editor-esm/esm/vs/',
    import.meta.url
);

const workerModules: Record<string, string> = {
    css: 'languages/features/css/css.worker.js',
    handlebars: 'languages/features/html/html.worker.js',
    html: 'languages/features/html/html.worker.js',
    javascript: 'languages/features/typescript/ts.worker.js',
    json: 'languages/features/json/json.worker.js',
    less: 'languages/features/css/css.worker.js',
    razor: 'languages/features/html/html.worker.js',
    scss: 'languages/features/css/css.worker.js',
    typescript: 'languages/features/typescript/ts.worker.js'
};

const editorWorkerModule = 'editor/common/services/editorWebWorkerMain.js';

globalThis.MonacoEnvironment = {
    ...globalThis.MonacoEnvironment,
    getWorker(_workerId: string, label: string) {
        const workerModule = workerModules[label] ?? editorWorkerModule;
        return new Worker(new URL(workerModule, monacoVsBaseUrl), {
            name: label,
            type: 'module'
        });
    }
};


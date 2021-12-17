import merge from 'deepmerge';
import { createSpaConfig } from '@open-wc/building-rollup';
import url from '@rollup/plugin-url'

const baseConfig = createSpaConfig({
    outputDir: 'www',
    developmentMode: process.env.ROLLUP_WATCH === 'true',
    // set to true to inject the service worker registration into your index.html
    injectServiceWorker: false,
    workbox: {
        inlineWorkboxRuntime: true
    },
});

export default merge(baseConfig, {
    input: './index.html',
    plugins: [
        url({
            // by default, rollup-plugin-url will not handle font files
            include: ['**/*.woff', '**/*.woff2'],
            // setting infinite limit will ensure that the files 
            // are always bundled with the code, not copied to /dist
            limit: Infinity,
        }),
    ],
});
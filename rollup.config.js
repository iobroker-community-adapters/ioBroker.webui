import merge from 'deepmerge';
import { createSpaConfig } from '@open-wc/building-rollup';

// use createBasicConfig to do regular JS to JS bundling
// import { createBasicConfig } from '@open-wc/building-rollup';

const baseConfig = createSpaConfig({
    outputDir: 'www',
    developmentMode: process.env.ROLLUP_WATCH === 'true',
    // set to true to inject the service worker registration into your index.html
    injectServiceWorker: false,
});

export default merge(baseConfig, {
    input: './index.html',
});
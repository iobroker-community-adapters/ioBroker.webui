import toolbox from "@node-projects/web-component-designer-visualization-addons/dist/blockly/BlocklyToolbox.js";

const tb = structuredClone(toolbox);
const systemLst = tb.contents.find(x => x.name === 'System').contents;

//@ts-ignore
systemLst.push({
    kind: 'block',
    type: 'open_screen',
    inputs: {
        SCREEN: {
            shadow: {
                type: 'text',
                fields: {
                    TEXT: '',
                },
            },
        },
    },
});

export default tb;
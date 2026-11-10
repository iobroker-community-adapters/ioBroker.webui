import { runToolLoop } from '@iobroker/ai-core/build/shared/index.js';
import { AiTurnController } from '../../dist/frontend/ai/AiTurnController.js';
import { expect } from 'chai';
import { AiAssetCatalog, assetPath } from '../../dist/frontend/ai/AiAssetCatalog.js';
import { componentApi } from '../../dist/frontend/ai/AiComponentApi.js';
import { AiToolContext } from '../../dist/frontend/ai/AiTools.js';
import { userMessage } from '../../dist/frontend/ai/AiAttachments.js';

function catalog() {
    const reads = [];
    const chart = {_id:'echarts.0.heating', common:{name:'Heating'},native:{config:{title:'Heating',password:'hidden',nested:{apiKey:'hidden'}},url:'preset=heating&token=hidden',privateField:'hidden'}};
    const socket = {
        getObjectViewSystem: async () => ({icons:{_id:'system.adapter.icons-test',common:{name:'icons-test',type:'visualization-icons'}}}),
        readDir: async (ns,path) => { reads.push([ns,path]); return [{file:'heating.svg',isDir:false,stats:{size:40}},{file:'folder',isDir:true},{file:'private.js',isDir:false}]; },
        getObjectViewCustom: async (_a,_b,start) => start.startsWith('echarts') ? {chart} : {},
        getObject: async () => chart,
        readFile: async () => ({file:'PHN2Zy8+',mimeType:'image/svg+xml'})
    };
    return {assets:new AiAssetCatalog(socket,'webui.0.files','https://example.test/'),reads};
}
describe('AI lazy asset discovery and component APIs', () => {
    it('pages one directory level, hides non-images and exposes real URLs', async () => {
        const {assets,reads} = catalog();
        const metadata = await assets.read({kind:'image',path:'heating.svg'}, false);
        expect(metadata).not.to.have.property('base64'); expect(metadata.size).to.equal(40);
        reads.length = 0;
        const page = await assets.list({kind:'image',limit:1});
        expect(page.total).to.equal(2); expect(page.nextOffset).to.equal(1); expect(reads).to.deep.equal([['webui.0.files','config/images']]);
        const filtered = await assets.list({kind:'image',query:'heating'});
        expect(filtered.items[0].url).to.equal('https://example.test/webui.0.files/config/images/heating.svg');
    });
    it('allows only local image paths and discovered icon libraries', async () => {
        const {assets} = catalog();
        for (const path of ['../secret','/secret','a//b','a\\b']) expect(() => assetPath(path)).to.throw();
        await expect(assets.read({kind:'image',namespace:'system.adapter',path:'x.svg'})).to.be.rejectedWith('webui image library');
        await expect(assets.read({kind:'icon',namespace:'other',path:'x.svg'})).to.be.rejectedWith('installed icon library');
        expect((await assets.list({kind:'icon'})).items[0].namespace).to.equal('icons-test');
        expect((await assets.read({kind:'icon',namespace:'icons-test',path:'x.svg'})).mimeType).to.equal('image/svg+xml');
    });
    it('reads chart configuration in chunks, strips credential fields and exposes no false raster preview', async () => {
        const {assets} = catalog();
        const result = await assets.read({kind:'chart',namespace:'echarts',path:'echarts.0.heating',limit:30000});
        expect(result.imagePreviewAvailable).to.equal(false); expect(result.url).to.include('preset=echarts.0.heating');
        expect(JSON.stringify(result)).not.to.include('hidden');
        const page = await assets.read({kind:'chart',path:'echarts.0.heating',limit:10});
        expect(page.text.length).to.equal(10); expect(page.nextOffset).to.equal(10);
        await expect(assets.read({kind:'chart',path:'unknown'})).to.be.rejectedWith('returned by list_assets');
    });
    it('extracts public manifest fields, attributes, events and slots', () => {
        const api = componentApi({modules:[{exports:[{kind:'custom-element-definition',name:'luma-heat',declaration:{name:'Heat'}}],declarations:[{name:'Heat',members:[{kind:'field',name:'value',type:{text:'number'},default:'0'},{kind:'field',name:'secret',privacy:'private'},{kind:'field',name:'static',static:true}],attributes:[{name:'value'}],events:[{name:'change'}],slots:[{name:'label'}]}]}]},'luma-heat');
        expect(api.properties.map(p => p.name)).to.deep.equal(['value']); expect(api.attributes[0].name).to.equal('value'); expect(api.events[0].name).to.equal('change'); expect(api.slots[0].name).to.equal('label');
        expect(componentApi({modules:[]},'unknown')).to.equal(null);
    });
    it('keeps image bytes out of tool results and queues bounded multimodal previews', async () => {
        const tools = new AiToolContext({previewAsset:async () => ({name:'image:heating.svg',type:'image/png',content:'data:image/png;base64,AAAA'})},[], 'custom');
        const result = await tools.run('view_asset',{kind:'image',path:'heating.svg'});
        expect(result).not.to.include('base64');
        const images = tools.takeAssetImages(); expect(images.length).to.equal(1); expect(tools.takeAssetImages()).to.deep.equal([]);
        const message = userMessage('Requested image',[...images],'custom'); expect(message.content[1].type).to.equal('image_url');
        for (let i=0;i<3;i++) await tools.run('view_asset',{kind:'image',path:'heating.svg'});
        await expect(tools.run('view_asset',{kind:'image',path:'heating.svg'})).to.be.rejectedWith('Maximum four');
        const anthropic = new AiToolContext({},[],'anthropic');
        await expect(anthropic.run('view_asset',{kind:'image'})).to.be.rejectedWith('text only');
    });
    it('inserts requested vision images after complete tool-result groups and preserves them in chat history', async () => {
        const context = new AiToolContext({previewAsset:async () => ({name:'icon.svg',type:'image/png',content:'data:image/png;base64,AAAA'})},[], 'custom');
        const session = {messages:[{role:'user',content:'Use this icon'}],entries:[],pendingMessages:[]};
        const controller = new AiTurnController(session); let calls = 0;
        await controller.run({loop:runToolLoop,systemPrompt:'test',tools:[],changed(){},onAnswer(){},onToolResult(){},
            runTool:(call,args) => context.run(call.function.name,args),
            ask:async messages => {
                const images = context.takeAssetImages();
                if(images.length) messages.push(userMessage('Requested previews',images,'custom'));
                if (!calls++) return {content:'',tool_calls:[{id:'preview',type:'function',function:{name:'view_asset',arguments:'{"kind":"image","path":"icon.svg"}'}}]};
                expect(messages.at(-2).role).to.equal('tool'); expect(messages.at(-1).content[1].type).to.equal('image_url');
                return {content:'The requested icon is visible.'};
            }});
        expect(session.messages.map(message=>message.role)).to.deep.equal(['user','assistant','tool','user','assistant']);
        expect(session.messages[2].content).not.to.include('base64');
    });

});

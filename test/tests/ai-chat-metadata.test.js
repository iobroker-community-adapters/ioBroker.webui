import { expect } from 'chai';
import { runToolLoop } from '@iobroker/ai-core/build/shared/index.js';
import { reportedCost, recordResponseCost, costSummary, formatElapsed } from '../../dist/frontend/ai/AiChatMetadata.js';
import { AiTurnController } from '../../dist/frontend/ai/AiTurnController.js';

const session = () => ({messages:[{role:'user',content:'Create a screen'}],entries:[],pendingMessages:[]});
describe('AI message timing and reported costs', () => {
    it('shows no price without explicit valid money and currency, including token-only replies', () => {
        const chat = session();
        for (const response of [{usage:{input:300,output:100}}, {cost:0.03}, {cost:{amount:-1,currency:'USD'}}, {estimatedCost:{amount:NaN,currency:'USD'}}, {cost:{amount:2,currency:'$'}}]) {
            expect(reportedCost(response)).to.equal(undefined); recordResponseCost(chat,response);
        }
        expect(costSummary(chat)).to.equal('');
    });
    it('aggregates reported costs over all replies, preserves currencies and marks missing reports', () => {
        const chat = session();
        recordResponseCost(chat,{estimatedCost:{amount:0.001,currency:'usd'}});
        recordResponseCost(chat,{cost:{amount:0.002,currency:'USD'}});
        recordResponseCost(chat,{cost:0,currency:'EUR'});
        expect(chat.costs).to.deep.equal({USD:0.003,EUR:0});
        expect(costSummary(chat)).to.include('USD').and.include('EUR').and.not.include('partial');
        recordResponseCost(chat,{});
        expect(costSummary(chat)).to.include('(partial)');
        expect(costSummary(JSON.parse(JSON.stringify(chat)))).to.equal(costSummary(chat));
    });
    it('does not imply that new cost reports cover earlier saved chat replies', () => {
        const chat = session(); chat.messages.push({role:'assistant',content:'Old reply'});
        recordResponseCost(chat,{cost:{amount:0.1,currency:'USD'}});
        expect(costSummary(chat)).to.include('(partial)');
    });
    it('formats short and long durations without negative elapsed time', () => {
        expect(formatElapsed(1234)).to.equal('1.2 s'); expect(formatElapsed(125000)).to.equal('2 min 5 s'); expect(formatElapsed(-100)).to.equal('0 s');
    });
    it('times the whole tool loop and starts a separate duration when a queued message is delivered', async () => {
        const chat = session(); let now = 1000, calls = 0; const received = [];
        const controller = new AiTurnController(chat,()=>now);
        controller.add({id:'queued',mode:'queue',message:{role:'user',content:'Next task'},text:'Next task'});
        await controller.run({loop:runToolLoop,systemPrompt:'test',tools:[],changed(){},onToolResult(){},
            ask:async () => {
                calls++;
                if(calls===1) { now=1200; return {content:'',tool_calls:[{id:'tool',type:'function',function:{name:'read_document',arguments:'{}'}}]}; }
                now=calls===2 ? 3000 : 3500; return {content:'Done'};
            },runTool:async () => {now=1800;return 'read';},
            onAnswer:(answer,timing) => {if(answer.content) received.push(timing);}});
        expect(received).to.deep.equal([{timestamp:3000,durationMs:2000},{timestamp:3500,durationMs:500}]);
    });
});

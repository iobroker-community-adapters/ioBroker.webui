const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { tests } = require('@iobroker/testing');

// The provider is a local fixture; no paid API or user installation is contacted.
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('AI system settings and provider transport', getHarness => {
            let harness, server, baseUrl;
            const received = [];
            before(async function () {
                this.timeout(60000);
                harness = getHarness();
                server = http.createServer(async (request, response) => {
                    let body = '';
                    for await (const chunk of request) body += chunk;
                    response.setHeader('Content-Type', 'application/json');
                    if (request.url.endsWith('/models')) response.end(JSON.stringify({ data: [{ id: 'fixture-vision' }] }));
                    else {
                        received.push(JSON.parse(body));
                        response.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'Fixture answer' }, finish_reason: 'stop' }] }));
                    }
                });
                await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
                baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
                await harness.objects.setObjectAsync('system.ai', { _id: 'system.ai', type: 'config', common: { name: 'AI fixture' }, native: { provider: 'custom', baseUrl, model: 'fixture-vision' } });
                await harness.startAdapterAndWait();
                await harness.enableSendTo();
            });
            after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });
            const send = (command, message = {}) => new Promise(resolve => harness.sendTo('webui.0', command, message, resolve));
            it('discovers the system provider and its models without exposing credentials', async () => {
                const providers = await send('ai:providers');
                assert.deepEqual(providers.providers, [{ provider: 'custom', baseUrl }]);
                const models = await send('ai:models', { provider: 'custom' });
                assert.deepEqual(models.models, ['fixture-vision']);
            });
            it('forwards screenshots and tool definitions to the configured endpoint', async () => {
                const messages = [{ role: 'user', content: [{ type: 'text', text: 'Design this' }, { type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }] }];
                const tools = [{ type: 'function', function: { name: 'read_document', parameters: { type: 'object' } } }];
                const answer = await send('ai:chat', { provider: 'custom', model: 'fixture-vision', messages, tools });
                assert.equal(answer.content, 'Fixture answer');
                assert.deepEqual(received[0].messages, messages);
                assert.deepEqual(received[0].tools, tools);
            });
            it('rejects an unknown provider without contacting the endpoint', async () => {
                const answer = await send('ai:chat', { provider: 'unknown', model: 'fixture-vision', messages: [{ role: 'user', content: 'hello' }] });
                assert.ok(answer.error);
                assert.equal(received.length, 1);
            });
        });
    }
});

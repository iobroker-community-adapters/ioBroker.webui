import type { AiAttachment } from './AiTypes.js';
import type { OpenAIMessage } from '@iobroker/ai-core/build/shared/types.js';

export const attachmentLimit = 10 * 1024 * 1024;
export async function readAttachment(file: File): Promise<AiAttachment> {
    if (file.size > attachmentLimit) throw new Error(`${file.name}: maximum attachment size is 10 MB.`);
    if (['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
        const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
        return { name: file.name, type: file.type, content };
    }
    if (file.type.startsWith('text/') || /\.(txt|md|html?|css|js|ts|json|xml|svg|csv|screen|control|log)$/i.test(file.name)) {
        return { name: file.name, type: 'text/plain', content: await file.text() };
    }
    throw new Error(`${file.name}: attach a text/source file or PNG, JPEG, WebP or GIF image.`);
}

export function userMessage(prompt: string, attachments: AiAttachment[], provider: string): OpenAIMessage {
    const images = attachments.filter(x => x.type.startsWith('image/'));
    // ai-core 0.0.6 forwards OpenAI multimodal content, but its Anthropic translator only handles text.
    if (images.length && provider === 'anthropic') throw new Error('Screenshot attachments require a vision model through OpenAI, Gemini, OpenRouter or a compatible endpoint. The current ioBroker Anthropic bridge supports text only.');
    const text = prompt + attachments.filter(x => !x.type.startsWith('image/')).map(x => `\n\nAttached file: ${x.name}\n${x.content}`).join('');
    if (!images.length) return { role: 'user', content: text };
    const content = [{ type: 'text', text }, ...images.map(x => ({ type: 'image_url', image_url: { url: x.content } }))];
    // The published ai-core message type predates multimodal content. OpenAI-compatible providers accept this shape.
    return { role: 'user', content: content as unknown as string };
}

interface SpeechResultEvent { results: ArrayLike<ArrayLike<{ transcript: string }>>; }
interface SpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: (event: SpeechResultEvent) => void;
    onerror: (event: { error: string }) => void;
    onend: () => void;
    start(): void;
    stop(): void;
    abort(): void;
}
type RecognitionConstructor = new () => SpeechRecognition;
const browserRecognition = () => {
    const browser = globalThis as typeof globalThis & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
};

/** User-started browser dictation. Transcripts enter the draft; they are never submitted automatically. */
export class AiSpeechInput {
    private recognition: SpeechRecognition;
    private generation = 0;
    listening = false;
    constructor(private readonly constructorOf = browserRecognition) { }
    get supported() { return !!this.constructorOf(); }
    start(language: string, callbacks: { text: (text: string) => void; changed: () => void; error: (message: string) => void }) {
        this.cancel();
        const Constructor = this.constructorOf();
        if (!Constructor) { callbacks.error('Speech input is not supported by this browser. Try a browser with speech recognition enabled.'); return; }
        const generation = ++this.generation;
        const recognition = this.recognition = new Constructor();
        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = event => {
            if (generation !== this.generation) return;
            callbacks.text(Array.from(event.results).map(result => result[0]?.transcript ?? '').join(' ').trim());
        };
        recognition.onerror = event => {
            if (generation !== this.generation) return;
            this.listening = false; callbacks.changed();
            callbacks.error(event.error === 'not-allowed' || event.error === 'service-not-allowed'
                ? 'Microphone access was denied. Allow speech input in your browser to dictate.'
                : `Speech input: ${event.error}. Your typed draft is unchanged.`);
        };
        recognition.onend = () => { if (generation === this.generation) { this.listening = false; callbacks.changed(); } };
        try { recognition.start(); this.listening = true; callbacks.changed(); }
        catch (error) { this.listening = false; callbacks.changed(); callbacks.error(String(error)); }
    }
    stop() { this.recognition?.stop(); }
    cancel() { ++this.generation; this.listening = false; this.recognition?.abort(); this.recognition = null; }
}

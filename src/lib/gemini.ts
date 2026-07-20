import { AppSettings, Message } from './types';

export class RepetitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepetitionError';
  }
}

export class APIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export async function* streamChat(
  messages: Message[],
  settings: AppSettings,
  abortSignal: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        parts: m.parts
      })),
      systemInstruction: settings.systemInstruction,
      temperature: settings.temperature,
      topP: settings.topP,
      maxOutputTokens: settings.maxOutputTokens,
      model: settings.model
    }),
    signal: abortSignal
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API Error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') {
          return;
        }
        try {
          const data = JSON.parse(dataStr);
          if (data.error === 'repetition_loop') {
            throw new RepetitionError(data.text || "\n\n[Generation stopped: repetition loop detected.]");
          }
          if (data.error) {
            throw new APIError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
          }
          if (data.text) {
            fullText += data.text;
            
            // Client-side watchdog
            if (isRepetitive(fullText)) {
               throw new RepetitionError("\n\n[Generation stopped: repetition loop detected.]");
            }
            
            yield data.text;
          }
        } catch (e) {
          if (e instanceof RepetitionError || e instanceof APIError) throw e;
          // Ignore parse errors on partial chunks
        }
      }
    }
  }
}

function isRepetitive(text: string): boolean {
  // Emoji Density Check
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
  const emojis = text.match(emojiRegex);
  if (emojis && text.length > 50 && (emojis.length / text.length > 0.15)) {
    return true;
  }
  
  // N-gram Check
  const words = text.trim().split(/\s+/);
  if (words.length >= 15) {
    const n = 5;
    const lastN = words.slice(-n).join(' ');
    const prevN = words.slice(-2*n, -n).join(' ');
    const prevPrevN = words.slice(-3*n, -2*n).join(' ');
    if (lastN === prevN && prevN === prevPrevN && lastN.length > 5) {
      return true;
    }
  }
  return false;
}

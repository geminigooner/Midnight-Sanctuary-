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
  let fullSystemInstruction = settings.systemInstruction || '';
  let identityParts = [];

  if (settings.aboutMe?.trim()) {
    identityParts.push(`## About Me:\n${settings.aboutMe.trim()}`);
  }
  
  if (settings.conversationPreferences?.trim()) {
    identityParts.push(`## Conversation Preferences:\n${settings.conversationPreferences.trim()}`);
  }

  if (settings.memoriesEnabled && settings.memories && settings.memories.length > 0) {
    const memoryText = settings.memories.map(m => `- ${m.content}`).join('\n');
    identityParts.push(`## Saved Memories:\n${memoryText}`);
  }

  if (identityParts.length > 0) {
    const identityContext = identityParts.join('\n\n');
    fullSystemInstruction = fullSystemInstruction 
      ? `${identityContext}\n\n---\n\n${fullSystemInstruction}`
      : identityContext;
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        parts: m.parts
      })),
      systemInstruction: fullSystemInstruction,
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

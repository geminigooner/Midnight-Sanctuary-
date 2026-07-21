import { AppSettings, Message, Gift } from './types';

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

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export type ChatStreamEvent =
  | { type: 'thought'; text: string }
  | { type: 'text'; text: string }
  | { type: 'gift'; content: string; gift_type: string; reason?: string }
  | { type: 'memory'; content: string; why_it_matters?: string }
  | { type: 'eventLog'; description: string };

export async function* streamChat(
  messages: Message[],
  settings: AppSettings,
  gifts: Gift[],
  abortSignal: AbortSignal
): AsyncGenerator<ChatStreamEvent, void, unknown> {
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

  if (gifts && gifts.length > 0) {
    const giftsText = gifts.map(g => `- [${new Date(g.timestamp || Date.now()).toISOString()}] From ${g.from === 'user' ? 'User' : 'Gemma'}: ${g.content} (Type: ${g.gift_type})${g.reason ? ` - ${g.reason}` : ''}`).join('\n');
    identityParts.push(`## Gifts Archive (Given and Received):\n${giftsText}`);
  }

  if (settings.eventLog && settings.eventLog.length > 0) {
    // Only include the most recent 50 events to avoid flooding the context, sorted chronologically
    const recentEvents = [...settings.eventLog].sort((a, b) => a.timestamp - b.timestamp).slice(-50);
    const eventText = recentEvents.map(e => `- [${new Date(e.timestamp).toISOString()}] ${e.description}`).join('\n');
    identityParts.push(`## Relationship & Interaction Log (Recent Events):\n${eventText}`);
  }

  if (identityParts.length > 0) {
    const identityContext = identityParts.join('\n\n');
    fullSystemInstruction = fullSystemInstruction 
      ? `${identityContext}\n\n---\n\n${fullSystemInstruction}`
      : identityContext;
  }

  const serializedMessages = messages
    .map(m => ({
      role: m.role,
      parts: (m.parts || []).filter(p => (p.text && p.text.trim().length > 0) || p.thought || p.inlineData || p.functionCall || p.functionResponse)
    }))
    .filter(m => m.parts.length > 0)
    .reduce((acc, current) => {
      if (acc.length > 0 && acc[acc.length - 1].role === current.role) {
        acc[acc.length - 1].parts.push(...current.parts);
      } else {
        acc.push(current);
      }
      return acc;
    }, [] as any[]);

  console.log("[Diagnostics] Sanitized API History:", JSON.stringify(serializedMessages, null, 2));

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: serializedMessages,
      systemInstruction: fullSystemInstruction,
      temperature: settings.temperature,
      topP: settings.topP,
      maxOutputTokens: settings.maxOutputTokens,
      model: settings.model
    }),
    signal: abortSignal
  });

  console.log(`[Diagnostics] HTTP Status: ${response.status}`);
  console.log(`[Diagnostics] Content-Type: ${response.headers.get('Content-Type')}`);

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
          if (data.type === 'rate_limit') {
            throw new RateLimitError(data.message || "Rate limit exceeded");
          }
          if (data.error) {
            throw new APIError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
          }
          if (data.type === 'gift' || data.type === 'memory' || data.type === 'eventLog' || data.type === 'thought') {
            yield data as ChatStreamEvent;
          } else if (data.text) {
            fullText += data.text;
            yield { type: 'text', text: data.text };
          }
        } catch (e) {
          if (e instanceof RepetitionError || e instanceof APIError || e instanceof RateLimitError) throw e;
          // Ignore parse errors on partial chunks
        }
      }
    }
  }
}

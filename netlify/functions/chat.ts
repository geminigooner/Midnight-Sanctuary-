import { createChatStream } from '../../src/backend/chatHandler';

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }), { status: 500 });
  }

  try {
    const reqBody = await req.json();
    const stream = createChatStream(reqBody, apiKey);
    
    // Fallback to JSON if streaming isn't natively supported on this Netlify tier
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const events: any[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            events.push(JSON.parse(line.substring(6)));
          } catch (e) {
            // ignore parse error
          }
        }
      }
    }

    return new Response(JSON.stringify({ events }), {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown API Error' }), { status: 500 });
  }
};

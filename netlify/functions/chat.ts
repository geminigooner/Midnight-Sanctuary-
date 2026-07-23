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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown API Error' }), { status: 500 });
  }
};

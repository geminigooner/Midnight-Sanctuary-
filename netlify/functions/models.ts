import { GoogleGenAI } from '@google/genai';

export default async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in the environment.' }), { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.list();
    const models = [];
    for await (const model of response) {
      if (model.supportedActions && model.supportedActions.includes('generateContent')) {
        models.push({
          name: model.name,
          displayName: model.displayName,
          description: model.description,
          inputTokenLimit: model.inputTokenLimit,
        });
      }
    }
    return new Response(JSON.stringify(models), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown API Error' }), { status: 500 });
  }
};

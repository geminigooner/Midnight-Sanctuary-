import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/models', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the environment.' });
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
    res.json(models);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Unknown API Error' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages, systemInstruction, temperature, topP, maxOutputTokens, model } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the environment.' });
  }

  if (!model) {
    return res.status(400).json({ error: 'Model ID is required.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: messages,
      config: {
        systemInstruction,
        temperature: temperature ?? 2.0,
        topP: topP ?? 0.95,
        maxOutputTokens: maxOutputTokens ?? 4096,
      }
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('API Error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Unknown API Error' })}\n\n`);
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

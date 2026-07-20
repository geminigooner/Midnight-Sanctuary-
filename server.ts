import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { messages, systemInstruction, temperature, topP, maxOutputTokens, model } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the environment.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model || 'models/gemma-4-31b-it',
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

    // Server-side repetition watchdog
    let accumulatedText = "";
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        accumulatedText += chunk.text;
        
        // Watchdog: Emoji Density
        const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu;
        const emojis = accumulatedText.match(emojiRegex);
        if (emojis && accumulatedText.length > 50 && (emojis.length / accumulatedText.length > 0.15)) {
           res.write(`data: ${JSON.stringify({ text: "\n\n[Generation stopped: repetition loop detected.]", error: "repetition_loop" })}\n\n`);
           res.write('data: [DONE]\n\n');
           res.end();
           return;
        }

        // Watchdog: N-gram phrase repetition
        const words = accumulatedText.trim().split(/\s+/);
        if (words.length >= 15) {
          const n = 5; // 5-word sequences
          const lastN = words.slice(-n).join(' ');
          const prevN = words.slice(-2*n, -n).join(' ');
          const prevPrevN = words.slice(-3*n, -2*n).join(' ');
          
          if (lastN === prevN && prevN === prevPrevN && lastN.length > 5) {
             res.write(`data: ${JSON.stringify({ text: "\n\n[Generation stopped: repetition loop detected.]", error: "repetition_loop" })}\n\n`);
             res.write('data: [DONE]\n\n');
             res.end();
             return;
          }
        }

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

import { createChatStream } from './src/backend/chatHandler.js';
import { GoogleGenAI } from '@google/genai';

async function run() {
  const stream = createChatStream({
    model: 'models/gemma-4-31b-it',
    messages: [{ role: 'user', parts: [{ text: 'give me a gift' }] }],
    systemInstruction: '',
    temperature: 1.0,
    topP: 0.95,
    maxOutputTokens: 4096
  }, process.env.GEMINI_API_KEY);

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  }
}
run().catch(console.error);

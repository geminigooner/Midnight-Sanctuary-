import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const msgs = [
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Thinking...', thought: true }, { text: 'Hi' }] },
      { role: 'user', parts: [{ text: 'How are you?' }] }
    ];
    const responseStream = await ai.models.generateContentStream({
      model: 'models/gemma-4-31b-it',
      contents: msgs,
    });
    for await (const chunk of responseStream) {
       console.log(chunk.text);
    }
  } catch (e) {
    console.error("SDK ERROR:", e.message);
  }
})();

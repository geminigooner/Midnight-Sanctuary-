import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const msgs = [
      { role: 'user', parts: [{ text: 'Think about a color.' }] },
      { role: 'model', parts: [{ text: 'I am thinking.', thought: true }, { text: 'I picked blue.' }] },
      { role: 'user', parts: [{ text: 'What color did you pick?' }] }
    ];
    const responseStream = await ai.models.generateContentStream({
      model: 'models/gemma-4-31b-it',
      contents: msgs,
    });
    for await (const chunk of responseStream) {
       console.log(chunk.text);
    }
  } catch (e) {
    console.error(e);
  }
})();

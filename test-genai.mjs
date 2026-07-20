import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const msgs = [
      { role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } }] },
      { role: 'model', parts: [{ text: 'It is a red dot.' }] },
      { role: 'user', parts: [{ text: 'Why is it red?' }] }
    ];
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: msgs
    });
    for await (const chunk of responseStream) {
       console.log(chunk.text);
    }
  } catch (e) {
    console.error(e);
  }
})();

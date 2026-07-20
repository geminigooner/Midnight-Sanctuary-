import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const msgs = [
      { role: 'user', parts: [{ text: 'Think about a color.' }] }
    ];
    const responseStream = await ai.models.generateContentStream({
      model: 'models/gemma-4-31b-it', // wait, gemma-4 doesn't support thinking on the API yet? Or does it? Let's check
      contents: msgs,
      config: {
        thinkingConfig: {
           thinkingLevel: 'HIGH', // or maybe something else? Let's try it.
           includeThoughts: true
        }
      }
    });
    for await (const chunk of responseStream) {
       console.log("Chunk parts:", JSON.stringify(chunk.candidates[0].content.parts, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
})();

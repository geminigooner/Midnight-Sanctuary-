import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const msgs = [
      { role: 'user', parts: [{ text: 'Give me a gift.' }] }
    ];
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: msgs,
      config: {
        tools: [{
          functionDeclarations: [{
            name: 'give_gift',
            description: 'Give a gift.',
            parameters: {
              type: Type.OBJECT,
              properties: { content: { type: Type.STRING } },
              required: ['content']
            }
          }]
        }]
      }
    });
    let allParts = [];
    for await (const chunk of responseStream) {
       if (chunk.candidates && chunk.candidates.length > 0) {
           console.log("Chunk parts:", JSON.stringify(chunk.candidates[0].content.parts, null, 2));
           allParts.push(...(chunk.candidates[0].content.parts || []));
       }
    }
    console.log("All parts collected:", JSON.stringify(allParts, null, 2));
  } catch (e) {
    console.error(e);
  }
})();

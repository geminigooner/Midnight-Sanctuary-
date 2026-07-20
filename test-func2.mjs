import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
(async () => {
  try {
    const msgs = [
      { role: 'user', parts: [{ text: 'Give me a gift.' }] }
    ];
    let modelParts = [
      {
        "functionCall": {
          "name": "give_gift",
          "args": {
            "content": "A gift"
          }
        }
      }
    ];
    let userParts = [
      {
         "functionResponse": {
           "name": "give_gift",
           "response": { "result": "ok" }
         }
      }
    ];
    
    msgs.push({ role: 'model', parts: modelParts });
    msgs.push({ role: 'user', parts: userParts });
    
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
    for await (const chunk of responseStream) {
       if (chunk.candidates && chunk.candidates.length > 0) {
           console.log("Chunk parts:", JSON.stringify(chunk.candidates[0].content.parts, null, 2));
       }
    }
  } catch (e) {
    console.error(e);
  }
})();
